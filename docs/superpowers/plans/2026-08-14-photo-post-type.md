# Photo Entries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add photographs to the site as a fourth content type, with their own layout, a thumbnail grid at `/photos/`, a place in the combined register, and inclusion in the RSS feed.

**Architecture:** Follow the existing `digesting` pattern exactly: entries are files in `src/site/posts/` distinguished only by a `tags: photos` value and a `layout: layouts/photo.njk`, resolving to `/posts/<slug>/`. A tag-filtered collection feeds a new listing page. The RSS feed moves from the raw `posts` tag to a merged posts-plus-photos collection.

**Tech Stack:** Eleventy 3.1, Nunjucks templates, Sass (dart-sass, mixin-per-partial rollup), `sips`/`jpegtran` for image processing.

**Spec:** `docs/superpowers/specs/2026-08-14-photo-post-type-design.md`

## Global Constraints

- **Branch:** work on `feature/photo-post-type`, already created.
- **Commit prefixes:** the `.githooks` commit-msg hook rejects anything else. Allowed: `content`, `feature`, `fix`, `ci`, `chore`. Subject ≤ 72 chars, no trailing period. A `docs:` prefix will be rejected.
- **Image paths in frontmatter are `/blog/<file>`, never `/images/blog/<file>`.** The `/images` prefix is added by the template at build time.
- **All new CSS must live inside `body:has(#kh-css-toggle:checked)`** or it will not apply. In this repo that means writing a `@mixin` in a rollup partial and including it in the existing `body:has(...)` block in `index.scss`.
- **`--` in markdown and in `teaser` renders as an em dash.** Write `--` for an em dash; do not paste a literal `—` into content.
- **Em dash restraint in prose:** prefer `;` `:` `,` `.`. Aim for at most one or two em dashes in the published entry copy.
- **Ken's own photos are credited `credit: "Own work."`**, never "Photo by Ken Hawkins".
- **The image transform rewrites `<img>` into `<picture><source><img></picture>`.** Any flex or grid rule positioning an image must target `> picture` as well as the image's own class.
- **Fast iteration loop:** `yarn sass && yarn eleventy` rebuilds into `build/` in seconds. `yarn build` additionally runs embeddings and takes minutes. Use the fast loop for every task except the final verification task.

---

### Task 1: Import and optimise the photograph

**Files:**
- Create: `src/site/images/blog/bundeskunsthalle-roof-eclipse-evening.jpg`
- Source (read-only): `/Users/khawkins/Downloads/Photos/IMG_0072.heic`

**Interfaces:**
- Consumes: nothing.
- Produces: the file `src/site/images/blog/bundeskunsthalle-roof-eclipse-evening.jpg`, referenced in later tasks as the frontmatter value `/blog/bundeskunsthalle-roof-eclipse-evening.jpg`.

- [ ] **Step 1: Confirm the source and record its size**

```bash
ls -lh /Users/khawkins/Downloads/Photos/IMG_0072.heic
file /Users/khawkins/Downloads/Photos/IMG_0072.heic
```

Expected: about 2.9 MB, `ISO Media, HEIF Image`. Note the byte size; you will report the reduction at the end.

- [ ] **Step 2: Convert HEIC to JPEG at 2000px long edge**

The source is 4032 × 3024. `sips -Z` scales the longest edge and preserves aspect ratio.

```bash
sips -s format jpeg -s formatOptions 70 -Z 2000 \
  /Users/khawkins/Downloads/Photos/IMG_0072.heic \
  --out /tmp/bundeskunsthalle-roof.jpg
```

Quality 70 is the value `.claude/commands/import-image.md` specifies for photographs; the 50 in that document is for flat-colour illustrations and will show artefacts in sky gradients.

- [ ] **Step 3: Apply lossless optimisation**

```bash
jpegtran -optimize -progressive -copy none \
  /tmp/bundeskunsthalle-roof.jpg \
  > src/site/images/blog/bundeskunsthalle-roof-eclipse-evening.jpg
```

If `jpegtran` is not installed, install it with `brew install jpeg` or skip this step and note it in the commit message. The step is an optimisation, not a correctness requirement.

- [ ] **Step 4: Verify dimensions and size**

```bash
sips -g pixelWidth -g pixelHeight src/site/images/blog/bundeskunsthalle-roof-eclipse-evening.jpg
ls -lh src/site/images/blog/bundeskunsthalle-roof-eclipse-evening.jpg
```

Expected: 2000 × 1500, and a file comfortably under 900 KB. If it is over 1 MB, re-run step 2 with `formatOptions 60` and repeat.

- [ ] **Step 5: Look at the result**

Open the optimised file and compare it against the source. You are checking the sky for banding and the crowd for mushy detail. This is a black-and-white photograph with a large smooth sky area, which is exactly where JPEG artefacts show first.

- [ ] **Step 6: Commit**

```bash
git add src/site/images/blog/bundeskunsthalle-roof-eclipse-evening.jpg
git commit -m "content: add Bundeskunsthalle roof photograph"
```

---

### Task 2: The photo layout and the first entry

**Files:**
- Create: `src/site/_includes/layouts/photo.njk`
- Create: `src/site/posts/20260812-bundeskunsthalle-roof-eclipse-evening.njk`
- Modify: `src/site/_includes/footer.njk:24`

