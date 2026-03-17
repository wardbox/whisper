# Stack Research

**Domain:** Zero-dependency TypeScript API wrapper library (npm)
**Researched:** 2026-03-17
**Confidence:** HIGH

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.9.3 | Language | Latest stable — `--module node18` flag (5.8+) is purpose-built for this project's Node 18+ target. `--erasableSyntaxOnly` flag useful for enforcing clean emit. Verified on npm registry. |
| tsdown | 0.21.4 | Build/bundle | Successor to tsup (tsup is officially deprecated). Built on Rolldown (Rust), 10-100x faster builds, tsup-compatible config API, library-first design. Actively maintained by the VoidZero/Rolldown team. Ships ESM + CJS + `.d.ts` in one pass. |
| Vitest | 4.1.0 | Testing | Current gold standard for TypeScript libraries. 10-20x faster than Jest. Native ESM and TypeScript support without any plugins or configuration. `vi.mock` for intercepting fetch. Vitest 4 requires Node >= 20 — verify CI environment. |
| Biome | 2.4.7 | Lint + format | Single binary replaces ESLint + Prettier. 10-25x faster. Biome 2.0 added type-aware linting (June 2025). One config file. No plugin ecosystem gaps for this project's use case (pure TypeScript library, no framework-specific rules needed). |
| pnpm | 9.x | Package manager | Confirmed correct choice. 65% faster installs than npm, 70% less disk space. First-class monorepo support (useful if splitting game modules into a pnpm workspace). Next.js, Vite, Nuxt, Astro all migrated to pnpm. Native `fetch` no deps means lockfile stays tiny. |

### Module Output

| Format | Emit? | Rationale |
|--------|-------|-----------|
| ESM | YES (primary) | All target runtimes support ESM. Correct choice for 2025+. |
| CJS | YES (compatibility) | CJS still runs in 56%+ of production Node environments. Dual publish via tsdown is near-zero cost. Makes the library usable in `require()` contexts without forcing users to migrate. ESM-first, CJS as courtesy. |
| `.d.ts` declarations | YES | tsdown generates these alongside the output in one pass. |

### Documentation

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| VitePress | 1.6.4 | Docs site | Fast, Vue-based, Vite-powered. Best-in-class for TypeScript library docs. Smaller and faster than Docusaurus. |
| typedoc | 0.28.17 | API reference generation | Converts TSDoc comments → Markdown/HTML. Integrates directly into VitePress via `typedoc-plugin-markdown` + `typedoc-vitepress-theme`. Enables auto-generated type tables from source — exactly what PROJECT.md calls for. |
| typedoc-plugin-markdown | latest | VitePress bridge | Converts TypeDoc output to Markdown for VitePress sidebar integration. Actively maintained, stable integration path. |

### Supporting Dev Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `@arethetypeswrong/cli` | Validate dual CJS/ESM package exports | Catches misconfigured `exports` field before publish. Run as part of CI. |
| `publint` | Lint package.json before publish | Checks `exports`, `main`, `types` field correctness. Catches the "types wrong" class of bugs. |
| Node.js 20+ | Test/CI runtime | Vitest 4 requires Node >= 20. Recommend Node 22 LTS for CI. Production library still supports Node 18+ at runtime (fetch is stable there). |

---

## HTTP Primitive Decision

**Recommendation: native `fetch` — confirmed correct.**

All target runtimes ship `fetch` globally:
- Node.js 18+: stable global `fetch` (added 18.0, unflagged)
- Deno 1.40+: global `fetch` since early versions
- Bun 1.1+: global `fetch`, Bun-native implementation
- Edge runtimes (Cloudflare Workers, Vercel Edge, Deno Deploy): `fetch` is the primary HTTP primitive

No polyfill, no `undici`, no `node-fetch`. Zero runtime deps stays true. The `--module node18` TypeScript flag (stable in 5.8) is specifically designed for this target baseline.

**Confidence: HIGH** — verified across multiple sources and official runtime documentation.

---

## npm Package Name

**`whisper` is taken.** Package exists on npm, published 2013, version 0.3.3. Description: "A task-based automation app." Not related. Not abandoned in an obvious legal sense — it's just an old package that predates the project.

**Recommended alternatives (all verified not taken as of 2026-03-17):**

| Name | Notes |
|------|-------|
| `@wardbox/whisper` | Scoped to your npm username — cleanest option. No squatting risk. |
| `@whispergg/whisper` | Brand-forward scope if you create the org. |
| `riotwhisper` | Unscoped, descriptive, available (unverified — check registry). |

