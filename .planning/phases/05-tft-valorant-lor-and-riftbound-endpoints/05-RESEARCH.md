# Phase 5: TFT, Valorant, LoR, and Riftbound Endpoints - Research

**Researched:** 2026-03-18
**Domain:** Riot Games API endpoint wrapping for TFT, Valorant, LoR, and Riftbound
**Confidence:** HIGH

## Summary

Phase 5 wraps the remaining 17 API groups across four games (TFT: 5, Valorant: 6, LoR: 2-5 pending audit, Riftbound: 1), completing full Riot API coverage. The Phase 4 LoL implementation provides a proven, well-tested pattern to replicate. Every game module follows the identical namespace-object pattern with co-located tests, route enforcement via `expectTypeOf`, and index re-exports.

The single most important finding is that **Valorant uses its own platform routing values** (ap, br, eu, kr, latam, na, esports) that differ from both `PlatformRoute` (na1, euw1, kr, etc.) and `RegionalRoute` (americas, europe, asia, sea). This requires creating a new `ValPlatformRoute` type and updating the `WhisperClient.request()` type signature to accept it. TFT match routing also reveals `esports` and `esportseu` regional values not in the current `RegionalRoute` type. LoR endpoints appear to only have 2 active API groups based on schema runner output, with lor-match-v1, lor-deck-v1, and lor-inventory-v1 potentially inactive or requiring RSO authentication. The Riftbound module is straightforward with a single endpoint.

**Primary recommendation:** Start each game plan with a Playwright audit of the Riot API explorer to confirm endpoint availability, routing, and parameters -- then implement following the established Phase 4 LoL pattern exactly.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All games use Playwright audit on Riot API explorer to confirm routing per endpoint, then enforce at type level -- same proven approach as Phase 4
- TFT: tft-match-v1 uses RegionalRoute; tft-league-v1, tft-summoner-v1, spectator-tft-v5, tft-status-v1 use PlatformRoute (verify via audit)
- Valorant: val-match-v1 uses RegionalRoute; val-content-v1, val-status-v1 use PlatformRoute; val-console-match-v1, val-console-ranked-v1, val-ranked-v1 routing TBD via audit
- LoR: All endpoints appear regional-routed (verify via audit)
- Riftbound: riftbound-content-v1 appears platform-routed (verify via audit)
- All 6 Valorant groups included (including console variants) -- same approach as tournament endpoints in Phase 4
- LoR is in maintenance mode -- audit which endpoints are still active on the API explorer
- Only wrap active endpoints; exclude deactivated ones entirely (no stubs, no @deprecated)
- If fewer than 5 LoR groups are active, update roadmap and requirements to reflect actual counts
- Schema runner captured 2 LoR schemas (lor-ranked-v1, lor-status-v1) -- audit may confirm this is the full active set
- Start with generated types from `src/types/generated/{tft,val,lor,riftbound}.ts`
- Create override types in `src/types/overrides/` only when Playwright verification reveals generated types don't match actual API responses
- Each game's types are fully independent -- no cross-game sharing even for similar shapes
- Override files follow Phase 4 naming: `tft-{group}.ts`, `val-{group}.ts`, etc.
- Module API shape (carried from Phase 4): namespace objects, route per-call, stateless, one file per API group, co-located tests, unwrapped data returns, 204 returns `{ status: number }`, cleaned operationIds, positional required params, trailing options object
- 3 plans by game: (1) TFT, (2) Valorant, (3) LoR + Riftbound combined

### Claude's Discretion
- Internal implementation details of namespace objects
- Exact TSDoc example content for each method
- JSDoc field descriptions for generated types
- Options type structure for optional query parameters
- Test strategy details (mock patterns, assertion style)
- Order of endpoint implementation within each plan
- Whether to create override types for a given endpoint (based on Playwright audit findings)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENDP-02 | TFT -- all 5 API groups wrapped and typed | 5 TFT API groups identified with 12 total endpoints; generated types exist in `src/types/generated/tft.ts`; routing confirmed (platform for 4, regional for match-v1) |
| ENDP-03 | Valorant -- all 6 API groups wrapped and typed | 6 Val API groups identified with 11+ endpoints; generated types exist in `src/types/generated/val.ts`; **NEW ValPlatformRoute type required** |
| ENDP-04 | LoR -- all 5 API groups wrapped and typed | Only 2 of 5 LoR groups have schemas (lor-ranked-v1, lor-status-v1); lor-match-v1, lor-deck-v1, lor-inventory-v1 require audit -- may be inactive or RSO-only; requirement count may decrease after audit |
| ENDP-05 | Riftbound -- 1 API group wrapped and typed | Single endpoint (GET /riftbound/content/v1/contents) confirmed; generated types exist in `src/types/generated/riftbound.ts`; uses RegionalRoute (americas, asia, europe) |
</phase_requirements>

