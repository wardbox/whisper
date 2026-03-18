---
phase: 04-lol-and-shared-endpoints
plan: 01
subsystem: api
tags: [riot-api, typescript, account-v1, override-types, dto]

# Dependency graph
requires:
  - phase: 03-schema-generation
    provides: Generated types (Account, LolLeagueEntry, LolCurrentGameInfo)
provides:
  - 6 override type files for DTOs not captured by schema generation
  - Account-V1 endpoint module with 3 methods (getByPuuid, getByRiotId, getByGame)
  - ActiveShard type for account-v1.getByGame
  - LeagueList, MiniSeries, ClashTeam, ApexPlayerInfo, FeaturedGames, tournament DTOs
affects: [04-02, 04-03, 04-04, 04-05, 05-tft-and-other-endpoints]

# Tech tracking
tech-stack:
  added: []
  patterns: [namespace-object-endpoint-pattern, mock-client-test-pattern]

key-files:
  created:
    - packages/whisper/src/types/overrides/lol-league.ts
    - packages/whisper/src/types/overrides/lol-clash.ts
    - packages/whisper/src/types/overrides/lol-challenges.ts
    - packages/whisper/src/types/overrides/lol-spectator.ts
    - packages/whisper/src/types/overrides/lol-tournament.ts
    - packages/whisper/src/types/overrides/riot-account.ts
    - packages/whisper/src/riot/account-v1.ts
    - packages/whisper/src/riot/account-v1.test.ts
  modified: []

key-decisions:
  - "FeaturedGameInfo defined separately from LolCurrentGameInfo -- featured games have a simpler participant shape (no perks, no customization objects)"
  - "ClashTeamPlayer exported as separate interface rather than inline type for reusability"
  - "FeaturedGameBannedChampion extracted as named type for consistency with generated BannedChampion"

patterns-established:
  - "Override type files: one file per API group in src/types/overrides/, JSDoc on every field"
  - "Endpoint namespace: const object with async methods, as const, client as first param, route as second"
  - "Mock client test helper: mockClient(data) returns WhisperClient stub with vi.fn()"
  - "Type safety tests: @ts-expect-error to verify wrong route types are compile errors"

requirements-completed: [ENDP-06, ENDP-08]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 4 Plan 01: Override Types and Account-V1 Summary

**6 hand-written override type files for missing DTOs plus Account-V1 namespace with 3 RegionalRoute methods and 7 passing tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T03:32:15Z
- **Completed:** 2026-03-18T03:35:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created all 6 override type files covering LeagueList, MiniSeries, ClashTeam, ApexPlayerInfo, FeaturedGames, tournament-v5 DTOs, and ActiveShard
- Implemented Account-V1 endpoint module with getByPuuid, getByRiotId, getByGame using RegionalRoute
- Full TSDoc coverage on every method and field for IDE tooltip support
- Type safety verified -- platform routes produce compile errors on Account-V1 methods

## Task Commits

Each task was committed atomically:

1. **Task 1: Create all override type files for missing DTOs** - `b0a4c1e` (feat)
2. **Task 2: Implement Account-V1 endpoint module with tests** - `06d4e35` (feat)

## Files Created/Modified
- `packages/whisper/src/types/overrides/lol-league.ts` - LeagueList and MiniSeries for league-v4
- `packages/whisper/src/types/overrides/lol-clash.ts` - ClashTeam and ClashTeamPlayer for clash-v1
- `packages/whisper/src/types/overrides/lol-challenges.ts` - ApexPlayerInfo for challenges leaderboard
- `packages/whisper/src/types/overrides/lol-spectator.ts` - FeaturedGames, FeaturedGameInfo for spectator-v5
- `packages/whisper/src/types/overrides/lol-tournament.ts` - All tournament-v5 and tournament-stub-v5 DTOs
- `packages/whisper/src/types/overrides/riot-account.ts` - ActiveShard for account-v1.getByGame
- `packages/whisper/src/riot/account-v1.ts` - Account-V1 namespace object with 3 methods
- `packages/whisper/src/riot/account-v1.test.ts` - 7 unit tests for Account-V1

## Decisions Made
- FeaturedGameInfo defined as separate type from LolCurrentGameInfo since featured games use a simpler participant shape without perks or customization objects
- ClashTeamPlayer extracted as named interface for cleaner type organization
- FeaturedGameBannedChampion named type created for consistency with the generated BannedChampion interface

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in `src/types/generated/lol.ts` (from Phase 3 codegen output with numeric property names). Override files compile cleanly -- these errors are out of scope for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All override types in place for Plans 02-05 to reference when implementing LoL endpoint modules
- Account-V1 module establishes the namespace object pattern that all subsequent endpoint modules will follow
- mockClient test helper pattern ready for reuse across all endpoint test files

---
*Phase: 04-lol-and-shared-endpoints*
*Completed: 2026-03-17*
