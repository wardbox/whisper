# Phase 3: Schema Generation - Research

**Researched:** 2026-03-17
**Domain:** Schema generation, TypeScript codegen, Riot API endpoint coverage
**Confidence:** HIGH

## Summary

Phase 3 builds a schema runner that hits every active Riot API endpoint using Whisper's own client (dog-fooding Phase 2), captures response shapes as `.schema.json` files, and generates TypeScript interfaces. The runner lives in `scripts/generate-schema/`, outputs schema files to `scripts/schemas/`, and writes generated types to `src/types/generated/`.

The core challenge is threefold: (1) dynamically discovering valid test data (PUUIDs, match IDs, league entries) without hardcoding, (2) encoding response shapes into a consistent JSON schema format that captures types, nullability, and optionality, and (3) generating clean TypeScript from those schemas with proper naming conventions (strip DTO suffix, game-prefix ambiguous names). The runner also serves as an integration test -- if Riot changes a response shape, the committed `.schema.json` files will show a diff in CI.

**Primary recommendation:** Build the runner as a single orchestrating script (`scripts/generate-schema/index.ts`) that imports an endpoint registry defining every API group's paths, routing type, and discovery dependencies. Use `tsx` to run the TypeScript directly. Schema JSON should use a simple `{ fields: { [name]: { type, nullable, optional, items? } } }` format -- minimal and purpose-built, not JSON Schema or OpenAPI.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dynamic discovery -- use high-level endpoints (league entries, featured games, leaderboards) to find accounts at runtime. No hardcoded PUUIDs.
- One platform region (e.g., na1) + one regional route (americas) -- schema shapes don't vary by region.
- Files live in `scripts/schemas/` -- one file per API group: `lol.summoner-v4.schema.json`, `lol.match-v5.schema.json`, `riot.account-v1.schema.json`.
- Response shapes only -- field names, types, nullability. No endpoint metadata.
- Committed to git -- diffs visible in PRs, CI regenerates and fails if output differs.
- Strip DTO/Dto suffix: `SummonerDTO` -> `Summoner`, `MatchDto` -> `Match`.
- Prefix with game when ambiguous: `LolMatch`, `TftMatch`.
- Optional fields use `field?: Type` syntax (exactOptionalPropertyTypes from Phase 1).
- String enums as literal unions: `type Tier = 'IRON' | 'BRONZE' | ...`.
- Override replaces generated -- if `src/types/overrides/` has a type, skip during generation.
- Git diff after regeneration for CI: `git diff --exit-code scripts/schemas/`.
- Schema runner dog-foods Whisper's own HTTP client + rate limiter.
- `pnpm generate-schema` is a single command: hit API -> write .schema.json -> generate TypeScript.
- On-demand only -- requires `RIOT_API_KEY` env var.

### Claude's Discretion
- Live-state endpoint handling (spectator, clash) -- pick best approach: skip with stub, best-effort with fallback, or community schema reference.
- Dynamic discovery implementation details (which endpoints to query, fallback chains).
- Schema JSON structure (how fields, types, and nullability are encoded).
- Type generation template/approach (AST, string interpolation, etc.).
- Auto-PR mechanism for schema drift (GitHub Actions workflow specifics).

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHEMA-01 | Integration tests hit live API endpoints and capture response shapes as `.schema.json` | Endpoint registry with all 31 API groups, dynamic discovery strategy, schema JSON format, NotFoundError handling |
| SCHEMA-02 | TypeScript interface generator from `.schema.json` files | Codegen approach (string interpolation), naming rules (strip DTO, game prefix), override mechanism, file-per-game-module output |
| SCHEMA-03 | Schema diff detection for Riot API response shape changes | Git diff CI step, deterministic JSON output (sorted keys), GitHub Actions workflow for auto-PR |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tsx | 4.x | Run TypeScript scripts directly (schema runner) | Zero-config TS execution, used by ecosystem for scripts. Already works with NodeNext/ES2022. |
| @wardbox/whisper (local) | 0.1.0 | HTTP client for API calls | Dog-fooding -- locked decision. Uses createClient() from Phase 2. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js fs/path | built-in | File I/O for schema and type files | Always -- zero-dep constraint |
| Node.js process | built-in | Env var access (RIOT_API_KEY) | Always -- runner entry point |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsx | ts-node | tsx is faster, zero-config, ESM-native. ts-node needs config for ESM. |
| String interpolation for codegen | ts-morph (AST) | ts-morph is heavy dep (~20MB). String interpolation is sufficient for interface generation -- no complex transforms needed. |
| Custom schema format | JSON Schema / OpenAPI subset | JSON Schema is verbose for this use case. Custom format is simpler, purpose-built, and the only consumer is our own codegen. |

