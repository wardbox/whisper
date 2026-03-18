---
phase: 5
slug: tft-valorant-lor-and-riftbound-endpoints
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | packages/whisper/vitest.config.ts |
| **Quick run command** | `pnpm vitest run src/{game}/` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run src/{game}/` (game-specific)
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | ENDP-02 | unit | `pnpm vitest run src/tft/index.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | ENDP-02 | unit | `pnpm vitest run src/tft/routing.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | ENDP-02 | unit | `pnpm vitest run src/tft/` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | ENDP-03 | unit | `pnpm vitest run src/val/index.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | ENDP-03 | unit | `pnpm vitest run src/val/routing.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 1 | ENDP-03 | unit | `pnpm vitest run src/val/` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 1 | ENDP-04 | unit | `pnpm vitest run src/lor/index.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 1 | ENDP-04 | unit | `pnpm vitest run src/lor/routing.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-03 | 03 | 1 | ENDP-05 | unit | `pnpm vitest run src/riftbound/index.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-04 | 03 | 1 | ENDP-05 | unit | `pnpm vitest run src/riftbound/routing.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/types/val-platform.ts` — ValPlatformRoute type definition
- [ ] `src/types/val-platform.test.ts` — type mutual exclusivity tests
- [ ] Update `src/core/client.ts` WhisperClient interface to accept ValPlatformRoute
- [ ] All game endpoint files, test files, index files, and routing test files

*All test files are created during implementation — no pre-existing test infrastructure gaps.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tree-shaking isolation | ENDP-02 SC5 | Requires bundler analysis | Import only `@wardbox/whisper/tft`, check bundle output excludes LoL/Val code |
| LoR active endpoint audit | ENDP-04 | Requires live API explorer | Playwright audit of lor-match-v1, lor-deck-v1, lor-inventory-v1 availability |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
