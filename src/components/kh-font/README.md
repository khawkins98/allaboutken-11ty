# Recursive webfont assets (self-hosted)

Canonical setup and troubleshooting documentation lives in
[`docs/FONTS.md`](../../../docs/FONTS.md).

## Source of truth

- Upstream project: <https://github.com/arrowtype/recursive/tree/main/fonts>
- This directory is the source path for local font assets:
  `src/components/kh-font/`

## Current active asset

- `Recursive_VF_1.085--subset-GF_latin_basic.woff2`

## Build + runtime paths

Eleventy passthrough copies this directory to:

- Output directory: `build/assets/kh-font/`

The `@font-face` rule in
`src/components/vf-componenet-rollup/index.scss` must reference:

```css
/assets/kh-font/Recursive_VF_1.085--subset-GF_latin_basic.woff2
```
