# Scripts reference

Source of truth for local commands and script behavior in this repository.

## At a glance

| Command | Purpose | Typical use |
| --- | --- | --- |
| `yarn dev` | Run local development server | Day-to-day authoring and preview |
| `yarn build` | Run full production build | Pre-push validation and CI parity |
| `yarn eleventy:bootstrap` | Render HTML for semantic-data generation | First Eleventy pass in `yarn build` |
| `yarn embeddings` | Regenerate semantic-search vectors | After content/model changes that affect embeddings |
| `yarn related` | Derive per-entry semantic neighbours | After `yarn embeddings` |
| `yarn semantic-map` | Project entries and derive strong semantic links | After `yarn embeddings` |
| `yarn story-lab` | Build experimental corpus-story views | After `yarn semantic-map` |
| `yarn lint:css` | Lint SCSS/CSS files | Before committing style changes |
| `yarn lint:links` | Validate internal links in `build/` | After a build, to catch broken internal links/anchors |
| `yarn test` | Test commit-message normalization and validation | After changing files in `.githooks/` |

## Script details

### `yarn clean`

- Runs `rm -rf build`.
- Deletes generated output so the next build starts from a clean state.

### `yarn sass`

- Compiles `src/components/vf-componenet-rollup/index.scss` to `build/css/styles.css`.
- Uses `--no-source-map`.
- Run directly when you only need stylesheet compilation without a full site build.

### `yarn eleventy`

- Runs `ELEVENTY_ENV=production eleventy --config=eleventy.js`.
- Produces static site output in `build/`.
- Uses production mode behavior (different from `yarn dev`).

### `yarn eleventy:bootstrap`

- Runs `ELEVENTY_ENV=production ELEVENTY_BOOTSTRAP=1 eleventy --config=eleventy.js`.
- Produces the initial HTML in `build/` that `yarn embeddings` reads.
- Skips Pagefind generation because this output is temporary and will be replaced by the final Eleventy pass.
- May render without the ignored derived data files on a clean checkout. Its purpose is to provide embedding input; the final pass consumes the freshly generated data.
- Normally run through `yarn build`, not as a standalone authoring command.

### `yarn lint:css`

- Runs stylelint on all `src/**/*.scss` and `src/**/*.css`.
- Non-mutating check for CSS/SCSS quality.

### `yarn lint:css:fix`

- Same scope as `yarn lint:css`, but with `--fix` for auto-fixable issues.

### `yarn lint:links`

- Runs `node scripts/check-links.mjs`.
- Walks the `build/` output and verifies every **internal** link resolves to a real file (handling pretty URLs → `index.html`), and checks `#fragment` links against the target page's `id`/`name` attributes.
- External links (`http(s)://`, protocol-relative, `mailto:`, `tel:`, `data:`) are skipped on purpose — they are non-deterministic in CI.
- Vercel-proxied hobby-project prefixes (read from `vercel.json` rewrites, e.g. `/PDF-A-go-go/`, `/pinment/`) are skipped too — they resolve in production via proxy but are absent from the local build. `<script>`/`<style>` bodies are stripped before scanning so JS template strings aren't treated as links.
- Requires a build first (run `yarn eleventy` or `yarn build`). Exits non-zero if any internal link is broken.
- Runs in CI after the build (currently non-blocking; see `.github/workflows/build-and-deploy.yml`).

### `yarn embeddings`

- Runs `node scripts/generate-embeddings.mjs`.
- Reads generated HTML in `build/`, extracts searchable content, and writes `build/semantic-search/vectors.json`.
- Intended to run after Eleventy has produced the site output.
- Caches the downloaded MiniLM model under `.cache/transformers` (set via `env.cacheDir`). CI restores this directory between runs so the model is not re-downloaded from HuggingFace every build.

### `yarn related`

- Runs `node scripts/compute-related.mjs`.
- Requires `build/semantic-search/vectors.json`, normally produced by `yarn embeddings` after a bootstrap Eleventy pass.
- Averages chunk embeddings into one normalized vector per `/posts/` or `/work/` entry, then stores up to three neighbours with cosine similarity >= 0.55.
- Writes `src/site/_data/related.json`, consumed by `src/site/_includes/partials/related-semantic.njk` through the `related` global data variable.
- If the vectors file is absent, reports the prerequisite and exits successfully without writing output. The final templates then render no semantic-neighbour list.
- Warns if an output key does not resolve to built HTML, because the template lookup is keyed by the exact served `page.url`.

### `yarn semantic-map`

