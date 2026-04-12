---
phase: 07-hardening-and-publish
reviewed: 2026-04-11T22:30:00Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - .changeset/README.md
  - .changeset/config.json
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/token-check.yml
  - .gitignore
  - README.md
  - e2e/smoke/deno.json
  - e2e/smoke/package.json
  - e2e/smoke/smoke.cjs
  - e2e/smoke/smoke.mjs
  - e2e/smoke/smoke.ts
  - e2e/smoke/smoke_bun.ts
  - e2e/smoke/smoke_deno.ts
  - e2e/smoke/tree-shake/check.mjs
  - e2e/smoke/tree-shake/entry-lol.ts
  - e2e/smoke/tree-shake/entry-tft.ts
  - e2e/smoke/tsconfig.json
  - e2e/tarball-allowlist.json
  - package.json
  - packages/whisper/.size-limit.json
  - packages/whisper/README.md
  - packages/whisper/package.json
  - scripts/prepack-strip-maps.mjs
  - scripts/smoke/run.mjs
  - scripts/tarball-audit/audit.mjs
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 7: Code Review Report

**Reviewed:** 2026-04-11T22:30:00Z
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

## Summary

Phase 7 adds hardening and publish infrastructure: CI/CD workflows (build gates, smoke test matrix, release pipeline), tarball content auditing, tree-shake verification, size budgets, a source-map stripping prepack hook, and changeset-based release automation. The code is well-structured, thoroughly documented with inline rationale, and follows sound defensive patterns (allowlist-based tarball audit, cross-game tree-shake assertions, multi-runtime smoke tests).

No critical security or correctness issues were found. Three warnings relate to brittleness from hardcoded version strings and missing error handling in the smoke runner. Three informational items note minor improvements.

## Warnings

### WR-01: Hardcoded tarball version in smoke fixture and runner will break on version bump

**File:** `e2e/smoke/package.json:8`
**File:** `scripts/smoke/run.mjs:23`
**Issue:** The smoke fixture dependency `"@wardbox/whisper": "file:../../packages/whisper/wardbox-whisper-0.1.0.tgz"` and the local runner constant `TARBALL_NAME = 'wardbox-whisper-0.1.0.tgz'` both hardcode version `0.1.0`. When changesets bumps the version (e.g., to `0.2.0`), the local `pnpm smoke` script will fail because it looks for the old tarball name. CI uses a glob pattern (`wardbox-whisper-*.tgz`) and re-packs fresh, so CI is fine, but local development will break silently after a version bump.
**Fix:** In `scripts/smoke/run.mjs`, read the version from `packages/whisper/package.json` dynamically and construct the tarball name. For `e2e/smoke/package.json`, either update it as part of the version script or use a glob-based approach:

```javascript
// scripts/smoke/run.mjs — replace hardcoded TARBALL_NAME
import { readFileSync } from 'node:fs';

const whisperPkg = JSON.parse(
  readFileSync(join(pkgDir, 'package.json'), 'utf8')
);
const TARBALL_NAME = `wardbox-whisper-${whisperPkg.version}.tgz`;
```

For `e2e/smoke/package.json`, the smoke runner could update the `file:` path after packing, or use a glob to find the tarball.

### WR-02: Smoke runner has no error handling around execSync calls

**File:** `scripts/smoke/run.mjs:25-28`
**Issue:** The `run()` helper wraps `execSync` with `stdio: 'inherit'` but has no try/catch. If any step fails (build, pack, install, typecheck, or a smoke leg), the process crashes with a raw Node.js stack trace and no indication of which phase failed. The `execSync` call throws on non-zero exit, which is correct fail-fast behavior, but the error message will be unhelpful (just the spawn error, not "smoke: build step failed").
**Fix:** Wrap `execSync` in a try/catch that adds the step label to the error message:

```javascript
function run(cmd, opts = {}) {
  const label = opts.cwd ? opts.cwd.replace(repoRoot + '/', '') : '.';
  console.log(`\n$ ${cmd}  (in ${label})`);
  try {
    execSync(cmd, { stdio: 'inherit', ...opts });
  } catch (err) {
    console.error(`\nsmoke: FAILED at step: ${cmd}`);
    process.exit(1);
  }
}
```

### WR-03: prepack-strip-maps.mjs ENOENT catch is overly broad

**File:** `scripts/prepack-strip-maps.mjs:39-56`
**Issue:** The try/catch on lines 39-56 catches ENOENT from any call inside the loop (`walk(distDir)`, `statSync(file)`, `unlinkSync(file)`). The intent is to handle "dist/ does not exist" gracefully, but an ENOENT from a file disappearing between `walk` and `statSync` (race condition, e.g., concurrent build) would also be silently swallowed with a misleading "dist/ not found" message. While unlikely in practice, the catch is broader than intended.
**Fix:** Move the ENOENT check to only wrap the `walk()` call, not the per-file operations:

```javascript
let files;
try {
  files = walk(distDir);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('prepack-strip-maps: dist/ not found -- assuming nothing to strip');
    process.exit(0);
  }
  throw err;
}

for (const file of files) {
  if (file.endsWith('.js.map')) {
    const size = statSync(file).size;
    unlinkSync(file);
    removed += 1;
    bytesFreed += size;
  }
}
```

## Info

### IN-01: Tree-shake symbol list requires manual maintenance

**File:** `e2e/smoke/tree-shake/check.mjs:38-71`
**Issue:** The `SYMBOLS` object on lines 38-71 is a hardcoded snapshot of all game-specific exports. The comment on line 35 says "Verified 2026-04-12" and warns "If a symbol name is wrong, the assertion silently passes (false negative)." If a new API group is added to a game module without updating this list, the tree-shake test will have a silent false negative -- it will not detect a cross-game leak of the new symbol. The comment is transparent about this risk but there is no automated check that the list is complete.
**Fix:** Consider adding a pre-check that dynamically imports each game module and compares `Object.keys()` against the hardcoded `SYMBOLS` object, failing if there is a mismatch. This would catch stale symbol lists at test time rather than relying on manual updates.

### IN-02: Root package.json also has a prepack hook

**File:** `package.json:13`
**Issue:** Both the root workspace (`package.json:13`) and the library (`packages/whisper/package.json:123`) define a `prepack` script pointing to the same `prepack-strip-maps.mjs`. The root prepack runs when `pnpm pack` is invoked at the workspace root, which is not the normal publish path (changesets publishes from the package directory). The root hook is harmless (the script is idempotent) but unnecessary and could cause confusion about which hook fires during publish.
**Fix:** Consider removing the root-level `prepack` script since the library-level one is the one that fires during `pnpm pack` in `packages/whisper/`. The root-level one serves no purpose in the changeset publish flow.

### IN-03: Deno smoke test uses overly permissive -A flag

**File:** `.github/workflows/ci.yml:157`
**File:** `e2e/smoke/smoke_deno.ts:1`
**Issue:** The Deno smoke leg runs with `deno run -A` which grants all permissions (read, write, net, env, run, ffi). The smoke test only needs read access to resolve modules and write access for stdout. While this is a CI-only test with no network calls and no sensitive data, using narrower permissions would be more consistent with Deno's security model and would catch accidental permission escalation if the smoke test grows.
**Fix:** Replace `-A` with explicit permissions:
```yaml
deno run --allow-read --allow-env smoke_deno.ts
```

---

_Reviewed: 2026-04-11T22:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
