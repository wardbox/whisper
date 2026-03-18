import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { RiftboundContent } from '../types/generated/riftbound.js';
import { riftboundContentV1 } from './riftbound-content-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('riftboundContentV1', () => {
  describe('getContent', () => {
    it('returns unwrapped content data', async () => {
      const expected: RiftboundContent = {
        game: 'riftbound',
        lastUpdated: '2026-01-01T00:00:00Z',
        sets: [
          {
            cards: [
              {
                art: { artist: 'TestArtist', fullURL: 'https://example.com/full.png', thumbnailURL: 'https://example.com/thumb.png' },
                collectorNumber: 1,
                description: 'A test card',
                faction: 'Demacia',
                flavorText: 'Flavor text',
                id: 'card-001',
                keywords: ['Quick Attack'],
                name: 'Test Card',
                rarity: 'Common',
                set: 'set-01',
                stats: { cost: 3, energy: 2, might: 4, power: 3 },
                tags: ['unit'],
                type: 'CHAMPION',
              },
            ],
            id: 'set-01',
            name: 'Base Set',
          },
        ],
        version: '1.0.0',
      };
      const client = mockClient(expected);

      const result = await riftboundContentV1.getContent(client, 'americas');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ game: '', lastUpdated: '', sets: [], version: '' });

      await riftboundContentV1.getContent(client, 'europe');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/riftbound/content/v1/contents',
        'riftbound-content-v1.getContent',
        undefined,
      );
    });

    it('passes locale as query param when provided', async () => {
      const client = mockClient({ game: '', lastUpdated: '', sets: [], version: '' });

      await riftboundContentV1.getContent(client, 'asia', { locale: 'ko_KR' });

      expect(client.request).toHaveBeenCalledWith(
        'asia',
        '/riftbound/content/v1/contents',
        'riftbound-content-v1.getContent',
        { params: { locale: 'ko_KR' } },
      );
    });

    it('does not send locale param when not provided', async () => {
      const client = mockClient({ game: '', lastUpdated: '', sets: [], version: '' });

      await riftboundContentV1.getContent(client, 'americas');

      expect(client.request).toHaveBeenCalledWith(
        'americas',
        '/riftbound/content/v1/contents',
        'riftbound-content-v1.getContent',
        undefined,
      );
    });

    it('does not send locale param when options object has no locale', async () => {
      const client = mockClient({ game: '', lastUpdated: '', sets: [], version: '' });

      await riftboundContentV1.getContent(client, 'americas', {});

      expect(client.request).toHaveBeenCalledWith(
        'americas',
        '/riftbound/content/v1/contents',
        'riftbound-content-v1.getContent',
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

      await expect(riftboundContentV1.getContent(client, 'americas')).rejects.toThrow(
        'upstream failure',
      );
    });
  });

  describe('type safety', () => {
    it('rejects platform routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- platform route 'na1' must not be accepted by regional-only endpoint
      riftboundContentV1.getContent(client, 'na1');
    });
  });
});
