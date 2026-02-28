# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal blog site built with Eleventy v3, Dart Sass, and Nunjucks templates. Requires Node 20+. This is a static site generator project focused on blog posts, case studies, and personal work portfolio. The site uses a custom CSS system (previously used the Visual Framework during EMBL/EMBL-EBI work, now simplified).

## Essential Commands

### Development
```bash
yarn dev          # Start development server with Sass watch + Eleventy --serve
yarn start        # Alias for yarn dev
```

### Build
```bash
yarn build        # Clean → compile Sass → Eleventy production (includes Pagefind indexing)
yarn clean        # Remove /build directory
yarn sass         # Compile Sass to build/css/styles.css
yarn eleventy     # Run Eleventy build (sets ELEVENTY_ENV=production)
```

### Linting
```bash
yarn lint:css       # Lint SCSS/CSS files with stylelint (uses .stylelintrc.json)
yarn lint:css:fix   # Auto-fix stylelint issues
```

**Stylelint configuration** (`.stylelintrc.json`):
- Uses `stylelint-config-recommended-scss` with `postcss-scss` syntax
- Key rules: max nesting depth of 1, max 3 compound selectors, no duplicate selectors
- Ignores `build/`, `node_modules/`, and minified CSS

### Other

## Deployment

- GitHub Pages via GitHub Actions (`.github/workflows/build-and-deploy.yml`)
- Deploys automatically on push to `main` (only when `src/`, `scripts/`, `eleventy.js`, `package.json`, or `yarn.lock` change)
- PRs to `main` trigger a build check but do not deploy
- Can also be triggered manually via `workflow_dispatch`

## Architecture

### Build Pipeline

1. **Sass compilation**: `src/components/vf-componenet-rollup/index.scss` → `build/css/styles.css`
   - Note: `vf-componenet-rollup` is a legacy directory name (typo intentionally kept)
   - Uses Dart Sass with `@use` syntax
   - Breakpoints centralized in `src/components/vf-componenet-rollup/_settings.scss`
   - Main styles in `_kh-content.scss`

2. **Eleventy build**: `src/site/` → `build/`
   - Configuration: `eleventy.js`
   - Input: `src/site/`
   - Output: `build/`
   - Data: `src/site/_data/`
   - Includes: `src/site/_includes/`

3. **Post-build**: Pagefind search index generation
   - Runs automatically after Eleventy build (via `eleventy.after` event)
   - In production: `npx pagefind --site build` runs synchronously
   - In dev: runs in background so rebuilds aren't blocked
   - Only pages with `data-pagefind-body` (on `<main>` in `base.njk`) are indexed
   - Output: `build/pagefind/` (chunked index, JS, WASM)

### Image Handling

