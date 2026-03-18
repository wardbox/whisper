import type { WhisperClient } from '../core/client.js';
import type { Tournament } from '../types/generated/lol.js';
import type { ClashPlayer, ClashTeam } from '../types/overrides/lol-clash.js';
import type { PlatformRoute } from '../types/platform.js';

/**
 * Clash API (v1).
 *
 * Look up Clash tournament info, team details, and player registrations.
 *
 * All methods require a {@link PlatformRoute} (e.g., 'na1', 'euw1').
 *
 * @example
 * ```typescript
 * import { clashV1 } from '@wardbox/whisper/lol';
 *
 * const tournaments = await clashV1.getTournaments(client, 'na1');
 * console.log(tournaments.length);
 * ```
 */
export const clashV1 = {
  /**
   * Get Clash player entries by PUUID.
   *
   * Returns all Clash team registrations for the given player.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param puuid - Encrypted PUUID
   * @returns Array of Clash player entries (one per team registration)
   *
   * @example
   * ```typescript
   * const players = await clashV1.getPlayersByPuuid(client, 'na1', 'abc-123-def');
   * for (const entry of players) {
   *   console.log(entry.teamId, entry.position);
   * }
   * ```
   */
  async getPlayersByPuuid(
    client: WhisperClient,
    route: PlatformRoute,
    puuid: string,
  ): Promise<ClashPlayer[]> {
    const response = await client.request<ClashPlayer[]>(
      route,
      `/lol/clash/v1/players/by-puuid/${puuid}`,
      'clash-v1.getPlayersByPuuid',
    );
    return response.data;
  },

  /**
   * Get all active and upcoming Clash tournaments.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @returns Array of tournaments
   *
   * @example
   * ```typescript
   * const tournaments = await clashV1.getTournaments(client, 'na1');
   * for (const t of tournaments) {
   *   console.log(t.nameKey, t.schedule.length);
   * }
   * ```
   */
  async getTournaments(client: WhisperClient, route: PlatformRoute): Promise<Tournament[]> {
    const response = await client.request<Tournament[]>(
      route,
      '/lol/clash/v1/tournaments',
      'clash-v1.getTournaments',
    );
    return response.data;
  },

  /**
   * Get a Clash tournament by ID.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param tournamentId - Tournament ID
   * @returns Tournament details
   *
   * @example
   * ```typescript
   * const tournament = await clashV1.getTournamentById(client, 'na1', '12345');
   * console.log(tournament.nameKey, tournament.themeId);
   * ```
   */
  async getTournamentById(
    client: WhisperClient,
    route: PlatformRoute,
    tournamentId: string,
  ): Promise<Tournament> {
    const response = await client.request<Tournament>(
      route,
      `/lol/clash/v1/tournaments/${tournamentId}`,
      'clash-v1.getTournamentById',
    );
    return response.data;
  },

  /**
   * Get a Clash team by ID.
   *
   * @param client - WhisperClient instance
   * @param route - Platform routing value (e.g., 'na1', 'euw1')
   * @param teamId - Team ID
   * @returns Team details including roster
   *
   * @example
   * ```typescript
   * const team = await clashV1.getTeamById(client, 'na1', 'team-abc');
   * console.log(team.name, team.players.length);
   * ```
   */
  async getTeamById(
    client: WhisperClient,
    route: PlatformRoute,
    teamId: string,
  ): Promise<ClashTeam> {
    const response = await client.request<ClashTeam>(
      route,
      `/lol/clash/v1/teams/${teamId}`,
      'clash-v1.getTeamById',
    );
    return response.data;
  },
} as const;
