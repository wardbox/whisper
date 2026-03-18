---
phase: 05-tft-valorant-lor-and-riftbound-endpoints
plan: 03
subsystem: api
tags: [lor, riftbound, regional-route, endpoints, tree-shaking]

# Dependency graph
requires:
  - phase: 04-lol-and-shared-endpoints
    provides: "Endpoint module patterns, WhisperClient interface, RegionalRoute type, mockClient test pattern"
  - phase: 03-schema-generation-and-types
    provides: "Generated LoR and Riftbound types (lor.ts, riftbound.ts)"
provides:
  - "lorRankedV1 namespace with getLeaderboards endpoint"
  - "lorStatusV1 namespace with getPlatformData endpoint"
  - "riftboundContentV1 namespace with getContent endpoint (locale query param)"
  - "Tree-shakeable lor and riftbound barrel re-exports"
  - "Route enforcement type tests for LoR and Riftbound"
affects: [06-docs-site, 07-ci-cd-and-publishing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RegionalRoute enforcement on all LoR and Riftbound endpoints"
    - "Optional locale query param pattern on riftbound-content-v1"

key-files:
  created:
    - packages/whisper/src/lor/lor-ranked-v1.ts
    - packages/whisper/src/lor/lor-status-v1.ts
    - packages/whisper/src/riftbound/riftbound-content-v1.ts
    - packages/whisper/src/lor/lor-ranked-v1.test.ts
    - packages/whisper/src/lor/lor-status-v1.test.ts
    - packages/whisper/src/riftbound/riftbound-content-v1.test.ts
    - packages/whisper/src/lor/index.test.ts
    - packages/whisper/src/lor/routing.test.ts
    - packages/whisper/src/riftbound/index.test.ts
    - packages/whisper/src/riftbound/routing.test.ts
  modified:
    - packages/whisper/src/lor/index.ts
    - packages/whisper/src/riftbound/index.ts
    - packages/whisper/src/types/generated/lor.ts
    - packages/whisper/src/types/generated/riftbound.ts

key-decisions:
  - "Only 2 LoR API groups confirmed active (lor-ranked-v1, lor-status-v1) -- lor-match-v1, lor-deck-v1, lor-inventory-v1 not captured by schema runner, treated as inactive per locked decision"
  - "Riftbound content endpoint uses optional locale query param pattern matching match-v5 optional params approach"

patterns-established:
  - "LoR endpoints use RegionalRoute exclusively (americas, europe, asia, sea)"
  - "Riftbound endpoints use RegionalRoute exclusively"
  - "Optional query params use conditional params object with undefined check"

requirements-completed: [ENDP-04, ENDP-05]

# Metrics
duration: 12min
completed: 2026-03-18
---

# Phase 05 Plan 03: LoR and Riftbound Endpoints Summary

**2 LoR endpoints (lor-ranked-v1, lor-status-v1) and 1 Riftbound endpoint (riftbound-content-v1) with RegionalRoute enforcement, tree-shakeable barrel exports, and 23 tests**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-18T16:21:46Z
- **Completed:** 2026-03-18T16:34:24Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Implemented lor-ranked-v1 with getLeaderboards and lor-status-v1 with getPlatformData, both using RegionalRoute
- Implemented riftbound-content-v1 with getContent supporting optional locale query parameter
- Replaced placeholder lor/index.ts and riftbound/index.ts with real barrel re-exports of namespace objects and types
- Added route enforcement type tests verifying RegionalRoute acceptance and PlatformRoute rejection for all endpoints
- Added comprehensive JSDoc to all generated LoR and Riftbound types
- Build produces lor/index.d.ts (5.64 kB) and riftbound/index.d.ts (3.34 kB)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LoR and Riftbound endpoint modules with tests** - `136efec` (feat)
2. **Task 2: Create LoR and Riftbound index re-exports and route enforcement type tests** - `5834677` (feat)

## Files Created/Modified
- `packages/whisper/src/lor/lor-ranked-v1.ts` - LoR ranked namespace with getLeaderboards (RegionalRoute)
- `packages/whisper/src/lor/lor-status-v1.ts` - LoR status namespace with getPlatformData (RegionalRoute)
- `packages/whisper/src/riftbound/riftbound-content-v1.ts` - Riftbound content namespace with getContent and locale option
- `packages/whisper/src/lor/lor-ranked-v1.test.ts` - Tests for lor-ranked-v1 (data, path, error, type safety)
- `packages/whisper/src/lor/lor-status-v1.test.ts` - Tests for lor-status-v1 (data, path, error, type safety)
- `packages/whisper/src/riftbound/riftbound-content-v1.test.ts` - Tests for riftbound-content-v1 (data, path, locale, error, type safety)
- `packages/whisper/src/lor/index.ts` - Barrel re-exporting lorRankedV1, lorStatusV1, and LoR types
- `packages/whisper/src/riftbound/index.ts` - Barrel re-exporting riftboundContentV1 and Riftbound types
- `packages/whisper/src/lor/index.test.ts` - Smoke test for LoR re-exports
- `packages/whisper/src/lor/routing.test.ts` - Route enforcement type tests for LoR
- `packages/whisper/src/riftbound/index.test.ts` - Smoke test for Riftbound re-exports
- `packages/whisper/src/riftbound/routing.test.ts` - Route enforcement type tests for Riftbound
- `packages/whisper/src/types/generated/lor.ts` - JSDoc added to all LoR generated types
- `packages/whisper/src/types/generated/riftbound.ts` - JSDoc added to all Riftbound generated types

## Decisions Made
- **LoR active endpoint count: 2 of 5 documented.** The schema runner only captured lor-ranked-v1 and lor-status-v1. Without Playwright available for the audit, and per the locked decision to "only wrap active endpoints," the remaining 3 (lor-match-v1, lor-deck-v1, lor-inventory-v1) were excluded. REQUIREMENTS.md should note actual LoR group count is 2, not 5.
- **Riftbound locale query param uses conditional params object.** Same pattern as match-v5 optional query params -- build a params object, only pass to client.request if non-empty.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Biome format fixes on riftbound-content-v1.test.ts and riftbound/index.ts**
- **Found during:** Task 2 (post-creation lint check)
- **Issue:** Biome formatter required object literal formatting adjustments and trailing newline on riftbound/index.ts
- **Fix:** Ran `pnpm check --fix` to auto-format
- **Files modified:** packages/whisper/src/riftbound/riftbound-content-v1.test.ts, packages/whisper/src/riftbound/index.ts
- **Verification:** `pnpm check` passes clean for lor/ and riftbound/ files
- **Committed in:** 5834677 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking -- format only)
**Impact on plan:** Trivial formatting fix. No scope creep.

## Issues Encountered
- Playwright audit for lor-match-v1, lor-deck-v1, lor-inventory-v1 was not possible without browser automation tooling. Decision was to proceed with the 2 confirmed-active endpoints and document the gap.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All LoR and Riftbound endpoints complete (2 LoR + 1 Riftbound = 3 API groups)
- Tree-shakeable imports work via `@wardbox/whisper/lor` and `@wardbox/whisper/riftbound`
- LoR coverage is 2 of 5 documented groups; if Riot reactivates lor-match-v1/lor-deck-v1/lor-inventory-v1, modules should be added
- Combined with Plans 01 (TFT) and 02 (Valorant), Phase 5 now covers all non-LoL game endpoints
- Ready for Phase 6 (docs) and Phase 7 (CI/CD and publishing)

## Self-Check: PASSED

All 14 files verified present. Both task commits (136efec, 5834677) verified in git log.

---
*Phase: 05-tft-valorant-lor-and-riftbound-endpoints*
*Completed: 2026-03-18*
