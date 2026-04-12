# Phase 6: Documentation Site - Research

**Researched:** 2026-03-18
**Domain:** Fumadocs (Next.js-based documentation framework) with TypeScript type table generation
**Confidence:** HIGH

## Summary

Fumadocs is a well-maintained React.js documentation framework built for Next.js App Router. It provides a complete docs solution: MDX content processing, built-in Orama search, TypeDoc-powered type table generation via `fumadocs-typescript`, dark/light theming, and static export support. The framework is actively developed with frequent releases.

The key version decision: **use the latest Fumadocs v16 line** (fumadocs-core@16, fumadocs-ui@16, fumadocs-mdx@14, fumadocs-typescript@5.1) which requires **Next.js 16** and **React 19**. This aligns with the project's "use the latest and greatest" philosophy. These are all docs-package-only dependencies and do not affect the library package.

**Primary recommendation:** Scaffold the docs package with `fumadocs-mdx` for MDX content, `fumadocs-typescript` for auto-generated type tables from the library's built `.d.ts` files, static export via `output: 'export'` in `next.config.mjs`, and the built-in Orama search in static mode. Use the `ocean` or `purple` color theme for the "whisper" brand.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fumadocs (Next.js-based) -- not Starlight or Nextra
- App Router (Fumadocs is built for it)
- Static export (`next export`) -- pure HTML/CSS/JS, deployable anywhere (GitHub Pages, Vercel, Netlify, S3)
- Built-in Fumadocs search (Orama-based, client-side) -- no external search service
- Fumadocs TypeDoc integration (`fumadocs-typescript`) -- reads `.d.ts` files at build time
- Auto-generate tables for both response types (DTOs) and namespace object method signatures
- Types grouped by game module -- one reference page per game (e.g., /api/lol, /api/tft), not per-type or per-API-group
- Inline expandable sub-types -- nested types expand in-place rather than linking elsewhere
- Two main sections: **Guides** (narrative) and **API Reference** (auto-generated)
- Guides: Quickstart, Routing, Rate Limiting, Caching, Middleware
- Quickstart uses LoL as the example game (summoner lookup or match history) -- most popular, most relatable
- Games get API reference pages only -- no per-game guide pages
- Game-specific quirks (ValPlatformRoute, LoR maintenance mode) covered in the routing guide
- `llms.txt` at docs root -- structured text file for LLM consumption (see wasp.sh/llms.txt as reference)
- Dark-first theme (with light mode toggle) -- clean, developer-focused, minimal
- Hero landing page with tagline, feature highlights (zero deps, proactive rate limiting, tree-shaking), install command, and CTA to quickstart

### Claude's Discretion
- Accent color and full color scheme
- Landing page layout and feature highlight copy
- Code example content in guides (beyond the quickstart structure)
- Fumadocs plugin configuration details
- How llms.txt is generated (manual, build script, or plugin)
- Static export configuration specifics

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOC-03 | Documentation site (Fumadocs) in separate workspace package | Fumadocs scaffolding in `packages/docs`, pnpm workspace already configured with `packages/*` glob. Full stack identified: fumadocs-core, fumadocs-ui, fumadocs-mdx, Next.js 16, React 19. Static export via `output: 'export'`. |
| DOC-04 | Auto-generated type tables from source TypeScript | `fumadocs-typescript` package reads `.d.ts` files at build time via TypeScript Compiler API. `AutoTypeTable` component points at `../whisper/dist/**/*.d.ts` paths. Library must be built before docs build. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fumadocs-core | 16.6.17 | Headless docs framework (content loading, search, source) | Required foundation for Fumadocs ecosystem |
| fumadocs-ui | 16.6.17 | UI components (DocsLayout, DocsPage, theme, search dialog) | Pre-built docs UI with dark/light mode, Tailwind CSS v4 |
| fumadocs-mdx | 14.2.10 | MDX content processing (source.config.ts, .source generation) | Standard MDX pipeline for Fumadocs |
| fumadocs-typescript | 5.1.5 | Auto-generated type tables from TypeScript definitions | Reads `.d.ts` via TypeScript Compiler API, renders tables |
| next | 16.x.x | React framework (App Router, static export) | Required peer dependency for fumadocs-ui@16 |
| react | 19.x.x | UI library | Required peer dependency for fumadocs-ui@16 |
| react-dom | 19.x.x | React DOM renderer | Required peer dependency |
| tailwindcss | 4.x.x | Utility CSS framework | Required for fumadocs-ui theme system |
| typescript | ~5.8.0 | TypeScript compiler | Matches library package version |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/mdx | latest | MDX type definitions | Required for MDX content processing |
| @types/react | 19.x.x | React type definitions | Required for TypeScript with React 19 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fumadocs-ui@16 (Next 16) | fumadocs-ui@15.8 (Next 15) | v15 supports Next 14/15 + React 18/19. More conservative but misses latest features. v16 aligns with "latest and greatest" philosophy. |
| fumadocs-typescript@5.1 | fumadocs-typescript@4.0.14 | v4 works with fumadocs-core@15, v5.1 requires fumadocs-core@16. Use v5.1 since we're on v16 line. |

