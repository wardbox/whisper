---
phase: 02-core-infrastructure
plan: 04
subsystem: api
tags: [fetch, http-client, key-rotation, rate-limiter, cache, middleware, tree-shaking, subpath-exports]

# Dependency graph
requires:
  - phase: 02-core-infrastructure/01
    provides: Core types (ClientConfig, ApiKeyProvider, RequestContext, ApiResponse), error class hierarchy
  - phase: 02-core-infrastructure/02
    provides: MemoryCache, CacheAdapter, resolveTtl, buildCacheKey
  - phase: 02-core-infrastructure/03
    provides: RateLimiter with acquire/update/handle429, classify429
provides:
  - HTTP client with URL building, key provider, and error mapping
  - createClient factory composing all core subsystems
  - @wardbox/whisper/core barrel export for advanced users
  - @wardbox/whisper root barrel export with createClient
  - 8 subpath entry points (root, core, lol, tft, val, lor, riftbound, riot)
affects: [03-schema-generation, 04-endpoint-modules, 05-game-modules]

# Tech tracking
tech-stack:
  added: []
  patterns: [key-provider-abstraction, request-pipeline-composition, subpath-exports]

key-files:
  created:
    - packages/whisper/src/core/http.ts
    - packages/whisper/src/core/http.test.ts
    - packages/whisper/src/core/client.ts
    - packages/whisper/src/core/client.test.ts
    - packages/whisper/src/core/index.ts
    - packages/whisper/src/index.ts
  modified:
    - packages/whisper/tsdown.config.ts
    - packages/whisper/package.json

key-decisions:
  - "KeyProvider as object with getKey()/invalidate() methods rather than bare function -- enables race-safe invalidation"
  - "Cache check happens before middleware pipeline -- cached responses skip middleware entirely"
  - "429 retry loop lives inside the middleware executor callback -- middleware wraps the full retry cycle"

patterns-established:
  - "Key provider pattern: normalizeKeyProvider() wraps string/async into {getKey, invalidate} with shared pending promise"
  - "Request pipeline: cache check -> middleware.onRequest -> rate limit acquire -> fetch -> rate limit update -> middleware.onResponse -> cache store"
  - "Error mapping: status code switch in mapError() produces typed error subclasses"

requirements-completed: [HTTP-01, HTTP-02]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 2 Plan 4: HTTP Client & createClient Summary

**HTTP client with race-safe key rotation, createClient factory composing rate limiter + cache + middleware, and dual ESM/CJS subpath exports for @wardbox/whisper and @wardbox/whisper/core**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T16:58:34Z
- **Completed:** 2026-03-17T17:02:34Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- HTTP client builds correct Riot API URLs, sends X-Riot-Token header, maps all error statuses to typed error classes, with automatic key invalidation and single retry on 401/403
- createClient factory composes HTTP client, rate limiter, cache, and middleware into a unified request pipeline with opt-out support (cache:false, rateLimiter:false)
- Core primitives exported from @wardbox/whisper/core; createClient from @wardbox/whisper root
- Build produces 8 dual ESM+CJS entry points; all 125 tests pass; Biome clean

## Task Commits

Each task was committed atomically:

1. **Task 1: HTTP client with key provider and URL building** - `ef8d155` (feat, TDD)
2. **Task 2: createClient factory, core barrel, subpath exports** - `ce7815c` (feat)

## Files Created/Modified
- `packages/whisper/src/core/http.ts` - Low-level fetch wrapper with URL building, key provider, error mapping
- `packages/whisper/src/core/http.test.ts` - 17 unit tests for HTTP client
- `packages/whisper/src/core/client.ts` - createClient factory composing all subsystems
- `packages/whisper/src/core/client.test.ts` - 8 integration tests for createClient
- `packages/whisper/src/core/index.ts` - Public barrel for @wardbox/whisper/core
- `packages/whisper/src/index.ts` - Root barrel for @wardbox/whisper
- `packages/whisper/tsdown.config.ts` - Added root + core entry points
- `packages/whisper/package.json` - Added "." and "./core" subpath exports

## Decisions Made
- KeyProvider uses object pattern {getKey(), invalidate()} with shared pending promise for race-safe key rotation
- Cache check happens before middleware pipeline -- cached responses bypass middleware entirely for performance
- 429 retry loop (max 3 retries) is inside the middleware executor callback, so middleware wraps the full retry cycle
- Biome autofix applied to existing core files (formatting only, no behavior changes)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Vitest 4.x dropped the `-x` flag; replaced with `--bail=1` for fail-fast behavior
- `pnpm vitest` requires running from package directory (`packages/whisper`); used `npx vitest` with cd

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All core infrastructure complete: types, errors, middleware, cache, rate limiter, HTTP client, createClient
- Phase 2 fully done -- ready for Phase 3 (schema generation) which will consume createClient for integration tests
- Game modules (Phase 4+) can import createClient and build typed wrappers

---
*Phase: 02-core-infrastructure*
*Completed: 2026-03-17*
