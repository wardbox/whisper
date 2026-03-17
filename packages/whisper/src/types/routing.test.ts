import { describe, expect, it } from 'vitest';
import { PLATFORM } from './platform.js';
import { toRegional } from './routing.js';

describe('toRegional', () => {
  it('maps Americas platforms correctly', () => {
    expect(toRegional('na1')).toBe('americas');
    expect(toRegional('br1')).toBe('americas');
    expect(toRegional('la1')).toBe('americas');
    expect(toRegional('la2')).toBe('americas');
  });

  it('maps Asia platforms correctly', () => {
    expect(toRegional('jp1')).toBe('asia');
    expect(toRegional('kr')).toBe('asia');
  });

  it('maps Europe platforms correctly', () => {
    expect(toRegional('me1')).toBe('europe');
    expect(toRegional('eun1')).toBe('europe');
    expect(toRegional('euw1')).toBe('europe');
    expect(toRegional('tr1')).toBe('europe');
    expect(toRegional('ru')).toBe('europe');
  });

  it('maps SEA platforms correctly', () => {
    expect(toRegional('oc1')).toBe('sea');
    expect(toRegional('ph2')).toBe('sea');
    expect(toRegional('sg2')).toBe('sea');
    expect(toRegional('th2')).toBe('sea');
    expect(toRegional('tw2')).toBe('sea');
    expect(toRegional('vn2')).toBe('sea');
  });

  it('maps every PLATFORM constant value to a region', () => {
    for (const platform of Object.values(PLATFORM)) {
      const region = toRegional(platform);
      expect(['americas', 'europe', 'asia', 'sea']).toContain(region);
    }
  });
});
