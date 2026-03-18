# Phase 5: TFT, Valorant, LoR, and Riftbound Endpoints - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Wrap the remaining 17 API groups across TFT (5), Valorant (6), LoR (active groups only after audit), and Riftbound (1), completing full Riot API coverage. Each endpoint method enforces correct routing type (Platform vs Regional) at compile time. Every public method has TSDoc with examples; every DTO field has JSDoc. Tree-shaking isolates each game's code.

</domain>

<decisions>
## Implementation Decisions

### Routing per game
- All games use Playwright audit on Riot API explorer to confirm routing per endpoint, then enforce at type level — same proven approach as Phase 4
- TFT: tft-match-v1 uses RegionalRoute; tft-league-v1, tft-summoner-v1, spectator-tft-v5, tft-status-v1 use PlatformRoute (verify via audit)
- Valorant: val-match-v1 uses RegionalRoute; val-content-v1, val-status-v1 use PlatformRoute; val-console-match-v1, val-console-ranked-v1, val-ranked-v1 routing TBD via audit
- LoR: All endpoints appear regional-routed (verify via audit)
- Riftbound: riftbound-content-v1 appears platform-routed (verify via audit)
- All 6 Valorant groups included (including console variants) — same approach as tournament endpoints in Phase 4

### LoR game status
- LoR is in maintenance mode — audit which endpoints are still active on the API explorer
- Only wrap active endpoints; exclude deactivated ones entirely (no stubs, no @deprecated)
- If fewer than 5 LoR groups are active, update roadmap and requirements to reflect actual counts
- Schema runner captured 2 LoR schemas (lor-ranked-v1, lor-status-v1) — audit may confirm this is the full active set

### Override types
- Start with generated types from `src/types/generated/{tft,val,lor,riftbound}.ts`
- Create override types in `src/types/overrides/` only when Playwright verification reveals generated types don't match actual API responses
- Each game's types are fully independent — no cross-game sharing even for similar shapes (TFT league vs LoL league)
- Override files follow Phase 4 naming: `tft-{group}.ts`, `val-{group}.ts`, etc.

### Module API shape (carried from Phase 4)
- Namespace objects: `export const tftMatchV1 = { getMatch(...), ... }`
- Route parameter per-call, stateless: `tftMatchV1.getMatch(client, 'americas', matchId)`
- One file per API group, co-located tests
- Unwrapped data returns (`Promise<T>`)
- 204 responses return `Promise<{ status: number }>`
- Method names from cleaned Riot operationIds
- Required path params positional, optional query params as trailing options object
- Removed/deactivated endpoints excluded entirely

### Plan batching
- 3 plans by game:
  1. TFT (5 groups) — all endpoint modules, index.ts, re-exports, route enforcement tests
  2. Valorant (6 groups) — all endpoint modules, index.ts, re-exports, route enforcement tests
  3. LoR + Riftbound combined (2-6 groups) — both games' modules, indexes, re-exports, tests
- Each plan is self-contained: creates the game directory, endpoint files, tests, and index with re-exports
- No separate final plan — each game plan includes its own index and route tests

### Claude's Discretion
- Internal implementation details of namespace objects
- Exact TSDoc example content for each method
- JSDoc field descriptions for generated types
- Options type structure for optional query parameters
- Test strategy details (mock patterns, assertion style)
- Order of endpoint implementation within each plan
- Whether to create override types for a given endpoint (based on Playwright audit findings)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Riot API (authoritative source for endpoints)
- `https://developer.riotgames.com/apis` — API explorer with all endpoint signatures, parameters, and response structures. Use Playwright to browse and verify. Source of truth for which endpoints exist, routing, and what they accept/return.
- `CLAUDE.md` — Riot API reference links, routing values, rate limiting guide

### Project specs
- `.planning/PROJECT.md` — Core value prop, zero-dep constraint, key decisions
- `.planning/REQUIREMENTS.md` — ENDP-02, ENDP-03, ENDP-04, ENDP-05 requirements for this phase
- `.planning/ROADMAP.md` — Phase 5 success criteria (5 criteria that must be TRUE)