**Interfaces:**
- Consumes: the image from Task 1 at `/blog/bundeskunsthalle-roof-eclipse-evening.jpg`.
- Produces: the layout path `layouts/photo.njk`; the frontmatter contract `photo_meta.place`, `photo_meta.taken`, `photo_meta.camera`; the built page `build/posts/20260812-bundeskunsthalle-roof-eclipse-evening/index.html`.

- [ ] **Step 1: Write the entry file**

Create `src/site/posts/20260812-bundeskunsthalle-roof-eclipse-evening.njk`:

```njk
---
title: "The roof of the Bundeskunsthalle, eclipse evening"
layout: layouts/photo.njk
teaser: "A crowd on the roof lawn of the Bundeskunsthalle in Bonn, an hour before the partial eclipse of 12 August 2026."
date: 2026-08-12
tags: photos
topics:
  - photography
image: /blog/bundeskunsthalle-roof-eclipse-evening.jpg
image_meta:
  text: "The roof lawn of the Kunst- und Ausstellungshalle der Bundesrepublik Deutschland, Bonn. The two cones are the building's Lichttürme, mosaic below and glass above; behind them the government quarter, with the Bundesnetzagentur at centre and the Langer Eugen, the UN building, at left."
  credit: "Own work."
  altext: "Black and white photograph of a rooftop lawn crowded with people sitting and standing in low evening sun. Two tall glass and stone cones rise at the right. Behind, a wide office block with a grid of windows and a slimmer tower carrying a circular emblem, against a near-black sky."
photo_meta:
  place: "Bundeskunsthalle, Bonn"
  taken: "12 August 2026, 19:03"
  camera: "iPhone 13 mini &middot; &fnof;/1.6 &middot; 1/5556 &middot; 5.1 mm &middot; ISO 50"
kens_status: published
---

{% markdown %}

The roof of the Bundeskunsthalle is open to anyone who walks up, and on the
evening of 12 August it filled. The eclipse was still an hour off and only ever
going to be a partial one this far east; people came up anyway and sat on the
grass in the last of the sun.

{% endmarkdown %}
```

Two notes on this content. `topics: photography` is a new topic value: it will not earn a topic page until three entries carry it, which is the intended behaviour of the `MIN` threshold in `collections.js`. And the `camera` string uses HTML entities rather than literal glyphs so the ƒ-stop renders reliably.

- [ ] **Step 2: Write the layout**

Create `src/site/_includes/layouts/photo.njk`. This is `digesting.njk`'s skeleton with the image promoted to full grid width:

```njk
---
layout: layouts/base.njk
pageClass: photos
templateEngineOverride: njk
---

{#- The publishing strip, as on every other entry. A photograph is a mark in
    the register like any other, so it shows where it sits. -#}
{%- set pulse = collections.allContent | pulseMonths(0) | collapseEmptyYears(timelineGaps) %}
{%- set pulseCurrentKey = date | dateDisplay('yyyy-LL') %}
{% include "partials/pulse-strip.njk" %}

<article class="kh-photo kh-u-margin__top--1200">
  {#- The photograph is the content, not an illustration of it, so it spans the
      full grid rather than sitting in the narrower reading column the way
      post.njk's hero does. Capped at intrinsic width so it is never upscaled.

      `> picture` is targeted alongside the image class because the image
      transform rewrites a processed <img> into <picture><source><img></picture>
      -- a class on the <img> is then a level too deep to position. -#}
  <figure class="kh-photo__figure">
    <img class="kh-photo__img" src="/images{{ image | url }}"
         alt="{{ image_meta.altext or image_meta.alt or '' }}"
         decoding="async" fetchpriority="high">
  </figure>

  <div class="kh-photo__caption kh-content">
    <p class="kh-breadcrumb" data-pagefind-ignore><a href="/photos/">← Photographs</a></p>
    <h1 class="kh-font-headline kh-text-heading--1">{{ title }}</h1>
    {#- Parents only, and linked when a topic page exists, matching
        digesting.njk. Without this a topic page would list the photograph
        while the photograph never linked back. -#}
    <p class="kh-meta" data-pagefind-ignore>
      <time datetime="{{ date }}">{{ date | dateDisplay }}</time>
      {%- if photo_meta and photo_meta.place %} &middot; {{ photo_meta.place }}{% endif %}
      {%- if topics %} &middot; Filed in:
        {%- for parent in topics | topicParents %}
        {%- set topicSlug = collections.topics | topicPageSlug(parent) %}
        {% if topicSlug %}<a href="/topics/{{ topicSlug }}/">{{ parent }}</a>{% else %}{{ parent }}{% endif %}{{ "," if not loop.last }}
        {%- endfor %}
      {%- endif %}
    </p>
    {% if image_meta and image_meta.text %}
    <p class="kh-photo__text">{{ image_meta.text | safe }}</p>
    {% endif %}
    {{ content | safe }}
    {#- Apparatus, not content: the credit and the exposure line would otherwise
        be indexed as body text and surface as search excerpts. -#}
    <p class="kh-meta kh-photo__tech" data-pagefind-ignore>
      {%- if image_meta and image_meta.credit %}{{ image_meta.credit | safe }}{% endif %}
      {%- if photo_meta and photo_meta.camera %} {{ photo_meta.camera | safe }}{% endif %}
      {%- if photo_meta and photo_meta.taken %} &middot; {{ photo_meta.taken }}{% endif %}
    </p>
    <p><a href="/photos/">More photographs</a></p>
    {%- if comment != false %}
    {% include "partials/feedback.njk" %}
    {%- endif %}
  </div>
</article>

{#- The same closing block as every other entry: byline, related entries and
    the sequence rail, so a photograph reached from a link is not a dead end. -#}
{% include "partials/entry-foot.njk" %}
```

