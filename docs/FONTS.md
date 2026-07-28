# Fonts

Canonical reference for self-hosted webfont assets and build wiring.

## Font location

Store IBM Plex assets in:

- [`src/components/kh-font/`](../src/components/kh-font/)

Current active files in CSS (IBM Plex ships no variable build, so each weight
is a separate static file):

- `IBMPlexSans-Regular.woff2` — 400 normal
- `IBMPlexSans-Italic.woff2` — 400 italic
- `IBMPlexSans-SemiBold.woff2` — 600 normal
- `IBMPlexMono-Regular.woff2` — 400 normal

`font-weight: 700` resolves to SemiBold 600, the nearest declared weight.

## How font assets reach production

Eleventy passthrough copies the whole font directory into the build output:

- Source: `./src/components/kh-font`
- Output: `build/assets/kh-font`
- Config location: [`eleventy.js`](../eleventy.js) via `addPassthroughCopy({ "./src/components/kh-font": "assets/kh-font" })`

## CSS integration

The `@font-face` rule lives in:

- [`src/components/vf-componenet-rollup/index.scss`](../src/components/vf-componenet-rollup/index.scss)

It currently declares four `@font-face` rules pointing at:

```scss
src: url('/assets/kh-font/IBMPlexSans-Regular.woff2') format('woff2');
src: url('/assets/kh-font/IBMPlexSans-Italic.woff2') format('woff2');
src: url('/assets/kh-font/IBMPlexSans-SemiBold.woff2') format('woff2');
src: url('/assets/kh-font/IBMPlexMono-Regular.woff2') format('woff2');
```

Two other places hardcode font paths and must be updated in step:

- `src/site/_includes/layouts/base.njk` preloads Sans Regular and Mono Regular.
- `src/site/_includes/layouts/social-card.njk` repeats the `@font-face` rules
  with absolute production URLs, because the card is screenshotted standalone.

If you change filenames, update all three to match exactly.

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

- The `Recursive*.woff2` files remain in the asset directory but are no longer referenced by any stylesheet. `Datatype.woff2` is still used by a blog post.
- These are the *complete* Plex faces, not the Latin-1 splits: the site uses em dashes, curly quotes, `&#8209;` and `↦`, which the splits do not cover.
- Keep fonts self-hosted in `src/components/kh-font/`; do not rely on runtime CDN font URLs for primary rendering.