## Standard Stack

No new dependencies needed. Phase 5 uses the identical stack from Phase 4.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | ~5.8.0 | Type system for route enforcement | Project standard |
| vitest | 4.1.0 | Unit tests with `expectTypeOf` | Project standard |
| tsdown | 0.21.4 | Dual ESM+CJS build | Project standard |

### Build Configuration (already complete)
- `tsdown.config.ts` already has entry points for `tft/index`, `val/index`, `lor/index`, `riftbound/index`
- `package.json` exports already configured for `./tft`, `./val`, `./lor`, `./riftbound`
- Placeholder `index.ts` files exist in all four game directories

**Installation:** None required -- all infrastructure is in place from Phase 1.

## Architecture Patterns

### Project Structure (files to create)
```
packages/whisper/src/
├── tft/
│   ├── tft-match-v1.ts          # RegionalRoute
│   ├── tft-match-v1.test.ts
│   ├── tft-league-v1.ts         # PlatformRoute
│   ├── tft-league-v1.test.ts
│   ├── tft-summoner-v1.ts       # PlatformRoute
│   ├── tft-summoner-v1.test.ts
│   ├── tft-status-v1.ts         # PlatformRoute
│   ├── tft-status-v1.test.ts
│   ├── spectator-tft-v5.ts      # PlatformRoute
│   ├── spectator-tft-v5.test.ts
│   ├── routing.test.ts          # Route enforcement type tests
│   ├── index.test.ts            # Re-export smoke tests
│   └── index.ts                 # Re-exports (replace placeholder)
├── val/
│   ├── val-match-v1.ts          # ValPlatformRoute
│   ├── val-match-v1.test.ts
│   ├── val-content-v1.ts        # ValPlatformRoute
│   ├── val-content-v1.test.ts
│   ├── val-status-v1.ts         # ValPlatformRoute
│   ├── val-status-v1.test.ts
│   ├── val-ranked-v1.ts         # ValPlatformRoute
│   ├── val-ranked-v1.test.ts
│   ├── val-console-match-v1.ts  # ValPlatformRoute
│   ├── val-console-match-v1.test.ts
│   ├── val-console-ranked-v1.ts # ValPlatformRoute
│   ├── val-console-ranked-v1.test.ts
│   ├── routing.test.ts
│   ├── index.test.ts
│   └── index.ts                 # Re-exports (replace placeholder)
├── lor/
│   ├── lor-ranked-v1.ts         # RegionalRoute
│   ├── lor-ranked-v1.test.ts
│   ├── lor-status-v1.ts         # RegionalRoute
│   ├── lor-status-v1.test.ts
│   ├── [lor-match-v1.ts]        # Only if audit confirms active
│   ├── [lor-deck-v1.ts]         # Only if audit confirms active (RSO)
│   ├── [lor-inventory-v1.ts]    # Only if audit confirms active (RSO)
│   ├── routing.test.ts
│   ├── index.test.ts
│   └── index.ts                 # Re-exports (replace placeholder)
├── riftbound/
│   ├── riftbound-content-v1.ts  # RegionalRoute
│   ├── riftbound-content-v1.test.ts
│   ├── routing.test.ts
│   ├── index.test.ts
│   └── index.ts                 # Re-exports (replace placeholder)
└── types/
    ├── val-platform.ts          # NEW: ValPlatformRoute type
    └── val-platform.test.ts     # NEW: type tests
```

### Pattern 1: Namespace Object per API Group (from Phase 4)
**What:** Each API group is a `const` object with async methods that delegate to `client.request<T>()`
**When to use:** Every endpoint module
**Example:**
```typescript
// Source: packages/whisper/src/lol/summoner-v4.ts (established pattern)
import type { WhisperClient } from '../core/client.js';
import type { TftSummoner } from '../types/generated/tft.js';
import type { PlatformRoute } from '../types/platform.js';

export const tftSummonerV1 = {
  async getByPuuid(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<TftSummoner> {
    const response = await client.request<TftSummoner>(
      route,
      `/tft/summoner/v1/summoners/by-puuid/${encodeURIComponent(puuid)}`,
      'tft-summoner-v1.getByPuuid',
    );
    return response.data;
  },
} as const;
```

