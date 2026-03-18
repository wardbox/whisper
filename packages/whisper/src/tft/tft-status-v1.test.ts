import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { TftPlatformData } from '../types/generated/tft.js';
import { tftStatusV1 } from './tft-status-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('tftStatusV1', () => {
  describe('getPlatformData', () => {
    it('returns unwrapped platform status data', async () => {
      const expected: TftPlatformData = {
        id: 'NA1',
        incidents: [],
        locales: ['en_US'],
        maintenances: [],
        name: 'North America',
      };
      const client = mockClient(expected);

      const result = await tftStatusV1.getPlatformData(client, 'na1');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ id: '', incidents: [], locales: [], maintenances: [], name: '' });

      await tftStatusV1.getPlatformData(client, 'euw1');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/tft/status/v1/platform-data',
        'tft-status-v1.getPlatformData',
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(tftStatusV1.getPlatformData(client, 'na1')).rejects.toThrow('upstream failure');
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      tftStatusV1.getPlatformData(client, 'americas');
    });
  });
});
