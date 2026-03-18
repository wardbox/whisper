# Phase 4: LoL and Shared Endpoints - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Wrap all 13 LoL API groups as typed namespace objects importable from `@wardbox/whisper/lol`, plus Account-V1 from `@wardbox/whisper/riot`. Each endpoint method enforces correct routing type (Platform vs Regional) at compile time. Every public method has TSDoc with examples; every DTO field has JSDoc. Removed/deactivated endpoints are excluded entirely.

</domain>

<decisions>
## Implementation Decisions

### Module API shape
- Namespace objects — one const object per API group: `export const summonerV4 = { getByPuuid(...), ... }`
- Exported from `@wardbox/whisper/lol` via index.ts re-exports
- Account-V1 exported from `@wardbox/whisper/riot`
- Route parameter passed per-call (stateless, no binding ceremony): `summonerV4.getByPuuid(client, 'na1', puuid)`
- One file per API group: `src/lol/summoner-v4.ts`, `src/lol/match-v5.ts`, etc.
- Co-located tests: `summoner-v4.test.ts` next to `summoner-v4.ts` (matches core/ pattern)

### Method naming & signatures
- Method names follow cleaned Riot operationIds: `getByPuuid`, `getMatchIdsByPuuid`, `getLeagueEntries`
- Required path parameters as positional args after route: `summonerV4.getByPuuid(client, route, puuid)`
- Optional query parameters as trailing options object: `matchV5.getMatchIdsByPuuid(client, route, puuid, { start, count, queue })`
- Route type enforced per method — `summonerV4` methods accept `PlatformRoute`, `matchV5` methods accept `RegionalRoute`. Wrong route type = compile error.

### Response shape
- Endpoint methods return unwrapped data: `summonerV4.getByPuuid()` returns `Promise<Summoner>`, not `ApiResponse<Summoner>`
- Advanced users who need headers/status use `client.request()` directly
- Endpoints with no response body (204) return `Promise<{ status: number }>` — caller can confirm success

### Endpoint coverage
- All 13 LoL API groups implemented, regardless of access level (tournament endpoints work for users with tournament keys)
- Account-V1 implemented in `src/riot/account-v1.ts` with RegionalRoute
- Removed endpoints excluded entirely — no `@deprecated` stubs:
  - summoner-v4.getBySummonerName (removed June 2025)
  - summoner-v4.getBySummonerId (removed June 2025)
  - spectator-v4 (replaced by spectator-v5)
- Endpoints with stub/empty schemas: hand-write types from Riot API explorer docs, place in `src/types/overrides/`
- Use Playwright to browse https://developer.riotgames.com/apis for authoritative endpoint details and response structures

### Claude's Discretion
- Internal implementation of namespace objects (plain object literal vs function-based construction)
- Exact TSDoc example content for each method
- JSDoc field descriptions for generated types (derive from Riot docs where available)
- How to structure the options type for optional query parameters (shared base type or per-method)
- Test strategy details (mock patterns, assertion style)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Riot API (authoritative source for endpoints)
- `https://developer.riotgames.com/apis` — API explorer with all endpoint signatures, parameters, and response structures. Use Playwright to browse and verify. This is the source of truth for which endpoints exist and what they accept/return.
- `CLAUDE.md` — Riot API reference links, routing values, rate limiting guide

### Project specs
- `.planning/PROJECT.md` — Core value prop, zero-dep constraint, key decisions
- `.planning/REQUIREMENTS.md` — ENDP-01, ENDP-06, ENDP-07, ENDP-08, DOC-01, DOC-02 requirements
- `.planning/ROADMAP.md` — Phase 4 success criteria (5 criteria that must be TRUE)

### Prior phase context
- `.planning/phases/01-foundation/01-CONTEXT.md` — TypeScript config, export structure, routing type design
- `.planning/phases/02-core-infrastructure/02-CONTEXT.md` — HTTP client API, WhisperClient interface, middleware pipeline
- `.planning/phases/03-schema-generation/03-CONTEXT.md` — Type codegen rules (strip DTO suffix, string enums as literal unions, override replaces generated)

### Architecture (existing code to integrate with)
- `packages/whisper/src/core/client.ts` — `WhisperClient` interface and `createClient()` factory
- `packages/whisper/src/core/types.ts` — `ApiResponse`, `RequestContext`, `CacheTtlConfig`, `Middleware` types
- `packages/whisper/src/types/generated/lol.ts` — Auto-generated LoL types from schema runner
- `packages/whisper/src/types/generated/riot.ts` — Auto-generated Account type
- `packages/whisper/src/types/overrides/` — Hand-written type overrides (takes precedence)
- `packages/whisper/src/types/platform.ts` — `PlatformRoute` literal union type
- `packages/whisper/src/types/regional.ts` — `RegionalRoute` literal union type
- `scripts/schemas/lol.*.schema.json` — Schema files for each LoL API group

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WhisperClient` interface with `request<T>(route, path, methodId, options?)` — endpoint methods will delegate to this
- `PlatformRoute` / `RegionalRoute` types — enforce correct routing per method at compile time
- Generated types in `src/types/generated/lol.ts` — `Summoner`, `Match`, `LeagueEntry`, etc. already generated by Phase 3
- `Account` type in `src/types/generated/riot.ts` — ready for Account-V1 endpoint
- `buildUrl()` from core/http.ts — constructs API URLs from route + path

### Established Patterns
- Options object pattern for configuration (used in `createClient`, `RiotApiError`)
- Co-located test files (`*.test.ts` next to source) throughout `src/core/`
- NodeNext module resolution with explicit `.js` extensions in imports
- String literal unions for categorical types (routing types, will extend to queue types etc.)
- `src/types/overrides/` takes precedence over `src/types/generated/` for hand-written types

### Integration Points
- `src/lol/index.ts` — currently a placeholder, will re-export all 13 namespace objects
- `src/riot/index.ts` — currently a placeholder, will re-export Account-V1
- `package.json` subpath exports — `@wardbox/whisper/lol` and `@wardbox/whisper/riot` already configured
- Schema files inform which types exist; endpoint methods reference these types as return values

</code_context>

<specifics>
## Specific Ideas

- Use Playwright to browse the Riot API explorer (https://developer.riotgames.com/apis) to verify endpoint details, parameters, and response structures — especially for endpoints where schema generation captured incomplete data
- The 13 LoL groups with their routing types:
  - Platform: champion-mastery-v4, champion-v3, clash-v1, league-v4, lol-challenges-v1, lol-status-v4, spectator-v5, summoner-v4, league-exp-v4
  - Regional: match-v5, lol-rso-match-v1, tournament-v5, tournament-stub-v5

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-lol-and-shared-endpoints*
*Context gathered: 2026-03-17*