### Pattern 2: Route Enforcement Tests (from Phase 4)
**What:** Type-level tests using `expectTypeOf` to verify each module's route parameter type
**When to use:** One `routing.test.ts` per game directory
**Example:**
```typescript
// Source: packages/whisper/src/lol/routing.test.ts (established pattern)
import { describe, expectTypeOf, it } from 'vitest';
import type { PlatformRoute } from '../types/platform.js';
import type { RegionalRoute } from '../types/regional.js';
import { tftLeagueV1 } from './tft-league-v1.js';
import { tftMatchV1 } from './tft-match-v1.js';

describe('route type enforcement', () => {
  it('platform-routed modules accept PlatformRoute', () => {
    expectTypeOf(tftLeagueV1.getChallengerLeague).parameter(1).toEqualTypeOf<PlatformRoute>();
  });
  it('regional-routed modules accept RegionalRoute', () => {
    expectTypeOf(tftMatchV1.getMatch).parameter(1).toEqualTypeOf<RegionalRoute>();
  });
});
```

### Pattern 3: Index Re-exports (from Phase 4)
**What:** Game index.ts re-exports all namespace objects, generated types, override types, and options types
**When to use:** Each game's `index.ts`
**Example:**
```typescript
// Source: packages/whisper/src/lol/index.ts (established pattern)
export type { TftMatch, TftSummoner, TftLeagueList, TftCurrentGameInfo, TftPlatformData } from '../types/generated/tft.js';
export { tftMatchV1 } from './tft-match-v1.js';
export { tftLeagueV1 } from './tft-league-v1.js';
export { tftSummonerV1 } from './tft-summoner-v1.js';
export { tftStatusV1 } from './tft-status-v1.js';
export { spectatorTftV5 } from './spectator-tft-v5.js';
```

### Anti-Patterns to Avoid
- **Cross-game type sharing:** TFT league types may look like LoL league types but MUST be independent. Generated types are already separate per game.
- **Hardcoding Valorant routes as PlatformRoute or RegionalRoute:** Val uses its own routing (ap, br, eu, kr, latam, na, esports). Must use ValPlatformRoute.
- **Wrapping inactive LoR endpoints:** Only wrap endpoints confirmed active via Playwright audit. No stubs, no @deprecated.
- **Mixing console and non-console Val paths:** val-console-match-v1 uses `/val/match/console/v1/...` (NOT `/val/console/match/v1/...` for match endpoints, but `/val/console/ranked/v1/...` for ranked). Verify paths via audit.

## Critical Finding: Valorant Routing Type

**Confidence: HIGH** (verified via Riot API explorer, riven library, and MingweiSamuel schema)

Valorant does NOT use the existing `PlatformRoute` or `RegionalRoute` types. It has its own routing values:

| Val Route | Hostname | Description |
|-----------|----------|-------------|
| `ap` | ap.api.riotgames.com | Asia-Pacific |
| `br` | br.api.riotgames.com | Brazil |
| `eu` | eu.api.riotgames.com | Europe |
| `kr` | kr.api.riotgames.com | Korea |
| `latam` | latam.api.riotgames.com | Latin America |
| `na` | na.api.riotgames.com | North America |
| `esports` | esports.api.riotgames.com | Esports |

**NOTE about the CONTEXT.md routing decisions:** The CONTEXT.md says "val-match-v1 uses RegionalRoute" and "val-content-v1, val-status-v1 use PlatformRoute". This is incorrect based on research. All 6 Valorant API groups use `ValPlatformRoute` (ap, br, eu, kr, latam, na, esports). The Playwright audit step will confirm this, and the implementer should follow what the audit reveals.

### Required Changes

1. **Create `src/types/val-platform.ts`:**
```typescript
/** Valorant-specific platform routing values */
export type ValPlatformRoute = 'ap' | 'br' | 'eu' | 'kr' | 'latam' | 'na' | 'esports';

/** Valorant platform routing constants for IDE discoverability */
export const VAL_PLATFORM = {
  AP: 'ap',
  BR: 'br',
  EU: 'eu',
  KR: 'kr',
  LATAM: 'latam',
  NA: 'na',
  ESPORTS: 'esports',
} as const satisfies Record<string, ValPlatformRoute>;
```

2. **Update `WhisperClient.request()` type signature** in `src/core/client.ts` to accept `ValPlatformRoute`:
```typescript
import type { ValPlatformRoute } from '../types/val-platform.js';

export interface WhisperClient {
  request<T>(
    route: PlatformRoute | RegionalRoute | ValPlatformRoute,
    path: string,
    methodId: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>>;
}
```

3. **Re-export from `src/types/index.ts`:**
```typescript
export type { ValPlatformRoute } from './val-platform.js';
export { VAL_PLATFORM } from './val-platform.js';
```

