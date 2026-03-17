# Roadmap: Whisper

## Overview

Whisper ships as a zero-runtime-dependency TypeScript library covering all 31 Riot Games API groups with a proactive rate limiter, pluggable cache, and type-enforced routing. The build order is dictated by a strict dependency graph: toolchain and types first, then core infrastructure (the highest-complexity phase), then schema generation, then game endpoint modules layered on top, then docs, then pre-publish hardening. Nothing is built before its foundation exists.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Toolchain, workspace, routing types, and package scaffolding
- [ ] **Phase 2: Core Infrastructure** - Proactive rate limiter, HTTP client, cache, and middleware pipeline
- [ ] **Phase 3: Schema Generation** - Live-API schema runner, type codegen, and integration test harness
- [ ] **Phase 4: LoL and Shared Endpoints** - All 13 LoL API groups plus Account-V1
- [ ] **Phase 5: TFT, Valorant, LoR, and Riftbound Endpoints** - Remaining 17 API groups, 31/31 total
- [ ] **Phase 6: Documentation Site** - Fumadocs or Starlight docs site with auto-generated type tables
- [ ] **Phase 7: Hardening and Publish** - CI validation across all runtimes and npm publish

## Phase Details

### Phase 1: Foundation
**Goal**: A developer can clone the repo, install deps, and run build, test, and lint commands against a correctly-scaffolded pnpm workspace with typed routing primitives already in place.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, TYPE-01, TYPE-02, TYPE-03, TYPE-04
**Success Criteria** (what must be TRUE):
  1. `pnpm build` produces dual ESM and CJS output with correct subpath exports and `sideEffects: false`
  2. `pnpm test` runs successfully on Node 22 LTS with zero failures
  3. `pnpm check` reports no lint or format violations
  4. Assigning a platform route value to a regional route parameter (or vice versa) produces a TypeScript compile error
  5. The library package has zero entries in its `dependencies` field (all runtime deps forbidden)
**Plans:** 2 plans
Plans:
- [x] 01-01-PLAN.md — Workspace scaffolding, build toolchain, CI pipeline
- [x] 01-02-PLAN.md — Routing types (PlatformRoute, RegionalRoute, toRegional) and type safety tests

### Phase 2: Core Infrastructure
**Goal**: A developer can instantiate a client with an API key (string or async function), make a request, and have rate limits handled proactively — no 429s under normal usage, and all three 429 types handled correctly when limits are exceeded.
**Depends on**: Phase 1
**Requirements**: HTTP-01, HTTP-02, HTTP-03, HTTP-04, RATE-01, RATE-02, RATE-03, CACHE-01, CACHE-02, CACHE-03, CACHE-04
**Success Criteria** (what must be TRUE):
  1. A client initialized with `apiKey: () => Promise<string>` rotates keys correctly without leaking prior-key cache entries
  2. App-level, method-level, and service-level 429 responses each trigger distinct recovery behavior (Retry-After for app/method, exponential backoff for service)
  3. Requests are queued before token buckets empty — no request hits the API after the limit is reached
  4. A custom cache adapter implementing `get/set/delete` replaces the default in-memory cache with no other code changes
  5. A middleware function registered in the pipeline receives pre-request and post-response hooks for every outgoing call
**Plans:** 1/4 plans executed
Plans:
- [ ] 02-01-PLAN.md — Core types, error class hierarchy, and middleware pipeline
- [ ] 02-02-PLAN.md — Cache subsystem (MemoryCache, TTL resolution, API-key-aware keys)
- [ ] 02-03-PLAN.md — Proactive rate limiter with multi-window token buckets
- [ ] 02-04-PLAN.md — HTTP client, createClient factory, and subpath exports

### Phase 3: Schema Generation
**Goal**: Running the schema generator against a live Riot API key produces `.schema.json` files for every active endpoint, from which TypeScript interfaces are auto-generated into `src/types/generated/` — and any future Riot API response shape change is caught as a schema diff.
**Depends on**: Phase 2
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03
**Success Criteria** (what must be TRUE):
  1. Running `pnpm generate-schema` with a valid API key writes one `.schema.json` per endpoint group
  2. Generated TypeScript interfaces in `src/types/generated/` compile without errors and match live API response shapes
  3. Modifying a `.schema.json` field causes `pnpm generate-schema` to surface a diff that would block CI
