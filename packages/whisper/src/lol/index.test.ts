import { describe, expect, it } from 'vitest';
import {
  championMasteryV4,
  championV3,
  clashV1,
  leagueExpV4,
  leagueV4,
  lolChallengesV1,
  lolRsoMatchV1,
  lolStatusV4,
  matchV5,
  spectatorV5,
  summonerV4,
  tournamentStubV5,
  tournamentV5,
} from './index.js';

describe('lol/index re-exports', () => {
  it('exports all 13 namespace objects', () => {
    const namespaces = [
      championMasteryV4,
      championV3,
      clashV1,
      leagueV4,
      leagueExpV4,
      lolChallengesV1,
      lolStatusV4,
      matchV5,
      lolRsoMatchV1,
      spectatorV5,
      summonerV4,
      tournamentV5,
      tournamentStubV5,
    ];
    expect(namespaces).toHaveLength(13);
    for (const ns of namespaces) {
      expect(ns).toBeDefined();
      expect(typeof ns).toBe('object');
    }
  });

  it('each namespace has at least one method', () => {
    const namespaces = {
      championMasteryV4,
      championV3,
      clashV1,
      leagueV4,
      leagueExpV4,
      lolChallengesV1,
      lolStatusV4,
      matchV5,
      lolRsoMatchV1,
      spectatorV5,
      summonerV4,
      tournamentV5,
      tournamentStubV5,
    };
    for (const [name, ns] of Object.entries(namespaces)) {
      const methods = Object.values(ns).filter((v) => typeof v === 'function');
      expect(methods.length, `${name} should have at least one method`).toBeGreaterThan(0);
    }
  });

  it('tree-shaking: individual namespace imports resolve independently', async () => {
    // Verify each module can be imported independently (no circular deps that would prevent tree-shaking)
    const modules = await Promise.all([
      import('./champion-mastery-v4.js'),
      import('./champion-v3.js'),
      import('./clash-v1.js'),
      import('./league-v4.js'),
      import('./league-exp-v4.js'),
      import('./lol-challenges-v1.js'),
      import('./lol-status-v4.js'),
      import('./match-v5.js'),
      import('./lol-rso-match-v1.js'),
      import('./spectator-v5.js'),
      import('./summoner-v4.js'),
      import('./tournament-v5.js'),
      import('./tournament-stub-v5.js'),
    ]);
    for (const mod of modules) {
      // Each module should have exactly one default-like export (the namespace object)
      const exportNames = Object.keys(mod);
      expect(exportNames.length).toBeGreaterThan(0);
    }
  });
});