**Installation:**
```bash
pnpm add -D tsx --filter @wardbox/whisper
```

**Note:** tsx is the only new devDependency. Everything else is built-in or already in the project.

## Architecture Patterns

### Recommended Project Structure
```
scripts/
├── generate-schema/
│   ├── index.ts              # Entry point: orchestrates discovery -> fetch -> schema -> codegen
│   ├── registry.ts           # Endpoint registry: all API groups, paths, routing, discovery deps
│   ├── discovery.ts          # Dynamic data discovery (find PUUIDs, match IDs, etc.)
│   ├── schema.ts             # Schema extraction: response -> schema JSON shape
│   ├── codegen.ts            # TypeScript generation from schema files
│   └── types.ts              # Internal types for the schema runner
├── schemas/                  # Output: one .schema.json per API group (committed)
│   ├── lol.summoner-v4.schema.json
│   ├── lol.match-v5.schema.json
│   ├── riot.account-v1.schema.json
│   └── ...
packages/whisper/
├── src/types/
│   ├── generated/            # Output: generated TypeScript interfaces
│   │   ├── lol.ts            # All LoL types
│   │   ├── tft.ts            # All TFT types
│   │   ├── val.ts            # All Valorant types
│   │   ├── lor.ts            # All LoR types
│   │   ├── riftbound.ts      # Riftbound types
│   │   ├── riot.ts           # Shared types (account-v1)
│   │   └── index.ts          # Re-exports
│   └── overrides/            # Hand-written types that replace generated
│       └── (initially empty, populated as needed)
```

### Pattern 1: Endpoint Registry
**What:** A centralized data structure defining every API group, its endpoints, routing type, and data discovery dependencies.
**When to use:** Always -- this is the source of truth for what the runner hits.
**Example:**
```typescript
interface EndpointGroup {
  /** API group name, e.g., 'summoner-v4' */
  name: string;
  /** Game prefix for file naming, e.g., 'lol', 'tft', 'riot' */
  game: 'lol' | 'tft' | 'val' | 'lor' | 'riftbound' | 'riot';
  /** Routing type */
  routing: 'platform' | 'regional';
  /** Endpoints to hit */
  endpoints: EndpointDef[];
  /** Whether this group requires RSO (skip if true) */
  rso?: boolean;
}

interface EndpointDef {
  /** Method ID for rate limiting, e.g., 'summoner-v4.getByPuuid' */
  methodId: string;
  /** URL path template, e.g., '/lol/summoner/v4/summoners/by-puuid/{puuid}' */
  path: string;
  /** Path parameter substitutions needed */
  params?: string[];
  /** What this endpoint returns (for schema naming) */
  responseName: string;
  /** Whether response is an array */
  isArray?: boolean;
}
```

