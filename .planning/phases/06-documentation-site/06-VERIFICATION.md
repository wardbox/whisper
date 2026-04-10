---
phase: 06-documentation-site
verified: 2026-04-10T00:00:00Z
status: gaps_found
score: 3/4 must-haves verified
overrides_applied: 0
gaps:
  - truth: "The routing page explains platform vs regional routing with concrete examples of when each applies"
    status: failed
    reason: "routing.mdx documents imports of PlatformRoute, PLATFORM, RegionalRoute, and REGIONAL from '@wardbox/whisper/lol', but these symbols are not exported from that subpath (confirmed in src/lol/index.ts). Code examples users copy from the routing guide will fail to compile."
    artifacts:
      - path: "packages/docs/content/docs/routing.mdx"
        issue: "Lines 17, 36, 47, 73 import from '@wardbox/whisper/lol' but PlatformRoute/PLATFORM/RegionalRoute/REGIONAL are not re-exported from that subpath. ValPlatformRoute/VAL_PLATFORM correctly import from '@wardbox/whisper/val' (those ARE exported)."
    missing:
      - "Either re-export PlatformRoute, PLATFORM, RegionalRoute, REGIONAL from packages/whisper/src/lol/index.ts, or update routing.mdx import paths to the correct location (or a new ./types subpath export)"
  - truth: "pnpm check passes with no Biome errors"
    status: failed
    reason: "pnpm check fails with 3 errors: formatting in .planning/config.json (missing trailing newline), formatting in packages/docs/app/(home)/page.tsx (line wrapping), and import ordering in packages/docs/app/api/search/route.ts"
    artifacts:
      - path: "packages/docs/app/(home)/page.tsx"
        issue: "Biome formatter would reflow JSX text content and consolidate div attributes onto one line"
      - path: "packages/docs/app/api/search/route.ts"
        issue: "Imports not sorted per Biome rules (source before fumadocs-core)"
      - path: ".planning/config.json"
        issue: "Missing trailing newline at end of file"
    missing:
      - "Run pnpm check --fix to auto-fix all three formatting/import-ordering errors"
---

# Phase 6: Documentation Site Verification Report

**Phase Goal:** A developer new to Whisper can read the documentation site, understand the platform/regional routing distinction, and make a working API call within a few minutes of landing on the site.
**Verified:** 2026-04-10T00:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The docs site builds and serves from the `docs/` pnpm workspace package in isolation — no changes to the library package required | VERIFIED | `pnpm docs:build` exits 0, produces 18 static pages in `packages/docs/out/`. Library package untouched. |
| 2 | Every public type's fields are rendered in auto-generated tables derived from compiled TypeScript, not maintained by hand | VERIFIED | `mdx-components.tsx` wires `createGenerator` with `tsconfigPath: '../whisper/tsconfig.json'` to `AutoTypeTable`. All 6 API reference pages use `<AutoTypeTable path="..." name="..." />` pointing at source `.ts` files. LoL HTML output contains `summonerLevel`, `LolSummoner`, `getByPuuid` (594KB with real type content per SUMMARY). |
| 3 | The quickstart guide shows a complete working example from installation to first API call | VERIFIED | `quickstart.mdx` has install commands, API key setup, `createClient`, `summonerV4.getByPuuid` with platform routing (`'na1'`), `matchV5.getMatchIdsByPuuid` with regional routing (`'americas'`), and a full combined example with `accountV1 + summonerV4 + matchV5`. Platform/regional distinction explicitly highlighted in prose. |
| 4 | The routing page explains platform vs regional routing with concrete examples of when each applies | FAILED | `routing.mdx` imports `PlatformRoute`, `PLATFORM`, `RegionalRoute`, and `REGIONAL` from `'@wardbox/whisper/lol'` (lines 17, 36, 47, 73), but these are NOT exported from that subpath. `src/lol/index.ts` re-exports types and namespace objects but not routing primitives. Code copied from the routing guide will produce compile errors. `ValPlatformRoute`/`VAL_PLATFORM` from `'@wardbox/whisper/val'` are correctly wired. |

