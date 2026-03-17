# Whisper

## What This Is

Whisper is a TypeScript library that wraps every Riot Games API endpoint with zero runtime dependencies beyond native `fetch`. It targets npm publication via pnpm, providing type-safe access to all 31 API groups across LoL, TFT, Valorant, LoR, and Riftbound. Built for both app developers (bots, dashboards, websites) and data analysts (stats, match history, bulk pulls).

## Core Value

Every Riot API endpoint is accessible through a typed, tree-shakeable interface with smart rate limiting that prevents users from hitting 429s — without requiring them to understand Riot's rate limit internals.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Type-safe wrappers for all 31 Riot API groups (LoL 13, TFT 5, Val 6, LoR 5, Riftbound 1, account-v1)
- [ ] Routing model enforced at the type level (Platform vs Regional — invalid routing = type error)
- [ ] Proactive rate limiter that parses `X-App-Rate-Limit`, `X-Method-Rate-Limit`, `X-Rate-Limit-Count` headers and queues before hitting limits
- [ ] Configurable rate limiting strategy (proactive default, reactive option)
- [ ] Pluggable cache with in-memory default and adapter interface (Redis, file, custom)
- [ ] Per-method cache TTL configuration (summoner = long, match = short, live game = none)
- [ ] Middleware/interceptor pipeline for logging, metrics, retries, custom auth
- [ ] Client accepts API key as string or async function (key rotation)
- [ ] Tree-shakeable per-game imports (`import { MatchV5 } from 'whisper/lol'`)
- [ ] Runtime agnostic — native `fetch` only, works on Node 18+, Deno, Bun, edge runtimes
- [ ] Schema generation from live API responses (`.schema.json` → TypeScript interfaces)
- [ ] Integration test suite that doubles as endpoint regression tests
- [ ] TSDoc on every public export with examples; JSDoc on type fields
- [ ] Documentation site with auto-generated type tables and inline type info
- [ ] Zero runtime dependencies

### Out of Scope

- Mobile SDKs — TypeScript/JS library only
- GraphQL layer — expose the REST API as-is
- Game-specific business logic (damage calculators, tier lists) — this is a data access library
- Websocket/real-time subscriptions — Riot API is REST-only

## Context

- Riot API has two routing types: Platform (na1, euw1, kr) for most endpoints, Regional (americas, europe, asia, sea) for match-v5, account-v1, tournament, LoR, RSO
- Rate limiting is header-based with app-level and method-level limits — most existing wrappers just retry on 429 instead of proactively queuing
- Community schema reference exists at github.com/MingweiSamuel/riotapi-schema but is not a dependency
- Package name `whisper` — availability on npm registry to be verified during research
- Package manager is pnpm

## Constraints

- **Dependencies**: Zero runtime deps — native `fetch` only
- **Runtime**: Must work on Node 18+, Deno, Bun, Hono, edge runtimes
- **Stack**: Use the latest and greatest 2025+ tooling — research before choosing
- **Bundle**: Small bundle size, tree-shakeable per-game modules
- **Testing**: Every endpoint, every core behavior, every edge case must be tested

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Native `fetch` as HTTP primitive | Universal runtime support — needs research validation | — Pending |
| pnpm as package manager | User preference, modern, fast | — Pending |
| Proactive rate limiting by default | Key differentiator — prevents 429s automatically | — Pending |
| Pluggable cache with in-memory default | Flexibility for different deployment contexts | — Pending |
| All 31 API groups in v1 | Complete coverage is the value prop | — Pending |
| Docs site ships with v1 | Library + docs together for launch | — Pending |

---
*Last updated: 2026-03-17 after initialization*
