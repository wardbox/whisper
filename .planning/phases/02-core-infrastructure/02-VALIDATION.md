---
phase: 2
slug: core-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run --reporter=verbose` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | HTTP-01 | unit | `pnpm vitest run src/core/http-client.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | HTTP-02 | unit | `pnpm vitest run src/core/http-client.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | HTTP-03 | unit | `pnpm vitest run src/core/http-client.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | HTTP-04 | unit | `pnpm vitest run src/core/http-client.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | RATE-01 | unit | `pnpm vitest run src/core/rate-limiter.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | RATE-02 | unit | `pnpm vitest run src/core/rate-limiter.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | RATE-03 | unit | `pnpm vitest run src/core/rate-limiter.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | CACHE-01 | unit | `pnpm vitest run src/core/cache.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | CACHE-02 | unit | `pnpm vitest run src/core/cache.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | CACHE-03 | unit | `pnpm vitest run src/core/cache.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-04 | 03 | 2 | CACHE-04 | unit | `pnpm vitest run src/core/cache.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/core/http-client.test.ts` — stubs for HTTP-01, HTTP-02, HTTP-03, HTTP-04
- [ ] `src/core/rate-limiter.test.ts` — stubs for RATE-01, RATE-02, RATE-03
- [ ] `src/core/cache.test.ts` — stubs for CACHE-01, CACHE-02, CACHE-03, CACHE-04

*Vitest already installed and configured from Phase 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Proactive queuing under real load | RATE-01 | Requires real API timing | Use dev key, burst 100 requests, confirm no 429s in output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
