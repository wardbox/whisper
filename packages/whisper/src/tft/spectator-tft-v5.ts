import type { WhisperClient } from '../core/client.js';
import type { TftCurrentGameInfo } from '../types/generated/tft.js';
import type { PlatformRoute } from '../types/platform.js';

/**
 * TFT Spectator API (v5).
 *
 * Access live TFT game data. Use this to check if a player is currently
 * in a TFT game.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { spectatorTftV5 } from '@wardbox/whisper/tft';
 *
 * const game = await spectatorTftV5.getCurrentGame(client, 'na1', puuid);
 * console.log(`In TFT game on map ${game.mapId}`);
 * ```
 */
export const spectatorTftV5 = {
  /**
   * Get the current active TFT game for a player by PUUID.
   *
   * Returns live game data if the player is currently in a TFT game.
   * Throws a 404 error if the player is not in an active game.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @returns Current TFT game information including participants and game settings
   *
   * @example
   * ```typescript
   * try {
   *   const game = await spectatorTftV5.getCurrentGame(client, 'na1', 'abc-123');
   *   console.log(`Game mode: ${game.gameMode}`);
   * } catch (e) {
   *   console.log('Player is not in a TFT game');
   * }
   * ```
   */
  async getCurrentGame(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<TftCurrentGameInfo> {
    const response = await client.request<TftCurrentGameInfo>(
      route,
      `/lol/spectator/tft/v5/active-games/by-puuid/${encodeURIComponent(puuid)}`,
      'spectator-tft-v5.getCurrentGame',
    );
    return response.data;
  },
} as const;
