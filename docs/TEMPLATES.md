# Templates guide

This project uses Eleventy + Nunjucks. Most pages in `src/site/` declare a `layout` in frontmatter, and the layout pulls in shared partials.

## Layout hierarchy

Page templates live in `src/site/`. Layouts and shared fragments are resolved from `src/site/_includes/`.

| Layout | File | Used by | Notes |
| --- | --- | --- | --- |
| Base | `src/site/_includes/layouts/base.njk` | Most pages | Global `<head>`, OG/Twitter tags, header, footer, scripts, ambience partial |
| Post | `src/site/_includes/layouts/post.njk` | Long-form posts and impact stories | Wraps content in article structure, hero image, JSON-LD, feedback block |
| Digesting | `src/site/_includes/layouts/digesting.njk` | Digest entries and selected standalone pages | Lightweight article layout with digest source link support |
| Social card | `src/site/_includes/layouts/social-card.njk` | `/social/*` pages | Screenshot-service target for OG images |

`post.njk` and `digesting.njk` both use `layout: layouts/base.njk`, so `base.njk` is the shared foundation.

## Common partials and macros

| Partial / macro | File | Where used |
| --- | --- | --- |
| Global footer | `src/site/_includes/footer.njk` | Included by `layouts/base.njk` |
| Ambience background | `src/site/_includes/partials/ambience.njk` | Included by `base.njk` |
| Search box | `src/site/_includes/partials/search-box.njk` | Blog, Digesting, All listing pages |
| Post summary card | `src/site/_includes/partials/post-summary.njk` | Home, Blog, All |
| Pager | `src/site/_includes/partials/pager.njk` | Paginated index pages |
| Organization intro macro | `src/site/_includes/partials/orgs.njk` | Imported by impact-story posts |

## Nunjucks patterns used in this repo

### 1) Frontmatter + layout selection

```yaml
---
title: Example page
layout: layouts/post.njk
templateEngineOverride: njk
---
```

### 2) Include reusable partials

```njk
{% include "partials/post-summary.njk" %}
```

### 3) Import and call macros

```njk
{% from "partials/orgs.njk" import orgIntro %}
{{ orgIntro(org) }}
```

### 4) Use paired shortcodes from `eleventy.js`

```njk
{% markdown %}
## Heading
Paragraph in markdown.
{% endmarkdown %}
```

```njk
{% codeAndDemo 'html' %}
<button class="kh-button">Demo</button>
{% endcodeAndDemo %}
```

## Creating a new template

1. Create a page in `src/site/` (`.njk` or `.md`).
2. Add frontmatter with `title` and `layout`.
3. Add `templateEngineOverride` only when needed (for mixed engine behavior).
4. If the page should be in a collection, set `tags`.
5. Add `permalink` if you need a custom URL shape.

For field semantics, use [`FRONTMATTER.md`](FRONTMATTER.md). For filters/shortcodes/collections, use [`ELEVENTY_CONFIG.md`](ELEVENTY_CONFIG.md). For global JSON data files, use [`DATA_FILES.md`](DATA_FILES.md).

## Mapping templates to style-guide pages

When template work changes rendered output, check style-guide surfaces in this order:

1. [`../src/site/style-guide/components.njk`](../src/site/style-guide/components.njk) for visual patterns, class names, and live component examples.
2. [`../src/site/style-guide/editorial.njk`](../src/site/style-guide/editorial.njk) for voice/structure rules and when to use specific content patterns.
3. [`STYLE_GUIDE_SURFACES.md`](STYLE_GUIDE_SURFACES.md) for ownership and boundaries between the style-guide pages.

## Modifying existing layouts safely

1. Update the layout/partial in `src/site/_includes/`.
2. Check every consumer template that includes/imports it.
3. Run `yarn build` to confirm the generated site still compiles.
