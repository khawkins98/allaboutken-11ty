# Photo entries: a fourth content type

Design for adding photographs to the site as a first-class content type,
alongside blog posts, digesting entries and impact stories.

Status: approved 14 Aug 2026. First entry: a black-and-white frame from the
roof of the Bundeskunsthalle in Bonn, 12 August 2026.

## Why

The site has three kinds of entry and no way to publish a photograph. A photo
is not a blog post: it has almost no body text, the image is the content rather
than an illustration of it, and a title-and-teaser listing shows none of what
makes it worth publishing. Modelling it as a post with a hero image would put
blog-post chrome around something that wants a picture and a caption.

## Approach

Follow the `digesting` pattern, which is how this site already models a
distinct kind of entry: a tag, a layout, a listing page, and a slot in the
combined register. Every piece has a working twin in the repo.

Two approaches were rejected. Treating photos as a flavour of post saves less
than it appears to, because the thumbnail grid needs a collection either way.
A data-driven gallery built from `_data/photos.json` would put content in a
data file, which fights every other thing on this site, and would mean a photo
could never grow a paragraph.

## Content model

A photo entry is a file in `src/site/posts/`, the same directory digesting
entries live in. It carries:

```yaml
title: "..."
layout: layouts/photo.njk
tags: photos
date: 2026-08-12
image: /blog/<filename>.jpg
image_meta:
  text: "<caption>"
  credit: "Own work."
  altext: "<description for screen readers>"
photo_meta:
  place: "Kunst- und Ausstellungshalle der Bundesrepublik Deutschland, Bonn"
  taken: 2026-08-12 19:03
  camera: "iPhone 13 mini · ƒ/1.6 · 1/5556 · 5.1 mm · ISO 50"
```

`image` and `image_meta` are reused verbatim from the post model, so the
existing image transform, the build-time `/images/` prefix rewrite and the
Schema.org block keep working with no changes. Note the CLAUDE.md rule: the
frontmatter value is `/blog/…`, never `/images/blog/…`.

`photo_meta` is new and entirely optional. `place` is the only field read
outside the entry page: the grid prints it under each thumbnail. `taken` and
`camera` are display-only on the entry page. `taken` carries the precise time,
which `date` does not; the grid and every collection sort on `date` as usual,
so the two never compete.

### URLs

Photo entries resolve to `/posts/<slug>/`, exactly as digesting entries do.
This was a deliberate choice over a `/photos/<slug>/` permalink. "Posts" in a
photo URL is slightly wrong, but the alternative makes photos the only content
type whose files and URLs diverge, and it buys nothing: the pulse strip, the
sequence rail, related entries and the sitemap all key on `page.url` and work
identically either way.

## Collections

In `config/eleventy/collections.js`:

- Add a `photos` collection: tag-filtered, drafts removed via the existing
  `published` helper, sorted newest first. Follows the shape of
  `impactStories`.
- Add `photos` to the `allContent` filter, so photographs join the combined
  register at `/all/`.
- Add `photos` to the `topics` filter, so a photograph can be filed under a
  subject and counts toward a topic earning a page.
- Add a merged `feedEntries` collection: posts plus photos, drafts removed,
  newest first. See the feed section below.

`blogPosts` needs no change. It already requires the `posts` tag, which photo
entries do not carry, so photographs stay out of the blog listing without a
new exclusion.

`kens_status: draft` works for photos with no extra code, because every filter
above routes through `published`.

## Layout: `layouts/photo.njk`

A sibling of `layouts/digesting.njk`, sharing its skeleton:

1. Pulse strip, as every entry carries.
2. Breadcrumb back to `/photos/`.
3. The photograph, rendered full content-grid width rather than inside the
   narrower body text column that `post.njk` puts its hero in. Concretely: the
   image breaks out of `.kh-content` and spans the stylized grid, capped at the
   image's own intrinsic width so it is never upscaled. This is the one real
   departure from `post.njk`.
4. Title, date, and `photo_meta.place`.
5. Caption and credit from `image_meta`, then the `camera` line if present.
6. `partials/entry-foot.njk`, the same byline, related entries and sequence
   rail every other entry gets. Without it, a photo reached from a link is a
   dead end.

Care point from CLAUDE.md: the image transform rewrites a processed `<img>`
into `<picture><source><img></picture>`, so any flex or grid positioning must
target `> picture` as well as the image's own class, or the layout breaks
depending on whether the transform ran.

## Listing: `/photos/`

