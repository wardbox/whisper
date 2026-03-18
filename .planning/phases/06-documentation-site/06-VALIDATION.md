---
phase: 6
slug: documentation-site
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (docs site build) |
| **Config file** | packages/docs/next.config.mjs |
| **Quick run command** | `cd packages/docs && pnpm dev` |
| **Full suite command** | `cd packages/docs && pnpm build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/docs && pnpm dev` (verify dev server starts)
- **After every plan wave:** Run `cd packages/docs && pnpm build` (full static build succeeds)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | DOC-03 | smoke | `cd packages/docs && pnpm build` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | DOC-04 | smoke | `cd packages/docs && pnpm build` (type tables render) | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | DOC-03 | manual | Visual inspection of /docs/quickstart | N/A | ⬜ pending |
| 06-02-02 | 02 | 2 | DOC-03 | manual | Visual inspection of /docs/routing | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/docs/package.json` — full dependency list (currently empty placeholder)
- [ ] `packages/docs/next.config.mjs` — Next.js + Fumadocs MDX config
- [ ] `packages/docs/source.config.ts` — Content source configuration
- [ ] `packages/docs/tsconfig.json` — TypeScript config for docs package
- [ ] `packages/docs/app/layout.tsx` — Root layout with RootProvider
- [ ] Framework install: `cd packages/docs && pnpm add fumadocs-core@16 fumadocs-ui@16 fumadocs-mdx@14 fumadocs-typescript@5 next@16 react@19 react-dom@19`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Quickstart guide shows complete working example | DOC-03 | Content quality requires visual review | Navigate to /docs/quickstart, verify install-to-first-call flow |
| Routing page explains platform vs regional with examples | DOC-03 | Content quality requires visual review | Navigate to /docs/routing, verify PlatformRoute vs RegionalRoute explanation |
| Type tables render with expandable sub-types | DOC-04 | Visual layout verification | Navigate to /api/lol, verify type tables render with inline expandable nested types |
| Landing page has tagline, features, install command, CTA | DOC-03 | Visual design review | Navigate to /, verify hero section content |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
