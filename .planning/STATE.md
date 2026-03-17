---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: Completed 03-01-PLAN.md
last_updated: "2026-03-17T18:40:54Z"
last_activity: 2026-03-17 — Completed schema runner core modules (03-01)
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 8
  completed_plans: 7
  percent: 70
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-17)

**Core value:** Every Riot API endpoint accessible through a typed, tree-shakeable interface with proactive rate limiting that prevents 429s without requiring users to understand Riot's internals.
**Current focus:** Phase 3 — Schema Generation

## Current Position

Phase: 3 of 7 (Schema Generation)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-03-17 — Completed schema runner core modules (03-01)

Progress: [███████░░░] 70%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation P01 | 4 | 2 tasks | 20 files |
| Phase 01-foundation P02 | 3min | 2 tasks | 8 files |
| Phase 02-core-infrastructure P01 | 3min | 2 tasks | 5 files |
| Phase 02-core-infrastructure P02 | 3min | 1 task | 2 files |
| Phase 02 P03 | 4min | 1 task | 2 files |
| Phase 02 P04 | 4min | 2 tasks | 13 files |
| Phase 03 P01 | 5min | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Docs site uses Fumadocs or Starlight (not VitePress) — user preference, both support TypeDoc integration
- [Init]: Publish as `@wardbox/whisper` — `whisper` on npm is taken by unrelated 2013 package
- [Init]: Phase 2 (Core Infrastructure) is the highest-risk phase — rate limiter correctness is load-bearing for all 31 endpoint modules
- [Init]: Schema generation (Phase 3) must precede endpoint modules — no hand-written types
- [Phase 01-foundation]: Biome 2.x changed files.ignore to !pattern syntax in files.includes — updated biome.json accordingly
- [Phase 01-foundation]: exports field uses nested import/require conditions with .d.cts for CJS consumers to pass attw node16 check
- [Phase 01-foundation]: node10 attw failures are expected and non-blocking — no main field is intentional (no root barrel locked decision)
- [Phase 01-foundation]: Set skipLibCheck: true in tsconfig.base.json — vitest 4.x types incompatible with exactOptionalPropertyTypes
- [Phase 02-core-infrastructure P01]: RiotApiError constructor uses options object pattern for readability/extensibility
- [Phase 02-core-infrastructure P01]: API key redaction applied in RiotApiError constructor (all subclasses inherit)
- [Phase 02-core-infrastructure]: CacheAdapter/CacheTtlConfig defined locally in cache.ts until types.ts is created by Plan 01
- [Phase 02-core-infrastructure]: TTL 0 means do-not-cache, djb2 hash for API key prefix (non-crypto, edge-compatible)
- [Phase 02]: Settled flag on queued entries prevents double-resolve/reject race conditions in rate limiter
- [Phase 02]: KeyProvider as object with getKey()/invalidate() -- race-safe key rotation via shared pending promise
- [Phase 02]: Cache check before middleware pipeline -- cached responses skip middleware for performance
- [Phase 03]: Loose ApiClient interface in discovery.ts avoids cross-package import issues
- [Phase 03]: Vitest config uses relative path ../../scripts/**/*.test.ts for script test discovery

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2]: Three-type 429 handling (app/method/service) is subtly documented — needs research-phase before planning
- [Phase 3]: Schema generation needs deliberate test data strategy (diverse account states: unranked, in series, multi-region) — not self-resolving
- [Phase 5]: Valorant has mixed routing (some platform, match-v1 regional); LoR is in maintenance mode — both need endpoint audit before implementation
- [CI]: Vitest 4 requires Node 20+ to run tests; library targets Node 18+ at runtime — CI must pin Node 22 LTS

## Session Continuity

Last session: 2026-03-17T18:40:54Z
Stopped at: Completed 03-01-PLAN.md
Resume file: .planning/phases/03-schema-generation/03-02-PLAN.md
