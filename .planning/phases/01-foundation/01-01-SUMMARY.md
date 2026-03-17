---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [pnpm, tsdown, vitest, biome, typescript, ci, github-actions, workspace]

# Dependency graph
requires: []
provides:
  - pnpm workspace with @wardbox/whisper library and whisper-docs packages
  - tsdown dual ESM+CJS build producing dist/ for 6 subpath entries
  - vitest 4.x test runner configured for node environment
  - biome 2.x lint + format passing clean
  - GitHub Actions CI with build, test, check, attw, and publint steps
  - Stub entry points for lol, tft, val, lor, riftbound, riot subpaths
affects: [02-core-infrastructure, 03-schema-generation, 04-lol-riot-endpoints, 05-game-endpoints, 06-docs]

# Tech tracking
tech-stack:
  added:
    - tsdown@0.21.4 (dual ESM+CJS bundler, Rolldown-powered)
    - typescript@5.8.3 (strict mode with NodeNext resolution)
    - vitest@4.1.0 (test runner, Node 22)
    - "@vitest/coverage-v8@4.1.0 (V8 coverage provider)"
    - "@biomejs/biome@2.4.7 (lint + format, single config)"
    - "@arethetypeswrong/cli@0.18.2 (CI type resolution checker)"
    - publint@0.3.18 (package.json exports linter)
  patterns:
    - pnpm workspace with shared tsconfig.base.json and biome.json at root
    - Subpath-only exports (no root barrel) for tree-shakeability
    - Nested import/require conditions in exports with separate .d.ts/.d.cts types
    - Biome 2.x ignore patterns use !pattern syntax in files.includes (no ignore key)

key-files:
  created:
    - pnpm-workspace.yaml
    - package.json (root, workspace scripts only)
    - tsconfig.base.json (strict TS config, NodeNext resolution)
    - biome.json (Biome 2.x config)
    - .nvmrc (Node 22)
    - .gitignore
    - packages/whisper/package.json (@wardbox/whisper, sideEffects:false, zero runtime deps)
    - packages/whisper/tsconfig.json (extends tsconfig.base.json)
    - packages/whisper/tsdown.config.ts (6 entry points, esm+cjs, dts, platform:neutral)
    - packages/whisper/vitest.config.ts (node environment, coverage)
    - packages/whisper/src/lol/index.ts (stub)
    - packages/whisper/src/tft/index.ts (stub)
    - packages/whisper/src/val/index.ts (stub)
    - packages/whisper/src/lor/index.ts (stub)
    - packages/whisper/src/riftbound/index.ts (stub)
    - packages/whisper/src/riot/index.ts (stub)
    - packages/whisper/src/smoke.test.ts (vitest smoke test)
    - packages/docs/package.json (placeholder)
    - .github/workflows/ci.yml (CI pipeline)
    - pnpm-lock.yaml
  modified:
    - biome.json (Biome 2.x ignore syntax fix)
    - packages/whisper/package.json (exports fixed for attw CJS types)

key-decisions:
  - "Biome 2.x changed files.ignore to !pattern syntax in files.includes — updated accordingly"
  - "exports field uses nested import/require conditions with .d.cts for CJS so attw passes node16(CJS)"
  - "node10 attw failures are expected and non-blocking — no main field is intentional (no root barrel)"
  - "smoke.test.ts added because vitest 4.x exits code 1 with zero test files"

patterns-established:
  - "Pattern: Workspace scripts use pnpm --filter @wardbox/whisper for package-scoped commands"
  - "Pattern: tsdown entry keys match subpath export names (lol/index -> ./lol export)"
  - "Pattern: CJS consumers get .d.cts types via nested require condition in exports"
  - "Pattern: Biome 2.x uses !pattern in files.includes array (not ignore key)"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 1 Plan 1: Workspace and Toolchain Scaffold Summary

**pnpm workspace with tsdown dual ESM+CJS build, Biome 2.x linting, Vitest 4.x testing, and GitHub Actions CI — all four commands exit 0 from a clean clone**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-17T13:58:37Z
- **Completed:** 2026-03-17T14:02:46Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments

- pnpm workspace resolving both @wardbox/whisper and whisper-docs packages
- tsdown building dual ESM (.js) and CJS (.cjs) output for all 6 subpath entries with .d.ts and .d.cts declaration files
- pnpm build, pnpm test, pnpm check all exit 0
- attw passes for node16 CJS/ESM and bundler resolution modes; publint reports "All good"
- CI workflow with build, test, check, attw, and publint steps on Node 22 LTS

## Task Commits

Each task was committed atomically:

