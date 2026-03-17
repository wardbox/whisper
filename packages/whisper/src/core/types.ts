import type { PlatformRoute } from '../types/platform.js';
import type { RegionalRoute } from '../types/regional.js';

/** API key as static string or async function for rotation */
export type ApiKeyProvider = string | (() => Promise<string>);

/** Cache adapter interface -- all methods async for adapter compatibility */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

/** Per-method TTL configuration via pattern matching */
export interface CacheTtlConfig {
  [pattern: string]: number;
  default: number;
}

/** Rate limiter configuration */
export interface RateLimiterConfig {
  /** Throw immediately on rate limit instead of queuing */
  throwOnLimit?: boolean | undefined;
  /** Maximum number of requests to queue before rejecting */
  maxQueueSize?: number | undefined;
  /** Per-request timeout in milliseconds */
  requestTimeout?: number | undefined;
  /** Callback invoked when a rate limit is hit */
  onRateLimit?: ((scope: string, retryAfter: number) => void) | undefined;
  /** Callback invoked when a request is retried */
  onRetry?: ((request: RequestContext, attempt: number) => void) | undefined;
}

/** Middleware hook object */
export interface Middleware {
  /** Optional name for debugging */
  name?: string | undefined;
  /** Called before the request is sent. Return modified context. */
  onRequest?(context: RequestContext): RequestContext | Promise<RequestContext>;
  /** Called after the response is received. Return modified response. */
  onResponse?(response: ApiResponse, context: RequestContext): ApiResponse | Promise<ApiResponse>;
}

/** Request context flowing through the pipeline */
export interface RequestContext {
  /** Full request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body (for POST/PUT) */
  body?: string | undefined;
  /** Routing value used for this request */
  route: PlatformRoute | RegionalRoute;
  /** API method identifier, e.g., 'summoner-v4.getByPuuid' */
  methodId: string;
}

/** Parsed API response */
export interface ApiResponse<T = unknown> {
  /** Parsed response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
}

/** Client configuration options */
export interface ClientConfig {
  /** API key or async key provider for rotation */
  apiKey: ApiKeyProvider;
  /** Cache adapter, or false to disable caching */
  cache?: CacheAdapter | false | undefined;
  /** Per-method TTL configuration */
  cacheTtl?: CacheTtlConfig | undefined;
  /** Rate limiter configuration, or false to disable */
  rateLimiter?: RateLimiterConfig | false | undefined;
  /** Middleware pipeline */
  middleware?: Middleware[] | undefined;
}