- [ ] **Step 3: Keep the footer byline condition in step**

`footer.njk` decides whether to print the short bio blurb by listing the layouts that already print a full byline. Its own comment instructs you to keep that list in step with the layouts including `partials/author-note.njk`. `photo.njk` includes `entry-foot.njk`, which includes `author-note.njk`, so without this change a photo entry would print the byline twice.

In `src/site/_includes/footer.njk`, change line 24 from:

```njk
  {%- set hasByline = layout in ["layouts/post.njk", "layouts/digesting.njk"] and page.url != "/privacy/" -%}
```

to:

```njk
  {%- set hasByline = layout in ["layouts/post.njk", "layouts/digesting.njk", "layouts/photo.njk"] and page.url != "/privacy/" -%}
```

- [ ] **Step 4: Build and verify the page exists**

```bash
yarn sass && yarn eleventy
ls build/posts/20260812-bundeskunsthalle-roof-eclipse-evening/index.html
```

Expected: the file exists and the build reports no errors.

- [ ] **Step 5: Assert the page renders the photograph and its apparatus**

```bash
grep -c "bundeskunsthalle-roof-eclipse-evening.jpg" build/posts/20260812-bundeskunsthalle-roof-eclipse-evening/index.html
grep -o "Lichttürme" build/posts/20260812-bundeskunsthalle-roof-eclipse-evening/index.html
grep -o "iPhone 13 mini" build/posts/20260812-bundeskunsthalle-roof-eclipse-evening/index.html
grep -o "Own work." build/posts/20260812-bundeskunsthalle-roof-eclipse-evening/index.html
```

Expected: the image count is at least 1, and each of the other three greps prints its match. If the image count is 0, the frontmatter path is wrong: check it reads `/blog/...` and not `/images/blog/...`.

- [ ] **Step 6: Assert the byline is not doubled**

```bash
grep -c "kh-footer__bio" build/posts/20260812-bundeskunsthalle-roof-eclipse-evening/index.html
```

Expected: `0`. A `1` means Step 3 did not take effect.

- [ ] **Step 7: Commit**

```bash
git add src/site/_includes/layouts/photo.njk \
        src/site/posts/20260812-bundeskunsthalle-roof-eclipse-evening.njk \
        src/site/_includes/footer.njk
git commit -m "feature: add photo layout and first photo entry"
```

---

### Task 3: Collections wiring

**Files:**
- Modify: `config/eleventy/collections.js`

**Interfaces:**
- Consumes: the `tags: photos` value set on the entry in Task 2.
- Produces: `collections.photos` (array, newest first, drafts excluded) and `collections.feedEntries` (posts plus photos, newest first, drafts excluded). Task 4 consumes `collections.photos`; Task 5 consumes `collections.feedEntries`.

- [ ] **Step 1: Add the `photos` collection**

In `config/eleventy/collections.js`, after the `blogPosts` registration, add:

```js
  // Photographs are a fourth kind of entry. They live in src/site/posts/ like
  // digesting notes and are distinguished only by tag and layout, so the
  // permalink, the pulse strip and the sequence rail all work unchanged.
  config.addCollection('photos', (collectionApi) => {
    try {
      return published(collectionApi.getAll())
        .filter((item) => getTagArray(item).includes('photos'))
        .sort((a, b) => b.date - a.date);
    } catch (e) {
      return [];
    }
  });
```

- [ ] **Step 2: Add the merged feed collection**

Immediately after the block from Step 1, add:

```js
  // The feed used to iterate `collections.posts`, Eleventy's own tag
  // collection, which is why digesting notes have never been in it. Photographs
  // are meant to go out to subscribers but are not blog posts, so the feed now
  // reads from an explicit merged collection instead of from a raw tag. If you
  // later want digests in the feed, this is the one place to add them.
  config.addCollection('feedEntries', (collectionApi) => {
    try {
      return published(collectionApi.getAll())
        .filter((item) => {
          const tags = getTagArray(item);
          return tags.includes('posts') || tags.includes('photos');
        })
        .sort((a, b) => b.date - a.date);
    } catch (e) {
      return [];
    }
  });
```

- [ ] **Step 3: Add photos to the combined register**

In the same file, in the `allContent` collection, change:

```js
          return tags.includes('posts') || tags.includes('digesting');
```

to:

```js
          return tags.includes('posts') || tags.includes('digesting') || tags.includes('photos');
```

Note there are two occurrences of this exact line in the file, one in `topics` and one in `allContent`. Both need the change; Step 4 covers the other.

- [ ] **Step 4: Add photos to the topic index**

In the `topics` collection, apply the identical change to its filter line, so a photograph can be filed under a subject and counts toward a topic earning a page:

```js
          return tags.includes('posts') || tags.includes('digesting') || tags.includes('photos');
```

- [ ] **Step 5: Build and assert the collections populate**

```bash
yarn sass && yarn eleventy
grep -c "20260812-bundeskunsthalle-roof-eclipse-evening" build/all/index.html
```

Expected: at least `1`. The entry now appears in the combined register at `/all/`. A `0` means the tag filter is not matching; check the entry's frontmatter says `tags: photos` and not `tags: photo`.

- [ ] **Step 6: Assert drafts are still excluded**

