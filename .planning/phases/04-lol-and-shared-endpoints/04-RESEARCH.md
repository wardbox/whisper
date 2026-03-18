# Phase 4: LoL and Shared Endpoints - Research

**Researched:** 2026-03-17
**Domain:** Riot API endpoint wrapping (LoL 13 groups + Account-V1), TypeScript namespace pattern, TSDoc
**Confidence:** HIGH

## Summary

Phase 4 wraps all 13 LoL API groups and Account-V1 as typed namespace objects. The core infrastructure (client, rate limiter, cache, middleware) is complete from Phase 2, and generated types exist from Phase 3. The primary work is creating 14 endpoint module files (13 LoL + 1 riot), each exporting a const namespace object whose methods delegate to `client.request<T>()` with correct path templates, route type constraints, and return types.

Key complexity lies in: (1) the 4 API groups without live schema data (tournament-v5, tournament-stub-v5, lol-rso-match-v1, league-exp-v4) which need stub schemas and hand-written override types, (2) tournament endpoints that use POST with request bodies unlike all other LoL endpoints which are GET-only, and (3) the volume of TSDoc/JSDoc documentation required across ~60+ methods and dozens of DTO interfaces.

**Primary recommendation:** Implement in waves -- first the 9 groups with existing schemas and simple GET endpoints, then the 4 groups needing stubs/overrides, then tournament POST endpoints, then TSDoc/JSDoc across all files.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Namespace objects -- one const object per API group: `export const summonerV4 = { getByPuuid(...), ... }`
- Exported from `@wardbox/whisper/lol` via index.ts re-exports
- Account-V1 exported from `@wardbox/whisper/riot`
- Route parameter passed per-call (stateless, no binding ceremony): `summonerV4.getByPuuid(client, 'na1', puuid)`
- One file per API group: `src/lol/summoner-v4.ts`, `src/lol/match-v5.ts`, etc.
- Co-located tests: `summoner-v4.test.ts` next to `summoner-v4.ts`
- Method names follow cleaned Riot operationIds: `getByPuuid`, `getMatchIdsByPuuid`, `getLeagueEntries`
- Required path parameters as positional args after route: `summonerV4.getByPuuid(client, route, puuid)`
- Optional query parameters as trailing options object: `matchV5.getMatchIdsByPuuid(client, route, puuid, { start, count, queue })`
- Route type enforced per method -- `summonerV4` methods accept `PlatformRoute`, `matchV5` methods accept `RegionalRoute`. Wrong route type = compile error.
- Endpoint methods return unwrapped data: `summonerV4.getByPuuid()` returns `Promise<Summoner>`, not `ApiResponse<Summoner>`
- Advanced users who need headers/status use `client.request()` directly
- Endpoints with no response body (204) return `Promise<{ status: number }>`
- All 13 LoL API groups implemented, regardless of access level
- Account-V1 implemented in `src/riot/account-v1.ts` with RegionalRoute
- Removed endpoints excluded entirely -- no `@deprecated` stubs
- Endpoints with stub/empty schemas: hand-write types from Riot API explorer docs, place in `src/types/overrides/`
- Use Playwright to browse https://developer.riotgames.com/apis for authoritative endpoint details

