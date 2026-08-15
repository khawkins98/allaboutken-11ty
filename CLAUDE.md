# CLAUDE.md

Exceptions and gotchas that aren't obvious from reading the code or existing docs. For the full picture, read the source files directly -- `eleventy.js`, its `config/eleventy/` registration modules, `package.json`, the templates, and the `docs/` directory.

## Quick reference

```bash
yarn dev          # Development server (Sass watch + Eleventy --serve)
yarn build        # Full build (bootstrap HTML → semantic data → final Eleventy)
yarn lint:css     # Lint SCSS files
yarn lint:links   # Validate internal links/anchors in build/ (run after a build)
```

## Gotchas

### Image paths are rewritten at build time
Place images in `src/site/images/blog/`. Reference them in frontmatter as `/blog/filename.jpg` -- **not** `/images/blog/`. The build process adds the `/images/` prefix automatically. Getting this wrong produces broken images that only show up in production.

### `/.11ty/image/?src=` in built HTML means broken images in production
That is the dev-server endpoint. It does not exist in `build/`, so every such
URL is a 404 on the live site. `failOnError: false` on the image plugin is what
converts a transform failure into one of these instead of a failed build.

It happens to **local** images too, not just the remote case below, and it is
**intermittent**: one build emitted 48 pages where every listing thumbnail was
one of these, and five subsequent builds (cold cache, warm cache, single-pass,
two-pass, full `yarn build`) all came out clean. Do not assume a passing build
means the class of bug is gone.

A near-miss hypothesis, recorded so nobody spends the afternoon re-deriving
it: the first build after adding a brand-new source image to
`src/site/images/blog/` once emitted them across 49 pages, and an immediately
repeated, otherwise identical build was clean. "Cold cache entry for a newly
added file" fits the blast radius, since one failed transform poisons every
listing thumbnail in that build rather than just the new image. **It did not
hold.** Adding another image the same afternoon produced a clean first build.
So this is one more data point in the intermittency, not a trigger.

The practical rule is unchanged and does not depend on knowing the cause:
build, check, and do not trust a single clean result.

`yarn lint:links` detects them — the query string is stripped, so the target
resolves to a `build/.11ty/` directory that is not there. That check is now a
hard gate in CI for exactly this reason; it previously ran with
`continue-on-error: true` and went green while the images were broken.

If you see it: rebuild, then check `grep -rl "\.11ty/image" build --include="*.html"`.

### Live remote images must carry `eleventy:ignore`
The image transform treats *any* `<img src>` as a source image, including
remote URLs. For a live endpoint -- the feedback counter SVG at
`feedback.allaboutken.com/count/...` -- that is wrong three times over: the
image is fetched and rasterised at build time so the value freezes, the
emitted `/.11ty/image/?src=...` URL 404s in production because
`failOnError: false` lets a failed remote fetch through silently, and the
`width`/`height` attributes the plugin stamps on the tag combine with any CSS
`height` to specify both axes, so the badge lays out at its full intrinsic
width (1280px) instead of scaling.

Add `eleventy:ignore` to the tag. This is not an optimisation opt-out; without
it the feature does not work. The symptom is easy to misread: it surfaced as
381 "broken internal links" in `yarn lint:links`, all pointing at
`/.11ty/image/`, which looks like a link problem and is not.

### `.kh-cluster` is now plain flex; it used to fight you
It is `display: flex; flex-wrap: wrap; gap`, plus `> * { margin: 0 }` so an
item's own outer margin (`.kh-button` has one) does not add to the gap. Nothing
else. Keep it that way.

It previously also carried the pre-`gap` negative-margin gutter on
`.kh-cluster > *` and `.kh-cluster > * > *`, both `!important`, plus
`display: flex` on every child. Those had been broken for a long time: they
depended on `--kh-cluster-margin`, which is defined only on `.kh-badges` — not
a cluster — so the `calc()` was invalid at computed-value time and both rules
resolved to `margin: 0 !important` on every child *and grandchild*.

Worth knowing because of how it presented: a perfectly valid rule of your own,
present in the compiled CSS at brace depth zero with no competing selector,
that the browser simply ignored. Raising the value changed nothing — that is
the tell for an `!important` you have not found yet. Removing the rules changed
exactly one pixel on the site, and it was a bug fix: `display: flex` on an
`<a>` had been swallowing the leading space in a nested `<span>`, rendering
"Mastodon@khawkins98@toot.io" on the homepage.

### Laying out an `<img>` means laying out a `<picture>`
The image transform rewrites every processed `<img src>` into
`<picture><source…><img></picture>`. So in any flex or grid container the
*direct child is the `<picture>`*, and a class on the `<img>` is a level too
deep to position. `.kh-compare` hit exactly this: `grid-area` on the image
class did nothing, the pictures flowed into their own rows, and the overlay
elements stacked above the images instead of on top of them.

Target both, so the layout survives whether or not the transform ran:

```scss
.thing > picture,
.thing > .thing__img { grid-area: 1 / 1; }
```