Temporarily set `kens_status: draft` in the photo entry, rebuild, and confirm it drops out:

```bash
sed -i '' 's/^kens_status: published$/kens_status: draft/' src/site/posts/20260812-bundeskunsthalle-roof-eclipse-evening.njk
yarn eleventy
grep -c "20260812-bundeskunsthalle-roof-eclipse-evening" build/all/index.html
```

Expected: `0`. Then restore it:

```bash
sed -i '' 's/^kens_status: draft$/kens_status: published/' src/site/posts/20260812-bundeskunsthalle-roof-eclipse-evening.njk
yarn eleventy
grep -c "20260812-bundeskunsthalle-roof-eclipse-evening" build/all/index.html
```

Expected: back to at least `1`.

- [ ] **Step 7: Commit**

```bash
git add config/eleventy/collections.js
git commit -m "feature: add photos and feedEntries collections"
```

---

### Task 4: The /photos/ grid and its styles

**Files:**
- Create: `src/site/photos/index.njk`
- Create: `src/components/vf-componenet-rollup/_kh-photos.scss`
- Modify: `src/components/vf-componenet-rollup/index.scss:1-10` (the `@use` block) and the `body:has(#kh-css-toggle:checked)` mixin includes

**Interfaces:**
- Consumes: `collections.photos` from Task 3; `photo_meta.place` from Task 2.
- Produces: the page `/photos/`, and the CSS classes `kh-photo-grid`, `kh-photo-grid__cell`, `kh-photo-grid__img`, `kh-photo-grid__meta`, plus the entry-page classes `kh-photo`, `kh-photo__figure`, `kh-photo__img`, `kh-photo__caption`, `kh-photo__text`, `kh-photo__tech` used by Task 2's layout.

- [ ] **Step 1: Write the listing page**

Create `src/site/photos/index.njk`, mirroring `src/site/digesting/index.njk`:

```njk
---
title: Photographs
teaser: "Occasional frames, mostly of buildings and the people standing near them."
date: 2026-08-12 12:00:00
layout: layouts/base.njk
---
<div class="kh-grid-stylized">
  <div>
  </div>
  <section>
    <h1 class="kh-font-headline kh-font-headline--display kh-text-heading--1">{{ title }}</h1>
    <p class="kh-text-body--3">Occasional frames, mostly of buildings and the
    people standing near them. Newest first.</p>

    {#- The grid prints other entries' titles and places, which makes it chrome
        under the CLAUDE.md rule, the same marker /all/ and the topic pages
        carry. Without it a search for "Bonn" returns this index competing with
        the photograph itself. The intro above stays indexed, so /photos/ is
        still findable as a page. -#}
    <ul class="kh-photo-grid" data-pagefind-ignore>
    {%- for photo in collections.photos %}
      <li class="kh-photo-grid__cell">
        <a href="{{ photo.url | url }}">
          {#- Guarded rather than `photo.data.image_meta.altext or ''`: Nunjucks
              throws on an attribute lookup through an undefined object, so an
              entry without image_meta would break the whole grid. -#}
          {%- set gridAlt = photo.data.image_meta.altext if photo.data.image_meta else '' %}
          <img class="kh-photo-grid__img" src="/images{{ photo.data.image | url }}"
               alt="{{ gridAlt }}" loading="lazy" decoding="async">
          <span class="kh-photo-grid__meta">
            <span class="kh-photo-grid__date">{{ photo.date | dateDisplay }}</span>
            {%- if photo.data.photo_meta and photo.data.photo_meta.place %}
            <span class="kh-photo-grid__place">{{ photo.data.photo_meta.place }}</span>
            {%- endif %}
          </span>
        </a>
      </li>
    {%- endfor %}
    </ul>
  </section>
</div>
```

- [ ] **Step 2: Write the stylesheet partial**

Create `src/components/vf-componenet-rollup/_kh-photos.scss`, following the mixin-per-partial shape of `_kh-datasheet.scss`:

```scss
@use './settings' as *;

// Photographs
// -----------
// Two surfaces: the thumbnail grid at /photos/, and the single-photo entry
// page. On the entry page the image is the content rather than an illustration
// of it, so it spans the full grid instead of sitting in the reading column
// the way post.njk's hero does.
@mixin kh-photos() {
  .kh-photo-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0;
    margin: 2rem 0 0;
    list-style: none;

    @media (min-width: $kh-breakpoint--sm) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: $kh-breakpoint--lg) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .kh-photo-grid__cell a {
    display: block;
    text-decoration: none;
  }

  // The image transform rewrites a processed <img> into
  // <picture><source><img></picture>, so the direct child of the link may be
  // either. Both are targeted, or the layout depends on whether the transform
  // ran that build.
  .kh-photo-grid__cell picture,
  .kh-photo-grid__img {
    display: block;
    width: 100%;
    height: auto;
  }

  .kh-photo-grid__meta {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }

  .kh-photo-grid__date,
  .kh-photo-grid__place {
    display: block;
  }

  .kh-photo-grid__place {
    color: var(--kh-color--grey--darkest);
  }

  // Entry page. Capped at intrinsic width so a 2000px source is never upscaled
  // on a wide display.
  .kh-photo__figure {
    margin: 0 0 1.5rem;
  }

  .kh-photo__figure picture,
  .kh-photo__img {
    display: block;
    width: 100%;
    max-width: 2000px;
    height: auto;
    margin: 0 auto;
  }

  .kh-photo__caption {
    max-width: 42rem;
  }

  .kh-photo__tech {
    margin-top: 1.5rem;
  }
}
```

