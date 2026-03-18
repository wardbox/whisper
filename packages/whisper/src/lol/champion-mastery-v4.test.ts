import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { ChampionMastery } from '../types/generated/lol.js';
import { championMasteryV4 } from './champion-mastery-v4.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('championMasteryV4', () => {
  describe('getByPuuid', () => {
    it('returns unwrapped array of champion mastery data', async () => {
      const expected: ChampionMastery[] = [
        {
          championId: 236,
          championLevel: 7,
          championPoints: 125000,
          championPointsSinceLastLevel: 100000,
          championPointsUntilNextLevel: 0,
          championSeasonMilestone: 1,
          lastPlayTime: 1700000000000,
          markRequiredForNextLevel: 0,
          nextSeasonMilestone: {
            bonus: false,
            requireGradeCounts: {},
            rewardMarks: 0,
            totalGamesRequires: 0,
          },
          puuid: 'abc-123',
          tokensEarned: 0,
        },
      ];
      const client = mockClient(expected);

      const result = await championMasteryV4.getByPuuid(client, 'na1', 'abc-123');

      expect(result).toEqual(expected);
      expect(Array.isArray(result)).toBe(true);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await championMasteryV4.getByPuuid(client, 'euw1', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/champion-mastery/v4/champion-masteries/by-puuid/my-puuid',
        'champion-mastery-v4.getByPuuid',
      );
    });
  });

  describe('getTopByPuuid', () => {
    it('returns top champion masteries', async () => {
      const expected: ChampionMastery[] = [];
      const client = mockClient(expected);

      const result = await championMasteryV4.getTopByPuuid(client, 'na1', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request without params when no options', async () => {
      const client = mockClient([]);

      await championMasteryV4.getTopByPuuid(client, 'kr', 'puuid-1');

      expect(client.request).toHaveBeenCalledWith(
        'kr',
        '/lol/champion-mastery/v4/champion-masteries/by-puuid/puuid-1/top',
        'champion-mastery-v4.getTopByPuuid',
        undefined,
      );
    });

    it('passes count as query param when provided', async () => {
      const client = mockClient([]);

      await championMasteryV4.getTopByPuuid(client, 'na1', 'puuid-1', { count: 5 });

      expect(client.request).toHaveBeenCalledWith(
        'na1',
        '/lol/champion-mastery/v4/champion-masteries/by-puuid/puuid-1/top',
        'champion-mastery-v4.getTopByPuuid',
        { params: { count: '5' } },
      );
    });
  });

  describe('getByPuuidByChampion', () => {
    it('returns single champion mastery entry', async () => {
      const expected: Partial<ChampionMastery> = {
        championId: 236,
        championLevel: 7,
        championPoints: 125000,
      };
      const client = mockClient(expected);

      const result = await championMasteryV4.getByPuuidByChampion(client, 'na1', 'abc-123', 236);

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path including championId', async () => {
      const client = mockClient({});

      await championMasteryV4.getByPuuidByChampion(client, 'eun1', 'some-puuid', 99);

      expect(client.request).toHaveBeenCalledWith(
        'eun1',
        '/lol/champion-mastery/v4/champion-masteries/by-puuid/some-puuid/by-champion/99',
        'champion-mastery-v4.getByPuuidByChampion',
      );
    });
  });

  describe('getScoresByPuuid', () => {
    it('returns total mastery score as number', async () => {
      const client = mockClient(342);

      const result = await championMasteryV4.getScoresByPuuid(client, 'na1', 'abc-123');

      expect(result).toBe(342);
      expect(typeof result).toBe('number');
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient(0);

      await championMasteryV4.getScoresByPuuid(client, 'jp1', 'puuid-2');

      expect(client.request).toHaveBeenCalledWith(
        'jp1',
        '/lol/champion-mastery/v4/scores/by-puuid/puuid-2',
        'champion-mastery-v4.getScoresByPuuid',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      championMasteryV4.getByPuuid(client, 'americas', 'puuid');

      // @ts-expect-error -- regional route 'europe' must not be accepted by platform-only endpoint
      championMasteryV4.getTopByPuuid(client, 'europe', 'puuid');

      // @ts-expect-error -- regional route 'asia' must not be accepted by platform-only endpoint
      championMasteryV4.getByPuuidByChampion(client, 'asia', 'puuid', 1);

      // @ts-expect-error -- regional route 'sea' must not be accepted by platform-only endpoint
      championMasteryV4.getScoresByPuuid(client, 'sea', 'puuid');
    });
  });
});
