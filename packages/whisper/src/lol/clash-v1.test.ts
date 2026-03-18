import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { Tournament } from '../types/generated/lol.js';
import type { ClashPlayer, ClashTeam } from '../types/overrides/lol-clash.js';
import { clashV1 } from './clash-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('clashV1', () => {
  describe('getPlayersByPuuid', () => {
    it('returns unwrapped player data', async () => {
      const expected: ClashPlayer[] = [
        { puuid: 'abc-123', teamId: 'team-1', position: 'MIDDLE', role: 'CAPTAIN' },
      ];
      const client = mockClient(expected);

      const result = await clashV1.getPlayersByPuuid(client, 'na1', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await clashV1.getPlayersByPuuid(client, 'euw1', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/clash/v1/players/by-puuid/my-puuid',
        'clash-v1.getPlayersByPuuid',
      );
    });
  });

  describe('getTournaments', () => {
    it('returns unwrapped tournament list', async () => {
      const expected: Tournament[] = [
        { id: 1, nameKey: 'test', nameKeySecondary: 'sec', schedule: [], themeId: 1 },
      ];
      const client = mockClient(expected);

      const result = await clashV1.getTournaments(client, 'na1');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await clashV1.getTournaments(client, 'kr');

      expect(client.request).toHaveBeenCalledWith(
        'kr',
        '/lol/clash/v1/tournaments',
        'clash-v1.getTournaments',
      );
    });
  });

  describe('getTournamentById', () => {
    it('returns unwrapped tournament data', async () => {
      const expected: Tournament = {
        id: 42,
        nameKey: 'test_tournament',
        nameKeySecondary: 'secondary',
        schedule: [{ cancelled: false, id: 1, registrationTime: 1000, startTime: 2000 }],
        themeId: 5,
      };
      const client = mockClient(expected);

      const result = await clashV1.getTournamentById(client, 'na1', '42');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await clashV1.getTournamentById(client, 'eun1', '99');

      expect(client.request).toHaveBeenCalledWith(
        'eun1',
        '/lol/clash/v1/tournaments/99',
        'clash-v1.getTournamentById',
      );
    });
  });

  describe('getTeamById', () => {
    it('returns unwrapped team data', async () => {
      const expected: ClashTeam = {
        id: 'team-abc',
        tournamentId: 1,
        name: 'Test Team',
        iconId: 1,
        tier: 1,
        captain: 'captain-puuid',
        abbreviation: 'TST',
        players: [{ puuid: 'p1', position: 'TOP', role: 'CAPTAIN' }],
      };
      const client = mockClient(expected);

      const result = await clashV1.getTeamById(client, 'na1', 'team-abc');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await clashV1.getTeamById(client, 'jp1', 'team-xyz');

      expect(client.request).toHaveBeenCalledWith(
        'jp1',
        '/lol/clash/v1/teams/team-xyz',
        'clash-v1.getTeamById',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      clashV1.getPlayersByPuuid(client, 'americas', 'puuid');

      // @ts-expect-error -- regional route 'europe' must not be accepted by platform-only endpoint
      clashV1.getTournaments(client, 'europe');

      // @ts-expect-error -- regional route 'asia' must not be accepted by platform-only endpoint
      clashV1.getTournamentById(client, 'asia', '1');

      // @ts-expect-error -- regional route 'sea' must not be accepted by platform-only endpoint
      clashV1.getTeamById(client, 'sea', 'team-1');
    });
  });
});