- [ ] **Step 3: Register the partial in the rollup**

In `src/components/vf-componenet-rollup/index.scss`, add to the `@use` block at the top, after the `kh-story-lab` line:

```scss
@use './kh-photos' as kh-photos;
```

Then inside the `body:has(#kh-css-toggle:checked)` block, after the `kh-story-lab` include:

```scss
  @include kh-photos.kh-photos();
```

Both edits are required. A partial that is `@use`d but never included compiles to nothing, which presents as a valid rule the browser simply ignores.

- [ ] **Step 4: Build and assert the page and the CSS exist**

```bash
yarn sass && yarn eleventy
ls build/photos/index.html
grep -c "kh-photo-grid" build/css/styles.css
grep -c "bundeskunsthalle-roof-eclipse-evening" build/photos/index.html
```

Expected: the file exists, the CSS grep is at least `1`, and the photo grep is at least `1`. A CSS count of `0` means Step 3's include is missing.

- [ ] **Step 5: Assert the grid is marked as chrome**

```bash
grep -c "data-pagefind-ignore" build/photos/index.html
```

Expected: at least `1`.

- [ ] **Step 6: Look at the page**

Run `yarn dev` and open `http://localhost:8080/photos/` and the entry page. Check three things: the grid is a single column on a narrow window and three across on a wide one; the photograph on the entry page is wider than the caption text below it; and toggling the CSS checkbox in the footer off leaves a readable, unstyled page.

- [ ] **Step 7: Lint the stylesheet**

```bash
yarn lint:css
```

Expected: passes. Fix anything it reports before committing.

- [ ] **Step 8: Commit**

```bash
git add src/site/photos/index.njk \
        src/components/vf-componenet-rollup/_kh-photos.scss \
        src/components/vf-componenet-rollup/index.scss
git commit -m "feature: add photos grid at /photos/"
```

---

### Task 5: Photographs in the RSS feed

**Files:**
- Modify: `src/site/feed.njk:16` and `:26`

**Interfaces:**
- Consumes: `collections.feedEntries` from Task 3.
- Produces: `build/rss.xml` containing photo entries interleaved with blog posts by date.

- [ ] **Step 1: Point the feed's updated timestamp at the merged collection**

In `src/site/feed.njk`, change:

```njk
  <updated>{{ collections.posts | published | rssLastUpdatedDate }}</updated>
```

to:

```njk
  <updated>{{ collections.feedEntries | rssLastUpdatedDate }}</updated>
```

`feedEntries` already excludes drafts and is already sorted newest first, so the `published` filter is not repeated.

- [ ] **Step 2: Point the entry loop at the merged collection**

`collections.posts` is Eleventy's own tag collection and arrives oldest-first, which is why the existing template reverses it. `feedEntries` is already newest-first, so the `reverse` must go or the feed will emit the ten oldest entries.

Change:

```njk
  {%- for post in collections.posts | published | reverse | limitItems(10) %}
```

to:

```njk
  {#- A merged collection of blog posts and photographs, sorted newest first in
      collections.js, rather than the raw `posts` tag. Digesting notes stay out.
      No `reverse` here: unlike Eleventy's tag collections, feedEntries is
      already newest-first. Drafts are filtered in the collection, before this
      slice rather than after, so an unfinished entry cannot push a published
      one out of the ten. -#}
  {%- for post in collections.feedEntries | limitItems(10) %}
```

- [ ] **Step 2b: Put the photograph itself into the feed entry**

Without this, a photo entry reaches subscribers as a title and two sentences about a picture they cannot see, which defeats the reason for putting photographs in the feed at all.

The cause: `<content>` is built from `post.templateContent`, which is the entry's own body *before* the layout wraps it. A photograph's image lives in frontmatter and is rendered by `photo.njk`, so it is never part of `templateContent`. Blog posts do not hit this, because the images in their feed entries are inline in the markdown body.

Immediately before the `<content type="html">` line, add:

```njk
  {#- A photograph's image is frontmatter rendered by the layout, so it is
      absent from `templateContent`. Without this block the feed carries an
      entry about a picture with no picture in it. Scoped to photo entries so
      that what existing subscribers receive for a blog post is unchanged --
      widening it to every entry's hero image is a separate decision about
      other people's inboxes, not a detail of this change. -#}
  {%- set photoBody %}
    {%- if post.data.image and 'photos' in post.data.tags %}
    {%- set photoAlt = post.data.image_meta.altext if post.data.image_meta else '' %}
    <p><img src="/images{{ post.data.image }}" alt="{{ photoAlt }}" /></p>
    {%- if post.data.image_meta and post.data.image_meta.text %}
    <p>{{ post.data.image_meta.text | safe }}</p>
    {%- endif %}
    {%- endif %}
  {%- endset %}
```

Then change the content line from:

```njk
    <content type="html">{{ post.templateContent | sanitizeFeedHtml | htmlToAbsoluteUrls(metadata.id) }}</content>
```

to:

```njk
    <content type="html">{{ (photoBody + post.templateContent) | sanitizeFeedHtml | htmlToAbsoluteUrls(metadata.id) }}</content>
```

Two things make this safe. `sanitizeFeedHtml` strips scripts, styles and inline handlers but preserves `<img>`, so the tag survives. And `htmlToAbsoluteUrls` rewrites the `/images/...` path to a full URL, which a feed reader needs; do not hand-write the domain.