**Installation:**
```bash
cd packages/docs
pnpm add fumadocs-core@16 fumadocs-ui@16 fumadocs-mdx@14 fumadocs-typescript@5 next@16 react@19 react-dom@19 @types/mdx @types/react@19
pnpm add -D tailwindcss@4 typescript@~5.8.0
```

**Version verification:** Versions confirmed via `npm view` on 2026-03-18. fumadocs-core@16.6.17, fumadocs-ui@16.6.17, fumadocs-mdx@14.2.10, fumadocs-typescript@5.1.5, next@16.2.0, react@19.2.4, tailwindcss@4.2.2.

## Architecture Patterns

### Recommended Project Structure
```
packages/docs/
├── app/
│   ├── (home)/
│   │   └── page.tsx              # Landing page (hero, features, CTA)
│   ├── docs/
│   │   ├── layout.tsx            # DocsLayout with sidebar, search, nav
│   │   └── [[...slug]]/
│   │       └── page.tsx          # Dynamic page renderer
│   ├── api/
│   │   ├── lol/
│   │   │   └── page.tsx          # LoL API reference (AutoTypeTable)
│   │   ├── tft/
│   │   │   └── page.tsx          # TFT API reference
│   │   ├── val/
│   │   │   └── page.tsx          # Valorant API reference
│   │   ├── lor/
│   │   │   └── page.tsx          # LoR API reference
│   │   ├── riftbound/
│   │   │   └── page.tsx          # Riftbound API reference
│   │   ├── riot/
│   │   │   └── page.tsx          # Shared (Account-v1) API reference
│   │   └── layout.tsx            # Shared API reference layout
│   ├── layout.tsx                # Root layout with RootProvider
│   ├── global.css                # Tailwind + Fumadocs theme imports
│   ├── llms.txt/
│   │   └── route.ts             # llms.txt index route handler
│   └── llms-full.txt/
│       └── route.ts             # llms-full.txt complete content route
├── content/
│   └── docs/
│       ├── index.mdx             # Docs landing / overview
│       ├── meta.json             # Sidebar navigation config
│       ├── quickstart.mdx        # Quickstart guide (LoL example)
│       ├── routing.mdx           # Platform vs Regional routing guide
│       ├── rate-limiting.mdx     # Rate limiting guide
│       ├── caching.mdx           # Caching guide
│       └── middleware.mdx        # Middleware guide
├── lib/
│   ├── source.ts                 # Fumadocs content source loader
│   └── get-llm-text.ts          # LLM text extraction helper
├── components/
│   └── mdx-components.tsx        # Custom MDX components + AutoTypeTable
├── source.config.ts              # Fumadocs MDX configuration
├── next.config.mjs               # Next.js config (static export, MDX)
├── tsconfig.json                 # TypeScript config for docs
├── package.json                  # Docs package dependencies
└── .gitignore                    # Ignore .next/, .source/, out/
```

### Pattern 1: Content Source Setup
**What:** Fumadocs MDX content source configuration connecting MDX files to the docs framework
**When to use:** Always -- this is the foundation of the docs site
**Example:**
```typescript
// source.config.ts
// Source: https://www.fumadocs.dev/docs/mdx/next
import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig();
```

```typescript
// lib/source.ts
import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
```

### Pattern 2: AutoTypeTable for Type Documentation
**What:** Auto-generated type tables from built `.d.ts` files using the TypeScript Compiler API
**When to use:** On API reference pages to show response types and method signatures
**Example:**
```typescript
// components/mdx-components.tsx
// Source: https://www.fumadocs.dev/docs/ui/components/auto-type-table
import { createGenerator, createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { AutoTypeTable, type AutoTypeTableProps } from 'fumadocs-typescript/ui';

const generator = createGenerator({
  cache: createFileSystemGeneratorCache('.next/fumadocs-typescript'),
  // Points at the library's built output
  tsconfigPath: '../whisper/tsconfig.json',
});

export function getMDXComponents(components?: MDXComponents) {
  return {
    AutoTypeTable: (props: Partial<AutoTypeTableProps>) => (
      <AutoTypeTable {...props} generator={generator} />
    ),
  };
}
```