### Claude's Discretion
- Internal implementation of namespace objects (plain object literal vs function-based construction)
- Exact TSDoc example content for each method
- JSDoc field descriptions for generated types (derive from Riot docs where available)
- How to structure the options type for optional query parameters (shared base type or per-method)
- Test strategy details (mock patterns, assertion style)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENDP-01 | LoL -- all 13 API groups wrapped and typed | Registry has 11 hittable groups; 2 additional (tournament-v5, tournament-stub-v5) need stub schemas. lol-rso-match-v1 also needs stubs. All 13 groups confirmed on Riot API explorer. |
| ENDP-06 | Account-V1 (shared) wrapped and typed | Schema exists (`riot.account-v1.schema.json`), `Account` type generated. 3 endpoints: getByPuuid, getByRiotId, getByGame. All use RegionalRoute. |
| ENDP-07 | Tree-shakeable per-game imports (`whisper/lol`, `whisper/tft`, etc.) | Package.json exports already configured for `./lol` and `./riot` subpaths. `src/lol/index.ts` and `src/riot/index.ts` are placeholders ready to fill. |
| ENDP-08 | Endpoint availability audit per game (exclude removed/deactivated endpoints) | summoner-v4.getBySummonerName and getBySummonerId confirmed removed. spectator-v4 replaced by spectator-v5. Registry already excludes these. summoner-v4.getByMe is RSO-only (exclude). |
| DOC-01 | TSDoc on every public export with usage examples | Every namespace object method and every exported type needs TSDoc. ~60+ methods across 14 modules. |
| DOC-02 | JSDoc on type fields for IDE tooltip support | Generated types in `src/types/generated/lol.ts` (541 lines, ~17 interfaces) need JSDoc on fields. Override types also need JSDoc. |
</phase_requirements>

## Standard Stack

No new libraries needed. Phase 4 uses the existing project stack exclusively.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | (project version) | Type-safe endpoint wrappers | Core language |
| Vitest | (project version) | Co-located unit tests | Established in Phase 1 |
| Biome | (project version) | Lint/format | Established in Phase 1 |

### Supporting (may need for stubs)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Playwright | (project version) | Browse Riot API explorer for stub DTO definitions | When hand-writing types for tournament-v5, tournament-stub-v5, lol-rso-match-v1 |

## Architecture Patterns

### Recommended Project Structure
```
packages/whisper/src/
  lol/
    index.ts                    # Re-exports all 13 namespace objects + types
    champion-mastery-v4.ts      # Namespace object + method implementations
    champion-mastery-v4.test.ts # Co-located tests
    champion-v3.ts
    champion-v3.test.ts
    clash-v1.ts
    clash-v1.test.ts
    league-v4.ts
    league-v4.test.ts
    league-exp-v4.ts
    league-exp-v4.test.ts
    lol-challenges-v1.ts
    lol-challenges-v1.test.ts
    lol-status-v4.ts
    lol-status-v4.test.ts
    match-v5.ts
    match-v5.test.ts
    lol-rso-match-v1.ts
    lol-rso-match-v1.test.ts
    spectator-v5.ts
    spectator-v5.test.ts
    summoner-v4.ts
    summoner-v4.test.ts
    tournament-v5.ts
    tournament-v5.test.ts
    tournament-stub-v5.ts
    tournament-stub-v5.test.ts
  riot/
    index.ts                    # Re-exports accountV1 namespace
    account-v1.ts               # Account-V1 namespace object
    account-v1.test.ts
  types/
    generated/
      lol.ts                    # Auto-generated (Phase 3) -- add JSDoc
      riot.ts                   # Auto-generated (Phase 3) -- add JSDoc
    overrides/
      lol-tournament.ts         # Hand-written tournament DTOs
      lol-rso-match.ts          # Hand-written RSO match DTOs (if needed, or reuse match-v5 types)
      riot-account.ts           # Hand-written ActiveShard type (getByGame returns this, not in schema)
```

### Pattern 1: Endpoint Namespace Object
**What:** Each API group is a const object with methods that delegate to `client.request<T>()`
**When to use:** Every API group module
**Example:**
```typescript
// src/lol/summoner-v4.ts
import type { WhisperClient } from '../core/client.js';
import type { PlatformRoute } from '../types/platform.js';
import type { LolSummoner } from '../types/generated/lol.js';

/**
 * League of Legends Summoner API (v4).
 *
 * Access summoner data by PUUID or account ID.
 *
 * @example
 * ```typescript
 * import { summonerV4 } from '@wardbox/whisper/lol';
 *
 * const summoner = await summonerV4.getByPuuid(client, 'na1', puuid);
 * console.log(summoner.summonerLevel);
 * ```
 */
export const summonerV4 = {
  /**
   * Get a summoner by PUUID.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @returns Summoner profile data
   *
   * @example
   * ```typescript
   * const summoner = await summonerV4.getByPuuid(client, 'na1', 'abc-123');
   * ```
   */
  async getByPuuid(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<LolSummoner> {
    const response = await client.request<LolSummoner>(
      route,
      `/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      'summoner-v4.getByPuuid',
    );
    return response.data;
  },
} as const;
```

### Pattern 2: Methods with Query Parameters
**What:** Optional query parameters collected in a trailing options object
**When to use:** match-v5.getMatchIdsByPuuid, league-v4.getEntries, etc.
**Example:**
```typescript
// Options interface per method or shared
interface GetMatchIdsOptions {
  /** Number of match IDs to return (default 20, max 100) */
  start?: number;
  /** Start index (default 0) */
  count?: number;
  /** Filter by queue type */
  queue?: number;
  /** Filter by match type */
  type?: string;
  /** Epoch timestamp in seconds -- filter matches after this time */
  startTime?: number;
  /** Epoch timestamp in seconds -- filter matches before this time */
  endTime?: number;
}

