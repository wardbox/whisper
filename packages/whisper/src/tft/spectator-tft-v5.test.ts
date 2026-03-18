import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { spectatorTftV5 } from './spectator-tft-v5.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('spectatorTftV5', () => {
  describe('getCurrentGame', () => {
    it('returns unwrapped game data', async () => {
      const expected = {
        gameId: 12345,
        gameMode: 'TFT',
        participants: [],
        bannedChampions: [],
        gameLength: 300,
        gameQueueConfigId: 1100,
        gameStartTime: 1700000000000,
        gameType: 'MATCHED_GAME',
        mapId: 22,
        observers: { encryptionKey: 'key' },
        platformId: 'NA1',
      };
      const client = mockClient(expected);

      const result = await spectatorTftV5.getCurrentGame(client, 'na1', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await spectatorTftV5.getCurrentGame(client, 'euw1', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/spectator/tft/v5/active-games/by-puuid/my-puuid',
        'spectator-tft-v5.getCurrentGame',
      );
    });

    it('encodes puuid in path', async () => {
      const client = mockClient({});

      await spectatorTftV5.getCurrentGame(client, 'na1', 'puuid/with+special chars');

      expect(client.request).toHaveBeenCalledWith(
        'na1',
        '/lol/spectator/tft/v5/active-games/by-puuid/puuid%2Fwith%2Bspecial%20chars',
        'spectator-tft-v5.getCurrentGame',
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(spectatorTftV5.getCurrentGame(client, 'na1', 'puuid')).rejects.toThrow(
        'upstream failure',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      spectatorTftV5.getCurrentGame(client, 'americas', 'puuid');
    });
  });
});
