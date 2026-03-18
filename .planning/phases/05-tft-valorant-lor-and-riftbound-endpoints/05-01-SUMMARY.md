---
phase: 05-tft-valorant-lor-and-riftbound-endpoints
plan: 01
subsystem: api
tags: [tft, riot-api, typescript, namespace-objects, tree-shaking]

# Dependency graph
requires:
  - phase: 04-lol-and-shared-endpoints
    provides: LoL endpoint namespace pattern, WhisperClient interface, routing types, test patterns
provides:
  - 5 TFT endpoint namespace objects covering 13 Riot API endpoints
  - TftLeagueEntry and TftTopRatedLadderEntry override types
  - Tree-shakeable TFT barrel exports via @wardbox/whisper/tft
  - Route enforcement type tests for PlatformRoute/RegionalRoute
affects: [05-02-PLAN, 05-03-PLAN, docs, schema-generation]

# Tech tracking
tech-stack:
  added: []
  patterns: [TFT namespace object pattern following Phase 4 LoL conventions]

key-files:
  created:
    - packages/whisper/src/tft/tft-match-v1.ts
    - packages/whisper/src/tft/tft-league-v1.ts
    - packages/whisper/src/tft/tft-summoner-v1.ts
    - packages/whisper/src/tft/tft-status-v1.ts
    - packages/whisper/src/tft/spectator-tft-v5.ts
    - packages/whisper/src/tft/index.ts
    - packages/whisper/src/tft/routing.test.ts
    - packages/whisper/src/types/overrides/tft-league.ts
  modified:
    - packages/whisper/src/types/generated/tft.ts

key-decisions:
  - "TFT spectator path starts with /lol/ not /tft/ per Riot API convention"
  - "TFT summoner getByAccessToken passes RSO token via Authorization Bearer header"
  - "TFT league getChallengerLeague/getGrandmasterLeague/getMasterLeague accept optional queue filter (RANKED_TFT or RANKED_TFT_DOUBLE_UP)"
  - "Added JSDoc to generated tft.ts types for IDE tooltip support despite auto-generated header"

patterns-established:
  - "TFT endpoints follow identical namespace object pattern as LoL Phase 4"
  - "RSO-authenticated endpoints use { headers: { Authorization: Bearer token } } pattern"

requirements-completed: [ENDP-02]

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 5 Plan 01: TFT Endpoints Summary

**All 5 TFT API groups (13 endpoints) implemented as typed namespace objects with RegionalRoute/PlatformRoute enforcement, override types, and barrel re-exports**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T16:21:54Z
- **Completed:** 2026-03-18T17:00:55Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Implemented tft-match-v1 (RegionalRoute, 2 endpoints), tft-league-v1 (PlatformRoute, 7 endpoints), tft-summoner-v1 (PlatformRoute, 2 endpoints), tft-status-v1 (PlatformRoute, 1 endpoint), spectator-tft-v5 (PlatformRoute, 1 endpoint)
- Created TftLeagueEntry and TftTopRatedLadderEntry override types for league entry endpoints
- Full barrel re-exports in index.ts with generated types, override types, and options types
- Route enforcement type tests verifying PlatformRoute/RegionalRoute constraints on all modules
- 49 tests passing covering data unwrapping, path correctness, query params, error propagation, and type safety

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TFT override types and all 5 endpoint modules with tests** - `b4279f4` (feat)
2. **Task 2: Create TFT index re-exports and route enforcement type tests** - `db90a5a` (already committed by prior plan execution)

## Files Created/Modified
- `packages/whisper/src/types/overrides/tft-league.ts` - TftLeagueEntry and TftTopRatedLadderEntry override types
- `packages/whisper/src/tft/tft-match-v1.ts` - TFT match endpoint namespace (RegionalRoute, getMatchIdsByPuuid, getMatch)
- `packages/whisper/src/tft/tft-match-v1.test.ts` - Tests for tft-match-v1
- `packages/whisper/src/tft/tft-league-v1.ts` - TFT league endpoint namespace (PlatformRoute, 7 methods)
- `packages/whisper/src/tft/tft-league-v1.test.ts` - Tests for tft-league-v1
- `packages/whisper/src/tft/tft-summoner-v1.ts` - TFT summoner endpoint namespace (PlatformRoute, getByPuuid, getByAccessToken)
- `packages/whisper/src/tft/tft-summoner-v1.test.ts` - Tests for tft-summoner-v1
- `packages/whisper/src/tft/tft-status-v1.ts` - TFT status endpoint namespace (PlatformRoute, getPlatformData)
- `packages/whisper/src/tft/tft-status-v1.test.ts` - Tests for tft-status-v1
- `packages/whisper/src/tft/spectator-tft-v5.ts` - TFT spectator endpoint namespace (PlatformRoute, getCurrentGame)
- `packages/whisper/src/tft/spectator-tft-v5.test.ts` - Tests for spectator-tft-v5
- `packages/whisper/src/tft/index.ts` - Barrel re-exports for all TFT namespaces and types
- `packages/whisper/src/tft/index.test.ts` - Index export verification tests
- `packages/whisper/src/tft/routing.test.ts` - Route enforcement type tests
- `packages/whisper/src/types/generated/tft.ts` - JSDoc comments added to all generated TFT interfaces

## Decisions Made
- TFT spectator endpoint uses `/lol/spectator/tft/v5/active-games/by-puuid/` path (starts with /lol/, not /tft/) per Riot API convention
- TFT summoner getByAccessToken passes RSO token via Authorization Bearer header in request options
- getChallengerLeague, getGrandmasterLeague, getMasterLeague accept optional queue filter rather than required queue parameter (unlike LoL league-v4)
- Added JSDoc to auto-generated tft.ts types for IDE tooltip support, acknowledging schema regeneration may overwrite

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Task 2 files (index.ts, index.test.ts, routing.test.ts) were already committed by a prior plan 05-03 execution with identical content. No additional commit needed for Task 2.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- TFT coverage complete (5/5 API groups, 13/13 endpoints)
- Ready for Plan 05-02 (Valorant endpoints) and Plan 05-03 (LoR and Riftbound endpoints)
- Tree-shakeable imports work via `@wardbox/whisper/tft` entry point

## Self-Check: PASSED

- All 16 files verified present on disk
- Task 1 commit b4279f4 verified in git log
- Task 2 files verified committed in prior db90a5a
- 49/49 tests passing
- Build succeeds with TFT entry point (18.97 kB types)

---
*Phase: 05-tft-valorant-lor-and-riftbound-endpoints*
*Completed: 2026-03-18*
