# Architecture Research

**Domain:** TypeScript API wrapper library (Riot Games API)
**Researched:** 2026-03-17
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Consumer Layer                               │
│  import { MatchV5 } from 'whisper/lol'                              │
│  import { AccountV1 } from 'whisper/riot'                           │
│  import { MatchV1 } from 'whisper/val'                              │
├─────────────────────────────────────────────────────────────────────┤
│                        Game Module Layer                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ src/lol/ │ │ src/tft/ │ │ src/val/ │ │ src/lor/ │ │ src/riot/│  │
│  │ 13 groups│ │ 5 groups │ │ 6 groups │ │ 5 groups │ │ account  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       └────────────┴────────────┴─────────────┴────────────┘        │
│                                │                                     │
├────────────────────────────────┼────────────────────────────────────┤
│                        Core Layer (src/core/)                        │
│                                │                                     │
│  ┌───────────────┐  ┌──────────┴──────┐  ┌────────────────────────┐ │
│  │  HTTP Client  │←─│  Middleware      │  │   Cache Layer          │ │
│  │  (fetch wrap) │  │  Pipeline        │  │   CacheAdapter iface   │ │
│  └───────┬───────┘  │  (logging,       │  │   MemoryCache (default)│ │
│          │          │   metrics,       │  │   TTL per method       │ │
│          │          │   retries,       │  └────────────┬───────────┘ │
│          │          │   custom auth)   │               │             │
│          │          └─────────────────┘               │             │
│          │                                             │             │
│  ┌───────┴───────┐  ┌─────────────────┐  ┌────────────┴───────────┐ │
│  │  Rate Limiter │  │  Router         │  │   Type System          │ │
│  │  App + Method │  │  Platform│Region│  │   Platform | Regional  │ │
│  │  Proactive    │  │  URL builder    │  │   enforced at compile  │ │
│  │  queue        │  │  header inject  │  │   time                 │ │
│  └───────┬───────┘  └─────────────────┘  └────────────────────────┘ │
│          │                                                            │
├──────────┼─────────────────────────────────────────────────────────┤
│          ▼         External                                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Riot Games API (HTTPS)                            │  │
│  │  api.riotgames.com  /  {platform}.api.riotgames.com           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Game modules (`src/lol/`, etc.) | Typed wrappers for each API group, enforce routing types, set cache TTLs | One file per API group (match-v5.ts, summoner-v4.ts) |
| HTTP client | Execute fetch requests, inject headers, parse responses, propagate errors | Thin wrapper over native `fetch` with typed error classes |
| Rate limiter | Parse `X-App-Rate-Limit` / `X-Method-Rate-Limit` headers, proactively queue requests before limits hit | Two-level token bucket: app-level and method-level per platform |
| Router | Map platform values to base URLs, map platform to its parent region, build endpoint paths | Pure functions, constants map, no side effects |
| Cache layer | Short-circuit repeated requests, support configurable TTL per method | Interface + in-memory default; adapters for Redis, file, etc. |
| Middleware pipeline | Composable request/response transformation: logging, metrics, retries, custom auth | Array of `RequestMiddleware` / `ResponseMiddleware` functions executed in sequence |
| Type system | Enforce correct routing type at compile time; prevent platform/regional mixups | Branded types or discriminated union literal types for `PlatformRoute` vs `RegionalRoute` |
| Schema generator | Hit live endpoints, capture response shapes, emit `.schema.json`, generate TypeScript interfaces | CLI script run with a real API key; not part of runtime bundle |

## Recommended Project Structure

