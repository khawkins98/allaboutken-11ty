# Eleventy 4 alpha: wrapped `TemplateContentPrematureUseError`

Minimal reproduction for `@11ty/eleventy` 4.0.0-alpha.10 with
`@11ty/nunjucks` 4.0.0-alpha.3.

## What it demonstrates

An index template passes a tagged collection to a synchronous Nunjucks filter.
The filter reads each collection item's rendered `templateContent`, a supported
Eleventy collection property. When the posts have not rendered yet, Eleventy
throws `TemplateContentPrematureUseError` so it can defer and retry the index.

The Nunjucks integration wraps that signal deeply enough that
`ErrorUtil.isPrematureTemplateContentError()` does not recognize it. The build
fails instead of retrying.

## Reproduce

```bash
yarn install --frozen-lockfile
yarn build
```

Expected failure chain:

```text
BuildAwesomeNunjucksError: Error in Nunjucks Filter `renderedWordCount`
TemplateContentPrematureUseError: Tried to use templateContent too early
```

The control command catches the error, as the source application originally
did:

```bash
yarn build:control
cat _site/index.html
```

The build succeeds but incorrectly prints `Rendered words: 0`.

## Proposed fix

`patches/recursive-premature-error-detection.patch` changes
`ErrorUtil.isPrematureTemplateContentError()` to walk nested `cause` and
`originalError` links with cycle protection. After applying it to the installed
Eleventy package:

```bash
patch -p1 < patches/recursive-premature-error-detection.patch
yarn build
cat _site/index.html
```

The expected successful output is `Rendered words: 6`.

This patch is intentionally a diagnostic proposal, not a vendored project
dependency. Upstream may prefer a shared recursive error-unwrapping helper or
to preserve the original retry signal at the Nunjucks boundary.
