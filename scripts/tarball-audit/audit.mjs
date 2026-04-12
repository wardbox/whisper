#!/usr/bin/env node
// scripts/tarball-audit/audit.mjs
// Phase 7 D-21: pack @wardbox/whisper, enumerate file paths, diff against allowlist.
// Uses @publint/pack (added as a packages/whisper devDep in Plan 01).

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// @publint/pack is a devDep of packages/whisper, not the root workspace.
// Use createRequire to resolve it from the whisper package directory.
const repoRoot = resolve(new URL("../..", import.meta.url).pathname);
const require_ = createRequire(
	resolve(repoRoot, "packages/whisper/package.json"),
);
const { packAsList } = require_("@publint/pack");

const pkgDir = resolve(repoRoot, "packages/whisper");
const allowlistPath = resolve(repoRoot, "e2e/tarball-allowlist.json");

console.log(`tarball-audit: packing ${pkgDir}`);

// packAsList returns string[] of relative file paths that were packed.
// We prefix with "package/" to match npm tarball extraction convention.
const rawPaths = await packAsList(pkgDir, { packageManager: "pnpm" });
const filePaths = rawPaths.map((f) => `package/${f}`).sort();

const { allowed } = JSON.parse(readFileSync(allowlistPath, "utf8"));

// Convert glob patterns to RegExp.
// Supported glob syntax: `*` matches any non-`/` chars; `**` matches anything (including /).
function globToRegex(glob) {
	const escaped = glob
		.replace(/[.+^${}()|[\]\\]/g, "\\$&") // escape regex metachars
		.replace(/\*\*/g, "\u0001") // placeholder for **
		.replace(/\*/g, "[^/]*") // * matches non-slash
		.replace(/\u0001/g, ".*"); // ** matches anything
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
	console.error("\ntarball-audit: FAIL -- unexpected files in tarball:");
	for (const f of unexpected) console.error(`  + ${f}`);
	console.error(
		"\nIf these files are intentional, add them to e2e/tarball-allowlist.json",
	);
	failed = true;
}

if (unmatchedAllowlistEntries.length > 0) {
	console.warn(
		"\ntarball-audit: WARN -- allowlist entries not matched by any tarball file:",
	);
	for (const g of unmatchedAllowlistEntries) console.warn(`  - ${g}`);
	console.warn(
		"(These may be stale; consider removing from the allowlist.)",
	);
	// Warn only -- does not fail. New dist outputs may shift over time.
}

if (failed) {
	process.exit(1);
}

console.log(
	`\ntarball-audit: ok -- ${filePaths.length} files, all in allowlist`,
);

// Also assert LICENSE and README presence as a hard regression check for Bug 1
const hasLicense = filePaths.some((f) => /package\/LICENSE$/.test(f));
const hasReadme = filePaths.some((f) => /package\/README\.md$/.test(f));
if (!hasLicense) {
	console.error(
		"tarball-audit: FAIL -- package/LICENSE missing from tarball (Bug 1 regression)",
	);
	process.exit(2);
}
if (!hasReadme) {
	console.error(
		"tarball-audit: FAIL -- package/README.md missing from tarball (Bug 1 regression)",
	);
	process.exit(3);
}

console.log("tarball-audit: LICENSE + README confirmed in tarball");
