---
phase: 02-core-infrastructure
verified: 2026-03-17T10:07:00Z
status: gaps_found
score: 19/20 must-haves verified
re_verification: false
gaps:
  - truth: "TypeScript compiles cleanly with no type errors"
    status: failed
    reason: "exactOptionalPropertyTypes violation in http.ts line 209: body field passed as 'string | undefined' to fetch() which expects 'BodyInit | null', not undefined"
    artifacts:
      - path: "packages/whisper/src/core/http.ts"
        issue: "Line 209: `body: options?.body` passes `string | undefined` to `RequestInit.body` which does not accept `undefined` under exactOptionalPropertyTypes"
    missing:
      - "Fix: change `body: options?.body` to `body: options?.body ?? null` or use a conditional to omit the body field entirely when undefined"
  - truth: "CacheAdapter type is sourced from a single canonical location"
    status: partial
    reason: "cache.ts defines its own CacheAdapter and CacheTtlConfig interfaces locally with a TODO comment to import from types.ts. The interfaces are structurally identical so runtime behavior is correct, but there are now two independent definitions of the same contract."
    artifacts:
      - path: "packages/whisper/src/core/cache.ts"
        issue: "Lines 29-59 define CacheAdapter and CacheTtlConfig locally. types.ts already exports these. The TODO comment on line 10 acknowledges this debt."
    missing:
      - "Remove local CacheAdapter and CacheTtlConfig definitions from cache.ts and import from ./types.js instead"
      - "Ensure MemoryCache continues to implement the types.ts CacheAdapter interface"
---

# Phase 02: Core Infrastructure Verification Report

**Phase Goal:** A developer can instantiate a client with an API key (string or async function), make a request, and have rate limits handled proactively — no 429s under normal usage, and all three 429 types handled correctly when limits are exceeded.
**Verified:** 2026-03-17T10:07:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `instanceof RiotApiError` catches any non-2xx Riot API error | VERIFIED | errors.ts L25: `export class RiotApiError extends Error`; errors.test.ts 56 test blocks confirm instanceof chain |
| 2 | `instanceof RateLimitError` catches 429 specifically | VERIFIED | errors.ts L66: `export class RateLimitError extends RiotApiError`; http.ts mapError() case 429 |
| 3 | `instanceof NotFoundError` catches 404 specifically | VERIFIED | errors.ts L92: `export class NotFoundError extends RiotApiError`; mapError() case 404 |
| 4 | `instanceof ForbiddenError` catches 401/403 specifically | VERIFIED | errors.ts L113: `export class ForbiddenError extends RiotApiError`; mapError() cases 401/403 |
| 5 | `instanceof ServiceUnavailableError` catches 503 specifically | VERIFIED | errors.ts L134: `export class ServiceUnavailableError extends RiotApiError`; mapError() case 503 |
| 6 | Error objects expose status, statusText, url (redacted), method, headers, riotMessage | VERIFIED | errors.ts L26-31: all readonly properties; L34 redacts RGAPI key pattern |
| 7 | API key is redacted in error URLs | VERIFIED | errors.ts L34: `url.replace(/RGAPI-[a-f0-9-]+/gi, 'RGAPI-***')` |
| 8 | Middleware onRequest hooks run forward (0,1,2), onResponse hooks run reverse (2,1,0) | VERIFIED | middleware.ts L23-38: forward for-of loop, reverse for(let i = length-1) loop |
| 9 | MemoryCache stores/retrieves within TTL; returns undefined after expiry; TTL 0 = no cache | VERIFIED | cache.ts L83-117: lazy eviction on get/has; set() guards `if (ttlSeconds <= 0) return` |
| 10 | resolveTtl matches method patterns in path; returns default when no match | VERIFIED | cache.ts L141-147: iterates config entries, `path.includes(pattern)` |
| 11 | buildCacheKey includes API-key-derived prefix; different keys produce different cache namespaces | VERIFIED | cache.ts L168-177: `simpleHash(apiKey).slice(0,8)` prefix |
| 12 | Custom CacheAdapter works as drop-in replacement | VERIFIED | CacheAdapter interface defined; MemoryCache implements it; tests confirm pluggable adapter |
| 13 | Rate limiter parses X-App-Rate-Limit and X-Method-Rate-Limit headers into multi-window token buckets | VERIFIED | rate-limiter.ts L34-69: parseRateLimitHeader(), syncBuckets(); update() L314-343 |
| 14 | First request to new scope passes through without blocking (cold start) | VERIFIED | rate-limiter.ts L208-210: early return when appScope or methodScope not yet in map |
| 15 | App-level and method-level 429s use Retry-After; service-level uses exponential backoff | VERIFIED | rate-limiter.ts L99-111: getRetryDelay() returns Retry-After*1000 for app/method; exponential backoff for service |
| 16 | throwOnLimit:true, maxQueueSize, requestTimeout all enforced | VERIFIED | rate-limiter.ts L232-253: throwOnLimit throws immediately; queue size check; timeout scheduling |
| 17 | Rate limit scopes are per-region (app:na1 independent of app:euw1) | VERIFIED | rate-limiter.ts L201-202: appKey=`app:${route}`, methodKey=`method:${route}:${methodId}` |
| 18 | createClient accepts string and async function API keys | VERIFIED | http.ts L61-92: normalizeKeyProvider() handles both; string returns immediately, fn caches with pending dedupe |
| 19 | createClient integrates rate limiter, cache, and middleware pipeline | VERIFIED | client.ts L91-193: all subsystems wired; executePipeline wraps acquire->http.request->update |
| 20 | TypeScript compiles cleanly with no type errors | FAILED | `npx tsc --noEmit` exits 2: http.ts L209 exactOptionalPropertyTypes violation (`body: string \| undefined` not assignable to `BodyInit \| null`) |

