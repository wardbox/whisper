import { RateLimitError } from './errors.js';
import type { RateLimiterConfig, RequestContext } from './types.js';

/** A single token bucket for one rate limit window */
interface RateLimitBucket {
  limit: number;
  windowMs: number;
  remaining: number;
  resetAt: number;
}

/** State for a single rate limit scope (app:region or method:region:methodId) */
interface ScopeState {
  buckets: RateLimitBucket[];
  queue: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }>;
}

/**
 * Parse a Riot rate limit header into window descriptors.
 *
 * @example
 * ```typescript
 * parseRateLimitHeader('100:1,1000:10,60000:600');
 * // [{ limit: 100, windowSeconds: 1 }, { limit: 1000, windowSeconds: 10 }, { limit: 60000, windowSeconds: 600 }]
 * ```
 *
 * @param header - Rate limit header value (e.g., '100:1,1000:10,60000:600')
 * @returns Array of limit/window pairs
 */
export function parseRateLimitHeader(
  header: string,
): Array<{ limit: number; windowSeconds: number }> {
  return header.split(',').map((pair) => {
    const parts = pair.split(':');
    return { limit: Number(parts[0]), windowSeconds: Number(parts[1]) };
  });
}

/**
 * Sync token buckets from Riot rate limit and count headers.
 *
 * @example
 * ```typescript
 * syncBuckets('100:1,1000:10', '5:1,50:10');
 * // [{ limit: 100, windowMs: 1000, remaining: 95, resetAt: ... }, ...]
 * ```
 *
 * @param limitHeader - The rate limit header (e.g., '100:1,1000:10')
 * @param countHeader - The rate limit count header (e.g., '5:1,50:10')
 * @returns Array of synced token buckets
 */
