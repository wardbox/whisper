import type { WhisperClient } from '../core/client.js';
import type { TftMatch } from '../types/generated/tft.js';
import type { RegionalRoute } from '../types/regional.js';

/** Options for filtering TFT match ID queries */
export interface GetTftMatchIdsOptions {
  /** Start index (default 0) */
  start?: number;
  /** Number of match IDs to return (default 20, max 100) */
  count?: number;
  /** Epoch timestamp in seconds -- filter matches after this time */
  startTime?: number;
  /** Epoch timestamp in seconds -- filter matches before this time */
  endTime?: number;
}

/**
 * TFT Match API (v1).
 *
 * Retrieve TFT match history and match details by PUUID or match ID.
 *
 * All methods require a {@link RegionalRoute} (americas, europe, asia, sea).
 *
 * @example
 * ```typescript
 * import { tftMatchV1 } from '@wardbox/whisper/tft';
 *
 * const matchIds = await tftMatchV1.getMatchIdsByPuuid(client, 'americas', 'puuid-123');
 * const match = await tftMatchV1.getMatch(client, 'americas', matchIds[0]);
 * ```
 */
export const tftMatchV1 = {
  /**
   * Get a list of TFT match IDs by PUUID.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param puuid - Encrypted PUUID
   * @param options - Optional filters for time range and pagination
   * @returns Array of match ID strings
   *
   * @example
   * ```typescript
   * const ids = await tftMatchV1.getMatchIdsByPuuid(client, 'americas', 'puuid-123', {
   *   count: 10,
   * });
   * ```
   */
  async getMatchIdsByPuuid(
    client: WhisperClient,
    route: RegionalRoute,
    puuid: string,
    options?: GetTftMatchIdsOptions,
  ): Promise<string[]> {
    const params: Record<string, string> = {};
    if (options) {
      for (const [key, value] of Object.entries(options)) {
        if (value !== undefined) {
          params[key] = String(value);
        }
      }
    }
    const response = await client.request<string[]>(
      route,
      `/tft/match/v1/matches/by-puuid/${encodeURIComponent(puuid)}/ids`,
      'tft-match-v1.getMatchIdsByPuuid',
      Object.keys(params).length > 0 ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Get a TFT match by match ID.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param matchId - Match ID (e.g., 'NA1_1234567890')
   * @returns Full TFT match data including metadata and participant info
   *
   * @example
   * ```typescript
   * const match = await tftMatchV1.getMatch(client, 'americas', 'NA1_1234567890');
   * console.log(match.info.tft_set_number);
   * ```
   */
  async getMatch(client: WhisperClient, route: RegionalRoute, matchId: string): Promise<TftMatch> {
    const response = await client.request<TftMatch>(
      route,
      `/tft/match/v1/matches/${encodeURIComponent(matchId)}`,
      'tft-match-v1.getMatch',
    );
    return response.data;
  },
} as const;
