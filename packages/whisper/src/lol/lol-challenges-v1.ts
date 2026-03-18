import type { WhisperClient } from '../core/client.js';
import type {
  ChallengeConfigInfo,
  ChallengePercentiles,
  PlayerInfo,
} from '../types/generated/lol.js';
import type { ApexPlayerInfo } from '../types/overrides/lol-challenges.js';
import type { PlatformRoute } from '../types/platform.js';

/**
 * LoL Challenges API (v1).
 *
 * Query challenge configurations, percentiles, leaderboards, and
 * per-player challenge progress.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { lolChallengesV1 } from '@wardbox/whisper/lol';
 *
 * const configs = await lolChallengesV1.getConfig(client, 'na1');
 * console.log(configs.length);
 * ```
 */
export const lolChallengesV1 = {
  /**
   * Get all challenge configurations.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @returns Array of challenge configurations
   *
   * @example
   * ```typescript
   * const configs = await lolChallengesV1.getConfig(client, 'na1');
   * for (const config of configs) {
   *   console.log(config.id, config.state);
   * }
   * ```
   */
  async getConfig(client: WhisperClient, route: PlatformRoute): Promise<ChallengeConfigInfo[]> {
    const response = await client.request<ChallengeConfigInfo[]>(
      route,
      '/lol/challenges/v1/challenges/config',
      'lol-challenges-v1.getConfig',
    );
    return response.data;
  },

  /**
   * Get percentiles for all challenges.
   *
   * Returns a map of challenge IDs to their tier-level percentile breakdowns.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @returns Percentile data for all challenges
   *
   * @example
   * ```typescript
   * const percentiles = await lolChallengesV1.getPercentiles(client, 'na1');
   * ```
   */
  async getPercentiles(client: WhisperClient, route: PlatformRoute): Promise<ChallengePercentiles> {
    const response = await client.request<ChallengePercentiles>(
      route,
      '/lol/challenges/v1/challenges/percentiles',
      'lol-challenges-v1.getPercentiles',
    );
    return response.data;
  },

  /**
   * Get configuration for a specific challenge.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param challengeId - Numeric challenge ID
   * @returns Challenge configuration
   *
   * @example
   * ```typescript
   * const config = await lolChallengesV1.getChallengeConfig(client, 'na1', 1);
   * console.log(config.state, config.leaderboard);
   * ```
   */
  async getChallengeConfig(
    client: WhisperClient,
    route: PlatformRoute,
    challengeId: number,
  ): Promise<ChallengeConfigInfo> {
    const response = await client.request<ChallengeConfigInfo>(
      route,
      `/lol/challenges/v1/challenges/${challengeId}/config`,
      'lol-challenges-v1.getChallengeConfig',
    );
    return response.data;
  },

  /**
   * Get percentiles for a specific challenge.
   *
   * Returns a map of tier level names to their percentile values.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param challengeId - Numeric challenge ID
   * @returns Map of level to percentile value
   *
   * @example
   * ```typescript
   * const percentiles = await lolChallengesV1.getChallengePercentiles(client, 'na1', 1);
   * console.log(percentiles.GOLD, percentiles.DIAMOND);
   * ```
   */
  async getChallengePercentiles(
    client: WhisperClient,
    route: PlatformRoute,
    challengeId: number,
  ): Promise<Record<string, number>> {
    const response = await client.request<Record<string, number>>(
      route,
      `/lol/challenges/v1/challenges/${challengeId}/percentiles`,
      'lol-challenges-v1.getChallengePercentiles',
    );
    return response.data;
  },

  /**
   * Get the leaderboard for a specific challenge at a given level.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param challengeId - Numeric challenge ID
   * @param level - Challenge level (e.g., 'MASTER', 'GRANDMASTER', 'CHALLENGER')
   * @returns Array of top-ranked players
   *
   * @example
   * ```typescript
   * const leaders = await lolChallengesV1.getChallengeLeaderboard(client, 'na1', 1, 'CHALLENGER');
   * for (const player of leaders) {
   *   console.log(player.puuid, player.value, player.position);
   * }
   * ```
   */
  async getChallengeLeaderboard(
    client: WhisperClient,
    route: PlatformRoute,
    challengeId: number,
    level: string,
  ): Promise<ApexPlayerInfo[]> {
    const response = await client.request<ApexPlayerInfo[]>(
      route,
      `/lol/challenges/v1/challenges/${challengeId}/leaderboards/by-level/${level}`,
      'lol-challenges-v1.getChallengeLeaderboard',
    );
    return response.data;
  },

  /**
   * Get a player's challenge data by PUUID.
   *
   * Returns all challenge progress, preferences, and point totals for a player.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @returns Player challenge data
   *
   * @example
   * ```typescript
   * const data = await lolChallengesV1.getPlayerData(client, 'na1', 'abc-123');
   * console.log(data.totalPoints.level, data.challenges.length);
   * ```
   */
  async getPlayerData(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<PlayerInfo> {
    const response = await client.request<PlayerInfo>(
      route,
      `/lol/challenges/v1/player-data/${puuid}`,
      'lol-challenges-v1.getPlayerData',
    );
    return response.data;
  },
} as const;
