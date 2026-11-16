# Self-hosted font assets

Canonical setup and troubleshooting documentation lives in
[`docs/FONTS.md`](../../../docs/FONTS.md).

## Source of truth

- Plex upstream packages: `@ibm/plex-sans`, `@ibm/plex-mono` (npm)
- League Mono: [official release 2.300](https://github.com/theleagueof/league-mono/releases/tag/2.300), by Tyler Finck; original license and pinned checksums in [`league-mono/README.md`](league-mono/README.md)
- This directory is the source path for local font assets:
  `src/components/kh-font/`

## Current active assets

Plex Sans uses static files; League Mono supplies variable weight and width:

| File | Family | Weight | Style |
| --- | --- | --- | --- |
| `IBMPlexSans-Regular.woff2` | IBM Plex Sans | 400 | normal |
| `IBMPlexSans-Italic.woff2` | IBM Plex Sans | 400 | italic |
| `IBMPlexSans-SemiBold.woff2` | IBM Plex Sans | 600 | normal |
| `league-mono/LeagueMono-VF.woff2` | League Mono | 100–800, width 50–200% | normal |
| `RecursiveCasual-Note.woff2` | Recursive Note | 400 | normal |
| `Anton-Latin.woff2` | Anton | 400 | normal |

`RecursiveCasual-Note.woff2` (14 KB) is the handwriting used by `.kh-hand`. It
is a static instance cut from the archived variable build below with
`fontTools.varLib.instancer` at `MONO 0, CASL 1, CRSV 1, slnt -9, wght 480`,
then subset to Basic Latin plus curly quotes, dashes and the ellipsis. A
character outside that set falls back to Plex Sans, so recut it if the note
ever needs one.

For Plex Sans, `font-weight: 700` resolves to the loaded SemiBold 600 face.
No semibold italic face is loaded for Sans. The shared
`font-synthesis-weight: none` rule prevents synthetic bold. Controls explicitly
use Sans 600; code and metadata use League Mono 400 at width 100%.

These are the *complete* faces, not the Latin-1 splits. The site uses em
dashes, curly quotes, `&#8209;` and `↦`, which the splits do not cover.

## Cartridge display face

`Anton-Latin.woff2` (15 KB) is used for display headings across the site. IBM Plex remains the reading and interface face.
Anton is a single-weight typeface: declare weight 400, not a synthetic 900.

Source: [Google Fonts, Anton](https://github.com/google/fonts/tree/main/ofl/anton),
`Anton-Regular.ttf`. Its SIL Open Font License is included as `ANTON-OFL.txt`.
The WOFF2 is produced with FontTools 4.64.0, subset to U+0020–00FF plus
U+2013–2014, U+2018–2019, U+201C–201D and U+2026. Symbols outside that set use
the fallback face. The conditional preload lives in `layouts/base.njk`; site pages inherit `cartridgeTheme` from their layout and preload this asset. The standalone social-card template also declares Anton and Plex using same-origin paths so its preview matches its deployment.

## League Mono

`league-mono/LeagueMono-VF.woff2` is the complete, unmodified upstream variable
font (56,576 bytes; 546 encoded code points). Its actual axes are weight
100–800 (file default 100) and width 50–200 (file default 50). The site and
[specimen](/design-lab/type/) explicitly request weight 400 and width 100%.
The original license, matching TTF, pinned release URL and SHA-256 hashes are
recorded in [`league-mono/README.md`](league-mono/README.md). No font build
dependency is added to the site.

## Retained but not loaded

Archived faces without a global `@font-face` rule are
kept deliberately. Do not "tidy" them away.

| File | Size | Why it stays |
| --- | --- | --- |
| `IBMPlexMono-Regular.woff2` | 48 KB | Former global mono face; retained as archive |
| `Recursive.woff2` | 155 KB | Superseded by IBM Plex, retained as archive |
| `Recursive_VF_1.085--subset-GF_latin_basic.woff2` | 287 KB | Variable build of the same, retained as archive |
| `Datatype.woff2` | 73 KB | Actively used by a blog post |

### Why Recursive is retained

Recursive was the site's typeface from 2025 until IBM Plex replaced it, and
both halves of that story live in one post:

- **[Recursion: it's fonts all the way down](https://www.allaboutken.com/posts/20250904-switching-to-recursive/)**
  (`src/site/posts/20250904-switching-to-recursive.njk`) — why it was adopted,
  with a drag-to-compare slider of the change, and an Update box at the top
  recording the move back to IBM Plex.

"Recover them from git history" was the previous instruction here, and it is
the wrong answer for a site whose own writing is about keeping an archive
together. A file that survives only in history is one `git gc` and one
force-push away from gone, and nobody browsing this directory would know the
faces had ever existed. 442 KB is a cheap price for the artefact staying next
to the writing that explains it.

They are not served: no `@font-face` rule points at them, so they cost a reader
nothing. They are passthrough-copied to `build/assets/kh-font/` along with
everything else here, which is deliberate — the URLs in the 2025 posts keep
resolving.

If you ever do want them gone, the test is whether the posts above have been
retired too. Until then, they stay.

## Build + runtime paths

Eleventy passthrough copies this directory to:

- Output directory: `build/assets/kh-font/`

The `@font-face` rules in
`src/components/vf-componenet-rollup/index.scss` must reference:

```css
/assets/kh-font/IBMPlexSans-Regular.woff2
/assets/kh-font/IBMPlexSans-Italic.woff2
/assets/kh-font/IBMPlexSans-SemiBold.woff2
/assets/kh-font/league-mono/LeagueMono-VF.woff2
```

`src/site/_includes/layouts/base.njk` preloads Sans Regular and League Mono variable.
`src/site/_includes/layouts/social-card.njk` carries its own copy of the
`@font-face` rules pointing at same-origin root-relative URLs, because the social
card is screenshotted standalone. Update both when filenames change.

## Comparison-only variable faces

`plex-variable/` holds the official Roman Plex Mono and Sans variable builds
used by `/design-lab/type/`. They load on selection in the playground; ordinary
site pages keep the current font stack. See the directory README for pinned
source URLs, checksums and retained OFL licenses.

## Science Gothic cover trial

`science-gothic/` contains the full four-axis WOFF2 for the playground and a
small fixed Latin instance used only by the homepage cover line. Other display
headings retain Anton. The directory README records official source, retained
licenses, chosen axes and the preparation command.
