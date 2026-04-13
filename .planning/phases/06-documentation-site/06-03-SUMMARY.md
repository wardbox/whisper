---
phase: 06-documentation-site
plan: 03
subsystem: docs
tags: [api-reference, llms-txt, fumadocs, autotypetable]
dependency_graph:
  requires: [docs-framework, autotypetable-integration, lol-api-reference]
  provides: [tft-api-reference, val-api-reference, lor-api-reference, riftbound-api-reference, riot-api-reference, llms-txt-endpoint, docs-build-scripts]
  affects: [packages/docs, package.json]
tech_stack:
  added: []
  patterns: [llms-txt-route-handler, includeProcessedMarkdown, docs-build-chaining]
key_files:
  created:
    - packages/docs/content/docs/api/tft.mdx
    - packages/docs/content/docs/api/val.mdx
    - packages/docs/content/docs/api/lor.mdx
    - packages/docs/content/docs/api/riftbound.mdx
    - packages/docs/content/docs/api/riot.mdx
    - packages/docs/app/llms.txt/route.ts
    - packages/docs/app/llms-full.txt/route.ts
    - packages/docs/lib/get-llm-text.ts
  modified:
    - packages/docs/source.config.ts
    - package.json
decisions:
  - getLLMText uses unknown cast to access _markdown field (TypeScript strict mode requires double cast)
  - llms-full.txt uses synchronous getLLMText since page data is already loaded
  - docs:build script chains library build before docs build to ensure .d.ts files exist for AutoTypeTable
metrics:
  duration: 4min
  completed: 2026-04-10
  tasks: 2
  files: 10
---

# Phase 6 Plan 03: Remaining API Reference Pages and llms.txt Summary

5 API reference pages (TFT, Val, LoR, Riftbound, Riot) with AutoTypeTable type generation, llms.txt routes for LLM consumption, and root workspace docs scripts completing the full API reference coverage.

## What Was Built

### Task 1: Create remaining 5 API reference pages (b76f58b)

Created MDX API reference pages for all remaining game modules, following the exact pattern established in Plan 01's LoL reference page:

- **TFT (tft.mdx)**: 5 API groups documented -- Summoner v1, Match v1, League v1, Spectator v5, Status v1. Includes notes about PlatformRoute/RegionalRoute split and the spectator `/lol/` path convention. Override types (TftLeagueEntry, TftTopRatedLadderEntry) referenced from overrides path.
- **Valorant (val.mdx)**: 6 API groups documented -- Match v1, Content v1, Ranked v1, Status v1, Console Match v1, Console Ranked v1. Prominent ValPlatformRoute documentation with the routing type table. Console endpoint notes about mandatory `platformType` parameter.
- **LoR (lor.mdx)**: 2 active API groups documented -- Ranked v1, Status v1. Maintenance mode notice explaining that lor-match-v1, lor-deck-v1, and lor-inventory-v1 are not available. RegionalRoute note.
- **Riftbound (riftbound.mdx)**: 1 API group -- Content v1. Notes about RegionalRoute and optional locale parameter.
- **Riot (riot.mdx)**: 1 shared API group -- Account v1. Includes Account generated type and ActiveShard override type. Notes about cross-game usage and RegionalRoute.

All pages build successfully with AutoTypeTable generating real type content from source files.

### Task 2: llms.txt routes, source config, and root docs scripts (3179be7)

- **llms.txt route**: Uses fumadocs-core's built-in `llms()` function to generate a structured index of all documentation pages with titles, descriptions, and URLs.
- **llms-full.txt route**: Iterates all pages using `getLLMText` helper, outputting full page content separated by `---` delimiters.
- **get-llm-text.ts helper**: Extracts page content, using `_markdown` field (from `includeProcessedMarkdown`) when available, falling back to description. Note per Research Pitfall 6: AutoTypeTable RSC content does not serialize to llms.txt.
- **source.config.ts**: Updated to enable `includeProcessedMarkdown: true` in the docs postprocess options for llms.txt content extraction.
- **Root package.json**: Added `docs:dev` (runs dev server) and `docs:build` (chains library build then docs build) convenience scripts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript strict cast for page data access**
- **Found during:** Task 2
- **Issue:** `page.data as Record<string, unknown>` failed TypeScript strict check because the DocCollectionEntry type doesn't have an index signature
- **Fix:** Used double cast `page.data as unknown as Record<string, unknown>` to safely access the `_markdown` field
- **Files modified:** packages/docs/lib/get-llm-text.ts
- **Commit:** 3179be7

**2. [Rule 1 - Bug] Biome formatting (tabs vs spaces, import ordering)**
- **Found during:** Task 2
- **Issue:** New files used tabs instead of spaces and imports were not sorted per Biome rules
- **Fix:** Ran `pnpm check --fix` to auto-format all 4 new/modified files
- **Files modified:** source.config.ts, llms.txt/route.ts, llms-full.txt/route.ts, get-llm-text.ts
- **Commit:** 3179be7

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Synchronous getLLMText (not async) | Page data is already loaded by fumadocs source loader; no async operations needed |
| Double cast through `unknown` for _markdown access | TypeScript strict mode requires it; _markdown is injected by postprocess and not in the base type |
| docs:build chains library build first | AutoTypeTable reads source .ts files via TypeScript Compiler API which needs the library's tsconfig; ensuring build order prevents missing type errors |

## Verification Results

1. `pnpm docs:build` -- PASSED (library build + 11 static pages generated)
2. All 6 API reference pages in static output (lol, tft, val, lor, riftbound, riot) -- PASSED
3. llms.txt route pre-rendered at `/llms.txt` with all 6 API pages listed -- PASSED
4. llms-full.txt route pre-rendered at `/llms-full.txt` -- PASSED
5. Root package.json has docs:dev and docs:build scripts -- PASSED
6. `pnpm check` -- PASSED (no Biome errors)

## Self-Check: PASSED

All 10 created/modified files verified present. Both task commits (b76f58b, 3179be7) verified in git log.
