# Pitfalls Research

**Domain:** Riot Games API TypeScript wrapper library (npm)
**Researched:** 2026-03-17
**Confidence:** HIGH (rate limiting, routing, ID systems); MEDIUM (type generation, bundle/ESM); LOW (specific TFT/LoR quirks not well documented)

---

## Critical Pitfalls

### Pitfall 1: Reactive-Only Rate Limiting (Retry on 429)

**What goes wrong:**
The wrapper only handles 429 responses after the fact — queueing a retry after reading `Retry-After`. Under any meaningful load this burns requests, hits Riot's "bad actor" threshold faster, and still serves errors to users during recovery periods. Worse, if the implementation retries in a tight loop without the header, it triggers a retry storm.

**Why it happens:**
The "simplest correct thing" is: hit 429, wait, retry. Developers find this pattern in tutorials and copy it. The proactive alternative — parsing `X-App-Rate-Limit`, `X-Method-Rate-Limit`, and `X-App-Rate-Limit-Count` / `X-Method-Rate-Limit-Count` headers from every response to maintain a local state machine — requires significantly more upfront design.

**How to avoid:**
- Parse all four rate limit headers on every successful response, not just 429s.
- Maintain per-region, per-method token buckets based on the header values.
- Before dispatching a request, check if the bucket allows it; if not, queue and delay.
- Still handle 429 defensively (service-level limits can fire even with a perfect proactive implementation) but treat it as an exceptional fallback, not the primary strategy.
- `X-Rate-Limit-Count` is deprecated. Use `X-App-Rate-Limit-Count` and `X-Method-Rate-Limit-Count`.

**Warning signs:**
- Tests that only assert "we get a response" without asserting rate limit headers are parsed.
- A rate limiter with no in-memory state between requests.
- Unit tests that never exercise the queuing path.

**Phase to address:** Core infrastructure phase (rate limiter + HTTP client). This must be correct before any game endpoints are built. If the core ships wrong, all 31 modules inherit the problem.

---

### Pitfall 2: Conflating the Three 429 Types

**What goes wrong:**
Riot issues 429s for three distinct reasons, each requiring different handling:
1. **Application rate limit** — your key has exceeded its global quota. `X-Rate-Limit-Type: application`, `Retry-After` present.
2. **Method rate limit** — you have exceeded the per-endpoint quota. `X-Rate-Limit-Type: method`, `Retry-After` present.
3. **Service rate limit** — Riot's underlying service is overloaded (shared across all keys). No `X-Rate-Limit-Type` header, no `Retry-After`.

A single "if 429, wait `Retry-After` or 5 seconds" handler treats all three identically. For service-level 429s, this under-waits (the service may need longer recovery) or silently ignores the type. It also fails to update the correct internal bucket (app vs. method), so the limiter's state drifts from reality.

**Why it happens:**
Documentation makes all three look equivalent. The missing header case is subtle — developers only learn about it when hitting service limits in production.

**How to avoid:**
- Always inspect `X-Rate-Limit-Type` before choosing recovery behavior.
- If the header is absent on a 429, treat as service-level: apply exponential backoff (not a fixed delay), do not update app/method bucket state.
- If header is `application` or `method`, use `Retry-After`, update the corresponding internal bucket to the full limit, and re-queue the request.
- Fall back to a default delay (5s minimum, per community practice) when `Retry-After` is also absent.

**Warning signs:**
- Rate limiter code with a single `if (status === 429)` branch.
- Tests that mock only one type of 429.
- No distinction between `application` and `method` bucket updates on 429.

**Phase to address:** Core infrastructure phase. Test all three 429 variants in unit tests before integration testing begins.

---

### Pitfall 3: Hardcoding Rate Limit Values

**What goes wrong:**
The wrapper ships with hardcoded values like "20 req/s, 100 req/2min" as the starting bucket size. Riot changes these without notice. When limits increase (good), the library throttles more than necessary, silently degrading throughput for users. When they decrease (bad), the library over-fires and causes real 429s.

**Why it happens:**
Riot publishes default limits in documentation so developers use those numbers for convenience rather than reading headers at runtime.

**How to avoid:**
- Use headers as the authoritative source of truth. Initialize buckets conservatively (1 request capacity) and expand to the real limit from the first response headers.
- Do not seed the bucket from a config constant or documentation value.

