/** Options for constructing a RiotApiError */
export interface RiotApiErrorOptions {
  status: number;
  statusText: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  riotMessage?: string | undefined;
}

/**
 * Base error class for all Riot API errors (non-2xx responses).
 *
 * @example
 * ```typescript
 * try {
 *   await client.lol.summoner.getByPuuid('na1', puuid);
 * } catch (err) {
 *   if (err instanceof RiotApiError) {
 *     console.error(err.status, err.message);
 *   }
 * }
 * ```
 */
export class RiotApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly riotMessage?: string | undefined;

  constructor(options: RiotApiErrorOptions) {
    const redactedUrl = options.url.replace(/RGAPI-[a-f0-9-]+/gi, 'RGAPI-***');
    super(`Riot API error ${options.status}: ${options.statusText} (${redactedUrl})`);
    this.name = 'RiotApiError';
    this.status = options.status;
    this.statusText = options.statusText;
    this.url = redactedUrl;
    this.method = options.method;
    this.headers = options.headers;
    this.riotMessage = options.riotMessage;
  }
}

/** Options for constructing a RateLimitError */
export interface RateLimitErrorOptions extends RiotApiErrorOptions {
  retryAfter?: number | undefined;
  limitType?: 'application' | 'method' | 'service' | undefined;
}

/**
 * Error thrown when a 429 Too Many Requests response is received.
 *
 * @example
 * ```typescript
 * try {
 *   await client.lol.summoner.getByPuuid('na1', puuid);
 * } catch (err) {
 *   if (err instanceof RateLimitError) {
 *     console.log(`Rate limited, retry after ${err.retryAfter}s`);
 *   }
 * }
 * ```
 */
export class RateLimitError extends RiotApiError {
  readonly retryAfter?: number | undefined;
  readonly limitType?: 'application' | 'method' | 'service' | undefined;

  constructor(options: RateLimitErrorOptions) {
    super(options);
    this.name = 'RateLimitError';
    this.retryAfter = options.retryAfter;
    this.limitType = options.limitType;
  }
}

/**
 * Error thrown when a 404 Not Found response is received.
 *
 * @example
 * ```typescript
 * try {
 *   await client.lol.summoner.getByPuuid('na1', puuid);
 * } catch (err) {
 *   if (err instanceof NotFoundError) {
 *     console.log('Summoner not found');
 *   }
 * }
 * ```
 */
export class NotFoundError extends RiotApiError {
  constructor(options: RiotApiErrorOptions) {
    super(options);
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when a 401 Unauthorized or 403 Forbidden response is received.
 *
 * @example
 * ```typescript
 * try {
 *   await client.lol.summoner.getByPuuid('na1', puuid);
 * } catch (err) {
 *   if (err instanceof ForbiddenError) {
 *     console.log('Invalid or expired API key');
 *   }
 * }
 * ```
 */
export class ForbiddenError extends RiotApiError {
  constructor(options: RiotApiErrorOptions) {
    super(options);
    this.name = 'ForbiddenError';
  }
}

/**
 * Error thrown when a 503 Service Unavailable response is received.
 *
 * @example
 * ```typescript
 * try {
 *   await client.lol.summoner.getByPuuid('na1', puuid);
 * } catch (err) {
 *   if (err instanceof ServiceUnavailableError) {
 *     console.log('Riot API is temporarily unavailable');
 *   }
 * }
 * ```
 */
export class ServiceUnavailableError extends RiotApiError {
  constructor(options: RiotApiErrorOptions) {
    super(options);
    this.name = 'ServiceUnavailableError';
  }
}