The symptom is a layout that looks like an extra empty row appeared, which
reads as a CSS bug rather than as markup you did not write.

### Fonts in `kh-font/` may be retained but unloaded
`Recursive.woff2` and its variable build are referenced by no `@font-face`
rule. They are kept on purpose as the archive of a typeface the site used to
run on, and `src/components/kh-font/README.md` says so. Do not remove them as
dead assets. `Datatype.woff2` is likewise unreferenced by the rollup but used
by a blog post.

### The `image` field is not used for social cards
`image` in frontmatter is for in-page hero images only. Social sharing images (`og:image`) are auto-generated screenshots. Override with `og_image` (full URL) in frontmatter if needed. This confuses people because every other blog engine uses `image` for both.

### Image attribution
For Ken's own photos: use `credit: "Own work."` (not "Photo by Ken Hawkins"). Include location context in the `text` caption, e.g.:
```yaml
text: "OneSiam Skywalk, Bangkok."
credit: "Own work."
```

### The CSS toggle
All custom styles are scoped under `body:has(#kh-css-toggle:checked)` (see `index.scss:12`). This is intentional -- it enables a CSS-free viewing mode. New styles must go inside this scope or they won't apply.

### The typo in `vf-componenet-rollup`
The directory `src/components/vf-componenet-rollup/` is a legacy name. The typo is intentional and kept for path stability. Don't rename it.

### Markdown `--` becomes em dashes
The markdown-it config converts `--` to `—` automatically. Write `--` in content, it renders as `—`.

### Embeddings don't run in dev
`yarn embeddings` is too slow for iterative development. Run `yarn build` once to generate `vectors.json`, then `yarn dev` as usual. The `@huggingface/transformers` devDependency is ~476 MB in node_modules (ONNX runtime ships native binaries for every platform). It's needed to run the model at build time -- there's no lighter alternative. At build time the model itself is cached under `.cache/transformers` (set via `env.cacheDir` in `generate-embeddings.mjs`); CI restores that directory so the model is not re-downloaded from HuggingFace every run.

### Semantic search model loading
The browser fetches the model directly from HuggingFace at query time. Transformers.js caches it using the Cache API (keyed by model ID, not URL), so the ~23 MB download only happens once per browser. Transformers.js and ONNX Runtime WASM load from jsDelivr.

### Updating the embedding model
Must change in **two places**: `MODEL_NAME` in `scripts/generate-embeddings.mjs` AND `MODEL_ID` in `src/site/semantic-search.js`. Both sides must use the same model. See the header comment in `generate-embeddings.mjs` for full instructions.

### Navigation chrome must never reach the embeddings
`scripts/generate-embeddings.mjs` strips every element carrying
`data-pagefind-ignore`, with its contents, before embedding. That attribute is
the site's single "this is chrome, not content" marker: Pagefind already
honours it for keyword search, and the embeddings honour it for the same
reason. Do not invent a second marker; put the attribute on any block that
prints other entries' titles or repeats identical text on every page.

This is not cosmetic. The "closest in meaning" list prints the titles of
related entries, so embedding it fed the feature's own output back into the
model and those entries drifted closer on every build: link count went 116 to
173 with no writing changed.

Stripping is done with a balanced-tag scan, not a regex, because these regions
nest and a lazy regex stops at the first closing tag of any depth.

**A lazy regex doing the same job used to run first, and it silently disabled
the scan.** `extractContent` pre-stripped with
`/<[^>]+data-pagefind-ignore[^>]*>[\s\S]*?<\/[^>]+>/gi`. On a nested region it
matched from the opening marked tag to the *first* closing tag of any depth, so
on `<aside data-pagefind-ignore><p>Written by</p><p>bio</p></aside>` it deleted
`<aside ...><p>Written by</p>` and left the bio behind **with the marker now
gone** -- so the balanced scan that ran next had nothing to find. Every marked
region with nested markup was leaking. Removing that one line cut the corpus
from 1,708 chunks to 1,068 (-37%) and thresholded links from 188 to 66. Do not
reintroduce a regex there.

The link counts in this file are therefore not comparable across that fix: the
116-to-173 figure above was measured while chrome was still leaking. Post-fix,
66 links at >= 0.6 and 71 of 100 entries with at least one neighbour is the
real baseline. Most of the old "similarity" was shared navigation, not shared
subject matter.

Residual: the derived data still moves by a few links per build even though the
stripped text is byte-identical across builds, verified by hash. That is
floating-point non-determinism in the ONNX runtime flipping pairs that sit
exactly on the threshold. It is jitter, not drift, and not worth chasing.

### `noindex` is the single "not a destination" marker
One frontmatter flag drives four exclusions, and they must stay together:
the `robots` meta tag, the Pagefind index (`base.njk` omits
`data-pagefind-body`), the semantic embeddings (`generate-embeddings.mjs`
already skips any page whose HTML carries a noindex robots tag), and the
sitemap.

