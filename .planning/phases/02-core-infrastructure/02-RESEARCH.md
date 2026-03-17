# Phase 2: Core Infrastructure - Research

**Researched:** 2026-03-17
**Domain:** HTTP client, rate limiting, caching, middleware pipeline for Riot Games API
**Confidence:** HIGH

## Summary

Phase 2 builds the core runtime of whisper: an HTTP client wrapping native `fetch`, a proactive token-bucket rate limiter synchronized from Riot's response headers, a pluggable cache with per-method TTLs, and a middleware pipeline. All four subsystems are zero-dependency TypeScript, must work across Node 18+, Deno, Bun, and edge runtimes, and integrate through a single `createClient()` factory.

The critical complexity is the rate limiter. Riot uses multi-window rate limits (e.g., `100:1,1000:10,60000:600`) at both application and method scope, and has three distinct 429 types with different recovery strategies. The rate limiter must parse headers proactively, track multiple concurrent time windows per scope, and queue requests before limits are reached -- not just react to 429s. Service-level 429s are uniquely challenging because they lack `Retry-After` and `X-Rate-Limit-Type` headers, requiring exponential backoff detection.

**Primary recommendation:** Build four independent modules (`http-client`, `rate-limiter`, `cache`, `middleware`) under `src/core/` with clean interfaces, composed together by `createClient()`. Test each in isolation with mocked fetch before integration testing.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `createClient({ apiKey, cache, rateLimiter, middleware })` -- single options object, no builder or class
- One shared client across all games -- game modules accept client as parameter
- Rate limits and cache shared across games
- Async key rotation: cache the key from first call, re-fetch on 401/403 auth failure and retry
- Core primitives exported from `@wardbox/whisper/core` for advanced users
- `createClient` exported from `@wardbox/whisper` root
- Custom error class hierarchy: `RiotApiError` base with `RateLimitError`, `NotFoundError`, `ForbiddenError`, `ServiceUnavailableError` subclasses
- Full raw response detail on errors (status, statusText, riotMessage, headers, url with redacted key, method)
- Token bucket algorithm synced from Riot headers
- Default: silent queue + retry; configurable `throwOnLimit: true`
- Configurable max queue size (default 100) and per-request timeout (default 30s)
- Event callbacks: `onRateLimit(scope, retryAfter)`, `onRetry(request, attempt)`
- Opt-out with `rateLimiter: false`
- Cache adapter: `get<T>(key): Promise<T | undefined>`, `set<T>(key, value, ttl): Promise<void>`, `delete(key): Promise<void>`, `has(key): Promise<boolean>`
- Default: in-memory `MemoryCache` (Map-based)
- Per-method TTL via pattern matching: `{ 'summoner': 3600, 'match': 60, 'spectator': 0, default: 300 }`
- Opt-out with `cache: false`
- Middleware: `onRequest(req)` and `onResponse(res, req)` hooks, object-based, array registration, forward order for requests, reverse for responses

### Claude's Discretion
- Internal HTTP client implementation details (fetch wrapper)
- Token bucket implementation specifics (refill timing, bucket granularity)
- Cache key generation strategy (API-key-aware per CACHE-04)
- Memory management for in-memory cache (eviction strategy)
- Middleware execution error handling
- Service-level 429 backoff strategy specifics

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HTTP-01 | HTTP client using native `fetch` (no polyfill, no deps) | Fetch wrapper pattern with typed request/response, base URL construction from routing values |
| HTTP-02 | Client accepts API key as string or async function for key rotation | Key provider pattern: cache resolved key, re-fetch on 401/403, retry once |
| HTTP-03 | Standard error types with Riot error codes and status mapping | Error class hierarchy with instanceof discrimination, raw response preservation |
| HTTP-04 | Middleware/interceptor pipeline for logging, metrics, retries, custom auth | Object-based hooks, ordered pipeline execution |
| RATE-01 | Proactive rate limiter parsing X-App-Rate-Limit and X-Method-Rate-Limit headers | Multi-window token bucket synced from comma-separated header values |
| RATE-02 | Distinct handling for app-level, method-level, and service-level 429s | X-Rate-Limit-Type header discrimination; service 429 lacks this header |
| RATE-03 | Configurable strategy -- proactive by default, reactive as option | `throwOnLimit` flag, `rateLimiter: false` opt-out |
| CACHE-01 | In-memory cache as default (Map-based) | MemoryCache with TTL expiry and optional LRU eviction |
| CACHE-02 | Pluggable cache adapter interface | Async interface: get/set/delete/has |
| CACHE-03 | Per-method TTL configuration | Pattern-matching key against method name, fallback to default |
| CACHE-04 | API-key-aware cache keys to prevent cross-key poisoning | Include key hash in cache key prefix |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native `fetch` | Built-in | HTTP requests | Zero-dep requirement; available Node 18+, Deno, Bun, edge |
| TypeScript | ~5.8.0 | Type system | Already in project devDependencies |
| Vitest | 4.1.0 | Testing | Already configured in project |

