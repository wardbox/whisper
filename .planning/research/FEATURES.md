# Feature Research

**Domain:** Riot Games API TypeScript wrapper library
**Researched:** 2026-03-17
**Confidence:** HIGH (core features), MEDIUM (differentiators), LOW (edge cases)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features every Riot API wrapper must have. Missing any of these means developers
reach for a competitor immediately.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full TypeScript types for all response shapes | Modern TS ecosystem expectation; raw `any` is unusable for serious projects | HIGH | Types must be auto-generated from schema to stay current; hand-written types rot immediately when Riot changes a DTO |
| Coverage of all Riot API endpoint groups | Users switch wrappers when they hit a missing endpoint; LoL-only is no longer sufficient in 2025 with TFT, Val, LoR, Riftbound all live | HIGH | 31 API groups: LoL (13), TFT (5), Val (6), LoR (5), Riftbound (1), account-v1 — all required for v1 |
| Rate limiting that prevents 429 errors | Without this, every user ships code that gets their key temporarily banned on production; it is the most common first complaint | HIGH | Naive retry-on-429 is table stakes minimum; proactive header-based queuing is a differentiator |
| Multi-region / routing support | Riot's two-tier routing model (Platform + Regional) is confusing enough that every wrapper must abstract it; failing here means users hit `404 Not Found` or wrong-region errors silently | MEDIUM | Platform routes: na1, euw1, kr, etc. Regional routes: americas, europe, asia, sea — they are not interchangeable |
| Async/await Promise API | Every serious Node.js/TS project uses async/await; callbacks or observable-only APIs feel archaic | LOW | Native `fetch` returns Promises; this is the natural API surface |
| Error handling with meaningful errors | Raw HTTP errors without context (which endpoint? which region? which rate limit type?) make debugging miserable | MEDIUM | At minimum: expose status code, endpoint, and `X-Rate-Limit-Type` header in errors |
| Config-driven initialization | Users need to pass API key, optionally set region defaults, configure retry behavior — not hard-coded internals | LOW | Initialization via config object is the universal pattern across all wrappers surveyed |
| Published on npm with ESM and CJS outputs | The entire JS ecosystem expects this; ESM-only breaks CJS consumers; CJS-only breaks tree-shaking | MEDIUM | Use tsup for dual output; set `sideEffects: false` in package.json |
| Documentation with usage examples | Without docs, users can't evaluate the library or onboard without reading source | MEDIUM | At minimum: README with quick-start, method signatures with TSDoc, inline examples |

### Differentiators (Competitive Advantage)