### Prior phase context (established patterns to follow)
- `.planning/phases/04-lol-and-shared-endpoints/04-CONTEXT.md` — Module API shape, method naming, response shape, endpoint coverage decisions. **This is the primary pattern reference for Phase 5.**
- `.planning/phases/01-foundation/01-CONTEXT.md` — TypeScript config, export structure, routing type design
- `.planning/phases/02-core-infrastructure/02-CONTEXT.md` — HTTP client API, WhisperClient interface
- `.planning/phases/03-schema-generation/03-CONTEXT.md` — Type codegen rules (strip DTO suffix, string enums as literal unions, override replaces generated)

### Architecture (existing code to integrate with)
- `packages/whisper/src/core/client.ts` — `WhisperClient` interface and `createClient()` factory
- `packages/whisper/src/core/types.ts` — `ApiResponse`, `RequestContext`, `CacheTtlConfig`, `Middleware` types
- `packages/whisper/src/types/generated/tft.ts` — Auto-generated TFT types
- `packages/whisper/src/types/generated/val.ts` — Auto-generated Valorant types
- `packages/whisper/src/types/generated/lor.ts` — Auto-generated LoR types
- `packages/whisper/src/types/generated/riftbound.ts` — Auto-generated Riftbound types
- `packages/whisper/src/types/platform.ts` — `PlatformRoute` literal union type
- `packages/whisper/src/types/regional.ts` — `RegionalRoute` literal union type
- `packages/whisper/src/lol/` — Reference implementation: all 13 LoL endpoint modules following the established pattern

### Schema files
- `scripts/schemas/tft.*.schema.json` — TFT endpoint schemas (5 files)
- `scripts/schemas/val.*.schema.json` — Valorant endpoint schemas (6 files)
- `scripts/schemas/lor.*.schema.json` — LoR endpoint schemas (2 files)
- `scripts/schemas/riftbound.*.schema.json` — Riftbound endpoint schemas (1 file)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WhisperClient` interface with `request<T>(route, path, methodId, options?)` — all endpoint methods delegate to this
- `PlatformRoute` / `RegionalRoute` types — enforce correct routing per method at compile time
- Generated types in `src/types/generated/{tft,val,lor,riftbound}.ts` — ready for use as return types
- `encodeURIComponent()` on path parameters — established pattern from Phase 4
- Phase 4 LoL modules as reference implementation for namespace object pattern, TSDoc style, test patterns

### Established Patterns
- Namespace const object per API group: `export const apiGroupV1 = { async method(client, route, ...args) { ... } }`
- `client.request<T>(route, path, methodId, options?)` for HTTP calls
- `response.data` unwrapping for return values
- Co-located test files (`*.test.ts` next to source)
- NodeNext module resolution with explicit `.js` extensions in imports
- Override types in `src/types/overrides/` take precedence over generated
- `GetMatchIdsOptions`-style options interfaces for optional query params
- `expectTypeOf` for route enforcement type tests

### Integration Points
- `packages/whisper/src/tft/index.ts` — needs to be created, re-exports all TFT namespace objects + types
- `packages/whisper/src/val/index.ts` — needs to be created, re-exports all Val namespace objects + types
- `packages/whisper/src/lor/index.ts` — needs to be created, re-exports active LoR namespace objects + types
- `packages/whisper/src/riftbound/index.ts` — needs to be created, re-exports Riftbound namespace objects + types
- `package.json` subpath exports already configured for `./tft`, `./val`, `./lor`, `./riftbound`
- tsdown build config may need entry points added for new game directories

</code_context>

<specifics>
## Specific Ideas

- Follow Phase 4 LoL modules as the direct pattern reference — the established structure proved clean and correct
- Console Valorant endpoints (val-console-match-v1, val-console-ranked-v1) included for completeness, same philosophy as tournament endpoints
- LoR audit outcome may reduce the "31 total" API group count — update all references if so
- Each game plan should produce a fully working, independently testable game module

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-tft-valorant-lor-and-riftbound-endpoints*
*Context gathered: 2026-03-18*