```
whisper/
├── src/
│   ├── core/
│   │   ├── client.ts            # HTTP client: fetch wrapper, error handling
│   │   ├── rate-limiter.ts      # Proactive rate limiter: header parser + token buckets
│   │   ├── cache.ts             # CacheAdapter interface + MemoryCache implementation
│   │   ├── middleware.ts        # Middleware pipeline types and executor
│   │   ├── router.ts            # URL construction, platform→region mapping
│   │   └── errors.ts            # RiotApiError, RateLimitError, AuthError, etc.
│   │
│   ├── types/
│   │   ├── routing.ts           # PlatformRoute, RegionalRoute literal types
│   │   ├── queues.ts            # QueueType enum
│   │   ├── tiers.ts             # Tier / Division enums
│   │   ├── generated/           # Auto-generated from schema — do not hand-edit
│   │   └── overrides/           # Hand-written unions, enums, edge cases
│   │
│   ├── lol/
│   │   ├── index.ts             # Re-exports for whisper/lol subpath
│   │   ├── match-v5.ts          # MatchV5 class — uses RegionalRoute
│   │   ├── summoner-v4.ts       # SummonerV4 class — uses PlatformRoute
│   │   ├── champion-mastery-v4.ts
│   │   ├── champion-v3.ts
│   │   ├── clash-v1.ts
│   │   ├── league-v4.ts
│   │   ├── spectator-v5.ts
│   │   ├── status-v4.ts
│   │   ├── challenges-v1.ts
│   │   ├── tournament-stub-v5.ts
│   │   ├── tournament-v5.ts
│   │   ├── item-sets-v1.ts
│   │   └── *.test.ts            # Test file per API group
│   │
│   ├── tft/
│   │   ├── index.ts
│   │   ├── match-v1.ts          # RegionalRoute
│   │   ├── summoner-v1.ts       # PlatformRoute
│   │   ├── league-v1.ts
│   │   ├── status-v1.ts
│   │   └── champion-mastery-v1.ts
│   │
│   ├── val/
│   │   ├── index.ts
│   │   ├── match-v1.ts          # RegionalRoute (PlatformRoute for other val)
│   │   ├── ranked-v1.ts
│   │   ├── status-v1.ts
│   │   ├── content-v1.ts
│   │   ├── league-v1.ts
│   │   └── last-known-positions-v1.ts
│   │
│   ├── lor/
│   │   ├── index.ts
│   │   ├── match-v1.ts          # RegionalRoute
│   │   ├── ranked-v1.ts
│   │   ├── status-v1.ts
│   │   ├── deck-v1.ts
│   │   └── inventory-v1.ts
│   │
│   ├── riftbound/
│   │   ├── index.ts
│   │   └── status-v1.ts
│   │
│   └── riot/
│       ├── index.ts
│       └── account-v1.ts        # RegionalRoute (shared across games)
│
├── scripts/
│   └── generate-schema/
│       ├── runner.ts            # Hits all endpoints, writes .schema.json
│       └── codegen.ts           # Reads .schema.json, writes types/generated/
│
├── docs/
│   └── ...                      # Docs site (separate pnpm workspace)
│
├── package.json                 # exports map for subpath imports
└── tsconfig.json
```

### Structure Rationale

- **`src/core/`:** All infrastructure lives here — nothing in game modules imports from another game module. Core is the only shared dependency.
- **`src/lol/`, `src/tft/`, etc.:** Isolated per-game. Each directory exports exactly what consumers need via its `index.ts`. Tree-shaking works because bundlers can eliminate entire game directories if unused.
- **`src/types/generated/`:** Never hand-edited. The schema generator owns this. Keeps generated and hand-written types visually separated.
- **`src/types/overrides/`:** For cases where the generator produces a `string` but the real type is a known union — hand-write a more precise type here and it takes precedence.
- **`scripts/`:** Dev-time tooling only — not part of the published bundle.

## Architectural Patterns

### Pattern 1: Proactive Rate Limiter (Token Bucket, Two-Level)

**What:** Parse `X-App-Rate-Limit` and `X-Method-Rate-Limit` response headers to learn actual limits. Maintain two sets of in-memory token buckets: one for app-level (per platform) and one for method-level (per platform + endpoint). Before issuing any request, deduct from both buckets. If either bucket is empty, queue the request until tokens refill.

