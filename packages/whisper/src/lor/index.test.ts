import { describe, expect, it } from 'vitest';
import { lorRankedV1, lorStatusV1 } from './index.js';

describe('lor/index re-exports', () => {
  it('exports all active LoR namespace objects', () => {
    expect(lorRankedV1).toBeDefined();
    expect(lorStatusV1).toBeDefined();
  });

  it('namespace objects have expected methods', () => {
    expect(typeof lorRankedV1.getLeaderboards).toBe('function');
    expect(typeof lorStatusV1.getPlatformData).toBe('function');
  });
});