### Supporting
No additional runtime libraries. Zero-dep constraint means everything is hand-built. Dev dependencies only:

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.0 | Unit + integration tests | All test files |
| vitest fake timers | built-in | Timer mocking for rate limiter tests | Rate limiter window expiry tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-built token bucket | Bottleneck | Would add a runtime dependency -- forbidden by zero-dep constraint |
| Hand-built cache | lru-cache | Same -- zero-dep constraint |
| Custom error classes | Standard Error | Custom classes needed for instanceof discrimination per CONTEXT.md |

**Installation:**
```bash
# No new packages needed -- all runtime code is zero-dep
# Vitest already installed for testing
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  core/
    client.ts          # createClient() factory, orchestrates all subsystems
    http.ts            # fetch wrapper, URL building, header management
    errors.ts          # RiotApiError hierarchy
    rate-limiter.ts    # Token bucket rate limiter
    cache.ts           # CacheAdapter interface + MemoryCache
    middleware.ts       # Middleware pipeline types and executor
    types.ts           # Internal core types (ClientConfig, RequestContext, etc.)
    index.ts           # Public re-exports for @wardbox/whisper/core
    client.test.ts     # Integration tests for createClient
    http.test.ts       # HTTP client unit tests
    errors.test.ts     # Error class tests
    rate-limiter.test.ts # Rate limiter tests (heavily mocked timers)
    cache.test.ts      # Cache adapter + MemoryCache tests
    middleware.test.ts  # Middleware pipeline tests
```

### Pattern 1: Token Bucket with Multi-Window Sync

**What:** Each rate limit scope (app per region, method per region+endpoint) maintains multiple concurrent token buckets -- one per time window. Riot sends limits like `100:1,1000:10,60000:600` meaning 100/1s AND 1000/10s AND 60000/600s simultaneously.

**When to use:** All rate-limited requests (the default).

**Implementation approach:**
```typescript
// Header format: "100:1,1000:10,60000:600"
// Each pair is limit:windowSeconds
interface RateLimitBucket {
  limit: number;
  windowMs: number;
  remaining: number;
  resetAt: number; // Date.now() + windowMs
}

// A scope tracks multiple buckets simultaneously
interface RateLimitScope {
  buckets: RateLimitBucket[];
}

// Parse header into buckets
function parseRateLimitHeader(header: string): Array<{ limit: number; windowSeconds: number }> {
  return header.split(',').map(pair => {
    const [limit, windowSeconds] = pair.split(':').map(Number);
    return { limit: limit!, windowSeconds: windowSeconds! };
  });
}

// A request can proceed only if ALL buckets in scope have remaining > 0
function canProceed(scope: RateLimitScope): boolean {
  return scope.buckets.every(b => b.remaining > 0);
}
```

### Pattern 2: Key Provider Abstraction

**What:** Normalize string API key and async function into a single async provider, with caching and re-fetch on auth failure.

