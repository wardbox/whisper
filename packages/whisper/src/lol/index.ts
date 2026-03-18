// Namespace objects (one per API group)
export { championMasteryV4 } from './champion-mastery-v4.js';
export { championV3 } from './champion-v3.js';
export { clashV1 } from './clash-v1.js';
export { leagueV4 } from './league-v4.js';
export { leagueExpV4 } from './league-exp-v4.js';
export { lolChallengesV1 } from './lol-challenges-v1.js';
export { lolStatusV4 } from './lol-status-v4.js';
export { matchV5 } from './match-v5.js';
export { lolRsoMatchV1 } from './lol-rso-match-v1.js';
export { spectatorV5 } from './spectator-v5.js';
export { summonerV4 } from './summoner-v4.js';
export { tournamentV5 } from './tournament-v5.js';
export { tournamentStubV5 } from './tournament-stub-v5.js';

// Re-export generated types users need for return values
export type {
  ChampionMastery,
  ChampionInfo,
  ChallengeConfigInfo,
  ChallengePercentiles,
  LolCurrentGameInfo,
  LolLeagueEntry,
  LolMatch,
  LolMatchTimeline,
  LolPlatformData,
  LolSummoner,
  PlayerInfo,
  Tournament,
} from '../types/generated/lol.js';

// Re-export override types users need
export type { LeagueList, MiniSeries } from '../types/overrides/lol-league.js';
export type { ClashTeam, ClashPlayer } from '../types/overrides/lol-clash.js';
export type { ApexPlayerInfo } from '../types/overrides/lol-challenges.js';
export type { FeaturedGames } from '../types/overrides/lol-spectator.js';
export type {
  TournamentCodeV5,
  LobbyEventV5Wrapper,
  ProviderRegistrationParameters,
  TournamentRegistrationParameters,
  TournamentCodeParameters,
  TournamentCodeUpdateParameters,
} from '../types/overrides/lol-tournament.js';

// Re-export options types from modules that define them
export type { GetMatchIdsOptions } from './match-v5.js';
