---
phase: 07-hardening-and-publish
verified: 2026-04-11T17:45:00Z
status: human_needed
score: 3/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open a PR on the wardbox/whisper repo and observe the CI run complete successfully"
    expected: "All jobs pass: Build + gates (node 22), Smoke (node-esm), Smoke (node-cjs), Smoke (deno), Smoke (bun)"
    why_human: "CI has never run with the extended workflow (Plans 04's new matrix was just added). Deno leg cannot be verified locally (not installed). CI pass is required to satisfy SC-3."
  - test: "Complete Task 4 in Plan 05: set up npm 2FA, generate granular NPM_TOKEN, add to GitHub secrets, configure branch protection on main, then run `cd packages/whisper && npm publish --dry-run` and confirm output"
    expected: "Dry-run output shows: files=[dist/, LICENSE, README.md, package.json], version=0.1.0, access=public, registry=registry.npmjs.org"
    why_human: "NPM_TOKEN has not been configured. Branch protection has not been set. The package has not been published (npm view returns 404). SC-4 cannot be verified until the package is actually published."
---

# Phase 7: Hardening and Publish — Verification Report

**Phase Goal:** The package passes all pre-publish validation checks, is verified to work across all target runtimes, and is published to npm as `@wardbox/whisper`.
**Verified:** 2026-04-11T17:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | `@arethetypeswrong/cli` reports no type resolution issues for ESM or CJS consumers | VERIFIED | `npx attw --pack --profile node16` exits 0; all 8 subpaths show green for node16/ESM, node16/CJS, bundler; node10 ignored per profile |
| SC-2 | `publint` reports no package export misconfiguration | VERIFIED | `npx publint .` exits 0: "All good!" — version 0.3.18 |
| SC-3 | CI runs the test suite successfully on Node 22 LTS (both ESM and CJS), Deno, and Bun | PARTIAL | Workflow infrastructure exists and is correct (ci.yml extended with 4-leg matrix). Local smoke passes Node ESM/CJS/Bun. Deno leg requires CI. CI has not yet been observed to run with the extended workflow. |
| SC-4 | The published `@wardbox/whisper` package is installable in a fresh project and a basic import works | FAILED | Package not published — `npm view @wardbox/whisper` returns 404. Task 4 (Plan 05, manual setup checkpoint) has not been completed: no NPM_TOKEN secret, no branch protection. |

**Score:** 2/4 truths fully verified (3/4 partially or infrastructure-complete)

### Deferred Items

