// Re-export generated types users need for return values
export type {
  TftCurrentGameInfo,
  TftLeagueList,
  TftMatch,
  TftPlatformData,
  TftSummoner,
} from '../types/generated/tft.js';

// Re-export override types, options types, and namespace objects
export type { TftLeagueEntry, TftTopRatedLadderEntry } from '../types/overrides/tft-league.js';
export { spectatorTftV5 } from './spectator-tft-v5.js';
export type { GetTftLeagueEntriesOptions } from './tft-league-v1.js';
export { tftLeagueV1 } from './tft-league-v1.js';
export type { GetTftMatchIdsOptions } from './tft-match-v1.js';
export { tftMatchV1 } from './tft-match-v1.js';
export { tftStatusV1 } from './tft-status-v1.js';
export { tftSummonerV1 } from './tft-summoner-v1.js';