**Warning signs:**
- Constants like `APP_RATE_LIMIT_PER_SECOND = 20` in the codebase.
- Bucket initialization that does not wait for the first successful response.

**Phase to address:** Core infrastructure phase. Enforce in code review: no rate limit constants.

---

### Pitfall 4: Mixing Platform and Regional Routing

**What goes wrong:**
The wrong routing type returns 404 or routes to a completely wrong cluster. For example, calling Match-V5 on `na1.api.riotgames.com` instead of `americas.api.riotgames.com` returns nothing. In JavaScript/TypeScript without type-level enforcement, this becomes a runtime error or silent failure (matched by wrong region, returning empty arrays).

**Why it happens:**
Developers use `na1` as the default routing value everywhere because it works for most endpoints. Match-V5, Account-V1, tournament endpoints, all LoR endpoints, and RSO use regional routing — this is not obvious from the endpoint name alone.

**How to avoid:**
- Encode routing type in the TypeScript type system. Each API method should accept `Platform` XOR `Regional` as its routing parameter — not a single `string`. Make the wrong type a compile-time error, not a runtime 404.
- Provide a `platformToRegion()` utility function (e.g., `na1` → `americas`) so users never have to look this up manually.
- Document the routing type on every endpoint's TSDoc.

**Warning signs:**
- API method signatures accepting `string` for the routing parameter.
- No TypeScript union types distinguishing `PlatformId` from `RegionalId`.
- Integration tests that always use `na1` even for regional endpoints.

**Phase to address:** Type system design phase (before any game modules). Fix routing type model before wrapping endpoints or types will need to be reworked across all 31 modules.

---

### Pitfall 5: Using Encrypted IDs Across Key Environments

**What goes wrong:**
All player IDs (summonerID, accountID, PUUID) are encrypted per project. An ID fetched with a development key does not work with a production key and vice versa. A wrapper that caches these IDs across key rotations silently serves stale, invalid IDs that cause 404s on downstream calls.

**Why it happens:**
IDs look like stable UUIDs/strings. Developers assume they are portable across environments and cache them aggressively. The encryption is invisible in the response — there is no field that says "this ID was issued for key X."

**How to avoid:**
- Document prominently: IDs are key-scoped. When the API key changes, ID caches must be invalidated.
- If the library implements a cache, the cache key must incorporate the API key identity (or a hash of it), so rotation automatically invalidates prior IDs.
- The async key-provider pattern (accepting `() => Promise<string>` for the API key) makes this harder — track when the key has changed and flush the cache.

**Warning signs:**
- Cache implementation that uses only `puuid` or `summonerId` as the cache key with no key-identity component.
- Integration tests that reuse IDs from a previous test run without re-fetching.

**Phase to address:** Cache implementation phase and key management design.

---

### Pitfall 6: Nullable / Optional Fields Treated as Always-Present

**What goes wrong:**
The Riot API returns structurally inconsistent DTOs: some fields are present only under certain conditions (e.g., `miniSeries` only when a player is in a promotion series; `leagueName` only from paginated endpoints; `totalGames` is documented but almost always inaccurate). If generated types mark these as required (non-nullable), user code will TypeScript-check correctly but crash at runtime on `undefined`.

**Why it happens:**
The riotapi-schema (the community reference) notes that "this whole project is built on many quirks/hacks" — optional fields are maintained in a manually curated list, not derived from the API spec. Auto-generated types from a naive OpenAPI-to-TypeScript pipeline inherit the inaccuracy.

**How to avoid:**
- Default to optional (`?`) for any field that is not confirmed always-present. Being too permissive (adding `?`) is much cheaper than being too strict (crashing on `undefined`).
- Maintain `src/types/overrides/` for fields known to be conditionally returned. Document the condition in JSDoc.
- Schema generation step must capture `null` and absent-field responses, not just happy-path responses. Run schema generation across diverse data (multiple regions, ranked vs. unranked accounts, etc.).
- The `totalGame` field on LeagueDTO is documented as inaccurate — override its type to signal this.

**Warning signs:**
- `required: true` on all fields in generated DTOs.
- Schema generation tests that only hit endpoints with a single test account.
- No `src/types/overrides/` entries despite the API's known inconsistencies.

**Phase to address:** Schema generation design and type system architecture phases.

---

### Pitfall 7: Non-JSON Error Bodies

