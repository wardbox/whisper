import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { lolChallengesV1 } from './lol-challenges-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('lolChallengesV1', () => {
  describe('getConfig', () => {
    it('returns unwrapped config array', async () => {
      const expected = [
        { id: 1, leaderboard: true, localizedNames: {}, state: 'ENABLED', thresholds: {} },
      ];
      const client = mockClient(expected);

      const result = await lolChallengesV1.getConfig(client, 'na1');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await lolChallengesV1.getConfig(client, 'euw1');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/challenges/v1/challenges/config',
        'lol-challenges-v1.getConfig',
      );
    });
  });

  describe('getPercentiles', () => {
    it('returns unwrapped percentiles', async () => {
      const expected = {};
      const client = mockClient(expected);

      const result = await lolChallengesV1.getPercentiles(client, 'na1');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await lolChallengesV1.getPercentiles(client, 'kr');

      expect(client.request).toHaveBeenCalledWith(
        'kr',
        '/lol/challenges/v1/challenges/percentiles',
        'lol-challenges-v1.getPercentiles',
      );
    });
  });

  describe('getChallengeConfig', () => {
    it('returns unwrapped config', async () => {
      const expected = {
        id: 42,
        leaderboard: true,
        localizedNames: {},
        state: 'ENABLED',
        thresholds: {},
      };
      const client = mockClient(expected);

      const result = await lolChallengesV1.getChallengeConfig(client, 'na1', 42);

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await lolChallengesV1.getChallengeConfig(client, 'eun1', 99);

      expect(client.request).toHaveBeenCalledWith(
        'eun1',
        '/lol/challenges/v1/challenges/99/config',
        'lol-challenges-v1.getChallengeConfig',
      );
    });
  });

  describe('getChallengePercentiles', () => {
    it('returns unwrapped percentile map', async () => {
      const expected = { GOLD: 0.5, DIAMOND: 0.1 };
      const client = mockClient(expected);

      const result = await lolChallengesV1.getChallengePercentiles(client, 'na1', 1);

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await lolChallengesV1.getChallengePercentiles(client, 'jp1', 55);

      expect(client.request).toHaveBeenCalledWith(
        'jp1',
        '/lol/challenges/v1/challenges/55/percentiles',
        'lol-challenges-v1.getChallengePercentiles',
      );
    });
  });

  describe('getChallengeLeaderboard', () => {
    it('returns unwrapped leaderboard', async () => {
      const expected = [
        { puuid: 'abc-123', value: 999, position: 1 },
        { puuid: 'def-456', value: 998, position: 2 },
      ];
      const client = mockClient(expected);

      const result = await lolChallengesV1.getChallengeLeaderboard(client, 'na1', 1, 'CHALLENGER');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await lolChallengesV1.getChallengeLeaderboard(client, 'euw1', 42, 'GRANDMASTER');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/challenges/v1/challenges/42/leaderboards/by-level/GRANDMASTER',
        'lol-challenges-v1.getChallengeLeaderboard',
      );
    });
  });

  describe('getPlayerData', () => {
    it('returns unwrapped player data', async () => {
      const expected = {
        categoryPoints: {},
        challenges: [],
        preferences: {
          bannerAccent: '',
          challengeIds: [],
          crestBorder: '',
          prestigeCrestBorderLevel: 0,
          title: '',
        },
        totalPoints: { current: 100, level: 'GOLD', max: 500, percentile: 0.3 },
      };
      const client = mockClient(expected);

      const result = await lolChallengesV1.getPlayerData(client, 'na1', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await lolChallengesV1.getPlayerData(client, 'tr1', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'tr1',
        '/lol/challenges/v1/player-data/my-puuid',
        'lol-challenges-v1.getPlayerData',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      lolChallengesV1.getConfig(client, 'americas');

      // @ts-expect-error -- regional route 'europe' must not be accepted by platform-only endpoint
      lolChallengesV1.getPlayerData(client, 'europe', 'puuid');

      // @ts-expect-error -- regional route 'asia' must not be accepted by platform-only endpoint
      lolChallengesV1.getChallengeLeaderboard(client, 'asia', 1, 'CHALLENGER');
    });
  });
});
