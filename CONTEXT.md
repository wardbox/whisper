# Whisper

A TypeScript library wrapping every Riot Games API endpoint with zero runtime
dependencies. This glossary fixes the vocabulary used across the codebase, its
issues, and its docs.

## Routing

**Platform route**:
A Riot region tied to a specific server shard (`na1`, `euw1`, `kr`, …). Used by
most endpoints. Never interchangeable with a Regional route — the type system
forbids mixing them.
_Avoid_: server, shard, region (when you mean a Platform specifically)

**Regional route**:
A Riot super-region (`americas`, `europe`, `asia`, `sea`). Used by match-v5,
account-v1, tournament, LoR, and RSO endpoints.
_Avoid_: region (unqualified), continent

## API surface

**API group**:
One versioned Riot endpoint family exposed as a module (e.g. match-v5,
summoner-v4). The unit of coverage — v1 covers all 31.
_Avoid_: endpoint (a single route), service, API

**Game module**:
A per-game export namespace (`lol`, `tft`, `val`, `lor`, `riftbound`) that
groups its API groups for tree-shakeable imports. `riot` holds cross-game
groups like account-v1.
_Avoid_: package, section

## Rate limiting

**Proactive rate limiting**:
Queuing requests *before* a limit is hit, by reading Riot's rate-limit headers.
Whisper's default and differentiator — distinct from reactive retry-on-429.
_Avoid_: throttling, backoff (that's the reactive fallback)

**App-level limit** / **Method-level limit**:
The two independent rate-limit tiers Riot enforces per API key — one across the
whole key, one per endpoint. Both are tracked from response headers.
_Avoid_: global limit, per-route cap

## Schema

**Schema**:
A captured `.schema.json` response shape for an endpoint, and the TypeScript
interface generated from it. Doubles as an endpoint regression fixture — a
diff means Riot changed a response.
_Avoid_: model, DTO, response type (when you mean the generated artifact)