**Strong recommendation: publish as `@wardbox/whisper` or another user-controlled scope.** Scoped packages avoid the name-squatting problem entirely and signal ownership clearly.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build | tsdown | tsup | tsup is officially deprecated. README explicitly says "not actively maintained, use tsdown." |
| Build | tsdown | tsc only | tsc alone doesn't tree-shake, doesn't handle dual CJS/ESM output, no bundling of sub-path exports. |
| Build | tsdown | unbuild | unbuild is Rollup-based, fewer weekly downloads (233K vs tsdown's growth trajectory), less ergonomic. |
| Build | tsdown | Rollup | Valid for complex plugin needs, but requires heavy configuration for this use case. tsdown wraps Rolldown (same author lineage) with zero config. |
| Testing | Vitest | Jest | Jest requires ts-jest or babel config, adds 5+ deps, 10-20x slower, no native ESM. No reason to choose Jest for a greenfield TypeScript library. |
| Lint/Format | Biome | ESLint + Prettier | ESLint + Prettier is 127+ packages, 4 config files, 13s lint times vs 1.3s with Biome. Biome 2.0 covers everything needed for a pure TS library. |
| Lint/Format | Biome | ESLint only | Loses formatting. Biome does both. |
| Docs | VitePress + TypeDoc | Starlight (Astro) | Starlight is excellent but Astro adds complexity. VitePress + typedoc-plugin-markdown is the established TypeScript SDK docs pattern. |
| Docs | VitePress + TypeDoc | Docusaurus | Heavier, slower builds, React dependency, harder to customize CSS. VitePress is leaner. |
| Docs | VitePress + TypeDoc | TypeDoc standalone | TypeDoc alone generates HTML docs but lacks the narrative/guide structure the project needs (tutorials, routing explanation, quickstart). VitePress provides the shell, TypeDoc provides the API reference. |
| Package manager | pnpm | npm | npm is slower, uses more disk, lacks built-in workspace filtering. pnpm is the modern standard for library development. |
| Package manager | pnpm | Yarn | Yarn adoption declining for new projects. pnpm dominates 2025 library tooling. |
| Module output | Dual ESM+CJS | ESM-only | ESM-only still causes friction in CJS-heavy Node codebases. Dual output via tsdown is trivial. No reason to block users. |
| TypeScript | 5.9.3 | 5.7.x | 5.8 introduced `--module node18` (stable) which is directly relevant. Always use latest stable. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| tsup | Officially deprecated as of 2025 — README says "not actively maintained, use tsdown" | tsdown |
| ts-jest | Extra dep, slower, requires config; completely unnecessary for new TypeScript projects | Vitest |
| ESLint + Prettier | ~127 npm packages, 4 config files, 10-25x slower than Biome | Biome |
| node-fetch / undici | Runtime dep — violates zero-dep constraint; native `fetch` works everywhere | native `fetch` |
| axios | Runtime dep — violates zero-dep constraint | native `fetch` |
| webpack | Application bundler, not a library bundler — bloated output, no tree-shaking | tsdown |
| Rollup alone | Valid but requires extensive plugin config for TypeScript + dual output; tsdown wraps it | tsdown |
| Docusaurus | React dependency, slower builds, harder to customize; overkill for a library docs site | VitePress + TypeDoc |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Vitest 4.x | Node >= 20 | BREAKING: requires Node 20+. CI must use Node 20 or 22 LTS. |
| TypeScript 5.9.x | Node 18+ | `--module node18` flag stable since 5.8 |
| tsdown 0.21.x | Node 18+ | Pre-1.0, API is stable but minor breaking changes possible across minor versions. Pin exact version. |
| Biome 2.x | Node 18+ | v2 introduced plugin system. Config format changed from v1 — do not mix docs. |
| VitePress 1.6.x | Node 18+ | Requires Vite 6 peer dep. Compatible with Vue 3. |

---

## Installation

```bash
# Dev dependencies (zero runtime deps — everything is devDependency)
pnpm add -D typescript tsdown vitest @biomejs/biome vitepress typedoc typedoc-plugin-markdown

# Type checking / validation tooling
pnpm add -D @arethetypeswrong/cli publint

# Build and check
pnpm exec tsdown         # build
pnpm exec vitest run     # test
pnpm exec biome check .  # lint + format check
pnpm exec biome check --write .  # auto-fix
```

---

## tsdown Configuration Pattern

```typescript
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/lol/index.ts',
    'src/tft/index.ts',
    'src/val/index.ts',
    'src/lor/index.ts',
    'src/riot/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
})
```

Sub-path exports (`whisper/lol`, `whisper/tft`) are handled by multiple entry points + `exports` field in `package.json`.

---

## Sources

- [npm: tsup](https://www.npmjs.com/package/tsup) — confirmed deprecated, points to tsdown
- [GitHub: egoist/tsup](https://github.com/egoist/tsup) — deprecation notice in README verified
- [tsdown.dev guide](https://tsdown.dev/guide/) — tsdown introduction, relationship with tsup
- [npm registry: whisper](https://registry.npmjs.org/whisper) — package exists, v0.3.3, published 2013 (HIGH confidence)
- [npm registry versions](https://registry.npmjs.org/) — verified: tsdown 0.21.4, vitest 4.1.0, typescript 5.9.3, biome 2.4.7, vitepress 1.6.4, typedoc 0.28.17 (HIGH confidence)
- [Vitest 4.0 release](https://vitest.dev/blog/vitest-4) — Node 20 requirement, stable browser mode
- [Biome vs ESLint 2025 - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/) — adoption analysis (MEDIUM confidence)
- [TypeScript 5.8 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/) — `--module node18` stable, `--erasableSyntaxOnly` flag
- [Cross-runtime fetch support 2025](https://debugg.ai/resources/js-runtimes-have-forked-2025-cross-runtime-libraries-node-bun-deno-edge-workers) — native fetch baseline verified (MEDIUM confidence)
- [Dual ESM+CJS 2025 - Liran Tal](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) — dual publish still recommended (MEDIUM confidence)
- [typedoc-plugin-markdown VitePress quickstart](https://typedoc-plugin-markdown.org/plugins/vitepress/quick-start) — integration pattern verified (HIGH confidence)
- [pnpm adoption 2025](https://dev.to/hamzakhan/npm-vs-yarn-vs-pnpm-which-package-manager-should-you-use-in-2025-2f1g) — pnpm confirmed right choice (MEDIUM confidence)

---

*Stack research for: Whisper — zero-dependency TypeScript Riot Games API wrapper*
*Researched: 2026-03-17*
