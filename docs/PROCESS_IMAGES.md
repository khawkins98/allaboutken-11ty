# Image source preprocessing (`scripts/process-images.js`)

This file describes the status of `scripts/process-images.js` and how source images are handled today.

## Current purpose

`scripts/process-images.js` was introduced as a planned helper for local, batch preprocessing of source images before they are committed. Its historical intent was to standardize source assets (for example, stripping EXIF metadata and resizing before version control).

## Current implementation status

The script is currently a placeholder and is not implemented. It contains only a descriptive comment block and no executable logic.

It is also **not invoked by any Yarn script** (`yarn dev`, `yarn build`, or any other command in `package.json`). It is therefore an inactive artifact in the repository.

## Why it is not wired into scripts

- The build pipeline already handles image optimization and responsive output through the Eleventy image transform configured in `eleventy.js`.
- Keeping a second local image pre-processing step is unnecessary for the active workflow and would add duplicate complexity.
- If and when this helper is reintroduced, it should be reviewed against the current Node and script dependencies before wiring into `package.json`.

## Source-image handling today

For current work, contributors should use direct source-image preparation:

1. Optimize and sanitize images before adding them to the repo.
1. Add images under `src/site/images/blog/` using repository image naming conventions.
1. In post frontmatter, reference hero images as `/blog/<filename>` so the Eleventy image pipeline rewrites paths correctly.
1. See [`IMAGE_GENERATION.md`](IMAGE_GENERATION.md) for the full production workflow and attribution requirements.

