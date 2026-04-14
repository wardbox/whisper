#!/usr/bin/env node

// scripts/tarball-audit/audit.mjs
// Phase 7 D-21: pack @wardbox/whisper, enumerate file paths, diff against allowlist.
// Uses @publint/pack (added as a packages/whisper devDep in Plan 01).

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// @publint/pack is a devDep of packages/whisper, not the root workspace.
// Use createRequire to resolve it from the whisper package directory.
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const require_ = createRequire(resolve(repoRoot, 'packages/whisper/package.json'));
const { packAsList } = require_('@publint/pack');

const pkgDir = resolve(repoRoot, 'packages/whisper');
const allowlistPath = resolve(repoRoot, 'e2e/tarball-allowlist.json');

console.log(`tarball-audit: packing ${pkgDir}`);

// packAsList returns string[] of relative file paths that were packed.
// We prefix with "package/" to match npm tarball extraction convention.
const rawPaths = await packAsList(pkgDir, { packageManager: 'pnpm' });
const filePaths = rawPaths.map((f) => `package/${f}`).sort();

const { allowed } = JSON.parse(readFileSync(allowlistPath, 'utf8'));

// Convert glob patterns to RegExp.
// Supported glob syntax: `*` matches any non-`/` chars; `**` matches anything (including /).
function globToRegex(glob) {
  const placeholder = 'DOUBLESTAR_PLACEHOLDER';
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex metachars
    .replace(/\*\*/g, placeholder) // placeholder for **
    .replace(/\*/g, '[^/]*') // * matches non-slash
    .replaceAll(placeholder, '.*'); // ** matches anything
  return new RegExp(`^${escaped}$`);
}

const patterns = allowed.map((g) => ({ glob: g, re: globToRegex(g) }));

const unexpected = [];
const matchedPatterns = new Set();

for (const file of filePaths) {
  const match = patterns.find((p) => p.re.test(file));
  if (!match) {
    unexpected.push(file);
  } else {
    matchedPatterns.add(match.glob);
  }
}

const unmatchedAllowlistEntries = patterns
  .filter((p) => !matchedPatterns.has(p.glob))
  .map((p) => p.glob);

let failed = false;

if (unexpected.length > 0) {
  console.error('\ntarball-audit: FAIL -- unexpected files in tarball:');
  for (const f of unexpected) console.error(`  + ${f}`);
  console.error('\nIf these files are intentional, add them to e2e/tarball-allowlist.json');
  failed = true;
}

if (unmatchedAllowlistEntries.length > 0) {
  console.error('\ntarball-audit: FAIL -- allowlist entries not matched by any tarball file:');
  for (const g of unmatchedAllowlistEntries) console.error(`  - ${g}`);
  console.error('(These are stale; remove them from e2e/tarball-allowlist.json)');
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log(`\ntarball-audit: ok -- ${filePaths.length} files, all in allowlist`);

// Also assert LICENSE and README presence as a hard regression check for Bug 1
const hasLicense = filePaths.some((f) => /package\/LICENSE$/.test(f));
const hasReadme = filePaths.some((f) => /package\/README\.md$/.test(f));
if (!hasLicense) {
  console.error('tarball-audit: FAIL -- package/LICENSE missing from tarball (Bug 1 regression)');
  process.exit(2);
}
if (!hasReadme) {
  console.error('tarball-audit: FAIL -- package/README.md missing from tarball (Bug 1 regression)');
  process.exit(3);
}

console.log('tarball-audit: LICENSE + README confirmed in tarball');
