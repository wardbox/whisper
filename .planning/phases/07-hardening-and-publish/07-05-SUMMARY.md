---
phase: 07-hardening-and-publish
plan: 05
subsystem: release-pipeline
tags: [release, changesets, publish, npm-token, security, provenance]
dependency_graph:
  requires: [07-01, 07-02, 07-03, 07-04]
  provides: [release-workflow, token-check-workflow, changesets-config]
  affects: [.github/workflows/, .changeset/]
tech_stack:
  added: ["@changesets/cli", "@changesets/changelog-github"]
  patterns: [changesets-versioning, oidc-provenance, granular-npm-tokens]
key_files:
  created:
    - .changeset/config.json
    - .changeset/README.md
    - .github/workflows/release.yml
    - .github/workflows/token-check.yml
  modified: []
decisions:
  - "Changesets changelog uses @changesets/changelog-github for PR-linked changelogs"
  - "Release workflow pins changesets/action@v1.7.0 (supply-chain hardening)"
  - "No workflow_dispatch on release.yml (D-14 no manual escape hatch)"
  - "Token-check scheduled Mondays 14:00 UTC (weekly cadence)"
  - "Docs package already had private: true, no modification needed"
metrics:
  duration: 2min
  completed: "2026-04-12T00:23:51Z"
  tasks_completed: 3
  tasks_total: 4
  files_created: 4
  files_modified: 0
---

# Phase 7 Plan 5: Release Pipeline and Publish Setup Summary

Changesets-driven release workflow with SLSA provenance, weekly NPM_TOKEN validation, and docs package publish protection. Task 4 (manual setup) is a checkpoint requiring user action.

## Task Results

### Task 1: Initialize Changesets (6a2dfb5)

Ran `npx @changesets/cli init` to create `.changeset/` directory, then overwrote `config.json` with the project-specific configuration:

- `access: "public"` -- required for scoped `@wardbox/*` packages
- `baseBranch: "main"` -- project default branch
- `changelog: ["@changesets/changelog-github", { "repo": "wardbox/whisper" }]` -- PR-linked changelogs with author attribution
- `commit: false` -- GitHub Action creates the commit, not local CLI
- `ignore: ["whisper-docs"]` -- excludes docs package from version bumps (Pitfall 9 mitigation)

Docs package (`packages/docs/package.json`) already had `"private": true` -- no modification needed. This provides two layers of defense against accidental docs publish: Changesets ignore + npm private flag.

### Task 2: Create release.yml (da5fd03)

Created `.github/workflows/release.yml` with the following structure:

- **Trigger:** Push to main only (no `workflow_dispatch` per D-14)
- **Permissions:** `contents: write`, `pull-requests: write`, `id-token: write` (OIDC for provenance)
- **Action:** `changesets/action@v1.7.0` pinned explicitly (supply-chain hardening per T-07-31)
- **Publish command:** `pnpm release` (builds, runs smoke/size/tarball-audit gates, then publishes)
- **Version command:** `pnpm changeset version`
- **Provenance:** `NPM_CONFIG_PROVENANCE=true` in env (requires `id-token: write` -- Pitfall 7 mitigation)
- **Concurrency:** `release-${{ github.ref }}` with `cancel-in-progress: false` prevents simultaneous releases
- **Setup:** `registry-url: 'https://registry.npmjs.org'` required for NODE_AUTH_TOKEN plumbing
- **Checkout:** `fetch-depth: 0` required for changesets git-log analysis

### Task 3: Create token-check.yml (ee3796f)

Created `.github/workflows/token-check.yml` for weekly NPM_TOKEN validation:

- **Schedule:** Every Monday at 14:00 UTC (`cron: '0 14 * * 1'`)
- **Validation:** `npm whoami` against the registry -- 401 means expired/revoked
- **Guard:** `if: github.repository == 'wardbox/whisper'` prevents fork execution
- **Permissions:** `contents: read` only (least privilege)
- **Manual trigger:** `workflow_dispatch` for ad-hoc validation after token rotation
- **Error messages:** Include step-by-step rotation instructions in `::error::` annotations

This mitigates Pitfall 8 (silent 90-day token expiry) by surfacing expired tokens before they break releases.

### Task 4: Manual Setup (CHECKPOINT -- not executed)

Task 4 is a `checkpoint:human-action` requiring the following one-time manual steps:

1. **Verify npm account 2FA** -- npmjs.com > Account > 2FA (required for granular tokens since Dec 2025)
2. **Verify @wardbox/whisper name availability** -- `npm view @wardbox/whisper` should return 404
3. **Generate granular NPM_TOKEN** -- npmjs.com > Access Tokens > Granular Access Token
   - Name: `whisper-ci-publish`
   - Expiry: 90 days
   - Scope: `@wardbox/whisper` only
   - Permissions: `Publish new versions` ONLY
4. **Add NPM_TOKEN to GitHub repo secrets** -- Settings > Secrets and variables > Actions
5. **Configure branch protection on main** -- Require status checks: `Build + gates (node 22)`, all 4 Smoke legs
6. **Set 80-day calendar reminder** for token rotation
7. **First-publish dry-run** -- `cd packages/whisper && npm publish --dry-run`

## Verification Results

| Check | Status |
|-------|--------|
| .changeset/config.json fields (access, baseBranch, ignore) | PASSED |
| release.yml id-token write + NPM_CONFIG_PROVENANCE | PASSED |
| release.yml no workflow_dispatch | PASSED |
| release.yml changesets/action@v1.7.0 pinned | PASSED |
| token-check.yml schedule + npm whoami | PASSED |
| packages/docs/package.json private: true | PASSED |
| Existing workflows (ci.yml, schema-drift.yml) unchanged | PASSED |

## Deviations from Plan

None -- plan executed exactly as written. Docs package already had `private: true` so no modification was needed (Task 1 step 3 was a no-op).

## Threat Mitigations Applied

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-07-25: NPM_TOKEN leaked via logs | GitHub Actions auto-masks secrets; NODE_AUTH_TOKEN used via setup-node .npmrc | IMPLEMENTED |
| T-07-28: Token expires silently (90 days) | token-check.yml weekly validation | IMPLEMENTED |
| T-07-29: No provenance on published tarball | id-token: write + NPM_CONFIG_PROVENANCE=true | IMPLEMENTED |
| T-07-30: Docs package accidentally published | ignore in Changesets config + private: true | IMPLEMENTED |
| T-07-31: Supply-chain via floating action tag | changesets/action@v1.7.0 pinned | IMPLEMENTED |
| T-07-26: Overly broad NPM_TOKEN scope | Documented in Task 4 checkpoint (publish-only) | PENDING (manual) |
| T-07-27: Merge without CI passing | Documented in Task 4 checkpoint (branch protection) | PENDING (manual) |

## Known Stubs

None -- all automatable work is complete. Task 4 manual steps are documented above and tracked as a checkpoint.

## Self-Check: PASSED

All 4 created files verified on disk. All 3 task commits verified in git log.
