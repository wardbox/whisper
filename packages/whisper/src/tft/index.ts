// Re-export generated types users need for return values
export type {
  TftCurrentGameInfo,
  TftLeagueList,
  TftMatch,
  TftPlatformData,
  TftSummoner,
} from '../types/generated/tft.js';

// Re-export override types
export type { TftLeagueEntry, TftTopRatedLadderEntry } from '../types/overrides/tft-league.js';

// Re-export options types from modules that define them
export type { GetTftMatchIdsOptions } from './tft-match-v1.js';
export type { GetTftLeagueEntriesOptions } from './tft-league-v1.js';

// Namespace objects (one per API group)
export { tftMatchV1 } from './tft-match-v1.js';
export { tftLeagueV1 } from './tft-league-v1.js';
export { tftSummonerV1 } from './tft-summoner-v1.js';
export { tftStatusV1 } from './tft-status-v1.js';
export { spectatorTftV5 } from './spectator-tft-v5.js';
