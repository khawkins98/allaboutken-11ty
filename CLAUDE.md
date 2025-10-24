# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal blog site built with Eleventy v3, Dart Sass, and Nunjucks templates. This is a static site generator project focused on blog posts, case studies, and personal work portfolio. The site uses a custom CSS system (previously used the Visual Framework during EMBL/EMBL-EBI work, now simplified).

## Essential Commands

### Development
```bash
yarn dev          # Start development server with Sass watch + Eleventy --serve
yarn start        # Alias for yarn dev
```

### Build
```bash
yarn build        # Clean → compile Sass → Eleventy production → search index
yarn clean        # Remove /build directory
yarn sass         # Compile Sass to build/css/styles.css
yarn eleventy     # Run Eleventy build (sets ELEVENTY_ENV=production)
```

### Linting
```bash
yarn lint:css       # Lint SCSS/CSS files with stylelint
yarn lint:css:fix   # Auto-fix stylelint issues
```

### Other
```bash
yarn search:index   # Build client-side search index (runs automatically post-build)
```

## Architecture

### Build Pipeline

1. **Sass compilation**: `src/components/vf-componenet-rollup/index.scss` → `build/css/styles.css`
   - Uses Dart Sass with `@use` syntax
   - Breakpoints centralized in `src/components/vf-componenet-rollup/_settings.scss`
   - Main styles in `_kh-content.scss`

2. **Eleventy build**: `src/site/` → `build/`
   - Configuration: `eleventy.js`
   - Input: `src/site/`
   - Output: `build/`
   - Data: `src/site/_data/`
   - Includes: `src/site/_includes/`

3. **Post-build**: Search index generation via `scripts/build-search-index.js`
   - Runs automatically after Eleventy build (via `eleventy.after` event)
   - Crawls built HTML files in `/build`
   - Generates `build/search_index.js` for client-side search

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
- Case studies tagged with `case-studies` in frontmatter

**Data**:
- Global config: `src/site/_data/siteConfig.json`
- Collections defined in `eleventy.js`: e.g., `caseStudies` collection (filtered by `case-studies` tag)

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

**Filters** (see `eleventy.js:105-213`):
- `dateDisplay(dateObj, format)`: Format dates with Luxon
- `limitItems(array, n)`: Return first/last N items
- `ensureTrailingSlash(value)`: Ensure trailing slash on URLs
- `rssDate(dateObj)`: ISO format for RSS
- `emdash(value)`: Convert `--` to `—`
- `htmlToAbsoluteUrls(content, siteBaseUrl)`: Convert relative to absolute URLs
- `sanitizeFeedHtml(content)`: Strip unsafe elements for RSS feeds
- `wordCount(content)`: Count words in HTML content
- `formatNumber(value, locale)`: Format numbers with separators

**Shortcodes**:
- `{% markdown %}…{% endmarkdown %}`: Render inline Markdown blocks
- `{% codeAndDemo 'html' %}…{% endcodeAndDemo %}`: Render escaped code + live demo

**Collections**:
- `caseStudies`: Posts tagged with `case-studies`, sorted by date descending

**Passthrough Copy**:
- `src/site/**/*.js` → JavaScript files
- `src/site/images` → Images (passthrough, not processed by Image plugin initially)
- `src/site/**/*.html` → HTML files (for old Drupal URL redirects)
- `src/components/ken-favicon/assets` → `assets/ken-favicon/assets`
- `src/components/kh-font` → `assets/kh-font` (Recursive font)

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
4. **Images**: Place in `src/site/images/`
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
  - case-studies  # Optional: for case study collection
topics:
  - Topic 1
  - Topic 2
org: Organization  # Optional: for case studies
permalink: /posts/custom-url/  # Optional
image: /path/to/image.jpg  # Optional
image_meta:
  text: 'Caption text'
  altext: 'Alt text'
---
```

### Using Markdown in Nunjucks
```njk
{% markdown %}
## Heading
Regular markdown content here.
{% endmarkdown %}
```

### Code and Demo Shortcode
```njk
{% codeAndDemo 'html' %}
<button>Click me</button>
{% endcodeAndDemo %}
```

## Search Index

The search functionality is powered by a post-build script (`scripts/build-search-index.js`):
- Walks all `.html` files in `build/`
- Extracts title (from `<title>` tag) and body content (from `<body>`)
- Excludes elements with class `kh-search-client-side--no-index`
- Strips JavaScript and HTML tags
- Outputs `build/search_index.js` with array of `{id, title, text, tags, url}` objects

## Analytics and External Services

- Analytics: GoatCounter at `khawkins98.goatcounter.com`
- Webmention: `webmention.io/allaboutken.com`
- Self-hosted font: Recursive variable font subset at `/assets/kh-font/Recursive_VF_1.085--subset-GF_latin_basic.woff2`

## Key Files to Know

- `eleventy.js` - Eleventy configuration, plugins, filters, collections
- `package.json` - NPM scripts and dependencies
- `src/components/vf-componenet-rollup/index.scss` - Main CSS entry point
- `src/site/_includes/layouts/base.njk` - Base HTML template
- `src/site/_includes/layouts/post.njk` - Blog post template
- `src/site/_data/siteConfig.json` - Site-wide configuration
- `scripts/build-search-index.js` - Search index generator
