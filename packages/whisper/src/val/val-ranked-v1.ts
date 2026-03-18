import type { WhisperClient } from '../core/client.js';
import type { Leaderboard } from '../types/generated/val.js';
import type { ValPlatformRoute } from '../types/val-platform.js';

/** Options for querying the Valorant ranked leaderboard */
export interface GetValLeaderboardOptions {
  /** Number of players to return */
  size?: number;
  /** Starting index for pagination */
  startIndex?: number;
}

/**
 * Valorant Ranked API (v1).
 *
 * Retrieve competitive leaderboard data by act.
 *
 * All methods require a {@link ValPlatformRoute} (e.g., 'na', 'eu', 'ap').
 *
 * @example
 * ```typescript
 * import { valRankedV1 } from '@wardbox/whisper/val';
 *
 * const leaderboard = await valRankedV1.getLeaderboard(client, 'na', 'act-id-123');
 * console.log(leaderboard.totalPlayers, 'ranked players');
 * ```
 */
export const valRankedV1 = {
  /**
   * Get the competitive leaderboard for a specific act.
   *
   * @param client - WhisperClient instance
   * @param route - Valorant platform routing value (e.g., 'na', 'eu', 'ap')
   * @param actId - Unique identifier of the competitive act
   * @param options - Optional pagination parameters
   * @returns Leaderboard data with player rankings
   *
   * @example
   * ```typescript
   * // Get top 100 players
   * const lb = await valRankedV1.getLeaderboard(client, 'na', 'act-id', { size: 100 });
   * lb.players.forEach(p => console.log(p.leaderboardRank, p.gameName));
   *
   * // Paginate through results
   * const page2 = await valRankedV1.getLeaderboard(client, 'na', 'act-id', {
   *   size: 100,
   *   startIndex: 100,
   * });
   * ```
   */
  async getLeaderboard(
    client: WhisperClient,
    route: ValPlatformRoute,
    actId: string,
    options?: GetValLeaderboardOptions,
  ): Promise<Leaderboard> {
    const params: Record<string, string> = {};
    if (options?.size !== undefined) {
      params.size = String(options.size);
    }
    if (options?.startIndex !== undefined) {
      params.startIndex = String(options.startIndex);
    }
    const response = await client.request<Leaderboard>(
      route,
      `/val/ranked/v1/leaderboards/by-act/${encodeURIComponent(actId)}`,
      'val-ranked-v1.getLeaderboard',
      Object.keys(params).length > 0 ? { params } : undefined,
    );
    return response.data;
  },
} as const;
