# Webmention plan for allaboutken.com

This file documents how to add Webmention support to this Eleventy v3 site and how we’ll display mentions on posts. It also keeps notes for a future blog post.

## Goals

- Receive Webmentions for `https://www.allaboutken.com/*` using Webmention.io
- Display mentions (replies, mentions, likes, reposts) under posts
- Optionally send Webmentions for outbound links on publish
- Support IndieLogin/IndieAuth basics (`rel="me"`) for future extensions
- Achieve the goal in a way compatible with the 11ty architecture

## References

- https://webmention.io/
- https://indielogin.com/setup
- https://github.com/khawkins98
- https://github.com/maxboeck/eleventy-webmentions?tab=readme-ov-file
- https://sia.codes/posts/webmentions-eleventy-in-depth/
- https://chisenires.design/blog/my-personal-website-should-have-support-for-webmentions-now/
- https://equk.co.uk/2023/07/18/adding-webmentions-in-eleventy/

## 1) Account and endpoints

- Create/login at Webmention.io for domain `allaboutken.com`.
- Add discovery links in the site head (`_includes/layouts/base.njk`):
  ```html
  <link rel="webmention" href="https://webmention.io/allaboutken.com/webmention" /> <link rel="pingback" href="https://webmention.io/allaboutken.com/xmlrpc" />
  ```
  Notes:
  - `webmention` is primary; `pingback` is legacy and harmless to include.
  - Keep absolute https URLs.
  - Also add a canonical link in `base.njk` so each page has a single, stable absolute URL used as the Webmention target:
    ```html
    <link rel="canonical" href="https://www.allaboutken.com{{ page.url | url }}" />
    ```

## 2) Author identity (IndieLogin prep)

Add `rel="me"` identity links (these help IndieLogin; harmless otherwise). In `base.njk` nav or footer, ensure links include rel:

```html
<a rel="me" href="https://toot.io/@khawkins98">Mastodon</a>
<a rel="me" href="https://www.linkedin.com/in/allaboutken">LinkedIn</a>
<a rel="me" href="mailto:khawkins98@gmail.com">Email</a>
<a rel="me" href="https://github.com/khawkins98">GitHub</a>
```

If desired, add profile links from those services back to `https://www.allaboutken.com/` (also as rel=me when possible) to complete verification loops.

## 3) Fetching and rendering mentions

We’ll use Webmention.io’s API and render at build-time with Eleventy:

- API: `https://webmention.io/api/mentions.jf2?target={ABSOLUTE_URL}`
- For a given page, the absolute URL is `siteConfig.siteInformation.url + page.url`

Implementation sketch:

- Create a data helper `src/site/_data/webmentions.js` that:
  - Computes each page’s absolute URL
  - Fetches mentions for that target (cache responses to a local JSON file during development/build to avoid API limits)
  - Normalizes entries by type (reply, mention, like, repost)
- Add a Nunjucks include, e.g. `_includes/webmentions.njk`, that groups and displays content:
  - Replies and mentions: show author name/avatar, content summary, published date
  - Likes/reposts: show avatars with counts
- In `layouts/post.njk`, render the include below the article (before “Read more”):
  ```njk
  {% include "webmentions.njk" %}
  ```

Pagination and caching details:

- Prefer incremental fetches to avoid full re-pulls. If supported, record and send `since_id` (last `wm-id`) to only fetch new items; otherwise, use `per-page`/`page` iteration.
- Cache structure suggestion:
  - `cache.meta.json` stores `lastFetchedAt` and `lastWmId`
  - `cache.data.json` stores a de-duped array of mentions keyed by `wm-id`
  - On build: fetch deltas, merge, de-dup, write cache, then filter by target URL for the current page
- Throttle requests in dev (e.g., skip network if cache age < 1 hour). In CI, allow fresh fetch.

Caching notes:

- Cache file path suggestion: `.cache/webmentions.json` (not committed) or `src/site/_data/_cache/`.
- In dev, skip fetch if cache age < 1 hour; in CI, allow fresh fetch.

## 4) Sorting and filtering best practices

- Only show verified mentions: confirm `source` HTML contains a link to our target
  - Webmention.io already verifies; still handle missing/invalid gracefully
- De-dup by `wm-id`
- Normalize entries by JF2 properties (`wm-property`):
  - `in-reply-to`, `mention-of`, `like-of`, `repost-of`, `rsvp`
  - Prefer `published` for time; fallback to `wm-received`
