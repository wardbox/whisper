/**
 * A ranked league entry for a TFT player.
 *
 * Returned by tft-league-v1 endpoints that query individual entries:
 * getLeagueEntriesByPuuid, getLeagueEntries.
 */
export interface TftLeagueEntry {
  /** Whether this player recently joined this league tier */
  freshBlood: boolean;
  /** Whether this player is on a winning streak */
  hotStreak: boolean;
  /** Whether this player has been inactive (demoted due to inactivity) */
  inactive: boolean;
  /** Current league points within the division */
  leaguePoints: number;
  /** Total ranked losses this season */
  losses: number;
  /** Encrypted PUUID of the player */
  puuid: string;
  /** Division rank within the tier (I, II, III, or IV) */
  rank: 'I' | 'II' | 'III' | 'IV';
  /** Whether this player is a veteran of this tier (long tenure) */
  veteran: boolean;
  /** Total ranked wins this season */
  wins: number;
  /** Unique identifier for the league this entry belongs to */
  leagueId?: string;
  /** Queue type (e.g., "RANKED_TFT", "RANKED_TFT_DOUBLE_UP") */
  queueType?: string;
  /** Tier of this entry (e.g., "GOLD", "PLATINUM", "DIAMOND") */
  tier?: string;
}

/**
 * A top-rated ladder entry for TFT Hyper Roll or Double Up.
 *
 * Returned by tft-league-v1 getTopRatedLadder endpoint.
 */
export interface TftTopRatedLadderEntry {
  /** Encrypted PUUID of the player */
  puuid: string;
  /** Total wins in the rated queue */
  wins: number;
}
