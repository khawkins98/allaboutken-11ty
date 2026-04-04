# Tests

## Running tests

- **Single run:** `yarn test`
- **Watch mode:** `npx vitest`

## Setup

Tests use [vitest](https://vitest.dev/). Pure utility filters have been extracted
from `eleventy.js` into `src/lib/filters.js` so they can be tested in isolation
without bootstrapping the full Eleventy config.

## Flakiness Analysis

The following flakiness risks have been identified in this project:

### (a) Date/timezone sensitivity

`dateDisplay` and `rssDate` use Luxon with `zone: "utc"` which prevents timezone
flakiness, but `rssLastUpdatedDate` falls back to `DateTime.now()` for empty
input, making its output non-deterministic. Tests for that branch verify only
that the return value is a valid ISO string rather than asserting an exact value.

### (b) Locale sensitivity

`formatNumber` uses `Number.toLocaleString()` -- output varies across Node.js
versions and OS locale data (ICU). Tests pin to `en-US` but CI environments may
have different ICU data compiled into their Node.js builds, causing assertions
on formatted output to fail.

### (c) Pagefind child process race condition

In `eleventy.js`, the `eleventy.after` hook spawns pagefind via `exec()`. During
dev rebuilds, overlapping builds kill the previous child process. There is a
TOCTOU window between checking `pagefindChild` and calling `.kill()` where the
process could exit naturally, and overlapping `exec()` calls could corrupt the
search index. This is not tested because it requires integration testing with
Eleventy's event system.

### (d) Embeddings network dependency

`scripts/generate-embeddings.mjs` downloads a HuggingFace model at build time.
No retry logic or offline fallback exists -- flaky network conditions cause
non-deterministic build failures.