**Plans**: TBD

### Phase 4: LoL and Shared Endpoints
**Goal**: A developer can import any of the 13 LoL API groups from `@wardbox/whisper/lol` and Account-V1 from `@wardbox/whisper/riot`, call any active endpoint with the correct routing type, and receive a fully-typed response with IDE-visible documentation.
**Depends on**: Phase 3
**Requirements**: ENDP-01, ENDP-06, ENDP-07, ENDP-08, DOC-01, DOC-02
**Success Criteria** (what must be TRUE):
  1. All 13 LoL API groups are importable from `@wardbox/whisper/lol` with tree-shaking intact
  2. Account-V1 is importable from `@wardbox/whisper/riot` and correctly uses regional routing
  3. Passing a platform route to a regional-only method (e.g., `match-v5`) is a TypeScript compile error
  4. Every public method has TSDoc with a usage example visible in IDE hover; every DTO field has a JSDoc tooltip
  5. Removed and deactivated endpoints (summonerName/ID lookups, spectator-v5 for LoL) are absent from the public API
**Plans**: TBD

### Phase 5: TFT, Valorant, LoR, and Riftbound Endpoints
**Goal**: A developer can import any of the remaining game modules and call any active endpoint, completing 31/31 API group coverage across all Riot games — with tree-shaking still isolating each game's code.
**Depends on**: Phase 4
**Requirements**: ENDP-02, ENDP-03, ENDP-04, ENDP-05
**Success Criteria** (what must be TRUE):
  1. All 5 TFT API groups are importable from `@wardbox/whisper/tft` with correct routing types
  2. All 6 Valorant API groups are importable from `@wardbox/whisper/val`; val/match-v1 requires regional routing and attempting platform routing is a compile error
  3. All active LoR API groups are importable from `@wardbox/whisper/lor` (inactive endpoints excluded after game-status audit)
  4. Riftbound's 1 API group is importable from `@wardbox/whisper/riftbound`
  5. Importing only `@wardbox/whisper/tft` in a bundler produces no LoL or Valorant code in the output
**Plans**: TBD

### Phase 6: Documentation Site
**Goal**: A developer new to Whisper can read the documentation site, understand the platform/regional routing distinction, and make a working API call within a few minutes of landing on the site.
**Depends on**: Phase 5
**Requirements**: DOC-03, DOC-04
**Success Criteria** (what must be TRUE):
  1. The docs site builds and serves from the `docs/` pnpm workspace package in isolation — no changes to the library package required
  2. Every public type's fields are rendered in auto-generated tables derived from compiled TypeScript, not maintained by hand
  3. The quickstart guide shows a complete working example from installation to first API call
  4. The routing page explains platform vs regional routing with concrete examples of when each applies
**Plans**: TBD

### Phase 7: Hardening and Publish
**Goal**: The package passes all pre-publish validation checks, is verified to work across all target runtimes, and is published to npm as `@wardbox/whisper`.
**Depends on**: Phase 6
**Requirements**: (none — delivery phase; all requirements mapped to Phases 1-6)
**Success Criteria** (what must be TRUE):
  1. `@arethetypeswrong/cli` reports no type resolution issues for ESM or CJS consumers
  2. `publint` reports no package export misconfiguration
  3. CI runs the test suite successfully on Node 22 LTS (both ESM and CJS), Deno, and Bun
  4. The published `@wardbox/whisper` package is installable in a fresh project and a basic import works
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-17 |
| 2. Core Infrastructure | 1/4 | In Progress|  |
| 3. Schema Generation | 0/TBD | Not started | - |
| 4. LoL and Shared Endpoints | 0/TBD | Not started | - |
| 5. TFT, Valorant, LoR, and Riftbound Endpoints | 0/TBD | Not started | - |
| 6. Documentation Site | 0/TBD | Not started | - |
| 7. Hardening and Publish | 0/TBD | Not started | - |
