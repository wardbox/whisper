import type { EndpointGroup } from './types.js';

/**
 * Complete endpoint registry for all hittable Riot API groups.
 *
 * Excludes:
 * - RSO-only groups (lol-rso-match-v1, lor-deck-v1, lor-inventory-v1)
 * - Tournament groups (tournament-v5, tournament-stub-v5)
 * - RSO-only endpoints within included groups (account-v1/accounts/me, summoner getByMe)
 */
export const ENDPOINT_REGISTRY: EndpointGroup[] = [
  // ============================================================
  // LoL (11 hittable groups)
  // ============================================================
  {
    name: 'champion-mastery-v4',
    game: 'lol',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'champion-mastery-v4.getByPuuid',
        path: '/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'ChampionMasteryDTO',
        isArray: true,
      },
      {
        methodId: 'champion-mastery-v4.getTopByPuuid',
        path: '/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/top',
        params: ['puuid'],
        responseName: 'ChampionMasteryDTO',
        isArray: true,
      },
      {
        methodId: 'champion-mastery-v4.getByPuuidByChampion',
        path: '/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/by-champion/{championId}',
        params: ['puuid', 'championId'],
        responseName: 'ChampionMasteryDTO',
      },
      {
        methodId: 'champion-mastery-v4.getScoresByPuuid',
        path: '/lol/champion-mastery/v4/scores/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'ChampionMasteryScore',
      },
    ],
  },
  {
    name: 'champion-v3',
    game: 'lol',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'champion-v3.getChampionRotations',
        path: '/lol/platform/v3/champion-rotations',
        responseName: 'ChampionInfo',
      },
    ],
  },
  {
    name: 'clash-v1',
    game: 'lol',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'clash-v1.getPlayersByPuuid',
        path: '/lol/clash/v1/players/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'PlayerDTO',
        isArray: true,
      },
      {
        methodId: 'clash-v1.getTournaments',
        path: '/lol/clash/v1/tournaments',
        responseName: 'TournamentDTO',
        isArray: true,
      },
      {
        methodId: 'clash-v1.getTournamentById',
        path: '/lol/clash/v1/tournaments/{tournamentId}',
        params: ['tournamentId'],
        responseName: 'TournamentDTO',
      },
      {
        methodId: 'clash-v1.getTeamById',
        path: '/lol/clash/v1/teams/{teamId}',
        params: ['teamId'],
        responseName: 'TeamDTO',
      },
    ],
  },
  {
    name: 'league-exp-v4',
    game: 'lol',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'league-exp-v4.getEntries',
        path: '/lol/league-exp/v4/entries/{queue}/{tier}/{division}',
        params: ['queue', 'tier', 'division'],
        responseName: 'LeagueEntryDTO',
        isArray: true,
      },
    ],
  },
  {
    name: 'league-v4',
    game: 'lol',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'league-v4.getChallengerLeague',
        path: '/lol/league/v4/challengerleagues/by-queue/{queue}',
        params: ['queue'],
        responseName: 'LeagueListDTO',
      },
      {
        methodId: 'league-v4.getGrandmasterLeague',
        path: '/lol/league/v4/grandmasterleagues/by-queue/{queue}',
        params: ['queue'],
        responseName: 'LeagueListDTO',
      },
      {
        methodId: 'league-v4.getMasterLeague',
        path: '/lol/league/v4/masterleagues/by-queue/{queue}',
        params: ['queue'],
        responseName: 'LeagueListDTO',
      },
      {
        methodId: 'league-v4.getEntriesByPuuid',
        path: '/lol/league/v4/entries/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'LeagueEntryDTO',
        isArray: true,
      },
      {
        methodId: 'league-v4.getEntries',
        path: '/lol/league/v4/entries/{queue}/{tier}/{division}',
        params: ['queue', 'tier', 'division'],
        responseName: 'LeagueEntryDTO',
        isArray: true,
      },
      {
        methodId: 'league-v4.getById',
        path: '/lol/league/v4/leagues/{leagueId}',
        params: ['leagueId'],
        responseName: 'LeagueListDTO',
      },
    ],
  },
  {
    name: 'lol-challenges-v1',
    game: 'lol',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'lol-challenges-v1.getConfig',
        path: '/lol/challenges/v1/challenges/config',
        responseName: 'ChallengeConfigInfoDTO',
        isArray: true,
      },
      {
        methodId: 'lol-challenges-v1.getPercentiles',
        path: '/lol/challenges/v1/challenges/percentiles',
        responseName: 'ChallengePercentiles',
      },
      {
        methodId: 'lol-challenges-v1.getChallengeConfig',
        path: '/lol/challenges/v1/challenges/{challengeId}/config',
        params: ['challengeId'],
        responseName: 'ChallengeConfigInfoDTO',
      },
      {
        methodId: 'lol-challenges-v1.getChallengePercentiles',
        path: '/lol/challenges/v1/challenges/{challengeId}/percentiles',
        params: ['challengeId'],
        responseName: 'ChallengePercentileEntry',
      },
      {
        methodId: 'lol-challenges-v1.getChallengeLeaderboard',
        path: '/lol/challenges/v1/challenges/{challengeId}/leaderboards/by-level/{level}',
        params: ['challengeId', 'level'],
        responseName: 'ApexPlayerInfoDTO',
        isArray: true,
      },
      {
        methodId: 'lol-challenges-v1.getPlayerData',
        path: '/lol/challenges/v1/player-data/{puuid}',
        params: ['puuid'],
        responseName: 'PlayerInfoDTO',
      },
    ],
  },
  {
    name: 'lol-status-v4',
    game: 'lol',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'lol-status-v4.getStatus',
        path: '/lol/status/v4/platform-data',
        responseName: 'PlatformDataDTO',
      },
    ],
  },
  {
    name: 'match-v5',
    game: 'lol',
    routing: 'regional',
    endpoints: [
      {
        methodId: 'match-v5.getMatchIdsByPuuid',
        path: '/lol/match/v5/matches/by-puuid/{puuid}/ids',
        params: ['puuid'],
        responseName: 'MatchIdList',
        isArray: true,
      },
      {
        methodId: 'match-v5.getMatch',
        path: '/lol/match/v5/matches/{matchId}',
        params: ['matchId'],
        responseName: 'MatchDTO',
      },
      {
        methodId: 'match-v5.getMatchTimeline',
        path: '/lol/match/v5/matches/{matchId}/timeline',
        params: ['matchId'],
        responseName: 'MatchTimelineDTO',
      },
    ],
  },
  {
    name: 'spectator-v5',
    game: 'lol',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'spectator-v5.getCurrentGame',
        path: '/lol/spectator/v5/active-games/by-summoner/{puuid}',
        params: ['puuid'],
        responseName: 'CurrentGameInfo',
      },
      {
        methodId: 'spectator-v5.getFeaturedGames',
        path: '/lol/spectator/v5/featured-games',
        responseName: 'FeaturedGames',
      },
    ],
  },
  {
    name: 'summoner-v4',
    game: 'lol',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'summoner-v4.getByPuuid',
        path: '/lol/summoner/v4/summoners/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'SummonerDTO',
      },
      {
        methodId: 'summoner-v4.getByAccountId',
        path: '/lol/summoner/v4/summoners/by-account/{encryptedAccountId}',
        params: ['encryptedAccountId'],
        responseName: 'SummonerDTO',
      },
    ],
  },
  // ============================================================
  // TFT (5 hittable groups)
  // ============================================================
  {
    name: 'tft-league-v1',
    game: 'tft',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'tft-league-v1.getChallenger',
        path: '/tft/league/v1/challenger',
        responseName: 'LeagueListDTO',
      },
      {
        methodId: 'tft-league-v1.getGrandmaster',
        path: '/tft/league/v1/grandmaster',
        responseName: 'LeagueListDTO',
      },
      {
        methodId: 'tft-league-v1.getMaster',
        path: '/tft/league/v1/master',
        responseName: 'LeagueListDTO',
      },
      {
        methodId: 'tft-league-v1.getEntriesByPuuid',
        path: '/tft/league/v1/entries/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'LeagueEntryDTO',
        isArray: true,
      },
      {
        methodId: 'tft-league-v1.getEntries',
        path: '/tft/league/v1/entries/{tier}/{division}',
        params: ['tier', 'division'],
        responseName: 'LeagueEntryDTO',
        isArray: true,
      },
      {
        methodId: 'tft-league-v1.getById',
        path: '/tft/league/v1/leagues/{leagueId}',
        params: ['leagueId'],
        responseName: 'LeagueListDTO',
      },
    ],
  },
  {
    name: 'tft-match-v1',
    game: 'tft',
    routing: 'regional',
    endpoints: [
      {
        methodId: 'tft-match-v1.getMatchIdsByPuuid',
        path: '/tft/match/v1/matches/by-puuid/{puuid}/ids',
        params: ['puuid'],
        responseName: 'TftMatchIdList',
        isArray: true,
      },
      {
        methodId: 'tft-match-v1.getMatch',
        path: '/tft/match/v1/matches/{matchId}',
        params: ['matchId'],
        responseName: 'TftMatchDTO',
      },
    ],
  },
  {
    name: 'tft-status-v1',
    game: 'tft',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'tft-status-v1.getStatus',
        path: '/tft/status/v1/platform-data',
        responseName: 'PlatformDataDTO',
      },
    ],
  },
  {
    name: 'tft-summoner-v1',
    game: 'tft',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'tft-summoner-v1.getByPuuid',
        path: '/tft/summoner/v1/summoners/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'SummonerDTO',
      },
      {
        methodId: 'tft-summoner-v1.getByAccountId',
        path: '/tft/summoner/v1/summoners/by-account/{encryptedAccountId}',
        params: ['encryptedAccountId'],
        responseName: 'SummonerDTO',
      },
    ],
  },
  {
    name: 'spectator-tft-v5',
    game: 'tft',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'spectator-tft-v5.getCurrentGame',
        path: '/lol/spectator/tft/v5/active-games/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'CurrentGameInfo',
      },
      {
        methodId: 'spectator-tft-v5.getFeaturedGames',
        path: '/lol/spectator/tft/v5/featured-games',
        responseName: 'FeaturedGames',
      },
    ],
  },

  // ============================================================
  // Valorant (6 groups)
  // ============================================================
  {
    name: 'val-content-v1',
    game: 'val',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'val-content-v1.getContent',
        path: '/val/content/v1/contents',
        responseName: 'ContentDTO',
      },
    ],
  },
  {
    name: 'val-match-v1',
    game: 'val',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'val-match-v1.getMatch',
        path: '/val/match/v1/matches/{matchId}',
        params: ['matchId'],
        responseName: 'ValMatchDTO',
      },
      {
        methodId: 'val-match-v1.getMatchlist',
        path: '/val/match/v1/matchlists/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'ValMatchlistDTO',
      },
      {
        methodId: 'val-match-v1.getRecentMatches',
        path: '/val/match/v1/recent-matches/by-queue/{queue}',
        params: ['queue'],
        responseName: 'ValRecentMatchesDTO',
      },
    ],
  },
  {
    name: 'val-ranked-v1',
    game: 'val',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'val-ranked-v1.getLeaderboard',
        path: '/val/ranked/v1/leaderboards/by-act/{actId}',
        params: ['actId'],
        responseName: 'ValLeaderboardDTO',
      },
    ],
  },
  {
    name: 'val-status-v1',
    game: 'val',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'val-status-v1.getStatus',
        path: '/val/status/v1/platform-data',
        responseName: 'PlatformDataDTO',
      },
    ],
  },
  {
    name: 'val-console-match-v1',
    game: 'val',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'val-console-match-v1.getMatch',
        path: '/val/match/console/v1/matches/{matchId}',
        params: ['matchId'],
        responseName: 'ValMatchDTO',
      },
      {
        methodId: 'val-console-match-v1.getMatchlist',
        path: '/val/match/console/v1/matchlists/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'ValMatchlistDTO',
      },
      {
        methodId: 'val-console-match-v1.getRecentMatches',
        path: '/val/match/console/v1/recent-matches/by-queue/{queue}',
        params: ['queue'],
        responseName: 'ValRecentMatchesDTO',
      },
    ],
  },
  {
    name: 'val-console-ranked-v1',
    game: 'val',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'val-console-ranked-v1.getLeaderboard',
        path: '/val/ranked/console/v1/leaderboards/by-act/{actId}',
        params: ['actId'],
        responseName: 'ValLeaderboardDTO',
      },
    ],
  },

  // ============================================================
  // LoR (3 hittable groups)
  // ============================================================
  {
    name: 'lor-match-v1',
    game: 'lor',
    routing: 'regional',
    endpoints: [
      {
        methodId: 'lor-match-v1.getMatchIdsByPuuid',
        path: '/lor/match/v1/matches/by-puuid/{puuid}/ids',
        params: ['puuid'],
        responseName: 'LorMatchIdList',
        isArray: true,
      },
      {
        methodId: 'lor-match-v1.getMatch',
        path: '/lor/match/v1/matches/{matchId}',
        params: ['matchId'],
        responseName: 'LorMatchDTO',
      },
    ],
  },
  {
    name: 'lor-ranked-v1',
    game: 'lor',
    routing: 'regional',
    endpoints: [
      {
        methodId: 'lor-ranked-v1.getLeaderboard',
        path: '/lor/ranked/v1/leaderboards',
        responseName: 'LorLeaderboardDTO',
      },
    ],
  },
  {
    name: 'lor-status-v1',
    game: 'lor',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'lor-status-v1.getStatus',
        path: '/lor/status/v1/platform-data',
        responseName: 'PlatformDataDTO',
      },
    ],
  },

  // ============================================================
  // Riftbound (1 group)
  // ============================================================
  {
    name: 'riftbound-content-v1',
    game: 'riftbound',
    routing: 'platform',
    endpoints: [
      {
        methodId: 'riftbound-content-v1.getContent',
        path: '/riftbound/content/v1/contents',
        responseName: 'RiftboundContentDTO',
      },
    ],
  },

  // ============================================================
  // Shared (1 group)
  // ============================================================
  {
    name: 'account-v1',
    game: 'riot',
    routing: 'regional',
    endpoints: [
      {
        methodId: 'account-v1.getByPuuid',
        path: '/riot/account/v1/accounts/by-puuid/{puuid}',
        params: ['puuid'],
        responseName: 'AccountDTO',
      },
      {
        methodId: 'account-v1.getByRiotId',
        path: '/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}',
        params: ['gameName', 'tagLine'],
        responseName: 'AccountDTO',
      },
      {
        methodId: 'account-v1.getByGame',
        path: '/riot/account/v1/active-shards/by-game/{game}/by-puuid/{puuid}',
        params: ['game', 'puuid'],
        responseName: 'ActiveShardDTO',
      },
    ],
  },
];