- [ ] **Step 2c: Assert the photograph reaches the feed entry**

```bash
yarn sass && yarn eleventy
python3 - <<'PY'
import re
x = open('build/rss.xml', encoding='utf-8').read()
e = re.search(r'<entry>(?:(?!</entry>).)*?Bundeskunsthalle.*?</entry>', x, re.S)
assert e, 'photo entry not found in feed'
body = e.group(0)
print('has img:', 'img src=' in body or '&lt;img' in body)
print('absolute url:', 'https://www.allaboutken.com/images/' in body)
PY
```

Expected: both `True`. `has img: False` means Step 2b's block did not run; check the `'photos' in post.data.tags` condition against the entry's actual frontmatter, which sets `tags` as a scalar string rather than a list.

Also confirm a blog post's feed entry is unchanged by this: pick any recent post entry in `build/rss.xml` and check it did not gain an image it did not have before.

- [ ] **Step 3: Build and assert the photograph is in the feed**

```bash
yarn sass && yarn eleventy
grep -c "20260812-bundeskunsthalle-roof-eclipse-evening" build/rss.xml
```

Expected: at least `1`.

- [ ] **Step 4: Assert blog posts are still in the feed, newest first**

```bash
grep -o "<title>[^<]*</title>" build/rss.xml | head -5
```

Expected: five recent entries, with the photograph and recent blog posts among them; the NewSheep and startup-culture posts from August 2026 should appear. If you see posts from 2013, Step 2's `reverse` removal did not happen.

- [ ] **Step 5: Assert the feed is still valid XML**

```bash
python3 -c "import xml.dom.minidom,sys; xml.dom.minidom.parse('build/rss.xml'); print('valid')"
```

Expected: `valid`.

- [ ] **Step 6: Commit**

```bash
git add src/site/feed.njk
git commit -m "feature: include photographs in the RSS feed"
```

---

### Task 6: Register surfaces

**Files:**
- Modify: `src/site/all/index.njk` — frontmatter `teaser`, intro paragraph, Sections panel
- Modify: `src/site/_includes/footer.njk:56-62`
- Modify: `src/site/directory.njk` — the "Writing" panel's first row
- Modify: `src/site/stats.njk` — the Method list

**Interfaces:**
- Consumes: `collections.photos` from Task 3; the `/photos/` page from Task 4.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Update the /all/ intro to name four kinds of thing**

In `src/site/all/index.njk`, replace the first intro paragraph:

```njk
    <p>Every entry on the site in one register, newest first. Three kinds of
    thing sit here together: <strong>blog posts</strong>, which are written
    pieces; <strong>digesting</strong> entries, which are something I read
    plus what I took from it; and <strong>impact stories</strong>, which are
    write-ups of work I actually shipped. They are mixed here on purpose
    &mdash; if you would rather keep them apart, the three links below do
    that.</p>
```

with:

```njk
    <p>Every entry on the site in one register, newest first. Four kinds of
    thing sit here together: <strong>blog posts</strong>, which are written
    pieces; <strong>digesting</strong> entries, which are something I read
    plus what I took from it; <strong>impact stories</strong>, which are
    write-ups of work I actually shipped; and <strong>photographs</strong>.
    They are mixed here on purpose &mdash; if you would rather keep them
    apart, the links below do that.</p>
```

Note "the three links below" becomes "the links below", because there are now four.

- [ ] **Step 2: Add a fourth cell to the Sections panel**

In the same file, the panel's first row declares three columns. Change:

```njk
    <div class="kh-panel__row" style="--kh-panel-columns: 1fr 1fr 1fr">
```

to:

```njk
    <div class="kh-panel__row" style="--kh-panel-columns: 1fr 1fr 1fr 1fr">
```

Then, after the Work cell and before the closing `</div>` of that row, add:

```njk
      <div class="kh-panel__cell">
        <span class="kh-panel__label">Photos</span>
        <a href="/photos/">Photographs</a>
        <span class="kh-meta kh-u-margin__top--200">{{ collections.photos | length }} entries</span>
      </div>
```

`collections.photos` already excludes drafts, so no `published` filter is needed here, unlike the Digesting cell above it which reads a raw tag collection.

- [ ] **Step 3: Add the footer link**

In `src/site/_includes/footer.njk`, in the "Writing & making" list, add a Photos entry after Digesting:

```njk
        <li><a href="/digesting">Digesting</a></li>
        <li><a href="/photos/">Photographs</a></li>
```

- [ ] **Step 3b: The same panel on `/directory/`**

`src/site/directory.njk` carries a second hand-built copy of the same three-column panel, on the page that presents itself as the site's map of everything. Leaving it stale is worse than an omission: the section heading above it reads `{{ collections.allContent | length }} entries in total`, and `allContent` now includes photographs, so the page would count photographs in its total while no cell accounts for them.

In its "Writing" panel, change the first row's track count from:

```njk
    <div class="kh-panel__row" style="--kh-panel-columns: 1fr 1fr 1fr">
```

to:

```njk
    <div class="kh-panel__row" style="--kh-panel-columns: 1fr 1fr 1fr 1fr">
```

Change ONLY the first row, the one containing the Blog, Digesting and Work cells. The second row in that same panel also declares three tracks and is a different set of cells; leave it alone.

Then add a fourth cell after the Work cell in that first row:

