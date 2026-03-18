import type { WhisperClient } from '../core/client.js';
import type { LolPlatformData } from '../types/generated/lol.js';
import type { PlatformRoute } from '../types/platform.js';

/**
 * League of Legends Status API (v4).
 *
 * Retrieve platform status information including incidents and maintenances.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { lolStatusV4 } from '@wardbox/whisper/lol';
 *
 * const status = await lolStatusV4.getStatus(client, 'na1');
 * console.log(status.name, status.incidents.length);
 * ```
 */
export const lolStatusV4 = {
  /**
   * Get platform status data for the given region.
   *
   * Returns incident and maintenance information for the LoL platform.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @returns Platform status data with incidents and maintenances
   *
   * @example
   * ```typescript
   * const status = await lolStatusV4.getStatus(client, 'euw1');
   * if (status.maintenances.length > 0) {
   *   console.log('Scheduled maintenance active');
   * }
   * ```
   */
  async getStatus(client: WhisperClient, route: PlatformRoute): Promise<LolPlatformData> {
    const response = await client.request<LolPlatformData>(
      route,
      '/lol/status/v4/platform-data',
      'lol-status-v4.getStatus',
    );
    return response.data;
  },
} as const;
