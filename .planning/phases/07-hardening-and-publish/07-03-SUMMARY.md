---
phase: 07-hardening-and-publish
plan: 03
subsystem: quality-gates
tags:
  - size-limit
  - tree-shake
  - tarball-audit
  - source-maps
  - publish
dependency_graph:
  requires:
    - 07-01 (root scripts, devDeps, package metadata)
  provides:
    - prepack-strip-maps.mjs (source map stripping before pack)
    - .size-limit.json (per-subpath bundle size budgets)
    - tarball-allowlist.json + audit.mjs (tarball content audit)
    - tree-shake fixtures and check.mjs (cross-game isolation verification)
  affects:
    - 07-04 (CI wiring will invoke these gates)
tech_stack:
  added:
    - esbuild@0.27.4 (root devDep for tree-shake check)
  patterns:
    - glob-based tarball allowlist for content-hashed chunks
    - createRequire for cross-package module resolution in scripts
key_files:
  created:
    - scripts/prepack-strip-maps.mjs
    - packages/whisper/.size-limit.json
    - e2e/tarball-allowlist.json
    - scripts/tarball-audit/audit.mjs
    - e2e/smoke/tree-shake/entry-tft.ts
    - e2e/smoke/tree-shake/entry-lol.ts
    - e2e/smoke/tree-shake/check.mjs
  modified:
    - packages/whisper/package.json (added prepack hook)
    - package.json (added esbuild devDep)
    - pnpm-lock.yaml
decisions:
  - "Used packAsList from @publint/pack instead of pack -- pack returns tarball path, packAsList returns file list needed for audit"
  - "Added esbuild as root devDep -- pnpm strict mode prevents importing transitive deps, tree-shake check needs direct access"
  - "Removed root-level index.d.ts.map and index.d.cts.map from allowlist -- tsdown does not emit declaration maps for the root barrel entry"
  - "TFT exports spectatorTftV5 not lolStatusForTftV1 -- corrected from plan research estimates to match actual source"
metrics:
  duration: 9m
  completed: "2026-04-12T00:12:47Z"
  tasks: 4
  files: 10
---

# Phase 7 Plan 3: Quality Gates Summary

Per-subpath bundle size budgets, tarball content audit with glob-based allowlist, tree-shake verification for cross-game isolation, and prepack source map stripping -- all four gates exit 0 locally and ready for CI wiring.

## Task Completion

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Prepack strip maps + hook | e90c426 | scripts/prepack-strip-maps.mjs, packages/whisper/package.json |
| 2 | Size-limit budgets | 9bea904 | packages/whisper/.size-limit.json |
| 3 | Tarball allowlist + audit | 2b688f0 | e2e/tarball-allowlist.json, scripts/tarball-audit/audit.mjs |
| 4 | Tree-shake fixtures + check | 8538da0 | e2e/smoke/tree-shake/{entry-tft.ts,entry-lol.ts,check.mjs}, package.json, pnpm-lock.yaml |

## Size Budget Table

| Subpath | Measured (brotli) | Budget | Headroom |
|---------|-------------------|--------|----------|
| root | 2.56 kB | 3 kB | 17% |
| /core | 2.57 kB | 3 kB | 17% |
| /lol | 1.16 kB | 2 kB | 72% |
| /tft | 592 B | 1 kB | 73% |
| /val | 493 B | 1 kB | 108% |
| /lor | 129 B | 1 kB | 675% |
| /riftbound | 159 B | 1 kB | 529% |
| /riot | 169 B | 1 kB | 492% |

Note: Small subpaths have high headroom percentages because 1 kB is the minimum practical budget. The budgets for root and /core (the largest entries) are tightly set at ~17% headroom.

## Tarball Allowlist

- 59 files in tarball, all covered by allowlist
- Glob patterns for content-hashed shared chunks: `client-*` (6 patterns), `errors-*` (4 patterns)
- Explicit `package/LICENSE` and `package/README.md` entries as Bug 1 regression catch
- No `*.js.map` patterns -- their absence is the safety net for T-07-13

## Tree-shake Verified Symbol Lists

