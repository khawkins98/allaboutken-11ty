# Fonts

Canonical reference for self-hosted webfont assets and build wiring.

## Font location

Keep self-hosted font assets in:

- [`src/components/kh-font/`](../src/components/kh-font/)

The current faces are self-hosted:

- `IBMPlexSans-Regular.woff2` — 400 normal
- `IBMPlexSans-Italic.woff2` — 400 italic
- `IBMPlexSans-SemiBold.woff2` — 600 normal
- `league-mono/LeagueMono-VF.woff2` — variable weight 100–800 and width 50–200%
- `science-gothic/ScienceGothic-Cover.woff2` — fixed 750-weight instance for the homepage cover trial
- `Anton-Latin.woff2` — 400 normal, other display headings across the shared site layouts (15 KB; SIL OFL, see the font directory README)

Current controls use Plex Sans 600; code and metadata use League Mono at weight
400 and width 100%. Plex Sans requests for 700 resolve to the nearest declared
600 face. Anton has one declared weight, 400. `font-synthesis-weight: none`
prevents synthetic bold; League Mono supplies genuine interpolated weights
within its declared range. Keep the family explicit in shared controls so a
retained base rule cannot silently select the mono face.

## League Mono variable face

The unmodified [League Mono 2.300 release](https://github.com/theleagueof/league-mono/releases/tag/2.300)
by Tyler Finck supplies code and supporting labels. The local WOFF2 retains all
546 encoded code points and both variable axes. Inspection of the actual
`fvar` table gives:

| Axis | Minimum | File default | Maximum | Site setting |
| --- | ---: | ---: | ---: | ---: |
| Weight (`wght`) | 100 | 100 | 800 | 400 |
| Width (`wdth`) | 50 | 50 | 200 | 100% |

Declare those ranges in `@font-face` and request them with `font-weight` and
`font-stretch`. The file defaults are thin and condensed, so request the site
settings explicitly. There is no slant or optical-size axis.

Pinned download URLs, original license, checksums and archive members live in
[`league-mono/README.md`](../src/components/kh-font/league-mono/README.md).
`IBMPlexMono-Regular.woff2` remains available as an archived former site face;
it is no longer the globally loaded mono font.

## Science Gothic cover trial

The homepage cover line uses a fixed, Latin-subset instance of official Science
Gothic at `wght 750`, `wdth 60`, `slnt -5`, `CTRS 0`. It is about 32 KB and is
preloaded only on the homepage. Other display headings and social cards remain
Anton. Only the cover instance is shipped; the full variable font and the
experimental type playground are not included.

Source, retained license, actual axis ranges and output checksums live in
[`science-gothic/README.md`](../src/components/kh-font/science-gothic/README.md).
Rebuild the cover instance with
`python3 scripts/prepare-science-gothic.py` using `fonttools[woff]`.
No new outlines are drawn. The inspected custom contrast tag is `CTRS`, even
though the upstream README currently calls it `CNTR`.

## How font assets reach production

Eleventy passthrough copies the whole font directory into the build output:

- Source: `./src/components/kh-font`
- Output: `build/assets/kh-font`
- Config location: [`config/eleventy/assets-and-search.js`](../config/eleventy/assets-and-search.js) via `addPassthroughCopy({ "./src/components/kh-font": "assets/kh-font" })`

## CSS integration

Font declarations and their consumers have separate owners:

| Concern | Maintained source |
| --- | --- |
| Plex Sans and League Mono | `src/components/vf-componenet-rollup/index.scss` |
| Anton and Science Gothic cover faces | `src/components/vf-componenet-rollup/_kh-cartridge.scss` |
| Page preloads | `src/site/_includes/layouts/base.njk`: Sans Regular and League Mono variable, plus Anton on cartridge pages and the Science Gothic cover instance on home |
| Standalone social-card faces | `src/site/_includes/layouts/social-card.njk`: Anton and Plex Sans use same-origin asset URLs |

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

- The `Recursive*.woff2` variable files are retained but unloaded (see `src/components/kh-font/README.md`). `Datatype.woff2` is still used by a blog post.
- The retained Plex files are the *complete* faces, not the Latin-1 splits: the site uses em dashes, curly quotes, `&#8209;` and `↦`, which the splits do not cover.
- Keep fonts self-hosted in `src/components/kh-font/`; do not rely on runtime CDN font URLs for primary rendering.
