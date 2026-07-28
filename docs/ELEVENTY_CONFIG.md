# Eleventy configuration reference

Source file: `eleventy.js` at the repository root.

This document maps every plugin, server option, transform, filter, shortcode, passthrough rule, hook, collection, and the return config to its purpose and signature. Sections follow the order in which they appear in `eleventy.js`.

---

## Section 1 — Plugins

### `eleventyImageTransformPlugin`

```js
config.addPlugin(eleventyImageTransformPlugin, { ... });
```

**Package:** `@11ty/eleventy-img`

Transforms `<img>` and `<picture>` tags in rendered HTML output into responsive `<picture>` sets at build time (or on-request in dev).

| Option | Value | Notes |
| --- | --- | --- |
| `outputDir` | `./build/img/` | Where generated image files are written |
| `urlPath` | `/img/` | URL prefix for `<source srcset>` paths |
| `widths` | `[320, 600, 900, 1280]` | Responsive breakpoints in pixels |
| `formats` | `["avif", "webp", "jpeg", "gif"]` | Output formats; GIF preserved for animation |
| `transformOnRequest` | `isDev` | Skip transform in dev; process on every request instead |
| `failOnError` | `false` | Build continues if a single image fails (e.g., 404 remote) |
| `sharpOptions.animated` | `true` | Preserves animation in GIF/WebP |
| `sharpWebpOptions.animated` | `true` | Preserves animation when encoding to WebP |
| `sharpGifOptions.reoptimise` | `true` | Re-optimises GIF frames to reduce file size |
| `filenameFormat` | function | Deterministic names: `{dir}-{base}-{width}.{format}` |
| `htmlOptions.img.decoding` | `"async"` | Adds `decoding="async"` to all `<img>` |
| `htmlOptions.img.loading` | `"lazy"` | Adds `loading="lazy"` to all `<img>` |
| `htmlOptions.img.sizes` | `"100vw"` | Default `sizes` attribute |

**Filename format:** `{parent-dir-token}-{base-name}-{width}.{format}`, e.g., `blog-my-hero-900.avif`. For remote images the hostname/path segment is used as the dir token.

---

## Section 2 — Server options

```js
config.setServerOptions({ ... });
```

Configures the Eleventy dev server (`@11ty/eleventy-dev-server`):

| Option | Value | Notes |
| --- | --- | --- |
| `showVersion` | `true` | Prints server version on start |
| `liveReload` | `true` | Injects live-reload script |
| `domDiff` | `true` | Applies DOM-diff patches where possible instead of full reload |
| `watch` | `["build/**/*.css"]` | Also reloads on compiled Sass output changes |
| `showAllHosts` | `true` | Logs all local network addresses for device testing |
| `https` | active as `{}` with key/cert properties commented out | Placeholder for local key/cert for HTTP/2 dev |
| `encoding` | `"utf-8"` | File encoding for serving |

---

## Section 3 — Transforms

### `fixImageSrcToAbsolute`

```js
config.addTransform("fixImageSrcToAbsolute", (content, outputPath) => { ... });
```

- **Runs on:** every `.html` output file.
- **Purpose:** Rewrites any `src="…/src/site/images/…"` paths (introduced when the image plugin resolves relative paths during build) to `src="/images/…"` so they match the passthrough-copied URL space.
- **Pattern replaced:** `src="(../)*src/site/images/` → `src="/images/`

---

## Section 4 — Filters

Registered with `config.addFilter(name, fn)`. Available in all Nunjucks, Liquid, and Markdown templates as `{{ value | filterName }}`.

### `dateDisplay`

```njk
{{ dateObj | dateDisplay }}
{{ dateObj | dateDisplay('y') }}
```

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `dateObj` | JS Date | — | The date to format |
| `format` | string | `"d LLL y"` | Luxon format string |

Returns a formatted date string in UTC. Default output: `25 Feb 2026`. Impact stories pass `'y'` to show only the year.

---

### `limitItems`

```njk
{{ array | limitItems(n) }}
```

| Param | Type | Notes |
| --- | --- | --- |
| `array` | Array | Input collection |
| `n` | number | Positive: first N items. Negative: last N items. |

Returns a slice of the array. Passes through non-arrays unchanged.

---

### `ensureTrailingSlash`

```njk
{{ someUrl | ensureTrailingSlash }}
```

Appends `/` if the string doesn't already end with one. Used to normalise canonical URLs in RSS and sitemap templates.

---

### `rssDate`

```njk
{{ dateObj | rssDate }}
```

Returns an ISO 8601 timestamp (e.g., `2026-02-25T00:00:00.000Z`) suitable for `<pubDate>` in RSS feeds.

---

### `rssLastUpdatedDate`

