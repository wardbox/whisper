import { describe, expectTypeOf, it } from 'vitest';
import type { PlatformRoute } from '../types/platform.js';
import type { RegionalRoute } from '../types/regional.js';
import { lorRankedV1 } from './lor-ranked-v1.js';
import { lorStatusV1 } from './lor-status-v1.js';

describe('LoR route type enforcement', () => {
  it('all LoR modules accept RegionalRoute', () => {
    expectTypeOf(lorRankedV1.getLeaderboards).parameter(1).toEqualTypeOf<RegionalRoute>();
    expectTypeOf(lorStatusV1.getPlatformData).parameter(1).toEqualTypeOf<RegionalRoute>();
  });

  it('LoR modules reject PlatformRoute', () => {
    expectTypeOf(lorRankedV1.getLeaderboards).parameter(1).not.toEqualTypeOf<PlatformRoute>();
    expectTypeOf(lorStatusV1.getPlatformData).parameter(1).not.toEqualTypeOf<PlatformRoute>();
  });
});
