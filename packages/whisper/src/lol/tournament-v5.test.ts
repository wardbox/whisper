import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { tournamentV5 } from './tournament-v5.js';

function mockClient(data: unknown, status = 200): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status, headers: {} }),
  };
}

describe('tournamentV5', () => {
  describe('createProvider', () => {
    it('returns unwrapped provider ID', async () => {
      const client = mockClient(42);

      const result = await tournamentV5.createProvider(client, 'americas', {
        region: 'NA',
        url: 'https://example.com/callback',
      });

      expect(result).toBe(42);
    });

    it('calls client.request with POST and JSON body', async () => {
      const client = mockClient(1);
      const body = { region: 'EUW', url: 'https://example.com' };

      await tournamentV5.createProvider(client, 'europe', body);

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/tournament/v5/providers',
        'tournament-v5.createProvider',
        { method: 'POST', body: JSON.stringify(body) },
      );
    });
  });

  describe('createTournament', () => {
    it('returns unwrapped tournament ID', async () => {
      const client = mockClient(999);

      const result = await tournamentV5.createTournament(client, 'americas', {
        providerId: 42,
        name: 'My Tournament',
      });

      expect(result).toBe(999);
    });

    it('calls client.request with POST and JSON body', async () => {
      const client = mockClient(1);
      const body = { providerId: 10 };

      await tournamentV5.createTournament(client, 'asia', body);

      expect(client.request).toHaveBeenCalledWith(
        'asia',
        '/lol/tournament/v5/tournaments',
        'tournament-v5.createTournament',
        { method: 'POST', body: JSON.stringify(body) },
      );
    });
  });

  describe('createTournamentCode', () => {
    it('returns unwrapped array of code strings', async () => {
      const expected = ['CODE1', 'CODE2', 'CODE3'];
      const client = mockClient(expected);
      const body = {
        mapType: 'SUMMONERS_RIFT',
        pickType: 'TOURNAMENT_DRAFT',
        spectatorType: 'ALL',
        teamSize: 5,
      };

      const result = await tournamentV5.createTournamentCode(client, 'americas', 12345, body, {
        count: 3,
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

      await tournamentV5.createTournamentCode(client, 'americas', 777, body, { count: 5 });

      expect(client.request).toHaveBeenCalledWith(
        'americas',
        '/lol/tournament/v5/codes',
        'tournament-v5.createTournamentCode',
        {
          method: 'POST',
          body: JSON.stringify(body),
          params: { tournamentId: '777', count: '5' },
        },
      );
    });

    it('omits count param when not provided', async () => {
      const client = mockClient([]);
      const body = {
        mapType: 'SUMMONERS_RIFT',
        pickType: 'DRAFT_MODE',
        spectatorType: 'ALL',
        teamSize: 5,
      };

      await tournamentV5.createTournamentCode(client, 'europe', 100, body);

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/tournament/v5/codes',
        'tournament-v5.createTournamentCode',
        {
          method: 'POST',
          body: JSON.stringify(body),
          params: { tournamentId: '100' },
        },
      );
    });
  });

  describe('getTournamentCode', () => {
    it('returns unwrapped tournament code data', async () => {
      const expected = {
        code: 'NA1234-ABCD',
        spectators: 'ALL',
        lobbyName: 'My Lobby',
        metaData: '',
        password: 'secret',
        id: 1,
        region: 'NA',
        map: 'SUMMONERS_RIFT',
        pickType: 'TOURNAMENT_DRAFT',
        teamSize: 5,
        participants: [],
      };
      const client = mockClient(expected);

      const result = await tournamentV5.getTournamentCode(client, 'americas', 'NA1234-ABCD');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await tournamentV5.getTournamentCode(client, 'europe', 'EUW-CODE');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/tournament/v5/codes/EUW-CODE',
        'tournament-v5.getTournamentCode',
      );
    });
  });

  describe('updateTournamentCode', () => {
    it('returns status object for 204 response', async () => {
      const client = mockClient(undefined, 204);
      const body = {
        mapType: 'HOWLING_ABYSS',
        pickType: 'ALL_RANDOM',
        spectatorType: 'NONE',
      };

      const result = await tournamentV5.updateTournamentCode(
        client,
        'americas',
        'NA1234-ABCD',
        body,
      );

      expect(result).toEqual({ status: 204 });
    });

    it('calls client.request with PUT and JSON body', async () => {
      const client = mockClient(undefined, 204);
      const body = {
        mapType: 'SUMMONERS_RIFT',
        pickType: 'DRAFT_MODE',
        spectatorType: 'LOBBYONLY',
      };

      await tournamentV5.updateTournamentCode(client, 'asia', 'KR-CODE', body);

      expect(client.request).toHaveBeenCalledWith(
        'asia',
        '/lol/tournament/v5/codes/KR-CODE',
        'tournament-v5.updateTournamentCode',
        { method: 'PUT', body: JSON.stringify(body) },
      );
    });
  });

  describe('getLobbyEventsByCode', () => {
    it('returns unwrapped lobby events wrapper', async () => {
      const expected = {
        eventList: [
          { timestamp: '2024-01-01T00:00:00Z', eventType: 'PlayerJoinedGameEvent', puuid: 'abc' },
        ],
      };
      const client = mockClient(expected);

      const result = await tournamentV5.getLobbyEventsByCode(client, 'americas', 'NA1234-ABCD');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ eventList: [] });

      await tournamentV5.getLobbyEventsByCode(client, 'europe', 'EUW-CODE');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/tournament/v5/lobby-events/by-code/EUW-CODE',
        'tournament-v5.getLobbyEventsByCode',
      );
    });
  });

  describe('type safety', () => {
    it('rejects platform routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- platform route 'na1' must not be accepted by regional-only endpoint
      tournamentV5.createProvider(client, 'na1', { region: 'NA', url: 'https://example.com' });

      // @ts-expect-error -- platform route 'euw1' must not be accepted by regional-only endpoint
      tournamentV5.getTournamentCode(client, 'euw1', 'code');

      // @ts-expect-error -- platform route 'kr' must not be accepted by regional-only endpoint
      tournamentV5.getLobbyEventsByCode(client, 'kr', 'code');
    });
  });
});