### Pattern 2: Dynamic Discovery Chain
**What:** A multi-step discovery process that finds valid test data at runtime.
**When to use:** Before hitting endpoints that require path parameters.
**Example:**
```typescript
// Discovery chain:
// 1. league-v4/challengerleagues -> extract PUUIDs from entries
// 2. account-v1/by-puuid -> get Riot ID (gameName + tagLine)
// 3. summoner-v4/by-puuid -> get summoner data
// 4. match-v5/by-puuid/ids -> get match IDs
// 5. Use discovered data to fill path params for remaining endpoints

interface DiscoveredData {
  puuid: string;
  gameName: string;
  tagLine: string;
  matchId: string;      // LoL match
  tftMatchId: string;   // TFT match
  // ... other discovered IDs
}
```

### Pattern 3: Schema Extraction
**What:** Walk a JSON response recursively and produce a type description.
**When to use:** For every successful API response.
**Example:**
```typescript
// Input: { "puuid": "abc", "profileIconId": 123, "revisionDate": 1234567890, "name": null }
// Output schema:
{
  "name": "Summoner",
  "fields": {
    "puuid": { "type": "string" },
    "profileIconId": { "type": "integer" },
    "revisionDate": { "type": "integer" },
    "name": { "type": "string", "nullable": true }
  }
}
```

Schema type mapping:
- `typeof x === 'string'` -> `"string"`
- `typeof x === 'number'` -> `Number.isInteger(x) ? "integer" : "number"`
- `typeof x === 'boolean'` -> `"boolean"`
- `Array.isArray(x)` -> `"array"` with `items` describing element shape
- `typeof x === 'object' && x !== null` -> `"object"` with recursive `fields`
- `x === null` -> mark field as `nullable: true`, infer type from other responses or use `"unknown"`

### Pattern 4: Merge Multiple Responses
**What:** When the same endpoint is hit with different data, merge schemas to capture the union of all observed fields.
**When to use:** Fields that are conditionally present (e.g., `miniSeries` only appears for players in promotion).
**Example:**
```typescript
function mergeSchemas(existing: SchemaField, incoming: SchemaField): SchemaField {
  // If a field exists in one but not the other, mark as optional
  // If a field is null in one response, mark as nullable
  // Union of all observed fields = complete schema
}
```

### Anti-Patterns to Avoid
- **Hardcoding test data:** Accounts decay, PUUIDs become invalid. Always discover dynamically.
- **Parallel API calls without rate limiting:** Dev keys have 20 req/s. Dog-fooding the rate limiter handles this, but don't bypass it.
- **Non-deterministic JSON output:** Schema files MUST be sorted by key for stable git diffs. Use `JSON.stringify(schema, null, 2)` with pre-sorted keys.
- **Generating types for RSO-only endpoints:** Endpoints like `lor-deck-v1`, `lor-inventory-v1`, `lol-rso-match-v1`, and `account-v1/accounts/me` require OAuth tokens, not API keys. Skip these and use community schema as reference or manual stubs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Running TypeScript scripts | Custom build step | `tsx` | Zero config, handles ESM+TS natively |
| HTTP requests to Riot API | Raw fetch in scripts | `createClient()` from core | Dog-fooding validates Phase 2, gets free rate limiting |
| Rate limit management | Manual delays/sleeps | Whisper's RateLimiter | Already built, handles all three 429 types |
| JSON schema validation | Custom validator | Simple type inference from responses | We're generating schemas, not validating against them |
| TypeScript AST manipulation | ts-morph/TypeScript compiler API | String interpolation templates | Interfaces are simple enough that string templates work perfectly |

**Key insight:** The schema runner is deliberately simple tooling -- it walks JSON responses and emits interface text. The complexity is in the endpoint coverage and discovery strategy, not in the codegen itself.

## Complete Riot API Endpoint Registry

