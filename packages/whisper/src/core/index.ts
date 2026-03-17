// Client factory

// Primitives for advanced users
export { buildCacheKey, MemoryCache, resolveTtl } from './cache.js';
export type { WhisperClient } from './client.js';
export { createClient } from './client.js';

// Errors
export {
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  RiotApiError,
  ServiceUnavailableError,
} from './errors.js';
export type { KeyProvider } from './http.js';
export { buildUrl, normalizeKeyProvider } from './http.js';
export { executePipeline } from './middleware.js';
export { RateLimiter } from './rate-limiter.js';
// Types
export type {
  ApiKeyProvider,
  ApiResponse,
  CacheAdapter,
  CacheTtlConfig,
  ClientConfig,
  Middleware,
  RateLimiterConfig,
  RequestContext,
} from './types.js';