**What goes wrong:**
Riot API error responses are not guaranteed to be valid JSON. A wrapper that does `const err = await response.json()` on non-2xx responses throws a parse error, masking the original HTTP error with a confusing `SyntaxError: Unexpected token` message.

**Why it happens:**
Happy-path responses are always JSON, so developers write `response.json()` as the uniform response handler. Edge cases (gateway errors, service outages, CDN responses) return HTML or plain text.

**How to avoid:**
- For non-2xx responses: inspect `Content-Type` header first. If not `application/json`, read as text and include in error message.
- Wrap all response parsing in try/catch and always include `response.status` and the raw body in thrown errors.
- Riot docs explicitly state: "logic must fail gracefully on response codes alone; don't parse error body structure as it's subject to change."

**Warning signs:**
- `response.json()` called unconditionally in the HTTP client.
- Error type that only stores a `message` string, not the raw HTTP status.

**Phase to address:** Core HTTP client phase.

---

### Pitfall 8: Key Leakage via Client-Side Use

**What goes wrong:**
The wrapper is designed as a universal library (Node, Deno, Bun, edge). If users import and instantiate it in a browser bundle, the API key is exposed in source maps or the built JS bundle. Riot policy requires keys to be kept secret; exposure risks key revocation and account blacklisting.

**Why it happens:**
"Works in any runtime" implies browser, but browsers are public environments. Library authors don't warn against browser use.

**How to avoid:**
- Document explicitly in README and all key-adjacent API surface: this library is for server-side use only. API keys must not be exposed to clients.
- Do not ship browser-specific entry points (no `browser` field in `package.json` exports).
- Consider a runtime check that warns (but does not block) if `window` is detected.

**Warning signs:**
- A `browser` field in `package.json`.
- Docs that describe "use in any environment" without a server-only caveat for the key parameter.

**Phase to address:** Initial design and documentation phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-code rate limit values from docs | Faster to implement | Library throttles incorrectly when Riot changes limits (no notice) | Never |
| Single routing string parameter instead of typed Platform/Regional union | Less boilerplate | Wrong routing is a runtime 404, not a compile error; breaks all 31 endpoints | Never |
| Mark all DTO fields as required | Simpler types, no `?` noise | Runtime crashes on conditionally-returned fields | Never |
| Reactive-only 429 handling | Less state to manage | User-visible errors, risk of blacklisting | Never |
| CommonJS-only output | Simpler build | Not tree-shakeable; blocks edge/ESM-only runtimes | Never |
| One monolithic client class for all 31 API groups | Simple API surface | Classes cannot be tree-shaken; user imports entire bundle even if only using Match-V5 | MVP only if docs are clear about it |
| `any` for response types before schema generation | Ship faster | IDE autocompletion is useless; type errors hidden | Only in scaffolding phase, replaced immediately |
| Skip service-level 429 distinction | Simpler 429 handler | Silent drift in rate limiter state; exponential backoff not applied to service outages | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Riot rate limit headers | Reading `X-Rate-Limit-Count` (deprecated) | Read `X-App-Rate-Limit-Count` and `X-Method-Rate-Limit-Count` separately |
| Riot rate limit headers | Parsing headers only on 429 | Parse on every response to maintain accurate bucket state |
| Regional routing | Using platform ID for Match-V5 (e.g., `na1`) | Map platform → region (`na1` → `americas`) and use regional host |
| Account-V1 | Querying with summonerName | Use Riot ID (`gameName` + `tagLine`) — summoner name endpoints removed June 2025 |
| PUUID lookups | Caching PUUIDs across API key environments | PUUID encryption is key-scoped; cache must be invalidated on key change |
| Error responses | `response.json()` on all non-2xx | Check `Content-Type`; fallback to `response.text()` for non-JSON errors |
| Spectator-V5 | Implementing full live-game feature set | Spectator-V5 has been deactivated for LoL; plan endpoint availability carefully |
| Summoner-V4 by SummonerID/AccountID | Building identity lookup around summonerID | Those endpoints were removed June 2025; use PUUID equivalents via Account-V1 |
| Development key in CI/CD | Using dev key for integration tests in pipeline | Dev keys expire every 24h; integration tests require a stable key or mocking strategy |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No cache on summoner/league endpoints | Rate limit exhausted on repeated lookups for same player | Per-method TTL cache; summoner data changes rarely | Any load above a few requests/minute per user |
| TTL > 0 on live game data | Users see stale game state (game ended, data says "in progress") | Default TTL = 0 for spectator/current-game endpoints | First time a game ends while cached |
| Shared rate limit state not thread-safe | Concurrent requests bypass bucket, causing 429 bursts | Mutex or atomic operations around bucket decrement/check | Any concurrent use (Node.js async, workers) |
| Match history without pagination | First page works; deep pagination hits method limits | Queue paginated calls through the same rate limiter | Users with >100 games in time window |
| Schema generation hitting all endpoints sequentially | Generation takes 30+ minutes, hits rate limits | Parallelize with rate-limit-awareness; cache intermediate results | First run against production key |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| API key in client-side bundle | Key exposed in public JS; Riot revokes key, app goes down | Server-side only; warn in docs; no `browser` package.json field |
| API key in repository (hardcoded in tests) | Key rotated by Riot on detection, breaking CI | Always use environment variables; add `RGAPI-` pattern to `.gitignore` rules and secret scanning |
| Logging full request URL with API key in query | Key in log files, CI output, error trackers | API key goes in `X-Riot-Token` header only; never in URL; redact from logs in middleware |
| Storing IDs from dev key in persistent DB | IDs silently invalid with production key | Document clearly; integration test suite should warn when IDs are stale across key change |
| Not validating `Retry-After` header value | Malformed header causes NaN delay, immediate retry storm | Parse and clamp: `Math.max(1, Math.min(parseInt(header), 60))` |