```njk
      <div class="kh-panel__cell">
        <span class="kh-panel__label">Photos</span>
        <a href="/photos/">Photographs</a>
        <span class="kh-meta kh-u-margin__top--200">{{ collections.photos | length }} entries</span>
      </div>
```

- [ ] **Step 3c: The stale enumerations in prose**

Two sentences elsewhere still name three kinds of thing.

First, the `teaser` in the frontmatter of `src/site/all/index.njk`, which is this page's meta description and its social-card description. Change:

```yaml
teaser: "Everything in one place — blog posts, digesting bookmarks, and impact stories."
```

to:

```yaml
teaser: "Everything in one place: blog posts, digesting bookmarks, impact stories, and photographs."
```

The em dash becomes a colon, per the site's preference for `;` `:` `,` `.` over em dashes.

Second, `src/site/stats.njk`, in the Method list. Change:

```njk
      <li>Entries are everything in the writing register: blog posts, digesting notes and project notes. Pages like this one are not counted.</li>
```

to:

```njk
      <li>Entries are everything in the writing register: blog posts, digesting notes, impact stories and photographs. Pages like this one are not counted.</li>
```

Note this sentence was already inaccurate before photographs existed: it said "project notes", which is not one of this site's content types. Photographs now enter `allContent` and are therefore counted by every figure on that page, so the sentence has to name them.

- [ ] **Step 3d: Assert the two panels agree**

```bash
yarn sass && yarn eleventy
grep -c "/photos/" build/directory/index.html
python3 - <<'PY'
import re
for page in ('all', 'directory'):
    h = open(f'build/{page}/index.html', encoding='utf-8').read()
    rows = re.findall(r'--kh-panel-columns:\s*([^"]+)"', h)
    print(page, 'panel track declarations:', rows)
PY
```

Expected: the `/photos/` count on `/directory/` is at least 2, the panel cell plus the footer link. And the first panel row on each page declares four tracks. A row still declaring three tracks while carrying four cells is the silent misalignment this step exists to catch.

- [ ] **Step 4: Build and assert both surfaces**

```bash
yarn sass && yarn eleventy
grep -c "Four kinds of" build/all/index.html
grep -c "/photos/" build/all/index.html
grep -c "/photos/" build/blog/index.html
```

Expected: the first is `1`; the second is at least `2`, the panel cell plus the footer link; the third is at least `1`, the footer link on a page that has no panel.

- [ ] **Step 5: Check the four-column panel at narrow widths**

Run `yarn dev`, open `/all/`, and narrow the window. The panel was built for three columns; confirm the fourth does not force a horizontal scrollbar. If it does, the row is the only thing to change and a `1fr 1fr` two-by-two at narrow widths is the fix.

- [ ] **Step 6: Commit**

```bash
git add src/site/all/index.njk src/site/_includes/footer.njk \
        src/site/directory.njk src/site/stats.njk
git commit -m "feature: add photographs to the register and footer"
```

---

### Task 7: Documentation

