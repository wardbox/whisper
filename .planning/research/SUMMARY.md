# Project Research Summary

**Project:** Whisper — Zero-dependency TypeScript Riot Games API wrapper
**Domain:** TypeScript npm library (API wrapper)
**Researched:** 2026-03-17
**Confidence:** HIGH

## Executive Summary

Whisper is a zero-runtime-dependency TypeScript library that wraps all 31 Riot Games API endpoint groups. The research confirms that no existing TypeScript Riot wrapper satisfies all of the design goals simultaneously: the best-maintained competitor (fightmegg/riot-api) achieves proactive rate limiting but pulls in Bottleneck as a runtime dependency; others either miss games (LoL-only), use deprecated tooling, or target Node.js exclusively. The recommended approach is a layered architecture with a hardened core (HTTP client, proactive rate limiter, pluggable cache, middleware pipeline) built first, then game modules layered on top. The proactive rate limiter — reading `X-App-Rate-Limit` and `X-Method-Rate-Limit` headers from every response to maintain per-platform, per-method token buckets — is the single most complex component and the library's primary differentiator. It must be correct before any endpoint modules are written.

The recommended stack is modern and minimal: TypeScript 5.9.3, tsdown 0.21.4 (tsup's officially-designated successor), Vitest 4.1.0, and Biome 2.4.7 for lint and format. Zero runtime dependencies is non-negotiable; every infrastructure concern (rate limiting, caching, HTTP) must be built from native primitives. Documentation should use Fumadocs or Starlight (not VitePress) — both are actively maintained, provide excellent developer experience for library docs, and integrate cleanly with TypeDoc for auto-generated API reference tables. The user has explicitly stated this preference. Dual ESM + CJS output via tsdown is table stakes for 2025 npm publication.

The three most consequential risks are all design-level decisions that, if wrong, require breaking API changes to fix: (1) reactive-only rate limiting ships and all 31 endpoint modules inherit a broken foundation; (2) routing accepts `string` instead of typed `PlatformRoute | RegionalRoute` unions, making wrong-routing a silent runtime 404 instead of a compile error; (3) generated types mark conditionally-returned DTO fields as required, producing runtime crashes on edge cases. All three must be addressed in the core phase before endpoint modules exist. Getting the type system and rate limiter right upfront is dramatically cheaper than retrofitting them.

---

## Key Findings

### Recommended Stack

The build toolchain is fully settled: tsdown replaces tsup (officially deprecated), Vitest 4 replaces Jest (10-20x faster, native ESM), and Biome 2 replaces the ESLint + Prettier pair (single binary, 10-25x faster, type-aware as of v2.0). Native `fetch` is confirmed stable across all target runtimes (Node 18+, Deno, Bun, Cloudflare Workers, Vercel Edge) — no polyfill or HTTP library dep is needed. The npm package name `whisper` is taken (2013, unrelated project); publish as `@wardbox/whisper` or another controlled scope.

**Core technologies:**
- TypeScript 5.9.3: `--module node18` flag (stable since 5.8) purpose-built for this runtime target
- tsdown 0.21.4: tsup successor, Rolldown-backed, ships ESM + CJS + `.d.ts` in one pass, zero config
- Vitest 4.1.0: native ESM + TypeScript testing, no plugins; requires Node 20+ in CI
- Biome 2.4.7: replaces ESLint + Prettier, single config file, type-aware linting
- pnpm 9.x: faster installs, native monorepo support for potential workspace split
- Fumadocs or Starlight: user-preferred documentation framework (explicitly chosen over VitePress); integrates with TypeDoc for auto-generated API reference
- TypeDoc 0.28.17: converts TSDoc → Markdown for docs site integration
- `@arethetypeswrong/cli` + `publint`: validate dual package exports before publish

**Note on docs tooling:** The stack research recommended VitePress + TypeDoc. This synthesis overrides that recommendation per user preference — use Fumadocs or Starlight instead. Both support TypeDoc integration via `typedoc-plugin-markdown` and provide richer out-of-box developer experience for library documentation.

### Expected Features

Research confirms a comprehensive and differentiated v1 feature set. The library's competitive angle is: maximum type safety + proactive zero-dep rate limiting + runtime agnosticism — a combination no existing wrapper achieves.

**Must have (table stakes):**
- Full TypeScript types for all response shapes (auto-generated, not hand-written)
- All 31 API groups: LoL (13), TFT (5), Valorant (6), LoR (5), Riftbound (1), account-v1
- Rate limiting that prevents 429s (proactive queue, not reactive retry)
- Platform vs Regional routing enforced at compile time
- Async/await Promise API
- Typed error hierarchy (`RiotApiError`, `RateLimitError`, `NetworkError`)
- Config-driven initialization (API key as `string | () => Promise<string>`)
- ESM + CJS dual output with per-game subpath exports (`whisper/lol`, etc.)
- TSDoc on every public export; JSDoc on every DTO field
- Documentation site with auto-generated type tables

**Should have (competitive differentiators):**
- Proactive header-based rate limiting (parse `X-App-Rate-Limit`, `X-Method-Rate-Limit` on every response; per-platform, per-method token buckets; queue before 429)
- Routing type enforcement at the type level (compile error for wrong routing type — no other TypeScript wrapper does this)
- Zero runtime dependencies (rate limiter, cache, HTTP — all native primitives)
- Runtime agnosticism: Node 18+, Deno, Bun, edge runtimes
- Pluggable cache with opinionated per-method TTL defaults (summoner: 5min, match: 1hr, live game: 0)
- API key as async function for key rotation / secret manager integration
- Middleware/interceptor pipeline (pre-request, post-response, on-error hooks)
- Auto-generated types from live API responses (not OpenAPI schema alone)
- Tree-shakeable per-game imports (bundlers eliminate unused game code)
- Integration test suite that doubles as endpoint regression tests

**Defer (v2+):**
- Redis cache adapter as official optional package (`@whisper/cache-redis`)
- Configurable rate limiting strategy (reactive fallback option)
- DDragon utility package (`whisper/ddragon`)
- OpenTelemetry middleware package
- CLI tool for user-driven schema generation

**Explicit anti-features (do not build):**
- High-level game objects (Summoner.getMatches()) — creates maintenance nightmare
- Built-in Data Dragon / Community Dragon integration in core
- GraphQL layer
- WebSocket / fake real-time polling
- Global singleton client (breaks testing, key rotation)

### Architecture Approach

The architecture is a strict layered system: a core infrastructure layer (`src/core/`) contains all stateful components (HTTP client, rate limiter, cache, middleware pipeline, router), and game modules (`src/lol/`, `src/tft/`, etc.) depend on core but never on each other. Cross-game concerns (Account-V1) live in `src/riot/`. This isolation ensures tree-shaking works, inter-game coupling is impossible, and the rate limiter and cache are shared singletons across all endpoint calls. A separate `scripts/generate-schema/` pipeline (dev-time only) hits live endpoints with a real API key, writes `.schema.json` files, and generates TypeScript interfaces into `src/types/generated/` — these files are committed but never hand-edited.

**Major components:**
1. **HTTP Client** (`src/core/client.ts`) — thin `fetch` wrapper; injects `X-Riot-Token`, drives the middleware pipeline, passes raw headers to rate limiter
2. **Rate Limiter** (`src/core/rate-limiter.ts`) — two-level token buckets (app + method) per platform; initializes from first response; queues proactively; distinguishes three 429 types (`application`, `method`, `service`)
3. **Router** (`src/core/router.ts`) — maps `PlatformRoute` to base URL and parent `RegionalRoute`; pure functions; no side effects
4. **Cache Layer** (`src/core/cache.ts`) — `CacheAdapter` interface + `MemoryCache` default; per-method TTL config; cache key includes API key identity to survive key rotation
5. **Middleware Pipeline** (`src/core/middleware.ts`) — ordered array of `Middleware` functions; handles logging, metrics, retries, custom auth
6. **Type System** (`src/types/`) — `PlatformRoute` and `RegionalRoute` as distinct literal union types; `generated/` directory for schema-generated types; `overrides/` for hand-corrected optionality and enums
7. **Game Modules** (`src/lol/`, `src/tft/`, `src/val/`, `src/lor/`, `src/riftbound/`, `src/riot/`) — one file per API group; each enforces the correct routing type; sets method-level cache TTLs

**Key architectural patterns:**
- Proactive token-bucket rate limiter (not reactive retry)
- Branded literal types for routing (`PlatformRoute` vs `RegionalRoute`) enforced in every method signature
- `CacheAdapter` interface decouples storage backend from library code
- Subpath exports in `package.json` enable per-game tree shaking
- Build order is dictated by dependency graph: types → router → cache → rate limiter → middleware → HTTP client → game modules → schema generator → docs

### Critical Pitfalls

1. **Reactive-only rate limiting (retry on 429)** — parse `X-App-Rate-Limit`, `X-Method-Rate-Limit`, `X-App-Rate-Limit-Count`, `X-Method-Rate-Limit-Count` on every successful response; maintain token buckets; queue before limits hit. Still handle 429 defensively but treat it as a fallback, never the primary strategy.

2. **Conflating the three 429 types** — Riot issues 429s for application limits, method limits, and service overload. Each requires different recovery: application/method → use `Retry-After`, update matching bucket; service (no `X-Rate-Limit-Type` header) → exponential backoff, do not update buckets. A single `if (status === 429)` handler is always wrong.

3. **Routing type as bare `string`** — every API method must accept `PlatformRoute` XOR `RegionalRoute`, not a `string`. Match-V5, Account-V1, tournament, LoR, and RSO endpoints require regional routing; passing a platform value returns 404 silently. Make this a compile error before implementing any endpoints.

4. **Optional DTO fields marked required** — the riotapi-schema maintainer explicitly acknowledges optional-field lists are maintained via "quirks/hacks." Default generated types to `?` for any field not confirmed always-present. Maintain `src/types/overrides/` for known edge cases (`miniSeries`, `leagueName`, `totalGames`).

5. **Encrypted IDs across API key environments** — PUUIDs and summoner IDs are encrypted per-project key. Caching these across key rotations silently produces 404s. Cache keys must incorporate API key identity; rotation must invalidate the cache.

6. **Removed endpoints (June 2025)** — summonerName and summonerID/accountID endpoints were removed June 2025. Spectator-V5 was deactivated for LoL. Do not implement removed endpoints; build identity lookup around PUUID via Account-V1.

---

## Implications for Roadmap

Based on the architecture's explicit build-order dependency graph and the pitfall-to-phase mapping from research, the natural phase structure is:

### Phase 1: Project Foundation and Toolchain

**Rationale:** Nothing else can be built without the build system, type infrastructure, and core type definitions. Routing types must exist before any endpoint is implemented — retrofitting them is a breaking API change.
**Delivers:** Working build pipeline (tsdown), test runner (Vitest), lint/format (Biome), `PlatformRoute`/`RegionalRoute` branded types, error type hierarchy, router utility with `PLATFORM_TO_REGION` map, package scaffolding with correct `exports` field and `sideEffects: false`.
**Features addressed:** ESM + CJS dual output, subpath exports, routing type enforcement, published package structure.
**Pitfalls avoided:** String routing (address before any endpoint exists), monolithic client class (design per-game subpath structure now), ESM/CJS dual publish misconfiguration.
**Research flag:** Standard patterns — skip research-phase. Build toolchain and package export patterns are well-documented.

### Phase 2: Core Infrastructure (Rate Limiter, HTTP Client, Cache, Middleware)

**Rationale:** All 31 game modules depend on these components. The rate limiter is the highest-complexity, highest-risk component in the entire library. Getting it wrong means all downstream modules inherit a broken foundation. This phase is the highest-leverage phase in the project.
**Delivers:** Proactive token-bucket rate limiter (app + method buckets, all three 429 types handled, header-seeded from first response), HTTP client with middleware pipeline, `CacheAdapter` interface + `MemoryCache` default with per-method TTL config and key-identity cache invalidation, typed error hierarchy.
**Features addressed:** Proactive rate limiting, zero-dep HTTP, pluggable cache, middleware pipeline, API key as async function, typed errors.
**Pitfalls avoided:** Reactive 429 retry, hardcoded rate limit values, conflated 429 types, non-JSON error bodies, key leakage in logs, cache not invalidated on key rotation.
**Research flag:** Needs research-phase. The three-type 429 handling and concurrent bucket safety are subtle; verify community documentation and test cases against mock Riot API responses before implementation.

### Phase 3: Schema Generation Pipeline and Type Infrastructure

**Rationale:** Before wrapping any endpoints, generated types must exist. The schema pipeline is also the integration test harness — it validates that the HTTP client and rate limiter work correctly end-to-end with a real API key. Types flow from this phase into all game modules.
**Delivers:** Schema runner (`scripts/generate-schema/runner.ts`) that hits every endpoint and writes `.schema.json` files; codegen step that emits `src/types/generated/`; initial `src/types/overrides/` with known nullable field corrections; TypeDoc setup for inline field documentation.
**Features addressed:** Auto-generated types from live responses, integration test suite as regression harness, TSDoc + JSDoc on all generated types.
**Pitfalls avoided:** Hand-written types that go stale, required fields on optional DTOs, missing `miniSeries`/`leagueName` overrides.
**Research flag:** Needs research-phase. Schema generation across diverse account states (unranked, in series, multiple regions) requires deliberate test data strategy. Verify `riotapi-schema` as a reference and document known nullable fields before codegen design.

### Phase 4: LoL and Shared Endpoints

**Rationale:** LoL has the largest surface area (13 groups) and Account-V1 is shared by all games. Building LoL first proves the pattern for game modules; Account-V1 ships with it since PUUID lookups are needed by LoL endpoint integration tests.
**Delivers:** All 13 LoL API groups (`match-v5`, `summoner-v4`, `champion-mastery-v4`, `champion-v3`, `clash-v1`, `league-v4`, `spectator-v5`, `status-v4`, `challenges-v1`, `tournament-stub-v5`, `tournament-v5`, `item-sets-v1`) plus Account-V1 in `src/riot/`; per-group test files; `whisper/lol` and `whisper/riot` subpath exports.
**Features addressed:** 13/31 API groups, tree-shakeable imports, TSDoc on every method with examples.
**Pitfalls avoided:** Removed summonerID/accountID/summonerName endpoints (use PUUID via Account-V1 only), spectator-v5 deactivation awareness, wrong routing type for match-v5 (regional, not platform).
**Research flag:** Standard patterns — match-v5 and league-v4 are the most complex; use Riot API reference and riotapi-schema for DTO shapes.

### Phase 5: TFT, Valorant, LoR, and Riftbound Endpoints

**Rationale:** Pattern is proven from Phase 4. Remaining games follow the same structure. TFT (5 groups) and Valorant (6 groups) have the most activity after LoL; LoR (5 groups) and Riftbound (1 group) are smaller.
**Delivers:** All remaining API groups (17 groups across TFT, Val, LoR, Riftbound); `whisper/tft`, `whisper/val`, `whisper/lor`, `whisper/riftbound` subpath exports; per-group test files; complete 31/31 endpoint coverage.
**Features addressed:** Full multi-game coverage, tree-shakeable per-game imports.
**Pitfalls avoided:** Valorant match-v1 uses regional routing (not platform); verify routing types for each game's endpoints against the Riot API reference.
**Research flag:** Needs research-phase for Valorant routing quirks. Val has mixed routing (some endpoints platform, match-v1 regional). LoR endpoint availability should be verified — game is in maintenance mode.

### Phase 6: Documentation Site

**Rationale:** All types, TSDoc, and public exports are stable. The docs site can be built from source without risk of drift.
**Delivers:** Fumadocs or Starlight-based documentation site with TypeDoc integration; auto-generated API reference tables from compiled `.d.ts` files; quickstart guide; routing explanation (platform vs regional with `platformToRegion` utility); per-game usage examples; `docs/` as a pnpm workspace.
**Features addressed:** Documentation site with auto-generated type tables, TSDoc/JSDoc surfaced in IDE and docs.
**Pitfalls avoided:** Docs with no server-only API key warning (must be explicit on every key-adjacent surface).
**Research flag:** Standard patterns — Fumadocs and Starlight both have TypeDoc integration paths. Verify TypeDoc plugin compatibility (typedoc-plugin-markdown) before setup.

### Phase 7: Hardening, Validation, and Publish

**Rationale:** Pre-publish validation catches package export misconfiguration, tree-shaking failures, and runtime compatibility issues before users hit them.
**Delivers:** `@arethetypeswrong/cli` and `publint` integration in CI; bundle analysis confirming per-game subpath isolation; CI matrix testing Node CJS, Node ESM, Deno, and Bun; package published to npm as `@wardbox/whisper`.
**Features addressed:** Runtime agnosticism validation, ESM/CJS correctness, tree-shaking correctness.
**Pitfalls avoided:** CJS/ESM export misconfiguration, `sideEffects` incorrectly set, game module subpaths leaking into each other's bundles.
**Research flag:** Standard patterns — `@arethetypeswrong/cli` and `publint` have well-documented usage.

### Phase Ordering Rationale

- **Phases 1-2 must be sequential and complete before anything else.** The type system and core infrastructure are load-bearing. Implementing endpoints before the rate limiter is correct means testing all endpoints against a broken foundation.
- **Phase 3 (schema generation) precedes endpoint phases** because generated types are consumed by endpoint implementations. Writing endpoint types by hand is explicitly an anti-pattern.
- **Phases 4-5 can be parallelized** once Phase 3 delivers the schema pipeline. In practice, sequential is safer: Phase 4 proves the per-game module pattern before scaling to 18 more groups.
- **Phase 6 (docs) is deferred until API surface is stable.** Docs built too early drift as the API surface changes.
- **Phase 7 (hardening) is last** because validation tools need the full package to analyze.

### Research Flags

Phases that need `/gsd:research-phase` during planning:
- **Phase 2 (Core infrastructure):** Three-type 429 handling, concurrent bucket safety, service-level 429 behavior — subtle and sparsely documented; verify test strategy before implementation
- **Phase 3 (Schema generation):** Test data strategy for diverse account states; nullable field inventory; codegen architecture choices
- **Phase 5 (TFT/Val/LoR/Riftbound):** Valorant mixed routing (platform vs regional per endpoint); LoR game maintenance mode endpoint availability

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Build toolchain, package exports — well-documented 2025 patterns
- **Phase 4 (LoL + shared):** LoL is the best-documented Riot game; endpoint shapes available via riotapi-schema
- **Phase 6 (Docs):** Fumadocs/Starlight + TypeDoc integration is straightforward
- **Phase 7 (Hardening):** `@arethetypeswrong/cli` and `publint` have clear usage documentation

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry; tsup deprecation confirmed in official README; native fetch baseline verified across all target runtimes |
| Features | HIGH (core), MEDIUM (differentiators) | Table stakes verified against 5 live competitors; differentiator claims based on competitor gap analysis — accurate as of research date but ecosystem may shift |
| Architecture | HIGH | Patterns derived from multiple live implementations (fightmegg, twisted, TeemoJS); rate limiter state machine verified against official Riot rate limit documentation |
| Pitfalls | HIGH (rate limiting, routing, IDs), MEDIUM (LoR/TFT quirks) | Rate limiting and routing pitfalls backed by official docs and community reference implementations; TFT/LoR-specific edge cases less documented |

**Overall confidence:** HIGH

### Gaps to Address

- **Fumadocs vs Starlight selection:** User preference is one of these two, but the specific choice between them should be made during the documentation phase. Both are viable; the decision can hinge on MDX support needs, component library preferences, or existing familiarity. Evaluate when Phase 6 begins.

- **LoR game status:** Legends of Runeterra is in maintenance mode. Verify which LoR endpoints remain active before investing in Phase 5 LoR coverage. If endpoints are fully deactivated, LoR may be reduced to stubs.

- **Spectator-V5 deactivation scope:** Research confirmed Spectator-V5 was deactivated for LoL (per official announcement). Verify current status across TFT and other games before implementing spectator endpoints.

- **Schema generation test data strategy:** Generating accurate nullable-field coverage requires diverse test accounts (unranked, in promotion series, multiple regions, no match history). This needs deliberate setup before Phase 3 begins — not a gap that resolves itself.

- **Vitest 4 requires Node 20+ in CI:** The library targets Node 18+ at runtime, but Vitest 4 requires Node 20+ to run tests. CI must pin to Node 20 or 22 LTS. This is a known constraint, not a problem, but must be explicit in setup.

- **tsdown pre-1.0 stability:** tsdown is at 0.21.4. API is stable but minor breaking changes are possible across minor versions. Pin exact version in `package.json` devDependencies and update deliberately.

---

## Sources

### Primary (HIGH confidence)
- [Riot Developer Portal — Rate Limiting](https://developer.riotgames.com/docs/portal#web-apis_rate-limiting) — rate limit headers, 429 types, Retry-After behavior
- [npm registry](https://registry.npmjs.org/) — verified versions: tsdown 0.21.4, vitest 4.1.0, typescript 5.9.3, biome 2.4.7
- [tsup GitHub README](https://github.com/egoist/tsup) — deprecation notice pointing to tsdown
- [MingweiSamuel/riotapi-schema issues](https://github.com/MingweiSamuel/riotapi-schema/issues/7) — schema maintainer's statement on optional field accuracy
- [Riot DevRel — Summoner endpoint removal](https://x.com/RiotGamesDevRel/status/1932188110454235582) — official June 2025 endpoint removal
- [Riot DevRel — Spectator-V5 deactivation](https://x.com/RiotGamesDevRel/status/1979263978787246391) — official LoL spectator deactivation
- [typedoc-plugin-markdown VitePress quickstart](https://typedoc-plugin-markdown.org/plugins/vitepress/quick-start) — TypeDoc integration pattern (applicable to Fumadocs/Starlight via same plugin)

### Secondary (MEDIUM confidence)
- [fightmegg/riot-api GitHub](https://github.com/fightmegg/riot-api) — competitor feature reference; proactive rate limiting via Bottleneck
- [fightmegg/riot-rate-limiter wiki](https://github.com/fightmegg/riot-rate-limiter/wiki/429-Reponses) — 429 type handling reference
- [hextechdocs.dev/rate-limiting](https://hextechdocs.dev/rate-limiting/) — community rate limit guide
- [DarkIntaqt — Platform vs Regional routing](https://darkintaqt.com/blog/routing) — complete routing value reference
- [Riot API Libraries index](https://riot-api-libraries.readthedocs.io/en/latest/) — ecosystem survey, IDs documentation, specifics
- [Liran Tal — TypeScript ESM/CJS in 2025](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) — dual publish patterns
- [Vitest 4.0 release notes](https://vitest.dev/blog/vitest-4) — Node 20 requirement, browser mode
- [TypeScript 5.8 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/) — `--module node18` stable

### Tertiary (LOW confidence)
- [Biome vs ESLint 2025 — Better Stack](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/) — adoption trends (community analysis)
- [pnpm adoption 2025](https://dev.to/hamzakhan/npm-vs-yarn-vs-pnpm-which-package-manager-should-you-use-in-2025-2f1g) — community adoption survey

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*
