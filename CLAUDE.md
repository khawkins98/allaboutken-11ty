# CLAUDE.md

Exceptions and gotchas that aren't obvious from reading the code or existing docs. For the full picture, read the source files directly -- `eleventy.js`, its `config/eleventy/` registration modules, `package.json`, the templates, and the `docs/` directory.

## Quick reference

```bash
yarn dev          # Development server (Sass watch + Eleventy --serve)
yarn build        # Full production build (clean → sass → eleventy → embeddings)
yarn lint:css     # Lint SCSS files
yarn lint:links   # Validate internal links/anchors in build/ (run after a build)
```

## Gotchas

### Image paths are rewritten at build time
Place images in `src/site/images/blog/`. Reference them in frontmatter as `/blog/filename.jpg` -- **not** `/images/blog/`. The build process adds the `/images/` prefix automatically. Getting this wrong produces broken images that only show up in production.

### Live remote images must carry `eleventy:ignore`
The image transform treats *any* `<img src>` as a source image, including
remote URLs. For a live endpoint -- the feedback counter SVG at
`feedback.allaboutken.com/count/...` -- that is wrong three times over: the
image is fetched and rasterised at build time so the value freezes, the
emitted `/.11ty/image/?src=...` URL 404s in production because
`failOnError: false` lets a failed remote fetch through silently, and the
`width`/`height` attributes the plugin stamps on the tag combine with any CSS
`height` to specify both axes, so the badge lays out at its full intrinsic
width (1280px) instead of scaling.

Add `eleventy:ignore` to the tag. This is not an optimisation opt-out; without
it the feature does not work. The symptom is easy to misread: it surfaced as
381 "broken internal links" in `yarn lint:links`, all pointing at
`/.11ty/image/`, which looks like a link problem and is not.

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
`yarn embeddings` is too slow for iterative development. Run `yarn build` once to generate `vectors.json`, then `yarn dev` as usual. The `@huggingface/transformers` devDependency is ~476 MB in node_modules (ONNX runtime ships native binaries for every platform). It's needed to run the model at build time -- there's no lighter alternative. At build time the model itself is cached under `.cache/transformers` (set via `env.cacheDir` in `generate-embeddings.mjs`); CI restores that directory so the model is not re-downloaded from HuggingFace every run.

### Semantic search model loading
The browser fetches the model directly from HuggingFace at query time. Transformers.js caches it using the Cache API (keyed by model ID, not URL), so the ~23 MB download only happens once per browser. Transformers.js and ONNX Runtime WASM load from jsDelivr.

### Updating the embedding model
Must change in **two places**: `MODEL_NAME` in `scripts/generate-embeddings.mjs` AND `MODEL_ID` in `src/site/semantic-search.js`. Both sides must use the same model. See the header comment in `generate-embeddings.mjs` for full instructions.

### Navigation chrome must never reach the embeddings
`scripts/generate-embeddings.mjs` strips every element carrying
`data-pagefind-ignore`, with its contents, before embedding. That attribute is
the site's single "this is chrome, not content" marker: Pagefind already
honours it for keyword search, and the embeddings honour it for the same
reason. Do not invent a second marker; put the attribute on any block that
prints other entries' titles or repeats identical text on every page.

This is not cosmetic. The "closest in meaning" list prints the titles of
related entries, so embedding it fed the feature's own output back into the
model and those entries drifted closer on every build: link count went 116 to
173 with no writing changed.

Stripping is done with a balanced-tag scan, not a regex, because these regions
nest and a lazy regex stops at the first closing tag of any depth.

**A lazy regex doing the same job used to run first, and it silently disabled
the scan.** `extractContent` pre-stripped with
`/<[^>]+data-pagefind-ignore[^>]*>[\s\S]*?<\/[^>]+>/gi`. On a nested region it
matched from the opening marked tag to the *first* closing tag of any depth, so
on `<aside data-pagefind-ignore><p>Written by</p><p>bio</p></aside>` it deleted
`<aside ...><p>Written by</p>` and left the bio behind **with the marker now
gone** -- so the balanced scan that ran next had nothing to find. Every marked
region with nested markup was leaking. Removing that one line cut the corpus
from 1,708 chunks to 1,068 (-37%) and thresholded links from 188 to 66. Do not
reintroduce a regex there.

The link counts in this file are therefore not comparable across that fix: the
116-to-173 figure above was measured while chrome was still leaking. Post-fix,
66 links at >= 0.6 and 71 of 100 entries with at least one neighbour is the
real baseline. Most of the old "similarity" was shared navigation, not shared
subject matter.

Residual: the derived data still moves by a few links per build even though the
stripped text is byte-identical across builds, verified by hash. That is
floating-point non-determinism in the ONNX runtime flipping pairs that sit
exactly on the threshold. It is jitter, not drift, and not worth chasing.

### Topics use `>` for hierarchy, never `:`
Post `topics:` entries may be hierarchical -- `AI > Claude Code`. The parent
must come from the controlled vocabulary in `docs/TOPIC_TAXONOMY.md` and is the
only part that groups or counts; the child is free-form detail.

The separator is a greater-than sign because YAML parses an unquoted `- a: b`
list item as an **object**, not a string, so a colon would silently produce a
mixed-type list. Quoting works but fails the day someone forgets.

Also: `tags:` decides collection membership (`posts`, `note`, `digesting`,
`impact-stories`); `topics:` is subject matter only. Editing `tags` restructures
the site.

### Series are frontmatter keys, not topics
Multi-part series use `series:` and `series_part:`, not a shared topic, because
a series is ordered and exclusive. Renders as "Part 2 of 4" with all parts
linked.

## Project structure (brief)

- `eleventy.js` and `config/eleventy/` -- Eleventy assembly and concern-specific registrations
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
