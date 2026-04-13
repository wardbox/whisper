# Phase 7: Hardening and Publish - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Take the built, typed, tested `@wardbox/whisper` library and ship it to npm — verified to install and import correctly in a fresh project across Node 22 LTS (ESM + CJS), Deno, and Bun, with zero package-export misconfigurations. Delivery phase: no new features, no new endpoints. Everything in this phase exists to make the v0.1.0 publish trustworthy and to give every subsequent release the same guarantees automatically.

Out of scope for Phase 7: marketing, social announcements, post-publish npmjs.com aesthetics beyond README + metadata, v1.0.0 stability commitments.

</domain>

<decisions>
## Implementation Decisions

### CI runtime matrix

- **D-01:** Add a single job matrix in `.github/workflows/ci.yml` with four legs: `node-esm`, `node-cjs`, `deno`, `bun`. Each leg runs `pnpm build` then the runtime-specific smoke test. One workflow, one status badge, clear per-leg failure diagnostics.
- **D-02:** All four legs run on `ubuntu-latest` only. Whisper is pure `fetch` + JSON — no platform-specific code paths, so macOS/Windows jobs would burn CI minutes without adding signal.
- **D-03:** Keep the existing attw + publint steps (already running on the Node leg) — do not move them to a separate workflow. Phase 7 extends `ci.yml`, it does not restructure it.

### Install smoke test fixture

- **D-04:** Create a committed `e2e/smoke/` directory at the repo root containing a minimal consumer project (its own `package.json`, one or more smoke scripts). CI runs `pnpm pack` in `packages/whisper`, then installs the resulting tarball into `e2e/smoke/` as a file dependency. This mirrors what a real `npm install @wardbox/whisper` does, so `files:` whitelist bugs and tarball-specific issues surface here before publish.
- **D-05:** `e2e/smoke/` must be reproducible locally — a `pnpm smoke` script at repo root should run the same sequence CI runs (pack + install + execute smoke). No CI-only magic.
- **D-06:** Smoke coverage exercises **every** subpath: `@wardbox/whisper`, `/core`, `/lol`, `/tft`, `/val`, `/lor`, `/riftbound`, `/riot`. For each, the smoke project imports at least one public symbol (namespace object or type), passes `tsc --noEmit`, and runs `createClient({ apiKey: 'test' })` or equivalent — enough to prove the import resolves and the package initializes without hitting the network.
- **D-07:** **No live Riot API calls in the smoke test.** No `RIOT_API_KEY` secret in the smoke job. Live API calls are already covered by `pnpm generate-schema` and the weekly schema-drift workflow; the smoke test's job is import resolution + package correctness, not endpoint correctness.
- **D-08:** The Deno leg uses Deno's npm compatibility (`import { ... } from 'npm:@wardbox/whisper@<packed-version>/lol'`); the Bun leg uses `bun install` against the packed tarball. Both verify the dual ESM/CJS exports and subpath resolution.

### Release / publish workflow

- **D-09:** Adopt **Changesets** (`@changesets/cli`) as the release mechanism. Contributors add a changeset file per change describing the bump and summary; a "Release" GitHub Action opens a "Version Packages" PR; merging that PR runs `pnpm publish` from within the workflow. Proven pattern used by pnpm, TanStack, shadcn, etc.
- **D-10:** Create `.github/workflows/release.yml` that runs on pushes to `main`. It invokes `changesets/action@v1` with `publish: pnpm release` (where `release` is a root script that builds, runs the smoke matrix gate, and publishes). Gates: release workflow must not publish unless `ci.yml` for that commit has already passed.
- **D-11:** Publish with `npm publish --provenance --access public`. `--provenance` attaches the GitHub Action's OIDC build attestation, linking the tarball on npmjs.com to a verifiable commit + workflow run. Requires the release job to run in GitHub Actions (incompatible with manual local publish — intentional trade-off).
- **D-12:** Add `"publishConfig": { "access": "public" }` to `packages/whisper/package.json`. Scoped packages default to private on npm; this makes every publish public without relying on the CLI flag alone. Belt-and-suspenders: the workflow still passes `--access public` explicitly.
- **D-13:** Authenticate the publish workflow with an npm **granular access token** scoped to `@wardbox/whisper` with "publish new versions" permission only. Store as `NPM_TOKEN` in GitHub Actions repository secrets. Avoid classic automation tokens (account-wide blast radius on leak).
- **D-14:** No manual-publish escape hatch for normal releases — all releases go through the Changesets PR + workflow. If an emergency direct publish is ever needed, it's a documented manual override, not the default path.

