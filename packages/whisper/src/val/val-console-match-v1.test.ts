import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { Matchlist, RecentMatches, ValMatch } from '../types/generated/val.js';
import { valConsoleMatchV1 } from './val-console-match-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('valConsoleMatchV1', () => {
  describe('getMatch', () => {
    it('returns unwrapped match data', async () => {
      const expected = { matchInfo: {}, players: [], roundResults: [], teams: [], coaches: [] } as unknown as ValMatch;
      const client = mockClient(expected);

      const result = await valConsoleMatchV1.getMatch(client, 'na', 'match-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct console path and methodId', async () => {
      const client = mockClient({});

      await valConsoleMatchV1.getMatch(client, 'eu', 'match-456');

      expect(client.request).toHaveBeenCalledWith(
        'eu',
        '/val/match/console/v1/matches/match-456',
        'val-console-match-v1.getMatch',
      );
    });
  });

  describe('getMatchlist', () => {
    it('returns unwrapped matchlist data', async () => {
      const expected: Matchlist = { history: [], puuid: 'puuid-123' };
      const client = mockClient(expected);

      const result = await valConsoleMatchV1.getMatchlist(client, 'na', 'puuid-123', 'playstation');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and platformType query param', async () => {
      const client = mockClient({});

      await valConsoleMatchV1.getMatchlist(client, 'ap', 'puuid-789', 'playstation');

      expect(client.request).toHaveBeenCalledWith(
        'ap',
        '/val/match/console/v1/matchlists/by-puuid/puuid-789',
        'val-console-match-v1.getMatchlist',
        { params: { platformType: 'playstation' } },
      );
    });

    it('passes xbox as platformType', async () => {
      const client = mockClient({});

      await valConsoleMatchV1.getMatchlist(client, 'na', 'puuid-123', 'xbox');

      expect(client.request).toHaveBeenCalledWith(
        'na',
        '/val/match/console/v1/matchlists/by-puuid/puuid-123',
        'val-console-match-v1.getMatchlist',
        { params: { platformType: 'xbox' } },
      );
    });
  });

  describe('getRecentMatches', () => {
    it('returns unwrapped recent matches data', async () => {
      const expected: RecentMatches = { currentTime: 1234567890, matchIds: ['m1', 'm2'] };
      const client = mockClient(expected);

      const result = await valConsoleMatchV1.getRecentMatches(client, 'na', 'competitive');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct console path and methodId', async () => {
      const client = mockClient({});

      await valConsoleMatchV1.getRecentMatches(client, 'kr', 'unrated');

      expect(client.request).toHaveBeenCalledWith(
        'kr',
        '/val/match/console/v1/recent-matches/by-queue/unrated',
        'val-console-match-v1.getRecentMatches',
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(valConsoleMatchV1.getMatch(client, 'na', 'match-123')).rejects.toThrow('upstream failure');
    });
  });

  describe('type safety', () => {
    it('rejects PlatformRoute at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- PlatformRoute 'na1' must not be accepted by ValPlatformRoute endpoint
      valConsoleMatchV1.getMatch(client, 'na1', 'match-123');
    });

    it('rejects RegionalRoute at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- RegionalRoute 'americas' must not be accepted by ValPlatformRoute endpoint
      valConsoleMatchV1.getMatch(client, 'americas', 'match-123');
    });
  });
});
