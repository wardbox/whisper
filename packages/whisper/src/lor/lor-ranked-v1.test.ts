import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { LorLeaderboard } from '../types/generated/lor.js';
import { lorRankedV1 } from './lor-ranked-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('lorRankedV1', () => {
  describe('getLeaderboards', () => {
    it('returns unwrapped leaderboard data', async () => {
      const expected: LorLeaderboard = {
        players: [
          { lp: 1200, name: 'Player1', rank: 1 },
          { lp: 1100, name: 'Player2', rank: 2 },
        ],
      };
      const client = mockClient(expected);

      const result = await lorRankedV1.getLeaderboards(client, 'americas');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ players: [] });

      await lorRankedV1.getLeaderboards(client, 'europe');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lor/ranked/v1/leaderboards',
        'lor-ranked-v1.getLeaderboards',
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(lorRankedV1.getLeaderboards(client, 'americas')).rejects.toThrow(
        'upstream failure',
      );
    });
  });

  describe('type safety', () => {
    it('rejects platform routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- platform route 'na1' must not be accepted by regional-only endpoint
      lorRankedV1.getLeaderboards(client, 'na1');
    });
  });
});
