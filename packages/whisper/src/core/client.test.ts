import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from './client.js';
import type { Middleware } from './types.js';

describe('createClient', () => {
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

  it('returns object with request method', () => {
    const client = createClient({ apiKey: 'RGAPI-test' });
    expect(client).toBeDefined();
    expect(typeof client.request).toBe('function');
  });

  it('makes fetch call to correct URL with X-Riot-Token header', async () => {
    const fetchMock = mockFetch(
      200,
      { name: 'TestSummoner' },
      {
        'x-app-rate-limit': '100:1',
        'x-app-rate-limit-count': '1:1',
        'x-method-rate-limit': '20:1',
        'x-method-rate-limit-count': '1:1',
      },
    );
    const client = createClient({ apiKey: 'RGAPI-test' });

    const response = await client.request(
      'na1',
      '/lol/summoner/v4/summoners/by-puuid/test',
      'summoner-v4.getByPuuid',
    );

    expect(response.data).toEqual({ name: 'TestSummoner' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/test');
    expect(init.headers['X-Riot-Token']).toBe('RGAPI-test');
  });

  it('cache:false disables caching (same request twice = two fetch calls)', async () => {
    const fetchMock = mockFetch(200, { id: '1' });
    const client = createClient({ apiKey: 'RGAPI-test', cache: false, rateLimiter: false });

    await client.request('na1', '/test', 'test.method');
    await client.request('na1', '/test', 'test.method');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('cache enabled (default) caches response (same request twice = one fetch call)', async () => {
    const fetchMock = mockFetch(200, { id: '1' });
    const client = createClient({ apiKey: 'RGAPI-test', rateLimiter: false });

    const r1 = await client.request('na1', '/test', 'test.method');
    const r2 = await client.request('na1', '/test', 'test.method');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(r1.data).toEqual(r2.data);
  });

  it('POST requests bypass cache (two POSTs = two fetch calls)', async () => {
    const fetchMock = mockFetch(200, { id: '1' });
    const client = createClient({ apiKey: 'RGAPI-test', rateLimiter: false });

    await client.request('na1', '/test', 'test.method', { method: 'POST', body: '{"a":1}' });
    await client.request('na1', '/test', 'test.method', { method: 'POST', body: '{"a":1}' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('GET and POST to same path do not share cache', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({ call: callCount }),
      });
    });

    const client = createClient({ apiKey: 'RGAPI-test', rateLimiter: false });

    const get = await client.request('na1', '/test', 'test.method');
    const post = await client.request('na1', '/test', 'test.method', {
      method: 'POST',
      body: '{}',
    });

    expect(get.data).toEqual({ call: 1 });
    expect(post.data).toEqual({ call: 2 });
  });

  it('params are serialized into outbound URL', async () => {
    const fetchMock = mockFetch(200, { ok: true });
    const client = createClient({ apiKey: 'RGAPI-test', cache: false, rateLimiter: false });

    await client.request('na1', '/lol/match/v5/matches', 'match-v5.getIds', {
      params: { start: '0', count: '20' },
    });

    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain('?start=0&count=20');
  });

  it('different params produce different cache entries', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({ call: callCount }),
      });
    });

    const client = createClient({ apiKey: 'RGAPI-test', rateLimiter: false });

    const r1 = await client.request('na1', '/test', 'test.method', { params: { page: '1' } });
    const r2 = await client.request('na1', '/test', 'test.method', { params: { page: '2' } });

    expect(r1.data).toEqual({ call: 1 });
    expect(r2.data).toEqual({ call: 2 });
  });

  it('rateLimiter:false disables rate limiting', async () => {
    mockFetch(200, { ok: true });
    const client = createClient({ apiKey: 'RGAPI-test', rateLimiter: false, cache: false });

    // Should not throw or hang -- just pass through
    const response = await client.request('na1', '/test', 'test.method');
    expect(response.data).toEqual({ ok: true });
  });

  it('middleware hooks fire in correct order during request', async () => {
    mockFetch(200, { ok: true });
    const order: string[] = [];

    const mw1: Middleware = {
      name: 'mw1',
      onRequest(ctx) {
        order.push('mw1:request');
        return ctx;
      },
      onResponse(res) {
        order.push('mw1:response');
        return res;
      },
    };

    const mw2: Middleware = {
      name: 'mw2',
      onRequest(ctx) {
        order.push('mw2:request');
        return ctx;
      },
      onResponse(res) {
        order.push('mw2:response');
        return res;
      },
    };

    const client = createClient({
      apiKey: 'RGAPI-test',
      cache: false,
      rateLimiter: false,
      middleware: [mw1, mw2],
    });

    await client.request('na1', '/test', 'test.method');

    // onRequest: forward order, onResponse: reverse order
    expect(order).toEqual(['mw1:request', 'mw2:request', 'mw2:response', 'mw1:response']);
  });

  it('async key function works', async () => {
    const fetchMock = mockFetch(200, { ok: true });
    const client = createClient({
      apiKey: async () => 'RGAPI-from-vault',
      cache: false,
      rateLimiter: false,
    });

    await client.request('na1', '/test', 'test.method');

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers['X-Riot-Token']).toBe('RGAPI-from-vault');
  });

  it('full pipeline: middleware -> cache -> rate limiter -> fetch', async () => {
    const events: string[] = [];

    const fetchMock = vi.fn().mockImplementation(() => {
      events.push('fetch');
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'x-app-rate-limit': '100:1',
          'x-app-rate-limit-count': '1:1',
          'x-method-rate-limit': '20:1',
          'x-method-rate-limit-count': '1:1',
        }),
        json: async () => ({ result: 'data' }),
      });
    });
    globalThis.fetch = fetchMock;

    const middleware: Middleware = {
      name: 'tracker',
      onRequest(ctx) {
        events.push('middleware:request');
        return ctx;
      },
      onResponse(res) {
        events.push('middleware:response');
        return res;
      },
    };

    const client = createClient({
      apiKey: 'RGAPI-test',
      middleware: [middleware],
      // cache and rate limiter enabled by default
    });

    const response = await client.request('na1', '/test', 'test.method');
    expect(response.data).toEqual({ result: 'data' });

    // Middleware wraps the entire fetch cycle
    expect(events).toEqual(['middleware:request', 'fetch', 'middleware:response']);

    // Second request should hit cache (no fetch)
    events.length = 0;
    const response2 = await client.request('na1', '/test', 'test.method');
    expect(response2.data).toEqual({ result: 'data' });
    // Cache hit happens BEFORE middleware pipeline
    expect(events).toEqual([]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
