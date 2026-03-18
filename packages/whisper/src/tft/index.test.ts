import { describe, expect, it } from 'vitest';
import { spectatorTftV5, tftLeagueV1, tftMatchV1, tftStatusV1, tftSummonerV1 } from './index.js';

describe('tft/index re-exports', () => {
  it('exports all 5 TFT namespace objects', () => {
    const namespaces = [tftMatchV1, tftLeagueV1, tftSummonerV1, tftStatusV1, spectatorTftV5];
    expect(namespaces).toHaveLength(5);
    for (const ns of namespaces) {
      expect(ns).toBeDefined();
      expect(typeof ns).toBe('object');
    }
  });

  it('namespace objects have expected methods', () => {
    expect(typeof tftMatchV1.getMatchIdsByPuuid).toBe('function');
    expect(typeof tftMatchV1.getMatch).toBe('function');
    expect(typeof tftLeagueV1.getChallengerLeague).toBe('function');
    expect(typeof tftLeagueV1.getGrandmasterLeague).toBe('function');
    expect(typeof tftLeagueV1.getMasterLeague).toBe('function');
    expect(typeof tftLeagueV1.getLeagueEntriesByPuuid).toBe('function');
    expect(typeof tftLeagueV1.getLeagueEntries).toBe('function');
    expect(typeof tftLeagueV1.getLeagueById).toBe('function');
    expect(typeof tftLeagueV1.getTopRatedLadder).toBe('function');
    expect(typeof tftSummonerV1.getByPuuid).toBe('function');
    expect(typeof tftSummonerV1.getByAccessToken).toBe('function');
    expect(typeof tftStatusV1.getPlatformData).toBe('function');
    expect(typeof spectatorTftV5.getCurrentGame).toBe('function');
  });

  it('tree-shaking: individual namespace imports resolve independently', async () => {
    const modules = await Promise.all([
      import('./tft-match-v1.js'),
      import('./tft-league-v1.js'),
      import('./tft-summoner-v1.js'),
      import('./tft-status-v1.js'),
      import('./spectator-tft-v5.js'),
    ]);
    for (const mod of modules) {
      const exportNames = Object.keys(mod);
      expect(exportNames.length).toBeGreaterThan(0);
    }
  });
});
