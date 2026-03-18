import type { LolLeagueEntry } from '../generated/lol.js';

/**
 * Promotion/demotion series information for a league entry.
 *
 * Returned as part of {@link LolLeagueEntry} when a player is in a
 * best-of series between divisions or tiers.
 */
export interface MiniSeries {
  /** Number of losses in the current series */
  losses: number;
  /** Series progress string (e.g., "WLNN" — W=win, L=loss, N=not played) */
  progress: string;
  /** Number of wins required to promote */
  target: number;
  /** Number of wins in the current series */
  wins: number;
}

/**
 * A ranked league containing a list of league entries.
 *
 * Returned by league-v4 endpoints that query full leagues:
 * getChallengerLeague, getGrandmasterLeague, getMasterLeague, getById.
 */
export interface LeagueList {
  /** Unique identifier for this league */
  leagueId: string;
  /** List of ranked entries in this league */
  entries: LolLeagueEntry[];
  /** Tier of this league (e.g., "CHALLENGER", "GRANDMASTER", "MASTER") */
  tier: string;
  /** Display name of this league */
  name: string;
  /** Queue type (e.g., "RANKED_SOLO_5x5") */
  queue: string;
}
