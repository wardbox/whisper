import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { Leaderboard } from '../types/generated/val.js';
import { valConsoleRankedV1 } from './val-console-ranked-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('valConsoleRankedV1', () => {
  describe('getLeaderboard', () => {
    it('returns unwrapped leaderboard data', async () => {
      const expected: Leaderboard = {
        actId: 'act-123',
        players: [],
        query: '',
        shard: 'na',
        tierDetails: [],
        totalPlayers: 50,
      };
      const client = mockClient(expected);

      const result = await valConsoleRankedV1.getLeaderboard(client, 'na', 'act-123', 'playstation');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct console path and methodId', async () => {
      const client = mockClient({});

      await valConsoleRankedV1.getLeaderboard(client, 'eu', 'act-456', 'xbox');

      expect(client.request).toHaveBeenCalledWith(
        'eu',
        '/val/console/ranked/v1/leaderboards/by-act/act-456',
        'val-console-ranked-v1.getLeaderboard',
        { params: { platformType: 'xbox' } },
      );
    });

    it('always passes platformType as query param', async () => {
      const client = mockClient({});

      await valConsoleRankedV1.getLeaderboard(client, 'na', 'act-123', 'playstation');

      expect(client.request).toHaveBeenCalledWith(
        'na',
        '/val/console/ranked/v1/leaderboards/by-act/act-123',
        'val-console-ranked-v1.getLeaderboard',
        { params: { platformType: 'playstation' } },
      );
    });

    it('passes size and startIndex along with platformType', async () => {
      const client = mockClient({});

      await valConsoleRankedV1.getLeaderboard(client, 'na', 'act-123', 'playstation', {
        size: 50,
        startIndex: 100,
      });

      expect(client.request).toHaveBeenCalledWith(
        'na',
        '/val/console/ranked/v1/leaderboards/by-act/act-123',
        'val-console-ranked-v1.getLeaderboard',
        { params: { platformType: 'playstation', size: '50', startIndex: '100' } },
      );
    });

    it('passes only provided options with platformType', async () => {
      const client = mockClient({});

      await valConsoleRankedV1.getLeaderboard(client, 'na', 'act-123', 'xbox', { size: 25 });

      expect(client.request).toHaveBeenCalledWith(
        'na',
        '/val/console/ranked/v1/leaderboards/by-act/act-123',
        'val-console-ranked-v1.getLeaderboard',
        { params: { platformType: 'xbox', size: '25' } },
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(valConsoleRankedV1.getLeaderboard(client, 'na', 'act-123', 'playstation')).rejects.toThrow(
        'upstream failure',
      );
    });
  });

  describe('type safety', () => {
    it('rejects PlatformRoute at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- PlatformRoute 'na1' must not be accepted by ValPlatformRoute endpoint
      valConsoleRankedV1.getLeaderboard(client, 'na1', 'act-123', 'playstation');
    });

    it('rejects RegionalRoute at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- RegionalRoute 'americas' must not be accepted by ValPlatformRoute endpoint
      valConsoleRankedV1.getLeaderboard(client, 'americas', 'act-123', 'playstation');
    });
  });
});
