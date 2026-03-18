import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { tftLeagueV1 } from './tft-league-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('tftLeagueV1', () => {
  describe('getChallengerLeague', () => {
    it('returns unwrapped league data', async () => {
      const expected = {
        leagueId: 'uuid-1',
        entries: [],
        tier: 'CHALLENGER',
        name: 'Test League',
        queue: 'RANKED_TFT',
      };
      const client = mockClient(expected);

      const result = await tftLeagueV1.getChallengerLeague(client, 'na1');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ leagueId: '', entries: [], tier: '', name: '', queue: '' });

      await tftLeagueV1.getChallengerLeague(client, 'euw1');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/tft/league/v1/challenger',
        'tft-league-v1.getChallengerLeague',
        undefined,
      );
    });

    it('passes queue as query param when provided', async () => {
      const client = mockClient({ leagueId: '', entries: [], tier: '', name: '', queue: '' });

      await tftLeagueV1.getChallengerLeague(client, 'na1', { queue: 'RANKED_TFT_DOUBLE_UP' });

      expect(client.request).toHaveBeenCalledWith(
        'na1',
        '/tft/league/v1/challenger',
        'tft-league-v1.getChallengerLeague',
        { params: { queue: 'RANKED_TFT_DOUBLE_UP' } },
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
        queue: 'RANKED_TFT',
      };
      const client = mockClient(expected);

      const result = await tftLeagueV1.getGrandmasterLeague(client, 'kr');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ leagueId: '', entries: [], tier: '', name: '', queue: '' });

      await tftLeagueV1.getGrandmasterLeague(client, 'jp1');

      expect(client.request).toHaveBeenCalledWith(
        'jp1',
        '/tft/league/v1/grandmaster',
        'tft-league-v1.getGrandmasterLeague',
        undefined,
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
        queue: 'RANKED_TFT',
      };
      const client = mockClient(expected);

      const result = await tftLeagueV1.getMasterLeague(client, 'na1');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ leagueId: '', entries: [], tier: '', name: '', queue: '' });

      await tftLeagueV1.getMasterLeague(client, 'eun1');

      expect(client.request).toHaveBeenCalledWith(
        'eun1',
        '/tft/league/v1/master',
        'tft-league-v1.getMasterLeague',
        undefined,
      );
    });
  });

  describe('getLeagueEntriesByPuuid', () => {
    it('returns unwrapped entries', async () => {
      const expected = [
        {
          freshBlood: false,
          hotStreak: false,
          inactive: false,
          leaguePoints: 100,
          losses: 10,
          puuid: 'abc-123',
          rank: 'I',
          veteran: true,
          wins: 50,
          leagueId: 'uuid-1',
          queueType: 'RANKED_TFT',
          tier: 'DIAMOND',
        },
      ];
      const client = mockClient(expected);

      const result = await tftLeagueV1.getLeagueEntriesByPuuid(client, 'na1', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await tftLeagueV1.getLeagueEntriesByPuuid(client, 'euw1', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/tft/league/v1/by-puuid/my-puuid',
        'tft-league-v1.getLeagueEntriesByPuuid',
        undefined,
      );
    });

    it('passes queue as query param when provided', async () => {
      const client = mockClient([]);

      await tftLeagueV1.getLeagueEntriesByPuuid(client, 'na1', 'puuid-123', {
        queue: 'RANKED_TFT',
      });

      expect(client.request).toHaveBeenCalledWith(
        'na1',
        '/tft/league/v1/by-puuid/puuid-123',
        'tft-league-v1.getLeagueEntriesByPuuid',
        { params: { queue: 'RANKED_TFT' } },
      );
    });
  });

  describe('getLeagueEntries', () => {
    it('returns unwrapped entries', async () => {
      const client = mockClient([]);

      const result = await tftLeagueV1.getLeagueEntries(client, 'na1', 'DIAMOND', 'I');

      expect(result).toEqual([]);
    });

    it('calls client.request with correct path and methodId (no options)', async () => {
      const client = mockClient([]);

      await tftLeagueV1.getLeagueEntries(client, 'na1', 'GOLD', 'IV');

      expect(client.request).toHaveBeenCalledWith(
        'na1',
        '/tft/league/v1/entries/GOLD/IV',
        'tft-league-v1.getLeagueEntries',
        undefined,
      );
    });

    it('passes queue and page as query params when provided', async () => {
      const client = mockClient([]);

      await tftLeagueV1.getLeagueEntries(client, 'kr', 'PLATINUM', 'II', {
        queue: 'RANKED_TFT',
        page: 3,
      });

      expect(client.request).toHaveBeenCalledWith(
        'kr',
        '/tft/league/v1/entries/PLATINUM/II',
        'tft-league-v1.getLeagueEntries',
        { params: { queue: 'RANKED_TFT', page: '3' } },
      );
    });
  });

  describe('getLeagueById', () => {
    it('returns unwrapped league data', async () => {
      const expected = {
        leagueId: 'some-uuid',
        entries: [],
        tier: 'DIAMOND',
        name: 'Some League',
        queue: 'RANKED_TFT',
      };
      const client = mockClient(expected);

      const result = await tftLeagueV1.getLeagueById(client, 'na1', 'some-uuid');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ leagueId: '', entries: [], tier: '', name: '', queue: '' });

      await tftLeagueV1.getLeagueById(client, 'tr1', 'league-uuid');

      expect(client.request).toHaveBeenCalledWith(
        'tr1',
        '/tft/league/v1/leagues/league-uuid',
        'tft-league-v1.getLeagueById',
      );
    });
  });

  describe('getTopRatedLadder', () => {
    it('returns unwrapped ladder entries', async () => {
      const expected = [
        { puuid: 'p1', wins: 100 },
        { puuid: 'p2', wins: 95 },
      ];
      const client = mockClient(expected);

      const result = await tftLeagueV1.getTopRatedLadder(client, 'na1', 'RANKED_TFT_TURBO');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await tftLeagueV1.getTopRatedLadder(client, 'euw1', 'RANKED_TFT_DOUBLE_UP');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/tft/league/v1/rated-ladders/RANKED_TFT_DOUBLE_UP/top',
        'tft-league-v1.getTopRatedLadder',
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(tftLeagueV1.getChallengerLeague(client, 'na1')).rejects.toThrow(
        'upstream failure',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      tftLeagueV1.getChallengerLeague(client, 'americas');

      // @ts-expect-error -- regional route 'europe' must not be accepted by platform-only endpoint
      tftLeagueV1.getLeagueEntriesByPuuid(client, 'europe', 'puuid');

      // @ts-expect-error -- regional route 'asia' must not be accepted by platform-only endpoint
      tftLeagueV1.getLeagueEntries(client, 'asia', 'GOLD', 'I');
    });
  });
});