---

## UX Pitfalls (Developer Experience)

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Opaque 429 errors ("rate limited") | Developer doesn't know which limit was hit or how long to wait | Throw typed error with `limitType: 'application' | 'method' | 'service'`, `retryAfter: number`, `bucket: string` |
| No TSDoc on generated types | IDE shows field name with no explanation of what it means | JSDoc on every generated field; re-export with human descriptions in overrides |
| Throwing raw `fetch` network errors | User sees `TypeError: Failed to fetch` with no Riot context | Wrap network errors in a `WhisperNetworkError` with the attempted URL and region |
| Silent routing fallback | Wrong region silently used, returns empty/wrong data | Fail loudly at call site with a typed `WhisperRoutingError`; never silently fall back |
| `any` return type on catch | User can't discriminate Riot API errors from network errors in their code | Typed error hierarchy: `WhisperError` > `RiotApiError` / `RateLimitError` / `NetworkError` |
| Single `Client` class for all games | Importing `{ MatchV5 }` still pulls entire library | Tree-shakeable per-game subpath exports: `whisper/lol`, `whisper/tft`, `whisper/val`, etc. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Rate limiter:** Verify it handles service-level 429 (no `X-Rate-Limit-Type` header) with exponential backoff, not just `Retry-After`.
- [ ] **Rate limiter:** Verify buckets are per-region AND per-method, not global.
- [ ] **Rate limiter:** Verify headers are parsed on every response, not only on 429.
- [ ] **Routing:** Verify Match-V5 and Account-V1 calls use regional routing in integration tests (not platform).
- [ ] **Routing:** Verify `na1` is NOT accepted as a routing value for regional endpoints at the type level.
- [ ] **Types:** Verify all conditionally-returned fields are typed as optional (`?`) in generated types.
- [ ] **Types:** Verify `miniSeries`, `leagueName`, `totalGames` fields are overridden with accurate optionality.
- [ ] **Error handling:** Verify a non-JSON 403 (CDN/gateway error) does not throw `SyntaxError`.
- [ ] **Cache:** Verify live-game endpoint default TTL is 0, not inherited from a global default.
- [ ] **Cache:** Verify cache key includes API key identity so key rotation invalidates cached IDs.
- [ ] **Bundle:** Verify `import { MatchV5 } from 'whisper/lol'` does NOT pull TFT or Valorant modules (bundle analysis check).
- [ ] **Bundle:** Verify `sideEffects: false` is set correctly and no actual side effects exist in the module graph.
- [ ] **ESM/CJS:** Verify the library works in a plain `node --input-type=module` script (no bundler).
- [ ] **ESM/CJS:** Verify the library works with `require('whisper')` in a CommonJS context.
- [ ] **Key expiry:** Verify integration test suite handles 401 from expired dev key gracefully (not a cryptic crash).
- [ ] **Summoner endpoints:** Verify no endpoints call the removed-June-2025 summonerID/accountID paths in v1.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Reactive rate limiter shipped | HIGH — affects all endpoints, requires core redesign | Replace core HTTP client; all 31 game modules need re-testing |
| String routing instead of typed Platform/Regional | HIGH — API surface change breaks user code | Major version bump; breaking change with migration guide |
| Required fields on optional DTO fields | MEDIUM — only affects conditional runtime paths | Add `?` to affected fields; patch release; add test coverage for null cases |
| CommonJS-only output | MEDIUM — breaks ESM-only runtimes | Rebuild with dual output; update package.json exports; no API surface change |
| Key leakage via URL | HIGH — key revoked, app goes down | Rotate key immediately; fix to header-only; audit logs |
| Cache not invalidated on key change | MEDIUM — 404s on downstream calls | Add key identity to cache keys; clear cache on key rotation |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Reactive rate limiting | Core infrastructure (rate limiter) | Unit tests covering all three 429 types; proactive queue tested under burst load |
| Three 429 types conflated | Core infrastructure (rate limiter) | Test: mock responses with/without `X-Rate-Limit-Type`, verify backoff behavior per type |
| Hardcoded rate limit values | Core infrastructure (rate limiter) | Code search: no numeric rate limit constants; bucket seeds from headers |
| Platform/Regional routing confusion | Type system design (before game modules) | TypeScript compiler errors on wrong routing type; integration tests use correct route per endpoint |
| Encrypted IDs across key environments | Cache implementation + key management | Test: rotate key, verify cache miss on ID lookups |
| Nullable/optional DTO fields | Schema generation + type overrides | Tests that parse API responses with accounts in edge states (unranked, not in series) |
| Non-JSON error bodies | Core HTTP client | Unit test: mock 403 with HTML body; verify error message contains HTTP status |
| Key leakage | Documentation + project setup | No `browser` field in package.json; README includes server-only warning |
| Removed summonerID/accountID endpoints | Endpoint coverage phase | No calls to `/summoner/v4/summoners/by-account/` or `/by-name/` anywhere in codebase |
| ESM/CJS dual publish | Build system phase | CI matrix: test in Node CJS mode, Node ESM mode, Deno, Bun |
| Monolithic class blocking tree shaking | Architecture phase | Bundle analysis: game-module import does not include other game code |
| Service-level 429 without `Retry-After` | Core infrastructure (rate limiter) | Unit test: mock 429 with no headers; verify exponential backoff applied |

