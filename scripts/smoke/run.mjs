#!/usr/bin/env node
// scripts/smoke/run.mjs — Phase 7 smoke orchestrator.
//
// Reproduces the CI smoke matrix locally:
//   1. Build packages/whisper
//   2. Pack into a tarball (version read from package.json)
//   3. Bust pnpm's tarball cache and reinstall the smoke fixture
//   4. Run typecheck + Node ESM + Node CJS smoke entries
//   5. Conditionally run Bun + Deno legs IF the runtimes are installed locally
//
// Per CONTEXT.md D-05: this script runs the same sequence CI runs, no CI-only magic.
// Per RESEARCH Pitfall 5: --force is required to bust pnpm's tarball cache between runs.

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const pkgDir = join(repoRoot, 'packages/whisper');
const smokeDir = join(repoRoot, 'e2e/smoke');
const whisperPkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const TARBALL_NAME = `wardbox-whisper-${whisperPkg.version}.tgz`;

function run(cmd, opts = {}) {
  const label = opts.cwd ? opts.cwd.replace(repoRoot + '/', '') : '.';
  console.log(`\n$ ${cmd}  (in ${label})`);
  try {
    execSync(cmd, { stdio: 'inherit', ...opts });
  } catch {
    console.error(`\nsmoke: FAILED at step: ${cmd}`);
    process.exit(1);
  }
}

function which(bin) {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin], {
    stdio: 'pipe',
  });
  return result.status === 0;
}

// ---------- 1. Build ----------
run('pnpm --filter @wardbox/whisper build', { cwd: repoRoot });

// ---------- 2. Pack ----------
run('pnpm pack --pack-destination .', { cwd: pkgDir });

const packedAt = join(pkgDir, TARBALL_NAME);
if (!existsSync(packedAt)) {
  console.error(`smoke: expected packed tarball at ${packedAt} but not found`);
  process.exit(1);
}
console.log(`\nsmoke: tarball ready at ${packedAt}`);

// Update the smoke fixture's package.json to point at the correct tarball version
const smokePkgPath = join(smokeDir, 'package.json');
const smokePkg = JSON.parse(readFileSync(smokePkgPath, 'utf8'));
smokePkg.dependencies['@wardbox/whisper'] = `file:../../packages/whisper/${TARBALL_NAME}`;
writeFileSync(smokePkgPath, JSON.stringify(smokePkg, null, 2) + '\n');

// ---------- 3. Bust pnpm cache: remove node_modules and lockfile ----------
const smokeNodeModules = join(smokeDir, 'node_modules');
if (existsSync(smokeNodeModules)) {
  console.log(`smoke: removing stale ${smokeNodeModules}`);
  rmSync(smokeNodeModules, { recursive: true, force: true });
}
const smokeLockfile = join(smokeDir, 'pnpm-lock.yaml');
if (existsSync(smokeLockfile)) {
  rmSync(smokeLockfile);
}

// ---------- 4. Install the tarball into the smoke fixture ----------
run('pnpm install --force --ignore-workspace', { cwd: smokeDir });

// ---------- 5. Type check + Node legs (always run) ----------
run('npx tsc --noEmit', { cwd: smokeDir });
run('node smoke.mjs', { cwd: smokeDir });
run('node smoke.cjs', { cwd: smokeDir });

// ---------- 6. Optional Bun leg ----------
if (which('bun')) {
  console.log('\nsmoke: bun detected — running Bun leg');
  run('bun run smoke_bun.ts', { cwd: smokeDir });
} else {
  console.log('\nsmoke: bun not installed locally — skipping Bun leg (CI runs it)');
}

// ---------- 7. Optional Deno leg ----------
if (which('deno')) {
  console.log('\nsmoke: deno detected — running Deno leg');
  // node_modules is already populated by pnpm above; deno reads it via nodeModulesDir: auto
  run('deno run --allow-read --allow-env --node-modules-dir=auto smoke_deno.ts', { cwd: smokeDir });
} else {
  console.log('\nsmoke: deno not installed locally — skipping Deno leg (CI runs it)');
}

console.log('\nsmoke: all available runtime legs passed');
