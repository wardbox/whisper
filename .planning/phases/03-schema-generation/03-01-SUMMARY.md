---
phase: 03-schema-generation
plan: 01
subsystem: tooling
tags: [schema-generation, codegen, riot-api, vitest, typescript]

# Dependency graph
requires:
  - phase: 02-core-infrastructure
    provides: WhisperClient, createClient, ApiResponse, PlatformRoute, RegionalRoute
provides:
  - Schema runner internal types (FieldDef, TypeSchema, SchemaFile, EndpointGroup, EndpointDef, DiscoveredData)
  - Complete endpoint registry for all ~26 hittable Riot API groups
  - Dynamic data discovery chain for LoL, TFT, Valorant, LoR
  - Schema extraction and merge logic with deterministic JSON output
affects: [03-02, codegen, schema-runner, endpoint-modules]

# Tech tracking
tech-stack:
  added: []
  patterns: [TDD for schema logic, endpoint registry pattern, dynamic discovery chain]

key-files:
  created:
    - scripts/generate-schema/types.ts
    - scripts/generate-schema/schema.ts
    - scripts/generate-schema/schema.test.ts
    - scripts/generate-schema/registry.ts
    - scripts/generate-schema/registry.test.ts
    - scripts/generate-schema/discovery.ts
  modified:
    - packages/whisper/vitest.config.ts

key-decisions:
  - "Loose ApiClient interface in discovery.ts avoids cross-package import issues"
  - "Vitest config uses relative path ../../scripts/**/*.test.ts for script test discovery"
  - "Removed duplicate lol-status-v4 entry from registry during implementation"

patterns-established:
  - "Endpoint registry as typed array of EndpointGroup with EndpointDef children"
  - "Schema extraction via extractFieldDef recursive type inference"
  - "sortKeys for deterministic JSON output in all schema files"

requirements-completed: [SCHEMA-01]

# Metrics
duration: 5min
completed: 2026-03-17
---

# Phase 3 Plan 1: Schema Runner Core Modules Summary

**Schema extraction, merge logic, 26-group endpoint registry, and dynamic discovery chain for LoL/TFT/Val/LoR with 42 passing unit tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T18:35:31Z
- **Completed:** 2026-03-17T18:40:54Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Schema extraction correctly maps all JS types (string, integer, number, boolean, array, object, null) to FieldDef
- Merge logic marks optional fields (present in one response but not another) and nullable fields (null in one, typed in another)
- Endpoint registry covers 26 hittable API groups excluding RSO-only and tournament groups
- Discovery chain finds valid test data dynamically from challenger leagues, leaderboards, and content endpoints

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema runner types, schema extraction, and unit tests** - `346a01c` (feat)
2. **Task 2: Endpoint registry, dynamic discovery, and registry tests** - `c06db49` (feat)

_Note: TDD tasks combined RED+GREEN into single commits since types.ts was needed for both._

## Files Created/Modified
- `scripts/generate-schema/types.ts` - Internal types: FieldDef, TypeSchema, SchemaFile, EndpointGroup, EndpointDef, DiscoveredData
- `scripts/generate-schema/schema.ts` - extractSchema, mergeSchemas, sortKeys, writeSchemaFile
- `scripts/generate-schema/schema.test.ts` - 23 unit tests for schema extraction, merge, and deterministic output
- `scripts/generate-schema/registry.ts` - ENDPOINT_REGISTRY with 26 API groups covering all hittable endpoints
- `scripts/generate-schema/registry.test.ts` - 19 unit tests for registry completeness, routing, and exclusions
- `scripts/generate-schema/discovery.ts` - discoverData() chain for LoL, TFT, Valorant, and LoR
- `packages/whisper/vitest.config.ts` - Added scripts/**/*.test.ts to test includes

## Decisions Made
- Used a loose ApiClient interface in discovery.ts instead of importing WhisperClient directly to avoid cross-package import complexity (scripts/ is outside the whisper package)
- Vitest config uses relative path `../../scripts/**/*.test.ts` since vitest resolves from the package root
- Removed accidental duplicate lol-status-v4 entry caught during implementation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate lol-status-v4 registry entry**
- **Found during:** Task 2 (Registry implementation)
- **Issue:** Registry had two identical lol-status-v4 group entries
- **Fix:** Removed the duplicate
- **Files modified:** scripts/generate-schema/registry.ts
- **Verification:** Registry tests pass, no duplicate names
- **Committed in:** c06db49 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor self-correction during implementation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema runner core modules ready for Plan 02 (orchestrator + codegen)
- Types, registry, discovery, and schema extraction are all tested and ready for integration
- The orchestrator (Plan 02) will wire these together into the `pnpm generate-schema` command

---
*Phase: 03-schema-generation*
*Completed: 2026-03-17*
