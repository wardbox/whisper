---
phase: 07-hardening-and-publish
plan: 02
subsystem: e2e-smoke
tags: [smoke, e2e, runtime-matrix, publish]
dependency_graph:
  requires: [07-01]
  provides: [e2e-smoke-fixture, smoke-orchestrator]
  affects: [07-04]
tech_stack:
  added: []
  patterns: [tarball-smoke-testing, runtime-matrix, file-dependency]
key_files:
  created:
    - e2e/smoke/package.json
    - e2e/smoke/tsconfig.json
    - e2e/smoke/deno.json
    - e2e/smoke/smoke.mjs
    - e2e/smoke/smoke.cjs
    - e2e/smoke/smoke.ts
    - e2e/smoke/smoke_bun.ts
    - e2e/smoke/smoke_deno.ts
    - scripts/smoke/run.mjs
  modified:
    - e2e/smoke/tsconfig.json
decisions:
  - Exclude smoke_deno.ts from tsconfig.json — Deno has its own type checker and Deno.exit is not in @types/node
metrics:
  duration: 4min
  completed: "2026-04-12T00:08:18Z"
requirements: [D-04, D-05, D-06, D-07, D-08]
---

# Phase 7 Plan 2: Smoke Fixture and Orchestrator Summary

Consumer-install smoke fixture exercising all 8 subpaths via packed tarball, with Node ESM/CJS/Bun runtime validation and Deno entry for CI.

## Task Results

### Task 1: Create e2e/smoke fixture (607db4f)

Created 8 files under `e2e/smoke/`:

- **package.json**: Private consumer fixture with `file:../../packages/whisper/wardbox-whisper-0.1.0.tgz` dependency. Type: module. Scripts for typecheck, esm, cjs, bun, deno legs.
- **tsconfig.json**: NodeNext moduleResolution, noEmit type-check only. Includes smoke.ts and smoke_bun.ts (smoke_deno.ts excluded — see deviations).
- **deno.json**: nodeModulesDir: auto with npm: import map for all 8 subpaths (workaround path per CONTEXT.md).
- **smoke.mjs**: Node ESM entry — imports all 8 subpaths, calls createClient, verifies object returned.
- **smoke.cjs**: Node CJS entry — requires all 8 subpaths, same validation.
- **smoke.ts**: TypeScript type-check entry (never executed, validates .d.ts resolution).
- **smoke_bun.ts**: Bun entry — TS native, same 8 subpath imports.
- **smoke_deno.ts**: Deno entry — uses Deno.exit, npm: specifiers resolved via local node_modules.

All entries use `apiKey: 'test-key-never-hits-network'` (no RIOT_API_KEY, no live API).

### Task 2: Create scripts/smoke/run.mjs orchestrator (c684f06)

Orchestrator lifecycle: build -> pack -> cache bust -> install -> typecheck -> ESM -> CJS -> (Bun) -> (Deno).

Key design decisions:
- `pnpm install --force --ignore-workspace` busts pnpm's tarball cache and isolates from workspace
- Removes node_modules and pnpm-lock.yaml before each run for guaranteed clean state
- Bun and Deno legs gated on local availability via `which()` helper
- Uses `execSync` with `stdio: inherit` for streaming output and fast-abort on failure

**End-to-end run output:**
- `npx tsc --noEmit`: PASS (type declarations resolve)
- `smoke[esm]: ok`: PASS (Node ESM, all 8 subpaths)
- `smoke[cjs]: ok`: PASS (Node CJS, all 8 subpaths)
- `smoke[bun]: ok`: PASS (Bun, all 8 subpaths)
- Deno: skipped (not installed locally, CI runs it via Plan 04)

**Bug-1 regression verification:** `e2e/smoke/node_modules/@wardbox/whisper/LICENSE` and `README.md` both present after install, confirming Plan 01's files whitelist works.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Excluded smoke_deno.ts from tsconfig.json**
- **Found during:** Task 2 (first smoke run)
- **Issue:** `tsc --noEmit` failed with `TS2304: Cannot find name 'Deno'` because smoke_deno.ts uses `Deno.exit(1)` which is not in `@types/node`.
- **Fix:** Removed `smoke_deno.ts` from tsconfig.json `include` array. Deno has its own type checker (`deno check`) which runs in the Deno leg, not via Node's tsc.
- **Files modified:** e2e/smoke/tsconfig.json
- **Commit:** c684f06

## Verification Results

| Check | Result |
|-------|--------|
| 8 files in e2e/smoke/ | PASS |
| package.json file: dependency correct | PASS |
| All smoke entries import 8 subpaths | PASS |
| No RIOT_API_KEY in any smoke file | PASS |
| deno.json has nodeModulesDir: auto | PASS |
| tsconfig.json has noEmit + NodeNext | PASS |
| pnpm-workspace.yaml unchanged | PASS |
| pnpm smoke exits 0 | PASS |
| LICENSE in unpacked tarball | PASS |
| README.md in unpacked tarball | PASS |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 607db4f | feat(07-02): create e2e/smoke consumer fixture with all 8 entry files |
| 2 | c684f06 | feat(07-02): create smoke orchestrator and fix tsconfig for Deno type isolation |

## Self-Check: PASSED

All 9 created files verified on disk. Both commit hashes (607db4f, c684f06) verified in git log.