Images are processed by `@11ty/eleventy-img` transform plugin (configured in `eleventy.js:11-68`):
- Automatically transforms `<img>` tags in HTML at build time
- Generates responsive images: widths `[320, 600, 900, 1280]`
- Formats: `avif`, `webp`, `jpeg`, `gif`
- Output: `build/img/`
- In dev mode (`ELEVENTY_ENV=development`): transforms on-request for faster builds
- Custom filename format: `{dirToken}-{baseName}-{width}.{format}` (deterministic, no hashes)
- Preserves animation for GIF/WEBP
- Fails gracefully on image errors (doesn't break entire build)

**Important**: A transform fixes image src paths from filesystem paths to `/images/` URLs (see `eleventy.js:95-103`)

### Content Structure

**Posts** (`src/site/posts/*.njk`):
- Nunjucks templates with YAML frontmatter
- Layout: `layouts/post.njk` → `layouts/base.njk`
- Use `{% markdown %}…{% endmarkdown %}` paired shortcode for Markdown blocks
- Legacy custom tags (`render`, `codeblock`) removed—use fenced code blocks instead
- Impact stories tagged with `impact-stories` in frontmatter

**Data**:
- Global config: `src/site/_data/siteConfig.json`
- Collections defined in `eleventy.js`: e.g., `impactStories` collection (filtered by `impact-stories` tag)
- Organization descriptions: `src/site/_includes/partials/orgs.njk` provides `orgIntro()` macro for impact story context boxes

**Templates**:
- Base layout: `src/site/_includes/layouts/base.njk`
- Post layout: `src/site/_includes/layouts/post.njk`
- Footer: `src/site/_includes/footer.njk`

### CSS Architecture

The site uses a unique CSS activation pattern:
- CSS is toggled via `#kh-css-toggle` checkbox
- All custom styles scoped under `body:has(#kh-css-toggle:checked)` (see `index.scss:12`)
- This allows CSS-free viewing mode
- Utility classes prefixed with `kh-*` (e.g., `kh-button`, `kh-grid`, `kh-content`)
- Typography uses Recursive variable font with font-variation-settings for headlines/code
- Responsive breakpoints defined in `_settings.scss`:
  - `$kh-breakpoint--sm`: 460px
  - `$kh-breakpoint--md`: 768px
  - `$kh-breakpoint--lg`: 1024px
  - `$kh-breakpoint--md-down`: 767px
  - `$kh-breakpoint--lg-down`: 1023px

### Eleventy Configuration Details

**Markdown**:
- Engine: `markdown-it` with `markdown-it-anchor` for heading IDs
- Custom plugin converts `--` to em dashes (`—`)
- Permalink anchors: `#` links appended to headings with class `kh-anchor`
- Slugify: lowercase, remove punctuation, collapse spaces to hyphens

**Filters** (see `eleventy.js:105-201`):
- `dateDisplay(dateObj, format)`: Format dates with Luxon
- `limitItems(array, n)`: Return first/last N items
- `ensureTrailingSlash(value)`: Ensure trailing slash on URLs
- `rssDate(dateObj)`: ISO format for RSS
- `rssLastUpdatedDate(posts)`: Latest date from a posts collection (for RSS feed `lastBuildDate`)
- `emdash(value)`: Convert `--` to `—`
- `htmlToAbsoluteUrls(content, siteBaseUrl)`: Convert relative to absolute URLs
- `sanitizeFeedHtml(content)`: Strip unsafe elements for RSS feeds
- `wordCount(content)`: Count words in HTML content
- `formatNumber(value, locale)`: Format numbers with separators

**Shortcodes**:
- `{% markdown %}…{% endmarkdown %}`: Render inline Markdown blocks
- `{% codeAndDemo 'html' %}…{% endcodeAndDemo %}`: Render escaped code + live demo
- `{% ogImageUrl page %}`: Generate Eleventy Screenshot Service URL for social card images

**Collections**:
- `impactStories`: Posts tagged with `impact-stories`, sorted by date descending

**Passthrough Copy**:
- `src/site/**/*.js` → JavaScript files
- `src/site/images` → Images (passthrough, not processed by Image plugin initially)
- `src/site/**/*.html` → HTML files (for old Drupal URL redirects)
- `src/components/ken-favicon/assets` → `assets/ken-favicon/assets` (pre-built, no generation step)
- `src/components/kh-font` → `assets/kh-font` (Recursive font, pre-subset and committed)

**Server Options** (`eleventy.js:69-91`):
- Live reload with DOM diffing enabled
- Watches `build/**/*.css` for instant CSS reloads
- Shows all network hosts for device testing
- UTF-8 encoding

## Development Workflow

1. **Starting development**: `yarn dev` runs Sass watch + Eleventy serve concurrently
2. **Making CSS changes**: Edit files in `src/components/vf-componenet-rollup/`
   - Changes auto-compile and trigger browser reload
3. **Making content changes**: Edit `.njk` files in `src/site/`
   - Eleventy auto-rebuilds and reloads browser
4. **Images**: Place in `src/site/images/blog/`
   - Reference in frontmatter as `/blog/filename.jpg` (not `/images/blog/`)
   - In dev: transformed on-request
   - In production: all transformed at build time
5. **Building for production**: `yarn build`
   - Cleans build dir
   - Compiles Sass
   - Runs Eleventy with production env
   - Generates search index

## Important Patterns

### Post Frontmatter
```yaml
---
title: 'Post title'
layout: layouts/post.njk
teaser: 'Short description'
date: 2025-10-24
tags:
  - posts
  - impact-stories  # Optional: for impact story collection
topics:
  - Topic 1
  - Topic 2
org: Organization  # Optional: for impact stories (used with orgIntro macro)
permalink: /posts/custom-url/  # Optional
image: /blog/example-image.jpg  # Optional: for in-page hero images (NOT used for social sharing)
image_meta:
  text: 'Location or context. Own work.'  # Caption for sighted users
  altext: 'Descriptive alt text for screen readers'
via: 'https://example.com/source'  # Optional: source/attribution URL for link posts

# OpenGraph/Twitter Card Overrides (optional):
og_title: 'Custom OG Title'  # Overrides default: "Post title | All about Ken Hawkins"
og_description: 'Custom OG description'  # Overrides default: teaser or site description
og_image: 'https://example.com/custom-image.jpg'  # Full URL - ONLY way to override dynamic social card
---
```

**Image paths**:
- Place image files in: `src/site/images/blog/`
- Reference in frontmatter as: `/blog/filename.jpg` (NOT `/images/blog/`)
- The `/images/` prefix is added automatically by the build process

**Image attribution**:
- For Ken's own photos/illustrations: use "Own work." (not "Photo by Ken Hawkins")
- Include location context in the `text` caption, e.g., "OneSiam Skywalk, Bangkok. Own work."

**OpenGraph/Twitter defaults** (if not overridden in frontmatter):
- `og:title` / `twitter:title`: `{{ title }} | All about Ken Hawkins`
- `og:description` / `twitter:description`: Uses `teaser` → `siteConfig.short_description`
- `og:image` / `twitter:image`: **Dynamic screenshot from social card page** by default (via Eleventy Screenshot Service)
  - Override with `og_image` frontmatter (full URL) to use a custom image
  - The `image` field is **NOT** used for OG meta tags (only for in-page hero images)
- `og:type`: `article` for posts, `website` for other pages
- `article:author`: Pulled from `siteConfig.siteInformation.author`

**Dynamic Social Sharing Images**:
- **All pages use auto-generated social cards by default**
- Social card pages are auto-generated at `/social/<page-url>/` for every page via pagination (see `src/site/social-cards.njk`)
- Card template: `src/site/_includes/layouts/social-card.njk` (1200×630px, styled with inline CSS)
- Eleventy Screenshot Service (`https://v1.screenshot.11ty.dev/`) captures these cards as images
- `ogImageUrl` shortcode generates screenshot URLs (defined in `eleventy.js:304-311`)
- To use a custom image for social sharing, set `og_image` in frontmatter with a full URL

### Using Markdown in Nunjucks
```njk
{% markdown %}
## Heading
Regular markdown content here.
{% endmarkdown %}
```

### Organization Context Box (Impact Stories)
Use the `orgIntro` macro to add organization context after the tl;dr in impact stories:

```njk
{% from "partials/orgs.njk" import orgIntro %}
<p class="kh-text-body--3">{{ orgIntro(org) }}</p>
```

Supported organizations (defined in `src/site/_includes/partials/orgs.njk`):
- `UNDRR`: United Nations Office for Disaster Risk Reduction
- `EMBL`: European Molecular Biology Laboratory
- `EMBL-EBI`: European Bioinformatics Institute

### Code and Demo Shortcode
```njk
{% codeAndDemo 'html' %}
<button>Click me</button>
{% endcodeAndDemo %}
```

## Search

Search is powered by [Pagefind](https://pagefind.app/), a static search library:
- Index built at deploy time via `npx pagefind --site build` (in `eleventy.after` hook)
- Only `<main data-pagefind-body>` content is indexed (social cards, `/node/` redirects excluded automatically)
- Post boilerplate (comments, prev/next nav) excluded via `data-pagefind-ignore` on `post.njk`
- Search page (`src/site/search.njk`) uses Pagefind's JS API with `<script type="module">`
- Chunked index: users download ~10 KB JS initially, ~10-30 KB per query (fragments loaded on demand)
- `?search_query=` URL parameter preserved for 404 page redirect flow

## RSS Feed

- Generated by `src/site/feed.njk` with XSLT styling via `src/site/feed.xsl.njk`
- Uses `sanitizeFeedHtml` filter to strip unsafe elements and `htmlToAbsoluteUrls` for portable links

## Analytics and External Services

- Analytics: GoatCounter at `khawkins98.goatcounter.com`
- Webmention: `webmention.io/allaboutken.com`
- Self-hosted font: Recursive variable font subset at `/assets/kh-font/Recursive_VF_1.085--subset-GF_latin_basic.woff2`

## Editorial System

When working on blog posts or impact stories, follow the editorial system:

- **`src/site/style-guide/editorial.njk`** - Canonical style guide (voice, tone, structure, formatting, content types, frontmatter, examples, checklists, cross-linking)
- **`docs/EDITORIAL_HANDBOOK.md`** - Internal supplement (GW/FF review passes, site-stack notes, observed patterns)
- **`docs/PUBLISHING_WORKFLOW.md`** - End-to-end workflow for creating and publishing content
- **`docs/ROLE_TECHNICAL_REVIEWER.md`** - QA role (code correctness, builds, links, accessibility)
- **`docs/ROLE_EDITORIAL_STYLE_EDITOR.md`** - Style role (voice, structure, scannability, flow)
- **`docs/ROLE_SEO_DISCOVERABILITY_EDITOR.md`** - SEO role (titles, metadata, internal linking)

To invoke a specific editorial lens, read the role file and apply its standards. All roles reference the Editorial Handbook as source of truth.

**Public style guide pages** (live rendered references, not just internal docs):
- `/style-guide/editorial/` (`src/site/style-guide/editorial.njk`) - Voice, tone, structure rules
- `/style-guide/components/` (`src/site/style-guide/components.njk`) - Design tokens and component demos

## Notable Pages

Beyond blog posts, these pages exist in `src/site/`:
- `src/site/node/` - Legacy Drupal URL redirect pages (HTML passthrough, not Eleventy-processed content)
- `feed.njk` / `feed.xsl.njk` - RSS feed with XSLT styling
- `social-cards.njk` - Pagination-generated social card pages at `/social/<page-url>/`
- `search.njk` - Client-side search page
- `sitemap.njk` / `robots.njk` - SEO files generated at build time

## Key Files to Know

- `eleventy.js` - Eleventy configuration, plugins, filters, collections
- `package.json` - NPM scripts and dependencies
- `src/components/vf-componenet-rollup/index.scss` - Main CSS entry point
- `src/site/_includes/layouts/base.njk` - Base HTML template
- `src/site/_includes/layouts/post.njk` - Blog post template
- `src/site/_data/siteConfig.json` - Site-wide configuration
- `src/site/search.njk` - Pagefind-powered search page
- `docs/EDITORIAL_HANDBOOK.md` - Editorial standards and guidelines