```njk
{{ posts | rssLastUpdatedDate }}
```

Finds the most-recently-dated item in a collection array and returns its ISO 8601 timestamp. Falls back to `DateTime.now()` for empty arrays.

---

### `emdash`

```njk
{{ value | emdash }}
```

Converts every `--` in the string to `—`. Applied to `teaser` in the post layout. Also applied at the Markdown level via `emdashPlugin` so both paths produce consistent typography.

---

### `htmlToAbsoluteUrls`

```njk
{{ content | htmlToAbsoluteUrls(siteBaseUrl) }}
```

| Param | Type | Notes |
| --- | --- | --- |
| `content` | HTML string | The feed item body |
| `siteBaseUrl` | string | e.g., `"https://www.allaboutken.com"` |

Rewrites root-relative `href="/…"`, `src="/…"`, and `srcset` entries to absolute URLs. Used in the RSS feed template so feed readers resolve links correctly.

---

### `sanitizeFeedHtml`

```njk
{{ content | sanitizeFeedHtml }}
```

Strips from HTML content:
- `<script>`, `<style>`, `<link>`, `<iframe>` blocks (and their content)
- Inline `style="…"` attributes
- Inline event handler attributes (`on*="…"`)

Used in the RSS feed template to produce safe feed body HTML.

---

### `wordCount`

```njk
{{ content | wordCount }}
```

Returns an integer word count computed from an HTML string. Strips `<script>`, `<style>`, `<iframe>`, `<noscript>` blocks and all remaining HTML tags before splitting on whitespace. Returns `0` on error or empty input. Displayed in the post byline as `N words`.

---

### `formatNumber`

```njk
{{ value | formatNumber }}
{{ value | formatNumber('de-DE') }}
```

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | number | — | The number to format |
| `locale` | string | `"en-US"` | BCP 47 locale for `toLocaleString` |

Returns a locale-formatted number string (e.g., `1,234`). Passes non-finite values back as strings.

### `docRef`

```njk
{{ page | docRef }}  {# → "AAK-20260626" #}
```

Document reference for the post masthead. Derived from the dated file slug (`20260626-down-the-stack` → `AAK-20260626`); falls back to the post date (UTC) if the slug has no date prefix. Returns `null` on failure.

### `impactStoryRef`

```njk
{{ collections.impactStories | impactStoryRef(page.url) }}  {# → "IS-07" #}
```

Stable part number for an impact story, shared by the `/work` spec table and the story's own masthead. Assigned in date-ascending order (oldest story = `IS-01`, ties broken by URL) so publishing a new story appends to the register instead of renumbering it. Returns `null` if the URL is not in the collection. Backdating a story before an existing one is the only thing that moves refs — don't.

---

## Section 5 — Markdown

### Library: `markdown-it`

Configured with:
- `html: true` — raw HTML blocks in `.md` files are passed through.
- `linkify: true` — bare URLs are auto-linked.

### Plugin: `markdown-it-anchor`

Appends a `#` permalink anchor to every heading (`h1`–`h6`). Anchor slugs are ASCII-safe: lowercased, diacritics stripped, punctuation removed, spaces collapsed to `-`.

### Plugin: `emdashPlugin` (custom)

Converts `--` to `—` in Markdown text tokens (runs after `inline` core rule). Keeps em-dash handling consistent between Markdown source and Nunjucks templates that use the `| emdash` filter.

### `markdown` paired shortcode

```njk
{% markdown %}
## Heading

Paragraph with **bold**.
{% endmarkdown %}
```

Renders the block content through `markdown-it`. Used in `.njk` post files to write Markdown without switching file extensions.

---

## Section 6 — Shortcodes

### `codeAndDemo` (paired)

```njk
{% codeAndDemo 'html' %}
<form>...</form>
{% endcodeAndDemo %}
```

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `content` | string | — | HTML/code snippet |
| `lang` | string | `"html"` | Syntax highlight language class |

Outputs a `<div class="kh-demo">` containing:
1. An escaped `<pre><code class="language-{lang}">` block for display.
2. A `<div class="kh-demo__live">` with the raw snippet rendered live.

Outputs a wrapper `<div class="kh-demo" data-pagefind-ignore>` so Pagefind never indexes demo code.

---

### `marginnote` / `pullquote` (paired)

```njk
{% marginnote %}A supporting citation with a [link](https://example.com).{% endmarginnote %}

{% pullquote %}A short phrase lifted verbatim from the paragraph.{% endpullquote %}
```

Margin apparatus for posts. Both render their content as **inline markdown** (links, emphasis, code, `--` em dashes — no blank lines/paragraphs) inside an `<aside>`:

