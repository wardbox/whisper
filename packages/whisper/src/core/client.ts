import type { PlatformRoute } from '../types/platform.js';
import type { RegionalRoute } from '../types/regional.js';
import { buildCacheKey, MemoryCache, resolveTtl } from './cache.js';
import { RateLimitError } from './errors.js';
import type { KeyProvider } from './http.js';
import { buildUrl, createHttpClient, normalizeKeyProvider } from './http.js';
import { executePipeline } from './middleware.js';
import { RateLimiter } from './rate-limiter.js';
import type {
  ApiResponse,
  CacheAdapter,
  CacheTtlConfig,
  ClientConfig,
  Middleware,
  RequestContext,
} from './types.js';

/** Options for individual API requests */
interface RequestOptions {
  /** HTTP method (defaults to 'GET') */
  method?: string | undefined;
  /** Request body for POST/PUT */
  body?: string | undefined;
  /** Additional request headers */
  headers?: Record<string, string> | undefined;
  /** Query parameters */
  params?: Record<string, string> | undefined;
}

/**
 * The unified Whisper client interface.
 *
 * Provides a single `request()` method that integrates the full pipeline:
 * middleware, cache, rate limiter, and HTTP fetch.
 *
 * @example
 * ```typescript
 * const client = createClient({ apiKey: 'RGAPI-xxx' });
 * const summoner = await client.request<SummonerDTO>(
 *   'na1',
 *   '/lol/summoner/v4/summoners/by-puuid/abc',
 *   'summoner-v4.getByPuuid',
 * );
 * ```
 */
export interface WhisperClient {
  /** Make an API request with full pipeline: middleware -> cache check -> rate limit -> fetch -> cache store -> middleware response */
  request<T>(
    route: PlatformRoute | RegionalRoute,
    path: string,
    methodId: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>>;
}

/** Maximum number of 429 retries */
const MAX_429_RETRIES = 3;

/**
 * Create a Whisper client that composes all core subsystems.
 *
 * Integrates the HTTP client, rate limiter, cache, and middleware pipeline
 * into a unified request method. All subsystems are optional and can be
 * disabled individually.
 *
 * @param config - Client configuration options
 * @returns A WhisperClient with a request() method
 *
 * @example
 * ```typescript
 * // Minimal setup
 * const client = createClient({ apiKey: 'RGAPI-xxx' });
 *
 * // Full configuration
 * const client = createClient({
 *   apiKey: async () => fetchKeyFromVault(),
 *   cache: new RedisCache(),
 *   cacheTtl: { summoner: 3600, match: 60, spectator: 0, default: 300 },
 *   rateLimiter: { throwOnLimit: true },
 *   middleware: [loggingMiddleware, metricsMiddleware],
 * });
 *
 * // Disable caching and rate limiting
 * const client = createClient({
 *   apiKey: 'RGAPI-xxx',
 *   cache: false,
 *   rateLimiter: false,
 * });
 * ```
 */
export function createClient(config: ClientConfig): WhisperClient {
  const keyProvider: KeyProvider = normalizeKeyProvider(config.apiKey);
  const http = createHttpClient(keyProvider);

  // Rate limiter: false to disable, object for config, undefined for defaults
  const rateLimiter =
    config.rateLimiter !== false
      ? new RateLimiter(typeof config.rateLimiter === 'object' ? config.rateLimiter : undefined)
      : null;

  // Cache: false to disable, CacheAdapter to use custom, undefined for default MemoryCache
  let cache: CacheAdapter | null;
  if (config.cache === false) {
    cache = null;
  } else if (config.cache) {
    cache = config.cache;
  } else {
    cache = new MemoryCache();
  }

  const middleware: Middleware[] = config.middleware ?? [];
  const cacheTtl: CacheTtlConfig = config.cacheTtl ?? { default: 300 };

  return {
    async request<T>(
      route: PlatformRoute | RegionalRoute,
      path: string,
      methodId: string,
      options?: RequestOptions,
    ): Promise<ApiResponse<T>> {
      const method = options?.method ?? 'GET';

      // 1. Check cache (only for GET requests)
      let cacheKey: string | undefined;
      if (cache && method === 'GET') {
        const apiKey = await keyProvider.getKey();
        cacheKey = buildCacheKey(apiKey, route, path, options?.params);
        const cached = await cache.get<ApiResponse<T>>(cacheKey);
        if (cached) return cached;
      }

      // 2. Build full URL with query params
      const paramStr = options?.params ? `?${new URLSearchParams(options.params).toString()}` : '';
      const url = buildUrl(route, path) + paramStr;
      const context: RequestContext = {
        url,
        method,
        headers: { ...options?.headers },
        body: options?.body,
        route,
        methodId,
      };

      // 3. Execute through middleware pipeline
      const response = await executePipeline(middleware, context, async (ctx) => {
        // Rate limit acquire
        if (rateLimiter) {
          await rateLimiter.acquire(route, methodId);
        }

        // Execute with 429 retry loop
        let lastError: RateLimitError | undefined;
        for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
          if (attempt > 0 && lastError) {
            if (!rateLimiter) break;
            await rateLimiter.handle429(route, methodId, lastError.headers, attempt - 1);
          }

          try {
            const result = await http.request<T>(route, path + paramStr, methodId, {
              method: ctx.method,
              body: ctx.body,
              headers: ctx.headers,
            });

            // Update rate limiter with response headers
            if (rateLimiter) {
              rateLimiter.update(route, methodId, result.headers);
            }

            return result;
          } catch (err) {
            if (err instanceof RateLimitError && rateLimiter) {
              lastError = err;
              continue;
            }
            throw err;
          }
        }

        // Exhausted retries
        throw lastError!;
      });

      // 4. Store in cache (GET only)
      if (cache && cacheKey && method === 'GET') {
        const ttl = resolveTtl(path, cacheTtl);
        if (ttl > 0) {
          await cache.set(cacheKey, response, ttl);
        }
      }

      return response as ApiResponse<T>;
    },
  };
}
