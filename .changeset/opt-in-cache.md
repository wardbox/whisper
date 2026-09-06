---
"@wardbox/whisper": minor
---

**Breaking:** caching is now opt-in. `createClient` no longer creates a `MemoryCache` by default; pass `cache: new MemoryCache()` (or any `CacheAdapter`) to keep the previous behaviour. `cache: false` is still accepted.

- `MemoryCache` is now bounded (`maxEntries`, default 1000) and sweeps expired entries when full, so once-fetched responses no longer accumulate forever (#25).
- `client.request` accepts `{ cache: false }` to bypass the cache for a single call; the fresh response is stored (#24).
