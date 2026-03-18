import type { WhisperClient } from '../core/client.js';
import type { LolLeagueEntry } from '../types/generated/lol.js';
import type { PlatformRoute } from '../types/platform.js';

/**
 * League Experimental API (v4).
 *
 * Experimental league entries endpoint that may include additional data
 * not yet available in the standard league-v4 API.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { leagueExpV4 } from '@wardbox/whisper/lol';
 *
 * const entries = await leagueExpV4.getEntries(client, 'na1', 'RANKED_SOLO_5x5', 'DIAMOND', 'I');
 * console.log(entries.length);
 * ```
 */
export const leagueExpV4 = {
  /**
   * Get experimental league entries by queue, tier, and division.
   *
   * Returns a paginated list of entries. Use the `page` option for pagination.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param queue - Queue type (e.g., 'RANKED_SOLO_5x5')
   * @param tier - Tier (e.g., 'DIAMOND', 'GOLD')
   * @param division - Division (e.g., 'I', 'II', 'III', 'IV')
   * @param options - Optional parameters
   * @param options.page - Page number (1-indexed)
   * @returns Array of league entries
   *
   * @example
   * ```typescript
   * const entries = await leagueExpV4.getEntries(client, 'na1', 'RANKED_SOLO_5x5', 'EMERALD', 'II');
   * console.log(entries.length);
   *
   * // With pagination
   * const page2 = await leagueExpV4.getEntries(client, 'euw1', 'RANKED_SOLO_5x5', 'GOLD', 'IV', { page: 2 });
   * ```
   */
  async getEntries(
    client: WhisperClient,
    route: PlatformRoute,
    queue: string,
    tier: string,
    division: string,
    options?: { page?: number },
  ): Promise<LolLeagueEntry[]> {
    const params: Record<string, string> | undefined =
      options?.page !== undefined ? { page: String(options.page) } : undefined;
    const response = await client.request<LolLeagueEntry[]>(
      route,
      `/lol/league-exp/v4/entries/${encodeURIComponent(queue)}/${encodeURIComponent(tier)}/${encodeURIComponent(division)}`,
      'league-exp-v4.getEntries',
      params ? { params } : undefined,
    );
    return response.data;
  },
} as const;