Features that separate Whisper from the field. Cassiopeia-style high-abstraction
wrappers and thin pass-through wrappers both exist — Whisper's angle is maximum
type safety + proactive rate limiting + zero runtime deps + runtime agnosticism.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Proactive rate limiting (header-parse + queue before 429) | Almost no existing wrapper does this well; most retry on 429 or use naive counters. fightmegg/riot-rate-limiter uses Bottleneck (external dep) for spread-based limiting, which is the best in the JS ecosystem but adds weight. Proactive queuing from parsed `X-App-Rate-Limit` / `X-Method-Rate-Limit` headers without external dependencies is genuinely novel | HIGH | Parse both app-level and method-level headers; maintain per-region, per-method token buckets; queue requests proactively rather than sleeping on 429. This is the hardest thing to get right and the highest-leverage differentiator |
| Routing enforced at the type-system level | Every wrapper documents "use regional routing for match-v5" but none enforce it at compile time. Passing a Platform route to a Regional endpoint silently returns the wrong data or a 404. A TypeScript type error at the callsite is dramatically better than a runtime failure | MEDIUM | Overloaded signatures or branded types (`Platform` vs `Regional`) that make invalid routing a compile error, not a runtime surprise |
| Zero runtime dependencies | axios, bottleneck, p-limit, debug, node-cache — every dep is a supply chain risk, a version conflict surface, and a bundle size cost. fightmegg/riot-api has 4+ runtime deps. TeemoJS achieved ~300 lines with minimal deps. Whisper at zero is a clean statement | HIGH | Rate limiter, cache, HTTP — all must be built from scratch using native primitives only |
| Runtime agnosticism (Node 18+, Deno, Bun, edge) | Existing wrappers universally target Node.js. Cloudflare Workers, Vercel Edge, and Deno/Bun usage of Riot APIs is a real and growing use case (Next.js API routes, edge middleware for stat overlays, etc.). Being the only wrapper that works in these environments is a strong differentiator | MEDIUM | Use only `fetch`, `Headers`, `Response` from the Web Platform API. No `Buffer`, no `http` module, no `process.env` in library code. Test explicitly against Deno and Bun |
| Pluggable cache with sane per-method TTL defaults | All wrappers either cache nothing or cache everything the same way. The correct behavior is: summoner data (long TTL), match history (medium TTL), live game data (zero TTL). fightmegg allows per-method TTL config but requires Redis or in-memory adapter wiring. Whisper should ship with an opinionated in-memory default and a clean adapter interface | MEDIUM | Adapter interface: `{ get(key): Promise<T \| null>, set(key, value, ttl): Promise<void>, del(key): Promise<void> }`. Ship one in-memory adapter; let users swap Redis, file, KV store |
| API key as async function (key rotation) | Production apps often rotate keys or fetch them from secrets managers. Accepting `() => Promise<string>` alongside a plain string lets Whisper fit into any secret management pattern. No existing TypeScript wrapper surveyed supports this | LOW | Guard against rotating mid-rate-limit-window |
| Middleware/interceptor pipeline | Logging, metrics, retries, custom auth headers, request tracing — these needs are universal but highly varied. A clean pipeline (pre-request, post-response, on-error hooks) lets users add cross-cutting concerns without forking the library | MEDIUM | Cassiopeia tried full framework integration (Champion.gg, patch data) and became too heavy. Middleware keeps Whisper light while remaining extensible |
| Auto-generated types from live API responses | MingweiSamuel/riotapi-schema is the closest existing resource (daily auto-generation from official docs), but it's OpenAPI-based and requires a separate code-gen step. Whisper's schema pipeline hits every endpoint with a real key, captures actual response shapes, and generates types from real data — catching Riot API quirks (undocumented fields, nullable vs optional mismatches) that OpenAPI schemas miss | HIGH | This is a dual-purpose system: types AND regression tests. Any Riot API change surfaces as a schema diff in CI |
| Tree-shakeable per-game imports | Users building a TFT-only bot don't want LoL, Val, LoR code in their bundle. Per-game subpath exports (`whisper/lol`, `whisper/tft`, etc.) let bundlers eliminate unused games. No existing JS wrapper surveyed supports this cleanly | LOW | Subpath exports in `package.json`: `"./lol": "./dist/lol/index.js"`, etc. Each game module is independently importable |
| TSDoc on every export + JSDoc on type fields | Industry-standard TS libraries (Zod, tRPC, Hono) document every public export with examples. Users spend most time in their IDE, not the docs site. Good TSDoc means good autocomplete tooltips | MEDIUM | Required for every public method, every DTO field. Field-level JSDoc explains Riot API semantics (e.g. what `participantId` means in match-v5 vs spectator-v5) |
| Documentation site with auto-generated type tables | A docs site generated from source (not hand-written) stays current without maintenance overhead. Type tables from TSDoc let users browse DTOs without opening GitHub | MEDIUM | VitePress or similar static site; auto-extract type tables from compiled `.d.ts` files |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| High-level game objects (Summoner.getMatches(), Champion.spells) | Cassiopeia does this and users initially love it; hides raw API complexity | Creates deep coupling between library and Riot's data model. When Riot changes a DTO (which happens every season), every method that builds on it must be updated. Makes the library a framework, not a wrapper. Versioning becomes a nightmare. Cassiopeia explicitly notes it's "much more complicated" as a result | Return raw API response shapes. Let users build domain objects in their own code. TSDoc + good type names make raw DTOs readable |
| Built-in Data Dragon / Community Dragon integration | Users ask "can I get champion images?" and assume the wrapper handles this | DDragon is versioned per patch, has its own CDN URLs and update cadence, and is a static asset delivery system — entirely different from the live API. Mixing them into one client creates a maintenance burden (patch tracking) and scope creep. Some wrappers (galeforce, fightmegg) include DDragon; neither handles patch tracking well | Provide `ddragon` as a separate optional package (`whisper/ddragon`) or simply document the CDN URL pattern. Do not bundle DDragon into the core client |
| GraphQL layer on top of REST | Some users want to compose multiple API calls into a single query | Riot's API is REST; a GraphQL layer requires N+1 query resolution, adds a schema maintenance surface, and couples the wrapper to a query language most Riot API consumers don't need | Out of scope per PROJECT.md. If users want GraphQL, they build it on top of Whisper |
| WebSocket / real-time subscriptions | "Notify me when a match ends" is a common feature request | Riot's public API is entirely REST — there is no streaming endpoint. Implementing fake real-time via polling is scope creep that adds complexity without an official API foundation | Polling utilities are the right approach, and they belong in user code, not the library |
| Damage calculators, tier lists, champion win rates | Game-logic features users want when building apps | This is application logic that depends on Riot's constantly-changing game balance. Maintaining it would require patching the library every patch. Out of scope | Application-layer concerns; Whisper provides the data, users provide the logic |
| Opinionated retry strategies with exponential backoff | Sounds safe; many wrappers implement this | Riot's rate limiting is header-driven with explicit `Retry-After` values. Exponential backoff ignores the `Retry-After` signal and can cause cascading 429s when multiple requests are in flight. The correct behavior is: parse `Retry-After`, wait exactly that long, then resume queued requests | Proactive header-based rate limiting eliminates the need for retry backoff in the common case. Service-rate-limit 429s (which lack `Retry-After`) should have a single configurable fixed delay, not exponential |
| Global singleton client | Convenient for scripts; common pattern in older wrappers | Makes testing impossible without module-level mocking. Multiple API keys (for key rotation or multi-tenant apps) become impossible. Forces a single rate-limit bucket for the entire process | Explicit client instances with constructor injection. Tests create a fresh client. Multiple clients can coexist |

