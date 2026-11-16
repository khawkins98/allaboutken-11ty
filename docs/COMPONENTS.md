# Components guide

Custom styles and static UI assets live under `src/components/`.

## Directory map

| Path | Purpose | Build behavior |
| --- | --- | --- |
| `src/components/vf-componenet-rollup/` | Main Sass entry and style system | Compiled to `build/css/styles.css` by `yarn sass` / `yarn dev` |
| `src/components/kh-ambience/` | Archived decorative ambient background SCSS | Retained with the lighting tutorial; excluded from the shared CSS bundle |
| `src/components/kh-font/` | Self-hosted Anton, IBM Plex and archived font files | Copied to `build/assets/kh-font/` via passthrough |
| `src/components/ken-favicon/assets/` | Favicon/manifest assets | Copied to `build/assets/ken-favicon/assets/` via passthrough |

> `vf-componenet-rollup` is intentionally misspelled for path stability. Do not rename it.

## Build wiring

### Sass compilation

`package.json` scripts compile this exact file:

`src/components/vf-componenet-rollup/index.scss`

Output:

`build/css/styles.css`

### Rollup entrypoint responsibilities

`index.scss` loads the concern modules, then includes the cartridge shell and system after retained component rules. New rules belong in the relevant module inside `body:has(#kh-css-toggle:checked)`, so the CSS toggle continues to work. The archived ambience stylesheet source remains available for historical material and is excluded from the rollup.

For Sass ownership, nesting limits and compilation checks, use [CSS architecture](CSS_ARCHITECTURE.md). For actual markup, variants and behaviour, use the [component reference](../src/site/style-guide/components.njk).

## Component integration in templates

Templates consume component output mainly via class names and static assets:

- Global stylesheet link in `layouts/base.njk` (`/css/styles.css`)
- Font preload in `layouts/base.njk` (`/assets/kh-font/...woff2`)
- Favicon links in `layouts/base.njk` (`/assets/ken-favicon/assets/...`)
- Current visual tokens and page families from `kh-cartridge` / `kh-cartridge-system`; ambience is retained as an archived technique

## Adding a new component

1. Add/update SCSS in `src/components/` (usually via `index.scss` imports or inline module styles).
2. Use `kh-` prefix for class naming, matching existing conventions.
3. If component needs static assets, place them under an existing passthrough path or add a passthrough rule in `config/eleventy/assets-and-search.js`.
4. Add markup in templates/partials under `src/site/`, reusing an existing partial where it owns the behaviour.
5. Update the component reference with the supported markup, states, accessibility requirements and source location. Update the design guide when the visual decision changes.

## Build requirements and checks

- `yarn dev`: local Sass watch + Eleventy dev server.
- `yarn lint:css`: stylelint for SCSS/CSS changes.
- `yarn build`: full production build (bootstrap HTML, semantic data, final Eleventy).

For broader CSS architecture constraints, see [`CSS_ARCHITECTURE.md`](CSS_ARCHITECTURE.md). For Eleventy passthrough details, see [`ELEVENTY_CONFIG.md`](ELEVENTY_CONFIG.md).

## Visual reference

Update the [design guide](../src/site/style-guide/design.njk) and [live component reference](../src/site/style-guide/components.njk) alongside shared component changes. The palette swatches are shared through `partials/design-tokens.njk`.

The component reference records the UI’s supported markup and behaviour. For maintained patterns, retain copyable markup, supported variants/states, behavioural and accessibility contracts, and source ownership. A visual redesign should update that guidance; removing it requires a real API retirement or a clearly labelled historical replacement. Keep shared heading anchors beside relevant material. Live examples need unique IDs, harmless actions and `data-pagefind-ignore` wrappers.
