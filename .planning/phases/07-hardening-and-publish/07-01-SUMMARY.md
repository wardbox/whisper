---
phase: 07-hardening-and-publish
plan: 01
name: "Package Metadata, License, and README"
subsystem: packaging
tags: [publish, metadata, license, readme, package-json]
dependency_graph:
  requires: []
  provides: [LICENSE, README.md, package-metadata, publishConfig, root-scripts, changesets-devdeps, size-limit-devdeps]
  affects: [packages/whisper/package.json, package.json, .gitignore]
tech_stack:
  added: ["@changesets/cli@2.30.0", "@changesets/changelog-github@0.6.0", "size-limit@12.0.1", "@size-limit/preset-small-lib@12.0.1", "@publint/pack@0.1.4"]
  patterns: [files-whitelist-for-tarball, publishConfig-for-scoped-packages]
key_files:
  created: [packages/whisper/LICENSE, packages/whisper/README.md]
  modified: [LICENSE, README.md, packages/whisper/package.json, package.json, .gitignore, pnpm-lock.yaml]
decisions:
  - "MIT license text uses Copyright (c) 2026 Wardbox as copyright holder"
  - "README identical at root and packages/whisper for initial publish (may diverge later)"
  - "homepage URL uses GitHub anchor placeholder until docs site is deployed"
  - "Root package.json scripts reference files from Plans 02/03/05 (forward-wiring, expected to fail until those plans land)"
metrics:
  duration: "3min"
  completed: "2026-04-11T23:59:22Z"
  tasks_completed: 4
  tasks_total: 4
  files_changed: 7
---

# Phase 7 Plan 1: Package Metadata, License, and README Summary

**One-liner:** GPL-to-MIT license swap, publish-quality README, full package.json metadata with publishConfig/files whitelist, and root script wiring for Phase 7 plans.

## What Was Done

### Task 1: Replace root LICENSE with MIT (87e01ae)
- Replaced 675-line GPLv3 with 21-line SPDX-canonical MIT license
- Created byte-identical copy at `packages/whisper/LICENSE`
- Both files verified identical via `diff -q`
- No symlinks used (symlinks don't survive `pnpm pack`)

### Task 2: Expand README.md for publish (55b98e3)
- Replaced single-line `# whisper` with full publish-quality README (42 lines)
- Sections: Install, Quickstart, Features, Documentation, License
- Created byte-identical copy at `packages/whisper/README.md`
- npmjs.com package page and GitHub repo page will show the same content

### Task 3: Package.json metadata and devDeps (4f4ca4e)
- Added: description, keywords (9), author, license, repository, bugs, homepage
- Set `publishConfig.access: "public"` (required for scoped `@wardbox/whisper`)
- Set `publishConfig.provenance: true` for supply chain attestation
- Updated `files` whitelist: `["dist", "LICENSE", "README.md"]` -- fixes BUG-1
- Added devDeps: `size-limit@12.0.1`, `@size-limit/preset-small-lib@12.0.1`, `@publint/pack@0.1.4`
- Version remains `0.1.0` per D-15
- Zero runtime dependencies confirmed (no `dependencies` field)

### Task 4: Root scripts and changesets (163dd6e)
- Added 7 new scripts to root package.json: smoke, size, tarball:audit, tree-shake, prepack, changeset, release
- Release script chains: `pnpm build && pnpm smoke && pnpm size && pnpm tarball:audit && pnpm changeset publish`
- Added devDeps: `@changesets/cli@2.30.0`, `@changesets/changelog-github@0.6.0`
- Extended `.gitignore` with smoke fixture and packed tarball patterns
- Scripts referencing future files (Plans 02/03/05) are intentional forward-wiring

## Tarball Verification

`pnpm pack --dry-run` output confirms both LICENSE and README.md ship in the tarball:
```
LICENSE
package.json
README.md
dist/...  (35 files)
```

## Regression Check

- `pnpm build`: 35 ESM files, 546.90 kB total, completed in 585ms
- `pnpm test`: 52 test files, 488 tests passed
- `pnpm check`: 147 files checked, no issues

## Deviations from Plan

### Minor Adjustments

**1. Root package.json did not have docs:dev/docs:build scripts**
- The plan's interface section listed `docs:dev` and `docs:build` scripts as existing, but the actual root package.json did not contain them (likely removed when docs package was deleted in an earlier phase)
- Also missing `pnpm.onlyBuiltDependencies` field
- No action needed: preserved what actually existed, added only the new Phase 7 scripts

## Known Stubs

None. All files created contain real content. Scripts that reference future files (smoke, tarball:audit, prepack, tree-shake) are intentional forward-wiring for Plans 02/03/05.

## Self-Check: PASSED

All 7 created/modified files verified on disk. All 4 task commits verified in git log.
