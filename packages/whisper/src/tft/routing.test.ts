import { describe, expectTypeOf, it } from 'vitest';
import type { PlatformRoute } from '../types/platform.js';
import type { RegionalRoute } from '../types/regional.js';
import { spectatorTftV5 } from './spectator-tft-v5.js';
import { tftLeagueV1 } from './tft-league-v1.js';
import { tftMatchV1 } from './tft-match-v1.js';
import { tftStatusV1 } from './tft-status-v1.js';
import { tftSummonerV1 } from './tft-summoner-v1.js';

describe('TFT route type enforcement', () => {
  it('platform-routed modules accept PlatformRoute', () => {
    expectTypeOf(tftLeagueV1.getChallengerLeague).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(tftLeagueV1.getGrandmasterLeague).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(tftLeagueV1.getMasterLeague).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(tftLeagueV1.getLeagueEntriesByPuuid).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(tftLeagueV1.getLeagueEntries).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(tftLeagueV1.getLeagueById).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(tftLeagueV1.getTopRatedLadder).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(tftSummonerV1.getByPuuid).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(tftSummonerV1.getByAccessToken).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(tftStatusV1.getPlatformData).parameter(1).toEqualTypeOf<PlatformRoute>();
    expectTypeOf(spectatorTftV5.getCurrentGame).parameter(1).toEqualTypeOf<PlatformRoute>();
  });

  it('regional-routed modules accept RegionalRoute', () => {
    expectTypeOf(tftMatchV1.getMatch).parameter(1).toEqualTypeOf<RegionalRoute>();
    expectTypeOf(tftMatchV1.getMatchIdsByPuuid).parameter(1).toEqualTypeOf<RegionalRoute>();
  });

  it('platform-routed modules reject RegionalRoute', () => {
    expectTypeOf(tftLeagueV1.getChallengerLeague).parameter(1).not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf(tftSummonerV1.getByPuuid).parameter(1).not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf(tftStatusV1.getPlatformData).parameter(1).not.toEqualTypeOf<RegionalRoute>();
    expectTypeOf(spectatorTftV5.getCurrentGame).parameter(1).not.toEqualTypeOf<RegionalRoute>();
  });

  it('regional-routed modules reject PlatformRoute', () => {
    expectTypeOf(tftMatchV1.getMatch).parameter(1).not.toEqualTypeOf<PlatformRoute>();
    expectTypeOf(tftMatchV1.getMatchIdsByPuuid).parameter(1).not.toEqualTypeOf<PlatformRoute>();
  });
});