### Version, metadata, LICENSE, README

- **D-15:** First publish ships as **`0.1.0`** (unchanged from current package.json). Signals "usable, API mostly stable, breaking changes still possible." Keeps room to iterate the API surface with real consumers before committing to semver at 1.0.0. The 0.x → 1.0.0 bump is a trivial Changesets operation later.
- **D-16:** **Replace the current GPLv3 `LICENSE` file with MIT.** GPLv3 is copyleft and would force every project importing `@wardbox/whisper` to also be GPLv3, which blocks commercial Riot API consumers (bots, dashboards, websites) — a hard adoption blocker for a data-access library. The current GPLv3 is almost certainly leftover default license text, not an intentional choice. Update `package.json` `"license"` field to `"MIT"` to match.
- **D-17:** Expand the root `README.md` from its current single-heading state to: project description, install snippet (`pnpm add @wardbox/whisper`), 30-second quickstart (one `createClient()` call + one summoner or match lookup using LoL — same example as the docs quickstart for consistency), three-bullet feature highlight (zero runtime deps, proactive rate limiting, tree-shakeable per-game imports), link to the Fumadocs docs site for everything else. README is the package page on npmjs.com — it must render well there without duplicating the docs site.
- **D-18:** Populate full publish-relevant `package.json` metadata in `packages/whisper/package.json`:
  - `description` — one-sentence summary
  - `keywords` — `["riot-games", "riot-api", "league-of-legends", "valorant", "tft", "lor", "riftbound", "typescript", "api-client"]`
  - `author` — Wardbox (name + email + optional url)
  - `repository` — `{ "type": "git", "url": "git+https://github.com/wardbox/whisper.git" }`
  - `bugs` — `{ "url": "https://github.com/wardbox/whisper/issues" }`
  - `homepage` — docs site URL once deployed (placeholder to be confirmed during planning if URL not ready)
  - `license` — `"MIT"` (matches D-16)

### Pre-publish validation gates

- **D-19:** Add per-subpath **bundle size budgets** enforced in CI. Use `size-limit` (or equivalent) configured against each built entry point in `packages/whisper/dist/`. Budgets should be generous for v0.1 but present so regressions fail the PR instead of shipping silently. Ballpark starting budgets (tune during planning after measuring): `/core ≤ 5 kB min+gzip`, each game subpath `≤ 15 kB min+gzip`. Every subpath gets a budget, not just one.
- **D-20:** Add a **tree-shake verification test** inside `e2e/smoke/`. Create a bundler fixture (using rolldown/esbuild, or tsdown which is already installed) that imports only `@wardbox/whisper/tft`, runs the bundler, and greps the output to assert zero LoL, Valorant, LoR, and Riftbound code is present. This is the runtime proof for the Phase 5 success criterion #5 ("importing only `/tft` produces no LoL or Valorant code in the output") and it protects against future side-effect regressions that would silently break tree-shaking. Run the same assertion for at least one other subpath (`/lol` is a good second).
- **D-21:** Add a **tarball content audit** step: `pnpm pack`, enumerate the file paths in the resulting tarball, diff against a committed `e2e/tarball-allowlist.txt` (or equivalent snapshot). Catches accidental leaks (`src/`, `.env`, test fixtures, `node_modules/`) and regressions in the `files:` whitelist. Snapshot test: failure prints the diff and suggests updating the allowlist intentionally.
- **D-22:** **All three extra gates (size budget, tree-shake test, tarball audit) run on every PR** in the main `ci.yml` workflow, not only in the release workflow. Regressions must be caught at PR time, not days later when a release is prepared. Extra CI cost is ~30s per run — acceptable.

