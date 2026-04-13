---
status: partial
phase: 07-hardening-and-publish
source: [07-VERIFICATION.md]
started: 2026-04-11T17:35:00-07:00
updated: 2026-04-11T17:35:00-07:00
---

## Current Test

[awaiting human testing]

## Tests

### 1. CI matrix validation (SC-3)
expected: Push a PR and observe all CI jobs pass — build+test+check+gates and the 4-leg smoke matrix (node-esm, node-cjs, deno, bun). Especially verify the Deno leg which cannot be tested locally.
result: [pending]

### 2. Manual setup + first publish (SC-4)
expected: Configure NPM_TOKEN as GitHub secret, set up branch protection, run `npm publish --provenance --dry-run` successfully, then publish `@wardbox/whisper` to npm. Package should be installable via `npm install @wardbox/whisper` in a fresh project.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
