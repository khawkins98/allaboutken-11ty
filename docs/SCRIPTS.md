# Scripts reference

Source of truth for local commands and script behavior in this repository.

## At a glance

| Command | Purpose | Typical use |
| --- | --- | --- |
| `yarn dev` | Run local development server | Day-to-day authoring and preview |
| `yarn build` | Run full production build | Pre-push validation and CI parity |
| `yarn embeddings` | Regenerate semantic-search vectors | After content/model changes that affect embeddings |
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

### `yarn build`

- Runs: `yarn clean && yarn sass && yarn eleventy && yarn embeddings`.
- This is the production build path used for full validation.
- Expected outputs include:
  - compiled CSS in `build/css/`
  - site HTML/assets in `build/`
  - semantic search vectors in `build/semantic-search/vectors.json`

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

### `scripts/check-links.mjs`

- Active script used by `yarn lint:links`.
- Dependency-free internal-link and anchor validator for the `build/` output.

### `scripts/process-images.js`

- Legacy helper script that is currently a non-functional placeholder.
- It is **not** wired into `package.json` (so it is not run by `yarn dev`, `yarn build`, or any current npm/yarn script).
- Image optimization and responsive source handling are currently handled by the Eleventy image pipeline at build time.
- See [`PROCESS_IMAGES.md`](PROCESS_IMAGES.md) for current status, rationale, and source-image preparation guidance.
