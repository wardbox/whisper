import type { WhisperClient } from '../core/client.js';
import type { PlatformRoute } from '../types/platform.js';
import type { LolLeagueEntry } from '../types/generated/lol.js';
import type { LeagueList } from '../types/overrides/lol-league.js';

/**
 * League API (v4).
 *
 * Query ranked league standings, entries by PUUID, and full league data
 * for challenger/grandmaster/master tiers.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { leagueV4 } from '@wardbox/whisper/lol';
 *
 * const challenger = await leagueV4.getChallengerLeague(client, 'na1', 'RANKED_SOLO_5x5');
 * console.log(challenger.entries.length);
 * ```
 */
export const leagueV4 = {
  /**
   * Get the challenger league for a given queue.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param queue - Queue type (e.g., 'RANKED_SOLO_5x5')
   * @returns The challenger league with all entries
   *
   * @example
   * ```typescript
   * const league = await leagueV4.getChallengerLeague(client, 'na1', 'RANKED_SOLO_5x5');
   * console.log(league.tier); // 'CHALLENGER'
   * ```
   */
  async getChallengerLeague(
    client: WhisperClient,
    route: PlatformRoute,
    queue: string,
  ): Promise<LeagueList> {
    const response = await client.request<LeagueList>(
      route,
      `/lol/league/v4/challengerleagues/by-queue/${queue}`,
      'league-v4.getChallengerLeague',
    );
    return response.data;
  },

  /**
   * Get the grandmaster league for a given queue.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param queue - Queue type (e.g., 'RANKED_SOLO_5x5')
   * @returns The grandmaster league with all entries
   *
   * @example
   * ```typescript
   * const league = await leagueV4.getGrandmasterLeague(client, 'euw1', 'RANKED_SOLO_5x5');
   * console.log(league.tier); // 'GRANDMASTER'
   * ```
   */
  async getGrandmasterLeague(
    client: WhisperClient,
    route: PlatformRoute,
    queue: string,
  ): Promise<LeagueList> {
    const response = await client.request<LeagueList>(
      route,
      `/lol/league/v4/grandmasterleagues/by-queue/${queue}`,
      'league-v4.getGrandmasterLeague',
    );
    return response.data;
  },

  /**
   * Get the master league for a given queue.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param queue - Queue type (e.g., 'RANKED_SOLO_5x5')
   * @returns The master league with all entries
   *
   * @example
   * ```typescript
   * const league = await leagueV4.getMasterLeague(client, 'kr', 'RANKED_SOLO_5x5');
   * console.log(league.tier); // 'MASTER'
   * ```
   */
  async getMasterLeague(
    client: WhisperClient,
    route: PlatformRoute,
    queue: string,
  ): Promise<LeagueList> {
    const response = await client.request<LeagueList>(
      route,
      `/lol/league/v4/masterleagues/by-queue/${queue}`,
      'league-v4.getMasterLeague',
    );
    return response.data;
  },

  /**
   * Get league entries for a summoner by PUUID.
   *
   * Returns all ranked queue entries for the given player.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @returns Array of league entries (one per queue)
   *
   * @example
   * ```typescript
   * const entries = await leagueV4.getEntriesByPuuid(client, 'na1', 'abc-123');
   * for (const entry of entries) {
   *   console.log(entry.queueType, entry.tier, entry.rank);
   * }
   * ```
   */
  async getEntriesByPuuid(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<LolLeagueEntry[]> {
    const response = await client.request<LolLeagueEntry[]>(
      route,
      `/lol/league/v4/entries/by-puuid/${puuid}`,
      'league-v4.getEntriesByPuuid',
    );
    return response.data;
  },

  /**
   * Get league entries by queue, tier, and division.
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
   * const entries = await leagueV4.getEntries(client, 'na1', 'RANKED_SOLO_5x5', 'DIAMOND', 'I');
   * console.log(entries.length);
   *
   * // With pagination
   * const page2 = await leagueV4.getEntries(client, 'na1', 'RANKED_SOLO_5x5', 'GOLD', 'IV', { page: 2 });
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
      `/lol/league/v4/entries/${queue}/${tier}/${division}`,
      'league-v4.getEntries',
      params ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Get a league by its ID.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param leagueId - League UUID
   * @returns The full league with all entries
   *
   * @example
   * ```typescript
   * const league = await leagueV4.getById(client, 'na1', 'some-league-uuid');
   * console.log(league.name, league.tier);
   * ```
   */
  async getById(
    client: WhisperClient,
    route: PlatformRoute,
    leagueId: string,
  ): Promise<LeagueList> {
    const response = await client.request<LeagueList>(
      route,
      `/lol/league/v4/leagues/${leagueId}`,
      'league-v4.getById',
    );
    return response.data;
  },
} as const;
