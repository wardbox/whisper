import type { WhisperClient } from '../core/client.js';
import type { LolMatch, LolMatchTimeline } from '../types/generated/lol.js';
import type { RegionalRoute } from '../types/regional.js';
import type { GetMatchIdsOptions } from './match-v5.js';

/**
 * LoL RSO Match API (v1).
 *
 * RSO (Riot Sign On) variant of the match API. Uses the same response types
 * as match-v5 but with RSO-authenticated paths. Requires RSO authorization.
 *
 * All methods require a {@link RegionalRoute} (americas, europe, asia, sea).
 *
 * @example
 * ```typescript
 * import { lolRsoMatchV1 } from '@wardbox/whisper/lol';
 *
 * const matchIds = await lolRsoMatchV1.getMatchIds(client, 'americas', 'puuid-123');
 * const match = await lolRsoMatchV1.getMatch(client, 'americas', matchIds[0]);
 * ```
 */
export const lolRsoMatchV1 = {
  /**
   * Get a list of match IDs by PUUID (RSO-authenticated).
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param puuid - Encrypted PUUID
   * @param options - Optional filters for queue, type, time range, and pagination
   * @returns Array of match ID strings
   *
   * @example
   * ```typescript
   * const ids = await lolRsoMatchV1.getMatchIds(client, 'americas', 'puuid-123', {
   *   count: 20,
   * });
   * ```
   */
  async getMatchIds(
    client: WhisperClient,
    route: RegionalRoute,
    puuid: string,
    options?: GetMatchIdsOptions,
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
      `/lol/rso-match/v1/matches/by-puuid/${puuid}/ids`,
      'lol-rso-match-v1.getMatchIds',
      Object.keys(params).length > 0 ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Get a match by match ID (RSO-authenticated).
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param matchId - Match ID (e.g., 'NA1_1234567890')
   * @returns Full match data including metadata, info, and participants
   *
   * @example
   * ```typescript
   * const match = await lolRsoMatchV1.getMatch(client, 'americas', 'NA1_1234567890');
   * console.log(match.info.gameDuration);
   * ```
   */
  async getMatch(client: WhisperClient, route: RegionalRoute, matchId: string): Promise<LolMatch> {
    const response = await client.request<LolMatch>(
      route,
      `/lol/rso-match/v1/matches/${matchId}`,
      'lol-rso-match-v1.getMatch',
    );
    return response.data;
  },

  /**
   * Get a match timeline by match ID (RSO-authenticated).
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param matchId - Match ID (e.g., 'NA1_1234567890')
   * @returns Match timeline with frame-by-frame data
   *
   * @example
   * ```typescript
   * const timeline = await lolRsoMatchV1.getTimeline(client, 'americas', 'NA1_1234567890');
   * console.log(timeline.info.frames.length);
   * ```
   */
  async getTimeline(
    client: WhisperClient,
    route: RegionalRoute,
    matchId: string,
  ): Promise<LolMatchTimeline> {
    const response = await client.request<LolMatchTimeline>(
      route,
      `/lol/rso-match/v1/matches/${matchId}/timeline`,
      'lol-rso-match-v1.getTimeline',
    );
    return response.data;
  },
} as const;
