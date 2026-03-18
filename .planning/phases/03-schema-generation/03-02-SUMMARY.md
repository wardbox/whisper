---
phase: 03-schema-generation
plan: 02
subsystem: codegen
tags: [typescript, codegen, schema, ci, github-actions, tsx]

# Dependency graph
requires:
  - phase: 03-schema-generation/01
    provides: Schema extraction (extractSchema, mergeSchemas, writeSchemaFile), types (SchemaFile, FieldDef, TypeSchema), endpoint registry, discovery module
provides:
  - TypeScript codegen from schema JSON with naming rules and enum literal unions
  - Orchestrator entry point wiring full pipeline (discovery -> fetch -> extract -> codegen)
  - pnpm generate-schema single-command entry
  - CI schema drift detection workflow with auto-PR
  - Generated types directory scaffolding and overrides mechanism
affects: [04-endpoint-modules, 05-endpoint-modules]

# Tech tracking
tech-stack:
  added: [tsx]
  patterns: [known-enum-literal-unions, ambiguous-name-game-prefix, dto-suffix-stripping, override-skip-mechanism]

key-files:
  created:
    - scripts/generate-schema/codegen.ts
    - scripts/generate-schema/codegen.test.ts
    - scripts/generate-schema/index.ts
    - packages/whisper/src/types/generated/index.ts
    - packages/whisper/src/types/overrides/.gitkeep
    - .github/workflows/schema-drift.yml
    - scripts/schemas/.gitkeep
  modified:
    - packages/whisper/package.json

key-decisions:
  - "KNOWN_ENUMS uses conservative field-name-based matching -- only well-known enum fields included, unknown strings fall back to plain string"
  - "import.meta.dirname replaced with fileURLToPath(import.meta.url) for tsx compatibility"
  - "Array of complex types wrapped in parens for valid TypeScript syntax: (Type)[]"

patterns-established:
  - "Known enum literal unions: KNOWN_ENUMS registry maps field names to string literal union values"
  - "Override mechanism: hasOverride checks src/types/overrides/{game}/{TypeName}.ts, skips codegen and re-exports"
  - "Per-game output files: codegen groups types by game prefix into separate .ts files"

requirements-completed: [SCHEMA-02, SCHEMA-03]

# Metrics
duration: 5min
completed: 2026-03-17
---

# Phase 3 Plan 2: TypeScript Codegen and Pipeline Wiring Summary

**TypeScript codegen from schema JSON with KNOWN_ENUMS literal unions, full orchestrator pipeline via tsx, and CI drift detection workflow**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T18:43:22Z
- **Completed:** 2026-03-17T18:48:31Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Codegen module producing valid TypeScript interfaces from schema JSON with DTO suffix stripping, ambiguous name game-prefixing, and known enum literal unions
- Full orchestrator pipeline: discovery -> fetch -> extract -> codegen wired as single `pnpm generate-schema` command
- CI workflow for weekly schema drift detection with auto-PR creation
- Override mechanism that skips codegen for hand-written types and re-exports them

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Codegen failing tests** - `1bb73c9` (test)
2. **Task 1 (GREEN): Codegen implementation + scaffolding** - `7d64534` (feat)
3. **Task 2: Orchestrator, package script, CI workflow** - `f798a35` (feat)

_Note: Task 1 used TDD with RED/GREEN phases._

## Files Created/Modified
- `scripts/generate-schema/codegen.ts` - TypeScript interface generator with naming rules, enum literal unions, and override support
- `scripts/generate-schema/codegen.test.ts` - 44 unit tests covering all codegen behaviors
- `scripts/generate-schema/index.ts` - Orchestrator entry point wiring full pipeline
- `packages/whisper/src/types/generated/index.ts` - Placeholder barrel file for generated types
- `packages/whisper/src/types/overrides/.gitkeep` - Directory placeholder for hand-written type overrides
- `.github/workflows/schema-drift.yml` - Weekly CI workflow with auto-PR for schema changes
- `scripts/schemas/.gitkeep` - Directory placeholder for schema JSON output
- `packages/whisper/package.json` - Added generate-schema script and tsx devDependency

## Decisions Made
- Used `fileURLToPath(import.meta.url)` instead of `import.meta.dirname` for tsx compatibility
- KNOWN_ENUMS is conservative -- only well-known enum field names included; new enums added via overrides or registry expansion
- Array of complex types use parens wrapping `(Type)[]` for valid TypeScript syntax

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed import.meta.dirname unavailability in tsx**
- **Found during:** Task 2 (Orchestrator entry point)
- **Issue:** `import.meta.dirname` returned undefined when run via tsx, causing path.resolve to throw
- **Fix:** Replaced with `path.dirname(fileURLToPath(import.meta.url))` pattern
- **Files modified:** scripts/generate-schema/index.ts
- **Verification:** Entry point runs and prints RIOT_API_KEY error as expected
- **Committed in:** f798a35 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for tsx runtime compatibility. No scope creep.

## Issues Encountered
None beyond the import.meta.dirname deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema generation pipeline is complete end-to-end
- Phase 3 fully done: extraction, registry, codegen, orchestrator, and CI drift detection all in place
- Ready for Phase 4 (endpoint modules) which will use generated types

---
*Phase: 03-schema-generation*
*Completed: 2026-03-17*
