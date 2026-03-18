import type { WhisperClient } from '../core/client.js';
import type { Account } from '../types/generated/riot.js';
import type { ActiveShard } from '../types/overrides/riot-account.js';
import type { RegionalRoute } from '../types/regional.js';

/**
 * Riot Account API (v1).
 *
 * Shared across all Riot games. Look up accounts by PUUID or Riot ID,
 * or query which shard a player is active on for a given game.
 *
 * All methods require a {@link RegionalRoute} (americas, europe, asia, sea).
 *
 * @example
 * ```typescript
 * import { accountV1 } from '@wardbox/whisper/riot';
 *
 * const account = await accountV1.getByRiotId(client, 'americas', 'PlayerName', 'NA1');
 * console.log(account.puuid);
 * ```
 */
export const accountV1 = {
  /**
   * Get an account by PUUID.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param puuid - Encrypted PUUID
   * @returns Account data including gameName, tagLine, and puuid
   *
   * @example
   * ```typescript
   * const account = await accountV1.getByPuuid(client, 'americas', 'abc-123-def');
   * console.log(account.gameName, account.tagLine);
   * ```
   */
  async getByPuuid(client: WhisperClient, route: RegionalRoute, puuid: string): Promise<Account> {
    const response = await client.request<Account>(
      route,
      `/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`,
      'account-v1.getByPuuid',
    );
    return response.data;
  },

  /**
   * Get an account by Riot ID (gameName + tagLine).
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param gameName - Riot ID game name
   * @param tagLine - Riot ID tag line (e.g., "NA1")
   * @returns Account data including gameName, tagLine, and puuid
   *
   * @example
   * ```typescript
   * const account = await accountV1.getByRiotId(client, 'americas', 'PlayerName', 'NA1');
   * console.log(account.puuid);
   * ```
   */
  async getByRiotId(
    client: WhisperClient,
    route: RegionalRoute,
    gameName: string,
    tagLine: string,
  ): Promise<Account> {
    const response = await client.request<Account>(
      route,
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      'account-v1.getByRiotId',
    );
    return response.data;
  },

  /**
   * Get the active shard for a player in a specific game.
   *
   * Determines which platform shard hosts a player's data for a given game.
   * Useful for routing subsequent requests to the correct shard.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param game - Game identifier (e.g., "val", "lor")
   * @param puuid - Encrypted PUUID
   * @returns Active shard information for the player and game
   *
   * @example
   * ```typescript
   * const shard = await accountV1.getByGame(client, 'americas', 'val', 'abc-123-def');
   * console.log(shard.activeShard); // e.g., "na"
   * ```
   */
  async getByGame(
    client: WhisperClient,
    route: RegionalRoute,
    game: string,
    puuid: string,
  ): Promise<ActiveShard> {
    const response = await client.request<ActiveShard>(
      route,
      `/riot/account/v1/active-shards/by-game/${encodeURIComponent(game)}/by-puuid/${encodeURIComponent(puuid)}`,
      'account-v1.getByGame',
    );
    return response.data;
  },
} as const;
