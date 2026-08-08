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

## Retained but not loaded

Two faces sit in this directory that no `@font-face` rule references. They are
kept deliberately. Do not "tidy" them away.

| File | Size | Why it stays |
| --- | --- | --- |
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
/assets/kh-font/IBMPlexMono-Regular.woff2
```

`src/site/_includes/layouts/base.njk` preloads Sans Regular and Mono Regular.
`src/site/_includes/layouts/social-card.njk` carries its own copy of the
`@font-face` rules pointing at absolute production URLs, because the social
card is screenshotted standalone. Update both when filenames change.