---

## Feature Dependencies

```
[Proactive Rate Limiter]
    └──requires──> [HTTP Client Core]
    └──requires──> [Header Parsing (X-App-Rate-Limit, X-Method-Rate-Limit)]
    └──enhances──> [Middleware Pipeline] (rate limiter hooks into request pipeline)

[Per-Method Cache TTLs]
    └──requires──> [Pluggable Cache Adapter Interface]
    └──requires──> [HTTP Client Core]

[Tree-Shakeable Per-Game Imports]
    └──requires──> [ESM + CJS Dual Build]
    └──requires──> [Subpath Exports in package.json]

[Auto-Generated Types]
    └──requires──> [Schema Generation Pipeline]
    └──requires──> [Live API Key for Integration Tests]
    └──enhances──> [TSDoc Coverage] (generated types provide base; hand-written TSDoc adds context)

[Routing Type Enforcement]
    └──requires──> [Branded Types or Discriminated Unions for Platform vs Regional]
    └──enhances──> [Auto-Generated Types] (routing types flow through all method signatures)

[Middleware Pipeline]
    └──requires──> [HTTP Client Core]
    └──enhances──> [Proactive Rate Limiter] (limiter is a built-in middleware)
    └──enhances──> [Cache] (cache is a built-in middleware)

[API Key as Async Function]
    └──requires──> [HTTP Client Core]
    └──conflicts with──> [Global Singleton Client] (singleton makes key rotation awkward)

[Documentation Site]
    └──requires──> [TSDoc on All Exports]
    └──requires──> [Published npm Package] (for auto-extraction of types)
```

### Dependency Notes

