import { describe, expectTypeOf, it } from 'vitest';
import type { PlatformRoute } from '../types/platform.js';
import type { RegionalRoute } from '../types/regional.js';
import type { ValPlatformRoute } from '../types/val-platform.js';
import { valConsoleMatchV1 } from './val-console-match-v1.js';
import { valConsoleRankedV1 } from './val-console-ranked-v1.js';
import { valContentV1 } from './val-content-v1.js';
import { valMatchV1 } from './val-match-v1.js';
import { valRankedV1 } from './val-ranked-v1.js';
import { valStatusV1 } from './val-status-v1.js';

describe('Valorant route type enforcement', () => {
  it('all Valorant modules accept ValPlatformRoute', () => {
    expectTypeOf(valMatchV1.getMatch).parameter(1).toEqualTypeOf<ValPlatformRoute>();
    expectTypeOf(valMatchV1.getMatchlist).parameter(1).toEqualTypeOf<ValPlatformRoute>();
    expectTypeOf(valMatchV1.getRecentMatches).parameter(1).toEqualTypeOf<ValPlatformRoute>();
    expectTypeOf(valContentV1.getContent).parameter(1).toEqualTypeOf<ValPlatformRoute>();
    expectTypeOf(valStatusV1.getPlatformData).parameter(1).toEqualTypeOf<ValPlatformRoute>();
    expectTypeOf(valRankedV1.getLeaderboard).parameter(1).toEqualTypeOf<ValPlatformRoute>();
    expectTypeOf(valConsoleMatchV1.getMatch).parameter(1).toEqualTypeOf<ValPlatformRoute>();
    expectTypeOf(valConsoleMatchV1.getMatchlist).parameter(1).toEqualTypeOf<ValPlatformRoute>();
    expectTypeOf(valConsoleMatchV1.getRecentMatches).parameter(1).toEqualTypeOf<ValPlatformRoute>();
    expectTypeOf(valConsoleRankedV1.getLeaderboard).parameter(1).toEqualTypeOf<ValPlatformRoute>();
  });

  it('Valorant modules do not accept PlatformRoute', () => {
    expectTypeOf(valMatchV1.getMatch).parameter(1).not.toEqualTypeOf<PlatformRoute>();
    expectTypeOf(valContentV1.getContent).parameter(1).not.toEqualTypeOf<PlatformRoute>();
    expectTypeOf(valStatusV1.getPlatformData).parameter(1).not.toEqualTypeOf<PlatformRoute>();
    expectTypeOf(valRankedV1.getLeaderboard).parameter(1).not.toEqualTypeOf<PlatformRoute>();
    expectTypeOf(valConsoleMatchV1.getMatch).parameter(1).not.toEqualTypeOf<PlatformRoute>();
    expectTypeOf(valConsoleRankedV1.getLeaderboard).parameter(1).not.toEqualTypeOf<PlatformRoute>();
  });

  it('Valorant modules do not accept RegionalRoute', () => {
    expectTypeOf(valMatchV1.getMatch).parameter(1).not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf(valContentV1.getContent).parameter(1).not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf(valStatusV1.getPlatformData).parameter(1).not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf(valRankedV1.getLeaderboard).parameter(1).not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf(valConsoleMatchV1.getMatch).parameter(1).not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf(valConsoleRankedV1.getLeaderboard).parameter(1).not.toEqualTypeOf<RegionalRoute>();
  });

  it('ValPlatformRoute is distinct from PlatformRoute and RegionalRoute', () => {
    expectTypeOf<ValPlatformRoute>().not.toEqualTypeOf<PlatformRoute>();
    expectTypeOf<ValPlatformRoute>().not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf<PlatformRoute>().not.toEqualTypeOf<ValPlatformRoute>();
    expectTypeOf<RegionalRoute>().not.toEqualTypeOf<ValPlatformRoute>();
  });
});
