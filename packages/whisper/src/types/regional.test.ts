import { describe, expect, it } from 'vitest';
import type { RegionalRoute } from './regional.js';
import { REGIONAL } from './regional.js';

const ALL_REGIONALS: RegionalRoute[] = ['americas', 'europe', 'asia', 'sea'];

describe('RegionalRoute', () => {
  it('REGIONAL constant has exactly 4 keys', () => {
    expect(Object.keys(REGIONAL)).toHaveLength(4);
  });

  it('every REGIONAL value is a valid regional string', () => {
    const values = Object.values(REGIONAL);
    for (const value of values) {
      expect(ALL_REGIONALS).toContain(value);
    }
  });

  it('ALL_REGIONALS has exactly 4 entries', () => {
    expect(ALL_REGIONALS).toHaveLength(4);
    expect(new Set(ALL_REGIONALS).size).toBe(4);
  });

  it('rejects platform routes at compile time', () => {
    // TYPE-04: These @ts-expect-error comments verify that
    // assigning a platform string to RegionalRoute is a compile error.
    const _acceptRegional = (_route: RegionalRoute) => {};
    // @ts-expect-error 'na1' is not assignable to RegionalRoute
    _acceptRegional('na1');
    // @ts-expect-error 'euw1' is not assignable to RegionalRoute
    _acceptRegional('euw1');
    // @ts-expect-error 'invalid' is not assignable to RegionalRoute
    _acceptRegional('invalid');
  });
});