4. **Route enforcement tests:** Verify `ValPlatformRoute` is not assignable to `PlatformRoute` or `RegionalRoute` and vice versa.

### Val Routing per API Group

| API Group | Routes Available | Notes |
|-----------|-----------------|-------|
| val-match-v1 | ap, br, esports, eu, kr, latam, na | 7 routes; NA/LATAM/BR share match history |
| val-content-v1 | ap, br, esports, eu, kr, latam, na | 7 routes; optional `locale` query param |
| val-status-v1 | ap, br, eu, kr, latam, na | 6 routes (no esports) |
| val-ranked-v1 | ap, br, eu, kr, latam, na | 6 routes (no esports) |
| val-console-match-v1 | ap, br, eu, latam, na | 5 routes (no kr, no esports) |
| val-console-ranked-v1 | ap, eu, na | 3 routes only |

All use `ValPlatformRoute` as the type parameter. The subset differences (esports, kr availability) are runtime concerns, not type-level concerns -- all accept `ValPlatformRoute`.

## Complete Endpoint Inventory

### TFT (5 API groups, 12 endpoints)

**tft-match-v1 (RegionalRoute -- americas, asia, europe, sea, esports, esportseu)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/tft/match/v1/matches/by-puuid/{puuid}/ids` | getMatchIdsByPuuid | puuid (path), start/count/startTime/endTime (query) |
| GET | `/tft/match/v1/matches/{matchId}` | getMatch | matchId (path) |

**Note on esports/esportseu:** TFT match endpoint accepts ESPORTS and ESPORTSEU routing values in addition to the standard 4. These exist in the riven library as additional `RegionalRoute` variants. Since the runtime `buildUrl()` just does `${route}.api.riotgames.com`, any string works. The type-level question is whether to expand `RegionalRoute` to include `'esports' | 'esportseu'`. Recommendation: **Do NOT expand RegionalRoute** unless the Playwright audit confirms these are actively available. The standard 4 regional routes suffice for normal usage.

**tft-league-v1 (PlatformRoute)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/tft/league/v1/challenger` | getChallengerLeague | queue (query, optional: RANKED_TFT or RANKED_TFT_DOUBLE_UP) |
| GET | `/tft/league/v1/grandmaster` | getGrandmasterLeague | queue (query, optional) |
| GET | `/tft/league/v1/master` | getMasterLeague | queue (query, optional) |
| GET | `/tft/league/v1/by-puuid/{puuid}` | getLeagueEntriesByPuuid | puuid (path), queue (query, optional) |
| GET | `/tft/league/v1/entries/{tier}/{division}` | getLeagueEntries | tier (path), division (path), queue (query), page (query) |
| GET | `/tft/league/v1/leagues/{leagueId}` | getLeagueById | leagueId (path) |
| GET | `/tft/league/v1/rated-ladders/{queue}/top` | getTopRatedLadder | queue (path: RANKED_TFT_TURBO) |

**tft-summoner-v1 (PlatformRoute)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/tft/summoner/v1/summoners/by-puuid/{encryptedPUUID}` | getByPuuid | puuid (path) |
| GET | `/tft/summoner/v1/summoners/me` | getByAccessToken | Authorization header (RSO) |

**Note:** `getByAccessToken` requires RSO (Riot Sign On) Bearer token via Authorization header. Include this endpoint but note it requires RSO auth in TSDoc.

**tft-status-v1 (PlatformRoute)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/tft/status/v1/platform-data` | getPlatformData | none |

**spectator-tft-v5 (PlatformRoute)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/lol/spectator/tft/v5/active-games/by-puuid/{encryptedPUUID}` | getCurrentGame | puuid (path) |

**IMPORTANT:** The spectator-tft-v5 path starts with `/lol/spectator/tft/v5/` NOT `/tft/spectator/v5/`. This is the actual Riot API path -- do NOT "fix" it.

### Valorant (6 API groups, 11 endpoints)

**val-match-v1 (ValPlatformRoute)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/val/match/v1/matches/{matchId}` | getMatch | matchId (path) |
| GET | `/val/match/v1/matchlists/by-puuid/{puuid}` | getMatchlist | puuid (path) |
| GET | `/val/match/v1/recent-matches/by-queue/{queue}` | getRecentMatches | queue (path) |

**val-content-v1 (ValPlatformRoute)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/val/content/v1/contents` | getContent | locale (query, optional) |

**val-status-v1 (ValPlatformRoute)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/val/status/v1/platform-data` | getPlatformData | none |