**Score:** 19/20 truths verified

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `packages/whisper/src/core/types.ts` | VERIFIED | Exports all 8 required interfaces: ApiKeyProvider, CacheAdapter, CacheTtlConfig, RateLimiterConfig, Middleware, RequestContext, ApiResponse, ClientConfig |
| `packages/whisper/src/core/errors.ts` | VERIFIED | 5 error classes with full hierarchy; API key redaction; all properties readonly |
| `packages/whisper/src/core/middleware.ts` | VERIFIED | executePipeline with forward request / reverse response ordering |
| `packages/whisper/src/core/errors.test.ts` | VERIFIED | 56 test/describe blocks; 249 lines; all tests pass |
| `packages/whisper/src/core/middleware.test.ts` | VERIFIED | 25 test/describe blocks; 275 lines; all tests pass |
| `packages/whisper/src/core/cache.ts` | VERIFIED | MemoryCache, resolveTtl, buildCacheKey — all exported; 192 lines of substantive implementation |
| `packages/whisper/src/core/cache.test.ts` | VERIFIED | 59 test/describe blocks; 205 lines; all tests pass |
| `packages/whisper/src/core/rate-limiter.ts` | VERIFIED | RateLimiter class, parseRateLimitHeader, syncBuckets, classify429, getRetryDelay all exported |
| `packages/whisper/src/core/rate-limiter.test.ts` | VERIFIED | 158 test/describe blocks; 328 lines; all tests pass with vi.useFakeTimers |
| `packages/whisper/src/core/http.ts` | VERIFIED | buildUrl, normalizeKeyProvider, createHttpClient, KeyProvider interface; X-Riot-Token header; 401/403 retry |
| `packages/whisper/src/core/http.test.ts` | VERIFIED | 73 test/describe blocks; 278 lines; all tests pass |
| `packages/whisper/src/core/client.ts` | VERIFIED | createClient factory integrating all subsystems; 194 lines; cache:false and rateLimiter:false opt-outs |
| `packages/whisper/src/core/client.test.ts` | VERIFIED | 46 test/describe blocks; 197 lines; all tests pass |
| `packages/whisper/src/core/index.ts` | VERIFIED | Exports createClient, WhisperClient, all error classes, all types, all primitives |
| `packages/whisper/src/index.ts` | VERIFIED | Root barrel exports createClient, WhisperClient, all error classes, config types |
| `packages/whisper/tsdown.config.ts` | VERIFIED | 8 entry points including `index` and `core/index`; build exits 0 |
| `packages/whisper/package.json` | VERIFIED | `"."` and `"./core"` subpaths present with correct import/require/types structure |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| errors.ts | types.ts | Not directly — errors.ts defines its own RiotApiErrorOptions | N/A | errors.ts does not import from types.ts; it defines its own option types. No wiring issue — this is by design as errors existed before types. |
| middleware.ts | types.ts | `import type { ApiResponse, Middleware, RequestContext } from './types.js'` | WIRED | Line 1 of middleware.ts |
| rate-limiter.ts | errors.ts | `import { RateLimitError } from './errors.js'` | WIRED | Line 1 of rate-limiter.ts |
| rate-limiter.ts | types.ts | `import type { RateLimiterConfig, RequestContext } from './types.js'` | WIRED | Line 2 of rate-limiter.ts |
| http.ts | errors.ts | `import { ForbiddenError, NotFoundError, RateLimitError, RiotApiError, ServiceUnavailableError } from './errors.js'` | WIRED | Lines 1-7 of http.ts |
| client.ts | http.ts | `import { buildUrl, createHttpClient, normalizeKeyProvider } from './http.js'` | WIRED | Line 6 of client.ts |
| client.ts | rate-limiter.ts | `import { RateLimiter } from './rate-limiter.js'` | WIRED | Line 8 of client.ts |
| client.ts | cache.ts | `import { buildCacheKey, MemoryCache, resolveTtl } from './cache.js'` | WIRED | Line 3 of client.ts |
| client.ts | middleware.ts | `import { executePipeline } from './middleware.js'` | WIRED | Line 7 of client.ts |
| cache.ts | types.ts | NOT WIRED — cache.ts defines its own CacheAdapter and CacheTtlConfig locally | PARTIAL | TODO comment on line 10 of cache.ts acknowledges this. Interfaces are structurally identical so no runtime impact, but creates type duplication. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HTTP-01 | 02-04 | HTTP client using native fetch (no polyfill, no deps) | SATISFIED | http.ts uses `globalThis.fetch` directly; zero runtime dependencies |
| HTTP-02 | 02-04 | Client accepts API key as string or async function for key rotation | SATISFIED | normalizeKeyProvider() in http.ts handles both; concurrent invalidation race prevention via pending promise |
| HTTP-03 | 02-01 | Standard error types with Riot error codes and status mapping | SATISFIED | 5-class error hierarchy in errors.ts; mapError() in http.ts maps 401/403/404/429/503 |
| HTTP-04 | 02-01 | Middleware/interceptor pipeline for logging, metrics, retries, custom auth | SATISFIED | executePipeline() in middleware.ts; integrated in client.ts request flow |
| RATE-01 | 02-03 | Proactive rate limiter parsing X-App-Rate-Limit and X-Method-Rate-Limit | SATISFIED | RateLimiter.update() parses both headers; syncBuckets() creates multi-window buckets |
| RATE-02 | 02-03 | Distinct handling for app-level, method-level, and service-level 429s | SATISFIED | classify429() + getRetryDelay() in rate-limiter.ts; handle429() in RateLimiter class |
| RATE-03 | 02-03 | Configurable strategy — proactive by default, reactive as option | SATISFIED | throwOnLimit config; rateLimiter:false disables entirely; maxQueueSize and requestTimeout configurable |
| CACHE-01 | 02-02 | In-memory cache as default (Map-based) | SATISFIED | MemoryCache uses `Map<string, CacheEntry>`; instantiated by default in createClient |
| CACHE-02 | 02-02 | Pluggable cache adapter interface (get/set/delete) for Redis, file, custom | SATISFIED | CacheAdapter interface in types.ts and cache.ts; MemoryCache implements it; tests prove drop-in replacement |
| CACHE-03 | 02-02 | Per-method TTL configuration (summoner=long, match=short, live game=0) | SATISFIED | resolveTtl() matches path patterns; TTL 0 means no-cache in set() guard |
| CACHE-04 | 02-02 | API-key-aware cache keys to prevent cross-key poisoning | SATISFIED | buildCacheKey() uses simpleHash(apiKey) prefix; different keys produce different namespaces |