- Runs `node scripts/compute-semantic-map.mjs`.
- Requires `build/semantic-search/vectors.json` and reads post frontmatter in `src/site/posts/` to attach each entry's primary topic.
- Averages entry vectors, uses deterministic classical multidimensional scaling to produce two-dimensional coordinates, and retains strong links at cosine similarity >= 0.6, capped at three neighbours per node.
- Writes `src/site/_data/semanticMap.json`, consumed by the statistics and map-variant templates and used as the required input to `yarn story-lab`.
- If vectors are absent, or fewer than three entries can be projected, reports the condition and exits successfully without replacing the output.

### `yarn story-lab`

- Runs `node scripts/compute-story-lab.mjs`.
- Requires `src/site/_data/semanticMap.json`; it also reads post source, bootstrap HTML in `build/`, and, when available, `build/semantic-search/vectors.json`.
- Combines semantic links with dates, topics, content types, authored links, career bands, outbound-link data, and passage-level embeddings for the experimental Corpus Story Lab.
- Writes `src/site/_data/storyLab.json`, consumed by `src/site/stats-story-lab.njk` at `/stats/story-lab/`.
- If `semanticMap.json` is absent, reports the prerequisite and exits successfully without writing output. If vectors are absent but the map exists, it still writes a reduced artifact: vector-dependent passage views use empty metadata or fall back to whole-entry map edges.

### `yarn build`

- Runs, in order: `yarn clean`, `yarn sass`, `yarn eleventy:bootstrap`, `yarn embeddings`, `yarn related`, `yarn semantic-map`, `yarn story-lab`, and `yarn eleventy`.
- The two Eleventy passes are necessary because embeddings are generated from rendered HTML, while the final rendered HTML consumes data derived from those embeddings.
- This is the production build path used for full validation.
- Expected outputs include:
  - compiled CSS in `build/css/`
  - site HTML/assets in `build/`
  - semantic search vectors in `build/semantic-search/vectors.json`
  - ignored derived data in `src/site/_data/{related,semanticMap,storyLab}.json`
- The final Eleventy pass also generates the Pagefind index; the bootstrap pass deliberately skips it.

### `yarn dev`

- Runs Sass in watch mode and Eleventy with `--serve` concurrently.
- Uses `ELEVENTY_ENV=development`.
- Optimized for local iteration.
- Does **not** run `yarn embeddings` as part of the dev command.

### `yarn start`

- Alias for `yarn dev`.

### `yarn test`

- Runs `.githooks/test-commit-msg-hooks.sh`.
- Checks normalization without corrupting literal escape sequences, preservation of the commit body, and rejection of unknown prefixes and empty descriptions.
- Runs as a required CI step.

### `yarn prepare`

- Sets Git hooks path: `git config core.hooksPath .githooks`.
- Normally runs as part of dependency installation lifecycle.
- Enables local commit-message normalization and enforcement via `.githooks/prepare-commit-msg` and `.githooks/commit-msg`.

## Lifecycle and automation notes

### Install lifecycle (`prepare`)

- `yarn install` runs `yarn prepare` automatically.
- This repository uses that hook to point Git at `.githooks/`, so local commits are validated before they are created.

### Commit message hooks

- `.githooks/prepare-commit-msg` normalizes common prefix, spacing, and trailing-period issues.
- Enforces `<prefix>: <description>` on the commit subject.
- Allowed prefixes: `content`, `feature`, `fix`, `ci`, `chore`.
- Enforces subject length <= 72 characters and disallows a trailing period.
- Skips merge/revert/fixup/squash commit subjects.
- CI checks PR titles in `.github/workflows/pr-title-check.yml` for the same prefix/pattern (`<prefix>: <description>`, optional scope allowed), but does not enforce commit-subject length/punctuation rules.

### `yarn update-components`

- Runs `yarn upgrade-interactive --latest` for dependency update workflow.

## Scripts directory status

### `scripts/generate-embeddings.mjs`

- Active build script used by `yarn embeddings` and `yarn build`.

### `scripts/compute-related.mjs`

- Active build script used by `yarn related` and `yarn build`.
- Generates entry-level related-writing navigation from the semantic-search vectors.

### `scripts/compute-semantic-map.mjs`

- Active build script used by `yarn semantic-map` and `yarn build`.
- Generates deterministic corpus-map coordinates and strong entry links.

### `scripts/compute-story-lab.mjs`

- Active build script used by `yarn story-lab` and `yarn build`.
- Generates the experimental narrative and visualization datasets described in [`CORPUS_STORY_LAB.md`](CORPUS_STORY_LAB.md).

### `scripts/check-links.mjs`

- Active script used by `yarn lint:links`.
- Dependency-free internal-link and anchor validator for the `build/` output.

### `scripts/process-images.js`

- Planned helper script only; currently a documented placeholder.
- It is **not** invoked by `yarn dev`, `yarn build`, or any npm/yarn script in `package.json`.
- Eleventy image transforms are still handled at build time via the existing Eleventy image pipeline.