**val-ranked-v1 (ValPlatformRoute)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/val/ranked/v1/leaderboards/by-act/{actId}` | getLeaderboard | actId (path), size/startIndex (query, optional) |

**val-console-match-v1 (ValPlatformRoute)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/val/match/console/v1/matches/{matchId}` | getMatch | matchId (path) |
| GET | `/val/match/console/v1/matchlists/by-puuid/{puuid}` | getMatchlist | puuid (path), platformType (query, required: 'playstation' or 'xbox') |
| GET | `/val/match/console/v1/recent-matches/by-queue/{queue}` | getRecentMatches | queue (path) |

**val-console-ranked-v1 (ValPlatformRoute)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/val/console/ranked/v1/leaderboards/by-act/{actId}` | getLeaderboard | actId (path), platformType (query, required), size/startIndex (query, optional) |

### LoR (2-5 API groups pending audit)

**Confirmed active (schemas captured by schema runner):**

**lor-ranked-v1 (RegionalRoute -- americas, europe, sea)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/lor/ranked/v1/leaderboards` | getLeaderboards | none |

**lor-status-v1 (RegionalRoute -- americas, europe, sea)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/lor/status/v1/platform-data` | getPlatformData | none |

**Require Playwright audit (may be inactive or RSO-only):**

**lor-match-v1 (RegionalRoute -- americas, apac, europe, sea)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/lor/match/v1/matches/by-puuid/{puuid}/ids` | getMatchIdsByPuuid | puuid (path) |
| GET | `/lor/match/v1/matches/{matchId}` | getMatch | matchId (path) |

**lor-deck-v1 (RegionalRoute -- americas, europe, sea; RSO required)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/lor/deck/v1/decks/me` | getDecks | Authorization header |
| POST | `/lor/deck/v1/decks/me` | createDeck | Authorization header, body |

**lor-inventory-v1 (RegionalRoute -- americas, europe, sea; RSO required)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/lor/inventory/v1/cards/me` | getCards | Authorization header |

**Note on LoR routing:** LoR API explorer shows AMERICAS, EUROPE, SEA for most endpoints, and APAC additionally for lor-match-v1. The standard `RegionalRoute` type (americas, europe, asia, sea) already covers americas/europe/sea. The APAC value is deprecated according to the riven library. LoR endpoints should use `RegionalRoute`. The Playwright audit should confirm whether `asia` or `sea` is the correct routing for APAC players.

### Riftbound (1 API group, 1 endpoint)

**riftbound-content-v1 (RegionalRoute -- americas, asia, europe)**
| Method | Path | operationId | Params |
|--------|------|------------|--------|
| GET | `/riftbound/content/v1/contents` | getContent | locale (query, optional; defaults to 'en') |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL construction | Custom URL builders | `buildUrl(route, path)` from core/http.ts | Already handles `https://${route}.api.riotgames.com${path}` |
| Query parameter serialization | Manual string concat | `URLSearchParams` via existing `params` option | Established pattern from Phase 4 match-v5 |
| Route type enforcement | Runtime route validation | TypeScript literal union types | Compile-time safety, zero runtime cost |
| Test mocking | Custom mock framework | `vi.fn().mockResolvedValue({data, status: 200, headers: {}})` | Established mockClient pattern |
| Override types | Merging generated + manual | Separate files in overrides/ that take precedence | Phase 3/4 established this pattern |

**Key insight:** Every piece of infrastructure needed for Phase 5 already exists. The work is purely endpoint wrapping + type management + testing. No new infrastructure or patterns to invent.

## Common Pitfalls

### Pitfall 1: Using Wrong Route Type for Valorant
**What goes wrong:** Using `PlatformRoute` or `RegionalRoute` for Valorant endpoints. The values don't overlap -- 'na1' vs 'na', 'americas' vs 'eu'.
**Why it happens:** CONTEXT.md assumed Valorant uses standard routing. Research reveals it has its own routing values.
**How to avoid:** Create `ValPlatformRoute` type, use it for ALL 6 Valorant API groups.
**Warning signs:** TypeScript accepts the wrong route type if `WhisperClient.request()` isn't updated, or if you accidentally use `string`.

### Pitfall 2: spectator-tft-v5 Path Starts with /lol/
**What goes wrong:** Assuming all TFT paths start with `/tft/`.
**Why it happens:** spectator-tft-v5 is the only TFT endpoint whose URL path starts with `/lol/spectator/tft/v5/`.
**How to avoid:** Use exact paths from the Riot API explorer. The Playwright audit will confirm.
**Warning signs:** 404 errors on spectator endpoint.