### LoL Endpoints (13 groups)
| API Group | Routing | Endpoints | Discovery Needs | Notes |
|-----------|---------|-----------|-----------------|-------|
| champion-mastery-v4 | platform | 4 | puuid | |
| champion-v3 | platform | 1 | none (no params) | Free rotation, always available |
| clash-v1 | platform | 5 | puuid, teamId, tournamentId | Live-state: may return empty arrays if no active clash |
| league-exp-v4 | platform | 1 | none (query by tier/division) | Good discovery source |
| league-v4 | platform | 6 | puuid, leagueId | Challenger endpoint = discovery source |
| lol-challenges-v1 | platform | 6 | puuid, challengeId | Config endpoints need no params |
| lol-rso-match-v1 | regional | 3 | RSO token | **SKIP: requires OAuth, not API key** |
| lol-status-v4 | platform | 1 | none | Always available |
| match-v5 | regional | 3 | puuid (for IDs), matchId | Key discovery target |
| spectator-v5 | platform | 2 | puuid | Live-state: may 404 if no active game |
| summoner-v4 | platform | 3 | puuid | Core discovery target |
| tournament-stub-v5 | regional | 3 | tournament provider | **SKIP or stub: requires tournament API access** |
| tournament-v5 | regional | 5 | tournament provider | **SKIP or stub: requires tournament API access** |

### TFT Endpoints (5 groups)
| API Group | Routing | Endpoints | Discovery Needs | Notes |
|-----------|---------|-----------|-----------------|-------|
| tft-league-v1 | platform | 6 | puuid | Challenger = discovery source |
| tft-match-v1 | regional | 2 | puuid, matchId | |
| tft-status-v1 | platform | 1 | none | Always available |
| tft-summoner-v1 | platform | 3 | puuid | RSO variant exists but standard still works |
| spectator-tft-v5 | platform | 2 | puuid | Live-state: may 404 |

### Valorant Endpoints (6 groups)
| API Group | Routing | Endpoints | Discovery Needs | Notes |
|-----------|---------|-----------|-----------------|-------|
| val-content-v1 | platform | 1 | none (locale param) | Always available |
| val-match-v1 | platform | 3 | puuid, matchId | Requires Valorant-approved key |
| val-ranked-v1 | platform | 1 | actId | |
| val-status-v1 | platform | 1 | none | Always available |
| val-console-match-v1 | platform | 3 | puuid, matchId | Console-specific |
| val-console-ranked-v1 | platform | 1 | actId | Console-specific |

### LoR Endpoints (5 groups)
| API Group | Routing | Endpoints | Discovery Needs | Notes |
|-----------|---------|-----------|-----------------|-------|
| lor-match-v1 | regional | 2 | puuid, matchId | |
| lor-ranked-v1 | regional | 1 | none | Leaderboard, always available |
| lor-status-v1 | platform | 1 | none | Always available |
| lor-deck-v1 | regional | 2 | RSO token | **SKIP: requires OAuth** |
| lor-inventory-v1 | regional | 1 | RSO token | **SKIP: requires OAuth** |

### Riftbound (1 group)
| API Group | Routing | Endpoints | Discovery Needs | Notes |
|-----------|---------|-----------|-----------------|-------|
| riftbound-content-v1 | platform | varies | none | New game, may have limited data |

### Shared (1 group)
| API Group | Routing | Endpoints | Discovery Needs | Notes |
|-----------|---------|-----------|-----------------|-------|
| account-v1 | regional | 5 | puuid, gameName/tagLine | 2 RSO endpoints (skip), 3 available |

### Summary
- **Total groups:** 31
- **Hittable with dev API key:** ~24 (skip RSO-only, tournament-access-only)
- **Always available (no params):** ~8 (status, content, rotations, configs, leaderboards)
- **Live-state dependent:** ~4 (spectator, clash -- may 404)

## Dynamic Discovery Strategy

### Recommended Discovery Chain

