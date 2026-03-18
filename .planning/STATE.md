---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Phase 5 context gathered
last_updated: "2026-03-18T15:49:13.770Z"
last_activity: 2026-03-17 — Completed index re-exports, JSDoc, and route enforcement (04-05)
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 13
  completed_plans: 13
  percent: 92
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-17)

**Core value:** Every Riot API endpoint accessible through a typed, tree-shakeable interface with proactive rate limiting that prevents 429s without requiring users to understand Riot's internals.
**Current focus:** Phase 4 — LoL and Shared Endpoints

## Current Position

Phase: 4 of 7 (LoL and Shared Endpoints) -- COMPLETE
Plan: 5 of 5 complete in current phase
Status: Phase complete
Last activity: 2026-03-17 — Completed index re-exports, JSDoc, and route enforcement (04-05)

Progress: [██████████] 92%

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
| Phase 03 P02 | 5min | 2 tasks | 8 files |
| Phase 04 P01 | 3min | 2 tasks | 8 files |
| Phase 04 P02 | 3min | 2 tasks | 10 files |
| Phase 04 P04 | 4min | 2 tasks | 8 files |
| Phase 04 P03 | 4min | 2 tasks | 9 files |
| Phase 04 P05 | 5min | 2 tasks | 6 files |

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
- [Phase 03]: KNOWN_ENUMS uses conservative field-name matching; fileURLToPath for tsx compat
- [Phase 04]: FeaturedGameInfo separate from LolCurrentGameInfo -- simpler participant shape for featured games
- [Phase 04]: lol-rso-match-v1 imports GetMatchIdsOptions from match-v5 to avoid type duplication
- [Phase 04]: updateTournamentCode returns { status: number } wrapping 204 response for consistent API
- [Phase 04]: createTournamentCode passes tournamentId as query param per Riot API convention
- [Phase 04]: Created ClashPlayer override type for clash-v1 getPlayersByPuuid -- generated PlayerInfo is for challenges, not clash
- [Phase 04]: Used expectTypeOf for route enforcement tests -- runtime-safe alternative to @ts-expect-error with declare const
- [Phase 04]: lol/index.ts re-exports namespace objects + generated types + override types + options types for complete public API surface

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2]: Three-type 429 handling (app/method/service) is subtly documented — needs research-phase before planning
- [Phase 3]: Schema generation needs deliberate test data strategy (diverse account states: unranked, in series, multi-region) — not self-resolving
- [Phase 5]: Valorant has mixed routing (some platform, match-v1 regional); LoR is in maintenance mode — both need endpoint audit before implementation
- [CI]: Vitest 4 requires Node 20+ to run tests; library targets Node 18+ at runtime — CI must pin Node 22 LTS

## Session Continuity

Last session: 2026-03-18T15:49:13.767Z
Stopped at: Phase 5 context gathered
Resume file: .planning/phases/05-tft-valorant-lor-and-riftbound-endpoints/05-CONTEXT.md