New file `src/site/photos/index.njk`, on `layouts/base.njk`, mirroring
`src/site/digesting/index.njk`.

A responsive thumbnail grid, newest first. Each cell is the image, linked to
its entry, with `photo_meta.place` and the date beneath. A dated text list was
rejected: photographs are the one content type where the image is the summary.

The grid prints other entries' text, which makes it chrome under the CLAUDE.md
rule, so it carries `data-pagefind-ignore`. The page's own intro stays indexed
so `/photos/` remains findable. This is the same treatment `/all/` and the
topic pages already use.

New CSS goes in the Sass rollup, scoped inside
`body:has(#kh-css-toggle:checked)` per the CSS toggle rule, or it will not
apply.

## Feed

`feed.njk` currently iterates `collections.posts | published`, the raw Eleventy
tag collection. That is why digesting entries are not in the feed today.

It changes to iterate the merged `feedEntries` collection: blog posts plus
photographs. Digesting entries stay out, unchanged.

Two alternatives were rejected. Tagging photos `posts` and excluding them from
`blogPosts` would need no feed change, but it redefines `posts` to mean "things
in the feed", a quiet redefinition that costs someone an afternoon later. A
separate `/photos/rss.xml` disrupts nothing because nobody is subscribed to it.

The template must keep filtering drafts before the ten-item slice, not after,
for the reason already recorded in `feed.njk`: an unfinished entry must not push
a published one out of the window.

## Search, embeddings and sitemap

All three are automatic and need no new code.

- **Pagefind**: `base.njk` stamps `data-pagefind-body` on any page not marked
  `noindex`, so photo entries are indexed.
- **Embeddings**: `scripts/generate-embeddings.mjs` walks built HTML rather
  than a collection, so photo entries are in the corpus by default. A caption
  is thin material to embed, but the entry page carries a title, place and
  caption, which is comparable to a short digesting note. The
  `data-pagefind-ignore` on the grid is what keeps the listing itself out.
- **Sitemap**: `sitemap.njk` iterates `collections.all` and filters on layout,
  `noindex` and draft status. Photos qualify with no change.

## Register surfaces to update by hand

These enumerate the content types in prose or markup and will not update
themselves:

- `src/site/all/index.njk`: the Sections panel grows a fourth cell, and the
  intro paragraph naming "three kinds of thing" grows a fourth.
- `src/site/_includes/footer.njk`: a Photos link.

## Image import

Per `.claude/commands/import-image.md`, adapted for a photograph:

1. Convert HEIC to JPEG with `sips`, long edge about 2000px.
2. Compress at quality 70, the value the command specifies for photographs
   rather than the 50 used for flat-colour illustrations.
3. `jpegtran -optimize -progressive -copy none`.
4. Land in `src/site/images/blog/` and log the size reduction.

Source for the first entry: `~/Downloads/Photos/IMG_0072.heic`, 2.9 MB,
4032 × 3024.

## Documentation

- `docs/FRONTMATTER.md`: add `photo_meta` and the `photos` tag value.
- `docs/TEMPLATES.md`: add `layouts/photo.njk`.
- `CLAUDE.md`: record that the feed is now a merged collection and no longer
  the raw `posts` tag, so nobody re-derives why.

## Verification

1. `yarn build` completes.
2. `yarn lint:links` passes. This is a hard CI gate.
3. `grep -rl "\.11ty/image" build --include="*.html"` returns nothing. Per
   CLAUDE.md this failure is intermittent, so a single clean build is not
   proof; rebuild and check again.
4. `/photos/` renders the grid; the entry page renders the photograph, caption
   and camera line.
5. `/all/` shows the photograph in the register and the Sections panel counts
   it.
6. `rss.xml` contains the photo entry and still contains recent blog posts.
7. The entry appears in on-site search; the `/photos/` grid does not return
   other entries' titles as results.

## First entry

Title, caption and alt text describe: a black-and-white frame from the roof
lawn of the Kunst- und Ausstellungshalle der Bundesrepublik Deutschland
(Bundeskunsthalle) in Bonn, 12 August 2026 at 19:03, the evening of the
partial solar eclipse. The two glass cones at right are the building's
Lichttürme. Behind, the Bonn government quarter: the Bundesnetzagentur is the
wide grid slab at centre, and the slim tower at left carrying a round emblem is
the Langer Eugen, the UN building.

Register: "just the photo". Title, date, place, a sentence or two of context,
no thesis.
