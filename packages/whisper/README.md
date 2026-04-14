# @wardbox/whisper

Zero-dependency TypeScript library wrapping every Riot Games API endpoint. Proactive rate limiting. Tree-shakeable per-game imports. Runs on Node 18+, Deno, Bun, and edge runtimes.

**[Documentation](https://wardbox.github.io/whisper)** | **[Quickstart](https://wardbox.github.io/whisper/docs/quickstart)** | **[API Reference](https://wardbox.github.io/whisper/docs/api/lol)**

## Install

```bash
npm install @wardbox/whisper
```

## Quickstart

```typescript
import { createClient } from '@wardbox/whisper/core';
import { accountV1 } from '@wardbox/whisper/riot';
import { summonerV4, matchV5 } from '@wardbox/whisper/lol';

const client = createClient({ apiKey: process.env.RIOT_API_KEY! });

// Start with a Riot ID (e.g. wardbox#666)
const account = await accountV1.getByRiotId(client, 'americas', 'wardbox', '666');

// Platform-routed: summoner lookup
const summoner = await summonerV4.getByPuuid(client, 'na1', account.puuid);

// Regional-routed: match history
const matchIds = await matchV5.getMatchIdsByPuuid(client, 'americas', account.puuid);
```

The client handles rate limits automatically — no 429s under normal usage.

## Features

- **Zero runtime dependencies.** Native `fetch` only. ~150 KB installed, less with tree-shaking.
- **Proactive rate limiting.** Parses Riot's rate limit headers and queues requests before limits are hit.
- **Tree-shakeable per-game imports.** `@wardbox/whisper/lol`, `/tft`, `/val`, `/lor`, `/riftbound`, `/riot` — import only what you use.
- **Full TypeScript types.** Auto-generated from Riot's API responses. Every field has JSDoc.

## Documentation

Guides, API reference, and auto-generated type tables: **[wardbox.github.io/whisper](https://wardbox.github.io/whisper)**

- [Quickstart](https://wardbox.github.io/whisper/docs/quickstart) — Riot ID to match history in 5 minutes
- [Routing](https://wardbox.github.io/whisper/docs/routing) — Platform vs regional vs Valorant routing
- [Rate Limiting](https://wardbox.github.io/whisper/docs/rate-limiting) — How proactive rate limiting works
- [Caching](https://wardbox.github.io/whisper/docs/caching) — TTL configuration and custom adapters
- [Middleware](https://wardbox.github.io/whisper/docs/middleware) — Logging, metrics, and request transformation

## License

MIT. See [LICENSE](./LICENSE).