async getMatchIdsByPuuid(
  client: WhisperClient,
  route: RegionalRoute,
  puuid: string,
  options?: GetMatchIdsOptions,
): Promise<string[]> {
  const params: Record<string, string> = {};
  if (options?.start !== undefined) params.start = String(options.start);
  if (options?.count !== undefined) params.count = String(options.count);
  if (options?.queue !== undefined) params.queue = String(options.queue);
  // ... etc
  const response = await client.request<string[]>(
    route,
    `/lol/match/v5/matches/by-puuid/${puuid}/ids`,
    'match-v5.getMatchIdsByPuuid',
    { params },
  );
  return response.data;
},
```

### Pattern 3: POST Endpoints (Tournament Only)
**What:** Tournament-v5 and tournament-stub-v5 have POST endpoints for creating providers, tournaments, and codes
**When to use:** Only tournament modules
**Example:**
```typescript
async createProvider(
  client: WhisperClient,
  route: RegionalRoute,
  body: ProviderRegistrationParameters,
): Promise<number> {
  const response = await client.request<number>(
    route,
    '/lol/tournament/v5/providers',
    'tournament-v5.createProvider',
    { method: 'POST', body: JSON.stringify(body) },
  );
  return response.data;
},
```

### Pattern 4: Index Re-exports for Tree-Shaking
**What:** `src/lol/index.ts` re-exports all namespace objects and relevant types
**When to use:** The lol and riot index files
**Example:**
```typescript
// src/lol/index.ts
export { championMasteryV4 } from './champion-mastery-v4.js';
export { championV3 } from './champion-v3.js';
export { clashV1 } from './clash-v1.js';
// ... all 13 groups