**Score:** 3/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/docs/package.json` | Docs package with Fumadocs, Next.js 16, React 19 | VERIFIED | Contains fumadocs-core@^16, fumadocs-ui@^16, fumadocs-mdx@^14, fumadocs-typescript@^5, next@^16, react@^19 |
| `packages/docs/next.config.mjs` | Next.js static export with Fumadocs MDX | VERIFIED | Contains `output: 'export'` and `createMDX` |
| `packages/docs/app/layout.tsx` | Root layout with RootProvider and dark-first theme | VERIFIED | Contains `RootProvider` from `fumadocs-ui/provider/next` |
| `packages/docs/components/mdx-components.tsx` | MDX component registry with AutoTypeTable | VERIFIED | Contains `createGenerator`, `AutoTypeTable`, `tsconfigPath` pointing at library tsconfig |
| `packages/docs/content/docs/api/lol.mdx` | LoL API reference with type tables | VERIFIED | Contains `AutoTypeTable`, `summonerV4`, `matchV5`, `LolSummoner`, `LolMatch` |
| `packages/docs/content/docs/quickstart.mdx` | Quickstart guide | VERIFIED | Contains `@wardbox/whisper`, `createClient`, `summonerV4`, `matchV5`, `'na1'`, `'americas'` |
| `packages/docs/content/docs/routing.mdx` | Routing guide | PARTIAL | Content exists and explains all three routing types with the platform-to-regional mapping table. Broken import paths for `PlatformRoute`/`PLATFORM`/`RegionalRoute`/`REGIONAL`. |
| `packages/docs/content/docs/rate-limiting.mdx` | Rate limiting guide | VERIFIED | Contains `proactive`, `429`, `X-App-Rate-Limit` |
| `packages/docs/content/docs/caching.mdx` | Caching guide | VERIFIED | Contains `CacheAdapter`, `cacheTtl` |
| `packages/docs/content/docs/middleware.mdx` | Middleware guide | VERIFIED | Contains `Middleware`, `onRequest`, `onResponse` (25 matches) |
| `packages/docs/app/(home)/page.tsx` | Landing page with hero and CTA | VERIFIED | Contains `npm install @wardbox/whisper`, `Zero Dependencies`, `Proactive Rate Limiting`, `Tree-Shakeable`, `/docs/quickstart` |
| `packages/docs/app/(home)/layout.tsx` | HomeLayout (no sidebar) | VERIFIED | Contains `HomeLayout`, `Whisper` |
| `packages/docs/app/api/search/route.ts` | Static Orama search route | VERIFIED | Contains `createFromSource`, `staticGET` |
| `packages/docs/app/llms.txt/route.ts` | llms.txt index route | VERIFIED | Contains `llms`, `revalidate = false` |
| `packages/docs/app/llms-full.txt/route.ts` | llms-full.txt content route | VERIFIED | Contains `getLLMText`, `revalidate = false` |
| `packages/docs/lib/get-llm-text.ts` | LLM text extraction helper | VERIFIED | Contains `getLLMText`, handles `_markdown` field with fallback |
| `packages/docs/content/docs/api/tft.mdx` | TFT API reference | VERIFIED | Contains `AutoTypeTable`, `tftLeagueV1`, title "Teamfight Tactics API" |
| `packages/docs/content/docs/api/val.mdx` | Valorant API reference | VERIFIED | Contains `AutoTypeTable`, `ValPlatformRoute`, title "Valorant API" |
| `packages/docs/content/docs/api/lor.mdx` | LoR API reference | VERIFIED | Contains `AutoTypeTable`, "maintenance mode", title "Legends of Runeterra API" |
| `packages/docs/content/docs/api/riftbound.mdx` | Riftbound API reference | VERIFIED | Contains `AutoTypeTable`, title "Riftbound API" |
| `packages/docs/content/docs/api/riot.mdx` | Riot shared API reference | VERIFIED | Contains `AutoTypeTable`, `accountV1`, title "Riot Shared API" |
| `package.json` (root) | docs:dev and docs:build scripts | VERIFIED | Contains `docs:dev` (pnpm --filter whisper-docs dev) and `docs:build` (chains library build then docs build) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/docs/lib/source.ts` | `packages/docs/content/docs/` | Fumadocs content loader | VERIFIED | `loader` called with `docs.toFumadocsSource()`, `baseUrl: '/docs'` |
| `packages/docs/components/mdx-components.tsx` | `packages/whisper/src/` | `createGenerator` with `tsconfigPath` | VERIFIED | `tsconfigPath: '../whisper/tsconfig.json'` pointing at library source |
| `packages/docs/app/(home)/page.tsx` | `/docs/quickstart` | CTA Link | VERIFIED | `href="/docs/quickstart"` present |
| `packages/docs/app/api/search/route.ts` | `packages/docs/lib/source.ts` | `createFromSource` | VERIFIED | `createFromSource(source)` present |
| `packages/docs/content/docs/api/tft.mdx` | `packages/whisper/src/tft/` | AutoTypeTable path references | VERIFIED | `path="../whisper/src/tft/..."` paths present |
| `packages/docs/content/docs/api/val.mdx` | `packages/whisper/src/val/` | AutoTypeTable path references | VERIFIED | `path="../whisper/src/val/..."` paths present |
| `packages/docs/app/llms.txt/route.ts` | `packages/docs/lib/source.ts` | `llms()` function | VERIFIED | `llms(source).index()` present |
| `packages/docs/content/docs/routing.mdx` | `@wardbox/whisper/lol` | Import of PlatformRoute/PLATFORM/RegionalRoute/REGIONAL | BROKEN | These symbols are not exported from `@wardbox/whisper/lol` subpath. `src/lol/index.ts` does not re-export routing primitives. |

### Data-Flow Trace (Level 4)

