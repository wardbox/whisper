import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { Account } from '../types/generated/riot.js';
import type { ActiveShard } from '../types/overrides/riot-account.js';
import { accountV1 } from './account-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('accountV1', () => {
  describe('getByPuuid', () => {
    it('returns unwrapped account data', async () => {
      const expected: Account = {
        gameName: 'TestPlayer',
        puuid: 'abc-123',
        tagLine: 'NA1',
      };
      const client = mockClient(expected);

      const result = await accountV1.getByPuuid(client, 'americas', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ gameName: '', puuid: '', tagLine: '' });

      await accountV1.getByPuuid(client, 'europe', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/riot/account/v1/accounts/by-puuid/my-puuid',
        'account-v1.getByPuuid',
      );
    });
  });

  describe('getByRiotId', () => {
    it('returns unwrapped account data', async () => {
      const expected: Account = {
        gameName: 'Summoner',
        puuid: 'xyz-789',
        tagLine: 'EUW',
      };
      const client = mockClient(expected);

      const result = await accountV1.getByRiotId(client, 'europe', 'Summoner', 'EUW');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ gameName: '', puuid: '', tagLine: '' });

      await accountV1.getByRiotId(client, 'asia', 'Player', 'KR1');

      expect(client.request).toHaveBeenCalledWith(
        'asia',
        '/riot/account/v1/accounts/by-riot-id/Player/KR1',
        'account-v1.getByRiotId',
      );
    });
  });

  describe('getByGame', () => {
    it('returns unwrapped active shard data', async () => {
      const expected: ActiveShard = {
        puuid: 'abc-123',
        game: 'val',
        activeShard: 'na',
      };
      const client = mockClient(expected);

      const result = await accountV1.getByGame(client, 'americas', 'val', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ puuid: '', game: '', activeShard: '' });

      await accountV1.getByGame(client, 'sea', 'lor', 'some-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'sea',
        '/riot/account/v1/active-shards/by-game/lor/by-puuid/some-puuid',
        'account-v1.getByGame',
      );
    });
  });

  describe('type safety', () => {
    it('rejects platform routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- platform route 'na1' must not be accepted by regional-only endpoint
      accountV1.getByPuuid(client, 'na1', 'puuid');

      // @ts-expect-error -- platform route 'euw1' must not be accepted by regional-only endpoint
      accountV1.getByRiotId(client, 'euw1', 'name', 'tag');

      // @ts-expect-error -- platform route 'kr' must not be accepted by regional-only endpoint
      accountV1.getByGame(client, 'kr', 'val', 'puuid');
    });
  });
});
