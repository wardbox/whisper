import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { LolSummoner } from '../types/generated/lol.js';
import { summonerV4 } from './summoner-v4.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('summonerV4', () => {
  describe('getByPuuid', () => {
    it('returns unwrapped summoner data', async () => {
      const expected: LolSummoner = {
        profileIconId: 4567,
        puuid: 'abc-123',
        revisionDate: 1700000000000,
        summonerLevel: 150,
      };
      const client = mockClient(expected);

      const result = await summonerV4.getByPuuid(client, 'na1', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ profileIconId: 0, puuid: '', revisionDate: 0, summonerLevel: 0 });

      await summonerV4.getByPuuid(client, 'euw1', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/summoner/v4/summoners/by-puuid/my-puuid',
        'summoner-v4.getByPuuid',
      );
    });
  });

  describe('getByAccountId', () => {
    it('returns unwrapped summoner data', async () => {
      const expected: LolSummoner = {
        profileIconId: 1234,
        puuid: 'xyz-789',
        revisionDate: 1700000000000,
        summonerLevel: 30,
      };
      const client = mockClient(expected);

      const result = await summonerV4.getByAccountId(client, 'kr', 'encrypted-acct-id');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ profileIconId: 0, puuid: '', revisionDate: 0, summonerLevel: 0 });

      await summonerV4.getByAccountId(client, 'br1', 'acct-id-123');

      expect(client.request).toHaveBeenCalledWith(
        'br1',
        '/lol/summoner/v4/summoners/by-account/acct-id-123',
        'summoner-v4.getByAccountId',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      summonerV4.getByPuuid(client, 'americas', 'puuid');

      // @ts-expect-error -- regional route 'europe' must not be accepted by platform-only endpoint
      summonerV4.getByAccountId(client, 'europe', 'acct-id');
    });
  });
});
