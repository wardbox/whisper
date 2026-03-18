import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { tftMatchV1 } from './tft-match-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('tftMatchV1', () => {
  describe('getMatchIdsByPuuid', () => {
    it('returns unwrapped match ID array', async () => {
      const expected = ['NA1_111', 'NA1_222', 'NA1_333'];
      const client = mockClient(expected);

      const result = await tftMatchV1.getMatchIdsByPuuid(client, 'americas', 'puuid-abc');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await tftMatchV1.getMatchIdsByPuuid(client, 'europe', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/tft/match/v1/matches/by-puuid/my-puuid/ids',
        'tft-match-v1.getMatchIdsByPuuid',
        undefined,
      );
    });

    it('passes query params when options are provided', async () => {
      const client = mockClient([]);

      await tftMatchV1.getMatchIdsByPuuid(client, 'americas', 'puuid-123', {
        count: 10,
        start: 5,
        startTime: 1000000,
        endTime: 2000000,
      });

      expect(client.request).toHaveBeenCalledWith(
        'americas',
        '/tft/match/v1/matches/by-puuid/puuid-123/ids',
        'tft-match-v1.getMatchIdsByPuuid',
        {
          params: {
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

      await tftMatchV1.getMatchIdsByPuuid(client, 'asia', 'puuid-xyz', {
        count: 5,
      });

      expect(client.request).toHaveBeenCalledWith(
        'asia',
        '/tft/match/v1/matches/by-puuid/puuid-xyz/ids',
        'tft-match-v1.getMatchIdsByPuuid',
        { params: { count: '5' } },
      );
    });
  });

  describe('getMatch', () => {
    it('returns unwrapped match data', async () => {
      const expected = { metadata: { match_id: 'NA1_111' }, info: {} };
      const client = mockClient(expected);

      const result = await tftMatchV1.getMatch(client, 'americas', 'NA1_111');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await tftMatchV1.getMatch(client, 'europe', 'EUW1_999');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/tft/match/v1/matches/EUW1_999',
        'tft-match-v1.getMatch',
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(tftMatchV1.getMatch(client, 'americas', 'NA1_111')).rejects.toThrow(
        'upstream failure',
      );
    });
  });

  describe('type safety', () => {
    it('rejects platform routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- platform route 'na1' must not be accepted by regional-only endpoint
      tftMatchV1.getMatchIdsByPuuid(client, 'na1', 'puuid');

      // @ts-expect-error -- platform route 'euw1' must not be accepted by regional-only endpoint
      tftMatchV1.getMatch(client, 'euw1', 'match-id');
    });
  });
});
