# Phase 7: Hardening and Publish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 07-hardening-and-publish
**Areas discussed:** Runtime matrix & smoke tests, Release/publish workflow, Version/metadata/README/LICENSE, Extra pre-publish validation gates

---

## Gray Area Selection

User was presented with 4 collapsed gray areas (original list was 6; merged to fit the 4-option multi-select cap). User selected **all four**.

| Area | Description | Selected |
|------|-------------|----------|
| Runtime matrix & smoke tests | CI matrix across Node/Deno/Bun + fresh-install smoke fixture. Recommended. | ✓ |
| Release/publish workflow | Automation, provenance, OTP/2FA, publishConfig.access. Recommended. | ✓ |
| Version, metadata, README, LICENSE | First-publish version, README content, LICENSE (currently GPLv3), package.json metadata. | ✓ |
| Extra pre-publish gates | Bundle size, tree-shake verification, pnpm pack tarball audit. | ✓ |

---

## Area 1: Runtime matrix & smoke tests

### Q1: How should the runtime matrix be structured in CI?

| Option | Description | Selected |
|--------|-------------|----------|
| One job matrix across runtimes | Single workflow with strategy.matrix: [node-esm, node-cjs, deno, bun]. Simple, fast, one badge. **Recommended.** | ✓ |
| Separate workflow per runtime | ci.yml stays Node-only; new runtime-smoke.yml handles Deno+Bun. More YAML, more PR signals. | |
| Reuse one job, iterate runtimes via shell loop | Single Ubuntu job installs all three runtimes and loops. Cheapest but worst diagnostics. | |

**User's choice:** One job matrix across runtimes (Recommended)

### Q2: OS coverage for the runtime jobs?

| Option | Description | Selected |
|--------|-------------|----------|
| Ubuntu only | All 4 legs on ubuntu-latest. Riot API is pure fetch/JSON. **Recommended.** | ✓ |
| Ubuntu + macOS | Adds Mac-dev confidence but doubles job count. | |
| Ubuntu + macOS + Windows | Full 3-OS matrix. No shell/path-specific code to warrant it. | |

**User's choice:** Ubuntu only (Recommended)

### Q3: Where does the fresh-install smoke test fixture live?

| Option | Description | Selected |
|--------|-------------|----------|
| e2e/smoke/ directory in repo | Committed fixture. CI runs `pnpm pack` → installs tarball into it. Reproducible locally. **Recommended.** | ✓ |
| Ephemeral tmpdir in CI step | Tmp dir + `pnpm init` + install tarball. Leaner but not reproducible locally. | |
| Link the workspace in-place | Skip pack entirely — test against workspace dist/. Misses `files:` whitelist bugs. | |

**User's choice:** e2e/smoke/ directory in repo (Recommended)

### Q4: Which subpaths should the smoke test exercise?

| Option | Description | Selected |
|--------|-------------|----------|
| Every subpath, type-check only | Imports for all 8 subpaths + `tsc --noEmit` + no-network `createClient()`. **Recommended.** | ✓ |
| Core + /lol only | Faster but risks silent breakage on other game subpaths. | |
| Every subpath + one live API call | Fullest proof but needs RIOT_API_KEY, adds flakiness and rate-limit concerns. | |

**User's choice:** Every subpath, type-check only (Recommended)

**Notes:** Clean sweep on Area 1 — all four recommended defaults accepted.

---

## Area 2: Release/publish workflow

### Q1: How should releases be triggered?

| Option | Description | Selected |
|--------|-------------|----------|
| Changesets + GitHub Action on main | Per-change changeset files + "Version Packages" PR + auto-publish on merge. Used by pnpm, TanStack, shadcn. **Recommended.** | ✓ |
| Manual pnpm publish from local | No automation. Simplest, but holds OTP and manual checklist. | |
| release-please (Google) | Conventional commits auto-generate CHANGELOG. Lighter but requires strict commit discipline. | |
| Tag-triggered workflow | Push `v0.1.0` tag → GH Action publishes. Halfway between manual and automated. | |

**User's choice:** Changesets + GitHub Action on main (Recommended)

### Q2: Should published packages use npm provenance?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — enable --provenance | Cryptographic build attestation linking package → GH Action run + commit. Free, 4 lines of YAML, 2026 gold standard. Requires publish in GH Actions. **Recommended.** | ✓ |
| Not yet — revisit post-v1 | Skip for now, add later. | |

**User's choice:** Yes — enable --provenance (Recommended)

### Q3: How should the scoped package be published?

| Option | Description | Selected |
|--------|-------------|----------|
| Public, auto-set in package.json | Add `publishConfig.access: public` to package.json. Belt-and-suspenders: workflow also passes --access public. **Recommended.** | ✓ |
| CLI flag only | Rely on `npm publish --access public`. A manual publish could accidentally create a private release. | |

**User's choice:** Public, auto-set in package.json (Recommended)

### Q4: Access token for the publish workflow?

| Option | Description | Selected |
|--------|-------------|----------|
| npm granular access token | Token scoped to `@wardbox/whisper` + "publish new versions" only. Safer than classic token. **Recommended.** | ✓ |
| Classic automation token | Account-wide blast radius on leak. | |
| Trusted Publisher (OIDC, no token) | npmjs.com trusts GH Actions OIDC directly. Cleanest long-term but requires manual Trusted Publisher configuration on npmjs.com before first publish. Deferred. | |

**User's choice:** npm granular access token (Recommended)

**Notes:** Trusted Publisher noted for deferred ideas — cleaner long-term path once first publish is out the door with the granular-token approach.

---

## Area 3: Version, metadata, README, LICENSE

