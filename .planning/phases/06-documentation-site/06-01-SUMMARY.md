---
phase: 06-documentation-site
plan: 01
subsystem: docs
tags: [fumadocs, next.js, documentation, autotypetable]
dependency_graph:
  requires: [library-build]
  provides: [docs-framework, autotypetable-integration, lol-api-reference]
  affects: [packages/docs]
tech_stack:
  added: [fumadocs-core@16, fumadocs-ui@16, fumadocs-mdx@14, fumadocs-typescript@5, next@16, react@19, tailwindcss@4, zod@4]
  patterns: [autotypetable-cross-package, fumadocs-ocean-theme, static-export]
key_files:
  created:
    - packages/docs/package.json
    - packages/docs/next.config.mjs
    - packages/docs/source.config.ts
    - packages/docs/tsconfig.json
    - packages/docs/.gitignore
    - packages/docs/app/layout.tsx
    - packages/docs/app/global.css
    - packages/docs/app/docs/layout.tsx
    - packages/docs/app/docs/[[...slug]]/page.tsx
    - packages/docs/lib/source.ts
    - packages/docs/components/mdx-components.tsx
    - packages/docs/content/docs/index.mdx
    - packages/docs/content/docs/meta.json
    - packages/docs/content/docs/api/lol.mdx
  modified:
    - biome.json
    - package.json
    - pnpm-lock.yaml
decisions:
  - fumadocs-ui/provider/next import path (v16 changed from fumadocs-ui/provider)
  - zod@4 added as direct dependency to resolve defineDocs type inference
  - Source .ts files used for AutoTypeTable (not dist .d.ts) to preserve JSDoc
  - pnpm onlyBuiltDependencies added for esbuild and sharp (Next.js deps)
metrics:
  duration: 6min
  completed: 2026-04-10
  tasks: 2
  files: 16
---

# Phase 6 Plan 01: Fumadocs Framework Scaffold Summary

Fumadocs docs site scaffolded with Next.js 16, React 19, static export, ocean dark theme, and validated AutoTypeTable cross-package type generation from library source files.

## What Was Built

### Task 1: Fumadocs Framework Scaffold (9be47c6)

Scaffolded the complete Fumadocs documentation framework in `packages/docs`:

- **Package configuration**: Added fumadocs-core, fumadocs-ui, fumadocs-mdx, fumadocs-typescript, Next.js 16, React 19, Tailwind CSS 4, and zod as dependencies
- **Next.js config**: Static export (`output: 'export'`) with MDX support via `createMDX`
- **Source config**: Fumadocs MDX content source pointing at `content/docs/`
- **TypeScript config**: Extends base tsconfig with Bundler moduleResolution, JSX preserve, path aliases for `@/*` and `collections/*`
- **Root layout**: RootProvider from `fumadocs-ui/provider/next` with ocean dark theme
- **Docs layout**: DocsLayout with sidebar navigation and "Whisper" title
- **Dynamic page renderer**: Catch-all `[[...slug]]` route with generateStaticParams for static export
- **Content source**: Fumadocs loader with `/docs` base URL
- **Initial content**: Introduction page with feature highlights and navigation links
- **Sidebar config**: meta.json with Getting Started, Guides, and API Reference sections
- **Biome config**: Updated to include `.tsx`, `.mjs` files and exclude `.source/`, `.next/`, `out/`

### Task 2: AutoTypeTable Integration and LoL API Reference (e323732)

Wired AutoTypeTable for cross-package type generation and created a comprehensive LoL API reference page:

- **Generator config**: `createGenerator` with `tsconfigPath` pointing at `../whisper/tsconfig.json` and filesystem cache in `.next/fumadocs-typescript`
- **MDX component registry**: AutoTypeTable registered in `getMDXComponents` for use in MDX content
- **LoL API reference**: All 13 API groups documented with method signatures and response types:
  - Summoner v4, Champion Mastery v4, Champion v3, Match v5, RSO Match v1
  - League v4, League Exp v4, Clash v1, Challenges v1
  - Spectator v5, Status v4, Tournament v5, Tournament Stub v5
- **Path resolution validated**: Source `.ts` files work correctly (not dist), preserving JSDoc comments in rendered output
- **Static build verified**: LoL reference page generates 594KB HTML with real type content (summonerLevel, getByPuuid, LolSummoner all present)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] fumadocs-ui/provider import path changed in v16**
- **Found during:** Task 1
- **Issue:** Plan specified `import { RootProvider } from 'fumadocs-ui/provider'` but fumadocs-ui v16 changed this to `fumadocs-ui/provider/next`
- **Fix:** Updated import to `fumadocs-ui/provider/next`
- **Files modified:** packages/docs/app/layout.tsx
- **Commit:** 9be47c6

**2. [Rule 3 - Blocking] defineDocs type inference requires zod as direct dependency**
- **Found during:** Task 1
- **Issue:** TypeScript error "The inferred type of 'docs' cannot be named without a reference to zod" because fumadocs-mdx internally uses zod@4 for schema validation but it's not hoisted in pnpm
- **Fix:** Added `zod@4` as direct dependency to docs package
- **Files modified:** packages/docs/package.json, pnpm-lock.yaml
- **Commit:** 9be47c6

**3. [Rule 3 - Blocking] pnpm build scripts for esbuild and sharp blocked**
- **Found during:** Task 1
- **Issue:** pnpm warned about ignored build scripts for esbuild and sharp (needed by Next.js)
- **Fix:** Added `pnpm.onlyBuiltDependencies` to root package.json
- **Files modified:** package.json
- **Commit:** 9be47c6

**4. [Rule 1 - Bug] Biome formatting and import ordering**
- **Found during:** Task 1
- **Issue:** Biome check found formatting issues in biome.json (long line), package.json (array formatting), and import ordering in source.config.ts, page.tsx, mdx-components.tsx
- **Fix:** Ran `pnpm check --fix` to auto-format all files
- **Files modified:** biome.json, package.json, source.config.ts, page.tsx, mdx-components.tsx
- **Commit:** 9be47c6

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use `fumadocs-ui/provider/next` instead of `fumadocs-ui/provider` | v16 API change; the `/next` subpath is the correct import for Next.js apps |
| Add zod@4 as direct dependency | Required for TypeScript type inference of `defineDocs` return type in pnpm strict hoisting |
| Source `.ts` files for AutoTypeTable (not `.d.ts`) | Preserves JSDoc comments in rendered type tables; cross-package resolution works via `tsconfigPath` |
| Ocean theme for dark-first design | Clean blue accent fitting the "whisper" brand; matches user decision for dark-first developer-focused minimal theme |

## Verification Results

1. `pnpm install` -- PASSED (all dependencies installed)
2. `pnpm build` (library) -- PASSED (produces .d.ts files)
3. `cd packages/docs && pnpm build` -- PASSED (static export in out/)
4. LoL API reference page exists at `out/docs/api/lol.html` (594KB with real type content)
5. `pnpm check` -- PASSED (no biome errors)
6. AutoTypeTable generates real content (verified: summonerLevel, LolSummoner, getByPuuid in HTML output)

## Self-Check: PASSED

All 15 created/modified files verified present. Both task commits (9be47c6, e323732) verified in git log.
