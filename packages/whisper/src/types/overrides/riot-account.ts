/**
 * Active shard information for a player in a specific game.
 *
 * Returned by account-v1.getByGame to determine which platform shard
 * a player's game data is hosted on.
 */
export interface ActiveShard {
  /** Encrypted PUUID of the player */
  puuid: string;
  /** Game identifier (e.g., "val", "lor") */
  game: string;
  /** Active shard/platform for this player and game (e.g., "na", "eu") */
  activeShard: string;
}
