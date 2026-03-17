import { describe, expect, it } from 'vitest';
import {
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  RiotApiError,
  ServiceUnavailableError,
} from './errors.js';

const baseArgs = {
  status: 500,
  statusText: 'Internal Server Error',
  url: 'https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/abc?api_key=RGAPI-abcdef12-3456-7890-abcd-ef1234567890',
  method: 'GET',
  headers: { 'content-type': 'application/json' },
};

describe('RiotApiError', () => {
  it('extends Error', () => {
    const err = new RiotApiError(baseArgs);
    expect(err).toBeInstanceOf(Error);
  });

  it('has name "RiotApiError"', () => {
    const err = new RiotApiError(baseArgs);
    expect(err.name).toBe('RiotApiError');
  });

  it('exposes status, statusText, method, headers', () => {
    const err = new RiotApiError(baseArgs);
    expect(err.status).toBe(500);
    expect(err.statusText).toBe('Internal Server Error');
    expect(err.method).toBe('GET');
    expect(err.headers).toEqual({ 'content-type': 'application/json' });
  });

  it('redacts API key from URL', () => {
    const err = new RiotApiError(baseArgs);
    expect(err.url).not.toContain('RGAPI-abcdef12');
    expect(err.url).toContain('RGAPI-***');
  });

  it('includes status and redacted URL in message', () => {
    const err = new RiotApiError(baseArgs);
    expect(err.message).toContain('500');
    expect(err.message).toContain('RGAPI-***');
    expect(err.message).not.toContain('RGAPI-abcdef12');
  });

  it('handles URL without API key', () => {
    const err = new RiotApiError({
      ...baseArgs,
      url: 'https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/abc',
    });
    expect(err.url).toBe('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/abc');
  });

  it('exposes riotMessage when provided', () => {
    const err = new RiotApiError({ ...baseArgs, riotMessage: 'Data not found' });
    expect(err.riotMessage).toBe('Data not found');
  });

  it('riotMessage is undefined when not provided', () => {
    const err = new RiotApiError(baseArgs);
    expect(err.riotMessage).toBeUndefined();
  });
});

describe('RateLimitError', () => {
  const args429 = {
    status: 429,
    statusText: 'Too Many Requests',
    url: 'https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/abc',
    method: 'GET',
    headers: { 'retry-after': '5' },
  };

  it('extends RiotApiError', () => {
    const err = new RateLimitError(args429);
    expect(err).toBeInstanceOf(RiotApiError);
  });

  it('is instanceof RateLimitError', () => {
    const err = new RateLimitError(args429);
    expect(err).toBeInstanceOf(RateLimitError);
  });

  it('has name "RateLimitError"', () => {
    const err = new RateLimitError(args429);
    expect(err.name).toBe('RateLimitError');
  });

  it('exposes retryAfter', () => {
    const err = new RateLimitError({ ...args429, retryAfter: 5 });
    expect(err.retryAfter).toBe(5);
  });

  it('retryAfter is undefined when not provided', () => {
    const err = new RateLimitError(args429);
    expect(err.retryAfter).toBeUndefined();
  });

  it('exposes limitType', () => {
    const err = new RateLimitError({ ...args429, limitType: 'application' });
    expect(err.limitType).toBe('application');
  });

  it('limitType supports all three values', () => {
    for (const type of ['application', 'method', 'service'] as const) {
      const err = new RateLimitError({ ...args429, limitType: type });
      expect(err.limitType).toBe(type);
    }
  });
});

describe('NotFoundError', () => {
  const args404 = {
    status: 404,
    statusText: 'Not Found',
    url: 'https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/abc',
    method: 'GET',
    headers: {},
  };

  it('extends RiotApiError', () => {
    const err = new NotFoundError(args404);
    expect(err).toBeInstanceOf(RiotApiError);
  });

  it('is instanceof NotFoundError', () => {
    const err = new NotFoundError(args404);
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it('has name "NotFoundError"', () => {
    const err = new NotFoundError(args404);
    expect(err.name).toBe('NotFoundError');
  });
});

describe('ForbiddenError', () => {
  it('handles 401 status', () => {
    const err = new ForbiddenError({
      status: 401,
      statusText: 'Unauthorized',
      url: 'https://na1.api.riotgames.com/test',
      method: 'GET',
      headers: {},
    });
    expect(err).toBeInstanceOf(RiotApiError);
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.status).toBe(401);
  });

  it('handles 403 status', () => {
    const err = new ForbiddenError({
      status: 403,
      statusText: 'Forbidden',
      url: 'https://na1.api.riotgames.com/test',
      method: 'GET',
      headers: {},
    });
    expect(err).toBeInstanceOf(RiotApiError);
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.status).toBe(403);
  });

  it('has name "ForbiddenError"', () => {
    const err = new ForbiddenError({
      status: 403,
      statusText: 'Forbidden',
      url: 'https://na1.api.riotgames.com/test',
      method: 'GET',
      headers: {},
    });
    expect(err.name).toBe('ForbiddenError');
  });
});

describe('ServiceUnavailableError', () => {
  const args503 = {
    status: 503,
    statusText: 'Service Unavailable',
    url: 'https://na1.api.riotgames.com/test',
    method: 'GET',
    headers: {},
  };

  it('extends RiotApiError', () => {
    const err = new ServiceUnavailableError(args503);
    expect(err).toBeInstanceOf(RiotApiError);
  });

  it('is instanceof ServiceUnavailableError', () => {
    const err = new ServiceUnavailableError(args503);
    expect(err).toBeInstanceOf(ServiceUnavailableError);
  });

  it('has name "ServiceUnavailableError"', () => {
    const err = new ServiceUnavailableError(args503);
    expect(err.name).toBe('ServiceUnavailableError');
  });
});

describe('instanceof discrimination', () => {
  it('RateLimitError caught by RiotApiError catch', () => {
    const err = new RateLimitError({
      status: 429,
      statusText: 'Too Many Requests',
      url: 'https://na1.api.riotgames.com/test',
      method: 'GET',
      headers: {},
    });
    expect(err).toBeInstanceOf(RiotApiError);
  });

  it('NotFoundError caught by RiotApiError catch', () => {
    const err = new NotFoundError({
      status: 404,
      statusText: 'Not Found',
      url: 'https://na1.api.riotgames.com/test',
      method: 'GET',
      headers: {},
    });
    expect(err).toBeInstanceOf(RiotApiError);
  });

  it('ForbiddenError caught by RiotApiError catch', () => {
    const err = new ForbiddenError({
      status: 403,
      statusText: 'Forbidden',
      url: 'https://na1.api.riotgames.com/test',
      method: 'GET',
      headers: {},
    });
    expect(err).toBeInstanceOf(RiotApiError);
  });

  it('ServiceUnavailableError caught by RiotApiError catch', () => {
    const err = new ServiceUnavailableError({
      status: 503,
      statusText: 'Service Unavailable',
      url: 'https://na1.api.riotgames.com/test',
      method: 'GET',
      headers: {},
    });
    expect(err).toBeInstanceOf(RiotApiError);
  });
});