- Sort by `published` (fallback to `wm-received`)
- Sanitize content before render (strip scripts/iframes) — we already have a `sanitizeFeedHtml` filter we can reuse/adapt
- Defensive enrichment: avatar and author lookups should fail gracefully (timeouts/404s). Never block the build on enrichment.

## 5) Sending Webmentions (optional)

Options:

- Use `webmention.app` (CLI) or `webmention.io` send API after build to notify targets you linked to
- Or add a small Node script that:
  - Parses built HTML in `build/` for outbound links
  - For each unique target, discovers endpoint and POSTs `source`/`target`
  - Run post-build (e.g., Eleventy `eleventy.after` hook) behind an env flag

Minimal manual send example:

```bash
curl "https://webmention.io/yourdomain/webmention" \
  -d source="https://www.allaboutken.com/posts/…" \
  -d target="https://example.com/their-post"
```

## 6) Testing

- Use Webmention.rocks: `https://webmention.rocks/` to validate receiving
- Use their test cases for different content types and malformed inputs
- Confirm discovery: view-source on a post and ensure both `<link rel="webmention">` and canonical absolute URLs are correct

## 7) Anti-spam and moderation

- Start with trust-by-default; Webmention.io pre-verifies the link
- Add a simple moderation toggle pathway:
  - Keep a blocklist file for sources/domains
  - Filter out mentions matching blocklist before render
- Consider hiding likes/reposts below a threshold or behind a details/summary

## 8) Deployment checklist

- Add head links in `base.njk`
- Create data fetcher (`_data/webmentions.js`) with caching
- Create `_includes/webmentions.njk` partial
- Include partial in `layouts/post.njk`
- Verify absolute URL logic using `siteConfig.siteInformation.url`
- Test with Webmention.rocks
- Add optional sender script (behind env flag) and wire in CI if used

---

## 9) Utility: /webmentions listing

- Purpose: quick, human-readable list of all cached Webmentions for debugging/auditing.
- Implementation:
  - Async shortcode `webmentions_all` in `eleventy.js` aggregates entries from `.cache/webmentions-*.json` and renders a table.
  - Page at `src/site/webmentions.njk` with `permalink: /webmentions/` invokes `{% webmentions_all %}` to display the list.
- Notes:
  - The list shows entries only after at least one page has fetched mentions (cache populated).
  - Consider hiding or gating this route in production if desired.

## 10) Host migration handling (legacy subdomain)

- Historical host: `https://work.allaboutken.com/` → current: `https://www.allaboutken.com/`
- Paths are identical, so we fetch and merge Webmentions for both absolute targets.
- Implemented in code: the webmentions filter queries Webmention.io for both the current and legacy host and de-duplicates by `wm-id`.
  - Example merged targets:
    - `https://www.allaboutken.com/posts/.../`
    - `https://work.allaboutken.com/posts/.../`
- Recommended ops step: 301 redirect `work.allaboutken.com/*` → `www.allaboutken.com/*` to consolidate SEO and future mentions.
- Canonical already points to `www`, which helps unify targets going forward.

## 11) Local dev: hydrating the cache

- Purpose: prefill `.cache/` so `/webmentions/` has data locally without first visiting each post.
- Commands:
  - Hydrate for all built posts: `yarn wm:hydrate`
  - Hydrate for specific post URL(s): `yarn wm:hydrate:post https://www.allaboutken.com/posts/your-post/`
- How it works:
  - Script: `scripts/hydrate-webmentions.js`
  - Reads base URL from `src/site/_data/siteConfig.json`
  - Discovers targets from `build/posts/` (or uses CLI URLs)
  - Fetches Webmention.io JF2 for both current and legacy hosts and writes `.cache/webmentions-*.json`
  - Safe to re-run; cache files are overwritten

## Blog notes (draft)

- Why: Bringing back the social web with open standards vs. siloed embeds
- Concept primer: Webmentions are notifications between sites when content links
- Eleventy approach: Static site + hosted receiver (Webmention.io) + build-time rendering
- Discovery: `<link rel="webmention" href="…">` and canonical absolute URLs
- Microformats help: `h-entry`, `h-card` improve richness (future enhancement)
- Rendering choices: Replies vs. likes/reposts, avatars, truncation, dates
- Caching tradeoffs: API rate limits vs. freshness; CI fetch vs. local dev cache
- Sending mentions: optional; can be automated post-build
- Anti-spam: rely on verification + light blocklist; keep it simple
- Future work: IndieLogin/IndieAuth via `rel=me`, private mentions handling, websub