**When to use:** Always — this is the core differentiator. Reactive retry-on-429 is easier to implement but causes actual rate limit violations, which Riot penalizes.

**Trade-offs:** Slightly more complex state management. Token counts must be initialized from the first successful response (headers tell you the bucket sizes). Until the first response, assume conservative limits or accept the first few requests may 429 and seed the buckets from the Retry-After header.

**Example:**
```typescript
// Header format: "100:1,1000:10" means 100/1s and 1000/10s
function parseRateLimitHeader(header: string): Bucket[] {
  return header.split(',').map(pair => {
    const [limit, windowSeconds] = pair.split(':').map(Number)
    return { limit, windowSeconds, tokens: limit, resetAt: Date.now() + windowSeconds * 1000 }
  })
}

class RateLimiter {
  private appBuckets = new Map<PlatformRoute, Bucket[]>()
  private methodBuckets = new Map<string, Bucket[]>() // key: `${platform}:${method}`

  async acquire(platform: PlatformRoute, method: string): Promise<void> {
    await this.waitForTokens(this.appBuckets.get(platform) ?? [])
    await this.waitForTokens(this.methodBuckets.get(`${platform}:${method}`) ?? [])
  }

  updateFromResponse(platform: PlatformRoute, method: string, headers: Headers): void {
    const appLimit = headers.get('X-App-Rate-Limit')
    const methodLimit = headers.get('X-Method-Rate-Limit')
    const appCount = headers.get('X-App-Rate-Limit-Count')
    const methodCount = headers.get('X-Method-Rate-Limit-Count')
    // Seed or refresh buckets from headers
  }
}
```

### Pattern 2: Type-Safe Routing via Branded Literal Types

**What:** Define `PlatformRoute` and `RegionalRoute` as distinct literal union types. Every API method is typed to accept exactly one routing type. Passing a platform value to a regional endpoint is a compile-time error, not a runtime 404.

**When to use:** Always — Riot's most confusing footgun is calling `match-v5` with a platform like `'na1'` and getting a 404. Make it impossible.

**Trade-offs:** Slightly more type machinery to set up. Pays off immediately for every consumer.

**Example:**
```typescript
export type PlatformRoute =
  | 'na1' | 'br1' | 'la1' | 'la2'
  | 'jp1' | 'kr'
  | 'me1' | 'eun1' | 'euw1' | 'tr1' | 'ru'
  | 'oc1' | 'ph2' | 'sg2' | 'th2' | 'tw2' | 'vn2'

export type RegionalRoute = 'americas' | 'europe' | 'asia' | 'sea'

// Router utility — users can convert without looking up docs
export const PLATFORM_TO_REGION: Record<PlatformRoute, RegionalRoute> = {
  na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas',
  jp1: 'asia', kr: 'asia',
  eun1: 'europe', euw1: 'europe', tr1: 'europe', ru: 'europe', me1: 'europe',
  oc1: 'sea', ph2: 'sea', sg2: 'sea', th2: 'sea', tw2: 'sea', vn2: 'sea',
}

// API method types enforce the correct routing type
class MatchV5 {
  async getMatch(region: RegionalRoute, matchId: string): Promise<Match> { ... }
  // Calling with `'na1'` fails at compile time — not a RegionalRoute
}

class SummonerV4 {
  async getBySummonerId(platform: PlatformRoute, summonerId: string): Promise<Summoner> { ... }
  // Calling with `'americas'` fails at compile time — not a PlatformRoute
}
```

### Pattern 3: Cache Adapter Interface

**What:** Define a minimal `CacheAdapter` interface that any storage backend can implement. Ship a `MemoryCache` as the default. Users who need Redis, file-based, or distributed caching implement the interface themselves or use community adapters.

**When to use:** Always — different deployment contexts have different caching needs. A bot running on a VPS wants Redis. An edge function can only use in-memory.

**Trade-offs:** Slightly more boilerplate in the interface definition. But it means zero runtime dependencies — the Redis client is never in the bundle unless the user explicitly adds it.