All 11 requirement IDs declared across plans are accounted for. No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `cache.ts` | 10 | `TODO: Import CacheAdapter and CacheTtlConfig from ./types.js` | Warning | Two definitions of the same interface exist. Structurally identical today, but drift risk if one is updated. |
| `http.ts` | 209 | `body: options?.body` passes `string \| undefined` to `RequestInit.body` | Blocker | `tsc --noEmit` exits with code 2. The build succeeds (tsdown may be more lenient) but TypeScript strict mode rejects this. |
| `rate-limiter.ts` | 358 | `methodId` parameter unused in `handle429()` | Info | Biome warning only. Parameter exists for future use (e.g., per-method retry tracking). No correctness impact. |
| `http.ts` | 248-250 | `try { return await doFetch(...) } catch (retryErr) { throw retryErr }` | Info | Biome info: catch clause only rethrows. No correctness impact. |

### Human Verification Required

#### 1. Rate Limiter Queue Drain Under Real Timing

**Test:** Configure a client against a real (or carefully mocked) Riot endpoint. Exhaust a bucket, confirm subsequent requests queue and resume automatically when the window resets. Verify no 429s are received under sustained load within declared limits.
**Expected:** All requests complete without 429 errors; queued requests resolve in FIFO order after bucket reset.
**Why human:** The drain logic (setTimeout -> drainQueue) depends on wall-clock timing. Fake timers confirm the logic path but cannot validate that real environment scheduling produces the correct ordering under load.

