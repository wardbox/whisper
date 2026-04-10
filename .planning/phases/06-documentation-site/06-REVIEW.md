---
phase: 06-documentation-site
reviewed: 2026-04-10T00:00:00Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - biome.json
  - package.json
  - packages/docs/app/(home)/layout.tsx
  - packages/docs/app/(home)/page.tsx
  - packages/docs/app/api/search/route.ts
  - packages/docs/app/docs/[[...slug]]/page.tsx
  - packages/docs/app/docs/layout.tsx
  - packages/docs/app/global.css
  - packages/docs/app/layout.tsx
  - packages/docs/app/llms-full.txt/route.ts
  - packages/docs/app/llms.txt/route.ts
  - packages/docs/components/mdx-components.tsx
  - packages/docs/content/docs/api/lol.mdx
  - packages/docs/content/docs/api/lor.mdx
  - packages/docs/content/docs/api/riftbound.mdx
  - packages/docs/content/docs/api/riot.mdx
  - packages/docs/content/docs/api/tft.mdx
  - packages/docs/content/docs/api/val.mdx
  - packages/docs/content/docs/caching.mdx
  - packages/docs/content/docs/index.mdx
  - packages/docs/content/docs/meta.json
  - packages/docs/content/docs/middleware.mdx
  - packages/docs/content/docs/quickstart.mdx
  - packages/docs/content/docs/rate-limiting.mdx
  - packages/docs/content/docs/routing.mdx
  - packages/docs/lib/get-llm-text.ts
  - packages/docs/lib/source.ts
  - packages/docs/next.config.mjs
  - packages/docs/package.json
  - packages/docs/source.config.ts
  - packages/docs/tsconfig.json
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-10
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

The documentation site is well-structured overall. The Next.js + Fumadocs setup is correct, the route handlers are properly marked for static export compatibility (`staticGET`, `revalidate = false`), and all internal MDX links resolve to existing content files. The API reference MDX files reference source paths that exist in the library package.

Two issues require attention before publication: the routing guide documents incorrect import paths for `PlatformRoute`/`RegionalRoute`/`PLATFORM`/`REGIONAL` (those symbols are not exported from `@wardbox/whisper/lol`), and the `AutoTypeTable` wrapper silences required-prop type errors via `Partial<>`.

---

## Warnings

### WR-01: Incorrect import paths in routing guide for PlatformRoute, RegionalRoute, PLATFORM, REGIONAL

**File:** `packages/docs/content/docs/routing.mdx:17-38`

**Issue:** The routing guide instructs users to import `PlatformRoute`, `RegionalRoute`, `PLATFORM`, and `REGIONAL` from `@wardbox/whisper/lol`. These symbols are defined in `packages/whisper/src/types/` but are NOT re-exported from the `@wardbox/whisper/lol` subpath entry point (`src/lol/index.ts`). The package exports map (`packages/whisper/package.json`) has no `./types` subpath either. Code copied from these docs will fail to compile.

Cross-reference: `VAL_PLATFORM` and `ValPlatformRoute` ARE correctly exported from `@wardbox/whisper/val` — only the platform/regional constants are missing from their documented subpath.

**Fix:** Either re-export these from `@wardbox/whisper/lol` (and `@wardbox/whisper/tft` for consistency), or update the docs to show the correct import location. If they are intended to be on `@wardbox/whisper/lol`, add to `src/lol/index.ts`:

```typescript
// In packages/whisper/src/lol/index.ts
export type { PlatformRoute } from '../types/platform.js';
export { PLATFORM } from '../types/platform.js';
export type { RegionalRoute } from '../types/regional.js';
export { REGIONAL } from '../types/regional.js';
```

Or update `routing.mdx` lines 17 and 36 to show the actual import path once it is determined. If no subpath exports them yet, a `./types` export entry in `packages/whisper/package.json` would be the cleanest approach.

---

### WR-02: AutoTypeTable wrapper uses Partial<AutoTypeTableProps>, silencing required-prop errors

**File:** `packages/docs/components/mdx-components.tsx:15`

**Issue:** The `AutoTypeTable` MDX component wrapper accepts `Partial<AutoTypeTableProps>`, making `path` and `name` (required fields of `AutoTypeTableProps`) appear optional. If an MDX file calls `<AutoTypeTable />` without `path` or `name`, TypeScript will not catch the missing props — the error surfaces only at build/render time with a less informative message.

```typescript
// Current — hides required-prop errors
AutoTypeTable: (props: Partial<AutoTypeTableProps>) => (
  <AutoTypeTable {...props} generator={generator} />
),
```

**Fix:** Accept only `Omit<AutoTypeTableProps, 'generator'>` so `path` and `name` remain required while `generator` is provided by the wrapper:

```typescript
AutoTypeTable: (props: Omit<AutoTypeTableProps, 'generator'>) => (
  <AutoTypeTable {...props} generator={generator} />
),
```

---

## Info

### IN-01: Middleware timer example encourages `as any` for custom context properties

**File:** `packages/docs/content/docs/middleware.mdx:71-76`

**Issue:** The request-timing example attaches `_startTime` to context via `(context as any)._startTime = Date.now()`. While this is user-land example code, it shows `any`-casting as the recommended pattern for extending context. Users who copy this pattern will carry `as any` into production.

**Fix:** Consider showing a `WeakMap` or module-scoped `Map` keyed on context reference as an alternative, or add a comment in the example noting that `context as any` is a shortcut and that a typed `WeakMap<RequestContext, number>` is the production-safe approach.

---

### IN-02: get-llm-text.ts accesses _markdown via double type cast

**File:** `packages/docs/lib/get-llm-text.ts:7-9`

**Issue:** The function casts `page.data` to `unknown` then to `Record<string, unknown>` to access `data._markdown`. This bypasses the type system entirely. If the `includeProcessedMarkdown` option is ever removed or renamed in a fumadocs-mdx upgrade, this silently falls back to description-only output with no type error or warning.

```typescript
const data = page.data as unknown as Record<string, unknown>;
const markdown = typeof data._markdown === 'string' ? data._markdown : null;
```

**Fix:** The runtime guard (`typeof data._markdown === 'string'`) is good and prevents crashes. Document the dependency on `source.config.ts`'s `includeProcessedMarkdown: true` with a comment so the connection is not broken during future maintenance:

```typescript
// Requires `includeProcessedMarkdown: true` in source.config.ts docs definition.
// If that option is removed, this falls back to description-only (graceful).
const data = page.data as unknown as Record<string, unknown>;
```

---

### IN-03: quickstart.mdx code example uses a hardcoded placeholder API key string

**File:** `packages/docs/content/docs/quickstart.mdx:45, 59, 73`

**Issue:** Multiple code examples contain `apiKey: 'RGAPI-your-key-here'`. This is intentional placeholder text, but the prefix `RGAPI-` matches the real format of Riot API keys. While this is documentation, a user scanning the page may copy it without substitution. This is a clarity issue, not a security issue (the key is obviously placeholder text).

**Fix:** Use a format that is visually distinct from real keys, such as `'<YOUR_RIOT_API_KEY>'` or `process.env.RIOT_API_KEY`, and add a one-line comment:

```typescript
const client = createClient({
  apiKey: process.env.RIOT_API_KEY!, // or your key string
});
```

This also demonstrates the environment variable pattern which is the recommended production approach per CLAUDE.md.

---

_Reviewed: 2026-04-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