References to revisit:

- Webmention.io docs and JF2 API
- Max Böck’s eleventy-webmentions patterns
- Sia K’s “Webmentions & Eleventy in depth”
- IndieLogin setup and `rel=me` practices

---

## Acknowledgements

Inspired by Max Böck’s Eleventy webmentions starter and Sia K’s in-depth Eleventy + Webmentions guide.

- Caching/data-fetch patterns and template structure informed by Max Böck’s starter: https://github.com/maxboeck/eleventy-webmentions
- End‑to‑end walkthrough and normalization guidance from Sia K.: https://sia.codes/posts/webmentions-eleventy-in-depth/
- Additional ideas cross‑checked with equk’s write‑up: https://equk.co.uk/2023/07/18/adding-webmentions-in-eleventy/
- Protocol and API via Webmention.io and IndieWeb docs: https://webmention.io/ and indieweb.org resources

Note: the cache hydration script and legacy-host merge are bespoke for this site, adapted from the above patterns.


## Plan analysis

### 1) Account and Endpoints

Your plan to use **Webmention.io** and add discovery links is directly confirmed and explained by several of the provided sites.

- **`https://webmention.io/`**: This is the core service you'll use. The site confirms its purpose as a hosted receiver for Webmentions, which is the central pillar of your plan.
- **`https://github.com/maxboeck/eleventy-webmentions?tab=readme-ov-file`**: Max Böck's README shows the exact same `link` tags you've included in your plan, confirming the best practice for discovery. It also highlights the importance of the canonical URL, which you've also correctly included.
- **`https://sia.codes/posts/webmentions-eleventy-in-depth/`**: Sia's post provides a clear, step-by-step tutorial that mirrors your "Account and endpoints" section, reinforcing the need for both the `webmention` and `pingback` links and the canonical URL.

### 2) Author Identity (IndieLogin Prep)

Your use of `rel="me"` links is a key part of your plan and is directly supported by the IndieWeb community's standards.

- **`https://indielogin.com/setup`**: This site is the primary resource for setting up **IndieLogin**. It explains exactly why you need to add `rel="me"` links and how they are used to verify your identity. Your plan correctly includes these links and notes the importance of a return link to your site for full verification.
- The other sites, particularly Sia's post, also touch on the importance of `rel="me"` as part of the broader IndieWeb ecosystem.

### 3) Fetching and Rendering Mentions

This is the most complex part of your plan, and the linked resources provide concrete code and conceptual guidance to get it right.

- **`https://github.com/maxboeck/eleventy-webmentions`**: This is a treasure trove. The repository contains a complete, working Eleventy setup for Webmentions. You can review its `_data/webmentions.js` file to see a practical implementation of the data fetching, caching, and normalization logic you've outlined. Pay close attention to how it handles caching with a local JSON file to prevent excessive API calls.
- **`https://sia.codes/posts/webmentions-eleventy-in-depth/`**: Sia's post provides an in-depth explanation of the fetch and render process. It walks through building the data file, iterating over the mentions, and filtering them by type (`in-reply-to`, `like-of`, etc.), validating your approach to normalization and rendering.
- **`https://equk.co.uk/2023/07/18/adding-webmentions-in-eleventy/`**: This article offers another, more recent, example of the process. It's a great second opinion that confirms the general workflow of fetching data and displaying it on a post page. It can also give you alternative code snippets or ideas for the Nunjucks templates.

### 4) Sorting and Filtering Best Practices

The resources confirm the importance of sorting, filtering, and sanitizing data before display.

- Both Sia's and Max Böck's examples show how to filter mentions by their `wm-property` and `published` date. Your plan to sort by `published` with a fallback is a standard and robust approach.
- Your point about **sanitizing content** is crucial for security. The Eleventy community often uses packages like `sanitize-html` to achieve this. While not explicitly mentioned on the linked sites, your plan to reuse an existing filter is a good practice.

### 5) Sending Webmentions (Optional)

Your plan to send Webmentions is a great next step, and the resources provide a starting point.

- While the sites focus more on receiving mentions, some of the broader IndieWeb documentation (which these sites are a part of) discusses the sending process. Your `curl` command example is the correct, low-level way to send a Webmention.
- Max Böck’s Eleventy setup includes a script for sending mentions on build, which directly addresses your plan's optional component.