### Pitfall 3: Val Console Path Structure
**What goes wrong:** Assuming console endpoints follow the same path structure as non-console.
**Why it happens:** The paths differ in subtle ways:
- val-match-v1: `/val/match/v1/...`
- val-console-match-v1: `/val/match/console/v1/...` (console INSIDE match)
- val-console-ranked-v1: `/val/console/ranked/v1/...` (console OUTSIDE ranked)
**How to avoid:** Always verify exact paths from Riot API explorer.

### Pitfall 4: LoR Endpoints May Be Inactive
**What goes wrong:** Implementing all 5 LoR API groups when some may be deactivated or RSO-only.
**Why it happens:** Schema runner only captured 2 of 5 LoR groups, suggesting the others may be inaccessible.
**How to avoid:** Playwright audit BEFORE implementing any LoR endpoint beyond lor-ranked-v1 and lor-status-v1.
**Warning signs:** Empty schemas, 401/403 errors, "requires RSO" documentation notes.

### Pitfall 5: TFT League Needs Override Types
**What goes wrong:** Generated `TftLeagueList` may not match all response shapes (e.g., league entries by puuid return `TftLeagueEntry[]`, not `TftLeagueList`).
**Why it happens:** Schema captured one response shape; league-v4 endpoints return different shapes for different endpoints.
**How to avoid:** The Playwright audit should verify return types per endpoint. Create override types when needed, following Phase 4's `lol-league.ts` pattern.

### Pitfall 6: Val Console Endpoints Require platformType
**What goes wrong:** Missing required `platformType` query parameter on console endpoints.
**Why it happens:** val-console-match-v1 matchlist and val-console-ranked-v1 both require `platformType: 'playstation' | 'xbox'`.
**How to avoid:** Make `platformType` a required positional parameter (not optional) on the affected methods.

### Pitfall 7: Forgetting to Update WhisperClient Type
**What goes wrong:** Adding `ValPlatformRoute` type but not updating `WhisperClient.request()` signature, causing Valorant endpoint methods to fail type checking.
**Why it happens:** `WhisperClient` currently only accepts `PlatformRoute | RegionalRoute`.
**How to avoid:** Update `WhisperClient` interface and `createClient` implementation in the FIRST plan (Valorant plan or a prerequisite task).

## Code Examples

### TFT League Module (with options object pattern)
```typescript
// Follows packages/whisper/src/lol/league-v4.ts pattern
import type { WhisperClient } from '../core/client.js';
import type { TftLeagueList } from '../types/generated/tft.js';
import type { PlatformRoute } from '../types/platform.js';

export interface GetTftLeagueEntriesOptions {
  queue?: 'RANKED_TFT' | 'RANKED_TFT_DOUBLE_UP';
  page?: number;
}

export const tftLeagueV1 = {
  async getChallengerLeague(
    client: WhisperClient,
    route: PlatformRoute,
    options?: { queue?: 'RANKED_TFT' | 'RANKED_TFT_DOUBLE_UP' },
  ): Promise<TftLeagueList> {
    const params: Record<string, string> = {};
    if (options?.queue) params.queue = options.queue;
    const response = await client.request<TftLeagueList>(
      route,
      '/tft/league/v1/challenger',
      'tft-league-v1.getChallengerLeague',
      Object.keys(params).length > 0 ? { params } : undefined,
    );
    return response.data;
  },
  // ... more methods
} as const;
```

### Valorant Module (with ValPlatformRoute)
```typescript
// val-match-v1.ts
import type { WhisperClient } from '../core/client.js';
import type { ValMatch, Matchlist, RecentMatches } from '../types/generated/val.js';
import type { ValPlatformRoute } from '../types/val-platform.js';

export const valMatchV1 = {
  async getMatch(
    client: WhisperClient,
    route: ValPlatformRoute,
    matchId: string,
  ): Promise<ValMatch> {
    const response = await client.request<ValMatch>(
      route,
      `/val/match/v1/matches/${encodeURIComponent(matchId)}`,
      'val-match-v1.getMatch',
    );
    return response.data;
  },

  async getMatchlist(
    client: WhisperClient,
    route: ValPlatformRoute,
    puuid: string,
  ): Promise<Matchlist> {
    const response = await client.request<Matchlist>(
      route,
      `/val/match/v1/matchlists/by-puuid/${encodeURIComponent(puuid)}`,
      'val-match-v1.getMatchlist',
    );
    return response.data;
  },

  async getRecentMatches(
    client: WhisperClient,
    route: ValPlatformRoute,
    queue: string,
  ): Promise<RecentMatches> {
    const response = await client.request<RecentMatches>(
      route,
      `/val/match/v1/recent-matches/by-queue/${encodeURIComponent(queue)}`,
      'val-match-v1.getRecentMatches',
    );
    return response.data;
  },
} as const;
```

