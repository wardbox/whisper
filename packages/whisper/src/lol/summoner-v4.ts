import type { WhisperClient } from '../core/client.js';
import type { LolSummoner } from '../types/generated/lol.js';
import type { PlatformRoute } from '../types/platform.js';

/**
 * League of Legends Summoner API (v4).
 *
 * Access summoner data by PUUID or encrypted account ID.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { summonerV4 } from '@wardbox/whisper/lol';
 *
 * const summoner = await summonerV4.getByPuuid(client, 'na1', puuid);
 * console.log(summoner.summonerLevel);
 * ```
 */
export const summonerV4 = {
  /**
   * Get a summoner by PUUID.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @returns Summoner profile data
   *
   * @example
   * ```typescript
   * const summoner = await summonerV4.getByPuuid(client, 'na1', 'abc-123');
   * console.log(`Level ${summoner.summonerLevel}`);
   * ```
   */
  async getByPuuid(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<LolSummoner> {
    const response = await client.request<LolSummoner>(
      route,
      `/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      'summoner-v4.getByPuuid',
    );
    return response.data;
  },

  /**
   * Get a summoner by encrypted account ID.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param encryptedAccountId - Encrypted account ID
   * @returns Summoner profile data
   *
   * @example
   * ```typescript
   * const summoner = await summonerV4.getByAccountId(client, 'na1', 'encrypted-id');
   * console.log(`Level ${summoner.summonerLevel}`);
   * ```
   */
  async getByAccountId(
    client: WhisperClient,
    route: PlatformRoute,
    encryptedAccountId: string,
  ): Promise<LolSummoner> {
    const response = await client.request<LolSummoner>(
      route,
      `/lol/summoner/v4/summoners/by-account/${encryptedAccountId}`,
      'summoner-v4.getByAccountId',
    );
    return response.data;
  },
} as const;
