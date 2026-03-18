import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { leagueV4 } from './league-v4.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('leagueV4', () => {
  describe('getChallengerLeague', () => {
    it('returns unwrapped league data', async () => {
      const expected = {
        leagueId: 'uuid-1',
        entries: [],
        tier: 'CHALLENGER',
        name: 'Test League',
        queue: 'RANKED_SOLO_5x5',
      };
      const client = mockClient(expected);

      const result = await leagueV4.getChallengerLeague(client, 'na1', 'RANKED_SOLO_5x5');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ leagueId: '', entries: [], tier: '', name: '', queue: '' });

      await leagueV4.getChallengerLeague(client, 'euw1', 'RANKED_SOLO_5x5');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5',
        'league-v4.getChallengerLeague',
      );
    });
  });

  describe('getGrandmasterLeague', () => {
    it('returns unwrapped league data', async () => {
      const expected = {
        leagueId: 'uuid-2',
        entries: [],
        tier: 'GRANDMASTER',
        name: 'GM League',
        queue: 'RANKED_SOLO_5x5',
      };
      const client = mockClient(expected);

      const result = await leagueV4.getGrandmasterLeague(client, 'kr', 'RANKED_SOLO_5x5');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ leagueId: '', entries: [], tier: '', name: '', queue: '' });

      await leagueV4.getGrandmasterLeague(client, 'jp1', 'RANKED_SOLO_5x5');

      expect(client.request).toHaveBeenCalledWith(
        'jp1',
        '/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5',
        'league-v4.getGrandmasterLeague',
      );
    });
  });

  describe('getMasterLeague', () => {
    it('returns unwrapped league data', async () => {
      const expected = {
        leagueId: 'uuid-3',
        entries: [],
        tier: 'MASTER',
        name: 'Master League',
        queue: 'RANKED_SOLO_5x5',
      };
      const client = mockClient(expected);

      const result = await leagueV4.getMasterLeague(client, 'na1', 'RANKED_SOLO_5x5');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ leagueId: '', entries: [], tier: '', name: '', queue: '' });

      await leagueV4.getMasterLeague(client, 'eun1', 'RANKED_SOLO_5x5');

      expect(client.request).toHaveBeenCalledWith(
        'eun1',
        '/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5',
        'league-v4.getMasterLeague',
      );
    });
  });

  describe('getEntriesByPuuid', () => {
    it('returns unwrapped entries', async () => {
      const expected = [
        {
          freshBlood: false,
          hotStreak: false,
          inactive: false,
          leagueId: 'uuid-1',
          leaguePoints: 100,
          losses: 10,
          puuid: 'abc-123',
          queueType: 'RANKED_SOLO_5x5',
          rank: 'I',
          tier: 'DIAMOND',
          veteran: true,
          wins: 50,
        },
      ];
      const client = mockClient(expected);

      const result = await leagueV4.getEntriesByPuuid(client, 'na1', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await leagueV4.getEntriesByPuuid(client, 'euw1', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/league/v4/entries/by-puuid/my-puuid',
        'league-v4.getEntriesByPuuid',
      );
    });
  });

  describe('getEntries', () => {
    it('returns unwrapped entries', async () => {
      const client = mockClient([]);

      const result = await leagueV4.getEntries(client, 'na1', 'RANKED_SOLO_5x5', 'DIAMOND', 'I');

      expect(result).toEqual([]);
    });

    it('calls client.request with correct path and methodId (no options)', async () => {
      const client = mockClient([]);

      await leagueV4.getEntries(client, 'na1', 'RANKED_SOLO_5x5', 'GOLD', 'IV');

      expect(client.request).toHaveBeenCalledWith(
        'na1',
        '/lol/league/v4/entries/RANKED_SOLO_5x5/GOLD/IV',
        'league-v4.getEntries',
        undefined,
      );
    });

    it('passes page as query param when provided', async () => {
      const client = mockClient([]);

      await leagueV4.getEntries(client, 'kr', 'RANKED_SOLO_5x5', 'PLATINUM', 'II', { page: 3 });

      expect(client.request).toHaveBeenCalledWith(
        'kr',
        '/lol/league/v4/entries/RANKED_SOLO_5x5/PLATINUM/II',
        'league-v4.getEntries',
        { params: { page: '3' } },
      );
    });
  });

  describe('getById', () => {
    it('returns unwrapped league data', async () => {
      const expected = {
        leagueId: 'some-uuid',
        entries: [],
        tier: 'DIAMOND',
        name: 'Some League',
        queue: 'RANKED_SOLO_5x5',
      };
      const client = mockClient(expected);

      const result = await leagueV4.getById(client, 'na1', 'some-uuid');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ leagueId: '', entries: [], tier: '', name: '', queue: '' });

      await leagueV4.getById(client, 'tr1', 'league-uuid');

      expect(client.request).toHaveBeenCalledWith(
        'tr1',
        '/lol/league/v4/leagues/league-uuid',
        'league-v4.getById',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      leagueV4.getChallengerLeague(client, 'americas', 'RANKED_SOLO_5x5');

      // @ts-expect-error -- regional route 'europe' must not be accepted by platform-only endpoint
      leagueV4.getEntriesByPuuid(client, 'europe', 'puuid');

      // @ts-expect-error -- regional route 'asia' must not be accepted by platform-only endpoint
      leagueV4.getEntries(client, 'asia', 'RANKED_SOLO_5x5', 'GOLD', 'I');
    });
  });
});
