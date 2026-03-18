import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { TftSummoner } from '../types/generated/tft.js';
import { tftSummonerV1 } from './tft-summoner-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('tftSummonerV1', () => {
  describe('getByPuuid', () => {
    it('returns unwrapped summoner data', async () => {
      const expected: TftSummoner = {
        profileIconId: 42,
        puuid: 'abc-123',
        revisionDate: 1700000000000,
        summonerLevel: 150,
      };
      const client = mockClient(expected);

      const result = await tftSummonerV1.getByPuuid(client, 'na1', 'abc-123');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ profileIconId: 0, puuid: '', revisionDate: 0, summonerLevel: 0 });

      await tftSummonerV1.getByPuuid(client, 'euw1', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/tft/summoner/v1/summoners/by-puuid/my-puuid',
        'tft-summoner-v1.getByPuuid',
      );
    });
  });

  describe('getByAccessToken', () => {
    it('returns unwrapped summoner data', async () => {
      const expected: TftSummoner = {
        profileIconId: 99,
        puuid: 'rso-puuid',
        revisionDate: 1700000000000,
        summonerLevel: 200,
      };
      const client = mockClient(expected);

      const result = await tftSummonerV1.getByAccessToken(client, 'na1', 'my-rso-token');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path, methodId, and Authorization header', async () => {
      const client = mockClient({ profileIconId: 0, puuid: '', revisionDate: 0, summonerLevel: 0 });

      await tftSummonerV1.getByAccessToken(client, 'kr', 'token-abc');

      expect(client.request).toHaveBeenCalledWith(
        'kr',
        '/tft/summoner/v1/summoners/me',
        'tft-summoner-v1.getByAccessToken',
        { headers: { Authorization: 'Bearer token-abc' } },
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(tftSummonerV1.getByPuuid(client, 'na1', 'puuid')).rejects.toThrow(
        'upstream failure',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      tftSummonerV1.getByPuuid(client, 'americas', 'puuid');

      // @ts-expect-error -- regional route 'europe' must not be accepted by platform-only endpoint
      tftSummonerV1.getByAccessToken(client, 'europe', 'token');
    });
  });
});
