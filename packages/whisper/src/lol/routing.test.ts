import { describe, expectTypeOf, it } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { PlatformRoute } from '../types/platform.js';
import type { RegionalRoute } from '../types/regional.js';
// Import all namespace objects
import { championMasteryV4 } from './champion-mastery-v4.js';
import { championV3 } from './champion-v3.js';
import { clashV1 } from './clash-v1.js';
import { leagueV4 } from './league-v4.js';
import { leagueExpV4 } from './league-exp-v4.js';
import { lolChallengesV1 } from './lol-challenges-v1.js';
import { lolStatusV4 } from './lol-status-v4.js';
import { matchV5 } from './match-v5.js';
import { lolRsoMatchV1 } from './lol-rso-match-v1.js';
import { spectatorV5 } from './spectator-v5.js';
import { summonerV4 } from './summoner-v4.js';
import { tournamentV5 } from './tournament-v5.js';
import { tournamentStubV5 } from './tournament-stub-v5.js';
import { accountV1 } from '../riot/account-v1.js';

describe('route type enforcement', () => {
  it('platform-routed modules accept PlatformRoute', () => {
    // Verify the route parameter type is PlatformRoute for all platform modules
    expectTypeOf(summonerV4.getByPuuid).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(championMasteryV4.getByPuuid).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(championV3.getChampionRotations).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(clashV1.getPlayersByPuuid).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(leagueV4.getChallengerLeague).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(leagueExpV4.getEntries).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(lolChallengesV1.getConfig).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(lolStatusV4.getStatus).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(spectatorV5.getCurrentGame).parameter(1).toEqualTypeOf<PlatformRoute>();
  });

  it('regional-routed modules accept RegionalRoute', () => {
    // Verify the route parameter type is RegionalRoute for all regional modules
    expectTypeOf(matchV5.getMatch).parameter(1).toEqualTypeOf<RegionalRoute>();
    expectTypeOf(matchV5.getMatchIdsByPuuid).parameter(1).toEqualTypeOf<RegionalRoute>();
    expectTypeOf(lolRsoMatchV1.getMatch).parameter(1).toEqualTypeOf<RegionalRoute>();
    expectTypeOf(tournamentV5.createProvider).parameter(1).toEqualTypeOf<RegionalRoute>();
    expectTypeOf(tournamentStubV5.createProvider).parameter(1).toEqualTypeOf<RegionalRoute>();
    expectTypeOf(accountV1.getByPuuid).parameter(1).toEqualTypeOf<RegionalRoute>();
  });

  it('platform and regional route types are mutually exclusive', () => {
    // PlatformRoute and RegionalRoute must not overlap
    expectTypeOf<PlatformRoute>().not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf<RegionalRoute>().not.toEqualTypeOf<PlatformRoute>();
  });
});
