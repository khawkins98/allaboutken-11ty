# Fonts

Canonical reference for self-hosted webfont assets and build wiring.

## Font location

Keep self-hosted font assets in:

- [`src/components/kh-font/`](../src/components/kh-font/)

The loaded builds are static; each declared weight/style has its own file:

- `IBMPlexSans-Regular.woff2` — 400 normal
- `IBMPlexSans-Italic.woff2` — 400 italic
- `IBMPlexSans-SemiBold.woff2` — 600 normal
- `IBMPlexMono-Regular.woff2` — 400 normal
- `Anton-Latin.woff2` — 400 normal, display headings across the shared site layouts (15 KB; SIL OFL, see the font directory README)

Current controls use Plex Sans 600; code and metadata use Plex Mono 400. Plex Sans requests for 700 resolve to the nearest declared 600 face. Anton and Plex Mono each have one declared weight, 400.

`font-synthesis-weight: none` prevents synthetic bold. A request for Mono 600 therefore still renders the loaded 400 face; it does not provide the semibold used by Sans controls. Add a real face before documenting another supported weight. Keep the declared family explicit in shared controls so a retained base rule cannot silently select Mono.

## How font assets reach production

Eleventy passthrough copies the whole font directory into the build output:

- Source: `./src/components/kh-font`
- Output: `build/assets/kh-font`
- Config location: [`config/eleventy/assets-and-search.js`](../config/eleventy/assets-and-search.js) via `addPassthroughCopy({ "./src/components/kh-font": "assets/kh-font" })`

## CSS integration

Font declarations and their consumers have separate owners:

| Concern | Maintained source |
| --- | --- |
| Plex faces and optional Recursive Note | `src/components/vf-componenet-rollup/index.scss` |
| Anton display face | `src/components/vf-componenet-rollup/_kh-cartridge.scss` |
| Page preloads | `src/site/_includes/layouts/base.njk`: Sans Regular and Mono Regular, plus Anton on cartridge pages |
| Standalone social-card faces | `src/site/_includes/layouts/social-card.njk`: Anton and Plex use same-origin asset URLs |

All face URLs use `/assets/kh-font/`. When renaming an asset, update its declaration and each consumer in this table. Social cards are standalone documents, so a font loading correctly in the shared layout does not verify a social card.

The [font-directory README](../src/components/kh-font/README.md) records face sources, licensing, subsets and archived assets. The [component reference](../src/site/style-guide/components.njk) documents visual roles and control markup.

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

- The `Recursive*.woff2` variable files are retained but unloaded (see `src/components/kh-font/README.md`). `RecursiveCasual-Note.woff2`, a 14 KB static cut of them, is loaded for the handwritten `.kh-hand` note. `Datatype.woff2` is still used by a blog post.
- These are the *complete* Plex faces, not the Latin-1 splits: the site uses em dashes, curly quotes, `&#8209;` and `↦`, which the splits do not cover.
- Keep fonts self-hosted in `src/components/kh-font/`; do not rely on runtime CDN font URLs for primary rendering.
