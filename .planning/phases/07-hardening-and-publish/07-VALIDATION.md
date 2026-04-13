---
phase: 7
slug: hardening-and-publish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `07-RESEARCH.md` § Validation Architecture. Phase 7 is a delivery phase — validation gates are the phase, not just an adjunct to it.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 (existing library unit tests) + bespoke smoke scripts in `e2e/smoke/` + `size-limit` 12.0.1 (bundle budgets) + `@publint/pack` 0.1.4 (tarball audit) + `esbuild` 0.28.0 (tree-shake verification) + `attw` (existing) + `publint` (existing) |
| **Config files** | `packages/whisper/vitest.config.ts` (existing) · `packages/whisper/.size-limit.json` (new, Wave 0) · `e2e/tarball-allowlist.json` (new, Wave 0) · `e2e/smoke/package.json` (new, Wave 0) · `e2e/smoke/deno.json` (new, Wave 0) · `.changeset/config.json` (new, Wave 0) |
| **Quick run command** | `pnpm test` (unit tests, <10s) |
| **Full suite command** | `pnpm build && pnpm test && pnpm check && pnpm size && pnpm tarball:audit && pnpm smoke` |
| **Estimated runtime** | Quick: ~10s · Full (local): ~90s · Full (CI matrix with 4 runtimes): ~4min |

---

## Sampling Rate

- **After every task commit:** `pnpm test` + `pnpm check`
- **After every plan completion:** `pnpm build && pnpm test && pnpm size && pnpm tarball:audit`
- **After every wave merge:** Full `pnpm smoke` (pack + install + multi-runtime)
- **Before `/gsd-verify-work`:** Full CI matrix green (all 4 runtime legs + attw + publint + size + tarball-audit + tree-shake)
- **Max feedback latency:** ~10s for per-task commit (unit tests); ~90s for per-plan (full local gate)

---

## Per-Task Verification Map

