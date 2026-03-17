# Phase 1: Foundation - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Toolchain, workspace scaffolding, routing types, and package structure. A developer can clone the repo, install deps, and run build, test, and lint commands against a correctly-scaffolded pnpm workspace with typed routing primitives already in place.

</domain>

<decisions>
## Implementation Decisions

### Routing type design
- Plain string literal unions for PlatformRoute and RegionalRoute (no branded types, no enums)
- Users pass raw strings ('na1', 'americas') directly to methods — no construction step needed
- Also export constants objects (PLATFORM.NA1, REGIONAL.AMERICAS) for IDE autocomplete discoverability
- Both raw strings and constants work interchangeably
- Single PlatformRoute union with all 17 values, single RegionalRoute union with 4 values
- Per-method types narrow to game-specific subsets at the endpoint level (Phase 4+)
- Include `toRegional()` mapping utility (e.g., 'na1' -> 'americas') since users frequently need both routing types for the same player

### Package & export structure
- Subpath exports only — no top-level client that wraps all games
- Users import per-game: `@wardbox/whisper/lol`, `@wardbox/whisper/riot`, etc.
- No convenience re-export from `@wardbox/whisper` root — encourages lighter bundles
- Flat game dirs in src/ — core/, types/, lol/, tft/, val/, lor/, riftbound/, riot/ all at src/ top level

### TypeScript & build config
- Maximum strict: `strict: true` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- ES2022 target — matches Node 18+ baseline, includes top-level await, private fields, error.cause
- NodeNext module resolution — explicit .js extensions in imports, strictest resolution, works in all target runtimes

### Workspace layout
- Schema generation scripts live in root `scripts/` dir (not a workspace package)
- Shared config (tsconfig.base.json, biome.json) at repo root, extended by each workspace package
- Library location: Claude's discretion

### Claude's Discretion
- Library at repo root vs under packages/ — pick what works best with tsdown + pnpm workspace
- tsdown configuration details
- Biome rule selection
- Vitest configuration
- CI pipeline structure (GitHub Actions config)
- Exact contents of initial test suite

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value prop, constraints, key decisions
- `.planning/REQUIREMENTS.md` — FOUND-01 through FOUND-06, TYPE-01 through TYPE-04 requirements for this phase
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 criteria that must be TRUE)

### Riot API
- `CLAUDE.md` — Riot API reference links, design philosophy, architecture overview

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — this phase establishes them

### Integration Points
- Package.json subpath exports map directly to src/ game dirs
- tsconfig.base.json at root will be extended by all workspace packages
- biome.json at root applies to entire repo

</code_context>

<specifics>
## Specific Ideas

- Import style: `import { MatchV5 } from '@wardbox/whisper/lol'` — per-game, no umbrella client
- Routing feel: `await lol.summoner.getByName('na1', 'Doublelift')` — plain strings, zero ceremony
- Constants as alternative: `await lol.summoner.getByName(PLATFORM.NA1, 'Doublelift')` — for discoverability
- Mapping utility: `const region = toRegional('na1')` — for cross-routing-type workflows

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-17*
