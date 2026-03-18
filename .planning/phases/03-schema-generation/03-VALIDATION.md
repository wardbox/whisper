---
phase: 3
slug: schema-generation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run --reporter=verbose` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-T1 | 01 | 1 | SCHEMA-01 | unit | `pnpm vitest run scripts/generate-schema/schema.test.ts` | schema.test.ts (created in task) | pending |
| 03-01-T2 | 01 | 1 | SCHEMA-01 | unit | `pnpm vitest run scripts/generate-schema/registry.test.ts` | registry.test.ts (created in task) | pending |
| 03-02-T1 | 02 | 2 | SCHEMA-02 | unit | `pnpm vitest run scripts/generate-schema/codegen.test.ts` | codegen.test.ts (created in task) | pending |
| 03-02-T2 | 02 | 2 | SCHEMA-02, SCHEMA-03 | integration | `npx tsx ../../scripts/generate-schema/index.ts 2>&1 \| grep RIOT_API_KEY` | N/A (entry point smoke test) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `packages/whisper/vitest.config.ts` updated to include `scripts/**/*.test.ts` (done in 03-01-T1)
- [ ] Test fixtures with sample API responses for offline testing (embedded in test files as inline objects)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live API schema capture | SCHEMA-01 | Requires valid RIOT_API_KEY | Run `pnpm generate-schema` with dev key, verify `.schema.json` files created |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