```typescript
type ApiKeyProvider = string | (() => Promise<string>);

function normalizeKeyProvider(input: ApiKeyProvider): () => Promise<string> {
  if (typeof input === 'string') return () => Promise.resolve(input);
  let cached: string | undefined;
  return async () => {
    if (cached === undefined) cached = await input();
    return cached;
  };
}

// On 401/403: clear cached key, re-fetch, retry once
function invalidateCachedKey(provider: ReturnType<typeof normalizeKeyProvider>) {
  // Implementation resets the cached value
}
```

### Pattern 3: Error Class Hierarchy

**What:** Custom error classes extending a base `RiotApiError` for instanceof discrimination.

```typescript
class RiotApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;        // API key redacted
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly riotMessage?: string;
}

class RateLimitError extends RiotApiError {
  readonly retryAfter?: number;
  readonly limitType?: 'application' | 'method' | 'service';
}

class NotFoundError extends RiotApiError {}
class ForbiddenError extends RiotApiError {}
class ServiceUnavailableError extends RiotApiError {}
```

### Pattern 4: Middleware Pipeline

**What:** Ordered array of middleware objects with optional pre/post hooks. Requests flow forward, responses flow backward (onion model).

```typescript
interface Middleware {
  name?: string;
  onRequest?(context: RequestContext): RequestContext | Promise<RequestContext>;
  onResponse?(response: ApiResponse, context: RequestContext): ApiResponse | Promise<ApiResponse>;
}

// Execute: run onRequest in order [0, 1, 2], then fetch, then onResponse in reverse [2, 1, 0]
async function executePipeline(
  middleware: Middleware[],
  context: RequestContext,
  executor: (ctx: RequestContext) => Promise<ApiResponse>
): Promise<ApiResponse> {
  let ctx = context;
  for (const mw of middleware) {
    if (mw.onRequest) ctx = await mw.onRequest(ctx);
  }
  let response = await executor(ctx);
  for (let i = middleware.length - 1; i >= 0; i--) {
    const mw = middleware[i]!;
    if (mw.onResponse) response = await mw.onResponse(response, ctx);
  }
  return response;
}
```

### Anti-Patterns to Avoid
- **Hardcoding rate limits:** Riot explicitly warns against this. Limits can change at any time. Always derive from response headers.
- **Single-window rate limiting:** Riot uses multiple concurrent windows (e.g., 100/1s AND 1000/10s). A single-window implementation will over-request.
- **Treating service 429s like app/method 429s:** Service 429s lack `Retry-After` and `X-Rate-Limit-Type` headers. Using `Retry-After` parsing will fail silently.
- **Blocking the entire client on one scope's rate limit:** Only the affected scope (app+region or method+region) should be blocked. Other regions and methods should proceed.
- **Synchronous cache interface:** Even `MemoryCache` must implement async interface for adapter compatibility.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| N/A -- zero-dep constraint | External libraries | Hand-built solutions | This project REQUIRES hand-building due to zero runtime dependency constraint |

**Key insight:** This phase is the exception to the "don't hand-roll" rule. The zero-dep constraint means implementing rate limiting, caching, and middleware from scratch. However, the implementations should be minimal and focused -- not general-purpose libraries. Build exactly what Riot API needs, no more.

## Common Pitfalls

### Pitfall 1: Multi-Window Rate Limit Blindness
**What goes wrong:** Implementing a single token bucket per scope and hitting limits on the shorter window while the longer window has capacity, or vice versa.
**Why it happens:** Riot's header format (`100:1,1000:10`) is easy to parse as "just use the first one."
**How to avoid:** Parse ALL comma-separated pairs. A request can only proceed if ALL buckets have remaining tokens.
**Warning signs:** Sporadic 429s despite staying under the "limit."

### Pitfall 2: Service 429 Detection
**What goes wrong:** Treating all 429s uniformly, using `Retry-After` that doesn't exist on service 429s.
**Why it happens:** Service-level 429s are the only type that omit `X-Rate-Limit-Type` and `Retry-After` headers.
**How to avoid:** Check for `X-Rate-Limit-Type` header presence. If absent on a 429, it's a service-level limit -- use exponential backoff with jitter.
**Warning signs:** `Retry-After` is `null`/`undefined` on a 429 response.

