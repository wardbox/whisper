import type { WhisperClient } from '../core/client.js';
import type { PlatformRoute } from '../types/platform.js';
import type { ChampionInfo } from '../types/generated/lol.js';

/**
 * League of Legends Champion Rotation API (v3).
 *
 * Retrieve the current free champion rotation.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { championV3 } from '@wardbox/whisper/lol';
 *
 * const rotation = await championV3.getChampionRotations(client, 'na1');
 * console.log(rotation.freeChampionIds);
 * ```
 */
export const championV3 = {
  /**
   * Get the current free champion rotation including free-to-play for new players.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @returns Champion rotation data with free champion IDs
   *
   * @example
   * ```typescript
   * const rotation = await championV3.getChampionRotations(client, 'na1');
   * console.log(`${rotation.freeChampionIds.length} free champions this week`);
   * ```
   */
  async getChampionRotations(
    client: WhisperClient,
    route: PlatformRoute,
  ): Promise<ChampionInfo> {
    const response = await client.request<ChampionInfo>(
      route,
      '/lol/platform/v3/champion-rotations',
      'champion-v3.getChampionRotations',
    );
    return response.data;
  },
} as const;
