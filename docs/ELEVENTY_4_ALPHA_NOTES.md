# Eleventy 4 alpha migration notes

Status: experimental; project-side blocker worked around and upstream
reproduction prepared.

Tested on 24 August 2026 with Node 24.18.0, Yarn 1.22.22 and
`@11ty/eleventy` 4.0.0-alpha.10 (pinned exactly). Eleventy brings in
`@11ty/nunjucks` 4.0.0-alpha.3.

## Upgrade changes

- Pinned `@11ty/eleventy` to `4.0.0-alpha.10` rather than using the moving
  `canary` tag.
- Raised the declared Node minimum from 18 to 22.15. Alpha.8 raised Eleventy
  4's minimum from Node 20.19 to 22.15.
- No template syntax has been changed yet.

## Resolved locally: collection `templateContent` inside Nunjucks filters

The initial alpha build silently lost derived data from three corpus-statistics
views:

- `/archive/` renders “entries” with no number before it.
- `/stats/` loses the whole “At a glance” panel and every row in “By year”.
- The register-glance panels on `/`, `/all/`, and `/blog/` are absent.

The affected filters are `corpusStats` and `statsByYear` in
`config/eleventy/stats.js`. Both read `item.templateContent` from items in a
collection. Under v4, that property can throw
`TemplateContentPrematureUseError` while templates are being rendered.

Eleventy appears designed to catch that error and retry the template after the
collection content is ready. With the existing defensive `try`/`catch` in the
filters, however, the error is converted to `null` or `[]`, so the build
succeeds with missing output. Removing the catches exposes the deeper problem:
the async Nunjucks layer wraps the retry signal in `BuildAwesomeNunjucksError`
and the build exits instead of retrying it.

The standalone reproduction is in
`reproductions/eleventy-v4-template-content-filter/`. Its normal build fails
with this chain:

   ```text
   BuildAwesomeNunjucksError: Error in Nunjucks Filter `corpusStats`
   TemplateContentPrematureUseError: Tried to use templateContent too early
   ```

Its control build catches the same error and renders `Rendered words: 0`,
demonstrating the silent-data-loss form seen here. The included diagnostic
patch makes `ErrorUtil.isPrematureTemplateContentError()` recursively inspect
`cause` and `originalError` with cycle protection. Applied to alpha.10, the
normal build retries successfully and renders the correct `Rendered words: 6`.
This is a plausible upstream fix because Eleventy owns both the retry mechanism
and the Nunjucks integration; upstream may prefer to preserve the original
signal at the integration boundary instead.

The adopted project-side workaround is `scripts/compute-corpus-stats.mjs`. Entry
layouts place HTML comments around the rendered entry body and identify the
entry kind and date. The script runs after the bootstrap Eleventy pass, reads
those marked bodies, excludes noindex entries, and writes ignored derived data
to `src/site/_data/corpusStats.json` for the final pass.

This preserves the old figures exactly: 104 entries, 91,067 words, median 665,
and the same per-year totals. It also restores Pagefind's 7,615-word baseline.
The old `corpusStats` and `statsByYear` filters have been removed, so normal
template rendering no longer reads collection `templateContent`.

Tradeoff: a fast `yarn eleventy` or `yarn dev` uses the most recently generated
file and has no statistics data after a completely fresh checkout. This matches
the existing derived-data workflow: run `yarn build` once, then use fast local
commands.

Alternatives considered but not adopted:

- Calculate corpus statistics from raw source files. This avoids render-order
  coupling but changes the meaning of the word counts because Nunjucks and
  Markdown have not rendered yet.
- Stop catching the premature-use error only after Eleventy/Nunjucks preserves
  the retry signal through filter errors.

## Expected output changes

Eleventy 4's HTML transform serializes boolean attributes in HTML form:

```diff
-<input checked="">
+<input checked>
```

The same applies to `async`, `defer`, `crossorigin`, `allowfullscreen`,
`data-pagefind-ignore`, and `data-pagefind-body`. This is valid HTML and needs
no project change. It accounts for most of the generated HTML diff.

The generator metadata also changes from `Eleventy v3.1.6` to
`Eleventy (Build Awesome) v4.0.0`.

## Nunjucks async changes to explore

The 11ty Nunjucks fork has converted its internals to async/await. Ordinary
`{% for %}`, `{% set %}`, and macros can now contain asynchronous work; the
older `asyncEach` and `setAsync` workarounds should no longer be necessary.
This project does not currently use those older async-specific tags, so there
is nothing to simplify immediately.

Useful follow-up experiments:

- Add a temporary async filter and exercise it inside `set`, `for`, and a macro
  with child content.
- Check whitespace-control behavior around asynchronous values; this site uses
  `{%-` and `-%}` extensively.
- Exercise watch mode after edits to layouts and includes. Alpha.10 is a
  hotfix for a layout-cache invalidation regression.
- Verify whether the new sequential event-emitter default changes the ordering
  of the `eleventy.after` Pagefind hook relative to any future hooks.

## Test record

Baseline with Eleventy 3.1.6:

- `yarn clean && yarn sass && yarn eleventy`: passed; 333 files written, 421
  images optimized, 114.39 seconds.
- `yarn lint:links`: one expected fast-build failure for
  `/semantic-search/vectors.json`, which is generated only by the full build.

Eleventy 4.0.0-alpha.10:

- `yarn clean && yarn sass && yarn eleventy`: exits successfully with the
  defensive catches present; 333 files written, 426 images optimized, 134.10
  seconds.
- No built HTML contains the development-only `/.11ty/image` endpoint.
- File counts are unchanged (2,467 files in both build trees).
- Before the workaround, Pagefind indexed the same 165 pages but its word total
  fell from 7,615 to 7,593 because the missing stats output removed indexable
  text. The workaround restores 7,615.
- A generated-output comparison found the missing statistics described above,
  boolean-attribute serialization, generator metadata, Pagefind's consequent
  index changes, and live feedback-counter image differences.
- The standalone reproduction fails without the proposed patch, its defensive
  control renders `0`, and the patched Eleventy build renders the correct `6`.

The image totals and timings are only single-run observations. Image transforms
are intermittent in this project, so neither difference should be treated as a
v4 regression without repeated clean builds.

## Upstream references

- Eleventy 4.0.0-alpha.10 release:
  <https://github.com/11ty/buildawesome/releases/tag/v4.0.0-alpha.10>
- Eleventy 4.0.0-alpha.9 release (async Nunjucks and sequential events):
  <https://github.com/11ty/buildawesome/releases/tag/v4.0.0-alpha.9>
- Nunjucks 4.0.0-alpha.3 full-async release:
  <https://github.com/11ty/nunjucks/releases/tag/v4.0.0-alpha.3>
- Eleventy 4.0.0-alpha.6 release (Node 20 and the `@11ty/nunjucks` fork):
  <https://github.com/11ty/buildawesome/releases/tag/v4.0.0-alpha.6>
