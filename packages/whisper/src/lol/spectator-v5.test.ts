import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { LolCurrentGameInfo } from '../types/generated/lol.js';
import type { FeaturedGames } from '../types/overrides/lol-spectator.js';
import { spectatorV5 } from './spectator-v5.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('spectatorV5', () => {
  describe('getCurrentGame', () => {
    it('returns unwrapped current game data', async () => {
      const expected: Partial<LolCurrentGameInfo> = {
        gameId: 123456,
        gameMode: 'CLASSIC',
        gameType: 'MATCHED_GAME',
        mapId: 11,
        platformId: 'NA1',
      };
      const client = mockClient(expected);

      const result = await spectatorV5.getCurrentGame(client, 'na1', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await spectatorV5.getCurrentGame(client, 'euw1', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/spectator/v5/active-games/by-summoner/my-puuid',
        'spectator-v5.getCurrentGame',
      );
    });
  });

  describe('getFeaturedGames', () => {
    it('returns unwrapped featured games data', async () => {
      const expected: FeaturedGames = {
        gameList: [
          {
            bannedChampions: [],
            gameId: 789,
            gameLength: 300,
            gameMode: 'CLASSIC',
            gameQueueConfigId: 420,
            gameStartTime: 1700000000000,
            gameType: 'MATCHED_GAME',
            mapId: 11,
            observers: { encryptionKey: 'key123' },
            participants: [],
            platformId: 'NA1',
          },
        ],
        clientRefreshInterval: 300,
      };
      const client = mockClient(expected);

      const result = await spectatorV5.getFeaturedGames(client, 'na1');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ gameList: [], clientRefreshInterval: 0 });

      await spectatorV5.getFeaturedGames(client, 'kr');

      expect(client.request).toHaveBeenCalledWith(
        'kr',
        '/lol/spectator/v5/featured-games',
        'spectator-v5.getFeaturedGames',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      spectatorV5.getCurrentGame(client, 'americas', 'puuid');

      // @ts-expect-error -- regional route 'europe' must not be accepted by platform-only endpoint
      spectatorV5.getFeaturedGames(client, 'europe');
    });
  });
});
