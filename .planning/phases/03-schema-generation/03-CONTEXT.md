# Phase 3: Schema Generation - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Live-API schema runner that hits every active Riot endpoint, captures response shapes as `.schema.json` files, generates TypeScript interfaces into `src/types/generated/`, and detects schema drift via committed file diffs. The runner doubles as an integration test harness — if Riot changes a response shape, the schema diff catches it.

</domain>

<decisions>
## Implementation Decisions

### Test data strategy
- Dynamic discovery — use high-level endpoints (league entries, featured games, leaderboards) to find accounts in specific states at runtime
- No hardcoded PUUIDs — accounts decay over time, dynamic discovery is more resilient
- One platform region (e.g., na1) + one regional route (americas) — schema shapes don't vary by region, minimize API calls and rate limit pressure

### Schema file organization
- Files live in `scripts/schemas/` — schemas are build artifacts, not source code
- One file per API group: `lol.summoner-v4.schema.json`, `lol.match-v5.schema.json`, `riot.account-v1.schema.json`
- Response shapes only — field names, types, nullability. No endpoint metadata.
- Committed to git — diffs visible in PRs, CI regenerates and fails if output differs from committed

### Type codegen rules
- Strip DTO/Dto suffix from Riot names: `SummonerDTO` → `Summoner`, `MatchDto` → `Match`
- Prefix with game when ambiguous: `LolMatch`, `TftMatch`
- Optional fields use `field?: Type` syntax (leveraging `exactOptionalPropertyTypes` from Phase 1)
- String enums as literal unions: `type Tier = 'IRON' | 'BRONZE' | ...` — consistent with routing types
- Override replaces generated — if `src/types/overrides/` has a type, skip it during generation. Override file is source of truth.

### Diff detection & CI
- Git diff after regeneration: CI runs `pnpm generate-schema`, then `git diff --exit-code scripts/schemas/`
- On schema drift: CI fails AND opens an automated PR with updated schemas for developer review
- `pnpm generate-schema` is a single command: hit API → write .schema.json → generate TypeScript types
- On-demand only — developer runs manually when adding endpoints or investigating drift. CI verifies, doesn't discover. Requires `RIOT_API_KEY` env var.

### HTTP layer
- Schema runner dog-foods Whisper's own HTTP client + rate limiter from Phase 2
- Validates the client works against real API as a side benefit
- Gets free rate limiting, error handling, and retry logic

### Claude's Discretion
- Live-state endpoint handling (spectator, clash) — pick approach that best fits: skip with stub, best-effort with fallback, or community schema reference
- Dynamic discovery implementation details (which endpoints to query, fallback chains)
- Schema JSON structure (how fields, types, and nullability are encoded)
- Type generation template/approach (AST, string interpolation, etc.)
- Auto-PR mechanism for schema drift (GitHub Actions workflow specifics)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value prop, zero-dep constraint, key decisions
- `.planning/REQUIREMENTS.md` — SCHEMA-01, SCHEMA-02, SCHEMA-03 requirements
- `.planning/ROADMAP.md` — Phase 3 success criteria (3 criteria that must be TRUE)

### Riot API
- `CLAUDE.md` — Riot API reference links, API explorer URL (all endpoints), rate limiting guide, routing values
- Community schema reference: `https://github.com/MingweiSamuel/riotapi-schema` — reference for response shapes, NOT a dependency

### Prior phase context
- `.planning/phases/01-foundation/01-CONTEXT.md` — TypeScript config (ES2022, exactOptionalPropertyTypes, NodeNext), export structure, routing type design
- `.planning/phases/02-core-infrastructure/02-CONTEXT.md` — HTTP client API, rate limiter behavior, error class hierarchy, `buildUrl()` utility

### Architecture
- `packages/whisper/src/core/client.ts` — `createClient()` factory the schema runner will use
- `packages/whisper/src/core/http.ts` — `buildUrl()` and HTTP primitives
- `packages/whisper/src/types/` — Existing routing types; `generated/` and `overrides/` subdirs to be populated

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createClient()` from `@wardbox/whisper` — schema runner will instantiate this with RIOT_API_KEY
- `buildUrl()` from core/http.ts — constructs `https://{route}.api.riotgames.com{path}` URLs
- `RateLimiter` from core/rate-limiter.ts — proactive rate limiting, handles all three 429 types
- `MemoryCache` from core/cache.ts — in-memory cache with TTL support
- PlatformRoute/RegionalRoute types from types/ — typed routing for API calls

### Established Patterns
- String literal unions for categorical types (routing, will extend to enums)
- NodeNext module resolution with explicit .js extensions
- ES2022 target, strict TypeScript with exactOptionalPropertyTypes
- Dual ESM+CJS build via tsdown
- Options object pattern for constructors (RiotApiError, createClient)

### Integration Points
- `scripts/` directory — schema runner script lives here alongside `scripts/schemas/` output
- `src/types/generated/` — generated TypeScript interfaces written here
- `src/types/overrides/` — hand-written types that take precedence over generated
- `package.json` — `pnpm generate-schema` script entry to be added
- CI pipeline — schema verification step + auto-PR on drift

</code_context>

<specifics>
## Specific Ideas

- Schema runner as integration test suite — hitting real API validates both the library client AND captures type shapes
- Dog-fooding validates Phase 2's client against real Riot API before endpoint modules are built
- Dynamic discovery means the schema runner is self-sufficient — no maintenance of test account lists

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-schema-generation*
*Context gathered: 2026-03-17*
