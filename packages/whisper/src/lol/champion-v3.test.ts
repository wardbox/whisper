import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { ChampionInfo } from '../types/generated/lol.js';
import { championV3 } from './champion-v3.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('championV3', () => {
  describe('getChampionRotations', () => {
    it('returns unwrapped champion rotation data', async () => {
      const expected: ChampionInfo = {
        freeChampionIds: [1, 2, 3, 4, 5],
        freeChampionIdsForNewPlayers: [10, 11, 12],
        maxNewPlayerLevel: 10,
      };
      const client = mockClient(expected);

      const result = await championV3.getChampionRotations(client, 'na1');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({
        freeChampionIds: [],
        freeChampionIdsForNewPlayers: [],
        maxNewPlayerLevel: 0,
      });

      await championV3.getChampionRotations(client, 'euw1');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/platform/v3/champion-rotations',
        'champion-v3.getChampionRotations',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      championV3.getChampionRotations(client, 'americas');
    });
  });
});