**Example:**
```typescript
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlMs: number): Promise<void>
  delete(key: string): Promise<void>
}

// Per-method TTL configuration
export interface MethodCacheConfig {
  ttlMs: number  // 0 = no cache
}

// In each API class, method-level TTL defaults
const DEFAULT_TTL: Record<string, number> = {
  'summoner-v4.getBySummonerId': 5 * 60 * 1000,  // 5 min
  'match-v5.getMatch': 60 * 60 * 1000,           // 1 hour (immutable)
  'spectator-v5.getCurrentGame': 0,               // never cache live data
}
```

### Pattern 4: Middleware Pipeline

**What:** An ordered array of middleware functions that wrap each HTTP request. Each middleware receives the request context, can modify it, call `next()`, and observe or transform the response. Logging, metrics, custom auth headers, and retry logic all live here.

**When to use:** For cross-cutting concerns. Keeps the HTTP client clean and lets users inject behavior without forking the library.

**Trade-offs:** Adds indirection to the request path. Stack traces are slightly harder to read. Worth it for the composability.

**Example:**
```typescript
export interface RequestContext {
  url: string
  init: RequestInit
  platform: PlatformRoute | RegionalRoute
  method: string  // e.g. 'match-v5.getMatch'
}

export type Middleware = (
  ctx: RequestContext,
  next: (ctx: RequestContext) => Promise<Response>
) => Promise<Response>

// Usage
const client = new WhisperClient({
  apiKey: process.env.RIOT_API_KEY,
  middleware: [
    loggingMiddleware,
    metricsMiddleware,
    customRetryMiddleware,
  ]
})
```

### Pattern 5: Subpath Exports for Tree Shaking

**What:** Use the `exports` field in `package.json` to expose per-game entry points. Bundlers can then eliminate entire game modules that are never imported.

**When to use:** Always for published libraries with multiple independent modules.

**Trade-offs:** Requires `moduleResolution: "bundler"` or `"node16"` in consumer tsconfigs. Standard in 2025.

**Example:**
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./lol": "./dist/lol/index.js",
    "./tft": "./dist/tft/index.js",
    "./val": "./dist/val/index.js",
    "./lor": "./dist/lor/index.js",
    "./riftbound": "./dist/riftbound/index.js",
    "./riot": "./dist/riot/index.js"
  },
  "sideEffects": false
}
```

## Data Flow

### Request Flow (cache miss)

```
Consumer calls: matchV5.getMatch('americas', 'NA1_12345')
    │
    ▼
[Game Module] Validate types, build cache key, check cache
    │ (miss)
    ▼
[Cache Layer] Returns null
    │
    ▼
[Rate Limiter] acquire(platform, 'match-v5.getMatch') — waits if bucket empty
    │
    ▼
[Middleware Pipeline] Execute pre-request middleware (logging, custom headers)
    │
    ▼
[HTTP Client] Build URL via Router, inject X-Riot-Token header, call fetch()
    │
    ▼
[Riot API] Returns response with rate limit headers
    │
    ▼
[HTTP Client] Check status code — 4xx/5xx → typed error
    │
    ▼
[Rate Limiter] updateFromResponse() — refresh token bucket counts
    │
    ▼
[Middleware Pipeline] Execute post-response middleware (logging, metrics)
    │
    ▼
[Game Module] Parse JSON into typed response, write to cache with TTL
    │
    ▼
Consumer receives: typed Match object
```

### Request Flow (cache hit)

```
Consumer calls: matchV5.getMatch('americas', 'NA1_12345')
    │
    ▼
[Game Module] Build cache key, check cache
    │ (hit)
    ▼
[Cache Layer] Returns cached Match object
    │
    ▼
Consumer receives: typed Match object
    (Rate limiter and HTTP client never invoked)
```

### Rate Limiter State Machine

```
New platform first seen
    │
    ▼
[Uninitialized] — assume conservative limits, allow request through
    │
    ▼ (response headers received)
