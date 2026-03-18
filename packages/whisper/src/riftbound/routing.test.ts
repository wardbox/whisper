import { describe, expectTypeOf, it } from 'vitest';
import type { PlatformRoute } from '../types/platform.js';
import type { RegionalRoute } from '../types/regional.js';
import { riftboundContentV1 } from './riftbound-content-v1.js';

describe('Riftbound route type enforcement', () => {
  it('riftbound-content-v1 accepts RegionalRoute', () => {
    expectTypeOf(riftboundContentV1.getContent).parameter(1).toEqualTypeOf<RegionalRoute>();
  });

  it('riftbound-content-v1 rejects PlatformRoute', () => {
    expectTypeOf(riftboundContentV1.getContent).parameter(1).not.toEqualTypeOf<PlatformRoute>();
  });
});
