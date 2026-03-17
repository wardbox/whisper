# Phase 1: Foundation - Research

**Researched:** 2026-03-17
**Domain:** TypeScript library scaffolding — pnpm workspace, tsdown, Biome, Vitest, routing types
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Routing type design**
- Plain string literal unions for PlatformRoute and RegionalRoute (no branded types, no enums)
- Users pass raw strings ('na1', 'americas') directly to methods — no construction step needed
- Also export constants objects (PLATFORM.NA1, REGIONAL.AMERICAS) for IDE autocomplete discoverability
- Both raw strings and constants work interchangeably
- Single PlatformRoute union with all 17 values, single RegionalRoute union with 4 values
- Per-method types narrow to game-specific subsets at the endpoint level (Phase 4+)
- Include `toRegional()` mapping utility (e.g., 'na1' -> 'americas') since users frequently need both routing types for the same player

**Package & export structure**
- Subpath exports only — no top-level client that wraps all games
- Users import per-game: `@wardbox/whisper/lol`, `@wardbox/whisper/riot`, etc.
- No convenience re-export from `@wardbox/whisper` root — encourages lighter bundles
- Flat game dirs in src/ — core/, types/, lol/, tft/, val/, lor/, riftbound/, riot/ all at src/ top level

**TypeScript & build config**
- Maximum strict: `strict: true` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- ES2022 target — matches Node 18+ baseline, includes top-level await, private fields, error.cause
- NodeNext module resolution — explicit .js extensions in imports, strictest resolution, works in all target runtimes

**Workspace layout**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Project uses tsdown for builds with dual ESM+CJS output | tsdown 0.21.4 — `format: ['esm', 'cjs']` + `dts: true` covers this; package.json `exports` field maps `.cjs`/`.js` per subpath |
| FOUND-02 | Biome configured for linting and formatting | Biome 2.4.7 — single `biome.json` at root with `recommended: true` + overrides for generated files |
| FOUND-03 | Vitest test suite with CI pipeline on Node 22 LTS | Vitest 4.1.0 — `vitest.config.ts` with `environment: 'node'`; GHA workflow pinned to `node-version: '22'` |
| FOUND-04 | `@arethetypeswrong/cli` and `publint` in CI | attw 0.18.2, publint 0.3.18 — run `attw --pack` and `publint` in CI after build step |
| FOUND-05 | pnpm workspace with library + docs as separate packages | `pnpm-workspace.yaml` listing `packages/*`; library package under `packages/whisper`, docs under `packages/docs` |
| FOUND-06 | Zero runtime dependencies in the library package | No `dependencies` key in `packages/whisper/package.json`; only `devDependencies` |
| TYPE-01 | Platform routing type as literal union (17 values) | Plain `type PlatformRoute = 'na1' \| 'br1' \| 'la1' \| 'la2' \| 'jp1' \| 'kr' \| 'me1' \| 'eun1' \| 'euw1' \| 'tr1' \| 'ru' \| 'oc1' \| 'ph2' \| 'sg2' \| 'th2' \| 'tw2' \| 'vn2'` |
| TYPE-02 | Regional routing type as literal union (4 values) | Plain `type RegionalRoute = 'americas' \| 'europe' \| 'asia' \| 'sea'` |
| TYPE-03 | Every API method typed to accept only the correct routing type | Function signatures with `route: PlatformRoute` or `route: RegionalRoute` — enforced structurally |
| TYPE-04 | Invalid routing produces a compile-time type error | Literal union approach: passing `'americas'` where `PlatformRoute` is expected errors because `'americas'` is not in the union |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire developer toolchain and typed routing primitives for the `@wardbox/whisper` library. The stack is tsdown (Rolldown-powered bundler), Biome (lint + format), Vitest (tests), and a pnpm workspace. All four tools are modern, actively maintained, and align with the project's "latest and greatest" philosophy.

The central architectural decision for this phase — plain string literal unions with companion constants — is the right choice. Branded types add import overhead and construction ceremony; enums produce non-tree-shakeable runtime code. A `type PlatformRoute = 'na1' | 'euw1' | ...` union gives compile-time route enforcement (TYPE-04) for free because TypeScript structural typing rejects any string not in the union. The `PLATFORM` and `REGIONAL` constants objects are pure `as const` assertions with zero runtime cost.

