import type { WhisperClient } from '../core/client.js';
import type { TftLeagueList } from '../types/generated/tft.js';
import type { TftLeagueEntry, TftTopRatedLadderEntry } from '../types/overrides/tft-league.js';
import type { PlatformRoute } from '../types/platform.js';

/** Options for filtering TFT league entry queries by PUUID */
export interface GetTftLeagueEntriesOptions {
  /** Queue type to filter by */
  queue?: 'RANKED_TFT' | 'RANKED_TFT_DOUBLE_UP';
}

/**
 * TFT League API (v1).
 *
 * Query TFT ranked league standings, entries by PUUID, and full league data
 * for challenger/grandmaster/master tiers. Also includes top-rated ladder
 * for Hyper Roll and Double Up queues.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { tftLeagueV1 } from '@wardbox/whisper/tft';
 *
 * const challenger = await tftLeagueV1.getChallengerLeague(client, 'na1');
 * console.log(challenger.entries.length);
 * ```
 */
export const tftLeagueV1 = {
  /**
   * Get the TFT challenger league.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param options - Optional queue filter
   * @returns The challenger league with all entries
   *
   * @example
   * ```typescript
   * const league = await tftLeagueV1.getChallengerLeague(client, 'na1');
   * console.log(league.tier); // 'CHALLENGER'
   * ```
   */
  async getChallengerLeague(
    client: WhisperClient,
    route: PlatformRoute,
    options?: { queue?: 'RANKED_TFT' | 'RANKED_TFT_DOUBLE_UP' },
  ): Promise<TftLeagueList> {
    const params: Record<string, string> | undefined =
      options?.queue !== undefined ? { queue: options.queue } : undefined;
    const response = await client.request<TftLeagueList>(
      route,
      '/tft/league/v1/challenger',
      'tft-league-v1.getChallengerLeague',
      params ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Get the TFT grandmaster league.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param options - Optional queue filter
   * @returns The grandmaster league with all entries
   *
   * @example
   * ```typescript
   * const league = await tftLeagueV1.getGrandmasterLeague(client, 'euw1');
   * console.log(league.tier); // 'GRANDMASTER'
   * ```
   */
  async getGrandmasterLeague(
    client: WhisperClient,
    route: PlatformRoute,
    options?: { queue?: 'RANKED_TFT' | 'RANKED_TFT_DOUBLE_UP' },
  ): Promise<TftLeagueList> {
    const params: Record<string, string> | undefined =
      options?.queue !== undefined ? { queue: options.queue } : undefined;
    const response = await client.request<TftLeagueList>(
      route,
      '/tft/league/v1/grandmaster',
      'tft-league-v1.getGrandmasterLeague',
      params ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Get the TFT master league.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param options - Optional queue filter
   * @returns The master league with all entries
   *
   * @example
   * ```typescript
   * const league = await tftLeagueV1.getMasterLeague(client, 'kr');
   * console.log(league.tier); // 'MASTER'
   * ```
   */
  async getMasterLeague(
    client: WhisperClient,
    route: PlatformRoute,
    options?: { queue?: 'RANKED_TFT' | 'RANKED_TFT_DOUBLE_UP' },
  ): Promise<TftLeagueList> {
    const params: Record<string, string> | undefined =
      options?.queue !== undefined ? { queue: options.queue } : undefined;
    const response = await client.request<TftLeagueList>(
      route,
      '/tft/league/v1/master',
      'tft-league-v1.getMasterLeague',
      params ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Get TFT league entries for a player by PUUID.
   *
   * Returns all ranked TFT queue entries for the given player.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @param options - Optional queue filter
   * @returns Array of TFT league entries (one per queue)
   *
   * @example
   * ```typescript
   * const entries = await tftLeagueV1.getLeagueEntriesByPuuid(client, 'na1', 'abc-123');
   * for (const entry of entries) {
   *   console.log(entry.tier, entry.rank, entry.leaguePoints);
   * }
   * ```
   */
  async getLeagueEntriesByPuuid(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
    options?: GetTftLeagueEntriesOptions,
  ): Promise<TftLeagueEntry[]> {
    const params: Record<string, string> | undefined =
      options?.queue !== undefined ? { queue: options.queue } : undefined;
    const response = await client.request<TftLeagueEntry[]>(
      route,
      `/tft/league/v1/by-puuid/${encodeURIComponent(puuid)}`,
      'tft-league-v1.getLeagueEntriesByPuuid',
      params ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Get TFT league entries by tier and division.
   *
   * Returns a paginated list of entries. Use the `page` option for pagination.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param tier - Tier (e.g., 'DIAMOND', 'GOLD')
   * @param division - Division (e.g., 'I', 'II', 'III', 'IV')
   * @param options - Optional queue and pagination filters
   * @returns Array of TFT league entries
   *
   * @example
   * ```typescript
   * const entries = await tftLeagueV1.getLeagueEntries(client, 'na1', 'DIAMOND', 'I');
   * console.log(entries.length);
   *
   * // With pagination and queue filter
   * const page2 = await tftLeagueV1.getLeagueEntries(client, 'na1', 'GOLD', 'IV', {
   *   queue: 'RANKED_TFT',
   *   page: 2,
   * });
   * ```
   */
  async getLeagueEntries(
    client: WhisperClient,
    route: PlatformRoute,
    tier: string,
    division: string,
    options?: { queue?: string; page?: number },
  ): Promise<TftLeagueEntry[]> {
    const params: Record<string, string> = {};
    if (options) {
      if (options.queue !== undefined) {
        params.queue = options.queue;
      }
      if (options.page !== undefined) {
        params.page = String(options.page);
      }
    }
    const response = await client.request<TftLeagueEntry[]>(
      route,
      `/tft/league/v1/entries/${encodeURIComponent(tier)}/${encodeURIComponent(division)}`,
      'tft-league-v1.getLeagueEntries',
      Object.keys(params).length > 0 ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Get a TFT league by its ID.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param leagueId - League UUID
   * @returns The full TFT league with all entries
   *
   * @example
   * ```typescript
   * const league = await tftLeagueV1.getLeagueById(client, 'na1', 'some-league-uuid');
   * console.log(league.name, league.tier);
   * ```
   */
  async getLeagueById(
    client: WhisperClient,
    route: PlatformRoute,
    leagueId: string,
  ): Promise<TftLeagueList> {
    const response = await client.request<TftLeagueList>(
      route,
      `/tft/league/v1/leagues/${encodeURIComponent(leagueId)}`,
      'tft-league-v1.getLeagueById',
    );
    return response.data;
  },

  /**
   * Get the top-rated ladder for a TFT rated queue.
   *
   * Used for Hyper Roll and Double Up top player listings.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param queue - Rated queue name (e.g., 'RANKED_TFT_TURBO', 'RANKED_TFT_DOUBLE_UP')
   * @returns Array of top-rated ladder entries
   *
   * @example
   * ```typescript
   * const ladder = await tftLeagueV1.getTopRatedLadder(client, 'na1', 'RANKED_TFT_TURBO');
   * console.log(ladder[0].wins);
   * ```
   */
  async getTopRatedLadder(
    client: WhisperClient,
    route: PlatformRoute,
    queue: string,
  ): Promise<TftTopRatedLadderEntry[]> {
    const response = await client.request<TftTopRatedLadderEntry[]>(
      route,
      `/tft/league/v1/rated-ladders/${encodeURIComponent(queue)}/top`,
      'tft-league-v1.getTopRatedLadder',
    );
    return response.data;
  },
} as const;
