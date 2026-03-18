import { describe, expect, it } from 'vitest';
import {
  valConsoleMatchV1,
  valConsoleRankedV1,
  valContentV1,
  valMatchV1,
  valRankedV1,
  valStatusV1,
} from './index.js';

describe('val/index re-exports', () => {
  it('exports all 6 Valorant namespace objects', () => {
    expect(valMatchV1).toBeDefined();
    expect(valContentV1).toBeDefined();
    expect(valStatusV1).toBeDefined();
    expect(valRankedV1).toBeDefined();
    expect(valConsoleMatchV1).toBeDefined();
    expect(valConsoleRankedV1).toBeDefined();
  });

  it('namespace objects have expected methods', () => {
    expect(typeof valMatchV1.getMatch).toBe('function');
    expect(typeof valMatchV1.getMatchlist).toBe('function');
    expect(typeof valMatchV1.getRecentMatches).toBe('function');
    expect(typeof valContentV1.getContent).toBe('function');
    expect(typeof valStatusV1.getPlatformData).toBe('function');
    expect(typeof valRankedV1.getLeaderboard).toBe('function');
    expect(typeof valConsoleMatchV1.getMatch).toBe('function');
    expect(typeof valConsoleMatchV1.getMatchlist).toBe('function');
    expect(typeof valConsoleMatchV1.getRecentMatches).toBe('function');
    expect(typeof valConsoleRankedV1.getLeaderboard).toBe('function');
  });
});
