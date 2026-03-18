import type { WhisperClient } from '../core/client.js';
import type { LorPlatformData } from '../types/generated/lor.js';
import type { RegionalRoute } from '../types/regional.js';

/**
 * Legends of Runeterra Status API (v1).
 *
 * Retrieve platform status information including incidents and maintenances for LoR.
 *
 * All methods require a {@link RegionalRoute} (americas, europe, asia, sea).
 *
 * @example
 * ```typescript
 * import { lorStatusV1 } from '@wardbox/whisper/lor';
 *
 * const status = await lorStatusV1.getPlatformData(client, 'americas');
 * console.log(status.name, status.incidents.length);
 * ```
 */
export const lorStatusV1 = {
  /**
   * Get platform status data for the given region.
   *
   * Returns incident and maintenance information for the LoR platform.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @returns Platform status data with incidents and maintenances
   *
   * @example
   * ```typescript
   * const status = await lorStatusV1.getPlatformData(client, 'europe');
   * if (status.maintenances.length > 0) {
   *   console.log('Scheduled maintenance active');
   * }
   * ```
   */
  async getPlatformData(client: WhisperClient, route: RegionalRoute): Promise<LorPlatformData> {
    const response = await client.request<LorPlatformData>(
      route,
      '/lor/status/v1/platform-data',
      'lor-status-v1.getPlatformData',
    );
    return response.data;
  },
} as const;
