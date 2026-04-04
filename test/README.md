# Tests

## Setup

Tests use [vitest](https://vitest.dev/). No extra setup required beyond
the standard `yarn install`.

## Running tests

```bash
yarn test          # Single run (used in CI)
npx vitest --watch # Watch mode for development
```

## Flakiness analysis

The following patterns in this codebase are prone to test flakiness.
Each is documented here with its mitigation strategy.

### (a) Date/timezone sensitivity in dateDisplay and rssDate

Both filters accept a JS Date and format it using Luxon. If the
implementation did not pin `zone: "utc"`, the same Date could produce
different formatted strings depending on the CI runner's local timezone.

**Mitigation:** The filter implementations always pass `{ zone: "utc" }`
to Luxon, and the tests construct Dates with explicit UTC timestamps
(e.g. `new Date('2024-01-15T00:00:00Z')`). This makes them
deterministic regardless of the host timezone.

### (b) Locale sensitivity in formatNumber

Number formatting via `toLocaleString()` varies by OS/ICU version.
Different CI images may produce different thousands separators or
grouping rules.

**Mitigation:** The filter accepts an explicit `locale` parameter that
defaults to `'en-US'`. Tests always pass an explicit locale so results
are deterministic. The `de-DE` test intentionally avoids asserting an
exact string and instead checks that the output differs from the raw
number.

### (c) Pagefind child process race condition

In `eleventy.js`, the `eleventy.after` hook runs Pagefind as a
background child process in dev mode. When overlapping dev rebuilds
trigger the hook rapidly, the code calls `pagefindChild.kill()` before
spawning a replacement. However, there is no `await` on the old
process's exit, so the new process could start writing to the search
index before the old one has fully released its file handles. This
could corrupt the search index in rare timing windows.

This is not tested directly (it requires the full Eleventy build) but
is noted here as a known flakiness risk in the dev workflow.

### (d) Embeddings script network dependency

The `scripts/generate-embeddings.mjs` script downloads a HuggingFace
model at build time. It has no retry logic and depends on network and
model availability. It is excluded from `yarn dev` and from the test
suite. If the model endpoint is unreachable or the model is updated in
a breaking way, the full `yarn build` will fail. There is no test
isolation or mock for this dependency.
