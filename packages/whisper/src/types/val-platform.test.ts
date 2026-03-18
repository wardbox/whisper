import { describe, expectTypeOf, it } from 'vitest';
import type { PlatformRoute } from './platform.js';
import type { RegionalRoute } from './regional.js';
import { VAL_PLATFORM, type ValPlatformRoute } from './val-platform.js';

describe('ValPlatformRoute', () => {
  it('is distinct from PlatformRoute', () => {
    // The full union types are not equal (even though 'kr' exists in both)
    expectTypeOf<ValPlatformRoute>().not.toEqualTypeOf<PlatformRoute>();
    expectTypeOf<PlatformRoute>().not.toEqualTypeOf<ValPlatformRoute>();
  });

  it('is distinct from RegionalRoute', () => {
    expectTypeOf<ValPlatformRoute>().not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf<RegionalRoute>().not.toEqualTypeOf<ValPlatformRoute>();
  });

  it('has no overlap with RegionalRoute', () => {
    // No shared string literal members
    expectTypeOf<Extract<ValPlatformRoute, RegionalRoute>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<RegionalRoute, ValPlatformRoute>>().toEqualTypeOf<never>();
  });

  it('VAL_PLATFORM constants satisfy ValPlatformRoute', () => {
    expectTypeOf(VAL_PLATFORM.AP).toEqualTypeOf<'ap'>();
    expectTypeOf(VAL_PLATFORM.BR).toEqualTypeOf<'br'>();
    expectTypeOf(VAL_PLATFORM.EU).toEqualTypeOf<'eu'>();
    expectTypeOf(VAL_PLATFORM.KR).toEqualTypeOf<'kr'>();
    expectTypeOf(VAL_PLATFORM.LATAM).toEqualTypeOf<'latam'>();
    expectTypeOf(VAL_PLATFORM.NA).toEqualTypeOf<'na'>();
    expectTypeOf(VAL_PLATFORM.ESPORTS).toEqualTypeOf<'esports'>();
  });

  it('VAL_PLATFORM values are assignable to ValPlatformRoute', () => {
    const route: ValPlatformRoute = VAL_PLATFORM.NA;
    expectTypeOf(route).toMatchTypeOf<ValPlatformRoute>();
  });
});
