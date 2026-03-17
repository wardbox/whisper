---
phase: 01-foundation
plan: 02
subsystem: types
tags: [typescript, routing, platform, regional, union-types, type-safety]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: pnpm workspace scaffold, tsconfig, build tooling
provides:
  - PlatformRoute union type (17 platform string literals)
  - RegionalRoute union type (4 regional string literals)
  - PLATFORM and REGIONAL constants for IDE autocomplete
  - toRegional() platform-to-region mapping utility
  - Barrel export from types/index.ts
affects: [core-http-client, lol-endpoints, tft-endpoints, val-endpoints, lor-endpoints, riftbound-endpoints, riot-shared]

# Tech tracking
tech-stack:
  added: []
  patterns: [string-literal-union-types, as-const-satisfies, ts-expect-error-negative-tests]

key-files:
  created:
    - packages/whisper/src/types/platform.ts
    - packages/whisper/src/types/regional.ts
    - packages/whisper/src/types/routing.ts
    - packages/whisper/src/types/index.ts
    - packages/whisper/src/types/platform.test.ts
    - packages/whisper/src/types/regional.test.ts
    - packages/whisper/src/types/routing.test.ts
  modified:
    - tsconfig.base.json

key-decisions:
  - "Set skipLibCheck: true in tsconfig.base.json — vitest 4.x types incompatible with exactOptionalPropertyTypes: true"

patterns-established:
  - "String literal union types with as const satisfies Record for routing values"
  - "Use @ts-expect-error in tests for compile-time negative type assertions (TYPE-04)"
  - "NodeNext module resolution with explicit .js import extensions"

requirements-completed: [TYPE-01, TYPE-02, TYPE-03, TYPE-04]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 1 Plan 2: Routing Types Summary

**PlatformRoute (17 values) and RegionalRoute (4 values) union types with toRegional() mapping and compile-time type safety tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T14:19:16Z
- **Completed:** 2026-03-17T14:22:02Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- PlatformRoute union type covering all 17 Riot API platform routing values
- RegionalRoute union type covering all 4 regional routing values
- PLATFORM and REGIONAL constant objects for IDE autocomplete with `as const satisfies` pattern
- toRegional() utility mapping every platform to its correct region
- 14 tests passing including compile-time type safety assertions via @ts-expect-error

## Task Commits

Each task was committed atomically:

1. **Task 1: Create routing type files** - `9cf051b` (feat)
2. **Task 2: Create routing type tests** - `71cf80c` (test)

## Files Created/Modified
- `packages/whisper/src/types/platform.ts` - PlatformRoute union type and PLATFORM constants
- `packages/whisper/src/types/regional.ts` - RegionalRoute union type and REGIONAL constants
- `packages/whisper/src/types/routing.ts` - toRegional() mapping utility
- `packages/whisper/src/types/index.ts` - Barrel export for all types
- `packages/whisper/src/types/platform.test.ts` - Platform type tests including TYPE-04 negative assertions
- `packages/whisper/src/types/regional.test.ts` - Regional type tests including TYPE-04 negative assertions
- `packages/whisper/src/types/routing.test.ts` - toRegional mapping tests for all 17 platforms
- `tsconfig.base.json` - Set skipLibCheck: true for vitest 4.x compatibility

## Decisions Made
- Set skipLibCheck: true in tsconfig.base.json because vitest 4.x type definitions have incompatibilities with exactOptionalPropertyTypes: true (pre-existing issue in node_modules, not in project code)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Set skipLibCheck: true in tsconfig.base.json**
- **Found during:** Task 1 (type file verification)
- **Issue:** vitest 4.x type definitions fail tsc with exactOptionalPropertyTypes: true — FailureScreenshotArtifactAttachment and Disposable type errors in node_modules
- **Fix:** Changed skipLibCheck from false to true in tsconfig.base.json
- **Files modified:** tsconfig.base.json
- **Verification:** tsc --noEmit exits 0
- **Committed in:** 9cf051b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to unblock tsc verification. skipLibCheck: true is standard practice and does not affect project type safety.

## Issues Encountered
None beyond the skipLibCheck deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Routing type primitives ready for all endpoint modules (Phases 4-5)
- Core HTTP client (Phase 2) can import PlatformRoute/RegionalRoute for method signatures
- Phase 1 foundation complete (workspace + types)

## Self-Check

PASSED - All 8 files found, both commit hashes verified (9cf051b, 71cf80c)

---
*Phase: 01-foundation*
*Completed: 2026-03-17*
