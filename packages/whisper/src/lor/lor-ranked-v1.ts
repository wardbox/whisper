import type { WhisperClient } from '../core/client.js';
import type { LorLeaderboard } from '../types/generated/lor.js';
import type { RegionalRoute } from '../types/regional.js';

/**
 * Legends of Runeterra Ranked API (v1).
 *
 * Retrieve ranked leaderboard data for LoR.
 *
 * All methods require a {@link RegionalRoute} (americas, europe, asia, sea).
 * LoR ranked leaderboards are available on americas, europe, and sea regions.
 *
 * @example
 * ```typescript
 * import { lorRankedV1 } from '@wardbox/whisper/lor';
 *
 * const leaderboard = await lorRankedV1.getLeaderboards(client, 'americas');
 * console.log(leaderboard.players[0].name, leaderboard.players[0].lp);
 * ```
 */
export const lorRankedV1 = {
  /**
   * Get the ranked leaderboard for the given region.
   *
   * Returns the top players on the LoR ranked ladder, ordered by rank.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe', 'sea')
   * @returns Leaderboard data with ranked players
   *
   * @example
   * ```typescript
   * const leaderboard = await lorRankedV1.getLeaderboards(client, 'europe');
   * for (const player of leaderboard.players) {
   *   console.log(`#${player.rank} ${player.name} (${player.lp} LP)`);
   * }
   * ```
   */
  async getLeaderboards(client: WhisperClient, route: RegionalRoute): Promise<LorLeaderboard> {
    const response = await client.request<LorLeaderboard>(
      route,
      '/lor/ranked/v1/leaderboards',
      'lor-ranked-v1.getLeaderboards',
    );
    return response.data;
  },
} as const;
