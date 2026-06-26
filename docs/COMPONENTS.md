# Components guide

Custom styles and static UI assets live under `src/components/`.

## Directory map

| Path | Purpose | Build behavior |
| --- | --- | --- |
| `src/components/vf-componenet-rollup/` | Main Sass entry and style system | Compiled to `build/css/styles.css` by `yarn sass` / `yarn dev` |
| `src/components/kh-ambience/` | Decorative ambient background SCSS mixin | Imported into the rollup entrypoint |
| `src/components/kh-font/` | Self-hosted Recursive font files | Copied to `build/assets/kh-font/` via passthrough |
| `src/components/ken-favicon/assets/` | Favicon/manifest assets | Copied to `build/assets/ken-favicon/assets/` via passthrough |

> `vf-componenet-rollup` is intentionally misspelled for path stability. Do not rename it.

## Build wiring

### Sass compilation

`package.json` scripts compile this exact file:

`src/components/vf-componenet-rollup/index.scss`

Output:

`build/css/styles.css`

### Rollup entrypoint responsibilities

`index.scss`:

1. Loads base modules (`normalize`, `kh-content`, `semantic-search`, `kh-ambience`).
2. Defines global tokens and component classes.
3. Scopes custom styling under:

```scss
body:has(#kh-css-toggle:checked) { ... }
```

All new custom styles should live inside that scope so CSS-off mode still works.
4. Imports the ambience mixin from `src/components/kh-ambience/_kh-ambience.scss` so the decorative background stays part of the same build.

## Component integration in templates

Templates consume component output mainly via class names and static assets:

- Global stylesheet link in `layouts/base.njk` (`/css/styles.css`)
- Font preload in `layouts/base.njk` (`/assets/kh-font/...woff2`)
- Favicon links in `layouts/base.njk` (`/assets/ken-favicon/assets/...`)
- Ambience markup included from `partials/ambience.njk`

## Adding a new component

1. Add/update SCSS in `src/components/` (usually via `index.scss` imports or inline module styles).
2. Use `kh-` prefix for class naming, matching existing conventions.
3. If component needs static assets, place them under an existing passthrough path or add a passthrough rule in `eleventy.js`.
4. Add markup in templates/partials under `src/site/`.

## Build requirements and checks

- `yarn dev`: local Sass watch + Eleventy dev server.
- `yarn lint:css`: stylelint for SCSS/CSS changes.
- `yarn build`: full production build (includes Sass + Eleventy + embeddings).

For broader CSS architecture constraints, see [`CSS_ARCHITECTURE.md`](CSS_ARCHITECTURE.md). For Eleventy passthrough details, see [`ELEVENTY_CONFIG.md`](ELEVENTY_CONFIG.md).
