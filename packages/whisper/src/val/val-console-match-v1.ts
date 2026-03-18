import type { WhisperClient } from '../core/client.js';
import type { Matchlist, RecentMatches, ValMatch } from '../types/generated/val.js';
import type { ValPlatformRoute } from '../types/val-platform.js';

/**
 * Valorant Console Match API (v1).
 *
 * Retrieve match details and match history for Valorant console players.
 * Console endpoints require a `platformType` parameter for matchlist
 * and leaderboard queries.
 *
 * All methods require a {@link ValPlatformRoute} (e.g., 'na', 'eu', 'ap').
 *
 * @example
 * ```typescript
 * import { valConsoleMatchV1 } from '@wardbox/whisper/val';
 *
 * const match = await valConsoleMatchV1.getMatch(client, 'na', 'match-id-123');
 * const matchlist = await valConsoleMatchV1.getMatchlist(client, 'na', 'puuid-123', 'playstation');
 * ```
 */
export const valConsoleMatchV1 = {
  /**
   * Get a console match by match ID.
   *
   * @param client - WhisperClient instance
   * @param route - Valorant platform routing value (e.g., 'na', 'eu', 'ap')
   * @param matchId - Match ID to retrieve
   * @returns Full match data including players, rounds, and teams
   *
   * @example
   * ```typescript
   * const match = await valConsoleMatchV1.getMatch(client, 'na', 'match-id-123');
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
      `/val/match/console/v1/matches/${encodeURIComponent(matchId)}`,
      'val-console-match-v1.getMatch',
    );
    return response.data;
  },

  /**
   * Get a console player's match history by PUUID.
   *
   * Requires a `platformType` parameter to specify the console platform.
   *
   * @param client - WhisperClient instance
   * @param route - Valorant platform routing value (e.g., 'na', 'eu', 'ap')
   * @param puuid - Encrypted PUUID of the player
   * @param platformType - Console platform ('playstation' or 'xbox')
   * @returns Match history with match IDs and timestamps
   *
   * @example
   * ```typescript
   * const matchlist = await valConsoleMatchV1.getMatchlist(client, 'na', 'puuid-123', 'playstation');
   * console.log(matchlist.history.length, 'console matches found');
   * ```
   */
  async getMatchlist(
    client: WhisperClient,
    route: ValPlatformRoute,
    puuid: string,
    platformType: 'playstation' | 'xbox',
  ): Promise<Matchlist> {
    const response = await client.request<Matchlist>(
      route,
      `/val/match/console/v1/matchlists/by-puuid/${encodeURIComponent(puuid)}`,
      'val-console-match-v1.getMatchlist',
      { params: { platformType } },
    );
    return response.data;
  },

  /**
   * Get recent console matches for a queue.
   *
   * @param client - WhisperClient instance
   * @param route - Valorant platform routing value (e.g., 'na', 'eu', 'ap')
   * @param queue - Queue type to get recent matches for (e.g., 'competitive', 'unrated')
   * @returns Recently completed match IDs for the queue
   *
   * @example
   * ```typescript
   * const recent = await valConsoleMatchV1.getRecentMatches(client, 'na', 'competitive');
   * console.log(recent.matchIds.length, 'recent console matches');
   * ```
   */
  async getRecentMatches(
    client: WhisperClient,
    route: ValPlatformRoute,
    queue: string,
  ): Promise<RecentMatches> {
    const response = await client.request<RecentMatches>(
      route,
      `/val/match/console/v1/recent-matches/by-queue/${encodeURIComponent(queue)}`,
      'val-console-match-v1.getRecentMatches',
    );
    return response.data;
  },
} as const;
