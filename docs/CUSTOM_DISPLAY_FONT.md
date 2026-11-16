# Ken Cartridge Display experiment

Review at [`/design-lab/type/`](http://localhost:8080/design-lab/type/). This page is
`noindex` and excluded from search and the sitemap. The prototype is not selected by the
shared theme, social cards or any article.

## What it is

An original uppercase geometric display experiment for the cartridge direction.
It uses flat terminals, polygonal bowls and pointed diagonal joins. It does not
reuse outlines from Anton, Plex, Sonic lettering or an existing typeface.

- Variable axis: `wdth`, 65–115, default 85.
- One fixed drawn weight (declared 400); no weight, slant or optical-size axis.
- 64 encoded code points: A–Z, digits, space and the punctuation on the specimen.
- No lowercase or accent coverage. The specimen uppercases input; other characters
  visibly fall back to the browser stack.
- Original source and font outputs are under the SIL Open Font License 1.1.

## Editable source and reproducible build

[`scripts/build-ken-display-font.py`](../scripts/build-ken-display-font.py) is the
source of the centre-line drawings, stroke expansion, spacing, kerning and width
construction. It creates compatible narrow/default/wide TrueType masters in a
temporary directory and merges them with FontTools varLib. Stem thickness remains
120 font units as centre lines and counter widths change; this is not a transform
applied to an existing static font. Diagonals are offset along their normals.

Requirements: Python 3 and `fonttools[woff]` (tested with FontTools 4.64.0).
Keep any installation in a virtual environment; the site’s Node build does not
need these authoring dependencies.

```sh
python3 scripts/build-ken-display-font.py
```

Generated files live in `src/components/kh-font/ken-display/` and pass through to
`/assets/kh-font/ken-display/` with the existing font asset copy. The specimen
loads the WOFF2 only on that page. The TTF is supplied for inspection/editing.

## Validation and remaining work

The build inspects encoded glyphs and instantiates widths 65, 75, 85, 100 and 115.
At those positions it checks that representative letters and digits retain
outlines. Width changes alter the advances. Kerning includes AV, AW, AT, TA, TO,
VA, WA, YA, LT, LY and FA; this is an initial set, not comprehensive kerning.

Rendered specimen inspection covers the narrow/default/wide drawings, the
alphabet and numerals. Local Chromium loaded the WOFF2 and responded to slider
values 65, 85 and 115, with no page overflow at 320px. The page emitted
`noindex,follow`. A 1280px specimen was also visually reviewed. A repeat build
was byte-identical; the H stem remained 120 units at five sampled widths, and
all uppercase pair bounding boxes (including the declared kerning pairs)
remained separated at those widths. Structural checks cannot judge optical quality: the
ampersand, small punctuation, repeated strokes in B/8 and pointed joins still
need refinement. Overlapping stroke contours are intentional and marked
`OVERLAP_SIMPLE`; source topology stays compatible across masters. A production
release needs outline cleanup, broader kerning, accents, more browser/rasteriser
checks and optical review at actual heading sizes.

Use this as a decision specimen. Keep Anton until the lettering earns a replacement.
