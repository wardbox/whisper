---
phase: 4
slug: lol-and-shared-endpoints
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (project version) |
| **Config file** | `packages/whisper/vitest.config.ts` |
| **Quick run command** | `pnpm vitest run src/lol/ src/riot/` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run src/lol/ src/riot/`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | ENDP-01 | unit | `pnpm vitest run src/lol/summoner-v4.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | ENDP-01 | unit | `pnpm vitest run src/lol/champion-v3.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | ENDP-01 | unit | `pnpm vitest run src/lol/league-v4.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | ENDP-01 | unit | `pnpm vitest run src/lol/match-v5.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 1 | ENDP-06 | unit | `pnpm vitest run src/riot/account-v1.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | ENDP-07 | unit | `pnpm vitest run src/lol/index.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | ENDP-08 | type test | `pnpm vitest run --typecheck` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | DOC-01 | manual | N/A | N/A | ⬜ pending |
| 04-03-02 | 03 | 2 | DOC-02 | manual | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lol/*.test.ts` — test stubs for each LoL API group (13 files)
- [ ] `src/riot/account-v1.test.ts` — Account-V1 test stubs
- [ ] `src/lol/index.test.ts` — tree-shaking / re-export verification
- [ ] Override types for missing DTOs (LeagueList, FeaturedGames, ActiveShard, etc.)
- [ ] Stub schemas for tournament-v5, tournament-stub-v5 if using codegen path

*Existing vitest infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TSDoc on public exports | DOC-01 | IDE hover quality requires human review | Check each exported namespace method in VS Code for TSDoc with usage example |
| JSDoc on DTO fields | DOC-02 | Field tooltip quality requires human review | Check generated/override type fields in VS Code for JSDoc descriptions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