**Note:** This phase has no traditional REQ-IDs (it's a delivery phase — all requirements mapped to Phases 1-6). Verification maps to Phase 7 success criteria (SC-1..SC-4) and CONTEXT.md gates (D-01..D-22). Detailed per-task rows will be filled by the planner as tasks are created — the table below establishes the schema.

| Task ID | Plan | Wave | Success Criterion / Gate | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|--------------------------|-----------------|-----------|-------------------|-------------|--------|
| _(filled per plan)_ | _(nn)_ | _(n)_ | SC-1..4 / D-01..22 | _(expected behavior or N/A)_ | unit/integration/ci | `{command}` | ✅ / ❌ W0 | ⬜ pending |

---

## Phase Success Criteria → Validation Map

From `ROADMAP.md` Phase 7 success criteria:

| Success Criterion | Behavior Proven | Test Type | Automated Command | File Exists? |
|-------------------|-----------------|-----------|-------------------|-------------|
| **SC-1** — attw reports no type resolution issues | ESM+CJS type resolution for every subpath | integration | `cd packages/whisper && npx attw --pack --profile node16` | ✅ (existing `ci.yml` step) |
| **SC-2** — publint reports no export misconfiguration | Exports map + types + files well-formed | integration | `cd packages/whisper && npx publint .` | ✅ (existing `ci.yml` step) |
| **SC-3** — CI runs suite on Node 22 (ESM+CJS), Deno, Bun | Smoke resolves + executes in every runtime | integration (CI matrix) | `ci.yml smoke-matrix` job with 4 legs | ❌ Wave 0 |
| **SC-4** — Published package installs + basic import works | End-to-end consumer install path | integration | `pnpm smoke` | ❌ Wave 0 |

## CONTEXT.md Gates → Validation Map

Additional gates locked in CONTEXT.md (D-19..D-22) beyond the ROADMAP success criteria:

| CONTEXT Gate | Behavior Proven | Test Type | Automated Command | File Exists? |
|--------------|-----------------|-----------|-------------------|-------------|
| **D-19** Per-subpath bundle size budget | No bundle size regressions per entry point | integration | `pnpm size` (size-limit against each `dist/*` entry) | ❌ Wave 0 |
| **D-20** Tree-shake verification | `/tft` bundle contains zero LoL/Val/LoR/Riftbound symbols | integration | `node e2e/smoke/tree-shake/check.mjs` | ❌ Wave 0 |
| **D-21** Tarball content audit | Packed tarball matches committed allowlist (no leaked files) | integration | `pnpm tarball:audit` (`@publint/pack` + diff) | ❌ Wave 0 |
| **D-22** All PR-time gates enforced | D-19/D-20/D-21 + smoke matrix run on every PR | ci config | `ci.yml` PR triggers | ❌ Wave 0 |

---

## Wave 0 Requirements

Every gate above is net-new. Wave 0 creates the test + validation infrastructure before any gate can assert:

- [ ] `e2e/smoke/package.json` — consumer fixture pinning `file:../../packages/whisper/wardbox-whisper-0.1.0.tgz`
- [ ] `e2e/smoke/smoke.mjs` — Node ESM entry exercising every subpath
- [ ] `e2e/smoke/smoke.cjs` — Node CJS entry exercising every subpath
- [ ] `e2e/smoke/deno.json` — Deno config with `nodeModulesDir: "auto"` (bootstrap workaround per user decision)
- [ ] `e2e/smoke/smoke_deno.ts` — Deno smoke entry (same imports, resolved via node_modules)
- [ ] `e2e/smoke/smoke_bun.ts` — Bun smoke entry
- [ ] `e2e/smoke/tsconfig.json` — minimum tsconfig for `tsc --noEmit` subpath type resolution check
- [ ] `e2e/smoke/tree-shake/entry-tft.ts` — TFT-only import fixture
- [ ] `e2e/smoke/tree-shake/entry-lol.ts` — LoL-only import fixture
- [ ] `e2e/smoke/tree-shake/check.mjs` — bundles both fixtures with esbuild, greps for forbidden cross-game symbols
- [ ] `e2e/tarball-allowlist.json` — initial snapshot of expected tarball contents (globbed to tolerate hashed chunks)
- [ ] `scripts/smoke/run.mjs` — orchestration script for `pnpm smoke` (pack → install → run every runtime leg)
- [ ] `scripts/tarball-audit/audit.mjs` — runs `@publint/pack`, diffs against allowlist
- [ ] `scripts/prepack-strip-maps.mjs` — prepack hook removing `dist/**/*.js.map` (per user decision on source maps)
- [ ] `packages/whisper/.size-limit.json` — per-subpath budgets (numbers measured before locking; headroom ~15%)
- [ ] `.changeset/config.json` — initialized via `pnpm changeset init`, edited to ignore `whisper-docs`, set changelog format, access public
- [ ] `.github/workflows/release.yml` — Changesets-driven release workflow with `id-token: write`, provenance, matrix gate
- [ ] `.github/workflows/ci.yml` — extended with smoke matrix (4 legs), size, tarball audit, tree-shake — existing attw + publint steps preserved
- [ ] Root `package.json` — new scripts: `smoke`, `size`, `tarball:audit`, `release`, `changeset`, `prepack`
- [ ] `packages/whisper/package.json` — metadata fields (description, keywords, author, repository, bugs, homepage), `publishConfig`, `license: MIT`, `files: ["dist", "LICENSE", "README.md"]`
- [ ] `packages/whisper/LICENSE` — MIT, copied after root GPL→MIT swap (package root is what gets packed — D-16)
- [ ] `packages/whisper/README.md` — npm-facing README per D-17 (description + install + 30s quickstart + feature highlights + link to docs)
- [ ] Root `LICENSE` — GPLv3 → MIT replacement (with Wardbox, 2026)
- [ ] Root `README.md` — expanded per D-17
- [ ] `.gitignore` — additions: `e2e/smoke/node_modules/`, `packages/whisper/wardbox-whisper-*.tgz`, `e2e/smoke/wardbox-whisper-*.tgz`, `e2e/smoke/pnpm-lock.yaml`

---

## Manual-Only Verifications

| Behavior | Gate | Why Manual | Instructions |
|----------|------|------------|--------------|
| `@wardbox/whisper` name is available on npm | Pre-publish | npm registry operation | `npm view @wardbox/whisper` — expect 404 |
| npm account has 2FA enabled | Pre-token | Required for granular tokens (Dec 2025 policy) | Check at npmjs.com → Account → 2FA |
| Generate granular `NPM_TOKEN` (90-day max, scoped to `@wardbox/whisper`, publish-only permission) | Pre-release-workflow | User-specific credential | npmjs.com → Access Tokens → Generate granular token |
| Add `NPM_TOKEN` to GitHub Actions repo secrets | Pre-release-workflow | User-specific credential | GitHub → Settings → Secrets → Actions → `NPM_TOKEN` |
| Configure branch protection on `main` with `ci.yml` as required check | Pre-release-workflow | Prevents publishing broken builds | GitHub → Settings → Branches → main → Require status checks |
| LICENSE file legally accurate (MIT, Wardbox, 2026) | Plan verification | Legal text review | Read `LICENSE` after swap — confirm SPDX canonical MIT |
| README renders correctly on npmjs.com (preview) | Plan verification + post-first-publish | Rendering depends on markdown flavor | `cd packages/whisper && npm pack --dry-run` preview tarball README |
| First publish dry-run | Pre-first-release | Final sanity check before committing a real version | `cd packages/whisper && npm publish --dry-run` (before merging the first Version Packages PR) |
| Calendar reminder or CI early-warning for 90-day NPM_TOKEN rotation | Post-first-publish | Token silently expires after 90 days | User's preferred reminder mechanism; planner implements CI early-warning per Pitfall 8 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify fields OR Wave 0 dependency listed
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers every gate listed in § Phase Success Criteria + § CONTEXT.md Gates
- [ ] No watch-mode flags in any verify command (all one-shot)
- [ ] Feedback latency < 15s for quick run, < 120s for full local gate
- [ ] `nyquist_compliant: true` set in frontmatter once all tasks reference a gate

**Approval:** pending