---

## Sources

- [Riot Developer Portal — Rate Limiting docs](https://developer.riotgames.com/docs/portal) — HIGH confidence
- [HexDocs community rate limiting guide](https://hextechdocs.dev/rate-limiting/) — MEDIUM confidence (community-maintained, verified against portal)
- [fightmegg/riot-rate-limiter wiki — 429 Responses](https://github.com/fightmegg/riot-rate-limiter/wiki/429-Reponses) — MEDIUM confidence (community reference implementation)
- [Riot API Libraries — IDs documentation](https://riot-api-libraries.readthedocs.io/en/latest/ids.html) — MEDIUM confidence
- [Riot API Libraries — Specifics documentation](https://riot-api-libraries.readthedocs.io/en/latest/specifics.html) — MEDIUM confidence
- [MingweiSamuel/riotapi-schema — Required Properties issue](https://github.com/MingweiSamuel/riotapi-schema/issues/7) — HIGH confidence (schema maintainer's own statement)
- [Riot DevRel — Summoner name/ID endpoint removal announcement](https://x.com/RiotGamesDevRel/status/1932188110454235582) — HIGH confidence (official announcement)
- [Riot DevRel — Spectator-V5 deactivation announcement](https://x.com/RiotGamesDevRel/status/1979263978787246391) — HIGH confidence (official announcement)
- [DarkIntaqt — Platform vs Regional routing](https://darkintaqt.com/blog/routing) — MEDIUM confidence
- [Liran Tal — TypeScript ESM/CJS publishing in 2025](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) — MEDIUM confidence
- [Rate limit header deprecation: X-Rate-Limit-Count → X-App-Rate-Limit-Count](https://developer.riotgames.com/rate-limiting.html) — HIGH confidence (official docs)
- [Riot API Libraries — Application/key types](https://riot-api-libraries.readthedocs.io/en/latest/applications.html) — MEDIUM confidence

---

*Pitfalls research for: Riot Games API TypeScript wrapper library (Whisper)*
*Researched: 2026-03-17*