#### 2. Key Rotation Race Condition Under Real Concurrency

**Test:** Use an async key provider that introduces deliberate latency. Fire 10 concurrent requests simultaneously immediately after `invalidate()`. Confirm the provider function is called exactly once (not 10 times).
**Expected:** `pending` promise is shared across all concurrent getKey() calls; provider function invoked once.
**Why human:** vi.fn() mocks confirm the pattern in tests but concurrent JavaScript scheduling in a real environment (Node.js event loop) should be validated manually.

### Gaps Summary

Two gaps block full goal achievement:

**Gap 1 (Blocker): TypeScript type error in http.ts.** The `body` field in the `fetch()` call passes `string | undefined` but `RequestInit.body` under `exactOptionalPropertyTypes` requires `BodyInit | null`. The fix is one line: change `body: options?.body` to `body: options?.body ?? null`. This is a known TypeScript pitfall documented in the phase CONTEXT (Pitfall 7). The build succeeds via tsdown (which may be less strict) but `npx tsc --noEmit` exits with code 2, violating the plan's own verification step.

**Gap 2 (Warning): Duplicate CacheAdapter definition.** `cache.ts` defines its own `CacheAdapter` and `CacheTtlConfig` locally with a TODO to import from `types.ts`. Both interfaces are structurally identical today, so there is no runtime impact and all tests pass. However the TODO was left unresolved and the duplication creates maintenance risk. The plan's acceptance criteria state "packages/whisper/src/core/cache.ts contains `CacheAdapter` (imported or defined)" — the "imported" preferred path was not taken.

The first gap is a blocker because `npx tsc --noEmit` is one of the phase's own verification commands (listed in plan 02-04's `<verification>` block) and it exits non-zero.

---

_Verified: 2026-03-17T10:07:00Z_
_Verifier: Claude (gsd-verifier)_
