---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `packages/whisper/vitest.config.ts` — Wave 0 (does not exist yet) |
| **Quick run command** | `pnpm --filter @wardbox/whisper vitest run` |
| **Full suite command** | `pnpm --filter @wardbox/whisper vitest run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @wardbox/whisper vitest run`
- **After every plan wave:** Run `pnpm build && pnpm test && pnpm check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FOUND-01 | smoke | `ls packages/whisper/dist/lol/index.js packages/whisper/dist/lol/index.cjs` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | FOUND-02 | lint | `pnpm check` (exits 0) | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | FOUND-03 | unit | `pnpm --filter @wardbox/whisper vitest run` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | FOUND-04 | CI smoke | `attw --pack && publint .` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | FOUND-05 | smoke | `pnpm ls -r` shows whisper + docs packages | ❌ W0 | ⬜ pending |
| 01-01-06 | 01 | 1 | FOUND-06 | unit | `node -e "const p=require('./packages/whisper/package.json'); if(p.dependencies) process.exit(1)"` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | TYPE-01 | unit | `pnpm --filter @wardbox/whisper vitest run src/types/platform.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | TYPE-02 | unit | `pnpm --filter @wardbox/whisper vitest run src/types/regional.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | TYPE-03 | type-check | `pnpm --filter @wardbox/whisper exec tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | TYPE-04 | type-check | `pnpm --filter @wardbox/whisper exec tsc --noEmit` (with @ts-expect-error assertions) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/whisper/vitest.config.ts` — framework config
- [ ] `pnpm add -D vitest @vitest/coverage-v8` in `packages/whisper` — framework install
- [ ] `packages/whisper/src/types/platform.test.ts` — stubs for TYPE-01
- [ ] `packages/whisper/src/types/regional.test.ts` — stubs for TYPE-02
- [ ] `packages/whisper/src/types/routing.test.ts` — stubs for TYPE-03/TYPE-04 mapping
- [ ] TYPE-04 compile-error tests use `// @ts-expect-error` inline assertions

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| IDE autocomplete shows PLATFORM/REGIONAL constants | TYPE-01/TYPE-02 | IDE-specific behavior | Open VS Code, type `PLATFORM.` and verify autocomplete shows all 17 values |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