```tsx
// Usage in API reference page (e.g., app/api/lol/page.tsx)
<AutoTypeTable
  path="../whisper/src/types/generated/lol.ts"
  name="LolSummoner"
/>
```

### Pattern 3: Static Export Configuration
**What:** Next.js static export for CDN-deployable output
**When to use:** Always -- locked decision
**Example:**
```javascript
// next.config.mjs
// Source: https://www.fumadocs.dev/docs/deploying/static
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const config = {
  output: 'export',
  images: { unoptimized: true },
  // For GitHub Pages with basePath:
  // basePath: process.env.NODE_ENV === 'production' ? '/whisper' : '',
};

export default withMDX(config);
```

### Pattern 4: Static Search Configuration
**What:** Client-side Orama search with pre-built static indexes
**When to use:** Always -- required for static export
**Example:**
```typescript
// app/api/search/route.ts
// Source: https://www.fumadocs.dev/docs/headless/search/orama
import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const revalidate = false;
export const { staticGET: GET } = createFromSource(source);
```

Client-side: Fumadocs UI search dialog automatically detects static mode when using `staticGET`.

### Pattern 5: Tailwind CSS v4 Theme Setup
**What:** Dark-first theme with Fumadocs preset
**When to use:** Global CSS setup
**Example:**
```css
/* app/global.css */
/* Source: https://www.fumadocs.dev/docs/ui/theme */
@import 'tailwindcss';
@import 'fumadocs-ui/css/ocean.css';     /* Color theme */
@import 'fumadocs-ui/css/preset.css';

@source '../node_modules/fumadocs-ui/dist/**/*.js';
```

Available dark-friendly themes: `ocean`, `purple`, `dusk`, `catppuccin`, `neutral`, `black`. Recommend `ocean` for a clean blue accent that fits the "whisper" brand.

### Pattern 6: llms.txt Generation
**What:** LLM-friendly text endpoint using Fumadocs built-in support
**When to use:** For the llms.txt requirement
**Example:**
```typescript
// app/llms.txt/route.ts
// Source: https://www.fumadocs.dev/docs/integrations/llms
import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';

export const revalidate = false;

export function GET() {
  return new Response(llms(source).index());
}
```

```typescript
// app/llms-full.txt/route.ts
import { source } from '@/lib/source';
import { getLLMText } from '@/lib/get-llm-text';

export const revalidate = false;

export async function GET() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);
  return new Response(scanned.join('\n\n'));
}
```

```typescript
// lib/get-llm-text.ts
import { source } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');
  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
```

Requires `includeProcessedMarkdown: true` in source.config.ts:
```typescript
export const docs = defineDocs({
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});
```

### Anti-Patterns to Avoid
- **Hand-maintaining type tables:** Never manually write type documentation -- always use AutoTypeTable from `.d.ts` files
- **Running docs dev without building library first:** AutoTypeTable reads built `.d.ts` files; the library MUST be built before `pnpm dev` in docs
- **Putting docs dependencies in root package.json:** All Next.js, React, Fumadocs packages go in `packages/docs/package.json` only
- **Using `src/` directory in docs:** Fumadocs scaffolding uses `app/` at the package root, not `src/app/`
- **Importing from source TypeScript directly:** AutoTypeTable should read from `../whisper/src/` source files (not dist), since it uses the TypeScript Compiler API and needs the source with JSDoc comments

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type documentation tables | Custom script parsing .d.ts | fumadocs-typescript AutoTypeTable | Handles generics, nested types, JSDoc extraction, inline expansion |
| Full-text search | Custom search index builder | Fumadocs Orama integration (built-in) | Pre-built static index generation, client-side search UI |
| Dark/light theme toggle | Custom theme switcher | Fumadocs RootProvider (uses next-themes) | Already integrated, handles SSR hydration |
| MDX processing pipeline | Custom MDX compiler setup | fumadocs-mdx with source.config.ts | Handles .source generation, collections, structured data |
| Sidebar navigation | Custom nav tree builder | Fumadocs meta.json + loader pageTree | Automatic from file structure + meta.json ordering |
| Table of contents | Custom heading extractor | DocsPage toc prop (built-in) | Automatically extracts from MDX, handles scroll tracking |
| llms.txt generation | Custom build script | Fumadocs `llms()` from fumadocs-core/source | Built-in index generation, per-page markdown extraction |

