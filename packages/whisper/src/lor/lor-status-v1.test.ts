import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { LorPlatformData } from '../types/generated/lor.js';
import { lorStatusV1 } from './lor-status-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('lorStatusV1', () => {
  describe('getPlatformData', () => {
    it('returns unwrapped platform status data', async () => {
      const expected: LorPlatformData = {
        id: 'Americas',
        incidents: [],
        locales: ['en_US'],
        maintenances: [],
        name: 'Americas',
      };
      const client = mockClient(expected);

      const result = await lorStatusV1.getPlatformData(client, 'americas');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ id: '', incidents: [], locales: [], maintenances: [], name: '' });

      await lorStatusV1.getPlatformData(client, 'europe');

      expect(client.request).toHaveBeenCalledWith(
        'europe',
        '/lor/status/v1/platform-data',
        'lor-status-v1.getPlatformData',
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(lorStatusV1.getPlatformData(client, 'americas')).rejects.toThrow(
        'upstream failure',
      );
    });
  });

  describe('type safety', () => {
    it('rejects platform routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- platform route 'na1' must not be accepted by regional-only endpoint
      lorStatusV1.getPlatformData(client, 'na1');
    });
  });
});