For the Claude's Discretion question of library placement: put the library in `packages/whisper/` (not the repo root). This keeps the root clean for shared config files, avoids tsdown and pnpm competing over root-level `package.json` fields, and matches the canonical pnpm workspace pattern where `pnpm-workspace.yaml` points to `packages/*`.

**Primary recommendation:** Scaffold `packages/whisper` as the library package; write routing types as plain literal unions + `as const` constant objects; configure tsdown with `format: ['esm', 'cjs']` and one entry per game subpath; share `tsconfig.base.json` and `biome.json` from root.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tsdown | 0.21.4 | Dual ESM+CJS bundler with DTS | Rolldown-powered (Rust, very fast); preconfigures library output; successor to tsup; 5.5k projects use it |
| @biomejs/biome | 2.4.7 | Lint + format in one tool | Zero config for defaults; Rust-speed; replaces ESLint+Prettier; single config file |
| vitest | 4.1.0 | Test runner | Native ESM, TypeScript-first, no transform config needed; `pnpm vitest run` is zero-setup |
| typescript | 5.8.x | Type checking | Project locked to TypeScript; ES2022 target + NodeNext resolution |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @arethetypeswrong/cli | 0.18.2 | Package exports type correctness checker | CI only — verifies `.d.ts` resolves under all module modes |
| publint | 0.3.18 | package.json exports field linter | CI only — catches missing `types`, wrong `main`/`exports` fields |
| @vitest/coverage-v8 | 4.1.0 | Native V8 code coverage | Same version as vitest; zero-transform coverage for library code |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsdown | tsup | tsup is stable and battle-tested but uses esbuild (slower TS emit); tsdown (Rolldown/Oxc) is faster and the intended successor. Project explicitly chose tsdown. |
| Biome | ESLint + Prettier | Two tools vs one; slower; more config. Biome handles both. |
| Vitest | Jest | Jest requires transform config for ESM TypeScript; Vitest is native ESM and simpler for this stack. |
| Plain literal union | Branded types | Branded types require construction helpers and import overhead. Literal unions are zero-cost and user-friendly. Project locked this decision. |

**Installation (library package):**
```bash
pnpm add -D tsdown typescript @biomejs/biome vitest @vitest/coverage-v8 @arethetypeswrong/cli publint
```

**Version verification (confirmed 2026-03-17 via npm registry):**
- tsdown: 0.21.4 (published 2026-03-16 — actively maintained)
- @biomejs/biome: 2.4.7 (latest stable; 2.0.0-beta.6 in beta)
- vitest: 4.1.0 (current stable; requires Node 20+ to run tests)
- @arethetypeswrong/cli: 0.18.2
- publint: 0.3.18

---

## Architecture Patterns

### Recommended Project Structure
```
whisper/                          # repo root
├── packages/
│   ├── whisper/                  # library package (@wardbox/whisper)
│   │   ├── src/
│   │   │   ├── core/             # HTTP client, rate limiter, cache (Phase 2)
│   │   │   ├── types/            # routing types, generated types, overrides
│   │   │   │   ├── generated/    # auto-generated (Phase 3) — do not hand-edit
│   │   │   │   ├── overrides/    # hand-written unions/enums
│   │   │   │   ├── platform.ts   # PlatformRoute union + PLATFORM constants
│   │   │   │   ├── regional.ts   # RegionalRoute union + REGIONAL constants
│   │   │   │   └── routing.ts    # toRegional() utility
│   │   │   ├── lol/              # LoL endpoints (Phase 4)
│   │   │   ├── tft/              # TFT endpoints (Phase 5)
│   │   │   ├── val/              # Valorant endpoints (Phase 5)
│   │   │   ├── lor/              # LoR endpoints (Phase 5)
│   │   │   ├── riftbound/        # Riftbound endpoints (Phase 5)
│   │   │   └── riot/             # account-v1 shared endpoints (Phase 4)
│   │   ├── package.json
│   │   ├── tsconfig.json         # extends ../../tsconfig.base.json
│   │   ├── tsdown.config.ts
│   │   └── vitest.config.ts
│   └── docs/                     # docs site (Phase 6)
│       └── package.json
├── scripts/
│   └── generate-schema/          # schema generation (Phase 3)
├── tsconfig.base.json            # shared TS config
├── biome.json                    # shared lint/format config
├── pnpm-workspace.yaml
└── package.json                  # root (scripts only, no deps)
```