**Key insight:** Fumadocs provides nearly every documentation feature out of the box. The only custom work needed is the landing page layout, guide content, and wiring AutoTypeTable to the library's source files.

## Common Pitfalls

### Pitfall 1: Library Must Be Built Before Docs
**What goes wrong:** AutoTypeTable cannot find type definitions, build fails with cryptic errors
**Why it happens:** `fumadocs-typescript` reads `.d.ts` files at build time via the TypeScript Compiler API. If the library isn't built, those files don't exist.
**How to avoid:** Add a docs build script that runs `pnpm --filter @wardbox/whisper build` before `next build`. In dev, ensure library is built at least once.
**Warning signs:** "Cannot find module" errors, empty type tables, TypeScript resolution failures

### Pitfall 2: AutoTypeTable Path Resolution
**What goes wrong:** Type tables show nothing or wrong types
**Why it happens:** AutoTypeTable paths are relative to the project directory (cwd), NOT the MDX file location, because AutoTypeTable is a React Server Component without access to build-time MDX metadata.
**How to avoid:** Use paths relative to the docs package root: `path="../whisper/src/types/generated/lol.ts"`. Point at SOURCE files (not dist) so JSDoc comments are preserved.
**Warning signs:** Empty tables, "path not found" errors

### Pitfall 3: Static Export Incompatibilities
**What goes wrong:** Build fails or features break in static mode
**Why it happens:** Some Next.js features (image optimization, server-side rendering, rewrites) don't work with `output: 'export'`
**How to avoid:** Set `images: { unoptimized: true }`, use `staticGET` for search, avoid dynamic server-side features. Note that rewrites (needed for llms.txt `.mdx` extension feature) do NOT work in static export -- use direct route handlers instead.
**Warning signs:** Build errors about "export mode", broken images, 404s on search

### Pitfall 4: .source Directory and .gitignore
**What goes wrong:** Generated `.source/` directory gets committed, or TypeScript errors from missing `.source/`
**Why it happens:** fumadocs-mdx generates a `.source/` directory during `next dev` and `next build` with collection output. It should not be committed.
**How to avoid:** Add `.source/` and `.next/` and `out/` to docs `.gitignore`. Import alias `collections/*` maps to `.source/*`.
**Warning signs:** Git status showing .source files, TypeScript "cannot find module 'collections/server'" before first dev run

### Pitfall 5: Biome Configuration for Docs Package
**What goes wrong:** Biome errors on Next.js generated files, JSX files, or .source directory
**Why it happens:** Root biome.json only includes `**/*.ts` and `**/*.json`. Docs package uses `.tsx`, `.jsx`, `.mjs`, `.css` files that aren't covered, and the `.source/` directory should be excluded.
**How to avoid:** Update root `biome.json` to include `**/*.tsx`, `**/*.jsx`, `**/*.mjs` patterns and exclude `.source/`, `.next/`, `out/` directories. Or create a docs-specific biome config.
**Warning signs:** Biome reporting errors in generated files, missing lint coverage on docs code

