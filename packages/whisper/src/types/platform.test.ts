import { describe, expect, it } from 'vitest';
import type { PlatformRoute } from './platform.js';
import { PLATFORM } from './platform.js';

const ALL_PLATFORMS: PlatformRoute[] = [
  'na1',
  'br1',
  'la1',
  'la2',
  'jp1',
  'kr',
  'me1',
  'eun1',
  'euw1',
  'tr1',
  'ru',
  'oc1',
  'ph2',
  'sg2',
  'th2',
  'tw2',
  'vn2',
];

describe('PlatformRoute', () => {
  it('PLATFORM constant has exactly 17 keys', () => {
    expect(Object.keys(PLATFORM)).toHaveLength(17);
  });

  it('every PLATFORM value is a valid platform string', () => {
    const values = Object.values(PLATFORM);
    for (const value of values) {
      expect(ALL_PLATFORMS).toContain(value);
    }
  });

  it('ALL_PLATFORMS has exactly 17 entries', () => {
    expect(ALL_PLATFORMS).toHaveLength(17);
    expect(new Set(ALL_PLATFORMS).size).toBe(17);
  });

  it('rejects regional routes at compile time', () => {
    // TYPE-04: These @ts-expect-error comments verify that
    // assigning a regional string to PlatformRoute is a compile error.
    // If the assignment were valid, tsc would error on the @ts-expect-error itself.
    const _acceptPlatform = (_route: PlatformRoute) => {};
    // @ts-expect-error 'americas' is not assignable to PlatformRoute
    _acceptPlatform('americas');
    // @ts-expect-error 'europe' is not assignable to PlatformRoute
    _acceptPlatform('europe');
    // @ts-expect-error 'invalid' is not assignable to PlatformRoute
    _acceptPlatform('invalid');
  });
});
