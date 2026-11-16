# League Mono variable assets

Original, unmodified variable fonts from Tyler Finck / The League of Moveable
Type, release **2.300**. The site uses the WOFF2 for code and metadata.
The unused TTF is not shipped; the original release remains available below.
Anton remains the display face and Plex Sans the reading/interface face.

## Provenance

- Upstream: <https://github.com/theleagueof/league-mono>
- Release: <https://github.com/theleagueof/league-mono/releases/tag/2.300>
- Tag commit: `444f6c3a1eb9d0d5c00ecc0c3b07d21fdcd37a8a`
- Download: <https://github.com/theleagueof/league-mono/releases/download/2.300/LeagueMono-2.300.zip>
- Archive SHA-256: `3b685afec90f862193974fa6384ac5b472d9049356ee97591374573f1d929f64`

The files were extracted directly, without conversion, instancing, subsetting,
outline changes or metadata changes. `OFL.md` is the original release license,
including the author’s copyright. The full upstream coverage is preserved.

| Local file | Archive member | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `LeagueMono-VF.woff2` | `LeagueMono-2.300/variable/WOFF2/LeagueMono-VF.woff2` | 56,576 | `0cee06308d282305a2da9c1e677ed44133753bfd2e4684536b6bda2511b512f5` |
| `OFL.md` | `LeagueMono-2.300/OFL.md` | 4,372 | `93b32079beb34d7f35c0ccdccbf2601f5edf298486e0f76eef9dfad7f431a468` |

## Inspected font metadata

FontTools 4.64.0 inspection of the shipped WOFF2 reports version
`2.300;RELEASE`, **546 encoded code points**, and these `fvar` axes:

| Tag | Axis | Minimum | File default | Maximum |
| --- | --- | ---: | ---: | ---: |
| `wght` | Weight | 100 | 100 | 800 |
| `wdth` | Width | 50 | 50 | 200 |

The file defaults are **thin and condensed**. The site deliberately requests
weight 400 and width 100%. There is no slant,
italic or optical-size axis in this release. A different weight or width is
real interpolation, rather than synthetic bold or a CSS transform.

Declare the ranges on `@font-face` and use `font-weight` and `font-stretch`
for the registered axes. Avoid a global `font-variation-settings` override,
which would pin the axes and prevent component-level weight/width requests.

```css
@font-face {
  font-family: 'League Mono';
  src: url('/assets/kh-font/league-mono/LeagueMono-VF.woff2') format('woff2');
  font-weight: 100 800;
  font-stretch: 50% 200%;
  font-style: normal;
  font-display: swap;
}
```

Global setup and ownership are documented in [`docs/FONTS.md`](../../../../docs/FONTS.md).