// Re-export types users need
export type { LolSummoner, LolMatch, LolMatchTimeline, LolLeagueEntry } from '../types/generated/lol.js';
// ... etc
```

### Anti-Patterns to Avoid
- **Wrapping client in a class per API group:** Breaks stateless per-call pattern. Use plain objects.
- **Generic helper that builds all endpoints from registry data:** Loses type safety on route parameter. Each method must explicitly accept `PlatformRoute` or `RegionalRoute`.
- **Sharing a single options type across all methods:** Different endpoints have different query params. Use per-method options interfaces for type safety.
- **Encoding path params without validation:** PUUID and other IDs should be passed as-is (they are URL-safe). Do NOT URL-encode PUUIDs -- Riot expects them raw.
- **Importing from `../core/types.js` in endpoint modules:** Only import `WhisperClient` from `../core/client.js`. The endpoint layer should not depend on internal core types.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL construction | Custom URL builder | `client.request()` handles routing internally via `buildUrl()` | Already built in Phase 2 |
| Rate limiting | Per-endpoint rate logic | `client.request()` integrates rate limiter | Already built in Phase 2 |
| Error handling | Custom error mapping | `client.request()` throws typed errors | Already built in Phase 2 |
| Caching | Manual cache logic | `client.request()` integrates cache | Already built in Phase 2 |
| Query param serialization | Custom query string builder | `client.request()` accepts `params` option | Already built in Phase 2 |

**Key insight:** Endpoint modules are intentionally thin wrappers. All the "magic" lives in the client. Each method is just: type the route, build the path string, call `client.request<T>()`, return `.data`.

## Common Pitfalls

### Pitfall 1: Missing Types for Unhittable Endpoints
**What goes wrong:** 4 API groups (tournament-v5, tournament-stub-v5, lol-rso-match-v1, league-exp-v4) have no schema files or incomplete ones because they require special keys or RSO auth
**Why it happens:** Schema generation only captures types from endpoints hittable with a dev key
**How to avoid:** Use the existing `_build-stubs.ts` pattern to generate stub schemas, or hand-write override types in `src/types/overrides/`. For league-exp-v4, it shares `LeagueEntryDTO` with league-v4 (already generated as `LolLeagueEntry`). For tournament endpoints, use Playwright to scrape DTO definitions from the Riot API explorer.
**Warning signs:** Import errors for nonexistent types, `any` return types

### Pitfall 2: Wrong Route Type on Endpoint
**What goes wrong:** Assigning `PlatformRoute` to a regional-only endpoint (match-v5) or vice versa
**Why it happens:** Easy to confuse which groups use which routing
**How to avoid:** Reference the CONTEXT.md routing table:
- **Platform:** champion-mastery-v4, champion-v3, clash-v1, league-v4, lol-challenges-v1, lol-status-v4, spectator-v5, summoner-v4, league-exp-v4
- **Regional:** match-v5, lol-rso-match-v1, tournament-v5, tournament-stub-v5, account-v1
**Warning signs:** Type tests should catch this -- include negative type tests

### Pitfall 3: Stale Endpoint Inclusion
**What goes wrong:** Including removed endpoints (summoner-v4.getBySummonerName, getBySummonerId) or deprecated APIs (spectator-v4)
**Why it happens:** Old documentation, copypasta from community wrappers
**How to avoid:** Cross-reference against the registry in `scripts/generate-schema/registry.ts` which has already been audited. Summoner-v4 has only 2 endpoints: getByPuuid, getByAccountId. Also note summoner-v4.getByMe is RSO-only -- exclude it.
**Warning signs:** 404 errors when testing against live API

### Pitfall 4: Return Type Mismatch (Array vs Object)
**What goes wrong:** Declaring return type as `T` when the API returns `T[]`, or vice versa
**Why it happens:** Some endpoints return arrays (champion-mastery-v4.getByPuuid returns `ChampionMastery[]`), some return scalars (getScoresByPuuid returns `number`)
**How to avoid:** Registry `isArray` field documents this. Cross-check each endpoint.
**Warning signs:** Runtime type mismatch, TypeScript not catching array access

### Pitfall 5: NodeNext Import Extension
**What goes wrong:** Missing `.js` extension on imports
**Why it happens:** Project uses NodeNext module resolution (Phase 1 decision)
**How to avoid:** Every relative import must end in `.js` -- e.g., `import { summonerV4 } from './summoner-v4.js'`
**Warning signs:** Build failures, test resolution errors

### Pitfall 6: Generated Type Names vs User-Facing Names
**What goes wrong:** Using raw DTO names (`SummonerDTO`) instead of codegen-cleaned names (`LolSummoner`)
**Why it happens:** Schema files use DTO names; codegen strips "DTO" suffix and adds game prefix
**How to avoid:** Always import from `src/types/generated/lol.ts`. Check the actual exported interface names: `LolSummoner` not `SummonerDTO`, `LolMatch` not `MatchDTO`, `LolLeagueEntry` not `LeagueEntryDTO`. The codegen prefixes game name to avoid collisions.
**Warning signs:** Import errors for types that don't exist

## Code Examples

### Complete Endpoint Module (Simple GET)
```typescript
// src/lol/champion-v3.ts
import type { WhisperClient } from '../core/client.js';
import type { PlatformRoute } from '../types/platform.js';
import type { ChampionInfo } from '../types/generated/lol.js';