1. **Task 1: Create workspace structure, root configs, and both package manifests** - `8ca732e` (chore)
2. **Task 2: Create tsdown config, stub entry points, vitest config, CI workflow** - `eaafe9a` (feat)

## Files Created/Modified

- `pnpm-workspace.yaml` - Workspace package listing
- `package.json` (root) - Workspace-level scripts, biome devDep, no type:module
- `tsconfig.base.json` - Shared strict TS config with NodeNext resolution and noUncheckedIndexedAccess
- `biome.json` - Biome 2.x config with !pattern ignores for dist/node_modules/generated
- `.nvmrc` - Node 22 pin
- `.gitignore` - node_modules, dist, coverage, .turbo
- `packages/whisper/package.json` - @wardbox/whisper manifest with sideEffects:false, nested exports, zero runtime deps
- `packages/whisper/tsconfig.json` - Extends tsconfig.base.json, rootDir src, outDir dist
- `packages/whisper/tsdown.config.ts` - 6 entry points, esm+cjs, dts:true, platform:neutral
- `packages/whisper/vitest.config.ts` - node environment, src/**/*.test.ts glob, v8 coverage
- `packages/whisper/src/*/index.ts` - Stub exports for lol, tft, val, lor, riftbound, riot
- `packages/whisper/src/smoke.test.ts` - Minimal vitest smoke test (vitest 4 exits 1 with no tests)
- `packages/docs/package.json` - Placeholder for Phase 6 docs
- `.github/workflows/ci.yml` - Full CI: install, build, test, check, attw, publint on Node 22
- `pnpm-lock.yaml` - Lockfile

## Decisions Made

- **Nested exports conditions:** Used `import.types`/`import.default` and `require.types`/`require.default` instead of a flat `types` key. This gives CJS consumers `.d.cts` types, fixing the attw `FalseESM` warning.
- **Biome 2.x ignore syntax:** The `files.ignore` key was removed in Biome 2.x. Exclusion patterns now use `!pattern` syntax inside `files.includes`.
- **smoke.test.ts:** Added per plan guidance — vitest 4.x exits code 1 when zero test files match the include glob.
- **node10 attw failures:** Non-blocking and expected. No `main` field and no `"."` root export is an intentional locked decision from the research phase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome 2.x `files.ignore` key renamed — fixed syntax**
- **Found during:** Task 2 (biome check run)
- **Issue:** The plan specified `"ignore": [...]` in `files` section. Biome 2.x removed this key; only `includes` with `!pattern` syntax is supported.
- **Fix:** Replaced `"ignore": ["**/dist/**", ...]` with `!` prefixed entries in `includes`. Also updated folder patterns from `**/dist/**` to `**/dist` (Biome 2.2+ no longer needs trailing `/**`).
- **Files modified:** `biome.json`
- **Verification:** `pnpm check` exits 0 after fix
- **Committed in:** `eaafe9a` (Task 2 commit)

**2. [Rule 1 - Bug] attw `FalseESM` for CJS consumers — fixed exports conditions**
- **Found during:** Task 2 (attw --pack run)
- **Issue:** The flat `types` condition in exports gives ESM `.d.ts` files to CJS consumers under node16 resolution, producing the `Masquerading as ESM` error.
- **Fix:** Restructured exports to use nested conditions: `import: { types: .d.ts, default: .js }` and `require: { types: .d.cts, default: .cjs }`. tsdown already produced `.d.cts` files; just needed the exports mapping.
- **Files modified:** `packages/whisper/package.json`
- **Verification:** attw reports node16(CJS), node16(ESM), and bundler all green
- **Committed in:** `eaafe9a` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs — Biome 2.x API change, attw exports structure)
**Impact on plan:** Both fixes necessary for correct toolchain operation. No scope creep. The plan's guidance about attw/publint being non-blocking covered the node10 case; the FalseESM fix was an actual correctness issue that needed addressing.

## Issues Encountered

- Biome 2.x removed `files.ignore` key — required `!pattern` syntax migration. Not a showstopper, auto-fixed by `pnpm check:fix`.
- Biome 2.x also requires semicolons and sorted imports — auto-fixed by `pnpm check:fix`.
- attw FalseESM for CJS consumers required restructuring the exports field to nested conditions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Complete developer toolchain is established: install, build, test, check all exit 0
- tsdown produces correct dual ESM+CJS output verified by attw and publint
- All 6 subpath exports ready for Phase 4/5 endpoint implementation
- Routing types (PlatformRoute, RegionalRoute, toRegional) are the next deliverable in plan 01-02
- No blockers for Phase 2 core infrastructure work

---
*Phase: 01-foundation*
*Completed: 2026-03-17*
