#!/usr/bin/env node
// Patches e2e/smoke/package.json to reference a specific tarball.
// Usage: node scripts/smoke/patch-manifest.mjs <tarball-filename>
// Called by CI workflow and scripts/smoke/run.mjs.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const smokePkgPath = resolve(__dirname, "../../e2e/smoke/package.json");

const tarball = process.argv[2];
if (!tarball) {
	console.error("Usage: patch-manifest.mjs <tarball-filename>");
	process.exit(1);
}

// Determine if tarball is a filename (CI: local to e2e/smoke/) or a relative path (local runner)
const dep = tarball.includes("/") ? `file:${tarball}` : `file:./${tarball}`;

const pkg = JSON.parse(readFileSync(smokePkgPath, "utf8"));
pkg.dependencies["@wardbox/whisper"] = dep;
writeFileSync(smokePkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`patch-manifest: set @wardbox/whisper -> ${dep}`);