### Claude's Discretion

- Exact bundle-size budget numbers per subpath (measure first, then set budgets with a small headroom — D-19 specifies "generous but present")
- Changesets configuration details (`.changeset/config.json` — base branch, changelog format, access mode)
- Release workflow YAML structure (job dependencies, concurrency groups, environment gating)
- Exact README copy (D-17 specifies structure; wording is Claude's)
- `e2e/smoke/` project structure (monolithic smoke script vs per-runtime folders) as long as it satisfies D-04 through D-08
- Tarball-allowlist format (plain text list vs JSON snapshot) as long as it satisfies D-21
- `pnpm release` root script contents — whatever makes Changesets + provenance + matrix gate work cleanly
- `author` field specifics (optional URL, github handle style) — use whatever Wardbox uses in other published work if available, otherwise minimal name + email

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value prop, zero-dep constraint, "use the latest and greatest 2025+ tooling" directive, runtime support list (Node 18+, Deno, Bun, edge)
- `.planning/REQUIREMENTS.md` — FOUND-04 (attw + publint), FOUND-06 (zero runtime deps), ENDP-07 (tree-shakeable subpath imports) — Phase 7 enforces all three on the published artifact
- `.planning/ROADMAP.md` — Phase 7 success criteria (4 criteria that must be TRUE)
- `CLAUDE.md` — Stack, build/dev commands, runtime-agnostic requirement, design philosophy ("save users from shooting themselves in the foot")

### Current packaging state
- `packages/whisper/package.json` — Current exports map (8 subpaths), `files: ["dist"]` whitelist, devDependencies including `@arethetypeswrong/cli`, `publint`, `tsdown`, `vitest` — the baseline Phase 7 extends
- `packages/whisper/tsdown.config.ts` — Entry points, `format: ['esm', 'cjs']`, `platform: 'neutral'`, `dts: true`, `clean: true` — the source of truth for what gets published
- `package.json` (root) — Root scripts (`build`, `test`, `check`, `docs:dev`, `docs:build`), `engines.node: ">=20.0.0"`, pnpm workspace — the place where `pnpm release`, `pnpm smoke`, and changesets CLI entrypoints will live
- `.github/workflows/ci.yml` — Current single Ubuntu/Node 22 job running build + test + check + attw + publint. Phase 7 extends this into the matrix in D-01 while preserving existing steps
- `.github/workflows/schema-drift.yml` — Existing weekly live-API workflow. Phase 7 does not touch it but must not break it (it uses `RIOT_API_KEY` secret which must remain configured)
- `LICENSE` — Currently GPLv3, to be replaced with MIT per D-16
- `README.md` — Currently a single heading, to be expanded per D-17

### Prior-phase context (consistency constraints)
- `.planning/phases/01-foundation/01-CONTEXT.md` — `@wardbox/whisper` scoped name decision, subpath-only export structure, `files: ["dist"]` decision, attw/publint baseline
- `.planning/phases/06-documentation-site/06-CONTEXT.md` — Docs site lives in `packages/docs`, built by `pnpm --filter whisper-docs build`, will be the `homepage` URL target for D-18

### External references (to be read during research, not planning)
- Changesets documentation — `.changeset/config.json` options, GitHub Action setup, pre-release tags
- npm provenance documentation — `--provenance` flag requirements, OIDC setup, Trusted Publisher vs granular-token trade-offs
- size-limit (or equivalent) documentation — CI integration, per-entry budget syntax
- Deno npm compatibility documentation — `npm:` specifier syntax for testing a packed tarball

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@arethetypeswrong/cli` and `publint` are already installed as devDependencies and already run in CI — Phase 7 extends, does not install
- `tsdown` produces the `dist/` that Phase 7 packages and ships — no change to build tooling needed
- pnpm workspace with `packages/whisper` + `packages/docs` already configured — the release workflow uses `pnpm --filter @wardbox/whisper`
- `packages/whisper/src/core/client.ts` `createClient()` factory is the import target for D-06 smoke test (verified to exist in prior phases)
- Existing `files: ["dist"]` whitelist means tarball audit in D-21 has a tight expected file set

### Established Patterns
- Subpath export pattern (8 subpaths, each with `import`/`require` conditions and dual `.d.ts`/`.d.cts`) is already locked by Phase 1 — smoke test covers it as-is
- CI uses `pnpm/action-setup@v4` + `actions/setup-node@v4` — release workflow should use the same setup to avoid divergence
- No existing changesets infrastructure — `.changeset/` directory does not exist yet and will be created by `pnpm changeset init`
- Current `engines.node: ">=20.0.0"` in root package.json — library itself targets Node 18+ at runtime, but CI and the release workflow need Node 22 LTS (vitest 4 + attw)

### Integration Points
- `.github/workflows/ci.yml` — extend with matrix legs (D-01) + size-limit + tree-shake + tarball audit steps (D-19 through D-22)
- `.github/workflows/release.yml` — new file, Changesets publish workflow (D-10)
- `packages/whisper/package.json` — add `publishConfig`, metadata fields, update `license` (D-12, D-16, D-18)
- `packages/whisper/LICENSE` vs root `LICENSE` — verify which one ships in the tarball (`files: ["dist"]` means LICENSE only ships if referenced from package root or `dist/`; planner must decide placement)
- `e2e/smoke/` — new directory, does not currently exist
- Root `package.json` — add `smoke`, `release`, and any size-limit scripts
- `.changeset/` — new directory created by `pnpm changeset init`
- GitHub repository secrets — `NPM_TOKEN` must be added manually by the user before the first publish workflow run (planner should flag this as a manual step)

</code_context>

<specifics>
## Specific Ideas

- Wasp.sh-style `llms.txt` was referenced in Phase 6 for docs — Phase 7 does not touch docs but should not break the `docs:build` root script
- The tree-shake assertion (D-20) should use the same bundler the user's real consumers would use — rolldown or esbuild, not tsdown's own internal pipeline (which is itself rolldown-based but configured for library emit, not consumer bundles)
- Bundle size budgets should start from measured sizes + ~15% headroom, not arbitrary round numbers — the first CI run establishes the baseline
- The release workflow's "publish" step should explicitly run `pnpm build` fresh in CI even though CI already ran it on the upstream commit — never publish a tarball built from a stale dist
- Granular NPM_TOKEN scope: `@wardbox/whisper` only, "publish new versions" only — not "manage package settings" — so a token leak can't repoint the package

</specifics>

<deferred>
## Deferred Ideas

- **Trusted Publisher (OIDC, no secret)** — cleaner long-term than granular NPM_TOKEN, but requires npmjs.com manual Trusted Publisher configuration and is newer/less documented. Revisit after first successful publish with the granular token path.
- **Windows / macOS CI legs** — explicitly ruled out for Phase 7 (D-02). If real users report platform-specific bugs post-publish, add them then.
- **Live-API smoke test** — explicitly ruled out for Phase 7 (D-07). `pnpm generate-schema` and the weekly schema-drift workflow already cover live-API correctness; the smoke test's job is package-install correctness.
- **Bundle analyzer visualization** — size budgets enforce the threshold; per-module visualization (why is `/lol` 12 kB?) is a v1.x developer-experience improvement, not a v0.1 publish gate.
- **npmjs.com README polish / social preview image / custom package page assets** — defer to post-publish marketing pass.
- **v1.0.0 stability commitment** — explicitly deferred (D-15). Ship 0.1.0, collect real-consumer feedback, bump to 1.0.0 when the API surface has been validated in the wild.
- **Manual-publish escape hatch documentation** — not needed for first publish. Document only if an actual emergency arises.

</deferred>

---

*Phase: 07-hardening-and-publish*
*Context gathered: 2026-04-11*
