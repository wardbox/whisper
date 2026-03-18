import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { matchV5 } from './match-v5.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('matchV5', () => {
  describe('getMatchIdsByPuuid', () => {
    it('returns unwrapped match ID array', async () => {
      const expected = ['NA1_111', 'NA1_222', 'NA1_333'];
      const client = mockClient(expected);

      const result = await matchV5.getMatchIdsByPuuid(client, 'americas', 'puuid-abc');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await matchV5.getMatchIdsByPuuid(client, 'europe', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/match/v5/matches/by-puuid/my-puuid/ids',
        'match-v5.getMatchIdsByPuuid',
        undefined,
      );
    });

    it('passes query params when options are provided', async () => {
      const client = mockClient([]);

      await matchV5.getMatchIdsByPuuid(client, 'americas', 'puuid-123', {
        queue: 420,
        type: 'ranked',
        count: 10,
        start: 5,
        startTime: 1000000,
        endTime: 2000000,
      });

      expect(client.request).toHaveBeenCalledWith(
        'americas',
        '/lol/match/v5/matches/by-puuid/puuid-123/ids',
        'match-v5.getMatchIdsByPuuid',
        {
          params: {
            queue: '420',
            type: 'ranked',
            count: '10',
            start: '5',
            startTime: '1000000',
            endTime: '2000000',
          },
        },
      );
    });

    it('omits undefined options from params', async () => {
      const client = mockClient([]);

      await matchV5.getMatchIdsByPuuid(client, 'asia', 'puuid-xyz', {
        count: 5,
      });

      expect(client.request).toHaveBeenCalledWith(
        'asia',
        '/lol/match/v5/matches/by-puuid/puuid-xyz/ids',
        'match-v5.getMatchIdsByPuuid',
        { params: { count: '5' } },
      );
    });
  });

  describe('getMatch', () => {
    it('returns unwrapped match data', async () => {
      const expected = { metadata: { matchId: 'NA1_111' }, info: {} };
      const client = mockClient(expected);

      const result = await matchV5.getMatch(client, 'americas', 'NA1_111');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await matchV5.getMatch(client, 'europe', 'EUW1_999');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/match/v5/matches/EUW1_999',
        'match-v5.getMatch',
      );
    });
  });

  describe('getMatchTimeline', () => {
    it('returns unwrapped timeline data', async () => {
      const expected = { metadata: { matchId: 'NA1_111' }, info: { frames: [] } };
      const client = mockClient(expected);

      const result = await matchV5.getMatchTimeline(client, 'americas', 'NA1_111');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await matchV5.getMatchTimeline(client, 'asia', 'KR_555');

      expect(client.request).toHaveBeenCalledWith(
        'asia',
        '/lol/match/v5/matches/KR_555/timeline',
        'match-v5.getMatchTimeline',
      );
    });
  });

  describe('type safety', () => {
    it('rejects platform routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- platform route 'na1' must not be accepted by regional-only endpoint
      matchV5.getMatchIdsByPuuid(client, 'na1', 'puuid');

      // @ts-expect-error -- platform route 'euw1' must not be accepted by regional-only endpoint
      matchV5.getMatch(client, 'euw1', 'match-id');

      // @ts-expect-error -- platform route 'kr' must not be accepted by regional-only endpoint
      matchV5.getMatchTimeline(client, 'kr', 'match-id');
    });
  });
});