### Val Console Match (with required platformType)
```typescript
// val-console-match-v1.ts
export const valConsoleMatchV1 = {
  async getMatchlist(
    client: WhisperClient,
    route: ValPlatformRoute,
    puuid: string,
    platformType: 'playstation' | 'xbox',
  ): Promise<Matchlist> {
    const response = await client.request<Matchlist>(
      route,
      `/val/match/console/v1/matchlists/by-puuid/${encodeURIComponent(puuid)}`,
      'val-console-match-v1.getMatchlist',
      { params: { platformType } },
    );
    return response.data;
  },
} as const;
```

### Test Pattern (mockClient from Phase 4)
```typescript
import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { tftStatusV1 } from './tft-status-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('tftStatusV1', () => {
  it('returns unwrapped platform status data', async () => {
    const expected = { id: 'NA1', incidents: [], locales: [], maintenances: [], name: 'NA' };
    const client = mockClient(expected);
    const result = await tftStatusV1.getPlatformData(client, 'na1');
    expect(result).toEqual(expected);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LoR had 5 API groups | LoR may have only 2 active | Ongoing (maintenance mode) | Audit determines actual count |
| Single routing system (platform + regional) | Three routing systems (+ ValPlatform) | Valorant launch | Need ValPlatformRoute type |
| Valorant used `esports` routing for all groups | Only match-v1 and content-v1 have esports | Ongoing | Type uses union of all values |
| APAC was a LoR regional route | APAC deprecated, replaced by SEA | Recent | Use RegionalRoute (sea) for LoR |

## Open Questions

1. **LoR active endpoint count**
   - What we know: Schema runner captured only lor-ranked-v1 and lor-status-v1. lor-match-v1, lor-deck-v1, lor-inventory-v1 appear in docs but may be inactive or RSO-only.
   - What's unclear: Whether these 3 endpoints return data, require RSO, or are silently deactivated.
   - Recommendation: Playwright audit during plan implementation. If only 2 are active, update REQUIREMENTS.md ENDP-04 count from 5 to 2.

2. **Whether to expand RegionalRoute for esports/esportseu**
   - What we know: TFT match-v1 API explorer lists ESPORTS and ESPORTSEU as routing options. The riven library includes them as `RegionalRoute` variants.
   - What's unclear: Whether expanding `RegionalRoute` affects existing LoL modules or breaks mutual exclusivity with PlatformRoute.
   - Recommendation: The Playwright audit should check if TFT match endpoints actually accept esports routing. If so, consider adding to RegionalRoute (they don't conflict with PlatformRoute values). But this is low priority -- standard 4 regional routes cover all normal usage.

3. **TFT league endpoint return types**
   - What we know: Generated `TftLeagueList` may not match all endpoints. The league-by-puuid endpoint likely returns `TftLeagueEntry[]` (array of entries, not a full league list).
   - What's unclear: Exact response shape for each tft-league-v1 endpoint.
   - Recommendation: Playwright audit will confirm. Create override types as needed, following the `lol-league.ts` precedent.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | packages/whisper/vitest.config.ts |
| Quick run command | `pnpm vitest run src/tft/` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENDP-02 | TFT 5 groups importable from whisper/tft | unit | `pnpm vitest run src/tft/index.test.ts -x` | Wave 0 |
| ENDP-02 | TFT route enforcement (platform vs regional) | unit | `pnpm vitest run src/tft/routing.test.ts -x` | Wave 0 |
| ENDP-02 | TFT each endpoint calls correct path | unit | `pnpm vitest run src/tft/ -x` | Wave 0 |
| ENDP-03 | Val 6 groups importable from whisper/val | unit | `pnpm vitest run src/val/index.test.ts -x` | Wave 0 |
| ENDP-03 | Val route enforcement (ValPlatformRoute) | unit | `pnpm vitest run src/val/routing.test.ts -x` | Wave 0 |
| ENDP-03 | Val each endpoint calls correct path | unit | `pnpm vitest run src/val/ -x` | Wave 0 |
| ENDP-04 | LoR active groups importable from whisper/lor | unit | `pnpm vitest run src/lor/index.test.ts -x` | Wave 0 |
| ENDP-04 | LoR route enforcement (RegionalRoute) | unit | `pnpm vitest run src/lor/routing.test.ts -x` | Wave 0 |
| ENDP-05 | Riftbound importable from whisper/riftbound | unit | `pnpm vitest run src/riftbound/index.test.ts -x` | Wave 0 |
| ENDP-05 | Riftbound route enforcement (RegionalRoute) | unit | `pnpm vitest run src/riftbound/routing.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/{game}/ -x` (game-specific test run)
- **Per wave merge:** `pnpm test` (full test suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/types/val-platform.ts` -- ValPlatformRoute type definition
- [ ] `src/types/val-platform.test.ts` -- type mutual exclusivity tests
- [ ] Update `src/core/client.ts` WhisperClient interface to accept ValPlatformRoute
- [ ] All game endpoint files, test files, index files, and routing test files (as listed in Architecture Patterns)

