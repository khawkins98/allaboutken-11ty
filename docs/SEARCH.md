# Search architecture

The site provides two complementary search modes, selectable by the user:

- **Keyword search** — fast, offline-capable, uses a Pagefind index built at compile time.
- **Semantic / "Ask" search** — natural-language queries using vector embeddings generated at build time and compared in the browser.

---

## Keyword search (Pagefind)

### How it works

After every Eleventy build, a `pagefind.after` hook runs:

```js
const cmd = 'pagefind --site build --exclude-selectors "pre, code"';
```

Pagefind crawls the `build/` directory and writes a binary index under `build/pagefind/`. The browser-side Pagefind JS (loaded from that same path) does all querying locally — no server needed.

Code blocks (`pre`, `code`) are excluded from the index so that searches for common words don't surface noise from examples.

### Excluding content from the index

Add `data-pagefind-ignore` to any element whose text should not be indexed. The social-card layout and page header already use this attribute.

### Client-side integration

The search page (`src/site/search.njk`) loads the Pagefind UI bundle from `/pagefind/pagefind-ui.js`. No configuration beyond pointing it at the right `bundlePath` is required.

### Dev vs production

In development (`ELEVENTY_ENV=development`), Pagefind runs asynchronously after each Eleventy rebuild so it doesn't block the dev server. In production it runs synchronously (via `execSync`) so the build fails loudly if the index cannot be created.

---

## Semantic / vector search

### Overview

Semantic search lets visitors ask natural-language questions and find pages by meaning rather than exact keywords. It works by:

1. **Build time** — generating a 384-dimensional embedding vector for every page and saving them to `build/semantic-search/vectors.json`.
2. **Query time** — the browser embeds the user's query with the same model and computes cosine similarity (dot product of unit vectors) against all stored vectors, then returns the top matches.

### Model

Both sides must use the same model:

| Location | Constant | Value |
|---|---|---|
| `scripts/generate-embeddings.mjs` | `MODEL_NAME` | `Xenova/all-MiniLM-L6-v2` |
| `src/site/semantic-search.js` | `MODEL_ID` | `Xenova/all-MiniLM-L6-v2` |

**If you change the model you must update both files and re-run `yarn build`.** Mismatched models produce silently wrong results — query vectors and page vectors become incomparable.

### Build-time embedding generation (`scripts/generate-embeddings.mjs`)

- Reads all HTML files in `build/`.
- Skips non-content paths (social cards, sitemap, pagefind index, etc.) via `SKIP_PATTERNS`.
- Extracts text from elements that carry `data-pagefind-body` to match what Pagefind indexes.
- Runs the MiniLM pipeline (`feature-extraction` task) for each page.
- Normalises vectors so that dot product equals cosine similarity.
- Writes `build/semantic-search/vectors.json`.

Run order: `yarn eleventy` (which also runs Pagefind) **then** `yarn embeddings`. `yarn build` does both automatically.

The `@huggingface/transformers` devDependency is ~476 MB because the ONNX runtime ships native binaries for every platform. There is no lighter alternative for build-time inference.

### Browser-side query (`src/site/semantic-search.js`)

- Loaded as an ES module (`<script type="module">`).
- Lazy-loads Transformers.js from jsDelivr and the model from HuggingFace on first query.
- Transformers.js caches the model (~23 MB) in the browser's Cache API keyed by model ID, so the download only happens once per browser.
- Scores pages with `dotSimilarity()` (pre-normalised vectors → dot product = cosine similarity).
- Surfaces the top results above a relevance threshold.

### Updating the model

1. Browse [Transformers.js-compatible models](https://huggingface.co/models?library=transformers.js&sort=trending) — look for ONNX exports with `sentence-transformers`.
2. Update `MODEL_NAME` in `scripts/generate-embeddings.mjs`.
3. Update `MODEL_ID` in `src/site/semantic-search.js`.
4. Run `yarn build` to regenerate embeddings with the new model.
5. Test both search modes to confirm results are coherent.

### Running embeddings locally

```bash
yarn clean && yarn sass && yarn eleventy   # fast iteration (no embeddings)
yarn build                                  # full build including embeddings (~5+ min)
```

Embeddings do not run during `yarn dev`. Run `yarn build` once to produce `build/semantic-search/vectors.json`, then continue with `yarn dev`.