### Q1: First-publish version?

| Option | Description | Selected |
|--------|-------------|----------|
| 0.1.0 | Matches current package.json. "Usable, API mostly stable, breaking changes still possible." **Recommended.** | ✓ |
| 1.0.0 | 31 API groups done, tests pass, docs exist — arguably feature-complete. But no real users and commits to semver. | |
| 0.0.1 | Too humble given the scope of what's shipped. | |

**User's choice:** 0.1.0 (Recommended)

### Q2: LICENSE choice? (Currently GPLv3 — unusual for a library.)

| Option | Description | Selected |
|--------|-------------|----------|
| Switch to MIT | Standard for JS/TS libraries. GPLv3 copyleft would force every consumer project to also be GPLv3 — hard adoption blocker for commercial Riot-API users. The current GPLv3 is likely leftover default text, not an intentional choice. **Recommended.** | ✓ |
| Keep GPLv3 | Explicit copyleft. Significantly narrows reach. | |
| Apache 2.0 | Permissive + explicit patent grants. Usually overkill for a REST API wrapper. | |

**User's choice:** Switch to MIT (Recommended)

**Notes:** Key call-out — GPLv3 in the repo is almost certainly git-init default, not a deliberate choice. Confirmed with user.

### Q3: README scope for first publish?

| Option | Description | Selected |
|--------|-------------|----------|
| Concise + link to docs site | Install, 30-second quickstart, feature bullets, link to Fumadocs site. Renders well on npmjs.com. **Recommended.** | ✓ |
| Full guide in README | Duplicates docs site. Two sources of truth. | |
| Minimal + link only | npmjs.com package page looks empty. Bad first impression. | |

**User's choice:** Concise + link to docs site (Recommended)

### Q4: package.json metadata fields to add before publish?

| Option | Description | Selected |
|--------|-------------|----------|
| Full set | description, keywords, author, repository, bugs, homepage. Discoverable on npmjs.com. **Recommended.** | ✓ |
| Minimum for publish | Only what publint requires. Looks bare. | |
| Claude's discretion | Let Claude pick sensible defaults during planning. | |

**User's choice:** Full set (Recommended)

---

## Area 4: Extra pre-publish validation gates

### Q1: Bundle size budget?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — enforce per-subpath budgets in CI | size-limit per entry point, budget per subpath, CI fails on regression. **Recommended.** | ✓ |
| Log size, don't enforce | Awareness only. Nothing stops a size regression. | |
| Skip — tsdown output is already lean | Trust publint + manual inspection. No guard. | |

**User's choice:** Yes — enforce per-subpath budgets in CI (Recommended)

### Q2: Tree-shake verification?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — bundler test in smoke fixture | Import only `/tft`, run bundler, grep output for zero LoL/Val/LoR/Riftbound code. Matches Phase 5 success criterion #5. **Recommended.** | ✓ |
| Skip — sideEffects:false is enough | Trust the flag. No runtime proof. | |

**User's choice:** Yes — bundler test in smoke fixture (Recommended)

### Q3: pnpm pack tarball audit?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — snapshot-test tarball contents | `pnpm pack` → enumerate paths → diff against committed allow-list. Catches accidental leaks. **Recommended.** | ✓ |
| Skip — files: whitelist is enough | No backstop if whitelist is accidentally expanded. | |

**User's choice:** Yes — snapshot-test tarball contents (Recommended)

### Q4: Where do these extra gates run?

| Option | Description | Selected |
|--------|-------------|----------|
| Main CI job on every PR | Gates alongside build/test/attw/publint. ~30s extra per run. **Recommended.** | ✓ |
| Pre-publish job only | Faster PRs but broken tree-shake can sit on main for days. | |
| Nightly scheduled workflow | 24h feedback delay on regressions. | |

**User's choice:** Main CI job on every PR (Recommended)

---

## Claude's Discretion

Items the user explicitly left open for downstream planning:

- Exact bundle-size budget numbers per subpath (measure first, set budgets with headroom)
- Changesets configuration details (`.changeset/config.json` settings)
- Release workflow YAML structure (job deps, concurrency, environment gating)
- Exact README copy (structure locked, wording open)
- `e2e/smoke/` project structure (monolithic vs per-runtime folders)
- Tarball allow-list format (plain text vs JSON snapshot)
- `pnpm release` root script contents
- `author` field specifics (optional URL, handle style)

## Deferred Ideas

- **Trusted Publisher (OIDC)** — cleaner than granular NPM_TOKEN but newer/less documented; revisit after first successful publish
- **Windows / macOS CI legs** — ruled out for Phase 7; add only if real users report platform-specific bugs
- **Live-API smoke test** — explicitly out of scope; schema-drift workflow already covers live-API correctness
- **Bundle analyzer visualization** — v1.x DX improvement, not a publish gate
- **npmjs.com package page polish** — defer to post-publish marketing pass
- **v1.0.0 stability commitment** — ship 0.1.0 first, collect feedback, bump later
- **Manual-publish escape hatch docs** — not needed until an actual emergency arises

## Pattern Observed

User accepted every recommended default across all 16 questions (4 areas × 4 questions). This is consistent with prior phase patterns — Wardbox generally trusts researched recommendations and reserves pushback for decisions that conflict with project philosophy. No pushback in this session suggests the recommendations aligned well with the existing stack and design philosophy (latest-and-greatest 2025+ tooling, save users from foot-guns, zero-deps). One notable signal: the GPLv3 → MIT switch was flagged by Claude (not asked by user) and confirmed on the first try, suggesting the user's mental model already treated GPLv3 as leftover default.
