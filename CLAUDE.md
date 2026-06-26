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
For Ken's own photos: use `credit: "Own work."` (not "Photo by Ken Hawkins"). Include location context in the `text` caption, e.g.:
```yaml
text: "OneSiam Skywalk, Bangkok."
credit: "Own work."
```

### The CSS toggle
All custom styles are scoped under `body:has(#kh-css-toggle:checked)` (see `index.scss:12`). This is intentional -- it enables a CSS-free viewing mode. New styles must go inside this scope or they won't apply.

### The typo in `vf-componenet-rollup`
The directory `src/components/vf-componenet-rollup/` is a legacy name. The typo is intentional and kept for path stability. Don't rename it.

### Markdown `--` becomes em dashes
The markdown-it config converts `--` to `—` automatically. Write `--` in content, it renders as `—`.

### Embeddings don't run in dev
`yarn embeddings` is too slow for iterative development. Run `yarn build` once to generate `vectors.json`, then `yarn dev` as usual. The `@huggingface/transformers` devDependency is ~476 MB in node_modules (ONNX runtime ships native binaries for every platform). It's needed to run the model at build time -- there's no lighter alternative.

### Semantic search model loading
The browser fetches the model directly from HuggingFace at query time. Transformers.js caches it using the Cache API (keyed by model ID, not URL), so the ~23 MB download only happens once per browser. Transformers.js and ONNX Runtime WASM load from jsDelivr.

### Updating the embedding model
Must change in **two places**: `MODEL_NAME` in `scripts/generate-embeddings.mjs` AND `MODEL_ID` in `src/site/semantic-search.js`. Both sides must use the same model. See the header comment in `generate-embeddings.mjs` for full instructions.

## Project structure (brief)

- `eleventy.js` -- All config: filters, shortcodes, collections, image transform, Pagefind hook
- `src/components/vf-componenet-rollup/` -- Sass entry point and all CSS
- `src/site/` -- Templates, posts, data, includes
- `scripts/generate-embeddings.mjs` -- Build-time vector embeddings
- `docs/IMAGE_GENERATION.md` -- Image generation guide (setup, prompts, credits)
- `docs/` -- Publishing workflow, reviewer roles

## Editorial system

When working on blog posts or impact stories, read the docs:

- `src/site/style-guide/editorial.njk` -- Canonical style guide (voice, tone, structure, reasoning, formatting)
- `docs/PUBLISHING_WORKFLOW.md` -- End-to-end publishing workflow
- `docs/ROLE_*.md` -- Reviewer roles (technical, editorial, SEO)

## Deployment

Vercel serves the production site (`allaboutken.com`); the Vercel GitHub App auto-deploys on push to `main` and creates preview deployments for PRs. GitHub Actions (`.github/workflows/build-and-deploy.yml`) only runs a build check (lint + compile) — it no longer deploys. See `docs/DEPLOYMENT.md` for the full architecture.
