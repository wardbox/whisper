# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Whisper is a TypeScript library wrapping every Riot Games API endpoint. Zero dependencies beyond native `fetch`. Published as `@wardbox/whisper` on npm. pnpm workspace with library + docs as separate packages.

## Riot API Reference

- Developer portal & docs: https://developer.riotgames.com/docs/portal
- API explorer (all endpoints): https://developer.riotgames.com/apis
- Rate limiting guide: https://developer.riotgames.com/docs/portal#web-apis_rate-limiting
- Routing values: https://developer.riotgames.com/docs/portal#web-apis_routing-values
- Community schema (reference, not dependency): https://github.com/MingweiSamuel/riotapi-schema

## Design Philosophy

These goals inform every decision — from stack choices to API surface design:

- **Use the latest and greatest**: Pick what people actually use in 2025+. Modern tooling, modern patterns. Research before choosing.
- **Keep it light**: Zero runtime deps. Small bundle. No bloat. Every byte earns its place.
- **Configurable and raw, but magic where it makes sense**: Expose the full power of the Riot API without abstracting it away. But where users would otherwise need to understand Riot's internal quirks (rate limit headers, routing logic, retry timing), do the right thing automatically.
- **Save users from shooting themselves in the foot**: Wrong routing type? Type error. Forgetting rate limits? Handled. Stale cache on live game data? Default TTL of zero. Make the pit of success wide.
- **Everything is tested**: Every endpoint, every core behavior, every edge case. The schema generator doubles as an integration test suite. If it's not tested, it's not done.

## Stack

- **Build**: tsdown — dual ESM+CJS output, `sideEffects: false`
- **Lint/Format**: Biome
- **Test**: Vitest on Node 22 LTS
- **CI checks**: `@arethetypeswrong/cli` and `publint` for package correctness
- **Package manager**: pnpm (workspace: library + docs)

## Build & Dev Commands

```bash
pnpm install          # install deps
pnpm build            # build (tsdown, dual ESM+CJS)
pnpm test             # run all tests (vitest)
pnpm vitest run src/lol/match-v5.test.ts   # single test file
pnpm vitest run -t "rate limiter"          # tests matching pattern
pnpm check            # lint + format check (biome)
pnpm check --fix      # auto-fix
pnpm generate-schema  # generate types from Riot API (requires RIOT_API_KEY)
cd docs && pnpm dev   # docs dev server
```

## Architecture

### Routing model — two types, enforced at the type level

- **Platform** routes (na1, euw1, kr, etc.) — most endpoints
- **Regional** routes (americas, europe, asia, sea) — match-v5, account-v1, tournament, LoR, RSO

Every API method is typed to accept only the correct routing type. Don't mix them. The type system should make invalid routing impossible.

### Core (`src/core/`)

HTTP client, rate limiter, cache, and middleware pipeline. The rate limiter parses `X-App-Rate-Limit`, `X-Method-Rate-Limit`, `X-Rate-Limit-Count` headers and queues requests proactively — it does NOT just retry on 429. This is a key "magic where it makes sense" area: users get smart rate limiting without thinking about it, but can configure or override the strategy.

### Game modules (`src/lol/`, `src/tft/`, `src/val/`, `src/lor/`, `src/riftbound/`)

Each game has its own directory with one file per API group. Tree-shakeable — users import per game (`import { MatchV5 } from '@wardbox/whisper/lol'`).

### Shared (`src/riot/`)

Account-v1 and other endpoints shared across games.

### Types (`src/types/`)

- `src/types/generated/` — auto-generated from schema files, do not hand-edit
- `src/types/overrides/` — hand-written types for unions, enums, and cases where inference fails
- Hand-written types for regions, platforms, queues live at the top level of `src/types/`

### Schema generation (`scripts/generate-schema/`)

Integration tests hit every endpoint with a real API key, capture response shapes into `.schema.json` files, then generate TypeScript interfaces. This is both the type source AND the endpoint regression suite — if Riot changes a response shape, the schema diff catches it.

### Docs (`docs/`)

Docs site with auto-generated type tables from source and inline type info in code blocks.

## Key Conventions

- Cache is per-method configurable with TTLs (summoner = long, match = short, live game = none). Default in-memory, pluggable via adapter interface.
- Client accepts API key as string or async function (for key rotation).
- Middleware/interceptor pattern for logging, metrics, retries, custom auth — raw and configurable, but sane defaults out of the box.
- Every public export must have TSDoc with examples. Fields on types get JSDoc so IDE tooltips are useful without opening docs.
- All 31 API groups must be covered: LoL (13), TFT (5), Valorant (6), LoR (5), Riftbound (1), plus account-v1.
- Runtime agnostic: native `fetch` only. Must work in Node 18+, Deno, Bun, edge runtimes.
- Tree-shakeable per-game imports: `@wardbox/whisper/lol`, `@wardbox/whisper/tft`, etc.
- Zero entries in `dependencies` field — all runtime deps forbidden.
