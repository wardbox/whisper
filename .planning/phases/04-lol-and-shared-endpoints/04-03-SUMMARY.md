---
phase: 04-lol-and-shared-endpoints
plan: 03
subsystem: api
tags: [typescript, riot-api, clash, league, challenges, platform-routing]

requires:
  - phase: 04-lol-and-shared-endpoints
    provides: Override types (LeagueList, ClashTeam, ApexPlayerInfo) from Plan 01
provides:
  - clashV1 namespace with 4 methods
  - leagueV4 namespace with 6 methods
  - leagueExpV4 namespace with 1 method
  - lolChallengesV1 namespace with 6 methods
affects: [04-lol-and-shared-endpoints, 05-remaining-game-endpoints]

tech-stack:
  added: []
  patterns: [platform-routed endpoint modules with override type imports, pagination via query params]

key-files:
  created:
    - packages/whisper/src/lol/clash-v1.ts
    - packages/whisper/src/lol/clash-v1.test.ts
    - packages/whisper/src/lol/league-v4.ts
    - packages/whisper/src/lol/league-v4.test.ts
    - packages/whisper/src/lol/league-exp-v4.ts
    - packages/whisper/src/lol/league-exp-v4.test.ts
    - packages/whisper/src/lol/lol-challenges-v1.ts
    - packages/whisper/src/lol/lol-challenges-v1.test.ts
  modified:
    - packages/whisper/src/types/overrides/lol-clash.ts

key-decisions:
  - "Created ClashPlayer override type for clash-v1 getPlayersByPuuid -- generated PlayerInfo is for challenges, not clash"

patterns-established:
  - "Pagination pattern: optional { page?: number } mapped to query params via { params: { page: String(n) } }"

requirements-completed: [ENDP-01]

duration: 4min
completed: 2026-03-17
---

# Phase 04 Plan 03: Override-Type Endpoint Modules Summary

**4 PlatformRoute LoL endpoint modules (clash, league, league-exp, challenges) with 17 methods using generated and override types**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T03:57:24Z
- **Completed:** 2026-03-18T04:01:07Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Implemented clash-v1 (4 methods), league-v4 (6 methods), league-exp-v4 (1 method), lol-challenges-v1 (6 methods)
- All 17 methods are PlatformRoute-only with compile-time type safety via @ts-expect-error tests
- Override types (LeagueList, ClashTeam, ApexPlayerInfo) correctly wired from Plan 01
- Pagination support for league entry endpoints via optional page query parameter
- 40 tests passing across 4 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement clash-v1, league-v4, and league-exp-v4 modules with tests** - `dd7b14c` (feat)
2. **Task 2: Implement lol-challenges-v1 module with tests** - `6cec27d` (feat)

## Files Created/Modified
- `packages/whisper/src/lol/clash-v1.ts` - Clash API (4 methods: getPlayersByPuuid, getTournaments, getTournamentById, getTeamById)
- `packages/whisper/src/lol/clash-v1.test.ts` - 11 tests including type safety
- `packages/whisper/src/lol/league-v4.ts` - League API (6 methods: getChallengerLeague, getGrandmasterLeague, getMasterLeague, getEntriesByPuuid, getEntries, getById)
- `packages/whisper/src/lol/league-v4.test.ts` - 10 tests including pagination and type safety
- `packages/whisper/src/lol/league-exp-v4.ts` - League Experimental API (1 method: getEntries with pagination)
- `packages/whisper/src/lol/league-exp-v4.test.ts` - 4 tests including pagination and type safety
- `packages/whisper/src/lol/lol-challenges-v1.ts` - Challenges API (6 methods: getConfig, getPercentiles, getChallengeConfig, getChallengePercentiles, getChallengeLeaderboard, getPlayerData)
- `packages/whisper/src/lol/lol-challenges-v1.test.ts` - 13 tests including type safety
- `packages/whisper/src/types/overrides/lol-clash.ts` - Added ClashPlayer interface for getPlayersByPuuid return type

## Decisions Made
- Created `ClashPlayer` override type because the plan's `PlayerInfo` from generated types is the challenges player data type (categoryPoints, challenges, preferences), not the clash player type (puuid, teamId, position, role). The clash-v1 schema only captured TournamentDTO, not PlayerDTO.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added ClashPlayer override type for clash-v1**
- **Found during:** Task 1 (clash-v1 implementation)
- **Issue:** Plan specified importing `PlayerInfo` from generated types for clash-v1.getPlayersByPuuid, but `PlayerInfo` is the challenges player data type with entirely different fields (categoryPoints, challenges, preferences). The clash PlayerDTO has (puuid, teamId, position, role).
- **Fix:** Created `ClashPlayer` interface in lol-clash.ts overrides with correct fields
- **Files modified:** packages/whisper/src/types/overrides/lol-clash.ts
- **Verification:** Tests pass, type structure matches Riot API PlayerDTO
- **Committed in:** dd7b14c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical type)
**Impact on plan:** Essential for type correctness. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in generated type files (lol.ts, val.ts) cause `tsc --noEmit` to fail. These are out-of-scope and pre-existing from Phase 3 schema generation (numeric property keys in ChallengePercentiles, challenges with numeric keys starting with digits). skipLibCheck is already true. Tests validate type safety independently.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 17 of 31 total API methods now implemented across Plans 01-03
- Remaining LoL modules (match-v5, spectator-v5, champion-mastery-v4, champion-v3, summoner-v4, lol-status-v4) ready for Plans 04-05
- Override type pattern established and working correctly

## Self-Check: PASSED

All 8 created files verified present. Both task commits (dd7b14c, 6cec27d) verified in git log.

---
*Phase: 04-lol-and-shared-endpoints*
*Completed: 2026-03-17*
