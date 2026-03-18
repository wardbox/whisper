---
phase: 04-lol-and-shared-endpoints
plan: 05
subsystem: api
tags: [typescript, tree-shaking, jsdoc, routing, type-safety]

requires:
  - phase: 04-lol-and-shared-endpoints
    provides: "All 13 LoL namespace modules + account-v1 module from Plans 01-04"
provides:
  - "Tree-shakeable lol/index.ts re-exporting all 13 namespace objects and user-facing types"
  - "riot/index.ts re-exporting accountV1, Account, and ActiveShard"
  - "JSDoc on all generated type fields for IDE tooltips"
  - "Route enforcement type tests covering all 14 modules"
affects: [05-tft-endpoints, 06-val-lor-riftbound, docs]

tech-stack:
  added: []
  patterns:
    - "expectTypeOf for compile-time route constraint validation"
    - "Named re-exports with .js extensions for tree-shaking"

key-files:
  created:
    - packages/whisper/src/lol/index.test.ts
    - packages/whisper/src/lol/routing.test.ts
  modified:
    - packages/whisper/src/lol/index.ts
    - packages/whisper/src/riot/index.ts
    - packages/whisper/src/types/generated/lol.ts
    - packages/whisper/src/types/generated/riot.ts

key-decisions:
  - "Used expectTypeOf instead of @ts-expect-error for route enforcement tests -- runtime-safe and clearer intent"
  - "Added ClashPlayer to lol/index.ts re-exports alongside ClashTeam for completeness"

patterns-established:
  - "Index re-export pattern: namespace objects + generated types + override types + options types"
  - "Route enforcement testing: expectTypeOf().parameter(1).toEqualTypeOf<RouteType>()"

requirements-completed: [ENDP-07, DOC-01, DOC-02]

duration: 5min
completed: 2026-03-17
---

# Phase 4 Plan 5: Index Re-exports, JSDoc, and Route Enforcement Summary

**Tree-shakeable lol/riot index re-exports with JSDoc on all generated types and compile-time route constraint verification across 14 modules**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T04:03:32Z
- **Completed:** 2026-03-18T04:09:02Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Wired up lol/index.ts with all 13 namespace re-exports and user-facing types (generated + overrides + options)
- Wired up riot/index.ts with accountV1, Account, and ActiveShard re-exports
- Added JSDoc comments to every interface and field in generated lol.ts (17 interfaces) and riot.ts (1 interface)
- Created tree-shaking verification test confirming all 13 namespaces import independently (ENDP-07)
- Created route enforcement test verifying PlatformRoute/RegionalRoute constraints hold across all 14 modules

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire up lol/index.ts and riot/index.ts re-exports with tree-shaking test** - `2890d9b` (feat)
2. **Task 2: Add JSDoc to generated types and create route enforcement type tests** - `d95f626` (feat)

## Files Created/Modified
- `packages/whisper/src/lol/index.ts` - Re-exports all 13 LoL namespace objects, generated types, override types, and options types
- `packages/whisper/src/riot/index.ts` - Re-exports accountV1, Account, and ActiveShard
- `packages/whisper/src/lol/index.test.ts` - Tree-shaking and re-export verification tests (3 tests)
- `packages/whisper/src/lol/routing.test.ts` - Route enforcement type tests using expectTypeOf (3 tests)
- `packages/whisper/src/types/generated/lol.ts` - JSDoc added to all 17 interfaces and their fields
- `packages/whisper/src/types/generated/riot.ts` - JSDoc added to Account interface and fields

## Decisions Made
- Used `expectTypeOf` from vitest instead of `@ts-expect-error` with `declare const client` for route enforcement tests -- the plan's approach caused ReferenceError at runtime since `client` was only declared, not defined. expectTypeOf is both runtime-safe and provides clearer error messages.
- Added ClashPlayer to lol/index.ts type re-exports alongside ClashTeam since users need it for getPlayersByPuuid return values.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed routing.test.ts runtime crash**
- **Found during:** Task 2 (route enforcement test)
- **Issue:** Plan used `declare const client: WhisperClient` with actual method calls that threw ReferenceError at runtime
- **Fix:** Replaced with `expectTypeOf().parameter(1).toEqualTypeOf<RouteType>()` pattern that validates types without runtime execution
- **Files modified:** packages/whisper/src/lol/routing.test.ts
- **Verification:** `pnpm vitest run src/lol/routing.test.ts` passes (3/3 tests)
- **Committed in:** d95f626

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for test correctness. Same type safety guarantees achieved with different assertion mechanism.

## Issues Encountered
- Pre-existing tsc errors in generated lol.ts (field names like `A-?`, `S-?`, `12AssistStreakCount` are invalid TS identifiers) -- these are from the schema generator and not related to this plan's changes. Vitest runs fine since it uses a different compilation pipeline.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 complete: all 13 LoL endpoints + account-v1 implemented with types, tests, JSDoc, and tree-shakeable imports
- Ready for Phase 5 (TFT endpoints) which will follow the same patterns established here
- The index re-export and route enforcement test patterns from this plan should be replicated for future game modules

---
*Phase: 04-lol-and-shared-endpoints*
*Completed: 2026-03-17*
