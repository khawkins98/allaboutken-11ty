# Refactor plan: remove Sass complexity and simplify Nunjucks

This document outlines a staged approach to reduce/remove Sass usage, flatten SCSS features to plain CSS, and simplify Nunjucks usage within the Eleventy site.

## Objectives

- Reduce/remove Sass and related tooling.
- Keep a single, maintainable CSS artifact.
- Trim NJK-specific complexity and legacy shims.
- Keep Eleventy simple with minimal build steps.

## Scope snapshot (current)

- Sass entry: `src/components/vf-componenet-rollup/index.scss` compiled to `build/css/styles.css`.
- Sass features: `@use 'sass:meta'` with `meta.load-css`, variables for breakpoints, nesting, ampersands.
- CSS custom properties are already heavily used (good).
- Eleventy config: `eleventy.js` adds shims for `{% render %}` and `{% codeblock %}` and has passthroughs for assets.

## Phases

### Phase 0 — Baseline and safety

1) Branch already exists.
2) Capture visual baseline for key pages (home, blog index, a couple of posts, CV, search) across mobile/desktop.

### Phase 1 — Refactor SCSS in place (no CSS freeze)

Goal: remove Sass complexity while keeping the Sass toolchain. Minimize features to variables and simple structure; avoid meta tricks and deep nesting.

Steps:

- Keep existing `yarn sass` build and Eleventy scripts unchanged for now.
- Replace `meta.load-css` usage with standard module syntax:
  - In `index.scss`, replace `@include meta.load-css('./normalize');` with `@use './normalize' as *;`
  - Replace `@include meta.load-css('./vf-content');` with `@use './vf-content' as *;`
- Centralize and audit breakpoint variables:
  - Ensure `$kh-breakpoint--*` exist only in one place (extract to `_settings.scss` if helpful) and are the only breakpoints used.
- Reduce selector nesting and `&` usage:
  - Cap nesting to 1 level; expand complex selectors to flat, explicit selectors.
  - Prefer utility classes and clear component blocks over chained nesting.
- Prefer CSS Custom Properties for colors/spacing already defined in `:root`; keep Sass variables only where needed for media queries or calculations.
- Remove any unused partials/imports and dead code while keeping visual parity.

Notes:

- Media queries cannot use CSS variables; keep SCSS breakpoint variables for queries.

### Phase 2 — Simplify tooling (keep Sass, minimize features)

After Phase 1 parity is confirmed:

- Keep Sass but remove advanced Sass dependencies/usage you no longer need.
- Stylelint:
  - Keep `stylelint-scss` only if SCSS-specific rules are still needed; otherwise move toward a leaner config.
  - Enforce a max nesting depth (e.g., 1) and discourage deep selectors.
- Ensure the build remains: `yarn sass` -> `build/css/styles.css`, referenced by templates as before.

### Phase 3 — Prune and modernize CSS (incremental)

Optional but recommended cleanup over time:

- Organize CSS by concern (optional): `base.css`, `components.css`, `utilities.css`. Keep a single file if preferred.
- Remove dead rules:
  - Quick path: create a small script using `node-html-parser` to list used classes/ids from `build/**/*.html` and guide safe deletions.
  - Conservative path: prune in small batches with visual checks.
- Normalize reset:
  - If `normalize` content is embedded, consider a minimal static normalization section or `modern-normalize` CSS.
- Consolidate utilities:
  - Merge duplicated utilities; keep a single source of spacing/visibility helpers.
- Optional CSS layers for clarity, no extra tooling required:
  - Example order: `@layer reset, base, components, utilities;`

### Phase 4 — Simplify Nunjucks and Eleventy config

- Replace custom tags where possible:
  - `{% render %}` shim: replace with includes or inline content; remove shim when no longer used.
  - `{% codeblock %}`: replace with fenced Markdown (handled by `markdown-it`); remove shim after replacement.
- Reduce macro/partial sprawl:
  - Prefer a single base layout with blocks and small includes.
- Audit passthroughs:
  - Remove passthroughs for unused VF assets (e.g., `vf-search-client-side.js`) if not needed.
- Ensure all templates reference the static CSS at `/css/styles.css`.

### Phase 5 — Cleanup and docs

- Remove Sass-related dependencies and scripts completely once SCSS is gone.
- Update `README.md` to document the new CSS location and contribution notes.
- Keep a short note on CSS pruning approach and utilities strategy.

## Optional alternative: gradual SCSS→CSS conversion

If later you decide to freeze CSS instead:

- Replace `$kh-breakpoint--*` with literal values in `index.scss`.
- Inline `normalize`/`vf-content` (replace `meta.load-css` with direct content or `@use ... as *`).
- Expand nested selectors (let Sass output once, then keep the CSS).
- Switch templates to a static CSS artifact and remove Sass from the build.

## Quick checks

- Visual parity for key pages and breakpoints.
- No missing assets (CSS/fonts) after passthrough changes.
- Lint passes with CSS-only rules.

## Quick TODO list (actionable)

- [x] Confirm branch exists and capture baseline screenshots
- [ ] Replace `meta.load-css` with `@use ... as *` in `index.scss`
- [ ] Extract and centralize breakpoint variables
- [ ] Limit nesting depth to 1 and flatten selectors
- [ ] Remove unused SCSS partials and imports
- [ ] Keep CSS variables for colors/spacing; use Sass only for media
- [ ] Tighten stylelint rules (max nesting, discourage deep selectors)
- [ ] Verify build outputs expected CSS; visual parity on key pages
- [ ] Prune unused CSS selectors incrementally
- [ ] Consolidate and clean utility classes
- [ ] Replace NJK `render` with includes; remove shim
- [ ] Replace NJK `codeblock` with fenced markdown; remove shim
- [ ] Audit passthroughs; drop unused VF assets
- [ ] Update `README.md` with SCSS conventions and refactor outcome
