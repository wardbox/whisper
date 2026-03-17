import {
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  RiotApiError,
  ServiceUnavailableError,
} from './errors.js';
import { classify429 } from './rate-limiter.js';
import type { ApiKeyProvider, ApiResponse } from './types.js';

/**
 * Build a full Riot API URL from a routing value and path.
 *
 * @param route - Routing value (e.g., 'na1', 'americas')
 * @param path - API path (e.g., '/lol/summoner/v4/summoners/by-puuid/xyz')
 * @returns Full URL string
 *
 * @example
 * ```typescript
 * buildUrl('na1', '/lol/summoner/v4/summoners/by-puuid/xyz');
 * // 'https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/xyz'
 * ```
 */
export function buildUrl(route: string, path: string): string {
  return `https://${route}.api.riotgames.com${path}`;
}

/**
 * A normalized key provider with caching and invalidation support.
 */
export interface KeyProvider {
  /** Get the current API key. Caches the result for async providers. */
  getKey(): Promise<string>;
  /** Invalidate the cached key, forcing re-fetch on next getKey() call. */
  invalidate(): void;
}

/**
 * Normalize an API key input (string or async function) into a KeyProvider.
 *
 * For string input, always returns the same string.
 * For async function input, caches the resolved value. invalidate() clears
 * the cache, and concurrent getKey() calls share the same pending promise
 * to prevent thundering herd on key rotation.
 *
 * @param input - Static API key string or async key provider function
 * @returns Normalized KeyProvider with getKey() and invalidate()
 *
 * @example
 * ```typescript
 * // Static key
 * const provider = normalizeKeyProvider('RGAPI-xxx');
 * const key = await provider.getKey(); // 'RGAPI-xxx'
 *
 * // Rotating key
 * const provider = normalizeKeyProvider(async () => fetchKeyFromVault());
 * const key = await provider.getKey(); // cached after first call
 * provider.invalidate(); // next getKey() re-fetches
 * ```
 */
export function normalizeKeyProvider(input: ApiKeyProvider): KeyProvider {
  if (typeof input === 'string') {
    return {
      getKey: () => Promise.resolve(input),
      invalidate: () => {
        // No-op for static keys
      },
    };
  }

  let cached: string | undefined;
  let pending: Promise<string> | null = null;

  return {
    async getKey(): Promise<string> {
      if (cached !== undefined) return cached;
      if (pending) return pending;

      pending = input().then((key) => {
        cached = key;
        pending = null;
        return key;
      });

      return pending;
    },
    invalidate(): void {
      cached = undefined;
      pending = null;
    },
  };
}

/** Options for HTTP client requests */
interface HttpRequestOptions {
  /** HTTP method (defaults to 'GET') */
  method?: string | undefined;
  /** Request body for POST/PUT */
  body?: string | undefined;
  /** Additional request headers */
  headers?: Record<string, string> | undefined;
}

/** HTTP client returned by createHttpClient */
export interface HttpClient {
  /** Make an HTTP request to the Riot API */
  request<T>(
    route: string,
    path: string,
    methodId: string,
    options?: HttpRequestOptions,
  ): Promise<ApiResponse<T>>;
}

/**
 * Extract a Riot error message from a response body.
 * Riot error responses typically have the shape: { status: { message: string } }
 */
function extractRiotMessage(body: unknown): string | undefined {
  if (
    body &&
    typeof body === 'object' &&
    'status' in body &&
    body.status &&
    typeof body.status === 'object' &&
    'message' in body.status &&
    typeof body.status.message === 'string'
  ) {
    return body.status.message;
  }
  return undefined;
}

/**
 * Convert a Response's headers into a plain Record<string, string>.
 */
function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

/**
 * Map a non-2xx response to the appropriate error class.
 */
function mapError(
  status: number,
  statusText: string,
  url: string,
  method: string,
  headers: Record<string, string>,
  riotMessage: string | undefined,
): RiotApiError {
  const opts = { status, statusText, url, method, headers, riotMessage };

  switch (status) {
    case 429: {
      const retryAfterStr = headers['retry-after'];
      const retryAfter = retryAfterStr ? Number(retryAfterStr) : undefined;
      const limitType = classify429(headers);
      return new RateLimitError({ ...opts, retryAfter, limitType });
    }
    case 404:
      return new NotFoundError(opts);
    case 401:
    case 403:
      return new ForbiddenError(opts);
    case 503:
      return new ServiceUnavailableError(opts);
    default:
      return new RiotApiError(opts);
  }
}

/**
 * Create a low-level HTTP client for the Riot API.
 *
 * Handles URL construction, API key header injection, error mapping,
 * and automatic key rotation on 401/403 responses.
 *
 * @param keyProvider - Normalized key provider from normalizeKeyProvider()
 * @returns HTTP client with a request() method
 *
 * @example
 * ```typescript
 * const provider = normalizeKeyProvider('RGAPI-xxx');
 * const http = createHttpClient(provider);
 * const response = await http.request<SummonerDTO>('na1', '/lol/summoner/v4/summoners/by-puuid/abc', 'summoner-v4.getByPuuid');
 * ```
 */
export function createHttpClient(keyProvider: KeyProvider): HttpClient {
  async function doFetch<T>(
    route: string,
    path: string,
    methodId: string,
    options?: HttpRequestOptions,
  ): Promise<ApiResponse<T>> {
    const apiKey = await keyProvider.getKey();
    const url = buildUrl(route, path);
    const method = options?.method ?? 'GET';

    const requestHeaders: Record<string, string> = {
      'X-Riot-Token': apiKey,
      ...options?.headers,
    };

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: options?.body ?? null,
    });

    const responseHeaders = headersToRecord(response.headers);

    if (response.ok) {
      const data = (await response.json()) as T;
      return { data, status: response.status, headers: responseHeaders };
    }

    // Parse error body for riotMessage
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    const riotMessage = extractRiotMessage(body);

    throw mapError(response.status, response.statusText, url, method, responseHeaders, riotMessage);
  }

  return {
    async request<T>(
      route: string,
      path: string,
      methodId: string,
      options?: HttpRequestOptions,
    ): Promise<ApiResponse<T>> {
      try {
        return await doFetch<T>(route, path, methodId, options);
      } catch (err) {
        // On 401/403: invalidate key, retry once with fresh key
        if (err instanceof ForbiddenError) {
          keyProvider.invalidate();
          try {
            return await doFetch<T>(route, path, methodId, options);
          } catch (retryErr) {
            throw retryErr;
          }
        }
        throw err;
      }
    },
  };
}