The trap is that `noindex` alone *looks* sufficient. It is not: it keeps a page
out of Google while leaving it in the site's own search, which is the more
likely way a reader meets a scratch page. `/stats/story-lab/` and
`/stats/map-variants/` were both turning up in on-site search results.

Do not add a second list of paths to exclude. Set `noindex: true` and every
index honours it.

### `kens_status: draft` withholds the entry; it used to be decorative
`draft` and `final_draft` now gate publication. The page still renders at its
URL -- a draft you cannot open is a draft you cannot review, and suppressing
the permalink would also break links already shared -- but it is absent from
every collection, the sitemap, the feed, on-site search and the embeddings.
`ready_for_publication` and later publish normally, as does an absent field
(most older posts have none).

Two consequences that are easy to miss:

- Eleventy builds `collections.posts` itself from the `posts` tag, and an
  automatic tag collection cannot be filtered at registration. Templates
  consuming it pipe through the `published` filter instead. Same for
  `collections.all` in `sitemap.njk` and `ai.njk`.
- A draft is excluded from the embedding corpus, so it cannot serve as an
  editorial anchor in `scripts/compute-story-lab.mjs`. Naming one there trips
  the unmatched-anchor warning on every build. Add the anchor when the post
  publishes.

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

**Membership and images are two separate mechanisms, and only one of them is
the collection.** `<content>` is built from `post.templateContent`, which is an
entry's own body *before* its layout runs. A photograph's image is frontmatter
rendered by `photo.njk`, so it is not in `templateContent` at all: a photo entry
reached subscribers as a title and two sentences about a picture they could not
see. `feed.njk` therefore splices the image and caption in itself, in a
`photoBody` block gated on `'photos' in post.data.tags`, re-reading
`post.data.image` and `image_meta` by hand.

So `feedEntries` decides *whether* an entry is in the feed; that hardcoded tag
check decides whether its image is. Rename the `photos` tag, add a fifth content
type whose image lives in frontmatter, or refactor how membership is computed,
and the two drift apart. Nothing errors when they do -- the entry still ships,
just silently text-only. Blog posts do not hit this because the images in their
feed entries are inline in the markdown body, which *is* `templateContent`.

### Story-lab anchors match on the exact title string
`semanticTrailSpecs` in `scripts/compute-story-lab.mjs` finds its anchor
entries by exact title. Retitle a post and it drops out of its biography; the
lens just comes back smaller. The generator warns on any unmatched anchor --
that warning is the only thing standing between a typo and a silently degraded
view, so do not quiet it.

### Shortcodes that build SVG must escape everything they interpolate
`config/eleventy/escape.js` exists because a shortcode returns a finished
string that Eleventy inserts verbatim; the autoescaping that protects
`{{ title }}` in a template never sees it. A title as ordinary as "Q&A with the
type designer" emits an invalid entity, and one containing `<` truncates the
element. Neither throws, so the `try/catch` around each shortcode catches
nothing and the chart simply renders wrong. Escape titles, URLs and topic names
even when they "cannot" contain markup.

### Topics use `>` for hierarchy, never `:`
Post `topics:` entries may be hierarchical -- `AI > Claude Code`. The parent
must come from the controlled vocabulary in `docs/TOPIC_TAXONOMY.md` and is the
only part that groups or counts; the child is free-form detail.

The separator is a greater-than sign because YAML parses an unquoted `- a: b`
list item as an **object**, not a string, so a colon would silently produce a
mixed-type list. Quoting works but fails the day someone forgets.

Also: `tags:` decides collection membership (`posts`, `note`, `digesting`,
`impact-stories`); `topics:` is subject matter only. Editing `tags` restructures
the site.

### Series are frontmatter keys, not topics
Multi-part series use `series:` and `series_part:`, not a shared topic, because
a series is ordered and exclusive. Renders as "Part 2 of 4" with all parts
linked.

## Project structure (brief)

- `eleventy.js` and `config/eleventy/` -- Eleventy assembly and concern-specific registrations
- `src/components/vf-componenet-rollup/` -- Sass entry point and all CSS
- `src/site/` -- Templates, posts, data, includes
- `scripts/generate-embeddings.mjs` -- Build-time vector embeddings
- `docs/IMAGE_GENERATION.md` -- Image generation guide (setup, prompts, credits)
- `docs/` -- Publishing workflow, reviewer roles

## Editorial system

When working on blog posts or impact stories, read the docs:

- `src/site/style-guide/editorial.njk` -- Canonical style guide (voice, tone, structure, reasoning, formatting)
- `docs/PUBLISHING_WORKFLOW.md` -- End-to-end publishing workflow
- `docs/ROLE_*.md` -- Reviewer roles (technical, editorial, SEO)

## Deployment

Vercel serves the production site (`allaboutken.com`); the Vercel GitHub App auto-deploys on push to `main` and creates preview deployments for PRs. GitHub Actions (`.github/workflows/build-and-deploy.yml`) only runs a build check (lint + compile) — it no longer deploys. See `docs/DEPLOYMENT.md` for the full architecture.
