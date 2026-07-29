# Frontmatter reference

Every field that templates read from YAML frontmatter across post, page, and digest content.

## Quick lookup

| Field | Required | Templates | Purpose |
| --- | --- | --- | --- |
| [`title`](#title) | ✅ Required | all | Page title, `<h1>`, `<title>`, OG title fallback |
| [`layout`](#layout) | ✅ Required | all | Which layout template renders the page |
| [`date`](#date) | ✅ Required (posts) | post, digesting | Publication date |
| [`tags`](#tags) | ✅ Required (posts) | post, base | Collection routing and OG type |
| [`teaser`](#teaser) | Recommended | post, listing partials, base | Short description for meta, intro para, cards, OG description |
| [`image`](#image) | Optional | post | Hero image path |
| [`image_meta`](#image_meta) | Optional | post, base | Caption, credit, and alt text for the hero image |
| [`topics`](#topics) | Optional | post, digesting | Subject taxonomy, controlled vocabulary (shown below the date) |
| [`series`](#series) | Optional | post | Name of a multi-part series this post belongs to |
| [`series_part`](#series_part) | Optional | post | This post's position in that series |
| [`permalink`](#permalink) | Optional | all | Override the default output URL |
| [`og_image`](#og_image) | Optional | base | Full-URL override for social card image |
| [`og_title`](#og_title) | Optional | base | Override for OG/Twitter title |
| [`og_description`](#og_description) | Optional | base | Override for OG/Twitter description |
| [`noindex`](#noindex) | Optional | base | Add `noindex` robots meta tag |
| [`comment`](#comment) | Optional | post | Hide the comment/feedback section |
| [`updated`](#updated) | Optional | post | Last-modified date for Schema.org `dateModified` |
| [`lastUpdated`](#lastupdated) | Optional | pages | Last-modified date shown on standalone pages |
| [`digest_link`](#digest_link) | Optional | digesting | URL for the "Learn more at the source" button |
| [`href`](#href) | Optional | post | Wraps the hero image in a link |
| [`org`](#org) | Optional | post | Organisation name for impact stories |
| [`kens_status`](#kens_status) | Optional | — | Editorial workflow marker (not rendered) |
| [`oldurl`](#oldurl) | Optional | — | Legacy Drupal URL (used for passthrough redirects) |
| [`bodyClass`](#bodyclass) | Optional | base | Extra CSS class on `<body>` |
| [`templateEngineOverride`](#templateengineoverride) | Optional | layouts | Force a specific template engine for the file |

---

## Field details

### `title`

```yaml
title: "My post title"
```

- **Required.** Used in `<title>`, `<h1>`, Schema.org `headline`, OG/Twitter `title` (as fallback).
- Appears verbatim — no Markdown processing.

---

### `layout`

```yaml
layout: layouts/post.njk
```

- **Required for most pages.** Relative to `src/site/_includes/`.
- Common values:
  | Value | Use case |
  | --- | --- |
  | `layouts/post.njk` | Blog posts and impact stories |
  | `layouts/base.njk` | Standalone pages |
  | `layouts/digesting.njk` | "Digesting" short-form entries |

---

### `date`

```yaml
date: 2026-02-25
```

- **Required for posts.** ISO 8601 date string (`YYYY-MM-DD`).
- Controls collection sort order (newest-first).
- Passed to `| dateDisplay` filter (outputs e.g. `25 Feb 2026`) or `| dateDisplay('y')` (year only for impact stories).
- Passed to `| rssDate` for ISO 8601 in RSS feeds.

---

### `tags`

```yaml
tags:
  - posts
  - impact-stories
```

Or as a scalar string for a single tag:

```yaml
tags: posts
```

- Controls which Eleventy collections include the page:
  | Tag value | Collection(s) | Effect |
  | --- | --- | --- |
  | `posts` | `blogPosts`, `allContent` | Included in blog; sets `og:type` to `article` |
  | `impact-stories` | `impactStories` | Breadcrumb becomes `← Work`; excluded from `blogPosts` |
  | `digesting` | `allContent` | Included in all-content stream |
  | `case-studies` | neither `blogPosts` nor `impactStories` | Excluded from the main blog listing |
  | `note` | — | Shows a "short-form note" banner in the post body |

- A page tagged `posts` + `impact-stories` appears under `/work/` breadcrumb but **not** in the blog listing.

---

### `teaser`

```yaml
teaser: "A one-sentence hook for the post."
```

- Rendered as the lead paragraph (`kh-text-body--1`) inside the post body.
- Used as `<meta name="description">`, `og:description`, and `twitter:description` (falling back to `siteConfig.siteInformation.short_description` if absent).
- Also used by listing templates/partials (for example `post-summary.njk`) as summary copy.
- Processed by the `| emdash` filter: write `--` in the teaser and it renders as `—`.
- Avoid HTML in teasers — social cards strip tags with `| striptags`.

---

### `image`

```yaml
image: /blog/my-hero.jpg
```

- Path to the hero image. **Do not include `/images/` — the build adds that prefix automatically.**
  - Write: `image: /blog/my-hero.jpg`
  - Rendered src: `/images/blog/my-hero.jpg`
  - Source file location: `src/site/images/blog/my-hero.jpg`
- The post layout wraps it in a `<figure>` with optional caption and credit from `image_meta`.
- The `eleventyImageTransformPlugin` generates responsive `<picture>` sets at build time.
- Used in Schema.org `BlogPosting.image` (`og:image` is **not** derived from this field — see [`og_image`](#og_image)).

> **Gotcha:** `image` is for in-page hero images only. The social sharing card (`og:image`) is auto-generated via a screenshot service. Override it with `og_image`.

---

### `image_meta`

```yaml
image_meta:
  text: "Caption text for the figure."
  credit: 'Photo: <a href="https://example.com">Author</a>.'
  altext: "Alt text for the image."
```

- All sub-fields are optional.
- `text` → rendered as `<figcaption>`.
- `credit` → rendered as `<small class="kh-figure__credit">`. HTML is allowed (safe-printed).
- `altext` (or `alt`) → used for `<img alt="...">` in `layouts/post.njk`; both are checked and `altext` takes precedence.
- `alt` (only) is used for `og:image:alt` and `twitter:image:alt` in `layouts/base.njk`.
- For Ken's own photos use: `credit: "Own work."` (not "Photo by Ken Hawkins").

---

### `topics`

```yaml
topics:
  - web development
  - Eleventy
  - static sites > incremental builds
```

**Use the controlled vocabulary.** The 31 approved topics and their definitions
are in [`TOPIC_TAXONOMY.md`](./TOPIC_TAXONOMY.md). Pick 2–5, most specific
first. Do not invent a new top-level topic without adding it there — the
taxonomy was consolidated from 158 ad-hoc terms precisely because 73% of them
had exactly one post and could not be browsed.

**Hierarchical topics.** A topic may carry free-form detail after a `>`:

```yaml
  - AI > Claude Code
  - cloud infrastructure > Cloudflare Workers
```

The part before `>` is the **parent** — it must be from the controlled
vocabulary, and it is the only part that groups or counts. The part after is
free-form detail; it displays but never forms a bucket. This is how you keep
specificity without recreating a long tail of one-post topics.

**Use `>` and not `:`.** YAML parses an unquoted `- a: b` list item as an
object rather than a string, which would give a list of mixed types. Quoting
would work but fails silently the day someone forgets, so the separator is a
greater-than sign.

- Not used for collection filtering — `tags` does that. Topics are subject
  matter only.

---

### `series`

```yaml
series: Content Action Model
series_part: 2
```

Groups an ordered, multi-part series. Renders as "Part 2 of 4 in Content
Action Model" above the post body, with every part listed and linked.

A series is deliberately **not** a topic: it is ordered, and a post belongs to
exactly one. Topics have neither property, so squeezing a series into them
loses the sequence.

- Use the same `series` string, spelled identically, on every part.
- The nav only renders when two or more posts share the name.

---

### `series_part`

An integer giving reading order within the series. Ties fall back to date.
Reading order need not match publication order — an introduction published the
same day as an origin story can still be part 1.

---

### `permalink`

```yaml
permalink: /work/2019/impact-story-embl-visual-framework/
```

- Overrides the default Eleventy-generated URL.
- Use a leading `/` and a trailing `/`.
- Required when the post slug doesn't match the desired public URL (e.g., impact stories under `/work/`).

---

### `og_image`

```yaml
og_image: "https://www.allaboutken.com/images/blog/my-image.jpg"
```

- **Full absolute URL required.**
- Overrides the dynamic screenshot service for `og:image` and `twitter:image`.
- If absent, `{% ogImageUrl %}` shortcode generates a screenshot URL automatically.

---

### `og_title`

```yaml
og_title: "Custom social card title"
```

- Overrides the default `{title} | All about Ken Hawkins` for OG/Twitter title.

---

### `og_description`

```yaml
og_description: "Custom description for social sharing."
```

- Overrides the `teaser` (or site default) for OG/Twitter description.

---

### `noindex`

```yaml
noindex: true
```

- When `true`, adds `<meta name="robots" content="noindex,follow">` to the page `<head>`.
- Used for drafts, staging previews, or utility pages that should not appear in search results.

---

### `comment`

```yaml
comment: false
```

- Default is effectively `true` (the comment/feedback section renders unless explicitly suppressed).
- Set to `false` to hide the "Comment?" section and the floating thumb button at the bottom of post pages.

---

### `updated`

```yaml
updated: 2026-03-01
```

- ISO 8601 date. Used as `dateModified` in Schema.org `BlogPosting` JSON-LD.
- Falls back to `date` if absent.

---

### `lastUpdated`

```yaml
lastUpdated: 2026-05-09
```

- Used on standalone pages (e.g., `garage.njk`) where `updated` is not conventional.
- Not rendered automatically — templates must explicitly output it.

---

### `digest_link`

```yaml
digest_link: "https://example.com/original-article"
```

- **Only meaningful with `layouts/digesting.njk`.**
- Renders a "Learn more at the source" button at the bottom of the digesting entry.

---

### `href`

```yaml
href: "https://example.com/project"
```

- When present, wraps the hero `<img>` in an `<a href="{{ href }}">` link.

---

### `org`

```yaml
org: EMBL
```

- Organisation short name for impact stories.
- Used in posts that import `partials/orgs.njk` via `{% from "partials/orgs.njk" import orgIntro %}`.

---

### `kens_status`

```yaml
kens_status: published
```

- Editorial workflow marker. Not read by any layout template — it is for human/AI reviewers only.
- Common value: `published`.

---

### `oldurl`

```yaml
oldurl: https://www.allaboutken.com/node/22
```

- Records the original Drupal URL for legacy reference. Not used by templates.
- Passthrough `.html` files in `src/site/` handle the actual redirects.

---

### `bodyClass`

```yaml
bodyClass: kh-special-page
```

- CSS class appended to `<body class="kh-stack ...">` via `base.njk`.
- Use sparingly; most page-level styling should go through the `pageClass` set in layout files.

---

### `templateEngineOverride`

```yaml
templateEngineOverride: njk
```

- Set in layout files (`post.njk`, `digesting.njk`) to force Nunjucks processing.
- Rarely needed in post frontmatter — use only if a post mixes template engines.

---

## Suggested read paths

- **Writing a new post:** set `title`, `layout`, `date`, `tags`, `teaser`. Add `image` + `image_meta` if you have art.
- **Impact story:** add `tags: [posts, impact-stories]` and `permalink` under `/work/`.
- **Digesting entry:** use `layout: layouts/digesting.njk` and `digest_link`.
- **Controlling social sharing:** use `og_image`, `og_title`, or `og_description` to override defaults.