### Pitfall 3: Rate Limiter Cold Start
**What goes wrong:** On first request (no prior headers), the rate limiter has no bucket information. Could either over-request or unnecessarily block.
**Why it happens:** Token buckets are initialized from response headers, but the first request has no prior response.
**How to avoid:** Allow the first request through unconditionally. Initialize buckets from the response headers. Subsequent requests are governed by the initialized buckets.
**Warning signs:** First request always failing, or burst of requests before first response returns.

### Pitfall 4: Cache Key Collision Across API Keys
**What goes wrong:** Two different API keys sharing a client instance get each other's cached responses.
**Why it happens:** Cache keys are built from endpoint + params but not the API key.
**How to avoid:** Include a hash (or prefix) of the API key in cache keys (CACHE-04 requirement).
**Warning signs:** Getting responses for a different account's data.

### Pitfall 5: Key Rotation Race Condition
**What goes wrong:** Multiple concurrent requests detect a 401, all trigger key rotation simultaneously, causing thundering herd on the key provider.
**Why it happens:** Async key fetch + concurrent requests without coordination.
**How to avoid:** Use a single pending key-refresh promise. If a refresh is in-flight, subsequent callers await the same promise rather than starting new refreshes.
**Warning signs:** Key provider called N times on a single auth failure.

### Pitfall 6: Rate Limit Scope Granularity
**What goes wrong:** Tracking app-level limits globally instead of per-region, causing cross-region throttling.
**Why it happens:** The docs say app limits are "per region" but it's easy to implement as a single global bucket.
**How to avoid:** Scope keys include both the limit type AND the region: `app:na1`, `method:na1:summoner-v4`.
**Warning signs:** NA1 requests throttled because EUW1 hit the limit.

### Pitfall 7: exactOptionalPropertyTypes Strictness
**What goes wrong:** TypeScript compilation errors when assigning `undefined` to optional properties.
**Why it happens:** Project has `exactOptionalPropertyTypes: true` in tsconfig.base.json. This means `field?: T` does NOT accept `undefined` -- only omission.
**How to avoid:** Use `field?: T | undefined` explicitly when undefined assignment is needed, or omit the property entirely.
**Warning signs:** TS2375 errors on optional property assignment.

## Code Examples

### Riot API URL Construction
```typescript
// Base URL format: https://{route}.api.riotgames.com
// Both platform and regional routes use the same pattern
function buildUrl(
  route: string,  // 'na1', 'americas', etc.
  path: string    // '/lol/summoner/v4/summoners/by-puuid/{puuid}'
): string {
  return `https://${route}.api.riotgames.com${path}`;
}
```

### Rate Limit Header Parsing
```typescript
// Source: Riot API documentation via HexDocs
// X-App-Rate-Limit: 100:1,1000:10,60000:600
// X-App-Rate-Limit-Count: 1:1,2:10,2:600
function parseRateLimitPairs(header: string): Array<[number, number]> {
  return header.split(',').map(pair => {
    const parts = pair.split(':');
    return [Number(parts[0]), Number(parts[1])];
  });
}

// Sync buckets from response headers
function syncBuckets(
  limitHeader: string,   // "100:1,1000:10"
  countHeader: string    // "5:1,50:10"
): RateLimitBucket[] {
  const limits = parseRateLimitPairs(limitHeader);
  const counts = parseRateLimitPairs(countHeader);

  return limits.map(([ limit, windowSec ], i) => {
    const count = counts[i]?.[0] ?? 0;
    return {
      limit,
      windowMs: windowSec * 1000,
      remaining: limit - count,
      resetAt: Date.now() + windowSec * 1000,
    };
  });
}
```

### 429 Type Discrimination
```typescript
// Source: HexDocs rate limiting documentation
function classify429(headers: Headers): 'application' | 'method' | 'service' {
  const type = headers.get('X-Rate-Limit-Type');
  if (type === 'application') return 'application';
  if (type === 'method') return 'method';
  // No X-Rate-Limit-Type header = service-level 429
  return 'service';
}