```
Step 1: league-v4/challengerleagues/by-queue/RANKED_SOLO_5x5 (platform: na1)
  -> Extract PUUIDs from entries (guaranteed data, always populated)
  -> Pick first entry's PUUID

Step 2: account-v1/accounts/by-puuid/{puuid} (regional: americas)
  -> Get gameName + tagLine for the discovered PUUID

Step 3: summoner-v4/summoners/by-puuid/{puuid} (platform: na1)
  -> Validate PUUID works, get summoner data

Step 4: match-v5/matches/by-puuid/{puuid}/ids (regional: americas)
  -> Get recent match IDs (need at least 1)

Step 5: Use discovered data to fill all remaining endpoints
```

### TFT Discovery (parallel chain)
```
Step 1: tft-league-v1/challenger (platform: na1) -> TFT PUUID
Step 2: tft-match-v1/matches/by-puuid/{puuid}/ids (regional: americas) -> TFT match ID
```

### Valorant Discovery
```
Step 1: val-content-v1/contents (platform: na1 or ap) -> actId for ranked
Step 2: val-ranked-v1/leaderboards/by-act/{actId} -> PUUID for match lookups
Note: val-match-v1 requires approved production key for most endpoints.
      May need to skip or use community schema reference.
```

### LoR Discovery
```
Step 1: lor-ranked-v1/leaderboards (regional: americas) -> player names
Step 2: lor-match-v1 requires PUUID -> use account-v1 lookup from ranked data
Note: LoR is in maintenance mode -- endpoints may return limited data.
```

### Handling Live-State Endpoints (Claude's Discretion)

**Recommendation: Best-effort with graceful fallback**

For spectator-v5, spectator-tft-v5, and clash-v1:
1. Attempt the API call using discovered PUUIDs
2. If 404 (no active game/clash), generate a stub schema from community schema reference
3. Mark the schema as `"source": "stub"` vs `"source": "live"` in schema metadata
4. Log clearly which endpoints returned live data vs stubs

This is better than skipping entirely (we still get type coverage) and better than requiring live games (fragile, unreliable).

## Schema JSON Format (Claude's Discretion)

**Recommendation: Purpose-built minimal format**

```json
{
  "$schema": "whisper-schema-v1",
  "group": "lol.summoner-v4",
  "source": "live",
  "capturedAt": "2026-03-17T00:00:00Z",
  "types": {
    "Summoner": {
      "fields": {
        "accountId": { "type": "string" },
        "profileIconId": { "type": "integer" },
        "revisionDate": { "type": "integer" },
        "id": { "type": "string" },
        "puuid": { "type": "string" },
        "summonerLevel": { "type": "integer" }
      }
    },
    "ChampionMastery": {
      "fields": {
        "championId": { "type": "integer" },
        "championLevel": { "type": "integer" },
        "championPoints": { "type": "integer" },
        "lastPlayTime": { "type": "integer" },
        "championPointsSinceLastLevel": { "type": "integer" },
        "championPointsUntilNextLevel": { "type": "integer" },
        "tokensEarned": { "type": "integer" },
        "markRequiredForNextLevel": { "type": "integer" },
        "puuid": { "type": "string" }
      }
    }
  }
}
```

**Type values:** `"string"`, `"integer"`, `"number"`, `"boolean"`, `"object"`, `"array"`, `"unknown"`

**Field modifiers:**
- `nullable: true` -- field can be null
- `optional: true` -- field not present in all responses
- `items: { ... }` -- for arrays, describes element type
- `fields: { ... }` -- for nested objects, recursive structure

## TypeScript Codegen Approach (Claude's Discretion)

**Recommendation: String interpolation with sorted output**

