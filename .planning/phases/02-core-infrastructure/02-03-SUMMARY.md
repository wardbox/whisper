---
phase: 02-core-infrastructure
plan: 03
subsystem: rate-limiting
tags: [token-bucket, rate-limiter, riot-api, multi-window, 429-handling]

requires:
  - phase: 02-core-infrastructure-01
    provides: RateLimiterConfig and RequestContext types, RateLimitError class
provides:
  - RateLimiter class with proactive multi-window token bucket
  - Header parsing utilities (parseRateLimitHeader, syncBuckets)
  - 429 classification and retry delay calculation (classify429, getRetryDelay)
affects: [http-client, createClient-factory]

tech-stack:
  added: []
  patterns: [multi-window-token-bucket, scope-isolation, cold-start-passthrough, exponential-backoff-with-jitter]

key-files:
  created:
    - packages/whisper/src/core/rate-limiter.ts
    - packages/whisper/src/core/rate-limiter.test.ts
  modified: []

key-decisions:
  - "Settled flag on queued entries prevents double-resolve/reject race conditions with fake timers"
  - "Scope keys use format app:{route} and method:{route}:{methodId} for per-region isolation"
  - "Cold start allows request through when either app or method scope is uninitialized"

patterns-established:
  - "Token bucket sync: parse Riot response headers into RateLimitBucket[] with remaining = limit - count"
  - "Scope isolation: rate limit state keyed by region, not global"
  - "Service 429 detection: absence of X-Rate-Limit-Type header indicates service-level limit"

requirements-completed: [RATE-01, RATE-02, RATE-03]

duration: 4min
completed: 2026-03-17
---

# Phase 2 Plan 3: Rate Limiter Summary

**Proactive multi-window token bucket rate limiter with per-region scope isolation, three-type 429 handling, and configurable queue/timeout/callback behavior**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T16:52:14Z
- **Completed:** 2026-03-17T16:56:25Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- Multi-window token bucket parses `X-App-Rate-Limit: 100:1,1000:10,60000:600` into 3 concurrent buckets per scope
- Requests blocked proactively when any bucket has 0 remaining tokens
- App/method 429s use Retry-After header; service 429s use exponential backoff with jitter capped at 30s
- Scope isolation: app:na1 independent of app:euw1, method:na1:summoner-v4 independent of method:na1:match-v5
- Cold start allows first request through without blocking (no prior headers)
- All configuration options work: throwOnLimit, maxQueueSize, requestTimeout, onRateLimit callback
- 26 tests covering header parsing, 429 classification, retry delay, cold start, proactive blocking, scope isolation, configuration, and callbacks

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing rate limiter tests** - `d2f8a33` (test)
2. **Task 1 (GREEN): Implement rate limiter** - `a874dea` (feat)

_TDD task: test-first then implementation._

## Files Created/Modified
- `packages/whisper/src/core/rate-limiter.ts` - Proactive rate limiter with multi-window token buckets, header parsing, 429 classification, and queue management
- `packages/whisper/src/core/rate-limiter.test.ts` - 26 tests covering all rate limiter behaviors

## Decisions Made
- Used a `settled` flag on queued entries to prevent double-resolve/reject race conditions when both timeout and drain timers fire
- Scope keys use `app:{route}` and `method:{route}:{methodId}` format for per-region isolation
- Cold start allows request through when either app or method scope is uninitialized (conservative approach per research)
- `counts[i]?.limit` reuses the `limit` field from parseRateLimitHeader output since count headers share the same format

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unhandled promise rejection in requestTimeout test**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** The requestTimeout test had an unhandled promise rejection because `rejects.toThrow` attached the handler after `advanceTimersByTimeAsync` triggered the timeout
- **Fix:** Restructured test to attach `.catch()` handler before advancing timers, then assert on the caught error
- **Files modified:** packages/whisper/src/core/rate-limiter.test.ts
- **Verification:** All 26 tests pass with no unhandled rejections
- **Committed in:** a874dea (part of GREEN commit)

**2. [Rule 1 - Bug] Fixed type error in onRetry config field**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Inline type for `onRetry` used `route: string` which was incompatible with `RequestContext.route: PlatformRoute | RegionalRoute`
- **Fix:** Imported `RequestContext` type and used it directly
- **Files modified:** packages/whisper/src/core/rate-limiter.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** a874dea (part of GREEN commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- Vitest 4.x uses `--bail=1` instead of `-x` flag (minor CLI difference)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Rate limiter complete, ready for integration into HTTP client (Plan 04)
- All exported functions (parseRateLimitHeader, syncBuckets, classify429, getRetryDelay) available for HTTP client's response handling
- RateLimiter class provides acquire/update/handle429 API for the request pipeline

---
*Phase: 02-core-infrastructure*
*Completed: 2026-03-17*
