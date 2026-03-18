import type { WhisperClient } from '../core/client.js';
import type { Matchlist, RecentMatches, ValMatch } from '../types/generated/val.js';
import type { ValPlatformRoute } from '../types/val-platform.js';

/**
 * Valorant Match API (v1).
 *
 * Retrieve match details, match history, and recent matches for Valorant.
 *
 * All methods require a {@link ValPlatformRoute} (e.g., 'na', 'eu', 'ap').
 *
 * @example
 * ```typescript
 * import { valMatchV1 } from '@wardbox/whisper/val';
 *
 * const match = await valMatchV1.getMatch(client, 'na', 'match-id-123');
 * const matchlist = await valMatchV1.getMatchlist(client, 'na', 'puuid-123');
 * ```
 */
export const valMatchV1 = {
  /**
   * Get a match by match ID.
   *
   * @param client - WhisperClient instance
   * @param route - Valorant platform routing value (e.g., 'na', 'eu', 'ap')
   * @param matchId - Match ID to retrieve
   * @returns Full match data including players, rounds, and teams
   *
   * @example
   * ```typescript
   * const match = await valMatchV1.getMatch(client, 'na', 'match-id-123');
   * console.log(match.matchInfo.gameMode);
   * ```
   */
  async getMatch(
    client: WhisperClient,
    route: ValPlatformRoute,
    matchId: string,
  ): Promise<ValMatch> {
    const response = await client.request<ValMatch>(
      route,
      `/val/match/v1/matches/${encodeURIComponent(matchId)}`,
      'val-match-v1.getMatch',
    );
    return response.data;
  },

  /**
   * Get a player's match history by PUUID.
   *
   * @param client - WhisperClient instance
   * @param route - Valorant platform routing value (e.g., 'na', 'eu', 'ap')
   * @param puuid - Encrypted PUUID of the player
   * @returns Match history with match IDs and timestamps
   *
   * @example
   * ```typescript
   * const matchlist = await valMatchV1.getMatchlist(client, 'eu', 'puuid-123');
   * console.log(matchlist.history.length, 'matches found');
   * ```
   */
  async getMatchlist(
    client: WhisperClient,
    route: ValPlatformRoute,
    puuid: string,
  ): Promise<Matchlist> {
    const response = await client.request<Matchlist>(
      route,
      `/val/match/v1/matchlists/by-puuid/${encodeURIComponent(puuid)}`,
      'val-match-v1.getMatchlist',
    );
    return response.data;
  },

  /**
   * Get recent matches for a queue.
   *
   * @param client - WhisperClient instance
   * @param route - Valorant platform routing value (e.g., 'na', 'eu', 'ap')
   * @param queue - Queue type to get recent matches for (e.g., 'competitive', 'unrated')
   * @returns Recently completed match IDs for the queue
   *
   * @example
   * ```typescript
   * const recent = await valMatchV1.getRecentMatches(client, 'na', 'competitive');
   * console.log(recent.matchIds.length, 'recent matches');
   * ```
   */
  async getRecentMatches(
    client: WhisperClient,
    route: ValPlatformRoute,
    queue: string,
  ): Promise<RecentMatches> {
    const response = await client.request<RecentMatches>(
      route,
      `/val/match/v1/recent-matches/by-queue/${encodeURIComponent(queue)}`,
      'val-match-v1.getRecentMatches',
    );
    return response.data;
  },
} as const;
