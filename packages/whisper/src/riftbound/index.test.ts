import { describe, expect, it } from 'vitest';
import { riftboundContentV1 } from './index.js';

describe('riftbound/index re-exports', () => {
  it('exports riftbound namespace object', () => {
    expect(riftboundContentV1).toBeDefined();
  });

  it('namespace object has expected methods', () => {
    expect(typeof riftboundContentV1.getContent).toBe('function');
  });
});
