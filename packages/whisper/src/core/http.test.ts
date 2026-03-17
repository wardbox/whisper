import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUrl, createHttpClient, normalizeKeyProvider } from './http.js';

describe('buildUrl', () => {
  it('builds platform route URL', () => {
    expect(buildUrl('na1', '/lol/summoner/v4/summoners/by-puuid/xyz')).toBe(
      'https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/xyz',
    );
  });

  it('builds regional route URL', () => {
    expect(buildUrl('americas', '/riot/account/v1/accounts/by-puuid/xyz')).toBe(
      'https://americas.api.riotgames.com/riot/account/v1/accounts/by-puuid/xyz',
    );
  });
});

describe('normalizeKeyProvider', () => {
  it('wraps string key into async provider', async () => {
    const provider = normalizeKeyProvider('RGAPI-test');
    expect(await provider.getKey()).toBe('RGAPI-test');
  });

  it('caches result from async function', async () => {
    const fn = vi.fn().mockResolvedValue('RGAPI-rotated');
    const provider = normalizeKeyProvider(fn);

    await provider.getKey();
    await provider.getKey();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('re-invokes function after invalidate()', async () => {
    const fn = vi.fn().mockResolvedValueOnce('RGAPI-first').mockResolvedValueOnce('RGAPI-second');
    const provider = normalizeKeyProvider(fn);

    expect(await provider.getKey()).toBe('RGAPI-first');
    provider.invalidate();
    expect(await provider.getKey()).toBe('RGAPI-second');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('shares pending promise on concurrent getKey calls after invalidate', async () => {
    let resolveKey!: (val: string) => void;
    const fn = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveKey = resolve;
        }),
    );
    const provider = normalizeKeyProvider(fn);

    // Start two concurrent calls
    const p1 = provider.getKey();
    const p2 = provider.getKey();

    resolveKey('RGAPI-shared');
    const [k1, k2] = await Promise.all([p1, p2]);

    expect(k1).toBe('RGAPI-shared');
    expect(k2).toBe('RGAPI-shared');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('invalidate during in-flight fetch causes single re-fetch', async () => {
    let callCount = 0;
    const fn = vi.fn().mockImplementation(async () => {
      callCount++;
      return `RGAPI-key-${callCount}`;
    });
    const provider = normalizeKeyProvider(fn);

    // First fetch
    const key1 = await provider.getKey();
    expect(key1).toBe('RGAPI-key-1');

    // Invalidate and make concurrent requests
    provider.invalidate();
    const [k2, k3] = await Promise.all([provider.getKey(), provider.getKey()]);
    expect(k2).toBe('RGAPI-key-2');
    expect(k3).toBe('RGAPI-key-2');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('createHttpClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
    const mockFn = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : `Error ${status}`,
      headers: new Headers(headers),
      json: async () => body,
    });
    globalThis.fetch = mockFn;
    return mockFn;
  }

  it('sends X-Riot-Token header with resolved API key', async () => {
    const fetchMock = mockFetch(200, { name: 'test' });
    const provider = normalizeKeyProvider('RGAPI-test-key');
    const http = createHttpClient(provider);

    await http.request('na1', '/lol/summoner/v4/summoners/by-puuid/abc', 'summoner-v4.getByPuuid');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/abc');
    expect(init.headers['X-Riot-Token']).toBe('RGAPI-test-key');
  });

  it('returns ApiResponse with parsed JSON data, status, and headers', async () => {
    mockFetch(200, { id: '123', name: 'Test' }, { 'x-app-rate-limit': '100:1' });
    const provider = normalizeKeyProvider('RGAPI-test');
    const http = createHttpClient(provider);

    const response = await http.request<{ id: string; name: string }>(
      'na1',
      '/lol/summoner/v4/summoners/by-puuid/abc',
      'summoner-v4.getByPuuid',
    );

    expect(response.data).toEqual({ id: '123', name: 'Test' });
    expect(response.status).toBe(200);
    expect(response.headers['x-app-rate-limit']).toBe('100:1');
  });

  it('throws NotFoundError on 404', async () => {
    mockFetch(404, { status: { message: 'Data not found', status_code: 404 } });
    const provider = normalizeKeyProvider('RGAPI-test');
    const http = createHttpClient(provider);

    const { NotFoundError } = await import('./errors.js');
    await expect(
      http.request('na1', '/lol/summoner/v4/summoners/by-puuid/missing', 'summoner-v4.getByPuuid'),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws RateLimitError on 429 with retryAfter and limitType', async () => {
    mockFetch(
      429,
      { status: { message: 'Rate limit exceeded' } },
      {
        'retry-after': '5',
        'x-rate-limit-type': 'method',
      },
    );
    const provider = normalizeKeyProvider('RGAPI-test');
    const http = createHttpClient(provider);

    const { RateLimitError } = await import('./errors.js');
    try {
      await http.request('na1', '/test', 'test.method');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      const rateLimitErr = err as InstanceType<typeof RateLimitError>;
      expect(rateLimitErr.retryAfter).toBe(5);
      expect(rateLimitErr.limitType).toBe('method');
    }
  });

  it('throws ServiceUnavailableError on 503', async () => {
    mockFetch(503, { status: { message: 'Service unavailable' } });
    const provider = normalizeKeyProvider('RGAPI-test');
    const http = createHttpClient(provider);

    const { ServiceUnavailableError } = await import('./errors.js');
    await expect(http.request('na1', '/test', 'test.method')).rejects.toThrow(
      ServiceUnavailableError,
    );
  });

  it('throws RiotApiError on other non-2xx status codes', async () => {
    mockFetch(500, { status: { message: 'Internal server error' } });
    const provider = normalizeKeyProvider('RGAPI-test');
    const http = createHttpClient(provider);

    const { RiotApiError } = await import('./errors.js');
    await expect(http.request('na1', '/test', 'test.method')).rejects.toThrow(RiotApiError);
  });

  it('on 401, invalidates key, retries once with new key, succeeds', async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce('RGAPI-old-key')
      .mockResolvedValueOnce('RGAPI-new-key');
    const provider = normalizeKeyProvider(fn);
    const http = createHttpClient(provider);

    let callCount = 0;
    globalThis.fetch = vi
      .fn()
      .mockImplementation((_url: string, init: { headers: Record<string, string> }) => {
        callCount++;
        if (callCount === 1) {
          // First call with old key returns 401
          return Promise.resolve({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            headers: new Headers(),
            json: async () => ({ status: { message: 'Unauthorized' } }),
          });
        }
        // Second call with new key succeeds
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({ success: true }),
        });
      });

    const response = await http.request('na1', '/test', 'test.method');
    expect(response.data).toEqual({ success: true });
    expect(response.status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('on 403, invalidates key, retries once, throws ForbiddenError if retry fails', async () => {
    mockFetch(403, { status: { message: 'Forbidden' } });
    const fn = vi.fn().mockResolvedValueOnce('RGAPI-old').mockResolvedValueOnce('RGAPI-new');
    const provider = normalizeKeyProvider(fn);
    const http = createHttpClient(provider);

    const { ForbiddenError } = await import('./errors.js');
    await expect(http.request('na1', '/test', 'test.method')).rejects.toThrow(ForbiddenError);
    // Both keys attempted
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('includes riotMessage from Riot error response body', async () => {
    mockFetch(400, { status: { message: 'Bad request - invalid parameter', status_code: 400 } });
    const provider = normalizeKeyProvider('RGAPI-test');
    const http = createHttpClient(provider);

    const { RiotApiError } = await import('./errors.js');
    try {
      await http.request('na1', '/test', 'test.method');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RiotApiError);
      expect((err as InstanceType<typeof RiotApiError>).riotMessage).toBe(
        'Bad request - invalid parameter',
      );
    }
  });

  it('uses custom method and headers when provided', async () => {
    const fetchMock = mockFetch(200, { ok: true });
    const provider = normalizeKeyProvider('RGAPI-test');
    const http = createHttpClient(provider);

    await http.request('na1', '/test', 'test.method', {
      method: 'POST',
      body: '{"test":true}',
      headers: { 'Content-Type': 'application/json' },
    });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"test":true}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });
});
