import type { ApiResponse, Middleware, RequestContext } from './types.js';

/**
 * Execute middleware pipeline around a request executor.
 * onRequest hooks run in registration order [0, 1, 2].
 * onResponse hooks run in reverse order [2, 1, 0].
 *
 * @example
 * ```typescript
 * const response = await executePipeline(
 *   [loggingMiddleware, metricsMiddleware],
 *   requestContext,
 *   (ctx) => fetch(ctx.url, { method: ctx.method, headers: ctx.headers })
 * );
 * ```
 */
export async function executePipeline(
  middleware: Middleware[],
  context: RequestContext,
  executor: (ctx: RequestContext) => Promise<ApiResponse>,
): Promise<ApiResponse> {
  // Run onRequest in forward order
  let ctx = context;
  for (const mw of middleware) {
    if (mw.onRequest) {
      ctx = await mw.onRequest(ctx);
    }
  }

  // Execute the actual request
  let response = await executor(ctx);

  // Run onResponse in reverse order
  for (let i = middleware.length - 1; i >= 0; i--) {
    const mw = middleware[i] as (typeof middleware)[number];
    if (mw.onResponse) {
      response = await mw.onResponse(response, ctx);
    }
  }

  return response;
}