### Pattern 1: Workspace Configuration
**What:** Root `pnpm-workspace.yaml` declares all packages; shared config at root extended by each package.
**When to use:** Always — this is the workspace bootstrap.

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
```

Root `package.json` (scripts only, never shipped):
```json
{
  "name": "whisper-root",
  "private": true,
  "scripts": {
    "build": "pnpm --filter @wardbox/whisper build",
    "test": "pnpm --filter @wardbox/whisper test",
    "check": "biome check .",
    "check:fix": "biome check --fix ."
  }
}
```

### Pattern 2: tsdown Dual Output with Subpath Exports
**What:** One tsdown config produces ESM (`.js`) and CJS (`.cjs`) for each entry; `package.json` exports maps both per subpath.
**When to use:** Every entry point that becomes a subpath export.

`packages/whisper/tsdown.config.ts`:
```typescript
// Source: tsdown.dev + rolldown/tsdown GitHub
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    'lol/index': 'src/lol/index.ts',
    'tft/index': 'src/tft/index.ts',
    'val/index': 'src/val/index.ts',
    'lor/index': 'src/lor/index.ts',
    'riftbound/index': 'src/riftbound/index.ts',
    'riot/index': 'src/riot/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  platform: 'neutral',   // runtime-agnostic — no Node.js polyfills injected
})
```

`packages/whisper/package.json` (exports field):
```json
{
  "name": "@wardbox/whisper",
  "version": "0.1.0",
  "type": "module",
  "sideEffects": false,
  "exports": {
    "./lol": {
      "types": "./dist/lol/index.d.ts",
      "import": "./dist/lol/index.js",
      "require": "./dist/lol/index.cjs"
    },
    "./tft": {
      "types": "./dist/tft/index.d.ts",
      "import": "./dist/tft/index.js",
      "require": "./dist/tft/index.cjs"
    },
    "./val": {
      "types": "./dist/val/index.d.ts",
      "import": "./dist/val/index.js",
      "require": "./dist/val/index.cjs"
    },
    "./lor": {
      "types": "./dist/lor/index.d.ts",
      "import": "./dist/lor/index.js",
      "require": "./dist/lor/index.cjs"
    },
    "./riftbound": {
      "types": "./dist/riftbound/index.d.ts",
      "import": "./dist/riftbound/index.js",
      "require": "./dist/riftbound/index.cjs"
    },
    "./riot": {
      "types": "./dist/riot/index.d.ts",
      "import": "./dist/riot/index.js",
      "require": "./dist/riot/index.cjs"
    }
  },
  "files": ["dist"],
  "devDependencies": {}
}
```

Note: No `"."` root export — locked decision. No `dependencies` key — FOUND-06.

### Pattern 3: Routing Type Design
**What:** Plain string literal unions + `as const` constants. Zero runtime cost; compile-time enforcement.
**When to use:** This IS the routing type implementation.

`src/types/platform.ts`:
```typescript
// Source: TypeScript Handbook — Literal Types
/** All Riot API platform routing values */
export type PlatformRoute =
  | 'na1' | 'br1' | 'la1' | 'la2'   // Americas
  | 'jp1' | 'kr'                       // Asia
  | 'me1' | 'eun1' | 'euw1' | 'tr1' | 'ru'  // Europe
  | 'oc1' | 'ph2' | 'sg2' | 'th2' | 'tw2' | 'vn2'  // SEA

/** Platform routing constants for IDE discoverability */
export const PLATFORM = {
  NA1: 'na1',
  BR1: 'br1',
  LA1: 'la1',
  LA2: 'la2',
  JP1: 'jp1',
  KR:  'kr',
  ME1: 'me1',
  EUN1: 'eun1',
  EUW1: 'euw1',
  TR1:  'tr1',
  RU:   'ru',
  OC1:  'oc1',
  PH2:  'ph2',
  SG2:  'sg2',
  TH2:  'th2',
  TW2:  'tw2',
  VN2:  'vn2',
} as const satisfies Record<string, PlatformRoute>
```

`src/types/regional.ts`:
```typescript
/** All Riot API regional routing values */
export type RegionalRoute = 'americas' | 'europe' | 'asia' | 'sea'

