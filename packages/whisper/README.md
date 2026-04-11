# @wardbox/whisper

Zero-dependency TypeScript library wrapping every Riot Games API endpoint. Proactive rate limiting. Tree-shakeable per-game imports. Runs on Node 18+, Deno, Bun, and edge runtimes.

## Install

```bash
pnpm add @wardbox/whisper
# or: npm install @wardbox/whisper
# or: yarn add @wardbox/whisper
```

## Quickstart

```typescript
import { createClient } from '@wardbox/whisper/core';
import { summonerV4, matchV5 } from '@wardbox/whisper/lol';

const client = createClient({ apiKey: process.env.RIOT_API_KEY! });

// Platform-routed: summoner lookup
const summoner = await summonerV4.getByPuuid(client, 'na1', 'PUUID_HERE');

// Regional-routed: match history
const matchIds = await matchV5.getMatchIdsByPuuid(client, 'americas', summoner.puuid);
```

The client handles rate limits automatically — no 429s under normal usage.

## Features

- **Zero runtime dependencies.** Native `fetch` only. ~150 KB installed, less with tree-shaking.
- **Proactive rate limiting.** Parses Riot's `X-App-Rate-Limit` and `X-Method-Rate-Limit` headers and queues before limits are hit.
- **Tree-shakeable per-game imports.** `@wardbox/whisper/lol`, `/tft`, `/val`, `/lor`, `/riftbound`, `/riot` — import only what you use.

## Documentation

Full docs, guides, and the complete API reference: **https://github.com/wardbox/whisper#readme** (deployed Fumadocs site URL coming soon)

## License

MIT. See [LICENSE](./LICENSE).