/**
 * League of Legends Champion Rotation API (v3).
 *
 * Retrieve the current free champion rotation.
 *
 * @example
 * ```typescript
 * import { championV3 } from '@wardbox/whisper/lol';
 *
 * const rotation = await championV3.getChampionRotations(client, 'na1');
 * console.log(rotation.freeChampionIds);
 * ```
 */
export const championV3 = {
  /**
   * Get the current free champion rotation including free-to-play for new players.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @returns Champion rotation data with free champion IDs
   *
   * @example
   * ```typescript
   * const rotation = await championV3.getChampionRotations(client, 'na1');
   * ```
   */
  async getChampionRotations(
    client: WhisperClient,
    route: PlatformRoute,
  ): Promise<ChampionInfo> {
    const response = await client.request<ChampionInfo>(
      route,
      '/lol/platform/v3/champion-rotations',
      'champion-v3.getChampionRotations',
    );
    return response.data;
  },
} as const;
```

### Test Pattern (Mock Client)
```typescript
// src/lol/champion-v3.test.ts
import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { ChampionInfo } from '../types/generated/lol.js';
import { championV3 } from './champion-v3.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('championV3', () => {
  it('getChampionRotations calls client with correct path and methodId', async () => {
    const expected: ChampionInfo = {
      freeChampionIds: [1, 2, 3],
      freeChampionIdsForNewPlayers: [4, 5],
      maxNewPlayerLevel: 10,
    };
    const client = mockClient(expected);

    const result = await championV3.getChampionRotations(client, 'na1');

    expect(result).toEqual(expected);
    expect(client.request).toHaveBeenCalledWith(
      'na1',
      '/lol/platform/v3/champion-rotations',
      'champion-v3.getChampionRotations',
    );
  });
});
```

### Type Test Pattern (Compile-Time Route Enforcement)
```typescript
// In a .test.ts file using @ts-expect-error
import type { WhisperClient } from '../core/client.js';
import { matchV5 } from './match-v5.js';
import { summonerV4 } from './summoner-v4.js';

declare const client: WhisperClient;

// Valid: platform route to platform endpoint
summonerV4.getByPuuid(client, 'na1', 'puuid');

// Valid: regional route to regional endpoint
matchV5.getMatch(client, 'americas', 'NA1_123');

// @ts-expect-error -- regional route to platform-only endpoint
summonerV4.getByPuuid(client, 'americas', 'puuid');

