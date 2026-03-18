import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import { lolRsoMatchV1 } from './lol-rso-match-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('lolRsoMatchV1', () => {
  describe('getMatchIds', () => {
    it('returns unwrapped match ID array', async () => {
      const expected = ['NA1_111', 'NA1_222'];
      const client = mockClient(expected);

      const result = await lolRsoMatchV1.getMatchIds(client, 'americas', 'puuid-abc');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient([]);

      await lolRsoMatchV1.getMatchIds(client, 'europe', 'my-puuid');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/rso-match/v1/matches/by-puuid/my-puuid/ids',
        'lol-rso-match-v1.getMatchIds',
        undefined,
      );
    });

    it('passes query params when options are provided', async () => {
      const client = mockClient([]);

      await lolRsoMatchV1.getMatchIds(client, 'americas', 'puuid-123', {
        count: 10,
        type: 'ranked',
      });

      expect(client.request).toHaveBeenCalledWith(
        'americas',
        '/lol/rso-match/v1/matches/by-puuid/puuid-123/ids',
        'lol-rso-match-v1.getMatchIds',
        {
          params: {
            count: '10',
            type: 'ranked',
          },
        },
      );
    });
  });

  describe('getMatch', () => {
    it('returns unwrapped match data', async () => {
      const expected = { metadata: { matchId: 'NA1_111' }, info: {} };
      const client = mockClient(expected);

      const result = await lolRsoMatchV1.getMatch(client, 'americas', 'NA1_111');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await lolRsoMatchV1.getMatch(client, 'europe', 'EUW1_999');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lol/rso-match/v1/matches/EUW1_999',
        'lol-rso-match-v1.getMatch',
      );
    });
  });

  describe('getTimeline', () => {
    it('returns unwrapped timeline data', async () => {
      const expected = { metadata: { matchId: 'NA1_111' }, info: { frames: [] } };
      const client = mockClient(expected);

      const result = await lolRsoMatchV1.getTimeline(client, 'americas', 'NA1_111');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await lolRsoMatchV1.getTimeline(client, 'asia', 'KR_555');

      expect(client.request).toHaveBeenCalledWith(
        'asia',
        '/lol/rso-match/v1/matches/KR_555/timeline',
        'lol-rso-match-v1.getTimeline',
      );
    });
  });

  describe('type safety', () => {
    it('rejects platform routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- platform route 'na1' must not be accepted by regional-only endpoint
      lolRsoMatchV1.getMatchIds(client, 'na1', 'puuid');

      // @ts-expect-error -- platform route 'euw1' must not be accepted by regional-only endpoint
      lolRsoMatchV1.getMatch(client, 'euw1', 'match-id');

      // @ts-expect-error -- platform route 'kr' must not be accepted by regional-only endpoint
      lolRsoMatchV1.getTimeline(client, 'kr', 'match-id');
    });
  });
});
