# Requirements: Whisper

**Defined:** 2026-03-17
**Core Value:** Every Riot API endpoint is accessible through a typed, tree-shakeable interface with smart rate limiting that prevents users from hitting 429s.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Project uses tsdown for builds with dual ESM+CJS output
- [x] **FOUND-02**: Biome configured for linting and formatting
- [x] **FOUND-03**: Vitest test suite with CI pipeline on Node 22 LTS
- [x] **FOUND-04**: `@arethetypeswrong/cli` and `publint` in CI
- [x] **FOUND-05**: pnpm workspace with library + docs as separate packages
- [x] **FOUND-06**: Zero runtime dependencies in the library package

### Types & Routing

- [x] **TYPE-01**: Platform routing type as literal union (17 values: na1, euw1, kr, etc.)
- [x] **TYPE-02**: Regional routing type as literal union (4 values: americas, europe, asia, sea)
- [x] **TYPE-03**: Every API method typed to accept only the correct routing type
- [x] **TYPE-04**: Invalid routing produces a compile-time type error

### HTTP Core

- [x] **HTTP-01**: HTTP client using native `fetch` (no polyfill, no deps)
- [x] **HTTP-02**: Client accepts API key as string or async function for key rotation
- [x] **HTTP-03**: Standard error types with Riot error codes and status mapping
- [x] **HTTP-04**: Middleware/interceptor pipeline for logging, metrics, retries, custom auth

### Rate Limiting

- [x] **RATE-01**: Proactive rate limiter parsing `X-App-Rate-Limit` and `X-Method-Rate-Limit` headers
- [x] **RATE-02**: Distinct handling for app-level, method-level, and service-level 429s
- [x] **RATE-03**: Configurable strategy — proactive by default, reactive as option

### Caching

- [x] **CACHE-01**: In-memory cache as default (Map-based)
- [x] **CACHE-02**: Pluggable cache adapter interface (`get/set/delete`) for Redis, file, custom
- [x] **CACHE-03**: Per-method TTL configuration (summoner=long, match=short, live game=0)
- [x] **CACHE-04**: API-key-aware cache keys to prevent cross-key poisoning

### Game Endpoints

- [x] **ENDP-01**: LoL — all 13 API groups wrapped and typed
- [ ] **ENDP-02**: TFT — all 5 API groups wrapped and typed
- [ ] **ENDP-03**: Valorant — all 6 API groups wrapped and typed
- [ ] **ENDP-04**: LoR — all 5 API groups wrapped and typed
- [ ] **ENDP-05**: Riftbound — 1 API group wrapped and typed
- [x] **ENDP-06**: Account-V1 (shared) wrapped and typed
- [ ] **ENDP-07**: Tree-shakeable per-game imports (`whisper/lol`, `whisper/tft`, etc.)
- [x] **ENDP-08**: Endpoint availability audit per game (exclude removed/deactivated endpoints)

### Schema Generation

- [x] **SCHEMA-01**: Integration tests hit live API endpoints and capture response shapes as `.schema.json`
- [x] **SCHEMA-02**: TypeScript interface generator from `.schema.json` files
- [x] **SCHEMA-03**: Schema diff detection for Riot API response shape changes

### Documentation

- [ ] **DOC-01**: TSDoc on every public export with usage examples
- [ ] **DOC-02**: JSDoc on type fields for IDE tooltip support
- [ ] **DOC-03**: Documentation site (Fumadocs or Starlight) in separate workspace package
- [ ] **DOC-04**: Auto-generated type tables from source TypeScript

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Ecosystem

- **ECO-01**: Redis cache adapter as separate package (`whisper-redis-cache`)
- **ECO-02**: File-based cache adapter
- **ECO-03**: CLI tool for endpoint exploration

### Advanced

- **ADV-01**: Request batching for bulk data pulls
- **ADV-02**: Automatic region detection from summoner name

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile SDKs | TypeScript/JS library only |
| GraphQL layer | Expose REST API as-is, don't abstract |
| Game-specific business logic (damage calc, tier lists) | Data access library, not game logic |
| WebSocket/real-time subscriptions | Riot API is REST-only |
| OAuth/RSO login flow | Auth flow management is app-level concern |
| Removed endpoints (SummonerID-based summoner-v4) | Removed by Riot June 2025 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| FOUND-06 | Phase 1 | Complete |
| TYPE-01 | Phase 1 | Complete |
| TYPE-02 | Phase 1 | Complete |
| TYPE-03 | Phase 1 | Complete |
| TYPE-04 | Phase 1 | Complete |
| HTTP-01 | Phase 2 | Complete |
| HTTP-02 | Phase 2 | Complete |
| HTTP-03 | Phase 2 | Complete |
| HTTP-04 | Phase 2 | Complete |
| RATE-01 | Phase 2 | Complete |
| RATE-02 | Phase 2 | Complete |
| RATE-03 | Phase 2 | Complete |
| CACHE-01 | Phase 2 | Complete |
| CACHE-02 | Phase 2 | Complete |
| CACHE-03 | Phase 2 | Complete |
| CACHE-04 | Phase 2 | Complete |
| SCHEMA-01 | Phase 3 | Complete |
| SCHEMA-02 | Phase 3 | Complete |
| SCHEMA-03 | Phase 3 | Complete |
| ENDP-01 | Phase 4 | Complete |
| ENDP-06 | Phase 4 | Complete |
| ENDP-07 | Phase 4 | Pending |
| ENDP-08 | Phase 4 | Complete |
| DOC-01 | Phase 4 | Pending |
| DOC-02 | Phase 4 | Pending |
| ENDP-02 | Phase 5 | Pending |
| ENDP-03 | Phase 5 | Pending |
| ENDP-04 | Phase 5 | Pending |
| ENDP-05 | Phase 5 | Pending |
| DOC-03 | Phase 6 | Pending |
| DOC-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after roadmap creation*