export function syncBuckets(
  limitHeader: string,
  countHeader: string,
): RateLimitBucket[] {
  const limits = parseRateLimitHeader(limitHeader);
  const counts = parseRateLimitHeader(countHeader);

  return limits.map(({ limit, windowSeconds }, i) => {
    const count = counts[i]?.limit ?? 0;
    return {
      limit,
      windowMs: windowSeconds * 1000,
      remaining: limit - count,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  });
}

/**
 * Classify a 429 response by its rate limit type.
 *
 * - `application`: App-level rate limit (has `X-Rate-Limit-Type: application`)
 * - `method`: Method-level rate limit (has `X-Rate-Limit-Type: method`)
 * - `service`: Service-level rate limit (no `X-Rate-Limit-Type` header)
 *
 * @param headers - Response headers (lowercase keys)
 * @returns The rate limit type
 */
export function classify429(
  headers: Record<string, string>,
): 'application' | 'method' | 'service' {
  const type = headers['x-rate-limit-type'];
  if (type === 'application') return 'application';
  if (type === 'method') return 'method';
  return 'service';
}

/**
 * Calculate the retry delay for a 429 response.
 *
 * - App/method 429s use the `Retry-After` header (seconds).
 * - Service 429s use exponential backoff with jitter, capped at 30s.
 *
 * @param headers - Response headers (lowercase keys)
 * @param type - The classified 429 type
 * @param attempt - The retry attempt number (0-based)
 * @returns Delay in milliseconds
 */
export function getRetryDelay(
  headers: Record<string, string>,
  type: 'application' | 'method' | 'service',
  attempt: number,
): number {
  if (type === 'service') {
    const base = Math.min(1000 * 2 ** attempt, 30000);
    const jitter = Math.random() * base * 0.1;
    return base + jitter;
  }
  const retryAfter = headers['retry-after'];
  return retryAfter ? Number(retryAfter) * 1000 : 5000;
}

/**
 * Check if all buckets in a scope have remaining tokens.
 * Also resets expired buckets (window has elapsed).
 */
function canProceed(scope: ScopeState): boolean {
  const now = Date.now();
  for (const bucket of scope.buckets) {
    if (now >= bucket.resetAt) {
      bucket.remaining = bucket.limit;
      bucket.resetAt = now + bucket.windowMs;
    }
    if (bucket.remaining <= 0) {
      return false;
    }
  }
  return true;
}

/**
 * Get the earliest reset time across all buckets in a scope.
 */
function getEarliestReset(scope: ScopeState): number {
  let earliest = Infinity;
  for (const bucket of scope.buckets) {
    if (bucket.remaining <= 0 && bucket.resetAt < earliest) {
      earliest = bucket.resetAt;
    }
  }
  return earliest;
}

/**
 * Proactive rate limiter for the Riot Games API.
 *
 * Parses `X-App-Rate-Limit` and `X-Method-Rate-Limit` response headers
 * into multi-window token buckets, and proactively queues requests before
 * limits are reached. Handles three distinct 429 types (application, method,
 * service) with appropriate recovery strategies.
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter({ throwOnLimit: false });
 *
 * // Before making a request:
 * await limiter.acquire('na1', 'summoner-v4');
 *
 * // After receiving a response:
 * limiter.update('na1', 'summoner-v4', responseHeaders);
 *
 * // On 429 response:
 * await limiter.handle429('na1', 'summoner-v4', responseHeaders, attempt);
 * ```
 */
export class RateLimiter {
  private readonly scopes: Map<string, ScopeState>;
  private readonly config: {
    throwOnLimit: boolean;
    maxQueueSize: number;
    requestTimeout: number;
    onRateLimit?: ((scope: string, retryAfter: number) => void) | undefined;
    onRetry?:
      | ((request: RequestContext, attempt: number) => void)
      | undefined;
  };

  constructor(config?: RateLimiterConfig | undefined) {
    this.scopes = new Map();
    this.config = {
      throwOnLimit: config?.throwOnLimit ?? false,
      maxQueueSize: config?.maxQueueSize ?? 100,
      requestTimeout: config?.requestTimeout ?? 30000,
      onRateLimit: config?.onRateLimit,
      onRetry: config?.onRetry,
    };
  }

  /**
   * Acquire permission to make a request. Resolves when safe to proceed.
   *
   * On cold start (no prior headers for the scope), the request passes
   * through immediately. When buckets are exhausted, the request is queued
   * until tokens become available.
   *
   * @param route - The routing value (e.g., 'na1', 'americas')
   * @param methodId - The API method identifier (e.g., 'summoner-v4')
   * @throws {RateLimitError} When `throwOnLimit` is true and request would be blocked
   * @throws {RateLimitError} When queue size exceeds `maxQueueSize`
   * @throws {RateLimitError} When request times out in queue
   */
  async acquire(route: string, methodId: string): Promise<void> {
    const appKey = `app:${route}`;
    const methodKey = `method:${route}:${methodId}`;

    const appScope = this.scopes.get(appKey);
    const methodScope = this.scopes.get(methodKey);

    // Cold start -- no prior headers, let request through
    if (!appScope || !methodScope) {
      return;
    }

    // Check if all buckets across both scopes allow proceeding
    const appCanProceed = canProceed(appScope);
    const methodCanProceed = canProceed(methodScope);

    if (appCanProceed && methodCanProceed) {
      // Decrement remaining in all buckets
      for (const bucket of appScope.buckets) {
        bucket.remaining--;
      }
      for (const bucket of methodScope.buckets) {
        bucket.remaining--;
      }
      return;
    }

    // Determine which scope is blocking
    const blockingKey = !appCanProceed ? appKey : methodKey;
    const blockingScope = !appCanProceed ? appScope : methodScope;

    // throwOnLimit: throw immediately
    if (this.config.throwOnLimit) {
      throw new RateLimitError({
        status: 429,
        statusText: 'Rate Limit Exceeded',
        url: '',
        method: 'GET',
        headers: {},
        limitType: blockingKey.startsWith('app:') ? 'application' : 'method',
      });
    }

    // Check queue size
    const totalQueued = this.getTotalQueueSize(appKey, methodKey);
    if (totalQueued >= this.config.maxQueueSize) {
      throw new RateLimitError({
        status: 429,
        statusText: 'Rate Limit Queue Full',
        url: '',
        method: 'GET',
        headers: {},
      });
    }

    // Calculate retry delay
    const resetAt = getEarliestReset(blockingScope);
    const retryAfter = Math.max(0, resetAt - Date.now());

    // Fire callback
    if (this.config.onRateLimit) {
      this.config.onRateLimit(blockingKey, retryAfter);
    }

    // Queue the request
    return new Promise<void>((resolve, reject) => {
      let settled = false;

      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        // Remove from queue
        this.removeFromQueue(blockingScope, entry);
        clearTimeout(drainTimerId);
        reject(
          new RateLimitError({
            status: 429,
            statusText: 'Rate Limit Timeout',
            url: '',
            method: 'GET',
            headers: {},
          }),
        );
      }, this.config.requestTimeout);

      const wrappedResolve = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        clearTimeout(drainTimerId);
        resolve();
      };

      const entry = { resolve: wrappedResolve, reject, timeoutId };
      blockingScope.queue.push(entry);

      // Schedule a check when the bucket should reset
      const delay = Math.max(retryAfter, 10);
      const drainTimerId = setTimeout(() => {
        this.drainQueue(blockingScope);
      }, delay);
    });
  }

  /**
   * Update bucket state from response headers. Called after every successful response.
   *
   * Parses `X-App-Rate-Limit`, `X-App-Rate-Limit-Count`, `X-Method-Rate-Limit`,
   * and `X-Method-Rate-Limit-Count` headers to sync token buckets.
   *
   * @param route - The routing value (e.g., 'na1')
   * @param methodId - The API method identifier (e.g., 'summoner-v4')
   * @param headers - Response headers (lowercase keys)
   */
  update(
    route: string,
    methodId: string,
    headers: Record<string, string>,
  ): void {
    const appLimitHeader = headers['x-app-rate-limit'];
    const appCountHeader = headers['x-app-rate-limit-count'];
    const methodLimitHeader = headers['x-method-rate-limit'];
    const methodCountHeader = headers['x-method-rate-limit-count'];

    if (appLimitHeader && appCountHeader) {
      const appKey = `app:${route}`;
      const existing = this.scopes.get(appKey);
      const buckets = syncBuckets(appLimitHeader, appCountHeader);
      if (existing) {
        existing.buckets = buckets;
        this.drainQueue(existing);
      } else {
        this.scopes.set(appKey, { buckets, queue: [] });
      }
    }

    if (methodLimitHeader && methodCountHeader) {
      const methodKey = `method:${route}:${methodId}`;
      const existing = this.scopes.get(methodKey);
      const buckets = syncBuckets(methodLimitHeader, methodCountHeader);
      if (existing) {
        existing.buckets = buckets;
        this.drainQueue(existing);
      } else {
        this.scopes.set(methodKey, { buckets, queue: [] });
      }
    }
  }

  /**
   * Handle a 429 response. Classifies the type and applies appropriate delay.
   *
   * - Application/method 429s: wait for `Retry-After` seconds
   * - Service 429s: exponential backoff with jitter
   *
   * @param route - The routing value
   * @param methodId - The API method identifier
   * @param headers - Response headers (lowercase keys)
   * @param attempt - The retry attempt number (0-based)
   */
  async handle429(
    route: string,
    methodId: string,
    headers: Record<string, string>,
    attempt: number,
  ): Promise<void> {
    const type = classify429(headers);
    const delay = getRetryDelay(headers, type, attempt);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, delay);
    });
  }

  /** Drain queued requests that can now proceed */
  private drainQueue(scope: ScopeState): void {
    while (scope.queue.length > 0 && canProceed(scope)) {
      const entry = scope.queue.shift();
      if (entry) {
        clearTimeout(entry.timeoutId);
        // Decrement remaining
        for (const bucket of scope.buckets) {
          bucket.remaining--;
        }
        entry.resolve();
      }
    }
  }

  /** Remove an entry from a scope's queue */
  private removeFromQueue(scope: ScopeState, entry: ScopeState['queue'][number]): void {
    const idx = scope.queue.indexOf(entry);
    if (idx !== -1) {
      scope.queue.splice(idx, 1);
    }
  }

  /** Get total queue size across scopes for rate limit checking */
  private getTotalQueueSize(appKey: string, methodKey: string): number {
    const appQueue = this.scopes.get(appKey)?.queue.length ?? 0;
    const methodQueue = this.scopes.get(methodKey)?.queue.length ?? 0;
    return Math.max(appQueue, methodQueue);
  }
}