**Files:**
- Modify: `docs/FRONTMATTER.md`
- Modify: `docs/TEMPLATES.md`
- Modify: `docs/TOPIC_TAXONOMY.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: the frontmatter contract from Task 2, the collections from Task 3, the feed change from Task 5.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add `photo_meta` to the frontmatter quick-lookup table**

In `docs/FRONTMATTER.md`, add a row to the table, after the `image_meta` row:

```markdown
| [`photo_meta`](#photo_meta) | Optional | photo | Place, capture time, and camera details for a photograph |
```

- [ ] **Step 2: Add the `photo_meta` field detail section**

In the "Field details" part of the same file, after the `image_meta` section, add:

```markdown
### `photo_meta`

```yaml
photo_meta:
  place: "Bundeskunsthalle, Bonn"
  taken: "12 August 2026, 19:03"
  camera: "iPhone 13 mini &middot; &fnof;/1.6 &middot; 1/5556 &middot; 5.1 mm &middot; ISO 50"
```

- Only read by `layouts/photo.njk` and the `/photos/` grid.
- `place` is the only field used outside the entry page: the grid prints it under each thumbnail.
- `taken` carries the precise time, which `date` does not. Sorting and every collection use `date`, so the two never compete.
- `camera` is display-only. Use HTML entities rather than literal glyphs so the ƒ-stop renders reliably.
```

- [ ] **Step 3: Document the `photos` tag**

In the `tags` section's table of tag values, add a row:

```markdown
| `photos` | `photos`, `allContent`, `feedEntries` | A photograph; uses `layouts/photo.njk`, listed at `/photos/`, excluded from the blog listing |
```

- [ ] **Step 4: Document the layout**

In `docs/TEMPLATES.md`, add a row to the layout-hierarchy table under `## Layout hierarchy`, after the Digesting row on line 13:

```markdown
| Photo | `src/site/_includes/layouts/photo.njk` | Single-photograph entries | Image at full grid width, caption, place and camera details below; listed at `/photos/` |
```

Then update the sentence on line 16 from:

```markdown
`post.njk` and `digesting.njk` both use `layout: layouts/base.njk`, so `base.njk` is the shared foundation.
```

to:

```markdown
`post.njk`, `digesting.njk` and `photo.njk` all use `layout: layouts/base.njk`, so `base.njk` is the shared foundation.
```

- [ ] **Step 5: Record the new topic in the taxonomy**

`docs/TOPIC_TAXONOMY.md` instructs that a new parent topic must be recorded there with a definition. The photo entry introduces `photography`, which is a new parent, so without this the taxonomy doc drifts out of sync the moment this branch merges.

Its controlled-vocabulary table is sorted by post count, descending, so a one-entry topic goes at the bottom of the table. Add:

```markdown
| photography | Photographs published as entries in their own right, rather than illustrations for a written piece. | 1 |
```

Then update the heading, which carries a hard-coded count. Change:

```markdown
## The controlled vocabulary (31 topics)
```

to:

```markdown
## The controlled vocabulary (32 topics)
```

Note the count in that heading is maintained by hand and the post counts in the table are a snapshot, not generated. You are adding one row and bumping one number; do not attempt to recompute the other counts.

- [ ] **Step 6: Record the feed change in CLAUDE.md**

Add a new section to `CLAUDE.md`, in the Gotchas run, after the `kens_status` section:

```markdown
### The feed reads a merged collection, not the `posts` tag

`feed.njk` used to iterate `collections.posts`, Eleventy's own tag collection.
That is why digesting notes have never appeared in RSS: nobody decided it, the
tag decided it. Photographs were meant to go out to subscribers and are not
blog posts, so the feed now reads `collections.feedEntries`, an explicit merged
collection of `posts` plus `photos` registered in `config/eleventy/collections.js`.

Two consequences. Adding a content type to the feed is now a one-line change in
one place, which is the point. And `feedEntries` is sorted newest-first at
registration, unlike a tag collection, so the `reverse` filter that used to sit
in the template must not come back -- with it, the feed emits the ten oldest
entries on the site.
```

- [ ] **Step 7: Commit**

```bash
git add docs/FRONTMATTER.md docs/TEMPLATES.md docs/TOPIC_TAXONOMY.md CLAUDE.md
git commit -m "feature: document the photo content type"
```

---

### Task 8: Full-build verification

**Files:**
- No source changes expected. This task is a gate.

**Interfaces:**
- Consumes: everything above.
- Produces: a verified build.

- [ ] **Step 1: Run the full build**

```bash
yarn build
```

Expected: completes with `🏋 Build completed`. This runs embeddings and takes minutes. Watch for an unmatched-anchor warning from `compute-story-lab.mjs`; there should be none, since no story-lab anchor was touched.

- [ ] **Step 2: Run the link check**

```bash
yarn lint:links
```

Expected: passes. This is a hard gate in CI. If it reports broken links pointing at `/.11ty/image/`, that is the broken-image class of bug, not a link problem; go to Step 3.

- [ ] **Step 3: Check for dev-server image URLs**

```bash
grep -rl "\.11ty/image" build --include="*.html"
```

Expected: no output. Per CLAUDE.md this failure is intermittent and one clean build is not proof. If it does report files, rebuild and check again rather than chasing a cause.

- [ ] **Step 4: Rebuild and re-check, because one clean result is not proof**

```bash
yarn build && grep -rl "\.11ty/image" build --include="*.html" ; echo "exit: $?"
```

Expected: no file list. A newly added source image is in this change, which is the exact condition CLAUDE.md records as a near-miss hypothesis for this bug, so this second pass matters more than usual here.

- [ ] **Step 5: Confirm the photograph reached search and the embeddings**

```bash
grep -c "bundeskunsthalle" build/semantic-search/vectors.json
```

Expected: at least `1`. A `0` means the entry was excluded from the corpus; check it is not marked draft and its page carries no noindex tag.

- [ ] **Step 6: Confirm the grid did not reach the corpus as chrome**

`vectors.json` is `{model, dimension, version, chunks[]}` where each chunk is `{url, title, snippet, embedding}`. The requirement is that no chunk belonging to `/photos/` repeats the photo entry's own title; the page's own intro is meant to be indexed, so a plain grep for the intro text would fail on correct code.

```bash
python3 - <<'PY'
import json
d = json.load(open('build/semantic-search/vectors.json'))
leaked = [c for c in d['chunks']
          if c['url'].startswith('/photos/')
          and 'eclipse evening' in c.get('snippet', '')]
print('leaked chunks:', len(leaked))
intro = [c for c in d['chunks'] if c['url'].startswith('/photos/')]
print('/photos/ chunks total:', len(intro))
PY
```

Expected: `leaked chunks: 0`, and `/photos/ chunks total:` at least 1. A leak greater than zero means the `data-pagefind-ignore` on the grid is missing or is being defeated. A total of 0 means the page is not indexed at all, which is a different bug: check it is not marked `noindex`.

- [ ] **Step 7: Final visual pass**

Run `yarn dev` and walk: `/photos/`, the entry page, `/all/`, `/blog/` (the photograph must *not* be there), `/rss.xml`, and the entry page with CSS toggled off.

- [ ] **Step 8: Commit any fixes and push**

```bash
git status
git push -u origin feature/photo-post-type
```

---

## Notes for the reviewer

Three things in this change are worth a second look:

1. **The feed now reaches subscribers with a new kind of content.** That is the intended change, but it is the only user-visible change to something people already subscribed to.
2. **`topics: photography`** is a new value outside the controlled vocabulary in `docs/TOPIC_TAXONOMY.md`. It will not earn a topic page until three entries carry it. If Ken would rather photographs stayed out of the subject taxonomy entirely, drop the `topics` block from the entry and revert Task 3 Step 4.
3. **The four-column Sections panel** was designed for three. Task 6 Step 5 checks it, but it is the most likely place for a small visual regression.
