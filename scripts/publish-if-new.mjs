#!/usr/bin/env node
// scripts/publish-if-new.mjs
// Idempotent npm publish: skip if the current version is already on the registry.
//
// Why: release.yml runs on every push to main. changesets/action only opens a
// "Version Packages" PR when there are pending changesets — on pushes that
// merge non-changeset PRs (e.g. CI tweaks), the action falls through to the
// publish step. Without this guard, `npm publish` errors out with
// "You cannot publish over the previously published versions" and fails the
// release job for every infra-only merge.
//
// Direct `npm publish` (rather than `changeset publish`) is intentional —
// the project uses npm 11.5.1+ trusted publishing with provenance, which
// `changeset publish` doesn't pass through cleanly.

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(__dirname, '../packages/whisper/package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const { name, version } = pkg;

let published = '';
try {
  published = execFileSync('npm', ['view', `${name}@${version}`, 'version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
} catch (err) {
  // E404 from `npm view` means the version is not published — that's the
  // happy "publish me" path. Anything else is a real registry/network error.
  const stderr = err.stderr?.toString() ?? '';
  if (!stderr.includes('E404') && !stderr.includes('code E404')) {
    process.stderr.write(stderr);
    process.exit(err.status ?? 1);
  }
}

if (published === version) {
  console.log(`publish-if-new: ${name}@${version} already on registry — skipping publish.`);
  process.exit(0);
}

console.log(`publish-if-new: publishing ${name}@${version}...`);
const result = spawnSync('npm', ['publish', '--access', 'public', '--provenance'], {
  cwd: resolve(__dirname, '../packages/whisper'),
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);

// Tag and create a GitHub release with this version's CHANGELOG section as
// the notes. Needs GITHUB_TOKEN in env (release.yml passes it through).
const changelog = readFileSync(resolve(__dirname, '../packages/whisper/CHANGELOG.md'), 'utf8');
const section = changelog.split(/^## /m).find((s) => s.startsWith(`${version}\n`));
const notes = section ? section.slice(version.length).trim() : `Release ${version}`;
console.log(`publish-if-new: creating GitHub release v${version}...`);
const release = spawnSync(
  'gh',
  ['release', 'create', `v${version}`, '--title', `v${version}`, '--notes', notes],
  { stdio: 'inherit' },
);
process.exit(release.status ?? 1);
