/**
 * Cache subsystem for whisper.
 *
 * Provides an in-memory cache with TTL-based expiry, a pluggable adapter
 * interface, per-method TTL resolution, and API-key-aware cache key generation.
 *
 * @module
 */

import type { CacheAdapter, CacheTtlConfig } from './types.js';

export type { CacheAdapter, CacheTtlConfig };

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * Default in-memory cache backed by a `Map`.
 *
 * Entries are lazily evicted on access -- expired entries are removed when
 * `get()` or `has()` is called. A TTL of 0 or less means "do not cache",
 * which is the correct default for live game data (spectator endpoints).
 *
 * @example
 * ```typescript
 * const cache = new MemoryCache();
 * await cache.set('summoner:abc', data, 3600);
 * const cached = await cache.get<SummonerDTO>('summoner:abc');
 * ```
 */
export class MemoryCache implements CacheAdapter {
  private readonly store = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }
}

/**
 * Resolve the cache TTL for a given request path.
 *
 * Iterates over the `config` entries (excluding `default`) and returns the
 * TTL for the first pattern that appears in `path`. Falls back to
 * `config.default` when no pattern matches.
 *
 * @param path - The API request path (e.g. `/lol/summoner/v4/summoners/by-puuid/...`)
 * @param config - Per-method TTL configuration
 * @returns TTL in seconds
 *
 * @example
 * ```typescript
 * const ttl = resolveTtl('/lol/summoner/v4/summoners/by-puuid/abc', {
 *   summoner: 3600,
 *   match: 60,
 *   default: 300,
 * });
 * // ttl === 3600
 * ```
 */
export function resolveTtl(path: string, config: CacheTtlConfig): number {
  for (const [pattern, ttl] of Object.entries(config)) {
    if (pattern === 'default') continue;
    if (path.includes(pattern)) return ttl;
  }
  return config.default;
}

/**
 * Build a cache key that includes an API-key-derived prefix.
 *
 * The prefix is a short hash of the API key so that different keys produce
 * different cache namespaces, preventing cross-key poisoning (CACHE-04).
 * The key itself is never stored in the cache key.
 *
 * @param apiKey - The Riot API key
 * @param route - The routing value (e.g. `na1`, `americas`)
 * @param path - The request path
 * @param params - Optional query parameters
 * @returns A deterministic cache key string
 *
 * @example
 * ```typescript
 * const key = buildCacheKey('RGAPI-abc', 'na1', '/lol/summoner/v4/by-puuid/xyz');
 * // "k8f2a:na1:/lol/summoner/v4/by-puuid/xyz"
 * ```
 */
export function buildCacheKey(
  apiKey: string,
  route: string,
  path: string,
  params?: Record<string, string>,
): string {
  const keyPrefix = simpleHash(apiKey).slice(0, 8);
  const paramStr = params ? '?' + new URLSearchParams(params).toString() : '';
  return `${keyPrefix}:${route}:${path}${paramStr}`;
}

/**
 * Simple non-cryptographic hash (djb2 variant).
 *
 * Used for generating a short, deterministic prefix from the API key.
 * No crypto module needed -- works in all runtimes including edge.
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
