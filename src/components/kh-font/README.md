# IBM Plex webfont assets (self-hosted)

Canonical setup and troubleshooting documentation lives in
[`docs/FONTS.md`](../../../docs/FONTS.md).

## Source of truth

- Upstream packages: `@ibm/plex-sans`, `@ibm/plex-mono` (npm)
- This directory is the source path for local font assets:
  `src/components/kh-font/`

## Current active assets

IBM Plex ships no variable build, so each weight is a separate static file:

| File | Family | Weight | Style |
| --- | --- | --- | --- |
| `IBMPlexSans-Regular.woff2` | IBM Plex Sans | 400 | normal |
| `IBMPlexSans-Italic.woff2` | IBM Plex Sans | 400 | italic |
| `IBMPlexSans-SemiBold.woff2` | IBM Plex Sans | 600 | normal |
| `IBMPlexMono-Regular.woff2` | IBM Plex Mono | 400 | normal |

`font-weight: 700` resolves to SemiBold 600 (nearest declared weight) rather
than synthesising a faux bold. There is no bold italic; browsers synthesise
one on the rare `<em><strong>` nesting.

These are the *complete* faces, not the Latin-1 splits. The site uses em
dashes, curly quotes, `&#8209;` and `↦`, which the splits do not cover.

## Superseded

`Recursive_VF_1.085--subset-GF_latin_basic.woff2` and `Recursive.woff2` are no
longer referenced by any stylesheet. `Datatype.woff2` is still used by a blog
post and must stay.

## Build + runtime paths

Eleventy passthrough copies this directory to:

- Output directory: `build/assets/kh-font/`

The `@font-face` rules in
`src/components/vf-componenet-rollup/index.scss` must reference:

```css
/assets/kh-font/IBMPlexSans-Regular.woff2
/assets/kh-font/IBMPlexSans-Italic.woff2
/assets/kh-font/IBMPlexSans-SemiBold.woff2
/assets/kh-font/IBMPlexMono-Regular.woff2
```

`src/site/_includes/layouts/base.njk` preloads Sans Regular and Mono Regular.
`src/site/_includes/layouts/social-card.njk` carries its own copy of the
`@font-face` rules pointing at absolute production URLs, because the social
card is screenshotted standalone. Update both when filenames change.