/** Regional routing constants for IDE discoverability */
export const REGIONAL = {
  AMERICAS: 'americas',
  EUROPE:   'europe',
  ASIA:     'asia',
  SEA:      'sea',
} as const satisfies Record<string, RegionalRoute>
```

`src/types/routing.ts`:
```typescript
import type { PlatformRoute, RegionalRoute } from './platform.js'
import type { } from './regional.js'

const PLATFORM_TO_REGIONAL: Record<PlatformRoute, RegionalRoute> = {
  na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas',
  jp1: 'asia',     kr:  'asia',
  me1: 'europe',   eun1: 'europe', euw1: 'europe', tr1: 'europe', ru: 'europe',
  oc1: 'sea',      ph2: 'sea',     sg2: 'sea',     th2: 'sea',    tw2: 'sea', vn2: 'sea',
}

/** Map a platform route to its corresponding regional route */
export function toRegional(platform: PlatformRoute): RegionalRoute {
  return PLATFORM_TO_REGIONAL[platform]
}
```

Key detail: `satisfies Record<string, PlatformRoute>` on the constants objects ensures the values stay in sync with the union — if you add a platform to the type but forget the constant (or vice versa), TypeScript errors.

### Pattern 4: TypeScript Base Configuration
**What:** Strict tsconfig at root, extended per package with NodeNext resolution.

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": false,
    "isolatedModules": true,
    "skipLibCheck": false
  }
}
```

