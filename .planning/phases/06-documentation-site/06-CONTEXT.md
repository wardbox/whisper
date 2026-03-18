# Phase 6: Documentation Site - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a Fumadocs documentation site in the `packages/docs` workspace package. The site enables a developer new to Whisper to understand the routing model and make a working API call within minutes of landing. Auto-generated type tables from compiled TypeScript replace hand-maintained API reference. The site builds and serves in isolation from the library package.

</domain>

<decisions>
## Implementation Decisions

### Docs framework
- Fumadocs (Next.js-based) — not Starlight or Nextra
- App Router (Fumadocs is built for it)
- Static export (`next export`) — pure HTML/CSS/JS, deployable anywhere (GitHub Pages, Vercel, Netlify, S3)
- Built-in Fumadocs search (Orama-based, client-side) — no external search service

### Type table generation
- Fumadocs TypeDoc integration (`fumadocs-typescript`) — reads `.d.ts` files at build time
- Auto-generate tables for both response types (DTOs) and namespace object method signatures
- Types grouped by game module — one reference page per game (e.g., /api/lol, /api/tft), not per-type or per-API-group
- Inline expandable sub-types — nested types expand in-place rather than linking elsewhere

### Content structure
- Two main sections: **Guides** (narrative) and **API Reference** (auto-generated)
- Guides: Quickstart, Routing, Rate Limiting, Caching, Middleware
- Quickstart uses LoL as the example game (summoner lookup or match history) — most popular, most relatable
- Games get API reference pages only — no per-game guide pages. Game-specific quirks (ValPlatformRoute, LoR maintenance mode) covered in the routing guide.
- `llms.txt` at docs root — structured text file for LLM consumption covering the full API surface (see wasp.sh/llms.txt as reference)

### Design & branding
- Dark-first theme (with light mode toggle) — clean, developer-focused, minimal
- Hero landing page with tagline, feature highlights (zero deps, proactive rate limiting, tree-shaking), install command, and CTA to quickstart
- Accent color: Claude's discretion — pick a cohesive scheme that fits the "whisper" brand

### Claude's Discretion
- Accent color and full color scheme
- Landing page layout and feature highlight copy
- Code example content in guides (beyond the quickstart structure)
- Fumadocs plugin configuration details
- How llms.txt is generated (manual, build script, or plugin)
- Static export configuration specifics

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Docs framework
- Fumadocs documentation — framework setup, App Router integration, TypeDoc plugin config, static export
- `fumadocs-typescript` package — TypeDoc integration for auto-generated type tables

### Project specs
- `.planning/PROJECT.md` — Core value prop, zero-dep constraint, design philosophy
- `.planning/REQUIREMENTS.md` — DOC-03 (docs site in separate workspace package), DOC-04 (auto-generated type tables)
- `.planning/ROADMAP.md` — Phase 6 success criteria (4 criteria that must be TRUE)

### Architecture (existing code to integrate with)
- `packages/docs/package.json` — Empty placeholder, framework setup starts here
- `packages/whisper/package.json` — Subpath exports structure (`./lol`, `./tft`, `./val`, `./lor`, `./riftbound`, `./riot`, `./core`)
- `packages/whisper/dist/` — Built `.d.ts` files that TypeDoc reads for type table generation
- `packages/whisper/src/lol/summoner-v4.ts` — Example of TSDoc style on endpoint methods
- `packages/whisper/src/types/generated/` — Auto-generated DTO types per game
- `packages/whisper/src/types/overrides/` — Hand-written type overrides
- `packages/whisper/src/types/platform.ts` — `PlatformRoute` type
- `packages/whisper/src/types/regional.ts` — `RegionalRoute` type
- `packages/whisper/src/val/types.ts` — `ValPlatformRoute` type (third distinct route type)
- `pnpm-workspace.yaml` — Workspace config (`packages/*`)

### LLM-friendly docs reference
- `https://wasp.sh/llms.txt` — Reference example for llms.txt format and structure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Full TSDoc on all public endpoint methods — TypeDoc can extract these directly
- JSDoc on all generated type fields — renders as field descriptions in type tables
- Three distinct route types (`PlatformRoute`, `RegionalRoute`, `ValPlatformRoute`) with clear literal unions — good for routing guide examples
- `createClient()` factory in `src/core/client.ts` — the entry point for quickstart examples

### Established Patterns
- pnpm workspace with `packages/*` glob — docs package already registered
- Subpath exports (`./lol`, `./tft`, etc.) — import examples in docs should use these
- Namespace object pattern (`summonerV4.getByPuuid(client, route, puuid)`) — consistent call pattern across all 31 API groups
- Co-located types (generated + overrides) — TypeDoc needs to read from the built output

### Integration Points
- `packages/docs/` — currently empty, all framework scaffolding goes here
- Root `package.json` — may need `docs:dev` and `docs:build` scripts
- `biome.json` — may need docs-specific ignore patterns (Next.js generated files)
- Library must be built (`pnpm build`) before docs can generate type tables from `.d.ts` files

</code_context>

<specifics>
## Specific Ideas

- `llms.txt` at docs root structured for LLM consumption — user referenced https://wasp.sh/llms.txt as the model to follow
- Quickstart should show a LoL summoner lookup or match history pull — concrete, relatable example
- Type tables should show method signatures alongside response types so users see the full picture on one page
- Landing page should highlight the three differentiators: zero runtime deps, proactive rate limiting, tree-shakeable per-game imports

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-documentation-site*
*Context gathered: 2026-03-18*