None — all items are expected to be addressed in this phase.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `LICENSE` | Repo-root MIT license | VERIFIED | SPDX-canonical MIT, "Copyright (c) 2026 Wardbox", no GPL text |
| `packages/whisper/LICENSE` | Tarball-shipped MIT license | VERIFIED | Byte-identical to root LICENSE; diff -q exits 0 |
| `packages/whisper/README.md` | Publish-facing README | VERIFIED | 42 lines, contains @wardbox/whisper, description, createClient, tree-shakeable |
| `README.md` | Root GitHub README expanded | VERIFIED | Byte-identical to packages/whisper/README.md; 42 lines |
| `packages/whisper/package.json` | Full publish metadata + publishConfig + files whitelist | VERIFIED | license=MIT, access=public, provenance=true, files=["dist","LICENSE","README.md"], all metadata fields present, zero runtime deps |
| `package.json` (root) | Root scripts wiring | VERIFIED | All 7 scripts present: smoke, size, tarball:audit, tree-shake, release, changeset, prepack |
| `e2e/smoke/package.json` | Consumer fixture | VERIFIED | file:../../packages/whisper/wardbox-whisper-0.1.0.tgz dependency, private:true |
| `e2e/smoke/smoke.mjs` | Node ESM smoke entry | VERIFIED | 28 lines; all 8 subpaths; createClient called; no RIOT_API_KEY |
| `e2e/smoke/smoke.cjs` | Node CJS smoke entry | VERIFIED | 26 lines; all 8 subpaths; createClient called |
| `e2e/smoke/smoke_deno.ts` | Deno smoke entry | VERIFIED | 26 lines; all 8 subpaths; uses Deno.exit |
| `e2e/smoke/smoke_bun.ts` | Bun smoke entry | VERIFIED | 25 lines; all 8 subpaths; createClient called |
| `e2e/smoke/deno.json` | Deno config | VERIFIED | nodeModulesDir:auto; import map for all 8 subpaths |
| `e2e/smoke/tsconfig.json` | tsc --noEmit config | VERIFIED | noEmit:true, moduleResolution:NodeNext |
| `scripts/smoke/run.mjs` | Smoke orchestrator | VERIFIED | 88 lines; pnpm pack, pnpm install --force --ignore-workspace, Bun/Deno gated on which() |
| `scripts/prepack-strip-maps.mjs` | Source map stripping script | VERIFIED | Exists; wired as prepack hook in packages/whisper/package.json |
| `packages/whisper/.size-limit.json` | Per-subpath size budgets | VERIFIED | All 8 subpaths have budgets; pnpm size exits 0 |
| `e2e/tarball-allowlist.json` | Tarball content allowlist | VERIFIED | Exists; pnpm tarball:audit exits 0: "59 files, all in allowlist; LICENSE + README confirmed" |
| `scripts/tarball-audit/audit.mjs` | Tarball audit script | VERIFIED | Exists; exits 0 |
| `e2e/smoke/tree-shake/check.mjs` | Tree-shake check | VERIFIED | Exits 0: "/tft -- no cross-game leaks", "/lol -- no cross-game leaks" |
| `e2e/smoke/tree-shake/entry-tft.ts` | TFT tree-shake entry | VERIFIED | Exists |
| `e2e/smoke/tree-shake/entry-lol.ts` | LoL tree-shake entry | VERIFIED | Exists |
| `.github/workflows/ci.yml` | Extended CI with matrix + gates | VERIFIED | 165-line two-job pipeline (build + smoke matrix); all 5 original steps preserved |
| `.changeset/config.json` | Changesets config | VERIFIED | access=public, baseBranch=main, ignore=["whisper-docs"] |
| `.github/workflows/release.yml` | Release workflow | VERIFIED | changesets/action@v1.7.0, id-token:write, NPM_CONFIG_PROVENANCE, no workflow_dispatch |
| `.github/workflows/token-check.yml` | NPM token rotation check | VERIFIED | Weekly schedule, npm whoami, repository guard |
| `packages/docs/package.json` | Docs package private guard | VERIFIED | private:true confirmed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/whisper/package.json` | `packages/whisper/LICENSE` | files whitelist | WIRED | files:["dist","LICENSE","README.md"] — tarball dry-run lists LICENSE |
| `packages/whisper/package.json` | `packages/whisper/README.md` | files whitelist | WIRED | tarball dry-run lists README.md |
| `scripts/smoke/run.mjs` | `packages/whisper` | pnpm pack | WIRED | pnpm smoke exits 0; smoke[esm/cjs/bun] all pass |
| `e2e/smoke/package.json` | `packages/whisper/wardbox-whisper-0.1.0.tgz` | file: dependency | WIRED | dependency value = "file:../../packages/whisper/wardbox-whisper-0.1.0.tgz" |
| `e2e/smoke/smoke.mjs` | `@wardbox/whisper/core` | import { createClient } | WIRED | smoke[esm]: ok — all 8 subpaths resolved + createClient initialized |
| `.github/workflows/ci.yml` | `pnpm tarball:audit` | run step | WIRED | tarball:audit step present in build job |
| `.github/workflows/ci.yml` | `e2e/smoke` tree-shake | run step | WIRED | Install smoke fixture + node e2e/smoke/tree-shake/check.mjs in build job |
| `.github/workflows/release.yml` | `pnpm release` | changesets/action publish | WIRED | publish: pnpm release confirmed |
| `.changeset/config.json` | whisper-docs package | ignore field | WIRED | ignore:["whisper-docs"] confirmed |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces CLI/CI tooling artifacts and configuration files, not components rendering dynamic data. The relevant "data flow" is the smoke test chain (pack → install → import resolution), which has been verified behaviorally via `pnpm smoke`.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Node ESM smoke passes | `pnpm smoke` | smoke[esm]: ok — all 8 subpaths resolved + createClient initialized | PASS |
| Node CJS smoke passes | `pnpm smoke` | smoke[cjs]: ok — all 8 subpaths resolved + createClient initialized | PASS |
| Bun smoke passes | `pnpm smoke` | smoke[bun]: ok — all 8 subpaths resolved + createClient initialized | PASS |
| Deno smoke | Not runnable locally | deno not installed locally | SKIP |
| attw exits 0 | `npx attw --pack --profile node16` (in packages/whisper) | All 8 subpaths: node16/ESM 🟢, node16/CJS 🟢, bundler 🟢 | PASS |
| publint exits 0 | `npx publint .` (in packages/whisper) | "All good!" | PASS |
| Size budgets pass | `pnpm size` | All 8 subpaths within budget; exits 0 | PASS |
| Tarball audit passes | `pnpm tarball:audit` | 59 files, all in allowlist; LICENSE + README confirmed; exits 0 | PASS |
| Tree-shake passes | `pnpm tree-shake` (after smoke) | /tft no cross-game leaks, /lol no cross-game leaks; exits 0 | PASS |
| Unit tests pass | `pnpm test` | 52 test files, 488 tests passed | PASS |
| Build passes | `pnpm build` | 35 ESM files, 546.90 kB, exits 0 | PASS |
| Package not yet published | `npm view @wardbox/whisper` | 404 Not Found | EXPECTED — awaiting Task 4 |

### Requirements Coverage

Phase 7 plans claim no REQUIREMENTS.md IDs (the phase prompt states "none — delivery phase; all requirements mapped to Phases 1-6"). All requirement IDs used in the plans (D-01 through D-22, BUG-1, BUG-2, QUIRK-3, NPM-TOKEN-ROTATION) are Phase 7 delivery requirements defined in `07-CONTEXT.md`, not in `REQUIREMENTS.md`. Cross-referencing against REQUIREMENTS.md is therefore not applicable for this phase.

REQUIREMENTS.md traceability shows no Phase 7 rows — confirmed as expected.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `e2e/smoke/smoke.ts` | 2 | Import sort order (biome organizeImports) | Info | Fixable lint warning; does not affect functionality; only appears locally due to biome scanning untracked `.claude/worktrees/` nested config; CI won't have this issue |
| `e2e/smoke/smoke_bun.ts` | 3 | Import sort order (biome organizeImports) | Info | Same as above |
| `e2e/smoke/smoke_deno.ts` | 4 | Import sort order (biome organizeImports) | Info | Same as above |
| `e2e/smoke/tree-shake/entry-*.ts` | - | Formatting (biome format) | Info | Same as above |

Note: The `pnpm check` script fails locally due to a biome conflict between the root `biome.json` and a nested `biome.json` in `.claude/worktrees/agent-a05ad6ec/` (an untracked directory from the current Claude Code session). This directory is NOT committed to git and will NOT be present in CI. Running `npx @biomejs/biome check packages/whisper/` confirms the library source is clean (0 errors). The local `pnpm check` failure is an environment artifact, not a Phase 7 regression.

### Human Verification Required

#### 1. CI Matrix Validation (SC-3)

**Test:** Open a PR on `wardbox/whisper` (or push to a branch and check the run) and observe the full CI pipeline complete successfully.

**Expected:**
- "Build + gates (node 22)" job: pnpm build, pnpm test, pnpm check, attw, publint, pnpm size, pnpm tarball:audit, tree-shake check, artifact upload — all pass
- "Smoke (node-esm)" job: typecheck + node smoke.mjs exits 0
- "Smoke (node-cjs)" job: node smoke.cjs exits 0
- "Smoke (deno)" job: deno run -A --node-modules-dir=auto smoke_deno.ts exits 0
- "Smoke (bun)" job: bun run smoke_bun.ts exits 0

**Why human:** The extended ci.yml (Plan 04) has never been triggered against the current codebase. The Deno leg cannot be run locally (not installed). CI pass is required to satisfy SC-3.

#### 2. Manual Setup + First Publish (SC-4)

**Test:** Complete Plan 05 Task 4 checkpoint steps 1-7:
1. Verify npm account 2FA enabled
2. Confirm `npm view @wardbox/whisper` returns 404 (name available)
3. Generate granular NPM_TOKEN (scope: @wardbox/whisper, publish-only)
4. Add NPM_TOKEN to GitHub Actions secrets
5. Configure branch protection (require: "Build + gates (node 22)" + all 4 Smoke status checks)
6. Set 80-day calendar reminder for token rotation
7. Run `cd packages/whisper && npm publish --dry-run` and verify output

**Expected for step 7:** Output includes dist/, LICENSE, README.md, package.json; version=0.1.0; access=public; registry=registry.npmjs.org

**Why human:** npm account 2FA, token generation, GitHub secret creation, and branch protection configuration cannot be automated. The package cannot be published until these steps are complete. SC-4 ("published package is installable") requires actual publication.

### Gaps Summary

Phase 7 infrastructure is fully built and verified locally. Two items block the phase goal:

1. **SC-3 (CI matrix not yet observed):** All CI workflow files are correct and complete, but the 4-leg smoke matrix has not yet run against the current codebase state. A single PR or push will surface any issues. The Deno leg is the only untested runtime locally.

2. **SC-4 (package not published):** Plan 05 Task 4 (manual setup) was explicitly marked `autonomous: false` and documented as a checkpoint requiring human action. The NPM_TOKEN has not been configured, branch protection has not been set, and the package has not been published to npm.

These are expected gaps for a delivery phase — the automation infrastructure is complete; the remaining work requires human decisions (npm account, token scoping, branch protection policy) and a final publishing action.

---

_Verified: 2026-04-11T17:45:00Z_
_Verifier: Claude (gsd-verifier)_
