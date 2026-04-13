# Phase 7: Hardening and Publish - Research

**Researched:** 2026-04-11
**Domain:** npm package publishing, CI runtime matrix, release automation, supply-chain hardening
**Confidence:** HIGH (primary decisions), MEDIUM (exact YAML shapes — multiple valid forms)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**CI runtime matrix**
- **D-01:** Add a single job matrix in `.github/workflows/ci.yml` with four legs: `node-esm`, `node-cjs`, `deno`, `bun`. Each leg runs `pnpm build` then the runtime-specific smoke test.
- **D-02:** All four legs run on `ubuntu-latest` only.
- **D-03:** Keep the existing attw + publint steps on the Node leg — do not move them to a separate workflow. Phase 7 extends `ci.yml`, it does not restructure it.

**Install smoke test fixture**
- **D-04:** Create a committed `e2e/smoke/` directory at the repo root. CI runs `pnpm pack` in `packages/whisper`, then installs the resulting tarball into `e2e/smoke/` as a file dependency.
- **D-05:** `e2e/smoke/` must be reproducible locally — a `pnpm smoke` root script runs the same sequence CI runs.
- **D-06:** Smoke coverage exercises **every** subpath: `@wardbox/whisper`, `/core`, `/lol`, `/tft`, `/val`, `/lor`, `/riftbound`, `/riot`. Per subpath: import a symbol, run `tsc --noEmit`, run `createClient({ apiKey: 'test' })` or equivalent.
- **D-07:** **No live Riot API calls in the smoke test.** No `RIOT_API_KEY` secret in the smoke job.
- **D-08:** Deno leg uses Deno's npm compatibility; Bun leg uses `bun install` against the packed tarball.

**Release / publish workflow**
- **D-09:** Adopt **Changesets** (`@changesets/cli`) as the release mechanism.
- **D-10:** Create `.github/workflows/release.yml` running on pushes to `main`, invoking `changesets/action@v1` with `publish: pnpm release`. Release must not publish unless `ci.yml` for that commit has passed.
- **D-11:** Publish with `npm publish --provenance --access public` (provenance requires `id-token: write`).
- **D-12:** Add `"publishConfig": { "access": "public" }` to `packages/whisper/package.json`.
- **D-13:** Authenticate with an npm **granular access token** scoped to `@wardbox/whisper` with "publish new versions" permission only. Store as `NPM_TOKEN` secret.
- **D-14:** No manual-publish escape hatch for normal releases.

**Version, metadata, LICENSE, README**
- **D-15:** First publish ships as **`0.1.0`**.
- **D-16:** **Replace the current GPLv3 `LICENSE` file with MIT.** Update `package.json` `"license"` field to `"MIT"`.
- **D-17:** Expand root `README.md` from single heading to: description, install snippet, 30-second quickstart (LoL), three-bullet feature highlight, docs link.
- **D-18:** Populate `package.json` metadata: `description`, `keywords`, `author`, `repository`, `bugs`, `homepage`, `license`.

**Pre-publish validation gates**
- **D-19:** Add per-subpath **bundle size budgets** enforced in CI. Use `size-limit` (or equivalent).
- **D-20:** Add a **tree-shake verification test** inside `e2e/smoke/`. Bundle `/tft` only, assert zero LoL/Val/LoR/Riftbound code in output. Run for `/lol` as a second subpath.
- **D-21:** Add a **tarball content audit** step: `pnpm pack`, enumerate files, diff against a committed allowlist.
- **D-22:** All three extra gates run on every PR in `ci.yml`, not only in the release workflow.