[Initialized] — buckets seeded from X-App-Rate-Limit / X-Method-Rate-Limit
    │
    ├─ tokens available → deduct and proceed
    │
    └─ tokens exhausted → enqueue request, schedule refill
                              │
                              ▼ (window expires)
                         Refill tokens → drain queue
```

### Key Data Flows

1. **API key injection:** Client holds the key as `string | (() => Promise<string>)`. Before each request, the HTTP client resolves the key (calling the async function if needed) and injects it as `X-Riot-Token`. Never stored in game modules.

2. **Rate limit propagation:** Headers from every response flow back to the rate limiter to keep token counts accurate. This is the mechanism that makes proactive limiting work — without it, buckets would be guesses.

3. **Type generation:** The schema generator runs separately (dev-time, requires `RIOT_API_KEY`). It writes `.schema.json` files per endpoint. The codegen step reads those and emits TypeScript interfaces into `src/types/generated/`. These files are committed to the repo but not hand-edited.

## Scaling Considerations

This is a client-side library, not a server. "Scaling" here means the library performing well under high request volume from the consumer's application.

| Concern | Low Volume (personal bot) | High Volume (data pipeline) | Notes |
|---------|--------------------------|----------------------------|-------|
| Rate limiting | In-memory buckets sufficient | In-memory still fine if single process | Rate limits are per-API-key, not per-instance |
| Cache | MemoryCache default | Redis adapter, external cache | Shared cache avoids duplicate API calls across processes |
| API key | Single key string | Key rotation via async function | Riot personal keys have lower limits — production keys much higher |
| Concurrency | Sequential queue is fine | Need concurrent execution across methods | Method-level buckets are independent — different methods can run in parallel |

### Scaling Priorities

1. **First bottleneck — rate limit accuracy:** If multiple processes share one API key, in-memory buckets in each process diverge from actual state. Fix: use a Redis-backed rate limiter or proxy all requests through a single process.

2. **Second bottleneck — cache miss storms:** High-volume pipelines pulling the same data repeatedly. Fix: Redis cache adapter with appropriate TTLs.

## Anti-Patterns

### Anti-Pattern 1: Reactive 429 Retry

**What people do:** Issue the request, catch a 429 response, sleep for `Retry-After` seconds, retry.

**Why it's wrong:** Riot uses 429s as a penalty mechanism. Repeatedly hitting the limit degrades your API key's standing. It also wastes time — you've already waited for the limit to expire when you could have queued proactively.

**Do this instead:** Read `X-App-Rate-Limit` and `X-Method-Rate-Limit` from every successful response to learn the bucket sizes. Maintain token counts in memory and queue before the limit is reached.

### Anti-Pattern 2: Mixed Routing Types at Runtime

**What people do:** Accept any `string` for routing, let callers pass `'na1'` to `match-v5`, and surface a confusing 404 at runtime.

**Why it's wrong:** The Riot API silently returns 404 or routes incorrectly when you use a platform where a region is expected. This is one of the most common errors new developers hit.

**Do this instead:** Use separate literal union types for `PlatformRoute` and `RegionalRoute`. Type every API method signature to accept exactly one. The TypeScript compiler rejects invalid routing before any code runs.

### Anti-Pattern 3: One Giant Client Class

**What people do:** Put all 31 API groups as methods on a single `RiotClient` class.

**Why it's wrong:** Kills tree shaking. Every consumer gets the entire library in their bundle even if they only use match data.

**Do this instead:** One file per API group, per-game subpath exports. Consumers `import { MatchV5 } from 'whisper/lol'` and bundlers eliminate everything else.

### Anti-Pattern 4: Hand-Writing Response Types

**What people do:** Manually transcribe Riot API response shapes into TypeScript interfaces.

**Why it's wrong:** Riot changes response shapes without always updating docs. Hand-written types go stale silently — you get a runtime error when you try to access a field that was renamed.

**Do this instead:** Hit the live API, capture real responses, generate types from actual data. The schema generator doubles as a regression test — if Riot changes a shape, the diff is immediately visible.

### Anti-Pattern 5: Caching Live Game Data

**What people do:** Apply the same TTL to all endpoints, including spectator (live game) data.

**Why it's wrong:** Live game data changes every 30 seconds. A stale cache gives users outdated game state, which is actively misleading.

**Do this instead:** Set `ttlMs: 0` on spectator endpoints by default. Make TTLs configurable per method but choose safe defaults.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Riot Games API | Native `fetch`, `X-Riot-Token` header auth | Base URLs per platform/region — see routing constants |
| Redis (optional) | `CacheAdapter` interface — user provides client | Not a runtime dep; user installs ioredis if they want Redis cache |
| Custom auth provider | Async API key function `() => Promise<string>` | Enables key rotation, vault integrations, multi-key strategies |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Game modules → Core | Direct function calls — game modules import from `src/core/` | Never the reverse; core has no game-specific knowledge |
| Game modules → each other | Never — isolated | Cross-game concerns (account-v1) live in `src/riot/` |
| HTTP client → Rate limiter | `acquire()` before request, `updateFromResponse()` after | Rate limiter is stateful; HTTP client drives state transitions |
| HTTP client → Middleware | Pipeline executor calls each middleware in sequence | Middleware array is configured at client construction time |
| Cache → Game modules | Game modules check cache before calling HTTP client | Cache adapter interface is injected; modules don't know the backend |
| Schema generator → Types | File I/O — generator writes `.schema.json`, codegen reads and emits `.ts` | Dev-time only; not part of runtime |

## Build Order Implications

Components have hard dependencies that dictate build order:

```
1. Types (routing.ts, errors.ts)           ← no dependencies
2. Router (router.ts)                       ← depends on routing types
3. Cache (cache.ts)                         ← depends on nothing
4. Rate Limiter (rate-limiter.ts)           ← depends on routing types
5. Middleware pipeline (middleware.ts)      ← depends on routing types
6. HTTP Client (client.ts)                 ← depends on rate limiter, cache, middleware, router
7. Individual API group classes             ← depends on HTTP client + types
8. Subpath index files (lol/index.ts, etc) ← depends on API group classes
9. Schema generator (scripts/)             ← depends on API client (uses it to hit endpoints)
10. Type generation (generated/)           ← depends on schema generator output
11. Docs site                              ← depends on all source types
```

**Phase recommendation:** Build layers 1-6 (core) first. Nothing in the game module layer can be tested without the HTTP client. The schema generator and type generation are dev tooling that comes after the runtime is stable.

## Sources

- [Riot API Rate Limiting docs](https://hextechdocs.dev/rate-limiting/) — HIGH confidence
- [Riot API Routing guide](https://darkintaqt.com/blog/routing) — HIGH confidence (all platform/region values)
- [@fightmegg/riot-rate-limiter architecture](https://github.com/fightmegg/riot-rate-limiter) — MEDIUM confidence (reference implementation, reactive approach)
- [@fightmegg/riot-api structure](https://github.com/fightmegg/riot-api) — MEDIUM confidence (reference implementation)
- [Twisted architecture](https://github.com/Sansossio/twisted) — MEDIUM confidence (reference implementation)
- [Riot API Libraries index](https://riot-api-libraries.readthedocs.io/en/latest/libraries.html) — HIGH confidence (ecosystem survey)
- [Tree shaking TypeScript libraries](https://arrangeactassert.com/posts/building-typescript-libraries/) — HIGH confidence
- [Subpath exports pattern](https://dev.to/receter/organize-your-library-with-subpath-exports-4jb9) — HIGH confidence
- [HTTP client patterns — fetch interceptors](https://agentfactory.panaversity.org/docs/TypeScript-Language-Realtime-Interaction/runtime-environments-http/http-client-patterns) — MEDIUM confidence

---
*Architecture research for: TypeScript Riot Games API wrapper library*
*Researched: 2026-03-17*
