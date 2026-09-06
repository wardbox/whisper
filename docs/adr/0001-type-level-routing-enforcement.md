# Type-level routing enforcement

Riot splits endpoints across two incompatible routing kinds — Platform routes
(`na1`, `euw1`, …) and Regional routes (`americas`, `europe`, …) — and calling
an endpoint with the wrong kind fails at runtime. We model each API method to
accept only its correct routing kind, so mixing them is a compile error rather
than a 404 in production.

## Considered Options

- **Plain string routes** — simplest, most ergonomic, but pushes a whole class
  of Riot-specific mistakes to runtime.
- **Type-level enforcement (chosen)** — trades a little ergonomic friction
  (contributors can't just pass any string) for making invalid routing
  unrepresentable. Aligns with the "wide pit of success" design goal.
