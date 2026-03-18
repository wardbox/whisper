import type { WhisperClient } from '../core/client.js';
import type { TftSummoner } from '../types/generated/tft.js';
import type { PlatformRoute } from '../types/platform.js';

/**
 * TFT Summoner API (v1).
 *
 * Access TFT summoner data by PUUID or RSO access token.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { tftSummonerV1 } from '@wardbox/whisper/tft';
 *
 * const summoner = await tftSummonerV1.getByPuuid(client, 'na1', puuid);
 * console.log(summoner.summonerLevel);
 * ```
 */
export const tftSummonerV1 = {
  /**
   * Get a TFT summoner by PUUID.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @returns TFT summoner profile data
   *
   * @example
   * ```typescript
   * const summoner = await tftSummonerV1.getByPuuid(client, 'na1', 'abc-123');
   * console.log(`Level ${summoner.summonerLevel}`);
   * ```
   */
  async getByPuuid(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<TftSummoner> {
    const response = await client.request<TftSummoner>(
      route,
      `/tft/summoner/v1/summoners/by-puuid/${encodeURIComponent(puuid)}`,
      'tft-summoner-v1.getByPuuid',
    );
    return response.data;
  },

  /**
   * Get the TFT summoner for the authenticated user via RSO access token.
   *
   * This endpoint requires Riot Sign On (RSO) authentication. The access token
   * is passed as a Bearer token in the Authorization header.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param accessToken - RSO access token (OAuth2 Bearer token)
   * @returns TFT summoner profile data for the authenticated user
   *
   * @example
   * ```typescript
   * // Requires RSO (Riot Sign On) authentication
   * const summoner = await tftSummonerV1.getByAccessToken(client, 'na1', 'rso-token');
   * console.log(`Level ${summoner.summonerLevel}`);
   * ```
   */
  async getByAccessToken(
    client: WhisperClient,
    route: PlatformRoute,
    accessToken: string,
  ): Promise<TftSummoner> {
    const response = await client.request<TftSummoner>(
      route,
      '/tft/summoner/v1/summoners/me',
      'tft-summoner-v1.getByAccessToken',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return response.data;
  },
} as const;
