import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { ValPlatformData } from '../types/generated/val.js';
import { valStatusV1 } from './val-status-v1.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('valStatusV1', () => {
  describe('getPlatformData', () => {
    it('returns unwrapped platform status data', async () => {
      const expected: ValPlatformData = {
        id: 'NA',
        incidents: [],
        locales: ['en-US'],
        maintenances: [],
        name: 'North America',
      };
      const client = mockClient(expected);

      const result = await valStatusV1.getPlatformData(client, 'na');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ id: '', incidents: [], locales: [], maintenances: [], name: '' });

      await valStatusV1.getPlatformData(client, 'eu');

      expect(client.request).toHaveBeenCalledWith(
        'eu',
        '/val/status/v1/platform-data',
        'val-status-v1.getPlatformData',
      );
    });
  });

  describe('error propagation', () => {
    it('propagates client.request errors', async () => {
      const error = new Error('upstream failure');
      const client: WhisperClient = {
        request: vi.fn().mockRejectedValue(error),
      };

      await expect(valStatusV1.getPlatformData(client, 'na')).rejects.toThrow('upstream failure');
    });
  });

  describe('type safety', () => {
    it('rejects PlatformRoute at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- PlatformRoute 'na1' must not be accepted by ValPlatformRoute endpoint
      valStatusV1.getPlatformData(client, 'na1');
    });

    it('rejects RegionalRoute at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- RegionalRoute 'americas' must not be accepted by ValPlatformRoute endpoint
      valStatusV1.getPlatformData(client, 'americas');
    });
  });
});
