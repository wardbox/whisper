#!/usr/bin/env node
// e2e/smoke/tree-shake/check.mjs
// Phase 7 D-20: Bundle each entry with esbuild, grep output for cross-game symbols.
// The assertion: importing /tft must NOT pull in any LoL, Val, LoR, or Riftbound
// game-specific exports. The shared core (rate limiter, cache, errors) IS expected
// in the bundle and is not asserted against.
//
// REQUIREMENT: e2e/smoke/node_modules/@wardbox/whisper must exist (run `pnpm smoke`
// first to populate it from the packed tarball). esbuild resolves the imports through
// node_modules.

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as esbuild from "esbuild";

const here = dirname(new URL(import.meta.url).pathname);
const smokeDir = resolve(here, "..");

// Pre-flight: ensure the smoke fixture is installed
const installedPkg = resolve(
	smokeDir,
	"node_modules/@wardbox/whisper/package.json",
);
if (!existsSync(installedPkg)) {
	console.error(
		"tree-shake: e2e/smoke/node_modules/@wardbox/whisper not found.",
	);
	console.error(
		"Run `pnpm smoke` first to pack and install the library into the smoke fixture.",
	);
	process.exit(1);
}

// Game-specific symbol lists. CRITICAL: these must match exact namespace identifiers
// exported from packages/whisper/src/<game>/index.ts. Verified 2026-04-12.
//
// If a symbol name is wrong, the assertion silently passes (false negative).
const SYMBOLS = {
	lol: [
		"championMasteryV4",
		"championV3",
		"clashV1",
		"leagueExpV4",
		"leagueV4",
		"lolChallengesV1",
		"lolRsoMatchV1",
		"lolStatusV4",
		"matchV5",
		"spectatorV5",
		"summonerV4",
		"tournamentStubV5",
		"tournamentV5",
	],
	tft: [
		"spectatorTftV5",
		"tftLeagueV1",
		"tftMatchV1",
		"tftStatusV1",
		"tftSummonerV1",
	],
	val: [
		"valConsoleMatchV1",
		"valConsoleRankedV1",
		"valContentV1",
		"valMatchV1",
		"valRankedV1",
		"valStatusV1",
	],
	lor: ["lorRankedV1", "lorStatusV1"],
	riftbound: ["riftboundContentV1"],
};

async function bundle(entryFile) {
	const result = await esbuild.build({
		entryPoints: [resolve(here, entryFile)],
		bundle: true,
		format: "esm",
		platform: "neutral",
		target: "es2022",
		minify: false, // keep readable for grep
		treeShaking: true,
		write: false,
		absWorkingDir: smokeDir, // resolve node_modules from e2e/smoke/
		logLevel: "warning",
	});
	if (result.outputFiles.length === 0) {
		throw new Error(`esbuild produced no output for ${entryFile}`);
	}
	return result.outputFiles[0].text;
}

function assertNoSymbols(label, code, forbiddenGroups) {
	const leaks = [];
	for (const group of forbiddenGroups) {
		for (const sym of SYMBOLS[group]) {
			// Match the symbol as a standalone identifier (avoid partial matches inside other names)
			const re = new RegExp(`\\b${sym}\\b`);
			if (re.test(code)) {
				leaks.push(`${group}.${sym}`);
			}
		}
	}
	if (leaks.length > 0) {
		console.error(
			`tree-shake: ${label} bundle leaked ${leaks.length} cross-game symbols:`,
		);
		for (const l of leaks) console.error(`  - ${l}`);
		return false;
	}
	console.log(`tree-shake: ${label} -- no cross-game leaks`);
	return true;
}

let allPassed = true;

console.log("tree-shake: bundling entry-tft.ts");
const tftBundle = await bundle("entry-tft.ts");
allPassed =
	assertNoSymbols("/tft", tftBundle, ["lol", "val", "lor", "riftbound"]) &&
	allPassed;

console.log("tree-shake: bundling entry-lol.ts");
const lolBundle = await bundle("entry-lol.ts");
allPassed =
	assertNoSymbols("/lol", lolBundle, ["tft", "val", "lor", "riftbound"]) &&
	allPassed;

if (!allPassed) {
	process.exit(1);
}

console.log("\ntree-shake: all entries pass -- per-game tree-shaking verified");
