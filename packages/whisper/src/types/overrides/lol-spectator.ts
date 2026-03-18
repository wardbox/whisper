/**
 * A participant in a featured game.
 *
 * Contains a subset of the full participant data shown in the spectator-v5
 * featured games list.
 */
export interface FeaturedGameParticipant {
  /** Whether this participant is a bot */
  bot: boolean;
  /** Champion ID for this participant */
  championId: number;
  /** Profile icon ID */
  profileIconId: number;
  /** Encrypted PUUID */
  puuid: string;
  /** First summoner spell ID */
  spell1Id: number;
  /** Second summoner spell ID */
  spell2Id: number;
  /** Team ID (100 = blue, 200 = red) */
  teamId: number;
}

/**
 * Banned champion information in a featured game.
 */
export interface FeaturedGameBannedChampion {
  /** Champion ID of the banned champion */
  championId: number;
  /** Ban pick turn order */
  pickTurn: number;
  /** Team ID that made this ban (100 = blue, 200 = red) */
  teamId: number;
}

/**
 * Information about a single featured game.
 *
 * Similar to {@link import('../generated/lol.js').LolCurrentGameInfo} but
 * returned as part of the featured games list from spectator-v5.
 */
export interface FeaturedGameInfo {
  /** Banned champions in this game */
  bannedChampions: FeaturedGameBannedChampion[];
  /** Game ID */
  gameId: number;
  /** Length of the game in seconds */
  gameLength: number;
  /** Game mode (e.g., "CLASSIC", "ARAM") */
  gameMode: string;
  /** Queue config ID */
  gameQueueConfigId: number;
  /** Unix timestamp (milliseconds) when the game started */
  gameStartTime: number;
  /** Game type (e.g., "MATCHED_GAME") */
  gameType: string;
  /** Map ID */
  mapId: number;
  /** Observer encryption key for spectating */
  observers: {
    /** Encryption key used to spectate this game */
    encryptionKey: string;
  };
  /** Participants in this game */
  participants: FeaturedGameParticipant[];
  /** Platform ID where this game is being played */
  platformId: string;
}

/**
 * Featured games list returned by spectator-v5.getFeaturedGames.
 *
 * Contains a list of currently featured (spectatable) games and the
 * recommended refresh interval.
 */
export interface FeaturedGames {
  /** List of featured games currently in progress */
  gameList: FeaturedGameInfo[];
  /** Suggested client refresh interval in seconds */
  clientRefreshInterval: number;
}
