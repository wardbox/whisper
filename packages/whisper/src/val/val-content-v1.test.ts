import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { Content } from '../types/generated/val.js';
import { valContentV1 } from './val-content-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('valContentV1', () => {
  describe('getContent', () => {
    it('returns unwrapped content data', async () => {
      const expected = {
        acts: [],
        characters: [],
        charmLevels: [],
        charms: [],
        chromas: [],
        equips: [],
        gameModes: [],
        maps: [],
        playerCards: [],
        playerTitles: [],
        skinLevels: [],
        skins: [],
        sprayLevels: [],
        sprays: [],
        version: '1.0',
      } as Content;
      const client = mockClient(expected);

      const result = await valContentV1.getContent(client, 'na');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({});

      await valContentV1.getContent(client, 'eu');

      expect(client.request).toHaveBeenCalledWith(
        'eu',
        '/val/content/v1/contents',
        'val-content-v1.getContent',
        undefined,
      );
    });

    it('passes locale as query parameter when provided', async () => {
      const client = mockClient({});

      await valContentV1.getContent(client, 'ap', { locale: 'ja-JP' });

      expect(client.request).toHaveBeenCalledWith(
        'ap',
        '/val/content/v1/contents',
        'val-content-v1.getContent',
        { params: { locale: 'ja-JP' } },
      );
    });

    it('does not pass params when locale is not provided', async () => {
      const client = mockClient({});

      await valContentV1.getContent(client, 'na');

      expect(client.request).toHaveBeenCalledWith(
        'na',
        '/val/content/v1/contents',
        'val-content-v1.getContent',
        undefined,
      );
    });

    it('does not pass params when options is empty object', async () => {
      const client = mockClient({});

      await valContentV1.getContent(client, 'na', {});

      expect(client.request).toHaveBeenCalledWith(
        'na',
        '/val/content/v1/contents',
        'val-content-v1.getContent',
        undefined,
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(valContentV1.getContent(client, 'na')).rejects.toThrow('upstream failure');
    });
  });

  describe('type safety', () => {
    it('rejects PlatformRoute at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- PlatformRoute 'na1' must not be accepted by ValPlatformRoute endpoint
      valContentV1.getContent(client, 'na1');
    });

    it('rejects RegionalRoute at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- RegionalRoute 'americas' must not be accepted by ValPlatformRoute endpoint
      valContentV1.getContent(client, 'americas');
    });
  });
});
