import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { leagueExpV4 } from './league-exp-v4.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('leagueExpV4', () => {
  describe('getEntries', () => {
    it('returns unwrapped entries', async () => {
      const client = mockClient([]);

      const result = await leagueExpV4.getEntries(client, 'na1', 'RANKED_SOLO_5x5', 'DIAMOND', 'I');

      expect(result).toEqual([]);
    });

    it('calls client.request with correct path and methodId (no options)', async () => {
      const client = mockClient([]);

      await leagueExpV4.getEntries(client, 'euw1', 'RANKED_SOLO_5x5', 'GOLD', 'IV');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/league-exp/v4/entries/RANKED_SOLO_5x5/GOLD/IV',
        'league-exp-v4.getEntries',
        undefined,
      );
    });

    it('passes page as query param when provided', async () => {
      const client = mockClient([]);

      await leagueExpV4.getEntries(client, 'kr', 'RANKED_SOLO_5x5', 'PLATINUM', 'II', {
        page: 5,
      });

      expect(client.request).toHaveBeenCalledWith(
        'kr',
        '/lol/league-exp/v4/entries/RANKED_SOLO_5x5/PLATINUM/II',
        'league-exp-v4.getEntries',
        { params: { page: '5' } },
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('boom');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(
        leagueExpV4.getEntries(client, 'na1', 'RANKED_SOLO_5x5', 'GOLD', 'I'),
      ).rejects.toThrow('boom');
    });
  });

  describe('edge cases', () => {
    it('encodes path segments with special characters', async () => {
      const client = mockClient([]);

      await leagueExpV4.getEntries(client, 'na1', 'RANKED SOLO', 'GOLD+', 'I/II');

      expect(client.request).toHaveBeenCalledWith(
        'na1',
        '/lol/league-exp/v4/entries/RANKED%20SOLO/GOLD%2B/I%2FII',
        'league-exp-v4.getEntries',
        undefined,
      );
    });

    it('omits params when page is undefined', async () => {
      const client = mockClient([]);

      await leagueExpV4.getEntries(client, 'kr', 'RANKED_SOLO_5x5', 'PLATINUM', 'II', {
        page: undefined,
      });

      expect(client.request).toHaveBeenCalledWith(
        'kr',
        '/lol/league-exp/v4/entries/RANKED_SOLO_5x5/PLATINUM/II',
        'league-exp-v4.getEntries',
        undefined,
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      leagueExpV4.getEntries(client, 'americas', 'RANKED_SOLO_5x5', 'GOLD', 'I');
    });
  });
});