```typescript
function generateInterface(name: string, schema: TypeSchema): string {
  const lines: string[] = [];
  lines.push(`export interface ${name} {`);

  for (const [field, def] of Object.entries(schema.fields).sort()) {
    const tsType = mapToTsType(def);
    const optional = def.optional ? '?' : '';
    const nullable = def.nullable ? ' | null' : '';
    lines.push(`  ${field}${optional}: ${tsType}${nullable};`);
  }

  lines.push('}');
  return lines.join('\n');
}

function mapToTsType(def: FieldDef): string {
  switch (def.type) {
    case 'string': return 'string';
    case 'integer':
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'array': return `${mapToTsType(def.items!)}[]`;
    case 'object': return generateInlineOrRef(def);
    case 'unknown': return 'unknown';
  }
}
```

**Override mechanism:** Before generating a type, check if `src/types/overrides/{game}/{TypeName}.ts` exists. If so, skip generation and re-export from overrides instead.

**Output:** One file per game module in `src/types/generated/`:
- `lol.ts` -- all LoL interfaces
- `tft.ts` -- all TFT interfaces
- `val.ts` -- all Valorant interfaces
- `lor.ts` -- all LoR interfaces
- `riftbound.ts` -- Riftbound interfaces
- `riot.ts` -- shared interfaces (Account)
- `index.ts` -- barrel re-export

## CI / Diff Detection (Claude's Discretion)

**Recommendation: GitHub Actions workflow step**

```yaml
# In existing CI workflow
- name: Verify schemas are up to date
  if: env.RIOT_API_KEY  # Only run when key is available
  run: |
    pnpm generate-schema
    git diff --exit-code scripts/schemas/ packages/whisper/src/types/generated/
  env:
    RIOT_API_KEY: ${{ secrets.RIOT_API_KEY }}
```

For the auto-PR on drift, a separate scheduled workflow:
```yaml
name: Schema Drift Check
on:
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday 6am UTC
  workflow_dispatch:

jobs:
  check-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm build
      - run: pnpm generate-schema
        env:
          RIOT_API_KEY: ${{ secrets.RIOT_API_KEY }}
      - name: Check for changes
        id: diff
        run: |
          if ! git diff --quiet scripts/schemas/ packages/whisper/src/types/generated/; then
            echo "changed=true" >> "$GITHUB_OUTPUT"
          fi
      - name: Create PR
        if: steps.diff.outputs.changed == 'true'
        uses: peter-evans/create-pull-request@v7
        with:
          title: 'chore: update schemas for Riot API changes'
          branch: schema-drift-update
          commit-message: 'chore: regenerate schemas from live API'
```

## Common Pitfalls

### Pitfall 1: Dev Key Rate Limits
**What goes wrong:** 20 req/s and 100 req/2min is tight when hitting ~80+ endpoints sequentially.
**Why it happens:** Dev keys are intentionally restrictive.
**How to avoid:** Dog-food the rate limiter (locked decision). Run endpoints sequentially, not in parallel. Group by routing region to maximize throughput (all platform calls to na1, all regional to americas).
**Warning signs:** 429 errors during schema generation. If rate limiter is working, these should be handled automatically.

### Pitfall 2: Null vs Missing Fields
**What goes wrong:** JSON response has `"field": null` vs field entirely absent. These are different in TypeScript (`null` vs `undefined` with exactOptionalPropertyTypes).
**Why it happens:** Riot API returns null for some fields in some states (e.g., `miniSeries` only present during promos).
**How to avoid:** Track both nullable (field present but null) and optional (field absent in some responses) separately. Merge multiple responses to build complete picture.
**Warning signs:** TypeScript compilation errors after generation due to `exactOptionalPropertyTypes`.

### Pitfall 3: Empty Response Bodies
**What goes wrong:** Some endpoints return 204 No Content or empty arrays, giving no type information.
**Why it happens:** Status endpoints may have no incidents, spectator may have no featured games in rare cases.
**How to avoid:** For 204 responses, schema should be `void`. For empty arrays, need at least one non-empty response -- retry with different params or use community schema fallback.
**Warning signs:** Schema files with `"unknown"` types.

### Pitfall 4: Non-Deterministic JSON Output
**What goes wrong:** Schema files change order between runs, creating noisy git diffs.
**Why it happens:** JavaScript object key order is insertion-order, which varies by response.
**How to avoid:** Sort all object keys before writing JSON. Use a `sortKeys()` utility recursively.
**Warning signs:** Git diffs showing only reordered fields with no actual type changes.

### Pitfall 5: Valorant API Access Restrictions
**What goes wrong:** val-match-v1 returns 403 with standard dev keys.
**Why it happens:** Valorant match endpoints require an approved production key.
**How to avoid:** Handle gracefully -- attempt call, catch ForbiddenError, fall back to community schema or stub. Document which endpoints need production key.
**Warning signs:** ForbiddenError on Valorant match endpoints.

### Pitfall 6: LoR Maintenance Mode
**What goes wrong:** LoR endpoints may return empty data or be intermittently unavailable.
**Why it happens:** Legends of Runeterra is in maintenance/sunset mode.
**How to avoid:** Best-effort with fallback stubs. Don't fail the entire schema run if LoR endpoints are down.
**Warning signs:** Timeouts or 503 errors on LoR endpoints.

## Code Examples

### Using createClient for Schema Runner
```typescript
// Source: packages/whisper/src/core/client.ts
import { createClient } from '@wardbox/whisper';

const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  console.error('RIOT_API_KEY environment variable required');
  process.exit(1);
}

const client = createClient({
  apiKey,
  cache: false,  // No caching for schema generation
  // Rate limiter uses defaults (proactive, queue-based)
});

// Hit an endpoint
const response = await client.request(
  'na1',
  '/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5',
  'league-v4.getChallengerLeague',
);
```

### Schema Extraction from Response
```typescript
function extractSchema(value: unknown, name: string): TypeSchema {
  if (value === null) return { type: 'unknown', nullable: true };
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array', items: { type: 'unknown' } };
    return { type: 'array', items: extractSchema(value[0], `${name}Item`) };
  }
  if (typeof value === 'object') {
    const fields: Record<string, FieldDef> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      fields[key] = extractFieldDef(val);
    }
    return { type: 'object', fields };
  }
  if (typeof value === 'string') return { type: 'string' };
  if (typeof value === 'number') return { type: Number.isInteger(value) ? 'integer' : 'number' };
  if (typeof value === 'boolean') return { type: 'boolean' };
  return { type: 'unknown' };
}
```

### Deterministic JSON Write
```typescript
function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

function writeSchema(filePath: string, schema: object): void {
  const sorted = sortKeys(schema);
  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-written types from docs | Auto-generated from live API | Current (this phase) | Types always match actual responses |
| summoner-v4 with encrypted summonerId | summoner-v4 with PUUID only | Riot removed SummonerId June 2025 | All lookups use PUUID |
| Separate test suite + types | Schema runner = integration test + type source | Current design | Single tool serves dual purpose |

**Deprecated/outdated:**
- SummonerId-based summoner-v4 endpoints: Removed by Riot June 2025. Only PUUID-based lookups remain.
- match-v4: Fully replaced by match-v5 (regional routing).

## Open Questions

1. **Valorant match endpoint access**
   - What we know: val-match-v1 requires approved production key
   - What's unclear: Whether dev key can access any val-match endpoints, or if all return 403
   - Recommendation: Attempt with dev key, fall back to community schema stubs. Log clearly which endpoints need production key.

2. **Riftbound API maturity**
   - What we know: riftbound-content-v1 exists in the API explorer
   - What's unclear: How many endpoints, what the response shapes look like, whether dev keys have access
   - Recommendation: Best-effort discovery. If inaccessible, use stub. Riftbound is a new game, API may be in flux.

3. **Schema merging depth**
   - What we know: Multiple responses needed to capture optional/nullable fields accurately
   - What's unclear: How many responses are sufficient for a "complete" schema
   - Recommendation: Hit each endpoint at least once with valid data. For endpoints with conditional fields (league entries with/without miniSeries), try to get varied responses (different tiers). Accept that some optional fields may be missed -- community schema can fill gaps.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `packages/whisper/vitest.config.ts` |
| Quick run command | `pnpm vitest run scripts/generate-schema/` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCHEMA-01 | Schema extraction produces correct types from sample JSON | unit | `pnpm vitest run scripts/generate-schema/schema.test.ts -x` | No - Wave 0 |
| SCHEMA-01 | Endpoint registry covers all API groups | unit | `pnpm vitest run scripts/generate-schema/registry.test.ts -x` | No - Wave 0 |
| SCHEMA-02 | Codegen produces valid TypeScript from schema JSON | unit | `pnpm vitest run scripts/generate-schema/codegen.test.ts -x` | No - Wave 0 |
| SCHEMA-02 | Generated types compile without errors | smoke | `pnpm build` (tsdown compiles generated types) | Yes (build) |
| SCHEMA-02 | DTO suffix stripping and game prefixing | unit | `pnpm vitest run scripts/generate-schema/codegen.test.ts -t "naming" -x` | No - Wave 0 |
| SCHEMA-03 | Schema JSON output is deterministic (sorted keys) | unit | `pnpm vitest run scripts/generate-schema/schema.test.ts -t "deterministic" -x` | No - Wave 0 |
| SCHEMA-03 | Override files take precedence over generated | unit | `pnpm vitest run scripts/generate-schema/codegen.test.ts -t "override" -x` | No - Wave 0 |

**Note:** Full integration testing (SCHEMA-01 hitting live API) requires `RIOT_API_KEY` and is on-demand only. Unit tests above validate the schema extraction and codegen logic with sample data, no API key needed.

### Sampling Rate
- **Per task commit:** `pnpm vitest run scripts/generate-schema/`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green + `pnpm build` succeeds with generated types

### Wave 0 Gaps
- [ ] `scripts/generate-schema/schema.test.ts` -- covers SCHEMA-01 (extraction logic)
- [ ] `scripts/generate-schema/registry.test.ts` -- covers SCHEMA-01 (endpoint coverage)
- [ ] `scripts/generate-schema/codegen.test.ts` -- covers SCHEMA-02, SCHEMA-03
- [ ] Vitest config may need updating to include `scripts/` in test includes

## Sources

### Primary (HIGH confidence)
- Existing codebase: `packages/whisper/src/core/client.ts`, `http.ts`, `types.ts` -- Phase 2 client API
- `CLAUDE.md` -- project conventions, architecture, Riot API reference links
- `.planning/phases/03-schema-generation/03-CONTEXT.md` -- locked decisions
- Riot Developer Portal (developer.riotgames.com) -- rate limits (20/s, 100/2min dev key), endpoint listing
- MingweiSamuel/riotapi-schema OpenAPI spec (gh-pages branch) -- endpoint routing types, DTO shapes

### Secondary (MEDIUM confidence)
- Riot API endpoint routing (platform vs regional) -- confirmed via community schema for most groups, some inferred from path patterns (/lol/ = platform, match-v5 = regional)
- Valorant match endpoint restrictions -- commonly reported in community, verified pattern

### Tertiary (LOW confidence)
- Riftbound API surface -- new game, limited documentation. Endpoint count and response shapes unverified.
- LoR maintenance mode impact -- community reports, not officially documented as deprecated.
- val-console-match-v1 / val-console-ranked-v1 -- limited documentation, may have same restrictions as val-match-v1.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- tsx is well-known, dog-fooding client is locked decision, string interpolation codegen is proven approach
- Architecture: HIGH -- endpoint registry + discovery chain + schema extraction is a well-understood pattern. File structure follows CONTEXT.md decisions.
- Pitfalls: HIGH -- rate limits, null vs missing, deterministic output, Valorant access restrictions are all well-documented gotchas
- Endpoint coverage: MEDIUM -- most routing types confirmed, but Riftbound and some Valorant endpoints have limited documentation

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (Riot API is stable, but individual endpoint availability can change)