- **Proactive rate limiter requires header parsing:** The limiter cannot function without reading `X-App-Rate-Limit`, `X-Method-Rate-Limit`, and `X-Rate-Limit-Count` from every response. The HTTP client must pass raw headers to the limiter.
- **Tree shaking requires dual build:** Pure ESM enables tree shaking; CJS output is required for Node.js consumers who haven't migrated to ESM. Both must ship.
- **Schema generation requires a live API key:** The integration test suite hits real endpoints. This means schema generation is a dev/CI concern, not a user concern — users consume the generated types, not the generator.
- **Routing enforcement requires careful type design first:** Getting Platform vs Regional types right early prevents a major breaking change later. This must be designed before implementing any endpoint methods.
- **Cache requires adapter interface before any concrete implementation:** Build the interface first so the in-memory implementation is validated against it; Redis adapters written by users will be validated the same way.

---

## MVP Definition

### Launch With (v1)

- [ ] HTTP client with native `fetch` — runtime agnostic, zero deps
- [ ] Proactive rate limiter: parse `X-App-Rate-Limit`, `X-Method-Rate-Limit`, `X-Rate-Limit-Count`; per-region, per-method token buckets; queue before 429, not after
- [ ] Platform vs Regional routing enforced at the type level (compile error for wrong routing type)
- [ ] All 31 API groups covered with full method implementations
- [ ] Auto-generated TypeScript types from live API responses via schema pipeline
- [ ] Pluggable cache with in-memory default and per-method TTL config
- [ ] Middleware/interceptor pipeline (pre-request, post-response, on-error)
- [ ] API key accepts string or `() => Promise<string>`
- [ ] ESM + CJS dual output with subpath exports per game (`whisper/lol`, etc.)
- [ ] TSDoc on every public method with examples; JSDoc on every DTO field
- [ ] Documentation site with auto-generated type tables
- [ ] Integration test suite that doubles as endpoint regression tests

### Add After Validation (v1.x)

- [ ] Redis cache adapter as an official optional package (`@whisper/cache-redis`) — users ask for it immediately once in-memory isn't enough; build after validating the adapter interface is sound
- [ ] Configurable rate limiting strategy (reactive fallback option) — some users want explicit 429-retry instead of proactive queuing for debugging purposes; add when requested
- [ ] CLI tool for schema generation / type updates — currently a dev script; promote to installable tool when third-party users want to run their own schema captures

### Future Consideration (v2+)

- [ ] Separate DDragon utility package (`whisper/ddragon`) — clean separation of static asset access from live API; defer until core is stable and community validates the need
- [ ] OpenTelemetry middleware as official optional package — enterprise users want structured tracing; address after initial traction confirms the audience
- [ ] Browser-safe subpackage (no API key exposure) — only makes sense for Community Dragon / DDragon static data; defer until DDragon package exists

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| All 31 endpoint groups | HIGH | HIGH | P1 |
| TypeScript types (all DTOs) | HIGH | HIGH | P1 |
| Proactive rate limiter | HIGH | HIGH | P1 |
| Platform vs Regional type enforcement | HIGH | MEDIUM | P1 |
| Runtime agnosticism (Node/Deno/Bun/edge) | HIGH | MEDIUM | P1 |
| Zero runtime dependencies | HIGH | HIGH | P1 |
| Per-method cache TTLs | HIGH | MEDIUM | P1 |
| ESM + CJS dual build with subpath exports | HIGH | LOW | P1 |
| TSDoc + JSDoc coverage | MEDIUM | MEDIUM | P1 |
| API key as async function | MEDIUM | LOW | P1 |
| Middleware/interceptor pipeline | MEDIUM | MEDIUM | P1 |
| Auto-generated schema + integration tests | HIGH | HIGH | P1 |
| Documentation site | MEDIUM | MEDIUM | P1 |
| Redis cache adapter | MEDIUM | LOW | P2 |
| Configurable rate limit strategy (reactive option) | LOW | LOW | P2 |
| CLI schema generation tool | LOW | MEDIUM | P2 |
| DDragon utility package | MEDIUM | MEDIUM | P3 |
| OpenTelemetry middleware package | LOW | MEDIUM | P3 |