Not applicable — this is a static documentation site with no dynamic runtime data flows. AutoTypeTable reads source `.ts` files at build time (verified: build succeeds, 18 pages generated, HTML contains real type content from library source).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full build pipeline succeeds | `pnpm docs:build` | Exit 0, 18 pages generated in `out/` | PASS |
| All 6 API reference pages in output | `ls out/docs/api/*.html` | lol.html, tft.html, val.html, lor.html, riftbound.html, riot.html | PASS |
| All 5 guide pages in output | `ls out/docs/*.html` | quickstart.html, routing.html, rate-limiting.html, caching.html, middleware.html | PASS |
| llms.txt served with structured index | `cat out/llms.txt` | Contains all 11 pages with titles, descriptions, and URLs | PASS |
| LoL HTML contains real AutoTypeTable content | `grep -c "summonerLevel" out/docs/api/lol.html` | 3 matches | PASS |
| pnpm check passes | `pnpm check` | 3 errors: formatting in config.json, page.tsx, import order in search/route.ts | FAIL |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DOC-03 | 06-01, 06-02, 06-03 | Documentation site (Fumadocs) in separate workspace package | PARTIALLY SATISFIED | Site builds and deploys in isolation. Quickstart, guides, and all reference pages exist. Routing guide has broken import paths that will cause user compile errors — fails the "usable" bar for the routing explanation. |
| DOC-04 | 06-01, 06-03 | Auto-generated type tables from source TypeScript | SATISFIED | AutoTypeTable wired to library source via `tsconfigPath`. All 6 API reference pages use `<AutoTypeTable>`. Build produces real type content from TypeScript Compiler API. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/docs/content/docs/routing.mdx` | 17, 36, 47, 73 | Imports non-existent exports from `@wardbox/whisper/lol` | Blocker | Users copying `import type { PlatformRoute } from '@wardbox/whisper/lol'` or `import { PLATFORM } from '@wardbox/whisper/lol'` will get module/export resolution errors. Directly undermines the routing guide's core purpose. |
| `packages/docs/components/mdx-components.tsx` | 15 | `Partial<AutoTypeTableProps>` makes required props optional | Warning | Missing `path` or `name` on `<AutoTypeTable>` won't be caught at TypeScript compile time — error appears only at build/render time. |
| `packages/docs/app/(home)/page.tsx` | 30, 63-66 | Biome formatting violation | Warning | `pnpm check` fails. Auto-fixable with `pnpm check --fix`. |
| `packages/docs/app/api/search/route.ts` | 1-2 | Import ordering violation | Warning | `pnpm check` fails. Auto-fixable with `pnpm check --fix`. |
| `.planning/config.json` | EOF | Missing trailing newline | Warning | `pnpm check` fails. Auto-fixable. |
| `packages/docs/content/docs/quickstart.mdx` | 45, 59, 73, 97 | `apiKey: 'RGAPI-your-key-here'` | Info | Placeholder matches real key format prefix. Not a security issue (obviously fake). Users might copy without substituting. |

### Human Verification Required

The build succeeds and all pages exist in static output. However the core routing page accuracy failure (broken import paths) is a programmatically verified gap — no human testing needed to confirm it is broken.

The following items cannot be verified programmatically and require human testing to confirm the qualitative experience:

#### 1. AutoTypeTable Inline Expandable Sub-Types

**Test:** Navigate to `/docs/api/lol` in the deployed or dev site and click on a nested type in any type table (e.g., `LolMatch.info` which contains `MatchInfo`).
**Expected:** Nested types expand inline rather than navigating to a separate page.
**Why human:** The locked decision specified "inline expandable sub-types." This is a UI interaction behavior not checkable via HTML grep.

#### 2. Routing Guide Explains the Distinction Clearly (Narrative Quality)

**Test:** Navigate to `/docs/routing` and read through without prior knowledge of Riot API.
**Expected:** A developer new to Whisper should understand when to use `'na1'` vs `'americas'` within 2 minutes.
**Why human:** Content comprehension is a human judgment. The code examples would compile correctly after the broken imports are fixed, but whether the narrative explanation is clear enough is a UX question.

### Gaps Summary

Two gaps block full goal achievement:

**Gap 1 (Blocker) — Broken routing imports:**
`routing.mdx` shows code examples that import `PlatformRoute`, `PLATFORM`, `RegionalRoute`, and `REGIONAL` from `@wardbox/whisper/lol`. Confirmed via `src/lol/index.ts`: none of these symbols are re-exported from the `lol` subpath. A developer following the routing guide and copying the import examples will get TypeScript compile errors. This directly undermines the routing page's purpose and breaks the phase goal ("understand the platform/regional routing distinction"). Fix options: (a) add four re-exports to `src/lol/index.ts`, or (b) update `routing.mdx` to use the correct import location (e.g., a `@wardbox/whisper/types` subpath if created, or document that these types are implicit from the method signatures and no direct import is needed).

`ValPlatformRoute` and `VAL_PLATFORM` are correctly exported from `@wardbox/whisper/val` and are not affected.

**Gap 2 (Warning) — pnpm check fails:**
Three auto-fixable Biome errors: trailing newline in `.planning/config.json`, JSX formatting in `packages/docs/app/(home)/page.tsx`, and import ordering in `packages/docs/app/api/search/route.ts`. None affect runtime behavior but `pnpm check` exits non-zero. Fix: `pnpm check --fix`.

---

_Verified: 2026-04-10T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
