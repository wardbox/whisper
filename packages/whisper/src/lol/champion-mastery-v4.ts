import type { WhisperClient } from '../core/client.js';
import type { ChampionMastery } from '../types/generated/lol.js';
import type { PlatformRoute } from '../types/platform.js';

/**
 * League of Legends Champion Mastery API (v4).
 *
 * Access champion mastery data for summoners by PUUID, including mastery
 * scores, top champions, and per-champion mastery details.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { championMasteryV4 } from '@wardbox/whisper/lol';
 *
 * const masteries = await championMasteryV4.getByPuuid(client, 'na1', puuid);
 * console.log(masteries[0].championPoints);
 * ```
 */
export const championMasteryV4 = {
  /**
   * Get all champion mastery entries for a summoner by PUUID.
   *
   * Returns mastery data for every champion the summoner has played,
   * sorted by champion points descending.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @returns Array of champion mastery entries
   *
   * @example
   * ```typescript
   * const masteries = await championMasteryV4.getByPuuid(client, 'na1', 'abc-123');
   * for (const m of masteries) {
   *   console.log(`Champion ${m.championId}: ${m.championPoints} pts`);
   * }
   * ```
   */
  async getByPuuid(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<ChampionMastery[]> {
    const response = await client.request<ChampionMastery[]>(
      route,
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`,
      'champion-mastery-v4.getByPuuid',
    );
    return response.data;
  },

  /**
   * Get the top champion mastery entries for a summoner by PUUID.
   *
   * Returns the highest mastery champions, sorted by champion points descending.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @param options - Optional parameters
   * @param options.count - Number of entries to retrieve (defaults to 3)
   * @returns Array of top champion mastery entries
   *
   * @example
   * ```typescript
   * const top5 = await championMasteryV4.getTopByPuuid(client, 'na1', 'abc-123', { count: 5 });
   * ```
   */
  async getTopByPuuid(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
    options?: { count?: number },
  ): Promise<ChampionMastery[]> {
    const params: Record<string, string> | undefined =
      options?.count !== undefined ? { count: String(options.count) } : undefined;
    const response = await client.request<ChampionMastery[]>(
      route,
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top`,
      'champion-mastery-v4.getTopByPuuid',
      params ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Get champion mastery for a specific champion by PUUID.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @param championId - Champion ID
   * @returns Champion mastery entry for the specified champion
   *
   * @example
   * ```typescript
   * const mastery = await championMasteryV4.getByPuuidByChampion(client, 'na1', 'abc-123', 236);
   * console.log(`Level ${mastery.championLevel}, ${mastery.championPoints} pts`);
   * ```
   */
  async getByPuuidByChampion(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
    championId: number,
  ): Promise<ChampionMastery> {
    const response = await client.request<ChampionMastery>(
      route,
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`,
      'champion-mastery-v4.getByPuuidByChampion',
    );
    return response.data;
  },

  /**
   * Get total champion mastery score for a summoner by PUUID.
   *
   * The mastery score is the sum of all individual champion mastery levels.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @returns Total champion mastery score (sum of all champion levels)
   *
   * @example
   * ```typescript
   * const score = await championMasteryV4.getScoresByPuuid(client, 'na1', 'abc-123');
   * console.log(`Total mastery score: ${score}`);
   * ```
   */
  async getScoresByPuuid(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<number> {
    const response = await client.request<number>(
      route,
      `/lol/champion-mastery/v4/scores/by-puuid/${puuid}`,
      'champion-mastery-v4.getScoresByPuuid',
    );
    return response.data;
  },
} as const;
