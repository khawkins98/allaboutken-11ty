# Scripts

Reference for everything in `scripts/`. These are build-time tools — none run in the browser.

## `generate-embeddings.mjs`

**Purpose.** Generate vector embeddings for site content so the in-browser semantic search has something to query against.

**Inputs.**
- `build/` (the Eleventy output). Walked recursively for `.html` files.
- Pages with a `data-pagefind-body` attribute. Pages without it are skipped, as are anything matching `SKIP_PATTERNS` in the script (social cards, sitemap, robots, feeds, search UI, assets, etc.).

**Outputs.**
- `build/semantic-search/vectors.json` — one entry per indexed page, each with the page URL, title, snippet, and the MiniLM-L6-v2 embedding vector.

**Model.** `Xenova/all-MiniLM-L6-v2` (set as `MODEL_NAME` in the script). The browser-side counterpart is `MODEL_ID` in `src/site/semantic-search.js`. **Both must match** — if you change one, change the other and re-run `yarn build`.

**When to run.**
- Automatically as the final step of `yarn build`.
- Manually via `yarn embeddings` if you only changed metadata and want to re-index without a full rebuild (rare).
- **Not** during `yarn dev` — too slow. Run `yarn build` once to seed `vectors.json`, then iterate with `yarn dev`.

**Cost.** ~476 MB of `@huggingface/transformers` + ONNX Runtime in `node_modules`. The runtime binaries are platform-specific and ship for every platform. There's no lighter equivalent that gives us the same browser parity.

## `process-images.js`

**Status: empty placeholder (0 bytes).** Currently a stub. If you came here to find image processing, the real pipelines live elsewhere:

- **Responsive image generation at build time** — `@11ty/eleventy-img` plugin, configured at the top of `eleventy.js`. Produces `avif`, `webp`, `jpeg`, `gif` variants at `[320, 600, 900, 1280]` widths into `build/img/`.
- **Hero image generation (AI-assisted)** — Browser-based UI at `/image-generator/`. See `docs/IMAGE_GENERATION.md` for the prompts, model, and credits.

Either delete this file or use it for something. If you implement it, update this section.

## Adding a new script

Conventions used by the existing scripts:

- ES modules (`.mjs`) for anything that wants `import`. CommonJS (`.js`) is fine for short, dependency-free tools.
- Top-of-file header comment: what it does, what it reads, what it writes, when to run it. See `generate-embeddings.mjs` for the template.
- If the script becomes part of `yarn build`, add it to `package.json` `scripts.build` and mention it in `docs/ARCHITECTURE.md`'s build pipeline section.
- If it stays manual, add a `yarn <name>` entry so people can discover it.
