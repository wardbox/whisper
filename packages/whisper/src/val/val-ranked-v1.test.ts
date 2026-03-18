import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { Leaderboard } from '../types/generated/val.js';
import { valRankedV1 } from './val-ranked-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('valRankedV1', () => {
  describe('getLeaderboard', () => {
    it('returns unwrapped leaderboard data', async () => {
      const expected: Leaderboard = {
        actId: 'act-123',
        players: [],
        query: '',
        shard: 'na',
        tierDetails: [],
        totalPlayers: 100,
      };
      const client = mockClient(expected);

      const result = await valRankedV1.getLeaderboard(client, 'na', 'act-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await valRankedV1.getLeaderboard(client, 'eu', 'act-456');

      expect(client.request).toHaveBeenCalledWith(
        'eu',
        '/val/ranked/v1/leaderboards/by-act/act-456',
        'val-ranked-v1.getLeaderboard',
        undefined,
      );
    });

    it('passes size and startIndex as query params', async () => {
      const client = mockClient({});

      await valRankedV1.getLeaderboard(client, 'na', 'act-123', { size: 50, startIndex: 100 });

      expect(client.request).toHaveBeenCalledWith(
        'na',
        '/val/ranked/v1/leaderboards/by-act/act-123',
        'val-ranked-v1.getLeaderboard',
        { params: { size: '50', startIndex: '100' } },
      );
    });

    it('does not pass params when options is not provided', async () => {
      const client = mockClient({});

      await valRankedV1.getLeaderboard(client, 'na', 'act-123');

      expect(client.request).toHaveBeenCalledWith(
        'na',
        '/val/ranked/v1/leaderboards/by-act/act-123',
        'val-ranked-v1.getLeaderboard',
        undefined,
      );
    });

    it('passes only provided options', async () => {
      const client = mockClient({});

      await valRankedV1.getLeaderboard(client, 'na', 'act-123', { size: 25 });

      expect(client.request).toHaveBeenCalledWith(
        'na',
        '/val/ranked/v1/leaderboards/by-act/act-123',
        'val-ranked-v1.getLeaderboard',
        { params: { size: '25' } },
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(valRankedV1.getLeaderboard(client, 'na', 'act-123')).rejects.toThrow(
        'upstream failure',
      );
    });
  });

  describe('type safety', () => {
    it('rejects PlatformRoute at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- PlatformRoute 'na1' must not be accepted by ValPlatformRoute endpoint
      valRankedV1.getLeaderboard(client, 'na1', 'act-123');
    });

    it('rejects RegionalRoute at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- RegionalRoute 'americas' must not be accepted by ValPlatformRoute endpoint
      valRankedV1.getLeaderboard(client, 'americas', 'act-123');
    });
  });
});
