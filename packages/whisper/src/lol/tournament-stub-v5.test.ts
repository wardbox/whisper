import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { tournamentStubV5 } from './tournament-stub-v5.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('tournamentStubV5', () => {
  describe('createProvider', () => {
    it('returns unwrapped provider ID', async () => {
      const client = mockClient(7);

      const result = await tournamentStubV5.createProvider(client, 'americas', {
        region: 'NA',
        url: 'https://example.com/callback',
      });

      expect(result).toBe(7);
    });

    it('calls client.request with POST and JSON body', async () => {
      const client = mockClient(1);
      const body = { region: 'EUW', url: 'https://example.com' };

      await tournamentStubV5.createProvider(client, 'europe', body);

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/tournament-stub/v5/providers',
        'tournament-stub-v5.createProvider',
        { method: 'POST', body: JSON.stringify(body) },
      );
    });
  });

  describe('createTournament', () => {
    it('returns unwrapped tournament ID', async () => {
      const client = mockClient(555);

      const result = await tournamentStubV5.createTournament(client, 'americas', {
        providerId: 7,
        name: 'Test Tournament',
      });

      expect(result).toBe(555);
    });

    it('calls client.request with POST and JSON body', async () => {
      const client = mockClient(1);
      const body = { providerId: 10 };

      await tournamentStubV5.createTournament(client, 'asia', body);

      expect(client.request).toHaveBeenCalledWith(
        'asia',
        '/lol/tournament-stub/v5/tournaments',
        'tournament-stub-v5.createTournament',
        { method: 'POST', body: JSON.stringify(body) },
      );
    });
  });

  describe('createTournamentCode', () => {
    it('returns unwrapped array of code strings', async () => {
      const expected = ['STUB-CODE1', 'STUB-CODE2'];
      const client = mockClient(expected);
      const body = {
        mapType: 'SUMMONERS_RIFT',
        pickType: 'TOURNAMENT_DRAFT',
        spectatorType: 'ALL',
        teamSize: 5,
      };

      const result = await tournamentStubV5.createTournamentCode(client, 'americas', 12345, body, {
        count: 2,
      });

      expect(result).toEqual(expected);
    });

    it('passes tournamentId and count as query params', async () => {
      const client = mockClient([]);
      const body = {
        mapType: 'SUMMONERS_RIFT',
        pickType: 'BLIND_PICK',
        spectatorType: 'NONE',
        teamSize: 5,
      };

      await tournamentStubV5.createTournamentCode(client, 'americas', 888, body, { count: 3 });

      expect(client.request).toHaveBeenCalledWith(
        'americas',
        '/lol/tournament-stub/v5/codes',
        'tournament-stub-v5.createTournamentCode',
        {
          method: 'POST',
          body: JSON.stringify(body),
          params: { tournamentId: '888', count: '3' },
        },
      );
    });

    it('omits count param when not provided', async () => {
      const client = mockClient([]);
      const body = {
        mapType: 'HOWLING_ABYSS',
        pickType: 'ALL_RANDOM',
        spectatorType: 'ALL',
        teamSize: 5,
      };

      await tournamentStubV5.createTournamentCode(client, 'europe', 100, body);

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/tournament-stub/v5/codes',
        'tournament-stub-v5.createTournamentCode',
        {
          method: 'POST',
          body: JSON.stringify(body),
          params: { tournamentId: '100' },
        },
      );
    });
  });

  describe('getLobbyEventsByCode', () => {
    it('returns unwrapped lobby events wrapper', async () => {
      const expected = {
        eventList: [
          { timestamp: '2024-01-01T00:00:00Z', eventType: 'PlayerJoinedGameEvent', puuid: 'xyz' },
        ],
      };
      const client = mockClient(expected);

      const result = await tournamentStubV5.getLobbyEventsByCode(client, 'americas', 'STUB-CODE1');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ eventList: [] });

      await tournamentStubV5.getLobbyEventsByCode(client, 'europe', 'EUW-STUB');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/tournament-stub/v5/lobby-events/by-code/EUW-STUB',
        'tournament-stub-v5.getLobbyEventsByCode',
      );
    });
  });

  describe('type safety', () => {
    it('rejects platform routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- platform route 'na1' must not be accepted by regional-only endpoint
      tournamentStubV5.createProvider(client, 'na1', { region: 'NA', url: 'https://example.com' });

      // @ts-expect-error -- platform route 'euw1' must not be accepted by regional-only endpoint
      tournamentStubV5.createTournament(client, 'euw1', { providerId: 1 });

      // @ts-expect-error -- platform route 'kr' must not be accepted by regional-only endpoint
      tournamentStubV5.getLobbyEventsByCode(client, 'kr', 'code');
    });
  });
});
