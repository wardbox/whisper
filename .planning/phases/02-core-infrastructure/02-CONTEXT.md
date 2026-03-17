# Phase 2: Core Infrastructure - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Proactive rate limiter, HTTP client, cache, and middleware pipeline. A developer can instantiate a client with an API key (string or async function), make a request, and have rate limits handled proactively — no 429s under normal usage, and all three 429 types handled correctly when limits are exceeded.

</domain>

<decisions>
## Implementation Decisions

### Client API shape
- `createClient({ apiKey, cache, rateLimiter, middleware })` — single options object, no builder or class
- One shared client across all games — game modules accept client as parameter: `lol.summoner(client).getByPuuid('na1', puuid)`
- Rate limits and cache shared across games (matches how Riot's API key works — one key, shared limits)
- Async key rotation: cache the key from first call, re-fetch on 401/403 auth failure and retry
- Core primitives exported from `@wardbox/whisper/core` (RateLimiter, MemoryCache, etc.) for advanced users
- `createClient` exported from `@wardbox/whisper` root

### Error handling model
- Custom error class hierarchy with instanceof checks
- `RiotApiError` (base for any non-2xx) with subclasses:
  - `RateLimitError` (429)
  - `NotFoundError` (404)
  - `ForbiddenError` (401/403)
  - `ServiceUnavailableError` (503)
- Uncommon status codes caught via base `RiotApiError` with `.status` check
- Full raw response detail on errors: status, statusText, riotMessage, headers, url (API key redacted), method

### Rate limiter behavior
- Token bucket algorithm, synced from Riot's `X-App-Rate-Limit`, `X-Method-Rate-Limit`, `X-Rate-Limit-Count` headers
- Default: silent queue + retry — user's await just takes longer when rate limited
- Configurable: `throwOnLimit: true` to throw `RateLimitError` immediately instead of queuing
- Configurable max queue size (default 100) and per-request timeout (default 30s)
- If queue full OR timeout exceeded: throws `RateLimitError` even in silent mode
- Event callbacks for observability: `onRateLimit(scope, retryAfter)`, `onRetry(request, attempt)`
- Opt-out with `rateLimiter: false` to disable entirely (proxy scenarios, testing)

### Cache
- Adapter interface: `get<T>(key): Promise<T | undefined>`, `set<T>(key, value, ttl): Promise<void>`, `delete(key): Promise<void>`, `has(key): Promise<boolean>`
- Default: in-memory `MemoryCache` (Map-based)
- Per-method TTL via pattern matching in client config: `{ 'summoner': 3600, 'match': 60, 'spectator': 0, default: 300 }`
- Opt-out with `cache: false` — consistent with rate limiter disable pattern

### Middleware pipeline
- Pre-request + post-response hooks: `onRequest(req)` and `onResponse(res, req)`
- Middleware is an object with optional hooks — return modified req/res or pass through
- Registered as array: `middleware: [logger, metrics]`
- Pipeline executes in order for requests, reverse order for responses

### Claude's Discretion
- Internal HTTP client implementation details (fetch wrapper)
- Token bucket implementation specifics (refill timing, bucket granularity)
- Cache key generation strategy (API-key-aware per CACHE-04)
- Memory management for in-memory cache (eviction strategy)
- Middleware execution error handling
- Service-level 429 backoff strategy specifics (exponential backoff with jitter, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value prop, constraints, zero-dep requirement
- `.planning/REQUIREMENTS.md` — HTTP-01 through HTTP-04, RATE-01 through RATE-03, CACHE-01 through CACHE-04
- `.planning/ROADMAP.md` — Phase 2 success criteria (5 criteria that must be TRUE)

### Riot API
- `CLAUDE.md` — Riot API reference links, rate limiting guide URL, routing values
- Riot rate limiting guide: https://developer.riotgames.com/docs/portal#web-apis_rate-limiting
- Riot routing values: https://developer.riotgames.com/docs/portal#web-apis_routing-values

### Prior phase context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Routing type decisions, export structure, TypeScript config

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/whisper/src/types/platform.ts` — PlatformRoute literal union type + PLATFORM constants
- `packages/whisper/src/types/regional.ts` — RegionalRoute literal union type + REGIONAL constants
- `packages/whisper/src/types/routing.ts` — `toRegional()` platform-to-regional mapping utility
- `packages/whisper/src/types/index.ts` — Re-exports all type primitives

### Established Patterns
- String literal unions for routing types (no branded types, no enums)
- NodeNext module resolution with explicit .js extensions
- ES2022 target, strict TypeScript config
- Dual ESM+CJS build via tsdown

### Integration Points
- `packages/whisper/src/` — core/ directory to be created here alongside existing types/ and game dirs
- Game module stubs (lol/, tft/, val/, lor/, riftbound/, riot/) will consume the client from core/
- Package subpath exports need `@wardbox/whisper/core` entry added

</code_context>

<specifics>
## Specific Ideas

- Client feel: `createClient({ apiKey: '...' })` — one call, sensible defaults, everything works
- Game module usage: `lol.summoner(client).getByPuuid('na1', puuid)` — client passed in, tree-shaking preserved
- Disable pattern: `{ rateLimiter: false, cache: false }` — consistent opt-out across features
- Error catch pattern: `instanceof RateLimitError` for specific, `instanceof RiotApiError` for general
- Key rotation: invisible to users — cached key, auto-refresh on auth failure
- Rate limit callbacks: optional `onRateLimit` and `onRetry` for observability without polling

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-infrastructure*
*Context gathered: 2026-03-17*
