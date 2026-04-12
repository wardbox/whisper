---
phase: 07-hardening-and-publish
plan: 04
subsystem: ci
tags: [ci, github-actions, matrix, smoke-testing, quality-gates]
dependency_graph:
  requires: [07-01, 07-02, 07-03]
  provides: [ci-matrix-workflow, smoke-gates, quality-gates]
  affects: [.github/workflows/ci.yml]
tech_stack:
  added: [actions/upload-artifact@v4, actions/download-artifact@v4, denoland/setup-deno@v2.0.4, oven-sh/setup-bun@v2.2.0]
  patterns: [artifact-passing, matrix-strategy, conditional-steps]
key_files:
  modified: [.github/workflows/ci.yml]
decisions:
  - "Comment referencing RIOT_API_KEY replaced with generic 'API key secrets' to satisfy strict grep assertion (D-07 enforcement)"
  - "Deno leg installs pnpm globally via npm because denoland/setup-deno does not bundle pnpm (D-08 workaround)"
metrics:
  duration: 2min
  completed: "2026-04-12T00:19:25Z"
  tasks: 1
  files: 1
---

# Phase 07 Plan 04: CI Matrix and Quality Gates Summary

Extended ci.yml from 25-line single-job workflow to 165-line two-job pipeline with full quality gate coverage and 4-runtime smoke matrix.

## Changes Made

### Task 1: Extend ci.yml with gates and 4-leg smoke matrix

**Commit:** `e6fb17b`

**Before:** Single `ci` job with 5 steps (build, test, check, attw, publint) on Node 22.

**After:** Two jobs:

1. **`build` job** (Node 22, ubuntu-latest):
   - All 5 original steps preserved in order (D-03)
   - Added: `pnpm size` (D-19 size budgets)
   - Added: `pnpm tarball:audit` (D-21 tarball content audit)
   - Added: Pack library + install smoke fixture + `node e2e/smoke/tree-shake/check.mjs` (D-20 tree-shake verification)
   - Added: Upload packed tarball as `whisper-tarball` artifact (1-day retention, error on missing files)

2. **`smoke` job** (4-leg matrix, ubuntu-latest):
   - `needs: build` -- waits for primary job to produce artifact
   - `fail-fast: false` -- runtime failures don't mask each other
   - **node-esm**: pnpm install + typecheck + `node smoke.mjs`
   - **node-cjs**: pnpm install + `node smoke.cjs`
   - **deno**: npm install -g pnpm, pnpm install, `deno run -A --node-modules-dir=auto smoke_deno.ts`
   - **bun**: `bun install --force` + `bun run smoke_bun.ts`

**Line count delta:** 25 -> 165 (+140 lines)

### Action Version Pins

| Action | Version | Rationale |
|--------|---------|-----------|
| `actions/checkout` | `@v4` | Existing, unchanged per D-03 |
| `pnpm/action-setup` | `@v4` | Existing, unchanged per D-03 |
| `actions/setup-node` | `@v4` | Existing, unchanged per D-03 |
| `actions/upload-artifact` | `@v4` | New, pinned per RESEARCH supply-chain guidance |
| `actions/download-artifact` | `@v4` | New, pinned per RESEARCH supply-chain guidance |
| `denoland/setup-deno` | `@v2.0.4` | New, explicit version pin per supply-chain guidance |
| `oven-sh/setup-bun` | `@v2.2.0` | New, explicit version pin per supply-chain guidance |

### Security Posture

- `permissions: contents: read` at workflow level (no write permissions)
- No secrets referenced (no `RIOT_API_KEY`, no `NPM_TOKEN`)
- No `${{ github.* }}` interpolation in shell commands (only in `if:` conditions)
- Artifact scoped to workflow run (no cross-workflow access)
- All third-party actions pinned to explicit version tags

### Schema-drift.yml

Verified byte-identical via `git diff --exit-code .github/workflows/schema-drift.yml` -- zero changes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed RIOT_API_KEY string from comment**
- **Found during:** Task 1 verification
- **Issue:** Plan's YAML template included `# D-07: no RIOT_API_KEY, no live API calls` as a comment. The acceptance criteria grep check `! grep -q 'RIOT_API_KEY'` flagged this as a failure.
- **Fix:** Changed comment to `# D-07: no API key secrets, no live API calls` to satisfy the strict grep assertion while preserving the intent.
- **Files modified:** `.github/workflows/ci.yml`
- **Commit:** `e6fb17b`

## Verification Results

All automated checks passed:
- File exists and is valid YAML
- Workflow name is `CI`
- Triggers: push to main + pull_request to main (unchanged)
- Build job preserves all 5 original steps (build, test, check, attw, publint)
- Build job adds size, tarball:audit, tree-shake, pack + upload
- Smoke job exists with `needs: build`
- Matrix has all 4 runtimes: node-esm, node-cjs, deno, bun
- `fail-fast: false` set
- All legs on ubuntu-latest (no macOS, no Windows)
- Download artifact via `actions/download-artifact@v4`
- Deno pinned to `denoland/setup-deno@v2.0.4`
- Bun pinned to `oven-sh/setup-bun@v2.2.0`
- Each leg has conditional `if:` gating
- No RIOT_API_KEY or NPM_TOKEN references
- schema-drift.yml unchanged

## Known Stubs

None -- this plan produces a complete CI workflow with no placeholder values.

## Notes

The real proof of this plan is observing CI pass on the next PR. Plan completion verifies file correctness and YAML validity, not observed CI success. The workflow depends on artifacts produced by Plans 01-03 (smoke fixtures, size-limit config, tarball audit script, tree-shake check) being present in the repository.

## Self-Check: PASSED

- FOUND: .github/workflows/ci.yml
- FOUND: .planning/phases/07-hardening-and-publish/07-04-SUMMARY.md
- FOUND: commit e6fb17b
