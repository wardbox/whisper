import type { WhisperClient } from '../core/client.js';
import type {
  LobbyEventV5Wrapper,
  ProviderRegistrationParameters,
  TournamentCodeParameters,
  TournamentCodeUpdateParameters,
  TournamentCodeV5,
  TournamentRegistrationParameters,
} from '../types/overrides/lol-tournament.js';
import type { RegionalRoute } from '../types/regional.js';

/**
 * LoL Tournament API (v5).
 *
 * Create and manage tournament codes, providers, and tournaments.
 * Includes POST endpoints for creating resources and GET/PUT for querying
 * and updating tournament codes.
 *
 * All methods require a {@link RegionalRoute} (americas, europe, asia, sea).
 *
 * @example
 * ```typescript
 * import { tournamentV5 } from '@wardbox/whisper/lol';
 *
 * const providerId = await tournamentV5.createProvider(client, 'americas', {
 *   region: 'NA',
 *   url: 'https://example.com/callback',
 * });
 * ```
 */
export const tournamentV5 = {
  /**
   * Register a tournament provider.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param body - Provider registration parameters (region and callback URL)
   * @returns Provider ID (number)
   *
   * @example
   * ```typescript
   * const providerId = await tournamentV5.createProvider(client, 'americas', {
   *   region: 'NA',
   *   url: 'https://example.com/callback',
   * });
   * ```
   */
  async createProvider(
    client: WhisperClient,
    route: RegionalRoute,
    body: ProviderRegistrationParameters,
  ): Promise<number> {
    const response = await client.request<number>(
      route,
      '/lol/tournament/v5/providers',
      'tournament-v5.createProvider',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return response.data;
  },

  /**
   * Register a tournament.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param body - Tournament registration parameters (providerId and optional name)
   * @returns Tournament ID (number)
   *
   * @example
   * ```typescript
   * const tournamentId = await tournamentV5.createTournament(client, 'americas', {
   *   providerId: 123,
   *   name: 'My Tournament',
   * });
   * ```
   */
  async createTournament(
    client: WhisperClient,
    route: RegionalRoute,
    body: TournamentRegistrationParameters,
  ): Promise<number> {
    const response = await client.request<number>(
      route,
      '/lol/tournament/v5/tournaments',
      'tournament-v5.createTournament',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return response.data;
  },

  /**
   * Create tournament codes for a tournament.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param tournamentId - Tournament ID to create codes for
   * @param body - Tournament code parameters (map, pick type, spectator type, etc.)
   * @param options - Optional count of codes to generate
   * @returns Array of tournament code strings
   *
   * @example
   * ```typescript
   * const codes = await tournamentV5.createTournamentCode(client, 'americas', 12345, {
   *   mapType: 'SUMMONERS_RIFT',
   *   pickType: 'TOURNAMENT_DRAFT',
   *   spectatorType: 'ALL',
   *   teamSize: 5,
   * }, { count: 3 });
   * ```
   */
  async createTournamentCode(
    client: WhisperClient,
    route: RegionalRoute,
    tournamentId: number,
    body: TournamentCodeParameters,
    options?: { count?: number },
  ): Promise<string[]> {
    const params: Record<string, string> = {
      tournamentId: String(tournamentId),
    };
    if (options?.count !== undefined) {
      params.count = String(options.count);
    }
    const response = await client.request<string[]>(
      route,
      '/lol/tournament/v5/codes',
      'tournament-v5.createTournamentCode',
      { method: 'POST', body: JSON.stringify(body), params },
    );
    return response.data;
  },

  /**
   * Get tournament code details.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param tournamentCode - Tournament code string
   * @returns Tournament code configuration details
   *
   * @example
   * ```typescript
   * const codeInfo = await tournamentV5.getTournamentCode(client, 'americas', 'NA1234-ABCD');
   * console.log(codeInfo.spectators, codeInfo.teamSize);
   * ```
   */
  async getTournamentCode(
    client: WhisperClient,
    route: RegionalRoute,
    tournamentCode: string,
  ): Promise<TournamentCodeV5> {
    const response = await client.request<TournamentCodeV5>(
      route,
      `/lol/tournament/v5/codes/${tournamentCode}`,
      'tournament-v5.getTournamentCode',
    );
    return response.data;
  },

  /**
   * Update a tournament code.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param tournamentCode - Tournament code string to update
   * @param body - Updated tournament code parameters
   * @returns Object with HTTP status code (204 on success)
   *
   * @example
   * ```typescript
   * const result = await tournamentV5.updateTournamentCode(client, 'americas', 'NA1234-ABCD', {
   *   mapType: 'HOWLING_ABYSS',
   *   pickType: 'ALL_RANDOM',
   *   spectatorType: 'NONE',
   * });
   * console.log(result.status); // 204
   * ```
   */
  async updateTournamentCode(
    client: WhisperClient,
    route: RegionalRoute,
    tournamentCode: string,
    body: TournamentCodeUpdateParameters,
  ): Promise<{ status: number }> {
    const response = await client.request<void>(
      route,
      `/lol/tournament/v5/codes/${tournamentCode}`,
      'tournament-v5.updateTournamentCode',
      { method: 'PUT', body: JSON.stringify(body) },
    );
    return { status: response.status };
  },

  /**
   * Get lobby events by tournament code.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param tournamentCode - Tournament code string
   * @returns Wrapper containing an array of lobby events
   *
   * @example
   * ```typescript
   * const events = await tournamentV5.getLobbyEventsByCode(client, 'americas', 'NA1234-ABCD');
   * for (const event of events.eventList) {
   *   console.log(event.eventType, event.puuid);
   * }
   * ```
   */
  async getLobbyEventsByCode(
    client: WhisperClient,
    route: RegionalRoute,
    tournamentCode: string,
  ): Promise<LobbyEventV5Wrapper> {
    const response = await client.request<LobbyEventV5Wrapper>(
      route,
      `/lol/tournament/v5/lobby-events/by-code/${tournamentCode}`,
      'tournament-v5.getLobbyEventsByCode',
    );
    return response.data;
  },
} as const;
