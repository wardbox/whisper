import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitError } from './errors.js';
import {
  classify429,
  getRetryDelay,
  parseRateLimitHeader,
  RateLimiter,
  syncBuckets,
} from './rate-limiter.js';

describe('parseRateLimitHeader', () => {
  it('parses single window', () => {
    const result = parseRateLimitHeader('100:1');
    expect(result).toEqual([{ limit: 100, windowSeconds: 1 }]);
  });

  it('parses multi-window header', () => {
    const result = parseRateLimitHeader('100:1,1000:10,60000:600');
    expect(result).toEqual([
      { limit: 100, windowSeconds: 1 },
      { limit: 1000, windowSeconds: 10 },
      { limit: 60000, windowSeconds: 600 },
    ]);
  });
});

describe('syncBuckets', () => {
  it('computes remaining tokens from limit and count headers', () => {
    const buckets = syncBuckets('100:1,1000:10', '5:1,50:10');
    expect(buckets).toHaveLength(2);
    expect(buckets[0]!.remaining).toBe(95);
    expect(buckets[1]!.remaining).toBe(950);
  });

  it('sets limit and windowMs correctly', () => {
    const buckets = syncBuckets('100:1', '5:1');
    expect(buckets[0]!.limit).toBe(100);
    expect(buckets[0]!.windowMs).toBe(1000);
  });

  it('sets resetAt in the future', () => {
    const now = Date.now();
    const buckets = syncBuckets('100:10', '5:10');
    expect(buckets[0]!.resetAt).toBeGreaterThanOrEqual(now + 10000);
  });
});

describe('classify429', () => {
  it('returns application when X-Rate-Limit-Type is application', () => {
    expect(classify429({ 'x-rate-limit-type': 'application' })).toBe('application');
  });

  it('returns method when X-Rate-Limit-Type is method', () => {
    expect(classify429({ 'x-rate-limit-type': 'method' })).toBe('method');
  });

  it('returns service when no X-Rate-Limit-Type header', () => {
    expect(classify429({})).toBe('service');
  });
});