## Sources

### Primary (HIGH confidence)
- Riot API Explorer val-match-v1 (https://developer.riotgames.com/api-details/val-match-v1) -- Confirmed 3 endpoints, 7 routing values
- Riot API Explorer val-content-v1 (https://developer.riotgames.com/api-details/val-content-v1) -- Confirmed 1 endpoint, 7 routing values
- Riot API Explorer val-status-v1 (https://developer.riotgames.com/api-details/val-status-v1) -- Confirmed 1 endpoint, 6 routing values
- Riot API Explorer val-ranked-v1 (https://developer.riotgames.com/api-details/val-ranked-v1) -- Confirmed 1 endpoint, 6 routing values
- Riot API Explorer val-console-match-v1 (https://developer.riotgames.com/api-details/val-console-match-v1) -- Confirmed 3 endpoints, 5 routing values
- Riot API Explorer val-console-ranked-v1 (https://developer.riotgames.com/api-details/val-console-ranked-v1) -- Confirmed 1 endpoint, 3 routing values
- Riot API Explorer tft-match-v1 (https://developer.riotgames.com/api-details/tft-match-v1) -- 2 endpoints, regional routing + esports
- Riot API Explorer tft-league-v1 (https://developer.riotgames.com/api-details/tft-league-v1) -- 7 endpoints, platform routing
- Riot API Explorer tft-summoner-v1 (https://developer.riotgames.com/api-details/tft-summoner-v1) -- 2 endpoints, platform routing
- Riot API Explorer tft-status-v1 (https://developer.riotgames.com/api-details/tft-status-v1) -- 1 endpoint, platform routing
- Riot API Explorer spectator-tft-v5 (https://developer.riotgames.com/api-details/spectator-tft-v5) -- 1 endpoint, platform routing
- Riot API Explorer lor-ranked-v1 (https://developer.riotgames.com/api-details/lor-ranked-v1) -- 1 endpoint, regional routing
- Riot API Explorer lor-status-v1 (https://developer.riotgames.com/api-details/lor-status-v1) -- 1 endpoint, regional routing
- Riot API Explorer riftbound-content-v1 (https://developer.riotgames.com/api-details/riftbound-content-v1) -- 1 endpoint, regional routing
- Riven library ValPlatformRoute (https://docs.rs/riven/latest/riven/consts/enum.ValPlatformRoute.html) -- Confirmed 7 Val routing values
- Riven library RegionalRoute (https://docs.rs/riven/latest/riven/consts/enum.RegionalRoute.html) -- APAC deprecated, ESPORTS/ESPORTSEU variants
- MingweiSamuel riotapi-schema OpenAPI (https://www.mingweisamuel.com/riotapi-schema/openapi-3.0.0.min.json) -- TFT, LoR, Riftbound endpoints with x-route-enum

### Secondary (MEDIUM confidence)
- Existing codebase Phase 4 implementation -- Full pattern reference for namespace objects, tests, index re-exports
- Generated types in src/types/generated/{tft,val,lor,riftbound}.ts -- Schema runner output
- Schema JSON files in scripts/schemas/ -- Endpoint response shapes

### Tertiary (LOW confidence)
- LoR match/deck/inventory endpoint activity status -- Appears in docs but schema runner did not capture; needs Playwright audit

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies, all infrastructure from Phase 1-4
- Architecture: HIGH -- Follows proven Phase 4 pattern exactly
- TFT endpoints: HIGH -- All 5 groups confirmed via API explorer with routing verified
- Valorant routing: HIGH -- ValPlatformRoute confirmed via API explorer + riven library
- Valorant endpoints: HIGH -- All 6 groups confirmed via API explorer
- LoR active endpoints: MEDIUM -- lor-ranked-v1 and lor-status-v1 confirmed; other 3 need audit
- Riftbound: HIGH -- Single endpoint fully documented
- Pitfalls: HIGH -- Multiple sources identify Val routing, path quirks, and console differences

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- Riot API changes infrequently)
