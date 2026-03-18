import type { WhisperClient } from '../core/client.js';
import type { TftPlatformData } from '../types/generated/tft.js';
import type { PlatformRoute } from '../types/platform.js';

/**
 * TFT Status API (v1).
 *
 * Retrieve TFT platform status information including incidents and maintenances.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { tftStatusV1 } from '@wardbox/whisper/tft';
 *
 * const status = await tftStatusV1.getPlatformData(client, 'na1');
 * console.log(status.name, status.incidents.length);
 * ```
 */
export const tftStatusV1 = {
  /**
   * Get TFT platform status data for the given region.
   *
   * Returns incident and maintenance information for the TFT platform.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @returns Platform status data with incidents and maintenances
   *
   * @example
   * ```typescript
   * const status = await tftStatusV1.getPlatformData(client, 'euw1');
   * if (status.maintenances.length > 0) {
   *   console.log('Scheduled maintenance active');
   * }
   * ```
   */
  async getPlatformData(client: WhisperClient, route: PlatformRoute): Promise<TftPlatformData> {
    const response = await client.request<TftPlatformData>(
      route,
      '/tft/status/v1/platform-data',
      'tft-status-v1.getPlatformData',
    );
    return response.data;
  },
} as const;
