# Contributing

This is Ken's personal site. Outside contributions are welcome but the editorial direction is his. This doc covers local development, conventions, and the publishing workflow.

## Local setup

```bash
yarn install
yarn dev      # Sass watch + Eleventy --serve, port 8080
yarn build    # Full production build (clean → sass → eleventy → embeddings)
yarn lint:css # Stylelint on src/**/*.{scss,css}
```

Node 22 is what CI runs. Use the same locally if you can.

`yarn build` downloads the ONNX Runtime (~476 MB into `node_modules`) the first time `@huggingface/transformers` loads. That toolchain is only needed at build time for vector embeddings — the browser runtime is much smaller.

## Branching

- Always branch off `main`. Don't commit to `main` directly.
- Use short, descriptive branch names: `feat/...`, `fix/...`, `docs/...`, `content/...`.
- PR titles are checked by `.github/workflows/pr-title-check.yml`. Look at the workflow if the check fails.

## Image rules (from `CLAUDE.md` — easy to get wrong)

- Place blog images in `src/site/images/blog/`.
- Reference them in frontmatter as `/blog/filename.jpg` — **not** `/images/blog/`. The build adds the `/images/` prefix.
- The `image:` field is the in-page hero. For the OpenGraph card override, use `og_image:` with a full URL.
- For Ken's own photos, attribution is `credit: "Own work."` (not "Photo by Ken Hawkins"). Put location context in the `text` caption.
- `--` in Markdown becomes `—` (markdown-it config). Write `--`, get an em dash.

## CSS rules

- All custom styles must be nested inside `body:has(#kh-css-toggle:checked)` (see `src/components/vf-componenet-rollup/index.scss`). Styles outside that scope break the CSS-free viewing mode.
- The directory `src/components/vf-componenet-rollup/` has a typo on purpose. Don't rename it — paths depend on it.

## Editorial workflow

For posts and impact stories, read these in order:

1. `src/site/style-guide/editorial.njk` — voice, tone, structure, formatting (canonical).
2. `docs/PUBLISHING_WORKFLOW.md` — the end-to-end publishing flow.
3. `docs/ROLE_TECHNICAL_REVIEWER.md`, `docs/ROLE_EDITORIAL_STYLE_EDITOR.md`, `docs/ROLE_SEO_DISCOVERABILITY_EDITOR.md` — reviewer roles. Run these passes before publishing.
4. `docs/STYLE_REVIEW_PROCESS.md` — how a review pass actually runs.

Two posts in particular: don't over-em-dash. Ken's house style prefers `;`, `:`, `,`, `.` — aim for 0–1 em dashes in digests and 1–2 in long posts. Markdown still converts `--` to `—`; just use them sparingly.

## Commits and PRs

- Conventional-ish commit subjects (`fix:`, `feat:`, `content:`, `docs:`) — match what you see in `git log`.
- One logical change per PR. Big content drops (a new post + new images + a redirect) can ride together.
- CI runs `yarn lint:css` (advisory, doesn't fail) and `yarn build` (fails the PR if the build breaks).

## Deployment

Merge to `main` triggers GitHub Actions (`build-and-deploy.yml`); Vercel auto-deploys the production site from GitHub. See `docs/DEPLOYMENT.md` for redirect and proxy details.

## Where things live

| Layer                  | Path                                       |
| ---------------------- | ------------------------------------------ |
| All Eleventy config    | `eleventy.js`                              |
| Templates & content    | `src/site/`                                |
| Styles                 | `src/components/vf-componenet-rollup/`     |
| Build-time scripts     | `scripts/` (see `docs/SCRIPTS.md`)         |
| Architecture overview  | `docs/ARCHITECTURE.md`                     |
| Project-specific gotchas | `CLAUDE.md`                              |
