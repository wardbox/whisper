import type { WhisperClient } from '../core/client.js';
import type {
  LobbyEventV5Wrapper,
  ProviderRegistrationParameters,
  TournamentCodeParameters,
  TournamentRegistrationParameters,
} from '../types/overrides/lol-tournament.js';
import type { RegionalRoute } from '../types/regional.js';

/**
 * LoL Tournament Stub API (v5).
 *
 * Testing variant of the Tournament API. Provides the same interface as
 * tournament-v5 for a subset of operations, but does not require a
 * tournament API key. Use this for development and testing.
 *
 * All methods require a {@link RegionalRoute} (americas, europe, asia, sea).
 *
 * @example
 * ```typescript
 * import { tournamentStubV5 } from '@wardbox/whisper/lol';
 *
 * const providerId = await tournamentStubV5.createProvider(client, 'americas', {
 *   region: 'NA',
 *   url: 'https://example.com/callback',
 * });
 * ```
 */
export const tournamentStubV5 = {
  /**
   * Register a tournament provider (stub/testing).
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param body - Provider registration parameters (region and callback URL)
   * @returns Provider ID (number)
   *
   * @example
   * ```typescript
   * const providerId = await tournamentStubV5.createProvider(client, 'americas', {
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
      '/lol/tournament-stub/v5/providers',
      'tournament-stub-v5.createProvider',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return response.data;
  },

  /**
   * Register a tournament (stub/testing).
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param body - Tournament registration parameters (providerId and optional name)
   * @returns Tournament ID (number)
   *
   * @example
   * ```typescript
   * const tournamentId = await tournamentStubV5.createTournament(client, 'americas', {
   *   providerId: 123,
   *   name: 'Test Tournament',
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
      '/lol/tournament-stub/v5/tournaments',
      'tournament-stub-v5.createTournament',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return response.data;
  },

  /**
   * Create tournament codes (stub/testing).
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
   * const codes = await tournamentStubV5.createTournamentCode(client, 'americas', 12345, {
   *   mapType: 'SUMMONERS_RIFT',
   *   pickType: 'TOURNAMENT_DRAFT',
   *   spectatorType: 'ALL',
   *   teamSize: 5,
   * });
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
      '/lol/tournament-stub/v5/codes',
      'tournament-stub-v5.createTournamentCode',
      { method: 'POST', body: JSON.stringify(body), params },
    );
    return response.data;
  },

  /**
   * Get lobby events by tournament code (stub/testing).
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'europe')
   * @param tournamentCode - Tournament code string
   * @returns Wrapper containing an array of lobby events
   *
   * @example
   * ```typescript
   * const events = await tournamentStubV5.getLobbyEventsByCode(client, 'americas', 'NA1234-ABCD');
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
      `/lol/tournament-stub/v5/lobby-events/by-code/${encodeURIComponent(tournamentCode)}`,
      'tournament-stub-v5.getLobbyEventsByCode',
    );
    return response.data;
  },
} as const;
