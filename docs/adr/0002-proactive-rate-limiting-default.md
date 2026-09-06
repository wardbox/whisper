# Proactive rate limiting by default

Whisper parses Riot's `X-App-Rate-Limit`, `X-App-Rate-Limit-Count`,
`X-Method-Rate-Limit`, and `X-Method-Rate-Limit-Count` headers and queues
requests *before* a limit is reached, rather than firing freely and retrying on
429. This proactive strategy is the default. Setting `rateLimiter: false`
disables both the proactive queue and the client-side 429 retries; there is no
separate reactive mode.

## Considered Options

- **Reactive retry-on-429** — what most wrappers do. Simple, but wastes the
  request that trips the limit and leaks Riot's rate-limit internals to users.
- **Proactive queuing (chosen)** — the library's core differentiator and a
  "magic where it makes sense" call: users get correct limiting without
  understanding the headers. Costs a stateful limiter in the request path,
  which reshapes the core client and is expensive to unwind later.
