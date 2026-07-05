# Fonts

Canonical reference for self-hosted webfont assets and build wiring.

## Recursive font location

Store Recursive assets in:

- [`src/components/kh-font/`](../src/components/kh-font/)

Current active file in CSS:

- `Recursive_VF_1.085--subset-GF_latin_basic.woff2`

## How font assets reach production

Eleventy passthrough copies the whole font directory into the build output:

- Source: `./src/components/kh-font`
- Output: `build/assets/kh-font`
- Config location: [`eleventy.js`](../eleventy.js) via `addPassthroughCopy({ "./src/components/kh-font": "assets/kh-font" })`

## CSS integration

The `@font-face` rule lives in:

- [`src/components/vf-componenet-rollup/index.scss`](../src/components/vf-componenet-rollup/index.scss)

It currently points to:

```scss
src: url('/assets/kh-font/Recursive_VF_1.085--subset-GF_latin_basic.woff2') format('woff2');
```

If you change filenames, update this path to match exactly.

## Verification steps

1. Build the site:

   ```bash
   yarn build
   ```

2. Confirm output file exists:

   ```bash
   ls build/assets/kh-font
   ```

3. Confirm compiled CSS references `/assets/kh-font/...`:

   ```bash
   rg "/assets/kh-font/" build/css/styles.css
   ```

4. In local preview (`yarn dev`), verify the page loads without 404s for the font URL in browser devtools.

## Notes

- `Recursive.woff2` may exist in the asset directory for fallback/experiments, but only the filename referenced in `@font-face` is used.
- Keep fonts self-hosted in `src/components/kh-font/`; do not rely on runtime CDN font URLs for primary rendering.