function getRetryDelay(headers: Headers, type: string, attempt: number): number {
  if (type === 'service') {
    // Service 429s have no Retry-After -- use exponential backoff with jitter
    const base = Math.min(1000 * 2 ** attempt, 30000); // cap at 30s
    const jitter = Math.random() * base * 0.1;          // 10% jitter
    return base + jitter;
  }
  // App/method 429s include Retry-After in seconds
  const retryAfter = headers.get('Retry-After');
  return retryAfter ? Number(retryAfter) * 1000 : 5000; // fallback 5s
}
```

### Cache Key Generation (API-Key-Aware)
```typescript
// Include a hash of the API key to prevent cross-key cache poisoning (CACHE-04)
async function buildCacheKey(
  apiKey: string,
  route: string,
  path: string,
  params?: Record<string, string>
): Promise<string> {
  // Use first 8 chars of a simple hash for uniqueness without leaking key
  const keyPrefix = simpleHash(apiKey).slice(0, 8);
  const paramStr = params ? '?' + new URLSearchParams(params).toString() : '';
  return `${keyPrefix}:${route}:${path}${paramStr}`;
}

// Simple non-crypto hash (djb2) -- no need for crypto module in edge runtimes
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
```

### Per-Method TTL Resolution
```typescript
// Pattern matching from client config: { 'summoner': 3600, 'match': 60, 'spectator': 0, default: 300 }
function resolveTtl(
  path: string,
  ttlConfig: Record<string, number>
): number {
  // Match against method name patterns in the path
  for (const [pattern, ttl] of Object.entries(ttlConfig)) {
    if (pattern === 'default') continue;
    if (path.includes(pattern)) return ttl;
  }
  return ttlConfig['default'] ?? 300;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `X-Rate-Limit-Count` (single header) | `X-App-Rate-Limit-Count` + `X-Method-Rate-Limit-Count` (separate) | ~2020 | Parse the new split headers; old header is deprecated |
| Reactive 429 retry only | Proactive token bucket from headers | Community best practice | Prevents 429s entirely under normal load |
| `node-fetch` polyfill | Native `fetch` | Node 18+ | No polyfill needed; works cross-runtime |
| Class-based API clients | Function factory (`createClient()`) | 2023+ ecosystem trend | Better tree-shaking, simpler API |

**Deprecated/outdated:**
- `X-Rate-Limit-Count`: Replaced by `X-App-Rate-Limit-Count` and `X-Method-Rate-Limit-Count`
- SummonerID-based endpoints (summoner-v4): Removed by Riot June 2025

## Open Questions

1. **Bucket reset timing precision**
   - What we know: Windows are parsed from headers (e.g., 10 seconds). Count headers show current usage.
   - What's unclear: Whether the window resets are rolling (sliding window) or fixed (aligned to some epoch). Most implementations treat them as rolling from the time of the response.
   - Recommendation: Treat as rolling windows. Reset `remaining` when `Date.now() > resetAt`. This is conservative and matches observed behavior.

2. **Rate limiter behavior on first request per scope**
   - What we know: No prior headers exist before the first response.
   - What's unclear: Whether to allow unlimited first requests or apply a conservative default.
   - Recommendation: Allow first request unconditionally. Initialize buckets from response. For concurrent first requests to the same scope, allow them through (the API will return headers on all responses, and we sync from the first one that returns).

3. **MemoryCache eviction under memory pressure**
   - What we know: Map-based cache will grow unbounded without eviction.
   - What's unclear: Optimal eviction strategy for this use case.
   - Recommendation: TTL-based expiry is sufficient for v1 (expired entries cleaned up on `get` -- lazy eviction). Optional max entries config with simple LRU if needed. Don't over-engineer; most consumers make bounded request patterns.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `packages/whisper/vitest.config.ts` |
| Quick run command | `pnpm vitest run src/core/{file}.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HTTP-01 | Native fetch wrapper builds correct URLs, sends headers | unit | `pnpm vitest run src/core/http.test.ts -x` | No -- Wave 0 |
| HTTP-02 | String key and async function key both resolve; re-fetch on 401 | unit | `pnpm vitest run src/core/http.test.ts -t "key rotation" -x` | No -- Wave 0 |
| HTTP-03 | Error classes with correct status mapping and instanceof | unit | `pnpm vitest run src/core/errors.test.ts -x` | No -- Wave 0 |
| HTTP-04 | Middleware pipeline: onRequest/onResponse order, modification | unit | `pnpm vitest run src/core/middleware.test.ts -x` | No -- Wave 0 |
| RATE-01 | Parse multi-window headers, track buckets, block when empty | unit | `pnpm vitest run src/core/rate-limiter.test.ts -t "proactive" -x` | No -- Wave 0 |
| RATE-02 | App/method 429 use Retry-After; service 429 uses backoff | unit | `pnpm vitest run src/core/rate-limiter.test.ts -t "429" -x` | No -- Wave 0 |
| RATE-03 | throwOnLimit throws; rateLimiter:false disables | unit | `pnpm vitest run src/core/rate-limiter.test.ts -t "config" -x` | No -- Wave 0 |
| CACHE-01 | MemoryCache stores/retrieves/expires by TTL | unit | `pnpm vitest run src/core/cache.test.ts -t "MemoryCache" -x` | No -- Wave 0 |
| CACHE-02 | Custom adapter implementing interface works as drop-in | unit | `pnpm vitest run src/core/cache.test.ts -t "adapter" -x` | No -- Wave 0 |
| CACHE-03 | Per-method TTL resolves from config patterns | unit | `pnpm vitest run src/core/cache.test.ts -t "TTL" -x` | No -- Wave 0 |
| CACHE-04 | Different API keys produce different cache keys | unit | `pnpm vitest run src/core/cache.test.ts -t "key-aware" -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/core/{changed-file}.test.ts -x`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/core/http.test.ts` -- covers HTTP-01, HTTP-02
- [ ] `src/core/errors.test.ts` -- covers HTTP-03
- [ ] `src/core/middleware.test.ts` -- covers HTTP-04
- [ ] `src/core/rate-limiter.test.ts` -- covers RATE-01, RATE-02, RATE-03
- [ ] `src/core/cache.test.ts` -- covers CACHE-01, CACHE-02, CACHE-03, CACHE-04
- [ ] `src/core/client.test.ts` -- integration test composing all subsystems
- [ ] Framework install: none needed -- Vitest already configured

## Sources

### Primary (HIGH confidence)
- [HexDocs Rate Limiting](https://hextechdocs.dev/rate-limiting/) -- Complete header format documentation, 429 type discrimination, multi-window examples
- [Riot Developer Portal](https://developer.riotgames.com/docs/portal) -- Official rate limiting overview, three limit types, blacklisting warnings

### Secondary (MEDIUM confidence)
- [fightmegg/riot-rate-limiter](https://github.com/fightmegg/riot-rate-limiter) -- Community implementation patterns, Bottleneck-based approach (reference only, not using)
- [Riot API Change Log](https://www.riotgames.com/en/DevRel/riot-games-api-change-log) -- Header deprecation history (X-Rate-Limit-Count replaced by split headers)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero-dep constraint eliminates library choices; native fetch is well-understood
- Architecture: HIGH -- patterns are straightforward (token bucket, adapter pattern, middleware pipeline); Riot header format is well-documented
- Pitfalls: HIGH -- multi-window rate limits and service 429 detection are well-documented gotchas with clear mitigation strategies
- Rate limiter details: MEDIUM -- window reset behavior (rolling vs fixed) is not officially documented; using conservative rolling assumption

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (Riot API rate limiting is stable; headers haven't changed significantly in years)
