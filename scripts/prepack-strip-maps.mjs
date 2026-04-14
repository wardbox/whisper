#!/usr/bin/env node
// scripts/prepack-strip-maps.mjs
// Phase 7: Strip ESM source maps from packages/whisper/dist before pack/publish.
//
// Per CONTEXT.md user decision: "Source maps: Strip via prepack script."
// Reason: tsdown 0.21.4 force-emits .js.map files even when sourceMap: false
// (rolldown/tsdown issue #360, coupled with declarationMap). The maps inflate
// the tarball ~500KB with no consumer benefit. Local development still gets
// maps because we only strip immediately before pack.
//
// CJS source maps are NOT emitted by tsdown (verified 2026-04-11), so this
// script only needs to remove .js.map. Keeps .d.ts.map (declaration maps)
// untouched per the user decision: "Do NOT attempt to fix tsdown's
// declarationMap/sourceMap coupling (rolldown/tsdown#360) -- upstream concern."

import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../packages/whisper/dist');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

let removed = 0;
let bytesFreed = 0;

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

const kb = (bytesFreed / 1024).toFixed(1);
console.log(`prepack-strip-maps: removed ${removed} .js.map files (${kb} KB freed)`);
