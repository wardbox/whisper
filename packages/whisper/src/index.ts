export type { WhisperClient } from './core/client.js';
export { createClient } from './core/client.js';
export {
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  RiotApiError,
  ServiceUnavailableError,
} from './core/errors.js';
export type {
  ApiKeyProvider,
  CacheAdapter,
  CacheTtlConfig,
  ClientConfig,
  Middleware,
  RateLimiterConfig,
} from './core/types.js';