`packages/whisper/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### Pattern 5: Biome Root Configuration
**What:** Single `biome.json` at repo root; applies to all packages via glob includes.

`biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.7/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": ["**/*.ts", "**/*.json"],
    "ignore": ["**/dist/**", "**/node_modules/**", "**/src/types/generated/**"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  }
}
```

Note: `src/types/generated/**` excluded from linting — generated files will violate formatting rules deliberately.

### Pattern 6: Vitest Configuration
**What:** Minimal vitest config in the library package; node environment.

`packages/whisper/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types/generated/**'],
    },
  },
})
```

### Pattern 7: GitHub Actions CI
**What:** Single workflow running build, test, check, attw, publint on Node 22 LTS.

`.github/workflows/ci.yml` (skeleton):
```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      - run: pnpm check
      - run: pnpm --filter @wardbox/whisper exec attw --pack
      - run: pnpm --filter @wardbox/whisper exec publint .
```

### Anti-Patterns to Avoid
- **Root-level library package:** Putting the library in the repo root makes it a workspace root, which conflicts with shared config placement and makes the `pnpm-workspace.yaml` awkward. Use `packages/whisper/`.
- **Top-level `"."` export in `package.json`:** Locked decision — no root barrel. Don't add it as a "convenience."
- **`"dependencies"` key in library `package.json`:** The entire value proposition of zero-dep is broken the moment a runtime dep appears. `devDependencies` only.
- **Importing without `.js` extension under NodeNext:** With `"moduleResolution": "NodeNext"`, relative imports must use `.js` extension even when the source file is `.ts`. `import { foo } from './foo'` will fail; use `import { foo } from './foo.js'`.
- **`"type": "module"` on root `package.json`:** This would affect scripts and config files at the root. Only the library `packages/whisper/package.json` gets `"type": "module"`.
- **Enum-based routing:** TypeScript enums generate runtime code and are not tree-shakeable. The project explicitly chose literal unions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dual ESM+CJS output | Custom Rollup config | tsdown | Declaration file generation, format-per-target config, `platform: 'neutral'` — all handled |
| Lint + format | Custom ESLint config + Prettier | Biome 2.x | Biome's recommended ruleset covers 200+ rules; Prettier-compatible formatting; one tool |
| Package exports correctness | Manual inspection | attw + publint | attw simulates TypeScript resolution under all `moduleResolution` modes; publint catches malformed `exports` fields that pass visual inspection |
| TypeScript project references | Custom build ordering | pnpm `--filter` with workspace protocol | pnpm handles build ordering natively with `workspace:*` deps |
| Route validation | Runtime string checks | TypeScript literal unions | Compile-time enforcement is free; runtime checks add bundle weight for zero gain in a typed codebase |

**Key insight:** Every "build correctness" problem in TypeScript library publishing (wrong `.d.ts` paths, missing CJS condition, resolution mode mismatches) has known tooling solutions. attw and publint together catch nearly all of them before the package is published.

---

## Common Pitfalls

### Pitfall 1: NodeNext Requires `.js` Extensions
**What goes wrong:** `import { PlatformRoute } from './types/platform'` compiles but fails at runtime in Node.js ESM because Node requires the extension.
**Why it happens:** TypeScript historically allowed extensionless imports; NodeNext mode enforces the Node.js spec.
**How to avoid:** Always write `'./types/platform.js'` in source even though the file is `platform.ts`. tsdown resolves this correctly during bundling.
**Warning signs:** `ERR_MODULE_NOT_FOUND` at runtime; `attw` reports "missing module" errors.

### Pitfall 2: `sideEffects: false` Missing from `package.json`
**What goes wrong:** Bundlers (webpack, Rollup, esbuild) cannot tree-shake the library, pulling in unused game modules.
**Why it happens:** Without the flag, bundlers conservatively assume any import might have side effects.
**How to avoid:** Set `"sideEffects": false` in `packages/whisper/package.json`. This is separate from tsdown config — it's a package-level declaration.
**Warning signs:** `publint` warns; bundle analyzer shows entire library in a bundle that only imports `lol`.

### Pitfall 3: Vitest 4 Requires Node 20+ to Run
**What goes wrong:** CI passes on Node 22 but local dev on Node 18 causes vitest to fail on startup (not test failure — startup crash).
**Why it happens:** Vitest 4.x dropped Node 18 support for the test runner itself. The library targets Node 18+ at **runtime**, but the dev toolchain needs Node 20+.
**How to avoid:** Pin CI to Node 22 LTS. Add `.nvmrc` or `engines.node` in root `package.json` to `>=20.0.0` for developer toolchain.
**Warning signs:** `Error: The engine "node" is incompatible with this module` on `pnpm install` or `pnpm test`.

### Pitfall 4: `attw` Reports `FalseCJS` or `FalseESM`
**What goes wrong:** `@arethetypeswrong/cli` fails CI with cryptic module resolution errors even though builds look correct.
**Why it happens:** `types` condition in `exports` field must come BEFORE `import`/`require`. TypeScript resolves the first matching condition; if `import` is listed first, TypeScript under `bundler` resolution may not find types.
**How to avoid:** Always order: `"types"` first, then `"import"`, then `"require"`.
**Warning signs:** `attw` output shows `FalseCJS` (CJS consumers get ESM types) or `MissingExportTypes`.

### Pitfall 5: Biome Linting Generated Files
**What goes wrong:** `pnpm check` fails on auto-generated TypeScript in `src/types/generated/` due to long lines, unusual patterns, or disabled rules.
**Why it happens:** Code generators don't follow human formatting conventions.
**How to avoid:** Add `"**/src/types/generated/**"` to `files.ignore` in `biome.json`. This directory doesn't exist yet in Phase 1 but establish the ignore pattern now.
**Warning signs:** CI fails on generated files after Phase 3 schema generation lands.

### Pitfall 6: Root Package.json `"type": "module"` Breaks Config Files
**What goes wrong:** `tsdown.config.ts` or `vitest.config.ts` fail to load when the root or library `package.json` has `"type": "module"` set incorrectly.
**Why it happens:** Setting `"type": "module"` on the wrong package makes `.js` files ES modules, confusing tools that expect CJS config files.
**How to avoid:** Only `packages/whisper/package.json` gets `"type": "module"`. Root `package.json` has no `"type"` field (defaults to CJS for Node tooling compatibility).

---

## Code Examples

### Routing Type: Compile Error for Invalid Assignment
```typescript
// Source: TypeScript Handbook — Literal Types
import type { PlatformRoute, RegionalRoute } from '@wardbox/whisper/types'

function getSummoner(route: PlatformRoute, name: string) { /* ... */ }
function getMatchList(route: RegionalRoute, puuid: string) { /* ... */ }

// These are valid:
getSummoner('na1', 'Doublelift')
getSummoner(PLATFORM.NA1, 'Doublelift')