// @ts-expect-error -- platform route to regional-only endpoint
matchV5.getMatch(client, 'na1', 'NA1_123');
```

## Endpoint Inventory

### Complete Endpoint Map (13 LoL groups + Account-V1)

| Group | Routing | Methods | Schema Status | Notes |
|-------|---------|---------|---------------|-------|
| champion-mastery-v4 | Platform | 4 | Live schema | getByPuuid, getTopByPuuid, getByPuuidByChampion, getScoresByPuuid |
| champion-v3 | Platform | 1 | Live schema | getChampionRotations |
| clash-v1 | Platform | 4 | Live schema | getPlayersByPuuid, getTournaments, getTournamentById, getTeamById |
| league-v4 | Platform | 6 | Live schema | getChallengerLeague, getGrandmasterLeague, getMasterLeague, getEntriesByPuuid, getEntries, getById |
| league-exp-v4 | Platform | 1 | No schema (shares LolLeagueEntry) | getEntries -- reuses league-v4 types |
| lol-challenges-v1 | Platform | 6 | Live schema | getConfig, getPercentiles, getChallengeConfig, getChallengePercentiles, getChallengeLeaderboard, getPlayerData |
| lol-status-v4 | Platform | 1 | Live schema | getStatus |
| match-v5 | Regional | 3 | Live schema | getMatchIdsByPuuid, getMatch, getMatchTimeline |
| lol-rso-match-v1 | Regional | 3 | No schema (RSO-only) | getMatchIds, getMatch, getTimeline -- same DTOs as match-v5 |
| spectator-v5 | Platform | 2 | Stub schema | getCurrentGame, getFeaturedGames |
| summoner-v4 | Platform | 2 | Live schema | getByPuuid, getByAccountId (getBySummonerName/Id REMOVED) |
| tournament-v5 | Regional | 5+ | No schema (tournament key needed) | createProvider, createTournament, createTournamentCode, getTournamentCode, getLobbyEventsByCode, updateTournamentCode |
| tournament-stub-v5 | Regional | 4 | No schema (stub testing API) | createProvider, createTournament, createTournamentCode, getLobbyEventsByCode |
| account-v1 | Regional | 3 | Live schema | getByPuuid, getByRiotId, getByGame |

**Total methods:** ~45 GET + ~5 POST = ~50 methods

### Generated Types Available (from lol.ts)
- `BannedChampion`, `ChallengeConfigInfo`, `ChallengePercentiles`, `ChampionInfo`
- `ChampionMastery`, `CurrentGameParticipant`, `GameCustomizationObject`
- `LolCurrentGameInfo`, `LolLeagueEntry`, `LolMatch`, `LolMatchTimeline`
- `LolPlatformData`, `LolSummoner`, `Observer`, `Perks`, `PlayerInfo`, `Tournament`

### Types Needing Override/Stub Creation
- `ActiveShard` -- returned by account-v1.getByGame (not in generated riot.ts)
- Tournament DTOs: `TournamentCodeParametersV5`, `TournamentCodeV5`, `LobbyEventV5Wrapper`, `LobbyEventV5`, `ProviderRegistrationParameters`, `TournamentRegistrationParameters`
- Possibly: `LeagueList` (for league-v4 getChallengerLeague etc.) -- check if generated
- Possibly: `FeaturedGames` wrapper (for spectator-v5.getFeaturedGames) -- check if generated

### Missing Type Investigation

Checking the generated lol.ts exports against registry needs:

| Registry responseName | Generated As | Status |
|----------------------|--------------|--------|
| ChampionMasteryDTO | `ChampionMastery` | Available |
| ChampionMasteryScore | (primitive `number`) | No type needed |
| ChampionInfo | `ChampionInfo` | Available |
| PlayerDTO (clash) | `PlayerInfo`? | Check -- may need override |
| TournamentDTO (clash) | `Tournament` | Available |
| TeamDTO (clash) | Not found | Needs override |
| LeagueListDTO | Not found | Needs override |
| LeagueEntryDTO | `LolLeagueEntry` | Available |
| ChallengeConfigInfoDTO | `ChallengeConfigInfo` | Available |
| ChallengePercentiles | `ChallengePercentiles` | Available |
| ChallengePercentileEntry | Not found | Needs investigation |
| ApexPlayerInfoDTO | Not found | Needs override |
| PlayerInfoDTO | `PlayerInfo` | Available |
| PlatformDataDTO | `LolPlatformData` | Available |
| MatchDTO | `LolMatch` | Available |
| MatchTimelineDTO | `LolMatchTimeline` | Available |
| MatchIdList | (primitive `string[]`) | No type needed |
| CurrentGameInfo | `LolCurrentGameInfo` | Available |
| FeaturedGames | Not found | Needs override |
| SummonerDTO | `LolSummoner` | Available |
| AccountDTO | `Account` (in riot.ts) | Available |
| ActiveShardDTO | Not found | Needs override |

**Override types needed (minimum):** TeamDTO (clash), LeagueListDTO, FeaturedGames, ActiveShardDTO, ChallengePercentileEntry, ApexPlayerInfoDTO, plus all tournament DTOs.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| summoner-v4 by name/ID | summoner-v4 by PUUID only | June 2025 | getBySummonerName and getBySummonerId removed |
| spectator-v4 | spectator-v5 (PUUID-based) | 2024 | v4 deprecated, v5 uses PUUID |
| tournament-v4 | tournament-v5 | 2024 | V5 uses PUUID, updated DTOs |
| Account lookups by summoner | Account-V1 by Riot ID | Ongoing | gameName + tagLine is the primary identifier |

## Open Questions

1. **Exact tournament-v5 endpoint list and DTOs**
   - What we know: tournament-stub-v5 has 4 endpoints (createTournamentCode, getTournamentCode, getLobbyEventsByCode, createProvider + createTournament). tournament-v5 has the same plus updateTournamentCode.
   - What's unclear: Exact DTO field definitions for V5 tournament types. The riotapi-schema has them but the file is too large to fetch completely.
   - Recommendation: Use Playwright to browse the Riot API explorer for authoritative DTO definitions, or reference the riotapi-schema repo.

2. **Several generated types missing from lol.ts**
   - What we know: At least 6-8 response types referenced in the registry are not present in generated types (LeagueList, FeaturedGames, ApexPlayerInfo, etc.)
   - What's unclear: Whether these were intentionally excluded by codegen or if schema capture missed them
   - Recommendation: Hand-write override types for all missing ones. The implementer should check each method's return type against generated types and create overrides as needed.

3. **lol-rso-match-v1 type reuse**
   - What we know: RSO match endpoints return the same MatchDto/TimelineDto as match-v5
   - What's unclear: Whether the RSO variant has any additional fields
   - Recommendation: Reuse `LolMatch` and `LolMatchTimeline` types for lol-rso-match-v1. If differences emerge, create overrides.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project version) |
| Config file | `packages/whisper/vitest.config.ts` |
| Quick run command | `pnpm vitest run src/lol/summoner-v4.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENDP-01 | All 13 LoL API groups callable with correct types | unit | `pnpm vitest run src/lol/` | No -- Wave 0 |
| ENDP-06 | Account-V1 callable with RegionalRoute | unit | `pnpm vitest run src/riot/account-v1.test.ts` | No -- Wave 0 |
| ENDP-07 | Tree-shakeable imports work | unit | `pnpm vitest run src/lol/index.test.ts` | No -- Wave 0 |
| ENDP-08 | Removed endpoints absent | unit (type test) | `pnpm vitest run --typecheck` | No -- Wave 0 |
| DOC-01 | TSDoc on public exports | manual review | N/A | No -- manual |
| DOC-02 | JSDoc on type fields | manual review | N/A | No -- manual |

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/lol/ src/riot/`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green + manual TSDoc review

### Wave 0 Gaps
- [ ] `src/lol/*.test.ts` -- 13 test files for LoL API groups
- [ ] `src/riot/account-v1.test.ts` -- Account-V1 tests
- [ ] Override types for missing DTOs (LeagueList, FeaturedGames, etc.)
- [ ] Stub schemas for tournament-v5, tournament-stub-v5 (if using codegen path)
- [ ] Type test file for route enforcement compile checks

## Sources

### Primary (HIGH confidence)
- `scripts/generate-schema/registry.ts` -- Complete endpoint registry with routing types, paths, parameters, response names (source of truth for this project)
- `packages/whisper/src/core/client.ts` -- WhisperClient interface showing `request<T>()` signature
- `packages/whisper/src/types/generated/lol.ts` -- All generated LoL types (verified 17 interfaces)
- `packages/whisper/src/types/generated/riot.ts` -- Account type (verified)
- `scripts/generate-schema/_build-stubs.ts` -- Pattern for creating stub schemas from Riot docs

### Secondary (MEDIUM confidence)
- Riot API explorer (https://developer.riotgames.com/apis) -- Confirmed 13 LoL groups; individual endpoint details need Playwright browsing
- MingweiSamuel/riotapi-schema -- Partial tournament-stub-v5 endpoint info retrieved; full DTO schemas truncated

### Tertiary (LOW confidence)
- Tournament-v5 DTO field definitions -- Could not fully retrieve from any source. Needs Playwright verification against Riot API explorer.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies, all patterns established in prior phases
- Architecture: HIGH -- Namespace object pattern, test pattern, and index re-export pattern are straightforward and well-understood
- Pitfalls: HIGH -- Route type confusion, missing types, removed endpoints are well-documented
- Endpoint inventory: MEDIUM -- 9 of 13 groups fully characterized; 4 need stub types
- Tournament DTOs: LOW -- Could not retrieve full field definitions; requires Playwright scraping

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- Riot API changes infrequently)
