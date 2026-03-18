import type { WhisperClient } from '../core/client.js';
import type { ValPlatformData } from '../types/generated/val.js';
import type { ValPlatformRoute } from '../types/val-platform.js';

/**
 * Valorant Status API (v1).
 *
 * Retrieve platform status information including incidents and maintenances.
 *
 * All methods require a {@link ValPlatformRoute} (e.g., 'na', 'eu', 'ap').
 *
 * @example
 * ```typescript
 * import { valStatusV1 } from '@wardbox/whisper/val';
 *
 * const status = await valStatusV1.getPlatformData(client, 'na');
 * console.log(status.name, status.incidents.length);
 * ```
 */
export const valStatusV1 = {
  /**
   * Get platform status data for the given Valorant region.
   *
   * Returns incident and maintenance information for the Valorant platform.
   *
   * @param client - WhisperClient instance
   * @param route - Valorant platform routing value (e.g., 'na', 'eu', 'ap')
   * @returns Platform status data with incidents and maintenances
   *
   * @example
   * ```typescript
   * const status = await valStatusV1.getPlatformData(client, 'eu');
   * if (status.maintenances.length > 0) {
   *   console.log('Scheduled maintenance active');
   * }
   * ```
   */
  async getPlatformData(client: WhisperClient, route: ValPlatformRoute): Promise<ValPlatformData> {
    const response = await client.request<ValPlatformData>(
      route,
      '/val/status/v1/platform-data',
      'val-status-v1.getPlatformData',
    );
    return response.data;
  },
} as const;