| Game | Source File | Symbols |
|------|------------|---------|
| LoL | src/lol/index.ts | championMasteryV4, championV3, clashV1, leagueExpV4, leagueV4, lolChallengesV1, lolRsoMatchV1, lolStatusV4, matchV5, spectatorV5, summonerV4, tournamentStubV5, tournamentV5 |
| TFT | src/tft/index.ts | spectatorTftV5, tftLeagueV1, tftMatchV1, tftStatusV1, tftSummonerV1 |
| Val | src/val/index.ts | valConsoleMatchV1, valConsoleRankedV1, valContentV1, valMatchV1, valRankedV1, valStatusV1 |
| LoR | src/lor/index.ts | lorRankedV1, lorStatusV1 |
| Riftbound | src/riftbound/index.ts | riftboundContentV1 |

## Source Map Strip Results

- 7 `.js.map` files stripped per pack cycle
- 150.3 KB freed per pack
- Declaration maps (`.d.ts.map`, `.d.cts.map`) preserved as intended
- No `.cjs.map` files exist (tsdown does not emit them)

## Negative Test Results

- Tarball audit correctly detected `src/` leak when `files` array was temporarily expanded (100+ unexpected files reported, exit code 1)
- Reverted package.json, audit passed again cleanly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @publint/pack API mismatch**
- **Found during:** Task 3
- **Issue:** Plan assumed `pack()` returns `{ files: [...] }` but it actually returns a tarball path string. The correct function is `packAsList()` which returns `string[]`.
- **Fix:** Used `packAsList()` instead of `pack()`, prefixed results with `package/` to match allowlist convention
- **Files modified:** scripts/tarball-audit/audit.mjs
- **Commit:** 2b688f0

**2. [Rule 3 - Blocking] @publint/pack not resolvable from root context**
- **Found during:** Task 3
- **Issue:** `@publint/pack` is a devDep of packages/whisper, not root. The audit script runs from root via `pnpm tarball:audit`.
- **Fix:** Used `createRequire` anchored to packages/whisper/package.json to resolve the module
- **Files modified:** scripts/tarball-audit/audit.mjs
- **Commit:** 2b688f0

**3. [Rule 3 - Blocking] esbuild not directly importable under pnpm strict mode**
- **Found during:** Task 4
- **Issue:** esbuild is a transitive dependency (via tsdown and @size-limit/preset-small-lib) but pnpm strict mode prevents importing it directly.
- **Fix:** Added esbuild@0.27.4 as a root devDependency
- **Files modified:** package.json, pnpm-lock.yaml
- **Commit:** 8538da0

**4. [Rule 1 - Bug] Tree-shake check entry path doubled**
- **Found during:** Task 4
- **Issue:** `bundle("tree-shake/entry-tft.ts")` resolved to `e2e/smoke/tree-shake/tree-shake/entry-tft.ts` because `here` was already the tree-shake directory.
- **Fix:** Changed to `bundle("entry-tft.ts")` and `bundle("entry-lol.ts")`
- **Files modified:** e2e/smoke/tree-shake/check.mjs
- **Commit:** 8538da0

**5. [Rule 2 - Missing] Allowlist adjusted for actual dist output**
- **Found during:** Task 3
- **Issue:** Plan included `index.d.ts.map` and `index.d.cts.map` entries for the root barrel, but tsdown does not emit declaration maps for the root entry. Plan also included `core/index.js.map` patterns but tsdown does not emit source maps for the core subpath.
- **Fix:** Removed non-existent file patterns from allowlist to avoid false warnings
- **Files modified:** e2e/tarball-allowlist.json
- **Commit:** 2b688f0

**6. [Rule 1 - Bug] TFT symbol list correction**
- **Found during:** Task 4
- **Issue:** Plan suggested `lolStatusForTftV1` as a TFT export but actual export is `spectatorTftV5`
- **Fix:** Verified all symbol lists against actual source files and corrected
- **Files modified:** e2e/smoke/tree-shake/check.mjs
- **Commit:** 8538da0

## Self-Check: PASSED

All 8 created files verified present. All 4 task commits verified in git log.
