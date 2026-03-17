import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MemoryCache,
  resolveTtl,
  buildCacheKey,
  type CacheAdapter,
  type CacheTtlConfig,
} from './cache.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new MemoryCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores a value and retrieves it within TTL', async () => {
    await cache.set('key', 'value', 5);
    const result = await cache.get<string>('key');
    expect(result).toBe('value');
  });

  it('returns undefined for TTL 0 (no caching)', async () => {
    await cache.set('key', 'value', 0);
    const result = await cache.get<string>('key');
    expect(result).toBeUndefined();
  });

  it('returns undefined for negative TTL', async () => {
    await cache.set('key', 'value', -1);
    const result = await cache.get<string>('key');
    expect(result).toBeUndefined();
  });

  it('returns undefined for expired entries', async () => {
    await cache.set('key', 'value', 1);
    vi.advanceTimersByTime(1100);
    const result = await cache.get<string>('key');
    expect(result).toBeUndefined();
  });

  it('has() returns true for non-expired entries', async () => {
    await cache.set('key', 'value', 5);
    const result = await cache.has('key');
    expect(result).toBe(true);
  });

  it('has() returns false for expired entries', async () => {
    await cache.set('key', 'value', 1);
    vi.advanceTimersByTime(1100);
    const result = await cache.has('key');
    expect(result).toBe(false);
  });

  it('has() returns false for missing entries', async () => {
    const result = await cache.has('nonexistent');
    expect(result).toBe(false);
  });

  it('delete() removes an entry', async () => {
    await cache.set('key', 'value', 5);
    await cache.delete('key');
    const result = await cache.get<string>('key');
    expect(result).toBeUndefined();
  });

  it('get() cleans up expired entries lazily (does not accumulate)', async () => {
    await cache.set('key1', 'value1', 1);
    await cache.set('key2', 'value2', 10);
    vi.advanceTimersByTime(1100);

    // Access expired key to trigger cleanup
    await cache.get('key1');

    // key1 should be cleaned up, key2 still present
    expect(await cache.has('key1')).toBe(false);
    expect(await cache.has('key2')).toBe(true);
  });

  it('stores and retrieves complex objects', async () => {
    const obj = { name: 'Faker', level: 500, nested: { rank: 'Challenger' } };
    await cache.set('summoner', obj, 60);
    const result = await cache.get<typeof obj>('summoner');
    expect(result).toEqual(obj);
  });
});

describe('Custom CacheAdapter', () => {
  it('works as a drop-in replacement implementing CacheAdapter interface', async () => {
    // A simple object-based store implementing CacheAdapter
    const store = new Map<string, { value: unknown; expiresAt: number }>();

    const customAdapter: CacheAdapter = {
      async get<T>(key: string): Promise<T | undefined> {
        const entry = store.get(key);
        if (!entry) return undefined;
        if (Date.now() >= entry.expiresAt) {
          store.delete(key);
          return undefined;
        }
        return entry.value as T;
      },
      async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        if (ttlSeconds <= 0) return;
        store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      },
      async delete(key: string): Promise<void> {
        store.delete(key);
      },
      async has(key: string): Promise<boolean> {
        const entry = store.get(key);
        if (!entry) return false;
        if (Date.now() >= entry.expiresAt) {
          store.delete(key);
          return false;
        }
        return true;
      },
    };

    // Same expectations as MemoryCache
    await customAdapter.set('key', 'value', 5);
    expect(await customAdapter.get<string>('key')).toBe('value');
    expect(await customAdapter.has('key')).toBe(true);
    await customAdapter.delete('key');
    expect(await customAdapter.get<string>('key')).toBeUndefined();
  });
});

describe('resolveTtl', () => {
  const config: CacheTtlConfig = {
    summoner: 3600,
    match: 60,
    spectator: 0,
    default: 300,
  };

  it('matches summoner pattern in path', () => {
    const ttl = resolveTtl(
      '/lol/summoner/v4/summoners/by-puuid/abc123',
      config,
    );
    expect(ttl).toBe(3600);
  });

  it('matches match pattern in path', () => {
    const ttl = resolveTtl(
      '/lol/match/v5/matches/NA1_12345',
      config,
    );
    expect(ttl).toBe(60);
  });

  it('matches spectator pattern returning TTL 0', () => {
    const ttl = resolveTtl(
      '/lol/spectator/v5/active-games/by-puuid/abc',
      config,
    );
    expect(ttl).toBe(0);
  });

  it('returns default TTL when no pattern matches', () => {
    const ttl = resolveTtl(
      '/lol/some-unknown/v1/endpoint',
      config,
    );
    expect(ttl).toBe(300);
  });

  it('returns default TTL for empty config (only default)', () => {
    const ttl = resolveTtl('/lol/summoner/v4/test', { default: 120 });
    expect(ttl).toBe(120);
  });
});

describe('buildCacheKey', () => {
  it('starts with a hash prefix derived from API key', () => {
    const key = buildCacheKey('RGAPI-abc', 'na1', '/lol/summoner/v4/by-puuid/xyz');
    expect(key).toMatch(/^[a-z0-9]+:/);
  });

  it('different API keys produce different cache keys for same route+path', () => {
    const key1 = buildCacheKey('RGAPI-abc', 'na1', '/lol/summoner/v4/by-puuid/xyz');
    const key2 = buildCacheKey('RGAPI-def', 'na1', '/lol/summoner/v4/by-puuid/xyz');
    expect(key1).not.toBe(key2);
  });

  it('same API key, route, and path produce the same key (deterministic)', () => {
    const key1 = buildCacheKey('RGAPI-abc', 'na1', '/lol/summoner/v4/by-puuid/xyz');
    const key2 = buildCacheKey('RGAPI-abc', 'na1', '/lol/summoner/v4/by-puuid/xyz');
    expect(key1).toBe(key2);
  });

  it('includes route and path in the key', () => {
    const key = buildCacheKey('RGAPI-abc', 'na1', '/lol/summoner/v4/by-puuid/xyz');
    expect(key).toContain('na1');
    expect(key).toContain('/lol/summoner/v4/by-puuid/xyz');
  });

  it('includes query params when provided', () => {
    const key = buildCacheKey('RGAPI-abc', 'na1', '/lol/summoner/v4/test', {
      queue: 'RANKED_SOLO',
    });
    expect(key).toContain('queue=RANKED_SOLO');
  });

  it('produces different keys for different routes', () => {
    const key1 = buildCacheKey('RGAPI-abc', 'na1', '/lol/summoner/v4/test');
    const key2 = buildCacheKey('RGAPI-abc', 'euw1', '/lol/summoner/v4/test');
    expect(key1).not.toBe(key2);
  });
});
