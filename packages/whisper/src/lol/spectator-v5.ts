import type { WhisperClient } from '../core/client.js';
import type { PlatformRoute } from '../types/platform.js';
import type { LolCurrentGameInfo } from '../types/generated/lol.js';
import type { FeaturedGames } from '../types/overrides/lol-spectator.js';

/**
 * League of Legends Spectator API (v5).
 *
 * Access live game data and featured games. Use this to check if a summoner
 * is currently in a game or to retrieve a list of featured spectatable games.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { spectatorV5 } from '@wardbox/whisper/lol';
 *
 * const game = await spectatorV5.getCurrentGame(client, 'na1', puuid);
 * console.log(`In game on map ${game.mapId}`);
 * ```
 */
export const spectatorV5 = {
  /**
   * Get the current active game for a summoner by PUUID.
   *
   * Returns live game data if the summoner is currently in a game.
   * Throws a 404 error if the summoner is not in an active game.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @returns Current game information including participants and game settings
   *
   * @example
   * ```typescript
   * try {
   *   const game = await spectatorV5.getCurrentGame(client, 'na1', 'abc-123');
   *   console.log(`Game mode: ${game.gameMode}`);
   * } catch (e) {
   *   console.log('Summoner is not in a game');
   * }
   * ```
   */
  async getCurrentGame(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<LolCurrentGameInfo> {
    const response = await client.request<LolCurrentGameInfo>(
      route,
      `/lol/spectator/v5/active-games/by-summoner/${puuid}`,
      'spectator-v5.getCurrentGame',
    );
    return response.data;
  },

  /**
   * Get the list of currently featured (spectatable) games.
   *
   * Returns a list of games that are available for spectating along with
   * a suggested refresh interval.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @returns Featured games list with refresh interval
   *
   * @example
   * ```typescript
   * const featured = await spectatorV5.getFeaturedGames(client, 'na1');
   * console.log(`${featured.gameList.length} featured games`);
   * ```
   */
  async getFeaturedGames(
    client: WhisperClient,
    route: PlatformRoute,
  ): Promise<FeaturedGames> {
    const response = await client.request<FeaturedGames>(
      route,
      '/lol/spectator/v5/featured-games',
      'spectator-v5.getFeaturedGames',
    );
    return response.data;
  },
} as const;