// These are TYPE ERRORS at compile time (satisfies TYPE-04):
getSummoner('americas', 'Doublelift')
// Error: Argument of type '"americas"' is not assignable to parameter of type 'PlatformRoute'

getMatchList('na1', 'abc-123')
// Error: Argument of type '"na1"' is not assignable to parameter of type 'RegionalRoute'
```

### `satisfies` for Constants Sync
```typescript
// Ensures PLATFORM values stay synchronized with PlatformRoute union.
// If you add 'xx1' to PlatformRoute but forget to add it to PLATFORM, TypeScript errors.
export const PLATFORM = {
  NA1: 'na1',
  // ... all 17 values
} as const satisfies Record<string, PlatformRoute>
```

### NodeNext Import Style
```typescript
// Source: TypeScript NodeNext module resolution docs
// CORRECT: explicit .js extension on relative imports
import { PlatformRoute } from './platform.js'
import { toRegional } from './routing.js'

// WRONG: will fail at runtime under Node.js ESM
import { PlatformRoute } from './platform'
```

### attw + publint CI Invocation
```bash
# Run after `pnpm build` from the library package directory
npx attw --pack          # analyzes the packed tarball for type resolution issues
npx publint .            # validates package.json exports/main/types fields
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tsup + Rollup | tsdown (Rolldown/Oxc) | 2024-2025 | 10-50x faster builds; tsdown is tsup's intended successor |
| ESLint + Prettier | Biome 2.x | 2024 (Biome 1.x stable) | Single tool, single config, Rust speed |
| Jest with babel-jest | Vitest 4.x | 2023+ | Native ESM, no transform config, HMR-aware |
| Manual package inspection | attw + publint | 2022-2023 | Automated detection of the most common TypeScript publishing bugs |
| CJS-only npm packages | Dual ESM+CJS via exports field | Node 12+ support | `"exports"` field subpath routing + `"type": "module"` is the current standard |

**Deprecated/outdated:**
- `"main"` field alone: Replaced by `"exports"` field. `"main"` kept for legacy fallback only.
- `"module"` field (Rollup convention): Not part of Node.js spec; replaced by `"exports"."import"`. Do not include.
- TypeScript `"moduleResolution": "node"` (classic): Use `"NodeNext"` for strictest resolution.
- `"moduleResolution": "bundler"` for libraries: Valid for apps, but for libraries targeting Node.js native consumption, `NodeNext` is preferred per Andrew Branch's analysis.

---

## Open Questions

1. **tsdown `platform: 'neutral'` vs `platform: 'node'`**
   - What we know: `platform: 'neutral'` prevents Rolldown from injecting Node.js shims; `platform: 'node'` adds polyfills for browser globals.
   - What's unclear: Whether any of the endpoint code (Phase 4+) will need Node-specific APIs that neutral mode might miss.
   - Recommendation: Start with `platform: 'neutral'` — the library uses only native `fetch` which is available everywhere. If Phase 2 core infrastructure reveals Node-specific needs, revisit.

2. **tsdown `dts` vs separate `tsc --emitDeclarationOnly`**
   - What we know: tsdown has built-in DTS generation via Oxc; some projects use `tsc` separately for more control.
   - What's unclear: Whether tsdown's DTS handles complex conditional types and mapped types correctly in all edge cases.
   - Recommendation: Use tsdown's built-in `dts: true` for Phase 1. Verify with attw in CI. If DTS quality is poor for complex types in later phases, add a `tsc --emitDeclarationOnly` step.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `packages/whisper/vitest.config.ts` — Wave 0 (does not exist yet) |
