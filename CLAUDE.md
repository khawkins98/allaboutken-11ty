# CLAUDE.md

Exceptions and gotchas that aren't obvious from reading the code or existing docs. For the full picture, read the source files directly -- `eleventy.js`, `package.json`, the templates, and the `docs/` directory.

## Quick reference

```bash
yarn dev          # Development server (Sass watch + Eleventy --serve)
yarn build        # Full production build (clean → sass → eleventy → embeddings)
yarn lint:css     # Lint SCSS files
```

## Gotchas

### Image paths are rewritten at build time
Place images in `src/site/images/blog/`. Reference them in frontmatter as `/blog/filename.jpg` -- **not** `/images/blog/`. The build process adds the `/images/` prefix automatically. Getting this wrong produces broken images that only show up in production.

### The `image` field is not used for social cards
`image` in frontmatter is for in-page hero images only. Social sharing images (`og:image`) are auto-generated screenshots. Override with `og_image` (full URL) in frontmatter if needed. This confuses people because every other blog engine uses `image` for both.

### Image attribution
For Ken's own photos: use "Own work." (not "Photo by Ken Hawkins"). Include location context in the `text` caption, e.g., "OneSiam Skywalk, Bangkok. Own work."

### The CSS toggle
All custom styles are scoped under `body:has(#kh-css-toggle:checked)` (see `index.scss:12`). This is intentional -- it enables a CSS-free viewing mode. New styles must go inside this scope or they won't apply.

### The typo in `vf-componenet-rollup`
The directory `src/components/vf-componenet-rollup/` is a legacy name. The typo is intentional and kept for path stability. Don't rename it.

### Markdown `--` becomes em dashes
The markdown-it config converts `--` to `—` automatically. Write `--` in content, it renders as `—`.

### Embeddings don't run in dev
`yarn embeddings` is too slow for iterative development. Run `yarn build` once to generate `vectors.json`, then `yarn dev` as usual. The model files for the browser are downloaded separately in an `eleventy.after` hook, so `yarn dev` still has them.

### Semantic search model self-hosting
HuggingFace serves ONNX files through signed CloudFront URLs that change on every request, breaking browser cache. The model files are downloaded via `eleventy.after` hook to `build/semantic-search/model/` and served as static assets. Transformers.js and ONNX Runtime WASM load from jsDelivr (deterministic URLs, caches fine).

Transformers.js disables "local" model loading in browsers by default. In `ask.njk`, we set `env.allowLocalModels = true` and `env.localModelPath = '/'`, then use model ID `'semantic-search/model'` (must look like `org/model` to pass validation). Bare paths and full URLs both fail.

### Updating the embedding model
Must change in **two places**: `MODEL_NAME` in `scripts/generate-embeddings.js` AND `modelName` in `eleventy.js`. Both sides must use the same model. See the header comment in `generate-embeddings.js` for full instructions.

## Project structure (brief)

- `eleventy.js` -- All config: filters, shortcodes, collections, image transform, Pagefind/model hooks
- `src/components/vf-componenet-rollup/` -- Sass entry point and all CSS
- `src/site/` -- Templates, posts, data, includes
- `scripts/generate-embeddings.js` -- Build-time vector embeddings
- `docs/` -- Editorial handbook, publishing workflow, reviewer roles

## Editorial system

When working on blog posts or impact stories, read the docs:

- `src/site/style-guide/editorial.njk` -- Canonical style guide (voice, tone, structure)
- `docs/EDITORIAL_HANDBOOK.md` -- Internal supplement
- `docs/PUBLISHING_WORKFLOW.md` -- End-to-end publishing workflow
- `docs/ROLE_*.md` -- Reviewer roles (technical, editorial, SEO)

## Deployment

GitHub Pages via GitHub Actions. Deploys on push to `main` when source files change. PRs trigger build checks but don't deploy. See `.github/workflows/build-and-deploy.yml`.