### Pitfall 6: remarkAutoTypeTable Does Not Generate Type Info in llms.txt
**What goes wrong:** Auto-generated type tables appear as empty objects in llms.txt output
**Why it happens:** Known issue (GitHub Discussion #1600) -- `remarkStringify` relies on `data.value` in mdxJsxAttributeValueExpression nodes which doesn't exist on generated nodes
**How to avoid:** For llms.txt, rely on the guide content (which is plain MDX) rather than expecting type tables to serialize. The API reference pages (which use AutoTypeTable as React Server Components) render correctly in the browser but won't serialize to llms.txt. Consider supplementing llms.txt with a custom section listing available types and their key fields.
**Warning signs:** llms.txt shows `{}` or empty content where type tables should be

### Pitfall 7: Node.js Version Requirement
**What goes wrong:** Fumadocs or Next.js fails to start
**Why it happens:** Fumadocs quick start states Node.js 22 minimum. The project already targets Node 22 LTS for CI.
**How to avoid:** Ensure Node.js 22+ is used for docs development and CI builds
**Warning signs:** Startup errors, incompatible API errors

### Pitfall 8: GitHub Pages basePath and assetPrefix
**What goes wrong:** All assets 404 when deployed to GitHub Pages under a subpath (e.g., `/whisper`)
**Why it happens:** Next.js doesn't prefix asset URLs by default; GitHub Pages serves from a subpath
**How to avoid:** Set `basePath` and optionally `assetPrefix` in next.config.mjs. Add `.nojekyll` file to output to prevent GitHub Pages from ignoring `_next/` directory.
**Warning signs:** CSS/JS not loading, blank page on deploy

## Code Examples

Verified patterns from official sources:

### Root Layout
```typescript
// app/layout.tsx
// Source: https://www.fumadocs.dev/docs/ui/theme
import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';
import './global.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
```

### Docs Layout
```typescript
// app/docs/layout.tsx
// Source: https://www.fumadocs.dev/docs
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{ title: 'Whisper' }}
    >
      {children}
    </DocsLayout>
  );
}
```

### Dynamic Docs Page
```typescript
// app/docs/[[...slug]]/page.tsx
// Source: https://www.fumadocs.dev/docs
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { source } from '@/lib/source';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
```

### MDX Content Example (Quickstart Guide)
```mdx
---
title: Quickstart
description: Get up and running with Whisper in under 5 minutes
---

## Installation

```bash
npm install @wardbox/whisper
```

## Create a Client

```typescript
import { createClient } from '@wardbox/whisper/core';
import { summonerV4 } from '@wardbox/whisper/lol';

const client = createClient({ apiKey: 'RGAPI-your-key-here' });
```

## Make Your First Request

```typescript
// Get a summoner by PUUID
const summoner = await summonerV4.getByPuuid(client, 'na1', 'your-puuid');
console.log(`${summoner.summonerLevel}`);
```
```

### Sidebar Configuration
```json
// content/docs/meta.json
{
  "root": true,
  "pages": [
    "---Getting Started---",
    "quickstart",
    "---Guides---",
    "routing",
    "rate-limiting",
    "caching",
    "middleware"
  ]
}
```

### next.config.mjs (Complete)
```javascript
// next.config.mjs
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  images: { unoptimized: true },
};

export default withMDX(config);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fumadocs v14 (tailwind.config.js) | Fumadocs v15+ (CSS-first Tailwind v4) | Jan 2025 | No more tailwind.config.js; use CSS @import for themes |
| fumadocs-typescript@4 (standalone) | fumadocs-typescript@5 (fumadocs-core@16 peer) | 2025 | Tighter integration, requires fumadocs-core@16 |
| Manual llms.txt | Fumadocs `llms()` from fumadocs-core/source | 2025 | Built-in LLM content generation support |
| Fumadocs v15 (Next 14/15) | Fumadocs v16 (Next 16 only) | 2026 | Requires Next.js 16 and React 19 |
| fumadocs-ui steps/step utilities | fumadocs-ui fd-steps/fd-step | v15 | Renamed to avoid conflicts |

**Deprecated/outdated:**
- `tailwind.config.js` / `createPreset()`: Replaced by CSS-first approach with `@import 'fumadocs-ui/css/preset.css'` in Tailwind CSS v4
- `--fd-primary: 0 0% 0%` CSS variables: Replaced by direct hsl() color definitions in `@theme`
- `.map` import pattern: Old `createMDXSource(map)` replaced by `collections/server` + `toFumadocsSource()` pattern

## Open Questions

1. **AutoTypeTable with cross-package monorepo paths**
   - What we know: AutoTypeTable accepts a `path` prop relative to the docs package cwd. The library source files are at `../whisper/src/`. The generator can be configured with `tsconfigPath` and `basePath`.
   - What's unclear: Whether pointing at source `.ts` files (with JSDoc) vs built `.d.ts` files (without comments in some cases) produces better results. The generator loads tsconfig.json from cwd by default -- it may need the library's tsconfig for proper type resolution.
   - Recommendation: During implementation, test with source files first (`../whisper/src/types/generated/lol.ts`). If resolution issues arise, try pointing at the dist `.d.ts` files and configure `tsconfigPath` to the library's tsconfig. Create a minimal test type table early in development to validate the path approach.

2. **Static export with llms.txt route handlers**
   - What we know: Static export generates HTML in `out/`. Route handlers with `revalidate = false` should pre-render at build time.
   - What's unclear: Whether `llms.txt/route.ts` and `llms-full.txt/route.ts` work correctly in static export mode, since these are API routes, not pages.
   - Recommendation: Test early. If route handlers don't work in static export, generate llms.txt as a static file during a build script step instead.

3. **API reference pages as standalone pages (not MDX)**
   - What we know: The decision calls for one reference page per game with AutoTypeTable. These are React pages, not MDX content.
   - What's unclear: How to integrate standalone TSX pages into the Fumadocs sidebar navigation alongside MDX content. They may need to live under the docs route group with custom routing, or be separate pages linked from the sidebar.
   - Recommendation: Place API reference pages under `app/docs/api/[game]/page.tsx` using the catch-all slug pattern, and add them to the sidebar via `meta.json` with explicit page entries. Alternatively, use MDX pages with embedded `<AutoTypeTable>` components.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification (docs site) |
| Config file | packages/docs/next.config.mjs |
| Quick run command | `cd packages/docs && pnpm dev` |
| Full suite command | `cd packages/docs && pnpm build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOC-03 | Docs site builds and serves from docs workspace in isolation | smoke | `cd packages/docs && pnpm build` | Wave 0 |
| DOC-04 | Auto-generated type tables from compiled TypeScript | smoke | `cd packages/docs && pnpm build` (build succeeds with type tables) | Wave 0 |
| DOC-03 | Quickstart guide shows complete working example | manual-only | Visual inspection of /docs/quickstart page | N/A |
| DOC-03 | Routing page explains platform vs regional with examples | manual-only | Visual inspection of /docs/routing page | N/A |

### Sampling Rate
- **Per task commit:** `cd packages/docs && pnpm dev` (verify dev server starts)
- **Per wave merge:** `cd packages/docs && pnpm build` (full static build succeeds)
- **Phase gate:** Full build green + manual visual review of all 4 success criteria

### Wave 0 Gaps
- [ ] `packages/docs/package.json` -- full dependency list (currently empty placeholder)
- [ ] `packages/docs/next.config.mjs` -- Next.js + Fumadocs MDX config
- [ ] `packages/docs/source.config.ts` -- Content source configuration
- [ ] `packages/docs/tsconfig.json` -- TypeScript config for docs package
- [ ] `packages/docs/app/layout.tsx` -- Root layout with RootProvider
- [ ] Framework install: `cd packages/docs && pnpm add fumadocs-core@16 fumadocs-ui@16 fumadocs-mdx@14 fumadocs-typescript@5 next@16 react@19 react-dom@19`

## Sources

### Primary (HIGH confidence)
- npm registry -- all package versions verified via `npm view [package] version` on 2026-03-18
- [Fumadocs TypeScript Integration](https://www.fumadocs.dev/docs/integrations/typescript) -- AutoTypeTable setup, remarkAutoTypeTable, generator config
- [Fumadocs AutoTypeTable](https://www.fumadocs.dev/docs/ui/components/auto-type-table) -- Component props, path resolution, server component constraints
- [Fumadocs MDX Next.js Setup](https://www.fumadocs.dev/docs/mdx/next) -- source.config.ts, next.config.mjs, content source loader
- [Fumadocs Static Build](https://www.fumadocs.dev/docs/deploying/static) -- Static export config, search in static mode
- [Fumadocs Theme](https://www.fumadocs.dev/docs/ui/theme) -- CSS imports, color themes, dark/light mode
- [Fumadocs LLM Integration](https://www.fumadocs.dev/docs/integrations/llms) -- llms.txt route handlers, getLLMText, source config

### Secondary (MEDIUM confidence)
- [Deploy Fumadocs to GitHub Pages](https://zephinax.com/blog/deploy-nextjs-fumadocs-github-pages) -- basePath/assetPrefix config, .nojekyll file
- [Setup Fumadocs with Next.js in 5 Minutes](https://www.danielfullstack.com/article/setup-fumadocs-with-nextjs-in-5-minutes) -- Complete file structure, layout/page setup
- [wasp.sh/llms.txt](https://wasp.sh/llms.txt) -- Reference format for llms.txt structure

### Tertiary (LOW confidence)
- [GitHub Discussion #1600](https://github.com/fuma-nama/fumadocs/discussions/1600) -- remarkAutoTypeTable does not generate type info in llms.txt (known limitation, workaround unclear)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified on npm registry, peer dependency chains confirmed
- Architecture: HIGH -- patterns from official Fumadocs documentation, verified with multiple sources
- Pitfalls: HIGH -- identified from official docs, GitHub discussions, and deployment guides
- AutoTypeTable cross-package paths: MEDIUM -- official docs don't cover monorepo scenarios explicitly; path resolution documented but not in workspace context

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- Fumadocs v16 is recent but well-documented)
