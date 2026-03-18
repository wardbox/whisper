import { describe, expect, it, vi } from 'vitest';
import type { WhisperClient } from '../core/client.js';
import type { LolPlatformData } from '../types/generated/lol.js';
import { lolStatusV4 } from './lol-status-v4.js';

function mockClient(data: unknown): WhisperClient {
  return {
    request: vi.fn().mockResolvedValue({ data, status: 200, headers: {} }),
  };
}

describe('lolStatusV4', () => {
  describe('getStatus', () => {
    it('returns unwrapped platform status data', async () => {
      const expected: LolPlatformData = {
        id: 'NA1',
        incidents: [],
        locales: ['en_US'],
        maintenances: [],
        name: 'North America',
      };
      const client = mockClient(expected);

      const result = await lolStatusV4.getStatus(client, 'na1');

      expect(result).toEqual(expected);
    });

    it('calls client.request with correct path and methodId', async () => {
      const client = mockClient({ id: '', incidents: [], locales: [], maintenances: [], name: '' });

      await lolStatusV4.getStatus(client, 'euw1');

      expect(client.request).toHaveBeenCalledWith(
        'euw1',
        '/lol/status/v4/platform-data',
        'lol-status-v4.getStatus',
      );
    });
  });

  describe('type safety', () => {
    it('rejects regional routes at compile time', () => {
      const client = mockClient({});

      // @ts-expect-error -- regional route 'americas' must not be accepted by platform-only endpoint
      lolStatusV4.getStatus(client, 'americas');
    });
  });
});