| Quick run command | `pnpm --filter @wardbox/whisper vitest run` |
| Full suite command | `pnpm --filter @wardbox/whisper vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | tsdown produces dist/lol/index.js (ESM) and dist/lol/index.cjs (CJS) | smoke | `ls packages/whisper/dist/lol/index.js packages/whisper/dist/lol/index.cjs` | ❌ Wave 0 |
| FOUND-02 | Biome check reports no violations | lint | `pnpm check` (exits 0) | ❌ Wave 0 |
| FOUND-03 | Vitest runs and exits 0 | unit | `pnpm --filter @wardbox/whisper vitest run` | ❌ Wave 0 |
| FOUND-04 | attw and publint exit 0 | CI smoke | `attw --pack && publint .` in CI workflow | ❌ Wave 0 |
| FOUND-05 | Both packages resolvable in workspace | smoke | `pnpm ls -r` shows whisper + docs packages | ❌ Wave 0 |
| FOUND-06 | No runtime deps in library package.json | unit | `node -e "const p=require('./packages/whisper/package.json'); if(p.dependencies) process.exit(1)"` | ❌ Wave 0 |
| TYPE-01 | PlatformRoute union has exactly 17 values | unit | `pnpm --filter @wardbox/whisper vitest run src/types/platform.test.ts` | ❌ Wave 0 |
| TYPE-02 | RegionalRoute union has exactly 4 values | unit | `pnpm --filter @wardbox/whisper vitest run src/types/regional.test.ts` | ❌ Wave 0 |
| TYPE-03 | API methods accept only correct routing type | type-check | `pnpm --filter @wardbox/whisper exec tsc --noEmit` | ❌ Wave 0 |
| TYPE-04 | Invalid route assignment is a compile error | type-check | `pnpm --filter @wardbox/whisper exec tsc --noEmit` (verified via expect-type or tsd) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @wardbox/whisper vitest run`
- **Per wave merge:** `pnpm build && pnpm test && pnpm check`
- **Phase gate:** Full suite + attw + publint green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/whisper/src/types/platform.test.ts` — covers TYPE-01: verifies all 17 PlatformRoute values and PLATFORM constants
- [ ] `packages/whisper/src/types/regional.test.ts` — covers TYPE-02: verifies all 4 RegionalRoute values and REGIONAL constants
- [ ] `packages/whisper/src/types/routing.test.ts` — covers TYPE-03/TYPE-04 mapping: verifies `toRegional()` maps all 17 platforms correctly
- [ ] `packages/whisper/vitest.config.ts` — framework config
- [ ] Framework install: `pnpm add -D vitest @vitest/coverage-v8` in `packages/whisper`
- [ ] TYPE-04 compile-error tests require `expect-type` or `tsd` for negative type assertions; add `tsd` or use `// @ts-expect-error` inline assertions

---

## Sources

### Primary (HIGH confidence)
- npm registry — tsdown@0.21.4, @biomejs/biome@2.4.7, vitest@4.1.0, @arethetypeswrong/cli@0.18.2, publint@0.3.18 — version verification
- [tsdown.dev](https://tsdown.dev) — output format options, entry configuration, defineConfig API
- [biomejs.dev/reference/configuration](https://biomejs.dev/reference/configuration/) — biome.json schema, linter/formatter options
- [vitest.dev/config](https://vitest.dev/config/) — defineConfig, environment, coverage options
- [pnpm.io/workspaces](https://pnpm.io/workspaces) — workspace protocol, pnpm-workspace.yaml format

### Secondary (MEDIUM confidence)
- [darkintaqt.com/blog/routing](https://darkintaqt.com/blog/routing) — Riot API platform (17) and regional (4) routing values, verified against official Riot announcement on Twitter/X
- [blog.andrewbran.ch/is-nodenext-right-for-libraries-that-dont-target-node-js](https://blog.andrewbran.ch/is-nodenext-right-for-libraries-that-dont-target-node-js/) — NodeNext vs bundler resolution for multi-runtime libraries
- [rolldown/tsdown GitHub README](https://github.com/rolldown/tsdown) — feature overview, 5.5k usage count, active maintenance
- [dev.to/hacksore/dual-publish-esm-and-cjs-with-tsdown-2l75](https://dev.to/hacksore/dual-publish-esm-and-cjs-with-tsdown-2l75) — practical dual publish pattern, package.json exports structure

### Tertiary (LOW confidence)
- WebSearch results on pnpm monorepo structure — general `packages/*` pattern confirmed by multiple sources; specific to this project's configuration is Claude's discretion

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry as of 2026-03-17
- Architecture: HIGH — tsdown entry config verified; exports field format from official docs; routing values from Riot API documentation
- Pitfalls: HIGH (NodeNext extension, sideEffects, attw ordering) / MEDIUM (Vitest Node 20 requirement confirmed from STATE.md note)

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable toolchain; tsdown is actively releasing but config API is stable)