---

## Competitor Feature Analysis

| Feature | fightmegg/riot-api | galeforce | shieldbow | cassiopeia (Python) | Whisper |
|---------|-------------------|-----------|-----------|---------------------|---------|
| Full TypeScript types | Yes | Yes | Yes | N/A (Python) | Yes (auto-generated) |
| All Riot games covered | Yes | Yes | LoL + TFT only | LoL only | Yes (all 31 groups) |
| Rate limiting approach | Proactive (spread) via Bottleneck dep | Reactive (retry 429) | Unclear | Proactive | Proactive, zero-dep |
| Caching | Yes (local + Redis) | Yes (local + Redis) | Yes (pre-fetch) | Yes, configurable | Yes (in-memory default, adapter interface) |
| Per-method cache TTLs | Yes (configurable) | Not specified | Not specified | Yes | Yes (with sane defaults) |
| Zero runtime dependencies | No (Bottleneck, debug, etc.) | No (multiple deps) | No (axios) | No | Yes |
| Runtime agnosticism | Node.js only | Node.js only | Node 16+ | CPython only | Node 18+, Deno, Bun, edge |
| Routing type enforcement | Helper method only | Runtime check | Not specified | Not specified | Compile-time type error |
| API key rotation | No | No | No | No | Yes (async function) |
| Middleware pipeline | No | No | Custom HTTP client | No | Yes |
| Tree-shakeable per-game | No | No | No | N/A | Yes |
| Auto-generated types | No | No | No | No | Yes (from live responses) |
| Active maintenance (2025) | Yes (4mo ago) | Unclear (2022) | No (2023) | Unclear | In development |

---

## Sources

- [riot-api-libraries documentation](https://riot-api-libraries.readthedocs.io/en/latest/libraries.html) — canonical list of Riot API wrapper libraries across all languages
- [fightmegg/riot-api GitHub](https://github.com/fightmegg/riot-api) — most actively maintained TypeScript wrapper; reference for feature set
- [fightmegg/riot-rate-limiter GitHub](https://github.com/fightmegg/riot-rate-limiter) — proactive spread-based rate limiter; uses Bottleneck (external dep)
- [b-cho/galeforce GitHub](https://github.com/b-cho/galeforce) — fluent interface design; full multi-game coverage; YAML config; Redis caching
- [TheDrone7/shieldbow GitHub](https://github.com/TheDrone7/shieldbow) — LoL/TFT TypeScript wrapper; last released June 2023; uses axios
- [meraki-analytics/cassiopeia GitHub](https://github.com/meraki-analytics/cassiopeia) — Python; high-abstraction framework design; demonstrates what over-abstraction costs
- [pseudonym117/Riot-Watcher GitHub](https://github.com/pseudonym117/Riot-Watcher) — Python; thin wrapper; multithreaded rate limiting is known weakness
- [MingweiSamuel/TeemoJS GitHub](https://github.com/MingweiSamuel/TeemoJS) — ~300 line JS wrapper; minimal-dep philosophy; bucket-based rate limiter
- [MingweiSamuel/riotapi-schema GitHub](https://github.com/MingweiSamuel/riotapi-schema) — auto-generated OpenAPI schema from Riot docs; reference for schema generation approach
- [hextechdocs.dev/rate-limiting](https://hextechdocs.dev/rate-limiting/) — community documentation of Riot rate limit headers and best practices
- [Riot Developer Portal — Rate Limiting](https://developer.riotgames.com/docs/portal#web-apis_rate-limiting) — official rate limit documentation; defines X-App-Rate-Limit, X-Method-Rate-Limit, X-Rate-Limit-Count, Retry-After headers
- [cassiopeia vs riotwatcher issue #277](https://github.com/meraki-analytics/cassiopeia/issues/277) — primary source for abstraction philosophy tradeoffs

---

*Feature research for: Riot Games API TypeScript wrapper library*
*Researched: 2026-03-17*
