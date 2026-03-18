import type { WhisperClient } from '../core/client.js';
import type { LolMatch, LolMatchTimeline } from '../types/generated/lol.js';
import type { RegionalRoute } from '../types/regional.js';

/** Options for filtering match ID queries */
export interface GetMatchIdsOptions {
  /** Start index (default 0) */
  start?: number;
  /** Number of match IDs to return (default 20, max 100) */
  count?: number;
  /** Filter by queue ID */
  queue?: number;
  /** Filter by match type (e.g., 'ranked', 'normal', 'tourney', 'tutorial') */
  type?: string;
  /** Epoch timestamp in seconds -- filter matches after this time */
  startTime?: number;
  /** Epoch timestamp in seconds -- filter matches before this time */
  endTime?: number;
}

/**
 * LoL Match API (v5).
 *
 * Retrieve match history, match details, and match timelines by PUUID or match ID.
 *
 * All methods require a {@link RegionalRoute} (americas, europe, asia, sea).
 *
 * @example
 * ```typescript
 * import { matchV5 } from '@wardbox/whisper/lol';
 *
 * const matchIds = await matchV5.getMatchIdsByPuuid(client, 'americas', 'puuid-123');
 * const match = await matchV5.getMatch(client, 'americas', matchIds[0]);
 * ```
 */
export const matchV5 = {
  /**
   * Get a list of match IDs by PUUID.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param puuid - Encrypted PUUID
   * @param options - Optional filters for queue, type, time range, and pagination
   * @returns Array of match ID strings
   *
   * @example
   * ```typescript
   * // Get recent ranked matches
   * const ids = await matchV5.getMatchIdsByPuuid(client, 'americas', 'puuid-123', {
   *   type: 'ranked',
   *   count: 10,
   * });
   * ```
   */
  async getMatchIdsByPuuid(
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
      `/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      'match-v5.getMatchIdsByPuuid',
      Object.keys(params).length > 0 ? { params } : undefined,
    );
    return response.data;
  },

  /**
   * Get a match by match ID.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param matchId - Match ID (e.g., 'NA1_1234567890')
   * @returns Full match data including metadata, info, and participants
   *
   * @example
   * ```typescript
   * const match = await matchV5.getMatch(client, 'americas', 'NA1_1234567890');
   * console.log(match.info.gameDuration);
   * ```
   */
  async getMatch(client: WhisperClient, route: RegionalRoute, matchId: string): Promise<LolMatch> {
    const response = await client.request<LolMatch>(
      route,
      `/lol/match/v5/matches/${matchId}`,
      'match-v5.getMatch',
    );
    return response.data;
  },

  /**
   * Get a match timeline by match ID.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param matchId - Match ID (e.g., 'NA1_1234567890')
   * @returns Match timeline with frame-by-frame data
   *
   * @example
   * ```typescript
   * const timeline = await matchV5.getMatchTimeline(client, 'americas', 'NA1_1234567890');
   * console.log(timeline.info.frames.length);
   * ```
   */
  async getMatchTimeline(
    client: WhisperClient,
    route: RegionalRoute,
    matchId: string,
  ): Promise<LolMatchTimeline> {
    const response = await client.request<LolMatchTimeline>(
      route,
      `/lol/match/v5/matches/${matchId}/timeline`,
      'match-v5.getMatchTimeline',
    );
    return response.data;
  },
} as const;
