import { describe, expect, it } from 'vitest';
import { executePipeline } from './middleware.js';
import type { ApiResponse, Middleware, RequestContext } from './types.js';

function makeContext(overrides?: Partial<RequestContext>): RequestContext {
  return {
    url: 'https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/abc',
    method: 'GET',
    headers: { 'X-Riot-Token': 'RGAPI-test' },
    route: 'na1',
    methodId: 'summoner-v4.getByPuuid',
    ...overrides,
  };
}

function makeResponse(overrides?: Partial<ApiResponse>): ApiResponse {
  return {
    data: { name: 'TestSummoner' },
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...overrides,
  };
}

function makeExecutor(response?: ApiResponse): (ctx: RequestContext) => Promise<ApiResponse> {
  return async () => response ?? makeResponse();
}

describe('executePipeline', () => {
  it('calls executor directly with empty middleware array', async () => {
    const expected = makeResponse();
    const result = await executePipeline([], makeContext(), makeExecutor(expected));
    expect(result).toEqual(expected);
  });

  it('runs onRequest hooks in forward order [0, 1, 2]', async () => {
    const order: number[] = [];

    const middleware: Middleware[] = [
      {
        name: 'first',
        onRequest: (ctx) => {
          order.push(0);
          return ctx;
        },
      },
      {
        name: 'second',
        onRequest: (ctx) => {
          order.push(1);
          return ctx;
        },
      },
      {
        name: 'third',
        onRequest: (ctx) => {
          order.push(2);
          return ctx;
        },
      },
    ];

    await executePipeline(middleware, makeContext(), makeExecutor());
    expect(order).toEqual([0, 1, 2]);
  });

  it('runs onResponse hooks in reverse order [2, 1, 0]', async () => {
    const order: number[] = [];

    const middleware: Middleware[] = [
      {
        name: 'first',
        onResponse: (res) => {
          order.push(0);
          return res;
        },
      },
      {
        name: 'second',
        onResponse: (res) => {
          order.push(1);
          return res;
        },
      },
      {
        name: 'third',
        onResponse: (res) => {
          order.push(2);
          return res;
        },
      },
    ];

    await executePipeline(middleware, makeContext(), makeExecutor());
    expect(order).toEqual([2, 1, 0]);
  });

  it('onRequest hook can modify RequestContext and downstream sees it', async () => {
    const middleware: Middleware[] = [
      {
        name: 'add-header',
        onRequest: (ctx) => ({
          ...ctx,
          headers: { ...ctx.headers, 'X-Custom': 'added' },
        }),
      },
      {
        name: 'check-header',
        onRequest: (ctx) => {
          expect(ctx.headers['X-Custom']).toBe('added');
          return ctx;
        },
      },
    ];

    let capturedCtx: RequestContext | undefined;
    const executor = async (ctx: RequestContext) => {
      capturedCtx = ctx;
      return makeResponse();
    };

    await executePipeline(middleware, makeContext(), executor);
    expect(capturedCtx?.headers['X-Custom']).toBe('added');
  });

  it('onResponse hook can modify ApiResponse', async () => {
    const middleware: Middleware[] = [
      {
        name: 'add-response-header',
        onResponse: (res) => ({
          ...res,
          headers: { ...res.headers, 'X-Response-Custom': 'modified' },
        }),
      },
    ];

    const result = await executePipeline(middleware, makeContext(), makeExecutor());
    expect(result.headers['X-Response-Custom']).toBe('modified');
  });

  it('middleware with only onRequest is valid (skipped during response phase)', async () => {
    const order: string[] = [];

    const middleware: Middleware[] = [
      {
        name: 'request-only',
        onRequest: (ctx) => {
          order.push('request');
          return ctx;
        },
      },
    ];

    const result = await executePipeline(middleware, makeContext(), makeExecutor());
    expect(order).toEqual(['request']);
    expect(result).toBeDefined();
  });

  it('middleware with only onResponse is valid (skipped during request phase)', async () => {
    const order: string[] = [];

    const middleware: Middleware[] = [
      {
        name: 'response-only',
        onResponse: (res) => {
          order.push('response');
          return res;
        },
      },
    ];

    const result = await executePipeline(middleware, makeContext(), makeExecutor());
    expect(order).toEqual(['response']);
    expect(result).toBeDefined();
  });

  it('async onRequest hooks are awaited', async () => {
    const order: number[] = [];

    const middleware: Middleware[] = [
      {
        name: 'async-first',
        onRequest: async (ctx) => {
          await new Promise((r) => setTimeout(r, 5));
          order.push(0);
          return ctx;
        },
      },
      {
        name: 'sync-second',
        onRequest: (ctx) => {
          order.push(1);
          return ctx;
        },
      },
    ];

    await executePipeline(middleware, makeContext(), makeExecutor());
    expect(order).toEqual([0, 1]);
  });

  it('async onResponse hooks are awaited', async () => {
    const order: number[] = [];

    const middleware: Middleware[] = [
      {
        name: 'sync-first',
        onResponse: (res) => {
          order.push(0);
          return res;
        },
      },
      {
        name: 'async-second',
        onResponse: async (res) => {
          await new Promise((r) => setTimeout(r, 5));
          order.push(1);
          return res;
        },
      },
    ];

    await executePipeline(middleware, makeContext(), makeExecutor());
    // Reverse order: second (1) then first (0)
    expect(order).toEqual([1, 0]);
  });

  it('onRequest error bubbles up and skips downstream middleware and executor', async () => {
    const order: string[] = [];

    const middleware: Middleware[] = [
      {
        name: 'A',
        onRequest: () => {
          order.push('A-req');
          throw new Error('A failed');
        },
        onResponse: (res) => {
          order.push('A-res');
          return res;
        },
      },
      {
        name: 'B',
        onRequest: (ctx) => {
          order.push('B-req');
          return ctx;
        },
      },
    ];

    await expect(executePipeline(middleware, makeContext(), makeExecutor())).rejects.toThrow('A failed');
    expect(order).toEqual(['A-req']);
  });

  it('executor error bubbles up to caller', async () => {
    const executor = async () => {
      throw new Error('executor failed');
    };

    await expect(executePipeline([], makeContext(), executor)).rejects.toThrow('executor failed');
  });

  it('onResponse error bubbles up to caller', async () => {
    const middleware: Middleware[] = [
      {
        name: 'fail-on-response',
        onResponse: () => {
          throw new Error('response hook failed');
        },
      },
    ];

    await expect(executePipeline(middleware, makeContext(), makeExecutor())).rejects.toThrow(
      'response hook failed',
    );
  });

  it('full pipeline: request forward, then response reverse', async () => {
    const order: string[] = [];

    const middleware: Middleware[] = [
      {
        name: 'A',
        onRequest: (ctx) => {
          order.push('A-req');
          return ctx;
        },
        onResponse: (res) => {
          order.push('A-res');
          return res;
        },
      },
      {
        name: 'B',
        onRequest: (ctx) => {
          order.push('B-req');
          return ctx;
        },
        onResponse: (res) => {
          order.push('B-res');
          return res;
        },
      },
      {
        name: 'C',
        onRequest: (ctx) => {
          order.push('C-req');
          return ctx;
        },
        onResponse: (res) => {
          order.push('C-res');
          return res;
        },
      },
    ];

    const executor = async (ctx: RequestContext) => {
      order.push('execute');
      return makeResponse();
    };

    await executePipeline(middleware, makeContext(), executor);
    expect(order).toEqual(['A-req', 'B-req', 'C-req', 'execute', 'C-res', 'B-res', 'A-res']);
  });
});