describe('getRetryDelay', () => {
  it('uses Retry-After for app 429', () => {
    const delay = getRetryDelay({ 'retry-after': '5' }, 'application', 0);
    expect(delay).toBe(5000);
  });

  it('uses Retry-After for method 429', () => {
    const delay = getRetryDelay({ 'retry-after': '3' }, 'method', 0);
    expect(delay).toBe(3000);
  });

  it('falls back to 5000ms when no Retry-After for app/method', () => {
    expect(getRetryDelay({}, 'application', 0)).toBe(5000);
  });

  it('uses exponential backoff for service 429 attempt 0', () => {
    const delay = getRetryDelay({}, 'service', 0);
    // base = min(1000 * 2^0, 30000) = 1000, jitter up to 10%
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(1100);
  });

  it('uses exponential backoff for service 429 attempt 1', () => {
    const delay = getRetryDelay({}, 'service', 1);
    // base = min(1000 * 2^1, 30000) = 2000, jitter up to 10%
    expect(delay).toBeGreaterThanOrEqual(2000);
    expect(delay).toBeLessThanOrEqual(2200);
  });

  it('caps service backoff at 30000ms', () => {
    const delay = getRetryDelay({}, 'service', 20);
    expect(delay).toBeLessThanOrEqual(33000);
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('cold start', () => {
    it('allows first request through immediately', async () => {
      const limiter = new RateLimiter();
      // Should resolve immediately -- no prior headers
      await limiter.acquire('na1', 'summoner-v4');
    });
  });

  describe('update and proactive blocking', () => {
    it('allows request when buckets have remaining tokens', async () => {
      const limiter = new RateLimiter();
      // First request
      await limiter.acquire('na1', 'summoner-v4');
      // Update with plenty of remaining
      limiter.update('na1', 'summoner-v4', {
        'x-app-rate-limit': '100:1',
        'x-app-rate-limit-count': '1:1',
        'x-method-rate-limit': '20:1',
        'x-method-rate-limit-count': '1:1',
      });
      // Should still allow
      await limiter.acquire('na1', 'summoner-v4');
    });

    it('blocks when app bucket has 0 remaining', async () => {
      const limiter = new RateLimiter();
      await limiter.acquire('na1', 'summoner-v4');
      // Update: app bucket exhausted
      limiter.update('na1', 'summoner-v4', {
        'x-app-rate-limit': '100:1',
        'x-app-rate-limit-count': '100:1',
        'x-method-rate-limit': '20:1',
        'x-method-rate-limit-count': '1:1',
      });

      let resolved = false;
      const promise = limiter.acquire('na1', 'summoner-v4').then(() => {
        resolved = true;
      });

      // Should not resolve immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(false);

      // Advance past the 1s window reset
      await vi.advanceTimersByTimeAsync(1100);
      await promise;
      expect(resolved).toBe(true);
    });

    it('blocks when method bucket has 0 remaining', async () => {
      const limiter = new RateLimiter();
      await limiter.acquire('na1', 'summoner-v4');
      // Update: method bucket exhausted
      limiter.update('na1', 'summoner-v4', {
        'x-app-rate-limit': '100:1',
        'x-app-rate-limit-count': '1:1',
        'x-method-rate-limit': '20:1',
        'x-method-rate-limit-count': '20:1',
      });

      let resolved = false;
      const promise = limiter.acquire('na1', 'summoner-v4').then(() => {
        resolved = true;
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(false);

      await vi.advanceTimersByTimeAsync(1100);
      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe('scope isolation', () => {
    it('different regions are independent', async () => {
      const limiter = new RateLimiter();

      // Exhaust na1 app bucket
      await limiter.acquire('na1', 'summoner-v4');
      limiter.update('na1', 'summoner-v4', {
        'x-app-rate-limit': '100:1',
        'x-app-rate-limit-count': '100:1',
        'x-method-rate-limit': '20:1',
        'x-method-rate-limit-count': '1:1',
      });

      // euw1 should still work (different region)
      await limiter.acquire('euw1', 'summoner-v4');
    });

    it('different methods are independent', async () => {
      const limiter = new RateLimiter();

      // Exhaust summoner-v4 method bucket on na1
      await limiter.acquire('na1', 'summoner-v4');
      limiter.update('na1', 'summoner-v4', {
        'x-app-rate-limit': '100:1',
        'x-app-rate-limit-count': '1:1',
        'x-method-rate-limit': '20:1',
        'x-method-rate-limit-count': '20:1',
      });

      // match-v5 on na1 should not be blocked by summoner-v4's method limit
      // (app limit is fine, and match-v5 has no method state yet -- cold start)
      await limiter.acquire('na1', 'match-v5');
    });
  });

  describe('configuration', () => {
    it('throwOnLimit throws RateLimitError immediately', async () => {
      const limiter = new RateLimiter({ throwOnLimit: true });
      await limiter.acquire('na1', 'summoner-v4');
      limiter.update('na1', 'summoner-v4', {
        'x-app-rate-limit': '100:1',
        'x-app-rate-limit-count': '100:1',
        'x-method-rate-limit': '20:1',
        'x-method-rate-limit-count': '1:1',
      });

      await expect(limiter.acquire('na1', 'summoner-v4')).rejects.toThrow(RateLimitError);
    });

    it('maxQueueSize throws when queue is full', async () => {
      const limiter = new RateLimiter({ maxQueueSize: 2 });
      await limiter.acquire('na1', 'summoner-v4');
      limiter.update('na1', 'summoner-v4', {
        'x-app-rate-limit': '100:1',
        'x-app-rate-limit-count': '100:1',
        'x-method-rate-limit': '20:1',
        'x-method-rate-limit-count': '1:1',
      });

      // Fill the queue
      const p1 = limiter.acquire('na1', 'summoner-v4');
      const p2 = limiter.acquire('na1', 'summoner-v4');

      // Third should throw -- queue full
      await expect(limiter.acquire('na1', 'summoner-v4')).rejects.toThrow(RateLimitError);

      // Clean up -- advance timers so queued requests resolve
      await vi.advanceTimersByTimeAsync(1100);
      await Promise.all([p1, p2]);
    });

    it('requestTimeout throws when request times out in queue', async () => {
      const limiter = new RateLimiter({ requestTimeout: 500 });
      await limiter.acquire('na1', 'summoner-v4');
      limiter.update('na1', 'summoner-v4', {
        'x-app-rate-limit': '100:10',
        'x-app-rate-limit-count': '100:10',
        'x-method-rate-limit': '20:10',
        'x-method-rate-limit-count': '1:10',
      });

      // Attach the rejection handler BEFORE advancing timers
      let caughtError: Error | undefined;
      const promise = limiter.acquire('na1', 'summoner-v4').catch((err: Error) => {
        caughtError = err;
      });

      // Advance past the timeout
      await vi.advanceTimersByTimeAsync(600);
      await promise;

      expect(caughtError).toBeInstanceOf(RateLimitError);
    });
  });

  describe('callbacks', () => {
    it('onRateLimit fires when request is rate limited', async () => {
      const onRateLimit = vi.fn();
      const limiter = new RateLimiter({ onRateLimit });
      await limiter.acquire('na1', 'summoner-v4');
      limiter.update('na1', 'summoner-v4', {
        'x-app-rate-limit': '100:1',
        'x-app-rate-limit-count': '100:1',
        'x-method-rate-limit': '20:1',
        'x-method-rate-limit-count': '1:1',
      });

      const promise = limiter.acquire('na1', 'summoner-v4');
      await vi.advanceTimersByTimeAsync(0);

      expect(onRateLimit).toHaveBeenCalledWith(
        expect.stringContaining('app:na1'),
        expect.any(Number),
      );

      // Clean up
      await vi.advanceTimersByTimeAsync(1100);
      await promise;
    });
  });

  describe('handle429', () => {
    it('applies Retry-After delay for app 429', async () => {
      const limiter = new RateLimiter();
      const promise = limiter.handle429(
        'na1',
        'summoner-v4',
        {
          'x-rate-limit-type': 'application',
          'retry-after': '2',
        },
        0,
      );

      await vi.advanceTimersByTimeAsync(2000);
      await promise;
    });

    it('applies exponential backoff for service 429', async () => {
      const limiter = new RateLimiter();
      const promise = limiter.handle429('na1', 'summoner-v4', {}, 0);

      // Service 429 attempt 0: base 1000 + up to 10% jitter
      await vi.advanceTimersByTimeAsync(1100);
      await promise;
    });
  });
});
