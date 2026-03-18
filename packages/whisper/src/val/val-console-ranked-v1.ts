import type { WhisperClient } from '../core/client.js';
import type { Leaderboard } from '../types/generated/val.js';
import type { ValPlatformRoute } from '../types/val-platform.js';
import type { GetValLeaderboardOptions } from './val-ranked-v1.js';

/**
 * Valorant Console Ranked API (v1).
 *
 * Retrieve competitive leaderboard data for console players by act.
 * Console leaderboard queries require a `platformType` parameter.
 *
 * All methods require a {@link ValPlatformRoute} (e.g., 'na', 'eu', 'ap').
 *
 * @example
 * ```typescript
 * import { valConsoleRankedV1 } from '@wardbox/whisper/val';
 *
 * const lb = await valConsoleRankedV1.getLeaderboard(client, 'na', 'act-id', 'playstation');
 * console.log(lb.totalPlayers, 'console ranked players');
 * ```
 */
export const valConsoleRankedV1 = {
  /**
   * Get the console competitive leaderboard for a specific act.
   *
   * @param client - WhisperClient instance
   * @param route - Valorant platform routing value (e.g., 'na', 'eu', 'ap')
   * @param actId - Unique identifier of the competitive act
   * @param platformType - Console platform ('playstation' or 'xbox')
   * @param options - Optional pagination parameters
   * @returns Leaderboard data with player rankings
   *
   * @example
   * ```typescript
   * // Get top 100 PlayStation players
   * const lb = await valConsoleRankedV1.getLeaderboard(
   *   client, 'na', 'act-id', 'playstation', { size: 100 },
   * );
   * lb.players.forEach(p => console.log(p.leaderboardRank, p.gameName));
   * ```
   */
  async getLeaderboard(
    client: WhisperClient,
    route: ValPlatformRoute,
    actId: string,
    platformType: 'playstation' | 'xbox',
    options?: GetValLeaderboardOptions,
  ): Promise<Leaderboard> {
    const params: Record<string, string> = { platformType };
    if (options?.size !== undefined) {
      params.size = String(options.size);
    }
    if (options?.startIndex !== undefined) {
      params.startIndex = String(options.startIndex);
    }
    const response = await client.request<Leaderboard>(
      route,
      `/val/console/ranked/v1/leaderboards/by-act/${encodeURIComponent(actId)}`,
      'val-console-ranked-v1.getLeaderboard',
      { params },
    );
    return response.data;
  },
} as const;
