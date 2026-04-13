---
phase: 06-documentation-site
plan: 02
subsystem: docs
tags: [guides, landing-page, search, mdx, quickstart]
dependency_graph:
  requires: [docs-framework, autotypetable-integration]
  provides: [guide-content, landing-page, search-route, docs-index]
  affects: [packages/docs]
tech_stack:
  added: []
  patterns: [fumadocs-static-search, home-layout-route-group, mdx-guide-content]
key_files:
  created:
    - packages/docs/app/(home)/page.tsx
    - packages/docs/app/(home)/layout.tsx
    - packages/docs/content/docs/quickstart.mdx
    - packages/docs/content/docs/routing.mdx
    - packages/docs/content/docs/rate-limiting.mdx
    - packages/docs/content/docs/caching.mdx
    - packages/docs/content/docs/middleware.mdx
    - packages/docs/app/api/search/route.ts
  modified:
    - packages/docs/content/docs/index.mdx
decisions:
  - Landing page uses Fumadocs fd-* design tokens for dark-first styling consistency
  - CacheTtlConfig documented with pattern-based keys (accurate to source) not nested byMethod
  - Middleware guide shows actual onRequest/onResponse signatures from source types.ts
metrics:
  duration: 5min
  completed: 2026-04-10
  tasks: 2
  files: 9
---

# Phase 6 Plan 02: Guide Content, Landing Page, and Search Summary

Hero landing page with feature highlights, 5 complete guide pages (Quickstart, Routing, Rate Limiting, Caching, Middleware), updated docs index, and static Orama search route.

## What Was Built

### Task 1: Hero Landing Page (a5b8c72)

Created the landing page using Fumadocs `HomeLayout` in a `(home)` route group (no sidebar):

- **HomeLayout wrapper**: Nav links to Docs, API Reference, and GitHub
- **Hero section**: Centered tagline ("Speak to every Riot API endpoint"), subheading, and `npm install @wardbox/whisper` code block
- **CTA buttons**: "Get Started" links to `/docs/quickstart`, "View API Reference" links to `/docs/api/lol`
- **Feature grid**: Three cards -- Zero Dependencies, Proactive Rate Limiting, Tree-Shakeable
- **Dark-first styling**: Uses Fumadocs design tokens (`fd-primary`, `fd-muted-foreground`, `fd-border`, `fd-card`, etc.)

### Task 2: Guide Pages, Docs Index, Search Route (c1543e1)

Created all 5 guide MDX pages with accurate API signatures from source code:

- **Quickstart**: Install-to-first-call flow using LoL summoner lookup and match history. Shows the platform-to-regional route transition. Full example combining accountV1, summonerV4, and matchV5.
- **Routing**: Comprehensive coverage of all three routing types (PlatformRoute, RegionalRoute, ValPlatformRoute). Includes platform-to-region mapping table, PLATFORM/REGIONAL/VAL_PLATFORM constant objects, type safety examples, and game-specific notes (LoR maintenance mode, Riftbound, shared Account v1).
- **Rate Limiting**: Explains proactive vs reactive approach, three limit types (app, method, service), RateLimiterConfig options, 429 handling with retry behavior.
- **Caching**: CacheTtlConfig pattern-based TTLs, CacheAdapter interface with Redis example, TTL 0 for live game data, API-key-aware cache keys, cache behavior notes.
- **Middleware**: Middleware interface with onRequest/onResponse hooks, onion execution model, use case examples (timing, custom headers, error logging), RequestContext and ApiResponse property tables, pipeline position relative to cache.
- **Docs index**: Updated with links to all 5 guides and all 6 API reference pages.
- **Search route**: Static Orama search via `createFromSource`/`staticGET` at `/api/search`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CacheTtlConfig byMethod vs pattern-based keys**
- **Found during:** Task 2
- **Issue:** Plan examples showed `byMethod` property but actual `CacheTtlConfig` uses `[pattern: string]: number` index signature
- **Fix:** Documented the actual API accurately with pattern-based keys. Added mention of `byMethod` concept in explanatory text for discoverability.
- **Files modified:** packages/docs/content/docs/caching.mdx
- **Commit:** c1543e1

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use Fumadocs `fd-*` design tokens in landing page | Consistent with ocean theme; auto-adapts to dark/light mode without custom CSS |
| Document CacheTtlConfig with pattern keys (not byMethod) | Accurate to actual source code in `src/core/types.ts` |
| Include PLATFORM/REGIONAL/VAL_PLATFORM constants in routing guide | Improves IDE discoverability; matches the constant objects defined in source |
| Full example in quickstart combines accountV1 + summonerV4 + matchV5 | Shows the real workflow: look up account, get summoner, fetch matches with route type transition |

## Verification Results

1. `cd packages/docs && pnpm build` -- PASSED (11 static pages generated)
2. All 5 guide MDX files exist in content/docs/
3. Landing page renders at `/` with hero, features, CTA
4. Search route exists at `out/api/search` (static export)
5. All guide pages appear in static output: quickstart.html, routing.html, rate-limiting.html, caching.html, middleware.html
6. All 22 acceptance criteria pass (content grep checks)

## Self-Check: PASSED