- `marginnote` → `<aside class="kh-marginnote">`. Supplementary citations and context. Indexed and read by assistive tech — real content is allowed here.
- `pullquote` → `<aside class="kh-pullquote" aria-hidden="true" data-pagefind-ignore>`. Repeats a phrase from the surrounding body, so it is hidden from screen readers and search. Never put unique content in one.

Place the shortcode immediately after the paragraph it supports, inside the `{% markdown %}` block. On wide screens (≥1300px) both float into the right gutter beside the post body; below that (and in print) they render in the flow as hairline blocks. Raw `<aside class="kh-marginnote">` HTML still works for older posts. See the [component reference](../src/site/style-guide/components.njk) for the visual spec.

---

### `ogImageUrl` (regular)

```njk
{% ogImageUrl %}
```

No parameters. Returns the Eleventy screenshot-service URL for the current page's social card:

```
https://v1.screenshot.11ty.dev/{encoded-social-url}/opengraph/
```

Where `{encoded-social-url}` is the URI-encoded URL of `https://www.allaboutken.com/social{page.url}`.

Used in `base.njk` to auto-generate `og:image` and `twitter:image` when no explicit `og_image` override is provided in frontmatter.

---

## Section 7 — Passthrough copy

| Source glob | Output path | Notes |
| --- | --- | --- |
| `./src/site/**/*.js` | same relative path | All site JS files (scripts, service worker, semantic-search) |
| `./src/components/ken-favicon/assets` | `assets/ken-favicon/assets/` | Favicon PNG/SVG/manifest files |
| `./src/site/images` | `images/` | All post and page images (referenced as `/images/…` in templates) |
| `./src/components/kh-font` | `assets/kh-font/` | Recursive variable font WOFF2 |
| `./src/site/**/*.html` | same relative path | Legacy Drupal redirect stubs |
| `./src/site/**/*.txt` | same relative path | Downloadable text resources (starter kits, templates) |

**Watch target:** `./src/site/images` — Eleventy watches this directory for changes in dev so image updates trigger rebuilds.

**Service worker note:** because `./src/site/**/*.js` is passthrough-copied, `src/site/sw.js` is emitted as `/sw.js` (root URL), which matches registration in `src/site/scripts.js` (`navigator.serviceWorker.register('/sw.js', { scope: '/' })`). See [`OFFLINE_SERVICE_WORKER.md`](OFFLINE_SERVICE_WORKER.md) for runtime/offline behavior details.

---

## Section 8 — Pagefind hook

```js
config.on('eleventy.after', () => { ... });
```

Runs `pagefind --site build --exclude-selectors "pre, code"` after every Eleventy build:

- **Production** (`eleventy.js` with `ELEVENTY_ENV != 'development'`): runs synchronously with `execSync`; build fails if Pagefind fails.
- **Development**: runs asynchronously with `exec` so dev rebuilds are not blocked. A reference to the child process is kept so overlapping rebuilds kill the previous run before starting a new one.

The `--exclude-selectors "pre, code"` flag prevents code blocks from polluting keyword search results.

---

## Section 9 — Collections

### `impactStories`

```js
config.addCollection('impactStories', ...);
```

All pages tagged `impact-stories`, sorted newest-first by `date`. Used to power the `/work/` listing.

---

### `blogPosts`

```js
config.addCollection('blogPosts', ...);
```

All pages tagged `posts` that are **not** tagged `case-studies` or `impact-stories`, sorted newest-first. Used to power the `/blog/` listing.

---

### `allContent`

```js
config.addCollection('allContent', ...);
```

All pages tagged `posts` or `digesting`, sorted newest-first. Used for the combined content stream, RSS feeds, and semantic search indexing.

---

## Section 10 — Return config

```js
return {
  dir: {
    input: "src/site",
    output: "build",
    data: "_data",
    includes: "_includes"
  },
  templateFormats: ["njk", "md", "css", "js"],
  htmlTemplateEngine: ["njk", "md"],
  markdownTemplateEngine: "njk",
  passthroughFileCopy: true
};
```

| Key | Value | Notes |
| --- | --- | --- |
| `dir.input` | `src/site` | All template source files live here |
| `dir.output` | `build` | Final HTML, images, CSS go here |
| `dir.data` | `_data` | Global data files (`siteConfig.json`, `garage.json`) |
| `dir.includes` | `_includes` | Layouts and partials |
| `templateFormats` | `njk, md, css, js` | Files with these extensions are processed |
| `htmlTemplateEngine` | `[njk, md]` | HTML files use Nunjucks + Markdown |
| `markdownTemplateEngine` | `njk` | `.md` files are processed as Nunjucks first, then Markdown |
| `passthroughFileCopy` | `true` | Enables the passthrough copy rules above |