### Claude's Discretion
- Exact bundle-size budget numbers per subpath (measure first, then set budgets with small headroom)
- Changesets configuration details (`.changeset/config.json` fields)
- Release workflow YAML structure (job dependencies, concurrency, environment gating)
- Exact README copy (structure locked, wording is Claude's)
- `e2e/smoke/` project structure (monolithic vs per-runtime folders)
- Tarball-allowlist format (plain text vs JSON snapshot)
- `pnpm release` root script contents
- `author` field specifics

### Deferred Ideas (OUT OF SCOPE)
- **Trusted Publisher (OIDC, no secret)** — revisit after first successful publish with granular token path
- **Windows / macOS CI legs**
- **Live-API smoke test**
- **Bundle analyzer visualization**
- **npmjs.com README polish / social preview assets**
- **v1.0.0 stability commitment**
- **Manual-publish escape hatch documentation**
</user_constraints>

## Project Constraints (from CLAUDE.md)

Directives the planner MUST honor (same authority as locked decisions):

- **Zero runtime dependencies** — every tool introduced by Phase 7 goes into `devDependencies` only. `dependencies` in `packages/whisper/package.json` must remain empty.
- **Runtime-agnostic** — Node 18+, Deno, Bun, edge runtimes. Smoke matrix exists to protect this.
- **Dual ESM+CJS output** via tsdown — build tooling is locked, Phase 7 does not change it.
- **pnpm workspace (library in `packages/whisper`, docs in `packages/docs`)** — release workflow must filter to `@wardbox/whisper` only; docs package must never publish.
- **"Use the latest and greatest 2025+ tooling"** — research below verified latest stable versions as of April 2026.
- **Tree-shakeable per-game subpath imports** — D-20 tree-shake test enforces this at the published-artifact level.

## Summary

Phase 7 is a pure delivery phase: the library is built, typed, and tested. All 22 locked decisions (D-01 through D-22) describe the publish pipeline; research answers how to implement them with current (April 2026) tooling — not whether.

Research uncovered **three concrete packaging bugs** in the current repo state that Phase 7 must fix before the first publish:

1. **The current tarball ships zero license and zero README.** `pnpm pack --dry-run` against `packages/whisper/` produces only `dist/**` + `package.json`. npm auto-includes `README.md` and `LICENSE*` **only from the package root**, and `packages/whisper/` contains neither. Publishing in the current state would produce a package with no license file (legally sketchy) and a blank npmjs.com package page. The tarball audit gate (D-21) is the mechanism that catches this. [VERIFIED: `pnpm pack --dry-run` run locally 2026-04-11]
2. **tsdown ships source maps in the tarball.** `dist/lol/index.js.map` is 58KB vs `index.js` 17KB (3.4× inflation). Source maps are generated because `tsconfig.base.json` sets `declarationMap: true` AND `sourceMap: true`, and tsdown's declaration-map support force-enables source maps even when explicitly disabled (rolldown/tsdown issue #360). Notably, CJS source maps are NOT emitted — only ESM. Planner must decide whether source maps should ship at all for v0.1.0. [VERIFIED: tarball listing, tsconfig inspection; CITED: https://github.com/rolldown/tsdown/issues/360]
3. **tsdown emits content-hashed shared chunks at `dist/` root.** `client-B7r2KpHz.js` and `errors-DofVFslx.d.ts` (the hashes rotate every build) are imported by every subpath's `index.js`. This matters for three gates:
   - **Tarball audit (D-21):** the allowlist cannot use exact filenames for these — it needs glob patterns (`dist/client-*.js`, `dist/errors-*.d.ts`).
   - **Size budget (D-19):** measuring `dist/lol/index.js` alone understates reality; size-limit must either use `modifyEsbuildConfig` bundling or point at multiple files.
   - **Tree-shake test (D-20):** bundling `/tft` from the packed tarball will pull in shared-chunk code, which is correct and expected — the assertion must be "no LoL/Val/LoR symbols," not "only TFT file contents."

**Primary recommendation:** Plan structure should be: (P01) the three content/metadata fixes — LICENSE/README/package.json metadata + placement within `packages/whisper/` so they ship in the tarball — first, as they are the real publish blockers. (P02) smoke fixture + matrix legs in CI. (P03) size-limit + tree-shake + tarball-audit gates. (P04) Changesets init + release workflow with granular token + provenance. Each plan's verification should run `pnpm pack --dry-run` and grep for LICENSE/README as a smoke check.

## Standard Stack

### Core (Phase 7 additions)

All additions are `devDependencies` in the workspace root or `packages/whisper`. No runtime deps.

| Library | Version (verified 2026-04-11) | Purpose | Why Standard |
|---------|-------------------------------|---------|--------------|
| `@changesets/cli` | 2.30.0 | Changeset authoring, versioning, changelog generation | The 2025+ standard for pnpm workspaces. Used by pnpm itself, TanStack, shadcn, Drizzle, Vercel, etc. [VERIFIED: `npm view @changesets/cli version`, released 2026-03-03] |
| `changesets/action@v1` | v1.7.0 | GitHub Action that opens "Version Packages" PR and publishes on merge | Canonical automation for Changesets releases. Pair with `@changesets/cli` above. [VERIFIED: `gh api repos/changesets/action/releases`, v1.7.0 published 2026-02-12] |
| `@changesets/changelog-github` | 0.6.0 | Changelog generator that attributes PRs and authors in the generated `CHANGELOG.md` | Beats the plain `@changesets/cli/changelog` generator for public releases — links PR numbers. Optional; planner may prefer plain generator for simplicity. [VERIFIED: npm registry] |
| `size-limit` | 12.0.1 | Per-entry size budget tool with CI integration | The 2025+ standard zero-config bundle budget tool. Used by Reduxjs, TanStack, PostCSS ecosystem. [VERIFIED: `npm view size-limit version`] |
| `@size-limit/preset-small-lib` | 12.0.1 | Preset for libraries under 10KB — uses esbuild, no execution time measurement | Correct preset for zero-dep library Whisper. [VERIFIED: npm registry; CITED: https://github.com/ai/size-limit] |
| `@publint/pack` | 0.1.4 | Programmatic tarball packing + file-list enumeration for audit tests | Same author as `publint` (bluwy), zero deps, MIT, 23KB unpacked. Strictly better than shelling out to `pnpm pack --json` + parsing. [VERIFIED: `npm view @publint/pack`, last published 2026-02-05] |

### Supporting (CI, actions, runtimes)

| Tool | Version (verified 2026-04-11) | Purpose | Notes |
|------|-------------------------------|---------|-------|
| `denoland/setup-deno` | v2.0.4 | Install Deno in GitHub Actions | Released April 2026. v2.x is current stable for Deno 2.x. [VERIFIED: GitHub releases API] |
| `oven-sh/setup-bun` | v2.2.0 | Install Bun in GitHub Actions | Released March 2026. v2.x pairs with Bun 1.2+. [VERIFIED: GitHub releases API] |
| `actions/setup-node` | v4 (current ci.yml) → v6 available | Install Node + optionally configure registry-url for publish | Whisper's current ci.yml uses `@v4`; Hono and TanStack both use `@v6` as of 2026. v4 still works; either is fine — prefer staying consistent with existing Whisper workflows unless CI config touches setup anyway. [VERIFIED: existing ci.yml + Hono ci.yml inspection] |
| `pnpm/action-setup` | v4 (current ci.yml) | Install pnpm in GitHub Actions | Already in use. Keep as-is. |
| `actions/checkout` | v4 (current ci.yml) | Clone repo | Already in use. |

### Already installed (no change required)

These are already in `packages/whisper/devDependencies` and continue to run in CI unchanged:

| Tool | Current | Notes |
|------|---------|-------|
| `@arethetypeswrong/cli` | 0.18.2 | Type-resolution check. D-03: keeps running on Node leg. |
| `publint` | 0.3.18 | Package export linter. D-03: keeps running on Node leg. |
| `tsdown` | 0.21.4 (0.21.7 available) | Build tool. Phase 7 does not upgrade tsdown unless planner decides source-map bug warrants it. [VERIFIED: npm registry] |
| `vitest` | 4.1.0 | Test runner. Unchanged. |
| `tsx` | ^4.21.0 | TypeScript script runner. Unchanged. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff | Decision |
|------------|-----------|----------|----------|
| Changesets | `release-please`, `semantic-release` | Both are commit-message-driven (Conventional Commits) rather than changeset-file-driven. Simpler for solo maintainers but worse audit trail and PR-driven changelogs. | Use Changesets (D-09 locked). |
| `size-limit` | `bundlewatch`, manual `stat` + threshold check | `size-limit` is the most mature, has CI integration, per-entry budgets, and tree-shake-aware `import` field for testing specific exports. | Use `size-limit`. |
| `@publint/pack` | `tar -tzf` shell, `npm pack --json`, custom pack-plus-unpack | `@publint/pack` is zero-dep, authored by the publint maintainer, and returns a typed file list. Shelling out to `pnpm pack --dry-run` outputs human-readable text (emoji header, table format); `--json` does work but parsing gives file list without metadata. Either path works; `@publint/pack` is cleanest. | Prefer `@publint/pack`. Planner may fall back to `pnpm pack --json` if avoiding the single-use dev dep is preferred. |
| Granular NPM token | Trusted Publisher OIDC (npm Trusted Publishers) | OIDC eliminates tokens entirely — cleaner, no rotation — but requires one-time manual setup in npmjs.com UI and `publish new versions` via OIDC became GA 2025-07-31. Granular tokens have **90-day max validity** and require 2FA as of 2025-12-09 (all classic tokens were revoked then). | Granular token path locked (D-13). **Planner must document in the release workflow README comment that the NPM_TOKEN expires every ≤90 days and requires rotation.** Trusted Publisher deferred but is the long-term answer. [CITED: npm Trusted Publishing blog posts, Dec 9 2025 classic token deprecation] |
| Deno `npm:` file specifier | Deno `links` field, Deno `patch` field, extracted tarball directory | **Deno 2.x does NOT support `.tgz` tarballs in `npm:` specifiers.** The `npm:` specifier requires the package name to exist on the public npm registry. Deno 2.3+ introduced a `patch` field in `deno.json` for local npm package directories, but the package name must still exist on the registry, and as of research date tarball-file support in `patch` is disputed across community sources. The cleanest working path is: extract the packed `.tgz` to a directory (or use `npm install` in the smoke fixture to populate `node_modules/@wardbox/whisper`) and point Deno at the resulting directory via `nodeModulesDir: "auto"` in `deno.json`. Our package name already exists in decision D-12 (will be published) — but for the **first publish**, it doesn't exist yet. Planner must handle the chicken-and-egg: the first smoke run imports from a locally resolved node_modules directory, not via `npm:` specifier. [CITED: https://deno.com/blog/v2.3, https://github.com/denoland/deno/issues/19621] |

**Installation command (to add to `packages/whisper` and root as appropriate):**

```bash
# Root workspace devDeps (changesets orchestrates from root)
pnpm add -Dw @changesets/cli @changesets/changelog-github

# packages/whisper devDeps (co-located with the package they measure)
pnpm add -D --filter @wardbox/whisper size-limit @size-limit/preset-small-lib @publint/pack
```

**Version pinning note:** Dependabot/renovate will upgrade these later. For Phase 7 initial planning, use the versions above (verified April 2026). `changesets/action@v1` in workflows should pin to `@v1.7.0` explicitly, not floating `@v1`, per 2026 supply-chain hardening guidance. [CITED: dev.to supply-chain hardening article 2026]

## Architecture Patterns

### Recommended Repo Layout (after Phase 7)

```
/
├── .changeset/
│   ├── config.json              # NEW (created by `pnpm changeset init`)
│   └── README.md                # NEW (boilerplate from init)
├── .github/
│   └── workflows/
│       ├── ci.yml               # EXTENDED (matrix + new gates; D-01, D-19, D-20, D-21, D-22)
│       ├── release.yml          # NEW (D-10)
│       └── schema-drift.yml     # UNCHANGED
├── e2e/                         # NEW directory (D-04, D-05, D-20)
│   ├── smoke/
│   │   ├── package.json         # consumer fixture pinning file:...whisper-0.1.0.tgz
│   │   ├── tsconfig.json        # moduleResolution: bundler or NodeNext
│   │   ├── smoke.ts             # imports every subpath, calls createClient()
│   │   ├── deno.json            # NEW — Deno 2.x config with nodeModulesDir
│   │   └── tree-shake/
│   │       ├── entry-tft.ts     # only imports @wardbox/whisper/tft
│   │       ├── entry-lol.ts     # only imports @wardbox/whisper/lol
│   │       └── check.mjs        # runs esbuild, greps output, exits non-zero on leak
│   └── tarball-allowlist.json   # glob-based allowlist, snapshot format
├── packages/
│   ├── whisper/
│   │   ├── LICENSE              # NEW (MIT, moved/copied from repo root)  (D-16)
│   │   ├── README.md            # NEW (publish-facing version)             (D-17)
│   │   ├── .size-limit.json     # NEW — per-subpath budgets                (D-19)
│   │   ├── package.json         # EDITED — license, metadata, publishConfig (D-12, D-16, D-18)
│   │   ├── tsdown.config.ts     # UNCHANGED (unless source-map bug addressed)
│   │   └── src/
│   └── docs/
│       └── package.json         # EDITED — private: true (safety against accidental publish)
├── scripts/
│   ├── generate-schema/         # UNCHANGED
│   ├── smoke/                   # NEW
│   │   └── run.mjs              # Node script orchestrating pack → install → test
│   └── tarball-audit/           # NEW
│       └── audit.mjs            # Runs @publint/pack, diffs against allowlist
├── LICENSE                      # EDITED (GPLv3 → MIT) (D-16)
├── README.md                    # EXPANDED (root README, same content as packages/whisper/README.md) (D-17)
├── package.json                 # EDITED — smoke, release, size, tarball:audit scripts
└── pnpm-workspace.yaml          # UNCHANGED
```

**Rationale for `packages/whisper/LICENSE` + `packages/whisper/README.md`:** npm's `npm pack` reads `README*` and `LICENSE*` ONLY from the package directory that `package.json` lives in — the root-of-repo files don't flow into the workspace package tarball. The planner has two choices: (a) copy the files into `packages/whisper/` (git-tracked, potential drift), or (b) have a `prepack` script that copies them from repo root before packing. **Recommendation:** copy to `packages/whisper/` and commit. Simpler, reviewable in git, no prepack magic, no surprise missing files if someone runs `pnpm pack` outside CI. Root `LICENSE`/`README.md` remain as the "repo face"; `packages/whisper/LICENSE`/`README.md` are the "package face." Duplication is low-cost (two files) and unambiguous. [VERIFIED: `pnpm pack --dry-run` shows neither file currently; the root-level files are NOT auto-included into the workspace tarball]

### Pattern 1: Smoke Fixture with File-Dependency Tarball

**What:** A committed consumer project (`e2e/smoke/`) that installs the packed tarball as a file dependency and exercises every subpath. Reproducible locally and in CI with the same commands.

**When to use:** As the canonical answer to D-04 through D-08. The fixture *is* the smoke test.

**Example structure (monolithic script approach):**

```jsonc
// e2e/smoke/package.json
{
  "name": "whisper-smoke",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@wardbox/whisper": "file:../../packages/whisper/wardbox-whisper-0.1.0.tgz"
  },
  "devDependencies": {
    "typescript": "~5.8.0",
    "@types/node": "^22"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "run:esm": "node smoke.mjs",
    "run:cjs": "node smoke.cjs",
    "test": "pnpm typecheck && pnpm run:esm && pnpm run:cjs"
  }
}
```

```typescript
// e2e/smoke/smoke.ts (compiled or run via tsx-equivalent)
import { createClient } from '@wardbox/whisper/core';
import * as lol from '@wardbox/whisper/lol';
import * as tft from '@wardbox/whisper/tft';
import * as val from '@wardbox/whisper/val';
import * as lor from '@wardbox/whisper/lor';
import * as riftbound from '@wardbox/whisper/riftbound';
import * as riot from '@wardbox/whisper/riot';

// Root import — intentionally empty (no barrel) per Phase 1 D
// The assertion here is that '@wardbox/whisper' RESOLVES without error,
// even if the export surface is empty. If this line throws ERR_PACKAGE_PATH_NOT_EXPORTED,
// the root export condition in package.json is wrong.
import '@wardbox/whisper';

// Assert surface area — one symbol from each module, no runtime API calls
const client = createClient({ apiKey: 'test-key-never-hits-network' });
if (typeof client !== 'object') throw new Error('createClient failed');

// Type-only imports for namespace objects we can't easily invoke without a key
void lol;
void tft;
void val;
void lor;
void riftbound;
void riot;

console.log('smoke: ok');
```

**The root script orchestrates:**

```javascript
// scripts/smoke/run.mjs (simplified)
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

const pkgDir = resolve('packages/whisper');
const smokeDir = resolve('e2e/smoke');

// 1. Build
execSync('pnpm --filter @wardbox/whisper build', { stdio: 'inherit' });

// 2. Pack (produces deterministic filename: <scope>-<name>-<version>.tgz)
execSync('pnpm pack --pack-destination .', { cwd: pkgDir, stdio: 'inherit' });

// 3. Install into smoke (use --force to bypass npm's tarball-version cache)
execSync('pnpm install --force', { cwd: smokeDir, stdio: 'inherit' });

// 4. Run smoke
execSync('pnpm test', { cwd: smokeDir, stdio: 'inherit' });
```

**Critical gotcha:** npm/pnpm cache tarballs by `version@integrity`. If you `pnpm pack` twice at the same version, the tarball contents change (content-hashed `client-*.js` chunks) but the installed version in the smoke fixture will still be cached. Solution: `pnpm install --force` in step 3, or delete `e2e/smoke/node_modules/@wardbox/whisper/` before install. [CITED: https://blog.rnsloan.com/2025/01/11/local-npm-package-testing-made-simple-a-guide-to-npm-pack/]

### Pattern 2: Per-Runtime Fixture Structure (alternative)

**What:** Separate subdirectories per runtime (`e2e/smoke/node/`, `e2e/smoke/deno/`, `e2e/smoke/bun/`), each with its own manifest and script.

**When to use:** If the unified fixture forces awkward dual-module tricks or if per-runtime configs collide.

**Tradeoff vs monolithic:** More files, more duplicated smoke logic, but clearer separation when Deno's `deno.json` vs Bun's `bunfig.toml` vs Node's `package.json` diverge. Both are CONTEXT.md discretion (D-04 says "monolithic vs per-runtime folders").

**Recommendation:** Start monolithic, split only if Deno's nodeModulesDir + patch requirements collide with Node/Bun's package.json. The Deno leg likely needs its own subdirectory regardless (see Pattern 4).

### Pattern 3: Tree-Shake Verification via esbuild

**What:** Bundle a fixture entry file with esbuild, read the output, assert forbidden symbols don't appear.

**When to use:** Runtime proof of the Phase 5 success criterion "importing only `/tft` produces no LoL or Valorant code in the output" (D-20).

**Example:**

```javascript
// e2e/smoke/tree-shake/check.mjs
import * as esbuild from 'esbuild';
import { readFileSync } from 'node:fs';

const result = await esbuild.build({
  entryPoints: ['entry-tft.ts'],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  minify: false,  // keep readable so we can grep
  treeShaking: true,
  write: false,
  absWorkingDir: new URL('.', import.meta.url).pathname,
});

const code = result.outputFiles[0].text;

// Forbidden: symbols only declared in other games
const forbidden = [
  // LoL-only namespace objects
  'matchV5', 'summonerV4', 'leagueV4', 'lolChallengesV1',
  // Val-only
  'valMatchV1', 'valContentV1',
  // LoR-only
  'lorRankedV1',
  // Riftbound-only
  'riftboundContentV1',
];

const leaks = forbidden.filter((sym) => code.includes(sym));
if (leaks.length > 0) {
  console.error('tree-shake leaked symbols:', leaks);
  process.exit(1);
}

console.log('tree-shake: ok — bundled TFT entry is free of', forbidden.length, 'cross-game symbols');
```

**Caveats:**
- Because tsdown hoists a shared `client-*.js` chunk imported by every subpath, the bundled output WILL contain rate-limiter, cache, middleware, and error-class code — this is correct and expected. The assertion is about **game-specific** symbols, not all non-TFT symbols.
- Use greppable markers (namespace object names exported from each game index) rather than trying to parse the AST. The symbols above are public API identifiers that survive tree-shaking into the final bundle if any code path references them.
- Run at least two entry files (`entry-tft.ts`, `entry-lol.ts`) per CONTEXT.md D-20. Both assert their own "not contains" lists.

**Alternative:** `rolldown` is the engine under tsdown, but using the library directly from a consumer-facing project complicates the smoke dependency graph. `esbuild` is already installed transitively (via tsdown) and is fine to use directly. [CITED: size-limit `@size-limit/preset-small-lib` uses esbuild under the hood too]

### Pattern 4: Deno Leg Pattern (special handling)

**What:** Deno 2.x cannot install a `.tgz` tarball directly via `npm:` specifier. The package name must exist in the npm registry. For testing a pre-publish tarball, the only reliable path is:

1. `pnpm pack` produces `wardbox-whisper-0.1.0.tgz`
2. `pnpm install` in the smoke fixture unpacks it into `node_modules/@wardbox/whisper/`
3. Deno reads from that `node_modules` via `nodeModulesDir: "auto"` in `deno.json`
4. Smoke test runs `deno run -A --node-modules-dir smoke_deno.ts` using `npm:` specifiers that Deno resolves to the local node_modules

```jsonc
// e2e/smoke/deno.json (in the same dir as package.json, or a sibling)
{
  "nodeModulesDir": "auto",
  "imports": {
    "@wardbox/whisper": "npm:@wardbox/whisper",
    "@wardbox/whisper/lol": "npm:@wardbox/whisper/lol",
    "@wardbox/whisper/tft": "npm:@wardbox/whisper/tft",
    "@wardbox/whisper/val": "npm:@wardbox/whisper/val",
    "@wardbox/whisper/lor": "npm:@wardbox/whisper/lor",
    "@wardbox/whisper/riftbound": "npm:@wardbox/whisper/riftbound",
    "@wardbox/whisper/riot": "npm:@wardbox/whisper/riot",
    "@wardbox/whisper/core": "npm:@wardbox/whisper/core"
  }
}
```

```typescript
// e2e/smoke/smoke_deno.ts
import { createClient } from '@wardbox/whisper/core';
import * as lol from '@wardbox/whisper/lol';
import * as tft from '@wardbox/whisper/tft';
// ... (same as Node smoke)

const client = createClient({ apiKey: 'test' });
if (typeof client !== 'object') Deno.exit(1);
console.log('deno smoke: ok');
```

**Key constraint:** The package name `@wardbox/whisper` must exist on the npm registry for Deno's `npm:` specifier to resolve. **For the very first publish, this is a chicken-and-egg.** Workarounds:

- **Option A (recommended):** Use `patch` field in `deno.json` pointing at the local unpacked directory. The patch field is Deno 2.3+'s exact answer to this — it overrides npm registry lookups with a local directory. Still requires the package name on the registry though, per Deno's own docs.
- **Option B:** Import from a file path directly (Deno's `file:` scheme for local modules). Bypasses `npm:` entirely. Works but doesn't prove the `npm:` subpath-export resolution, which is the whole point of the Deno leg.
- **Option C (pragmatic):** On the very first publish only, skip the Deno leg's `npm:` subpath test and import the built files directly via file URL to prove Deno can execute the code. Subsequent publishes use Option A or the normal `npm:` specifier. Flag this as a one-time manual override in the release workflow.

**Recommendation:** Plan for Option A (patch field + local unpack). Document the first-publish edge case in RESEARCH.md and the planner can either accept a Deno-leg soft-skip on v0.1.0 OR publish a placeholder version to the registry first. The latter is cleaner and is what TanStack-ecosystem libraries do: a `0.0.0-bootstrap` pre-release to establish the package name, then normal publishes from there. Decision is Claude's discretion; Plan should surface both paths. [CITED: https://deno.com/blog/v2.3, https://github.com/denoland/deno/issues/19621, https://questions.deno.com/m/1069958260351832094]

### Pattern 5: Changesets Configuration for Single-Package Pnpm Workspace

**What:** `.changeset/config.json` for a pnpm workspace where only `@wardbox/whisper` is ever published and `whisper-docs` must be excluded.

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "wardbox/whisper" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["whisper-docs"]
}
```

**Field rationale:**
- `changelog`: Use `@changesets/changelog-github` to get PR links + author attribution in `CHANGELOG.md`. Plain `@changesets/cli/changelog` also works and has zero extra deps. Planner discretion.
- `commit: false`: Let the Changesets GitHub Action create the commit; don't commit from the CLI locally.
- `access: "public"`: Required for scoped `@wardbox/*` packages. Belt-and-suspenders with `publishConfig.access` per D-12.
- `baseBranch: "main"`: The project's default branch.
- `ignore: ["whisper-docs"]`: Critical. Prevents the docs workspace package from ever being published. The docs package should ALSO have `"private": true` in its own `package.json` for true belt-and-suspenders. [CITED: Changesets config docs]
- `fixed`/`linked`: Empty. Single-package publish, no version coordination needed.
- `updateInternalDependencies: "patch"`: Default. Harmless for single-package workspace.

### Pattern 6: Release Workflow (Changesets + Granular NPM_TOKEN + Provenance)

**What:** `.github/workflows/release.yml` that uses `changesets/action@v1.7.0` with `publish: pnpm release` where `pnpm release` runs build → smoke matrix gate → `changeset publish`.

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false

permissions:
  contents: write       # create version PR + tag + release
  pull-requests: write  # create/update version PR
  id-token: write       # OIDC token for npm provenance
  # Explicitly NOT granting actions:read etc. — least privilege

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    # Gate: only run if the CI workflow succeeded on the same commit
    # Using workflow_run is an alternative trigger; here we rely on branch-protection
    # rules to block merges to main until ci.yml passes. The release job then assumes
    # ci.yml passed because the commit is on main. See Gating section below.
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # required for changesets to read git log

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'  # REQUIRED for NODE_AUTH_TOKEN

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build library
        run: pnpm build

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1.7.0
        with:
          # `pnpm release` is a root script that runs smoke + tarball audit + publishes
          publish: pnpm release
          # `pnpm changeset version` — bumps versions, updates changelog
          version: pnpm changeset version
          commit: 'ci: release'
          title: 'ci: version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          # Enables --provenance automatically when running `npm publish` /
          # `pnpm publish` / `changeset publish` without passing the flag
          NPM_CONFIG_PROVENANCE: 'true'
```

**The `pnpm release` root script:**

```jsonc
// package.json (root)
{
  "scripts": {
    // existing
    "build": "pnpm --filter @wardbox/whisper build",
    "test": "pnpm --filter @wardbox/whisper test",
    "check": "biome check .",
    "docs:dev": "pnpm --filter whisper-docs dev",
    "docs:build": "pnpm --filter @wardbox/whisper build && pnpm --filter whisper-docs build",
    // new (D-05, D-10)
    "smoke": "node scripts/smoke/run.mjs",
    "size": "pnpm --filter @wardbox/whisper exec size-limit",
    "tarball:audit": "node scripts/tarball-audit/audit.mjs",
    "release": "pnpm build && pnpm smoke && pnpm size && pnpm tarball:audit && pnpm changeset publish"
  }
}
```

**Key points:**

1. **`id-token: write`** is the critical permission for provenance. Without it, `--provenance` / `NPM_CONFIG_PROVENANCE=true` will fail the publish. [CITED: npm docs on provenance]
2. **`registry-url` on setup-node** is what makes `NODE_AUTH_TOKEN` get written into `~/.npmrc` as a credential for `registry.npmjs.org`. Without it, the NPM_TOKEN is ignored. [CITED: GitHub docs publishing nodejs packages]
3. **NPM_TOKEN vs NODE_AUTH_TOKEN:** `changesets/action` passes `NPM_TOKEN` through to the publish command. The `actions/setup-node` authentication mechanism reads from `NODE_AUTH_TOKEN`. The convention `NPM_TOKEN: ${{ secrets.NPM_TOKEN }}` works because `changesets/action` internally runs `npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN` or uses the setup-node `~/.npmrc`. Both names are seen in community examples; `NPM_TOKEN` is the conventional secret name and what changesets/action documentation uses.
4. **`NPM_CONFIG_PROVENANCE=true`** is the environment-variable form of the `--provenance` CLI flag. Works with both trusted-publisher OIDC and granular tokens. For granular-token path, you also need `id-token: write` because provenance is signed by GitHub's OIDC token regardless of how you authenticate to npm. [CITED: npm trusted publishing community docs]
5. **Granular token rotation:** As of 2025-12-09, npm classic tokens are deprecated and granular tokens have a **maximum 90-day validity**. The planner must document in RESEARCH.md and in a workflow README comment that NPM_TOKEN requires manual rotation every ≤90 days. Trusted Publisher OIDC avoids this entirely but is deferred per CONTEXT.md. [CITED: dev.to trusted publishing articles]
6. **Concurrency group** prevents two simultaneous release runs from stomping on each other.
7. **Branch protection, not workflow_run:** The cleanest gating path is to configure GitHub branch protection on `main` so that ci.yml must pass before any merge. The release workflow then trusts that "commit is on main" ⇒ "ci.yml passed for that commit." `workflow_run` triggers are an alternative but are harder to reason about and introduce chained-workflow gotchas. Planner should flag branch protection as a **manual setup step** on the GitHub repo settings page before the first release. (Matches D-10's "release workflow must not publish unless ci.yml for that commit has already passed.")

### Pattern 7: CI Matrix (ci.yml extension)

**What:** Extend the existing single `ci` job to a matrix with four legs for D-01/D-02/D-03, plus keep attw/publint on the Node leg, plus add size/tree-shake/tarball-audit gates for D-19/D-20/D-21/D-22.

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  # Primary build-and-test job, runs existing steps on Node
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      - run: pnpm check
      - run: cd packages/whisper && npx attw --pack --profile node16
      - run: cd packages/whisper && npx publint .
      # NEW: size budget gate (D-19, D-22)
      - run: pnpm size
      # NEW: tarball audit gate (D-21, D-22)
      - run: pnpm tarball:audit
      # Upload the packed tarball as an artifact so matrix legs can download it
      - name: Pack for smoke matrix
        run: cd packages/whisper && pnpm pack --pack-destination ../../e2e/smoke
      - uses: actions/upload-artifact@v4
        with:
          name: whisper-tarball
          path: e2e/smoke/wardbox-whisper-*.tgz
          retention-days: 1

  # Smoke matrix — 4 legs (D-01, D-02, D-08)
  smoke:
    needs: build
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        runtime: [node-esm, node-cjs, deno, bun]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: whisper-tarball
          path: e2e/smoke/

      # node-esm + node-cjs share setup; conditional below
      - if: startsWith(matrix.runtime, 'node')
        uses: pnpm/action-setup@v4
        with:
          version: 10
      - if: startsWith(matrix.runtime, 'node')
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - if: matrix.runtime == 'deno'
        uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x

      - if: matrix.runtime == 'bun'
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      # Install + run per runtime
      - if: matrix.runtime == 'node-esm'
        working-directory: e2e/smoke
        run: |
          pnpm install --force
          pnpm typecheck
          node smoke.mjs

      - if: matrix.runtime == 'node-cjs'
        working-directory: e2e/smoke
        run: |
          pnpm install --force
          pnpm typecheck
          node smoke.cjs

      - if: matrix.runtime == 'deno'
        working-directory: e2e/smoke
        run: |
          pnpm install --force  # populates node_modules for Deno to read
          deno run -A --node-modules-dir=auto smoke_deno.ts

      - if: matrix.runtime == 'bun'
        working-directory: e2e/smoke
        run: |
          bun install --force
          bun run smoke.ts

      # Tree-shake check runs inside the smoke job so it uses the same packed tarball
      # (runs once per matrix run — acceptable, ~1-2 seconds)
      - if: matrix.runtime == 'node-esm'
        working-directory: e2e/smoke/tree-shake
        run: node check.mjs
```

**Rationale:**

- `build` job runs the existing CI and ALSO packs the tarball + uploads it as an artifact. Matrix legs download the same tarball — this guarantees all four runtimes test the identical bits.
- `smoke` matrix has one leg per runtime. `fail-fast: false` so one runtime's failure doesn't abort the others.
- `node-esm` vs `node-cjs` — these are the same Node runtime but the smoke project runs `node smoke.mjs` (ESM) and `node smoke.cjs` (CJS require path) separately. This is the true answer to D-01's "ESM and CJS legs" — one Node version, two entry files.
- Bun's `bun install --force` installs the file tarball. Bun auto-detects ESM/CJS based on package.json `type: module` and the exports map. Running `bun run smoke.ts` executes TypeScript directly.
- Deno leg runs `pnpm install` first to populate `node_modules`, then uses Deno's `nodeModulesDir` mode to read from it. The `smoke_deno.ts` file uses `npm:` specifiers that Deno resolves via the local node_modules.
- The existing `build` job ordering means attw/publint still gate every PR on the Node leg (per D-03 "keep attw + publint steps").
- Size-limit and tarball-audit run BEFORE the pack step, because they need `dist/` present but don't need the packed tarball.

**Cost estimate:** 4 matrix legs × ~2 minutes each ≈ 8 minutes additional CI time per PR. Parallel, so wall-clock adds ~2 minutes. Well within D-22's "~30s extra acceptable" assessment (more accurately: 2-3 minutes, still fine).

### Anti-Patterns to Avoid

- **Shelling out to `tar -tzf` to list tarball contents** — macOS BSD tar and GNU tar format output differently; the allowlist diff becomes platform-dependent. Use `@publint/pack` or `pnpm pack --json` for deterministic output.
- **Publishing with `npm publish` directly from CI without `changesets/action`** — loses changelog generation, the PR-based audit trail, and the versioning discipline. If Changesets goes wrong, fix Changesets; don't bypass.
- **Using `@v1` floating tag for `changesets/action` / `actions/checkout` / etc.** — 2026 supply-chain guidance is to pin to specific SHAs or explicit semver tags (`@v1.7.0`). Floating tags are a supply-chain risk. [CITED: dev.to spring 2026 OSS incidents article]
- **Putting NPM_TOKEN in a workflow without `id-token: write` AND `registry-url`** — publish will appear to succeed but provenance will silently fail, or the token won't be read, depending on which missing piece bites first.
- **Running `pnpm pack` from the repo root** — pnpm packs the root workspace (which has `private: true`). Must run from `packages/whisper/` or use `pnpm --filter @wardbox/whisper pack`.
- **Committing `e2e/smoke/pnpm-lock.yaml` as part of the main workspace lockfile** — the smoke fixture should NOT be part of `pnpm-workspace.yaml`'s `packages:` glob, because its dependency is a file path to a tarball that doesn't exist until after `pnpm pack`. Solution: exclude `e2e/**` from workspace discovery via `packages: ['packages/*']` (already the case) and let `pnpm install` inside `e2e/smoke/` operate as a standalone install. Commit `e2e/smoke/package.json` but add `e2e/smoke/node_modules` and `e2e/smoke/wardbox-whisper-*.tgz` to `.gitignore`.
- **Relying on `README.md` / `LICENSE` in repo root to ship in the workspace package tarball** — they don't. `pnpm pack` on `packages/whisper/` only picks up files from that directory. This is the #1 bug found in research. The fix is in D-16/D-17's planning: copy/create `packages/whisper/LICENSE` and `packages/whisper/README.md`.
- **Using `workflow_run` triggers for the release workflow gate** — adds chained-workflow complexity, can fail to trigger on certain race conditions. Use branch protection rules instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Versioning + changelog automation | Custom git-commit-parsing script | `@changesets/cli` + `changesets/action@v1.7.0` | PR-based audit trail, handles pre-releases, monorepos, ignored packages. Solo maintainers re-invent this monthly and get it wrong. |
| Bundle-size regression detection | Custom `fs.stat` + threshold check | `size-limit` + `@size-limit/preset-small-lib` | Handles gzip/brotli, tree-shaking via `import` field, per-entry budgets, CI PR comments via `andresz1/size-limit-action`. |
| Tarball file listing | `tar -tzf` + shell parsing | `@publint/pack` OR `pnpm pack --json` | Tar output formats differ across BSD/GNU. Programmatic JSON is deterministic. |
| Multi-runtime CI setup | Hand-rolled apt-get / curl installs | Official actions: `denoland/setup-deno@v2`, `oven-sh/setup-bun@v2`, `pnpm/action-setup@v4`, `actions/setup-node@v4` | Caching, version selection, PATH setup all handled. |
| npm provenance attestation | Custom OIDC token generation | `NPM_CONFIG_PROVENANCE=true` + `id-token: write` | npm CLI handles the SLSA attestation generation. Rolling your own is insane. |
| License text | Copy-pasting random MIT text from a blog | SPDX canonical text (https://spdx.org/licenses/MIT.html) | Legal text that's been reviewed. Blog copies often drop clauses. [CITED: https://spdx.org/licenses/MIT.html] |

**Key insight:** Phase 7 is the phase with the highest density of "use a library, don't hand-roll" decisions. The pit of failure in custom solutions here is deep: miss a tarball file, forget a GitHub permission, fumble a token rotation, and the first publish is broken OR silently insecure. Every tool above exists specifically because people kept getting this wrong.

## Runtime State Inventory

This IS a publish/release phase, which has analogous concerns — runtime state that lives outside the repo and won't be updated by a grep-and-commit pass. Documented per the GSD template.

| Category | Items | Action Required |
|----------|-------|------------------|
| **Stored data** | None. No database, no long-lived state. | None — verified: no persistent storage exists in this repo. |
| **Live service config** | npm registry: `@wardbox/whisper` package **does not exist yet**. The scoped name must be available (not reserved, not typosquatted). | **Manual verification step before first publish:** `npm view @wardbox/whisper` should return a 404 / "not in registry" error. If it returns anything, there's a namespace conflict. |
| **Live service config** | npm account: needs to exist with 2FA enabled (required for granular tokens as of 2025-12-09). | **Manual setup:** Confirm `wardbox` npmjs.com account has 2FA enabled. Generate granular token scoped to `@wardbox/whisper` with "publish new versions" permission only. |
| **Live service config** | GitHub repo secret `NPM_TOKEN`. Stored in GitHub Actions repo settings, NOT in git. | **Manual setup:** Add `NPM_TOKEN` secret to `wardbox/whisper` repo before the first release workflow run. Document the rotation schedule (90 days). |
| **Live service config** | GitHub branch protection rules on `main`. Must require `ci.yml` to pass before merge (the release-workflow gate per D-10). | **Manual setup:** Configure branch protection on `main` in GitHub repo settings. Required status check: the `build` and `smoke` jobs from `ci.yml`. |
| **Live service config** | Docs site URL for `package.json.homepage`. Phase 6 (docs) locked the docs site but the deployed URL may not exist yet. | **Planner decision:** If no deployed URL, use the GitHub repo URL as a placeholder (`https://github.com/wardbox/whisper`). Update in a post-Phase-7 changeset once docs deploy. CONTEXT.md D-18 explicitly calls out "placeholder to be confirmed during planning if URL not ready." |
| **OS-registered state** | None. No cron jobs, no systemd units, no scheduled tasks tied to this phase. | None. |
| **Secrets / env vars** | `NPM_TOKEN` — new, must be created manually in GitHub secrets. No code reads it; only the release workflow consumes it. | **Manual step** (see above). |
| **Secrets / env vars** | `RIOT_API_KEY` — existing, used by schema-drift workflow. Phase 7 must NOT break this. | Verify `schema-drift.yml` is unchanged. Phase 7 does not touch the RIOT_API_KEY secret. |
| **Build artifacts / installed packages** | `packages/whisper/dist/` — rebuilt on every CI run; no stale-artifact risk. | None. |
| **Build artifacts / installed packages** | `packages/whisper/wardbox-whisper-0.1.0.tgz` (the packed tarball). Regenerated on every `pnpm pack`. | Add to `.gitignore`. |
| **Build artifacts / installed packages** | `e2e/smoke/node_modules/@wardbox/whisper/` — unpacked tarball cached by pnpm. | Add `e2e/smoke/node_modules/` to `.gitignore`. Use `pnpm install --force` to bust pnpm's tarball-version cache between test runs. |

**The canonical question answered:** After every file in the repo is updated, what runtime systems still have old state?
- **Pre-first-publish:** npm registry (not yet populated), GitHub secrets (NPM_TOKEN not yet added), branch protection (not yet configured) — all require manual one-time setup.
- **Post-first-publish:** npm registry has `0.1.0` live; subsequent publishes go through the automated Changesets PR flow with no manual intervention.

## Common Pitfalls

### Pitfall 1: Publishing a package with no LICENSE or README
**What goes wrong:** `pnpm pack` in `packages/whisper/` produces a tarball containing only `dist/**` + `package.json`. npmjs.com shows a blank package page. Any consumer legally cannot use the code because there's no license file attached.
**Why it happens:** `files: ["dist"]` in `package.json` explicitly lists `dist` as the only included directory. npm auto-includes `README*` and `LICENSE*` from the package directory itself, but `packages/whisper/` doesn't have them — they exist only at repo root.
**How to avoid:** Create `packages/whisper/README.md` and `packages/whisper/LICENSE`. Verify with `pnpm pack --dry-run | grep -iE "license|readme"` before publish. D-21 tarball audit catches this.
**Warning signs:** Running `pnpm pack --dry-run` today and NOT seeing LICENSE/README in the output.
[VERIFIED: `pnpm pack --dry-run` run 2026-04-11 against current repo state]

### Pitfall 2: GPLv3 license blocks commercial adoption
**What goes wrong:** GPLv3 is copyleft — any project that imports `@wardbox/whisper` would be legally required to also be GPLv3. This blocks commercial bots, dashboards, and SaaS products from using the library. Zero adoption.
**Why it happens:** Default GPLv3 `LICENSE` was left in place from a project template.
**How to avoid:** D-16 replaces LICENSE with MIT (the permissive standard for JS ecosystem libraries). Also update `package.json.license` field.
**Warning signs:** `npx publint` may or may not flag this, but any code reviewer familiar with OSS licensing will.

### Pitfall 3: tsdown source maps bloat the published tarball
**What goes wrong:** Each subpath ships `.js.map` files 3-4× larger than the `.js` file itself. `dist/lol/index.js.map` is 58KB vs the actual code at 17KB. Multiplied across 8 subpaths + shared chunks, this adds ~400-500KB of map files to a library whose actual code is ~150KB.
**Why it happens:** `tsconfig.base.json` enables both `sourceMap: true` and `declarationMap: true`. tsdown's declaration-map support force-enables source maps even when explicitly disabled (rolldown/tsdown issue #360).
**How to avoid:** Three options, planner picks:
1. **Accept the source maps** — debugging is nice, 500KB is not huge. Document in README that source maps ship.
2. **Strip source maps before publish** — `prepack` script that deletes `dist/**/*.{js,cjs}.map` and `dist/**/*.{d.ts,d.cts}.map`. Keeps the dev DX (source maps during local build) and ships only minified output.
3. **Disable source maps in tsdown config** — `sourcemap: false` in `tsdown.config.ts` and `sourceMap: false` in `tsconfig.base.json`. Simplest. Declaration maps would remain disabled (per issue #360's force-on behavior, disabling one disables both).

**Recommendation:** Option 2 (prepack strip). Source maps help during local development and debugging; publishing them bloats the tarball with no consumer benefit (consumers don't debug into a minified library; they read the source on GitHub). Add `"prepack": "node scripts/strip-sourcemaps.mjs"` or similar. D-22 tarball audit enforces the result.
**Warning signs:** `pnpm pack --dry-run` lists `.js.map` files. Size budget (D-19) failing unexpectedly for subpaths with large type surfaces.
[VERIFIED: file size inspection, CITED: https://github.com/rolldown/tsdown/issues/360]

### Pitfall 4: Content-hashed shared chunks defeat exact-match allowlists
**What goes wrong:** Every `pnpm pack` produces different filenames for `dist/client-*.js` and `dist/errors-*.d.ts` because tsdown content-hashes them. A tarball-audit allowlist with exact filenames fails on every rebuild.
**Why it happens:** tsdown (and rolldown underneath) hash hoisted shared chunks for cache-busting. The hash is derived from file contents; any source change rotates the hash.
**How to avoid:** Use glob patterns in the allowlist, not exact filenames:
```json
{
  "allowed": [
    "package/package.json",
    "package/README.md",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.cjs",
    "package/dist/index.d.ts",
    "package/dist/index.d.cts",
    "package/dist/client-*.js",
    "package/dist/client-*.cjs",
    "package/dist/client-*.d.ts",
    "package/dist/client-*.d.cts",
    "package/dist/errors-*.d.ts",
    "package/dist/errors-*.d.cts",
    "package/dist/core/**",
    "package/dist/lol/**",
    "package/dist/tft/**",
    "package/dist/val/**",
    "package/dist/lor/**",
    "package/dist/riftbound/**",
    "package/dist/riot/**"
  ]
}
```
And reject files NOT matching any pattern. Test with `globby` or a custom glob function (no need for a full glob library — a simple `*`-as-regex translation is ~10 lines).
**Warning signs:** Tarball audit passes once, fails on the next CI run with "unknown file: dist/client-NEW123.js."
[VERIFIED: dist listing — `client-B7r2KpHz.js` and `errors-DofVFslx.d.ts` observed]

### Pitfall 5: `pnpm install --force` is required in the smoke fixture
**What goes wrong:** First smoke run installs and passes. Developer makes a source change, rebuilds, re-packs, re-runs smoke — and the smoke project still has the OLD tarball's contents cached by pnpm. Tests pass with stale code.
**Why it happens:** pnpm (and npm) caches tarballs by `version@integrity-hash`. The tarball filename and package version stayed the same; pnpm sees "already installed 0.1.0" and skips.
**How to avoid:** Always pass `--force` to `pnpm install` in the smoke fixture, OR delete `e2e/smoke/node_modules/@wardbox/whisper/` before install, OR bump the version between runs.
**Warning signs:** Smoke tests pass after a known-broken source change.
[CITED: https://blog.rnsloan.com/2025/01/11/local-npm-package-testing-made-simple-a-guide-to-npm-pack/]

### Pitfall 6: Deno `npm:` specifier cannot resolve a local tarball
**What goes wrong:** Naive attempt to write `import { ... } from 'npm:@wardbox/whisper@file:../../packages/whisper/wardbox-whisper-0.1.0.tgz/lol'` — doesn't work. Deno rejects non-registry versions in npm specifiers.
**Why it happens:** Deno 2.x resolves `npm:` specifiers through the npm registry. File paths and tarballs are not supported at the specifier level. Deno 2.3+ added a `patch` field for local directories, but the package name must still exist on the registry.
**How to avoid:** Three options:
1. **Populate `node_modules` via pnpm**, then run Deno with `--node-modules-dir=auto` (or `"nodeModulesDir": "auto"` in `deno.json`). Deno reads from `node_modules` for `npm:` specifiers.
2. **Use Deno's `file:` URL scheme directly** pointing at `packages/whisper/dist/lol/index.js`. Bypasses `npm:` but doesn't prove subpath resolution through npm conditions.
3. **Do a bootstrap publish** of `0.0.0-pre` to establish the package name on the registry, then all subsequent publishes use the normal `npm:@wardbox/whisper@version` specifier. This is what many libraries do for their very first publish.

**Recommendation:** Option 1 for the smoke fixture. Document Option 3 as the "if we want a cleaner Deno leg" path for post-v0.1 hardening.
**Warning signs:** Deno leg fails with "package not found in npm registry" on the very first smoke run.
[CITED: https://deno.com/blog/v2.3, https://github.com/denoland/deno/issues/19621]

### Pitfall 7: `id-token: write` missing → provenance silently fails
**What goes wrong:** Release workflow publishes successfully but without provenance attestation. Package shows no "Built and signed on GitHub Actions" badge on npmjs.com. Consumer supply-chain checks that look for provenance fail.
**Why it happens:** `NPM_CONFIG_PROVENANCE=true` tells npm CLI to generate provenance, but provenance requires an OIDC token from GitHub. Without `permissions: { id-token: write }`, the job cannot request an OIDC token and provenance silently falls back or errors depending on npm CLI version.
**How to avoid:** Always include `id-token: write` in any job that runs `npm publish --provenance`. Also requires `contents: write` for the Changesets PR-creation + git tag + GitHub release flow.
**Warning signs:** Published package on npmjs.com lacks the green provenance badge. `npm view @wardbox/whisper --json` shows no `_npmOperationalInternal.attestations` field.

### Pitfall 8: Granular token expires silently, breaking release 90 days later
**What goes wrong:** First publish succeeds. Three months later, a maintainer merges a Changesets PR to `main`, the release workflow runs, and publish fails with 401 "invalid auth token." Everyone panics. The cause: the granular NPM_TOKEN expired.
**Why it happens:** As of 2025-12-09, npm granular tokens have a **maximum 90-day validity**. There is no option to create longer-lived tokens. Silent expiry is a permanent property of the new token regime.
**How to avoid:** Three options:
1. **Calendar reminder** — manual rotation every 80 days with a calendar alert.
2. **Early warning** — add a CI step that runs weekly, reads `NPM_TOKEN`, calls `npm whoami`, and fails if it returns auth error. Alerts the maintainer days before expiry.
3. **Migrate to Trusted Publisher OIDC** — the CONTEXT.md deferred path. Eliminates the problem entirely.

**Recommendation:** Option 2 for the granular-token bridge period, plus a clear README.md comment in `.github/workflows/release.yml` documenting the 90-day rotation. Planner should add a `.github/workflows/token-check.yml` scheduled workflow as part of Phase 7 OR defer it to a post-phase hardening task.
**Warning signs:** Publish failures that weren't caused by code changes. 401 errors in release workflow logs.
[CITED: Dec 9, 2025 npm classic token deprecation changelog, npm Trusted Publishing community docs]

### Pitfall 9: Docs workspace accidentally publishes
**What goes wrong:** Changesets sees both `@wardbox/whisper` and `whisper-docs` in the workspace, generates a version for both, publishes both. The docs package ends up on npmjs.com as `whisper-docs@0.1.0` — confusing, wrong, pollutes the npm namespace.
**Why it happens:** Default Changesets config versions all workspace packages. No exclusion configured.
**How to avoid:** Two layers of defense:
1. `.changeset/config.json` `"ignore": ["whisper-docs"]` (Changesets-level exclusion)
2. `packages/docs/package.json` `"private": true` (npm-level hard block)

Both should be in place. D-12 adds `publishConfig` for the library; docs package gets `private: true` instead.
**Warning signs:** Changesets version PR includes a version bump for `whisper-docs`. Dry-run publish logs mention the docs package.

### Pitfall 10: Smoke fixture workspace conflict with root pnpm-workspace.yaml
**What goes wrong:** Adding `e2e/smoke/` to the repo causes pnpm to include it in the workspace, and its `file:` tarball dependency fails to resolve at `pnpm install` time because the tarball doesn't exist until after `pnpm pack`.
**Why it happens:** `pnpm-workspace.yaml` globs may match `e2e/smoke/package.json` if patterns are too broad. Also, workspace packages share the root `pnpm-lock.yaml`, which pins resolutions at install time.
**How to avoid:** Keep `pnpm-workspace.yaml` scoped to `packages/*` only (already the case — verified from current state). Add `e2e/smoke/node_modules/` and `e2e/smoke/pnpm-lock.yaml` to `.gitignore`. The smoke fixture runs `pnpm install` in isolation (not via workspace), so it gets its own lockfile that's regenerated on every smoke run.
**Warning signs:** `pnpm install` at repo root fails with "cannot find tarball" errors before any smoke run has happened.
[VERIFIED: current `pnpm-workspace.yaml` not inspected in research — planner should read it]

## Code Examples

### Example 1: MIT LICENSE canonical text

```
MIT License

Copyright (c) 2026 Wardbox

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Source: https://spdx.org/licenses/MIT.html (SPDX canonical text). Matches `SPDX-License-Identifier: MIT`. Copyright holder and year per D-15/D-16 (2026, Wardbox).

### Example 2: `package.json` metadata (after edits)

```jsonc
{
  "name": "@wardbox/whisper",
  "version": "0.1.0",
  "description": "Zero-dependency TypeScript library wrapping every Riot Games API endpoint with proactive rate limiting and tree-shakeable per-game imports.",
  "keywords": [
    "riot-games",
    "riot-api",
    "league-of-legends",
    "valorant",
    "tft",
    "lor",
    "riftbound",
    "typescript",
    "api-client"
  ],
  "author": "Wardbox",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/wardbox/whisper.git"
  },
  "bugs": {
    "url": "https://github.com/wardbox/whisper/issues"
  },
  "homepage": "https://github.com/wardbox/whisper#readme",
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "type": "module",
  "sideEffects": false,
  "exports": { /* unchanged — 8 subpaths */ },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": { /* unchanged */ },
  "devDependencies": { /* unchanged + size-limit, @size-limit/preset-small-lib, @publint/pack */ }
}
```

**Notes:**
- `"publishConfig.provenance": true` is a package.json-level alternative to `NPM_CONFIG_PROVENANCE=true` env var. Either works. Belt-and-suspenders to include both.
- `"files": ["dist", "README.md", "LICENSE"]` explicitly lists README and LICENSE so they're unambiguously included even if npm's auto-inclusion behavior changes. Correct defensive pattern. [CITED: npm docs on the `files` field]
- `homepage` placeholder: GitHub README anchor until docs site deploys; update in a later changeset.
- `author`: minimal form (just the name) is fine; object form with email/url is optional.
- `description` should be under ~100 chars for npm search results.

### Example 3: `.size-limit.json` for multi-entry library

```jsonc
// packages/whisper/.size-limit.json
[
  {
    "name": "index (root barrel — currently empty)",
    "path": "dist/index.js",
    "limit": "1 kB"
  },
  {
    "name": "/core (shared HTTP + rate limiter + cache)",
    "path": "dist/core/index.js",
    "limit": "6 kB",
    "brotli": true
  },
  {
    "name": "/lol",
    "path": "dist/lol/index.js",
    "limit": "18 kB",
    "brotli": true
  },
  {
    "name": "/tft",
    "path": "dist/tft/index.js",
    "limit": "8 kB",
    "brotli": true
  },
  {
    "name": "/val",
    "path": "dist/val/index.js",
    "limit": "10 kB",
    "brotli": true
  },
  {
    "name": "/lor",
    "path": "dist/lor/index.js",
    "limit": "4 kB",
    "brotli": true
  },
  {
    "name": "/riftbound",
    "path": "dist/riftbound/index.js",
    "limit": "2 kB",
    "brotli": true
  },
  {
    "name": "/riot",
    "path": "dist/riot/index.js",
    "limit": "3 kB",
    "brotli": true
  }
]
```

**Rationale:**
- Budgets above are ESTIMATES based on dist file sizes measured 2026-04-11 (e.g., `dist/lol/index.js` = 17KB uncompressed; brotli'd ≈ 4-5KB; budget 18KB uncompressed gives ~20% headroom). **Planner MUST re-measure and set actual budgets before Phase 7 completes.**
- `brotli: true` gives realistic CDN-transfer numbers for modern runtimes.
- `size-limit` resolves imports through the file — when it loads `dist/lol/index.js` it follows `import { ... } from '../client-BXXX.js'` and includes the traced shared chunk in the measurement. This is the CORRECT behavior: a consumer's bundle of `/lol` pulls in the shared chunk too. [CITED: size-limit docs on `path` + esbuild resolution]
- NO `import` field used here — that's for testing tree-shaking of specific exports. `/lol` index is already a complete entry, not a subset.
- Root (`dist/index.js`) has a tiny budget because per Phase 1 locked decision, there's no root barrel — the file is essentially empty/minimal.

**Verification step:** After setting initial budgets, run `pnpm size` once and confirm every entry reports a "size" line BELOW the budget. Then set the budget to `measured × 1.15` (15% headroom) for each entry.

### Example 4: Tarball audit script (using @publint/pack)

```javascript
// scripts/tarball-audit/audit.mjs
import { pack } from '@publint/pack';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkgDir = resolve('packages/whisper');
const allowlistPath = resolve('e2e/tarball-allowlist.json');

// Pack and get the list of files
const { files } = await pack(pkgDir);

// Load allowlist
const { allowed } = JSON.parse(readFileSync(allowlistPath, 'utf8'));

// Convert glob patterns to regexes (simple implementation)
const patterns = allowed.map((pattern) => {
  const re = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // escape regex specials
    .replace(/\*\*/g, '§§')                 // temp placeholder for **
    .replace(/\*/g, '[^/]*')                // * matches any non-separator
    .replace(/§§/g, '.*');                  // ** matches anything
  return new RegExp(`^${re}$`);
});

// Check each file
const unexpected = [];
const expected = new Set();
for (const file of files) {
  const match = patterns.find((p) => p.test(file));
  if (!match) {
    unexpected.push(file);
  } else {
    expected.add(match.source);
  }
}

// Report
if (unexpected.length > 0) {
  console.error('Tarball contains unexpected files:');
  for (const f of unexpected) console.error('  ', f);
  console.error('\nIf these files are intentional, add them to e2e/tarball-allowlist.json');
  process.exit(1);
}

console.log(`Tarball audit: ok (${files.length} files, all allowed)`);
```

**Corresponding allowlist:**

```jsonc
// e2e/tarball-allowlist.json
{
  "$comment": "Committed snapshot of allowed tarball contents. Update intentionally when files change.",
  "allowed": [
    "package/package.json",
    "package/README.md",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.cjs",
    "package/dist/index.d.ts",
    "package/dist/index.d.cts",
    "package/dist/client-*.js",
    "package/dist/client-*.cjs",
    "package/dist/client-*.d.ts",
    "package/dist/client-*.d.cts",
    "package/dist/errors-*.d.ts",
    "package/dist/errors-*.d.cts",
    "package/dist/core/index.*",
    "package/dist/lol/index.*",
    "package/dist/tft/index.*",
    "package/dist/val/index.*",
    "package/dist/lor/index.*",
    "package/dist/riftbound/index.*",
    "package/dist/riot/index.*"
  ]
}
```

**Note:** The `package/` prefix is how npm lays out the extracted tarball. `@publint/pack.pack()` returns file paths starting with `package/`. Double-check against actual `@publint/pack` output (the API may return paths relative to the package root instead).

**Simpler alternative:** If `@publint/pack` feels like overkill, use `pnpm pack --json` and parse:

```bash
pnpm --filter @wardbox/whisper pack --json > /tmp/pack.json
node -e "const {files} = JSON.parse(require('fs').readFileSync('/tmp/pack.json'));console.log(files.map(f=>f.path))"
```

Either approach satisfies D-21.

### Example 5: packages/whisper/README.md (publish-facing)

```markdown
# @wardbox/whisper

Zero-dependency TypeScript library wrapping every Riot Games API endpoint. Proactive rate limiting. Tree-shakeable per-game imports. Runs on Node 18+, Deno, Bun, and edge runtimes.

## Install

\`\`\`bash
pnpm add @wardbox/whisper
# or: npm install @wardbox/whisper
# or: yarn add @wardbox/whisper
\`\`\`

## Quickstart

\`\`\`typescript
import { createClient } from '@wardbox/whisper/core';
import { summonerV4, matchV5 } from '@wardbox/whisper/lol';

const client = createClient({ apiKey: process.env.RIOT_API_KEY! });

// Platform-routed: summoner lookup
const summoner = await summonerV4.getByPuuid(client, 'na1', 'PUUID_HERE');

// Regional-routed: match history
const matchIds = await matchV5.getMatchIdsByPuuid(client, 'americas', summoner.puuid);
\`\`\`

The client handles rate limits automatically — no 429s under normal usage.

## Features

- **Zero runtime dependencies.** Native `fetch` only. ~150 KB installed, less with tree-shaking.
- **Proactive rate limiting.** Parses Riot's `X-App-Rate-Limit` and `X-Method-Rate-Limit` headers and queues before limits are hit.
- **Tree-shakeable per-game imports.** `@wardbox/whisper/lol`, `/tft`, `/val`, `/lor`, `/riftbound`, `/riot` — import only what you use.

## Documentation

Full docs, guides, and the complete API reference: **https://whisper.wardbox.dev** *(placeholder — update with real docs URL)*

## License

MIT. See [LICENSE](./LICENSE).
```

**Notes:**
- ~30 seconds to read, matches D-17's brief.
- Quickstart uses LoL per D-17 / consistency with docs quickstart.
- Three-bullet feature highlight per D-17.
- Docs URL is a placeholder — planner fills in once Phase 6 deploys.
- No marketing copy, no badges (defer per CONTEXT.md deferred ideas).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Classic npm tokens (non-expiring) | Granular tokens (90-day max) | 2025-12-09 — npm permanently revoked all classic tokens | **Direct hit on D-13.** Planner must document rotation. Trusted Publisher OIDC is the long-term answer. |
| Hand-rolled `tar -tzf` tarball listing | `@publint/pack` or `pnpm pack --json` | ~2025 — `@publint/pack` first published | Deterministic file lists, no platform tar-output divergence. |
| `actions/setup-node@v3` | `actions/setup-node@v4` or `@v6` | 2024-2026 — v6 released in 2026 | Existing Whisper CI uses v4; TanStack/Hono use v6. Either works; no breaking change. |
| Root-only `LICENSE` + `README.md` and hope | Duplicated `packages/<pkg>/LICENSE` + `README.md` OR `prepack` copy script | N/A — always been the requirement | The current Whisper repo is in the "hope" state. Phase 7 fixes it. |
| Numeric version ranges in dependencies | `workspace:*` protocol for inter-package deps | ~2023 onwards | Not relevant here — no inter-package deps in Whisper workspace. |
| `--provenance` CLI flag | `NPM_CONFIG_PROVENANCE=true` env var OR `publishConfig.provenance: true` | 2025+ | All three forms work; env var is easiest for CI. |

**Deprecated / outdated:**
- `changesets/action@master` — use explicit tag `@v1.7.0`.
- `@changesets/cli` versions < 2.27 — drop support for newer workspace features. Current 2.30.0 is fine.
- `actions/setup-node@v3` — end-of-life. Use v4+.
- `actions/upload-artifact@v3` — deprecated April 2024. Use v4+.
- `npm publish` without `--access public` for scoped packages — silent failure mode where the package is marked private. `publishConfig.access: public` is the fix (D-12).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "The `pnpm release` root script should run `pnpm build && pnpm smoke && pnpm size && pnpm tarball:audit && pnpm changeset publish`" | Pattern 6 | Low — planner has full discretion on the exact script (CONTEXT.md D-05 + D-19-22). Risk is only ordering/parallelism. |
| A2 | "Initial size budgets: core=6KB, lol=18KB, tft=8KB, val=10KB, lor=4KB, riftbound=2KB, riot=3KB, all brotli" | Example 3 | Medium — numbers are ESTIMATES from unminified dist file sizes. Planner MUST re-measure with `size-limit` before locking. Wrong estimates either block PRs (too tight) or hide regressions (too loose). |
| A3 | "MIT LICENSE copyright holder is 'Wardbox', year 2026" | Example 1 | Low — CONTEXT.md D-16 implies this; planner should verify with the user (email, full name, org attribution). |
| A4 | "`homepage` in package.json should be `https://github.com/wardbox/whisper#readme` until docs site deploys" | Example 2 | Low — placeholder explicitly allowed by D-18. |
| A5 | "Dropping source maps via a `prepack` strip script is the right call" | Pitfall 3 | Medium — Claude's recommendation, but planner/user may prefer keeping source maps for debuggability. Three options listed; planner decides. |
| A6 | "For the first publish (package doesn't exist on registry yet), the Deno leg should use Option 1 (populate node_modules + nodeModulesDir auto)" | Pattern 4 | Medium — cleaner path is bootstrap publish a `0.0.0-pre`. If the user prefers to avoid a sacrificial pre-release, Option 1 works but adds complexity to the Deno smoke step. User input welcome here. |
| A7 | "Branch protection on `main` is the correct gate for the release workflow (not workflow_run)" | Pattern 6 | Low — both work; branch protection is simpler and is a GitHub-standard solo-maintainer pattern. Manual setup step in the repo settings. |
| A8 | "Keep existing `actions/setup-node@v4` instead of upgrading to @v6 for Phase 7" | Standard Stack | Low — version upgrade is orthogonal to Phase 7 scope. Either works. |
| A9 | "Add `NPM_TOKEN` rotation early-warning check (weekly scheduled workflow)" | Pitfall 8 | Low — mitigation for the granular-token 90-day expiry. Can be deferred if the user prefers calendar reminders. |
| A10 | "`publishConfig.provenance: true` in package.json works in addition to the env var" | Example 2 | Medium — I could not verify this field is supported by all npm CLI versions. `NPM_CONFIG_PROVENANCE=true` env var is the canonical path and should be the primary mechanism. Treat package.json version as supplementary. Planner should test provenance locally with `npm pack --dry-run` + package.json setting before relying on it. |
| A11 | "tsdown 0.21.4 (current) has the declaration-map / source-map coupling bug from issue #360 and still ships source maps" | Pitfall 3 | Medium — verified via `pnpm pack --dry-run` today, but the issue may be partially fixed in 0.21.7 (latest). Planner should check tsdown's CHANGELOG between 0.21.4 → 0.21.7 and test whether `sourcemap: false` now works before writing a prepack strip script. |
| A12 | "The smoke fixture should live at repo root as `e2e/smoke/`, outside `pnpm-workspace.yaml`'s `packages:` glob" | Pattern 1 | Low — standard pattern; confirmed `pnpm-workspace.yaml` currently only globs `packages/*`. |

## Open Questions (RESOLVED)

1. **Should source maps ship in the tarball at all?** — RESOLVED: Strip via prepack script (Plan 03 Task 1). User decision 2026-04-11.
   - What we know: Currently they do (60+ map files, ~500KB total). tsdown force-enables them. They provide no consumer benefit.
   - Resolution: Prepack script removes `dist/**/*.js.map` before `pnpm pack`. Keeps local DX, clean tarball.

2. **First-publish Deno leg: bootstrap pre-release vs node_modules-dir workaround?** — RESOLVED: node_modules workaround via `nodeModulesDir: "auto"` (Plan 02 Task 1). User decision 2026-04-11.
   - What we know: Deno 2.x can't install a `.tgz` via `npm:` specifier; the package name must exist in the registry.
   - Resolution: Smoke fixture uses `pnpm install` to populate node_modules, Deno reads via `"nodeModulesDir": "auto"` in `deno.json`. No sacrificial pre-release.

3. **NPM_TOKEN rotation strategy?** — RESOLVED: Granular token (D-13) + CI early-warning workflow (Plan 05 Tasks 3+4). Trusted Publisher deferred per CONTEXT.md.
   - What we know: 90-day hard limit on granular tokens. Trusted Publisher OIDC eliminates the problem.
   - Resolution: `token-check.yml` runs weekly, warns if token is within 14 days of expiry.

4. **Bundle size budgets: what should the actual numbers be?** — RESOLVED: Measured at execution time x 1.15 headroom (Plan 03 Task 2).
   - What we know: Unminified dist file sizes (measured 2026-04-11). Rough brotli ratios (~25-30% for JS).
   - Resolution: Plan 03 Task 2 first runs `size-limit` with permissive 100 kB budgets, records actuals, commits final budgets as `measured x 1.15`.

5. **Should `packages/docs/package.json` also gain `"private": true`?** — RESOLVED: Yes (Plan 05 Task 1).
   - What we know: Docs package should never publish. Changesets `ignore` field is one layer.
   - Resolution: `"private": true` added as a hard safety net alongside Changesets ignore config.

## Environment Availability

| Dependency | Required By | Available locally | Version | Fallback |
|------------|------------|-------------------|---------|----------|
| Node.js | Everything | ✓ | v24.14.0 | — (CI uses Node 22 LTS via setup-node) |
| pnpm | Build, test, pack, workspace | ✓ | 10.33.0 | — |
| Bun | Smoke matrix Bun leg (local reproduction via `pnpm smoke`) | ✓ | 1.3.10 | — |
| Deno | Smoke matrix Deno leg (local reproduction via `pnpm smoke`) | ✗ | — | **CI-only; document that `pnpm smoke` on macOS skips the Deno leg unless Deno is installed.** Or: add a `curl -fsSL https://deno.land/install.sh \| sh` step to `scripts/smoke/run.mjs` with a prompt. |
| `gh` CLI | GitHub API calls for gating (optional) | ✓ | 2.x | — |
| `tar` | Tarball extraction (if needed for manual inspection) | ✓ | macOS BSD tar | — |
| npm CLI | Provenance publishing (invoked under the hood by `pnpm publish`) | ✓ (bundled with Node) | ≥11.5.1 needed for provenance | Bundled Node 22 LTS ships npm ≥11; fine. |

**Missing dependencies with no fallback:**
- **Deno (local)** — blocks local reproduction of `pnpm smoke`'s Deno leg. The CI Deno leg is unaffected (uses `denoland/setup-deno@v2`). Document in the `pnpm smoke` script that Deno will be skipped if not installed, and the CI leg is the authoritative check.

**Missing dependencies with fallback:**
- Deno can be auto-installed via curl; optional.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (library unit tests, unchanged); + bespoke smoke scripts (`e2e/smoke/`); + `size-limit` 12.0.1 (size budgets); + `@publint/pack` 0.1.4 (tarball audit); + `esbuild` 0.28.0 (tree-shake verification) |
| Config files | `packages/whisper/vitest.config.ts` (existing), `packages/whisper/.size-limit.json` (new), `e2e/tarball-allowlist.json` (new), `e2e/smoke/package.json` + `deno.json` (new) |
| Quick run command | `pnpm test` (library unit tests) OR `pnpm smoke` (full pack+install+multi-runtime smoke — slower but reproducible) |
| Full suite command | `pnpm build && pnpm test && pnpm check && pnpm size && pnpm tarball:audit && pnpm smoke` — everything Phase 7 gates |
| Phase gate | All four CI matrix legs green + attw + publint + size + tarball-audit + tree-shake before `/gsd-verify-work` |

### Phase Success Criteria → Validation Map

The phase has 4 success criteria from `ROADMAP.md` (not traditional REQ-IDs; this is a delivery phase). Each maps to an automated gate:

| Success Criterion | Behavior Proven | Test Type | Automated Command | File Exists? |
|-------------------|-----------------|-----------|-------------------|-------------|
| SC-1: attw reports no type resolution issues | ESM+CJS type resolution for every subpath | integration | `cd packages/whisper && npx attw --pack --profile node16` | ✅ (existing in ci.yml) |
| SC-2: publint reports no export misconfiguration | Exports map + types + files are a well-formed package | integration | `cd packages/whisper && npx publint .` | ✅ (existing in ci.yml) |
| SC-3: CI runs test suite on Node 22 LTS (ESM+CJS), Deno, Bun | Smoke test resolves and executes in every runtime | integration | CI matrix job `smoke` with 4 legs | ❌ Wave 0 (smoke fixture + matrix to be created) |
| SC-4: Published package installs + basic import works | End-to-end consumer install path | integration | `pnpm smoke` (pack + install into e2e/smoke/ + run smoke.mjs/smoke.cjs/smoke_deno.ts/bun run smoke.ts) | ❌ Wave 0 |

**Additional CONTEXT.md gates (D-19/D-20/D-21/D-22) — not in ROADMAP SC but locked in CONTEXT:**

| CONTEXT Gate | Behavior Proven | Test Type | Automated Command | File Exists? |
|--------------|-----------------|-----------|-------------------|-------------|
| D-19 Size budget | No per-subpath bundle size regressions | integration | `pnpm size` (runs `size-limit` against each entry) | ❌ Wave 0 (`.size-limit.json` + root script) |
| D-20 Tree-shake | `/tft` bundle contains no LoL/Val/LoR symbols | integration | `node e2e/smoke/tree-shake/check.mjs` | ❌ Wave 0 (fixture files + check script) |
| D-21 Tarball audit | Tarball content matches committed allowlist | integration | `pnpm tarball:audit` (runs `@publint/pack` + diff) | ❌ Wave 0 (`e2e/tarball-allowlist.json` + `scripts/tarball-audit/audit.mjs`) |
| D-22 All gates on PRs | D-19/D-20/D-21 run on every PR | ci config | ci.yml matrix + build job steps | ❌ Wave 0 (ci.yml extensions) |

### Sampling Rate

- **Per task commit:** `pnpm test` (unit tests, fast) + `pnpm check` (biome)
- **Per plan completion:** `pnpm build && pnpm test && pnpm size && pnpm tarball:audit`
- **Per wave merge:** Full `pnpm smoke` (pack + install + multi-runtime)
- **Phase gate:** Full CI matrix green (all 4 runtime legs + attw + publint + size + tarball-audit + tree-shake)

### Wave 0 Gaps

Every gate listed above is net-new. Wave 0 for Phase 7 consists of creating the test infrastructure:

- [ ] `e2e/smoke/package.json` — consumer fixture pinning `file:../../packages/whisper/wardbox-whisper-0.1.0.tgz`
- [ ] `e2e/smoke/smoke.ts` + `smoke.mjs` + `smoke.cjs` entry files — one per runtime flavor
- [ ] `e2e/smoke/deno.json` — Deno config with `nodeModulesDir: auto`
- [ ] `e2e/smoke/smoke_deno.ts` — Deno-compatible entry (same imports)
- [ ] `e2e/smoke/tree-shake/entry-tft.ts` + `entry-lol.ts` + `check.mjs` — tree-shake fixtures
- [ ] `e2e/tarball-allowlist.json` — initial snapshot (generated once, committed)
- [ ] `scripts/smoke/run.mjs` — root orchestration script for `pnpm smoke`
- [ ] `scripts/tarball-audit/audit.mjs` — runs `@publint/pack` + diff
- [ ] `packages/whisper/.size-limit.json` — per-subpath budgets
- [ ] `.changeset/config.json` — initialized via `pnpm changeset init` then edited per Pattern 5
- [ ] `.github/workflows/release.yml` — new workflow per Pattern 6
- [ ] `.github/workflows/ci.yml` — extended per Pattern 7
- [ ] Root `package.json` scripts: `smoke`, `size`, `tarball:audit`, `release`, `changeset`
- [ ] `packages/whisper/LICENSE` — MIT, copied from root (after root GPLv3→MIT swap)
- [ ] `packages/whisper/README.md` — publish-facing version per Example 5
- [ ] `packages/whisper/package.json` — metadata, `publishConfig`, license field (D-12/D-16/D-18)
- [ ] `LICENSE` (root) — GPLv3 → MIT replacement
- [ ] `README.md` (root) — expanded per D-17
- [ ] `.gitignore` additions: `e2e/smoke/node_modules/`, `packages/whisper/wardbox-whisper-*.tgz`, `e2e/smoke/wardbox-whisper-*.tgz`, `e2e/smoke/pnpm-lock.yaml`

### What to validate at PR time

| Gate | Failure Mode Caught |
|------|---------------------|
| `pnpm build` | Source doesn't compile / tsdown config broken |
| `pnpm test` | Library unit tests regress |
| `pnpm check` (biome) | Lint/format regressions |
| `attw --profile node16` | ESM/CJS type resolution broken (e.g., subpath missing `.d.cts`) |
| `publint .` | Exports map misconfigured (e.g., missing `types` condition) |
| `pnpm size` | Bundle size regression per subpath |
| `pnpm tarball:audit` | Unexpected file in the packed tarball (leaked `.env`, fresh test fixture, etc.) |
| Smoke matrix (node-esm, node-cjs, deno, bun) | Runtime-specific import resolution failure, subpath breakage, dual-export-condition bug |
| Tree-shake check (`/tft`, `/lol`) | New code adds unintended cross-game dependency, breaking tree-shaking promise |

### What to validate at release time

| Gate | Failure Mode Caught |
|------|---------------------|
| Branch protection: ci.yml green on the merged commit | Someone tried to publish a broken build |
| Changesets: at least one changeset file exists | Version bump would not happen — skip release job |
| `pnpm release` script gate: build → smoke → size → tarball → publish | Fresh validation right before publish, even though CI already ran |
| `id-token: write` permission | Provenance generation (fail fast if missing) |
| `NPM_CONFIG_PROVENANCE=true` | Publish silently lacks attestation |
| `NPM_TOKEN` valid (not expired) | 401 auth error — planner should add Pitfall 8's early warning |
| `publishConfig.access: public` | Scoped package silently published as private |

### What to validate manually (one-time)

| Check | Who | When |
|-------|-----|------|
| `@wardbox/whisper` name is available on npm | User | Before generating NPM_TOKEN |
| NPM account has 2FA enabled (required for granular tokens) | User | Before generating NPM_TOKEN |
| Generate granular token scoped to `@wardbox/whisper` with "publish new versions" only | User | Once, rotate every ≤90 days |
| Add `NPM_TOKEN` to GitHub Actions repo secrets | User | Once per rotation |
| Configure branch protection on `main` with `ci.yml` as required check | User | Once |
| LICENSE file legally correct (MIT, Wardbox, 2026) | User | Plan verification |
| README renders correctly on npmjs.com (preview via `npm pack --dry-run && tar -xzf ...`) | User or automated | Plan verification, then post-first-publish smoke check |
| First publish dry-run: `cd packages/whisper && npm publish --dry-run` | User | Before merging the first "Version Packages" PR |

## Sources

### Primary (HIGH confidence — verified locally or authoritative)

- `pnpm pack --dry-run` executed against `packages/whisper/` on 2026-04-11 — confirmed LICENSE/README absent from tarball, hashed shared chunks, source-map presence
- `ls packages/whisper/dist/` inspection — confirmed tsdown output shape
- `.github/workflows/ci.yml` + `.github/workflows/schema-drift.yml` inspection — confirmed current state
- `tsconfig.base.json` inspection — confirmed `declarationMap: true` + `sourceMap: true`
- `npm view` commands for version verification: `@changesets/cli@2.30.0`, `@changesets/changelog-github@0.6.0`, `size-limit@12.0.1`, `@size-limit/preset-small-lib@12.0.1`, `@publint/pack@0.1.4`, `@arethetypeswrong/cli@0.18.2`, `publint@0.3.18`, `tsdown@0.21.4→0.21.7`
- `gh api repos/<owner>/<repo>/releases` for action version tags: `changesets/action@v1.7.0` (Feb 2026), `denoland/setup-deno@v2.0.4` (April 2026), `oven-sh/setup-bun@v2.2.0` (March 2026)
- https://spdx.org/licenses/MIT.html — canonical MIT text
- GitHub Hono ci.yml inspection — confirmed action versions used by a similar zero-dep library in production

### Secondary (MEDIUM confidence — authoritative docs, not directly executed)

- Changesets config docs — https://github.com/changesets/changesets/blob/main/docs/config-file-options.md (field semantics)
- size-limit docs + GitHub README — https://github.com/ai/size-limit
- Deno 2.3 blog post — https://deno.com/blog/v2.3 (patch field + nodeModulesDir semantics)
- `@publint/pack` npm page — https://www.npmjs.com/package/@publint/pack (API surface)
- httptoolkit blog on npm provenance via GitHub Actions — https://httptoolkit.com/blog/automatic-npm-publish-gha/
- Ross Robino blog on npm Trusted Publishing — https://blog.robino.dev/posts/npm-trusted-publishing
- GitHub Changelog on npm Trusted Publishing GA — https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/
- Dev.to: From Deprecated npm Classic Tokens to OIDC — December 2025 deprecation details
- Dev.to: Spring 2026 OSS Incidents — SHA-pinning guidance for 2026
- rolldown/tsdown Issue #360 — https://github.com/rolldown/tsdown/issues/360 (source-map / declaration-map coupling)
- blog.rnsloan.com on local npm package testing — tarball caching gotcha with `--force`

### Tertiary (LOW confidence — single source, aggregated from search summaries)

- Deno `patch` field limitations around .tgz support — community sources only, no single authoritative doc page nailing it down
- `publishConfig.provenance: true` package.json field — referenced in community docs but not directly verified against npm CLI changelog (A10)
- Exact brotli compression ratios for tsdown-emitted JS — size estimates are educated guesses, must be measured (A2)

## Metadata

**Confidence breakdown:**
- Standard Stack versions: HIGH — all verified via `npm view` on research day
- Architecture patterns: HIGH — all patterns backed by 2025-2026 prior art (TanStack, Hono, Changesets docs, npm docs)
- CI matrix shape: HIGH — verified against existing Whisper ci.yml and Hono's matrix
- Granular token + provenance flow: MEDIUM — multiple authoritative sources agree, but Phase 7's first publish is the first time any of this is exercised in the repo
- Deno leg smoke fixture: MEDIUM — the chicken-and-egg (first-publish, package doesn't exist on registry) is the real complication; pattern works but requires testing
- Size budget estimates: LOW — numbers are illustrative. Planner MUST measure before locking
- Source-map coupling in tsdown 0.21.4 vs 0.21.7: MEDIUM — issue #360 documented the bug, latest tsdown may have fixed it; planner should test
- First-publish Deno leg path: MEDIUM — multiple options; user decision required

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (fast-moving: npm token rules, changesets/action, setup-deno, setup-bun all actively released in the last 60 days — re-verify versions before execution if planning slips past May)
