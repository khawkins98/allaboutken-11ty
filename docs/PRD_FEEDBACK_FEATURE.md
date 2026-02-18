# PRD: No-JavaScript Post Feedback System

**Status:** Draft / RFC
**Author:** Ken Hawkins
**Date:** 2026-02-18

---

## Problem Statement

Blog posts on allaboutken.com currently have no lightweight way for readers to signal whether content was useful or resonant. The "Comment?" section at the bottom of posts links out to Mastodon, LinkedIn, and email — all high-friction channels that require the reader to context-switch, authenticate, and compose a message. Most readers who have an opinion won't bother.

What's missing is a **low-friction, in-page signal** — something closer to a thumbs-up or a star rating — that lets readers express a reaction in one click.

## Goals

1. **Let readers give quick feedback** (thumbs up/down, 1–5 stars, or similar) on any blog post
2. **No JavaScript** in the feedback mechanism itself — the interaction must work with pure HTML and CSS
3. **No backend** — the site runs on GitHub Pages with zero server-side processing
4. **Minimal new dependencies** — ideally zero new external services
5. **Privacy-respecting** — no tracking cookies, no PII collection, consistent with the site's existing GoatCounter analytics approach
6. **Archivable and durable** — the mechanism should use stable web standards, not depend on third-party widget scripts that could disappear

## Constraints

- **GitHub Pages** serves only static files — no POST handlers, no server-side logic, no databases
- **No page JavaScript** for the feedback interaction (the rest of the site already loads GoatCounter's JS and a service worker, so JS isn't banned globally — but the feedback feature itself must work without it)
- **Existing CSS architecture** scopes all styles under `body:has(#kh-css-toggle:checked)`, so any new styles must follow this pattern
- **Existing build pipeline**: Dart Sass → Eleventy → post-build search index. Any new build steps should integrate cleanly
- **Preference against new SaaS**, though not an absolute rule if the tradeoff is compelling

---

## Approaches Explored

### Approach 1: GoatCounter Page-View Counting (Recommended)

**Concept:** Each feedback option is a plain HTML link to a static "thank you" page. Eleventy generates these pages at build time. When the reader clicks, they land on the thank-you page, and **GoatCounter automatically counts that page view** — the URL path itself encodes the feedback signal.

**How it works:**

1. At the bottom of each post, render feedback links:
   ```
   👍  →  /feedback/up/posts/my-post-slug/
   👎  →  /feedback/down/posts/my-post-slug/
   ```

2. Eleventy pagination generates a static page for each combination of (post × feedback-type), similar to how `social-cards.njk` generates `/social/<page-url>/` pages today.

3. Each generated page shows a simple "Thanks for your feedback" message with a link back to the original post.

4. GoatCounter's existing `<script>` tag (already in `base.njk`) automatically records the page view. The URL path `/feedback/up/posts/my-post-slug/` is the data point.

5. Feedback data is queryable directly in the GoatCounter dashboard by filtering for paths starting with `/feedback/`.

   **Note on noscript pixels:** An earlier version of this design included a `<noscript><img>` GoatCounter pixel as a fallback for JS-disabled browsers. This was **removed** because the pixel is a bot magnet — simple crawlers load images but don't execute JS, so the pixel would count bot visits while GoatCounter's JS-based counting already filters them out. See "Bot and Crawler Mitigation" for details.

**Why this is interesting (the archaic web angle):**

This approach combines two of the oldest interactive web patterns:

- **HTML links** (1991) — the original web interaction. No forms, no JavaScript, just `<a href>`. Tim Berners-Lee would approve.
- **Web bugs / tracking pixels** (mid-1990s) — the `<img>` tag as a data beacon. This technique predates JavaScript-based analytics by nearly a decade. The noscript fallback uses exactly this pattern.

The entire feedback flow is: click a link → load a page → the page view is the data. It's the web at its most fundamental.

**Pros:**
- Zero new dependencies (GoatCounter already integrated)
- Zero JavaScript in the feedback mechanism
- Data immediately available in existing analytics dashboard
- Works for any reader, no accounts needed
- Fully static, fully cacheable
- Battle-tested Eleventy pagination pattern (same as social cards)
- Privacy-preserving (GoatCounter is cookie-free, no PII)
- Graceful degradation: even without CSS, the links are just text links

**Cons:**
- Navigates the reader away from the post (they land on a thank-you page)
- No built-in rate limiting — a reader could click multiple times (but GoatCounter de-dupes by session, so this is partially mitigated)
- Feedback data lives in GoatCounter, not in the repo — if GoatCounter goes away, historical data goes with it
- No way to display aggregated feedback counts on the post itself (without JS or a build-time API call)
- GoatCounter's free tier has data retention limits

---

### Approach 2: HTML Form GET Submission

**Concept:** Use a native `<form method="GET">` with radio buttons for star ratings or submit buttons for thumbs up/down. The form action points to a static thank-you page. Query parameters encode the feedback.

```html
<form action="/feedback/posts/my-post-slug/" method="GET" class="kh-feedback">
  <fieldset>
    <legend>Rate this post</legend>
    <button type="submit" name="r" value="up">👍</button>
    <button type="submit" name="r" value="down">👎</button>
  </fieldset>
</form>
```

Submitting navigates to `/feedback/posts/my-post-slug/?r=up`, and GoatCounter records the full URL including the query string.

**Why this is interesting:**

`<form method="GET">` is an HTML 2.0 feature from 1995. Before CGI scripts, before JavaScript, this was how web pages talked back. The form serializes its inputs into a URL and navigates there. It's a purely declarative interaction — the browser does all the work.

You could even use `<input type="image">` (also HTML 2.0) to make the submit button a custom image, and the browser will append the click coordinates to the URL. Peak 1995.

**Pros:**
- Native HTML form semantics — accessible by default (keyboard, screen readers)
- Supports more complex interactions (star ratings via radio buttons + submit)
- Query parameters keep data in GoatCounter alongside the path
- `<fieldset>` and `<legend>` provide built-in accessible grouping

**Cons:**
- GoatCounter may record query parameters inconsistently — need to verify behavior
- Slightly more HTML than plain links
- Radio buttons need CSS work to look like stars
- Form styling is more complex than link styling

---

### Approach 3: Mailto Links

**Concept:** Feedback buttons are `mailto:` links with pre-filled subject lines.

```html
<a href="mailto:khawkins98@gmail.com?subject=Feedback: 👍 for 'Post Title'&body=Post URL: https://www.allaboutken.com/posts/my-post-slug/">👍</a>
```

**Why this is interesting:**

`mailto:` links predate the web — they're from RFC 1738 (1994) and RFC 2368 (1998). The idea of encoding structured data in an email subject line is gloriously pre-JavaScript. The user's mail client becomes the "form handler."

**Pros:**
- Zero external services
- Creates a durable record (emails)
- The most archaic approach on this list
- Works even if GoatCounter disappears

**Cons:**
- Extremely high friction — opens an email client, user has to actually send
- Exposes the site owner's email to spam
- Most users will not follow through
- Mobile mail client behavior is inconsistent
- Not viable as a low-friction feedback mechanism

**Verdict:** Charming as a thought experiment, impractical for real use.

---

### Approach 4: GitHub Issue Links

**Concept:** Each feedback button links to a GitHub Issues URL with pre-filled title and body.

```
https://github.com/khawkins98/allaboutken-11ty/issues/new?title=Feedback:+👍+for+Post+Title&body=...&labels=feedback
```

**Pros:**
- Data lives in the repo's issue tracker
- Structured, searchable, exportable
- Free, durable, no new service

**Cons:**
- Requires reader to have a GitHub account (excludes ~95% of readers)
- High friction — navigates away to GitHub, requires auth
- Feedback is public (some readers won't want that)

**Verdict:** Could work as a secondary "detailed feedback" channel, not as the primary low-friction mechanism.

---

### Approach 5: CSS `:target` with Tracking Pixel

**Concept:** Feedback options are anchor links (`#thumbs-up`). CSS `:target` rules show a "thank you" message and trigger a `background-image` load on a tracking pixel URL.

```html
<a href="#feedback-up">👍</a>
<div id="feedback-up" class="kh-feedback-thanks">
  Thanks for the feedback!
  <span style="background-image: url('https://khawkins98.goatcounter.com/count?p=/feedback/up/post-slug')"></span>
</div>
```

**Why this is interesting:**

CSS `:target` (CSS3, ~2001) combined with CSS background-image loading is a genuinely no-JS way to trigger a network request based on user interaction. The browser loads the background image when the element becomes visible via `:target`. It's a side-channel — CSS was never designed to be an analytics transport, but it works.

**Pros:**
- No page navigation — feedback happens in-place
- No JavaScript at all
- Clever technical approach

**Cons:**
- **Unreliable**: browsers may or may not load background images on `:target` elements, especially if the element was previously `display: none`
- GoatCounter's counting endpoint may not respond with valid image data, causing browser errors
- `:target` changes the URL hash, which can interfere with scroll position and back button
- Hard to test and verify that the pixel actually fires
- Accessibility concerns — screen readers may not announce the state change

**Verdict:** Technically fascinating but too fragile for production use.

---

### Approach 6: External Form Service

**Concept:** Use a form backend service (Formspree, Basin, Google Forms, Cloudflare Workers) to receive POST submissions.

```html
<form action="https://formspree.io/f/xxxxx" method="POST">
  <input type="hidden" name="post" value="my-post-slug">
  <button name="rating" value="up">👍</button>
</form>
```

**Pros:**
- True form submission with POST
- Data stored in a dedicated service
- Can support richer interactions (text feedback, etc.)

**Cons:**
- New external dependency / SaaS
- Free tiers have submission limits
- Redirects to third-party confirmation page (or requires JS for AJAX)
- CORS and redirect handling adds complexity
- Against the stated preference to avoid SaaS

**Verdict:** Viable if the SaaS concern is relaxed, especially with Cloudflare Workers (free tier, self-controlled). But not the first choice given the constraints.

---

## Recommended Approach

**Primary: Approach 1 (GoatCounter Page-View Counting)** with elements of **Approach 2 (HTML Forms)** for the star rating variant.

### Rationale

1. **Zero new dependencies** — GoatCounter is already integrated and paid-for
2. **Proven Eleventy pattern** — pagination-generated pages already work for social cards
3. **No JavaScript** — plain links and/or GET forms
4. **Data is immediately useful** — GoatCounter dashboard provides filtering, date ranges, and export
5. **Archaic charm** — the mechanism is literally "click a link, the page view is the vote." This is how the web worked before JavaScript existed
6. **Privacy-first** — no cookies, no PII, consistent with site philosophy

### Feedback Types

Start with **two tiers**, to be implemented in order:

**Tier 1: Binary feedback (thumbs up / thumbs down)**
- Simplest to implement and understand
- Two links per post, minimal UI surface area
- Clear signal: was this useful or not?

**Tier 2: Star rating (1–5 stars)**
- Richer signal than binary
- Implemented as a GET form with radio inputs styled as stars (CSS-only star styling)
- Submits to the same thank-you page infrastructure

Tier 1 should be built first. Tier 2 can be added later if the binary signal feels insufficient.

---

## Technical Design

### URL Structure

```
/feedback/{type}/{original-page-url}/
```

Examples:
```
/feedback/up/posts/my-post-slug/
/feedback/down/posts/my-post-slug/
/feedback/stars-3/posts/my-post-slug/
```

### Generated Pages

A new Eleventy pagination template (similar to `social-cards.njk`):

**`src/site/feedback.njk`**
```yaml
---
pagination:
  data: collections.posts
  size: 1
  alias: feedbackPost
permalink: false  # Handled by custom permalink logic
eleventyExcludeFromCollections: true
---
```

This needs to generate multiple pages per post (one per feedback type). Two options:

**Option A: Multiple pagination templates**
- `src/site/feedback-up.njk` → `/feedback/up/{post-url}/`
- `src/site/feedback-down.njk` → `/feedback/down/{post-url}/`
- Simple but repetitive

**Option B: JavaScript data cascade + pagination**
- Generate a computed collection that cross-products posts × feedback types
- Single template, more complex data setup
- Cleaner long-term, especially when adding star ratings

**Recommendation:** Start with Option A (two simple templates) for Tier 1. Refactor to Option B when/if Tier 2 is added.

### Thank-You Page Template

**`src/site/_includes/layouts/feedback.njk`**

A minimal layout (extends `base.njk`) that shows:
- "Thanks for your feedback on: {post title}"
- A link back to the original post: "← Return to the post"
- `<meta name="robots" content="noindex, nofollow">` (these pages shouldn't appear in search or be crawled further)
- Excluded from search index via `kh-search-client-side--no-index` class
- Excluded from sitemap
- Excluded from RSS feed

### Post Template Changes

Add a feedback section to `post.njk`, after the article content and before the "Comment?" section:

```html
<article class="kh-grid kh-grid__col-3 kh-u-do-not-print">
  <div class="kh-grid__col--span-1"></div>
  <div class="kh-content kh-grid__col--span-2">
    <h2 class="kh-text-heading--2">Was this useful?</h2>
    <p class="kh-cluster kh-feedback">
      <a href="/feedback/up{{ page.url }}" rel="nofollow" class="kh-button kh-button--sm">👍 Yes</a>
      <a href="/feedback/down{{ page.url }}" rel="nofollow" class="kh-button kh-button--sm">👎 Not really</a>
    </p>
  </div>
</article>
```

### CSS

New styles needed (scoped under `body:has(#kh-css-toggle:checked)`):

- `.kh-feedback` — flex layout for feedback buttons, appropriate spacing
- Feedback buttons reuse existing `.kh-button` / `.kh-button--sm` styles
- Thank-you page styling — minimal, centered content
- For star ratings (Tier 2): CSS-only star display using radio buttons + `~` sibling selectors

### GoatCounter Data Structure

In the GoatCounter dashboard, feedback shows up as page views:

```
/feedback/up/posts/my-post-slug/     → 47 views (47 thumbs up)
/feedback/down/posts/my-post-slug/   → 3 views  (3 thumbs down)
```

**Querying feedback:**
- Filter paths by `/feedback/` prefix to see all feedback
- Filter by `/feedback/up/` to see all positive feedback
- Export data via GoatCounter's CSV export or API
- GoatCounter API: `GET https://khawkins98.goatcounter.com/api/v1/stats/hits?filter=/feedback/`

### Build Considerations

- Feedback pages are generated at build time — no runtime cost
- Each post generates 2 additional pages (up/down) — for ~100 posts, that's ~200 extra static files (trivial)
- Feedback pages should be excluded from:
  - `collections.posts` (already handled by `eleventyExcludeFromCollections`)
  - Search index (via `kh-search-client-side--no-index` class)
  - RSS feed (feed only includes `collections.posts`)
  - Sitemap (add exclusion condition)
  - Social cards generation (the social-cards pagination uses `collections.all`, so either filter in that template or accept the minimal overhead)

---

## UX Considerations

### Placement
- Between the article content and the existing "Comment?" section
- The feedback section is a softer ask than commenting — it should come first
- Use the same grid layout pattern as the comment section (1/3 + 2/3 columns)

### Copy
- Heading: "Was this useful?" (direct, low-pressure)
- Buttons: "👍 Yes" / "👎 Not really" (friendly, non-judgmental)
- Thank-you page: "Thanks for the feedback!" with a return link
- The heading and button text should be iterable — this is the kind of thing to A/B test by feel over time

### Accessibility
- Feedback links are standard `<a>` elements — fully keyboard navigable
- Button text includes both emoji and text label (not emoji-only)
- Thank-you page includes a clear return link
- Feedback section is hidden from print (`kh-u-do-not-print`)

### Progressive Enhancement
- Without CSS: feedback links appear as plain text links (fully functional)
- Without JavaScript: works identically (no JS involved)
- With CSS disabled via toggle: links remain functional, just unstyled

### Bot and Crawler Mitigation

This is the hardest problem in the design. Since every page load of a feedback URL counts as a "vote," any bot that crawls those pages creates phantom feedback. Even well-intentioned crawlers (Googlebot, Bingbot, Ahrefsbot) would pollute the data if they discover and visit `/feedback/up/posts/...` pages.

The defense is layered — no single measure is sufficient, but combined they should keep the signal-to-noise ratio usable.

**Layer 1: Prevent discovery (stop bots from finding the URLs)**

| Mechanism | What it does | Stops |
|---|---|---|
| `robots.txt` `Disallow: /feedback/` | Tells well-behaved crawlers not to visit any `/feedback/` path | Googlebot, Bingbot, most commercial crawlers |
| `rel="nofollow"` on all feedback links in `post.njk` | Tells crawlers not to follow the link, so they never discover the target URL | Crawlers that respect `nofollow` (most major ones) |
| Exclude from `sitemap.xml` | Feedback pages never appear in the sitemap | Crawlers that use sitemap as their URL source |
| Exclude from RSS feed | Feedback URLs don't appear in feed content | Feed readers and feed-crawling bots |
| `eleventyExcludeFromCollections: true` | Pages aren't in `collections.all`, so no internal Eleventy-generated listing links to them | Crawlers following internal link graphs |

The combination of `robots.txt` + `rel="nofollow"` + sitemap exclusion means a well-behaved crawler has **no way to discover these URLs** through normal means. The pages exist, but nothing points a crawler at them.

**Layer 2: Instruct crawlers that do arrive**

| Mechanism | What it does |
|---|---|
| `<meta name="robots" content="noindex, nofollow">` on thank-you pages | Tells any crawler that arrives not to index the page or follow its links |
| No outbound links from thank-you pages to other feedback pages | Even if a bot reaches one feedback page, it won't discover others from there |

**Layer 3: GoatCounter's built-in bot filtering**

GoatCounter already filters known bots:
- Checks `User-Agent` against a maintained list of known crawlers (uses the `isbot` detection library)
- Ignores requests from common bot IP ranges
- Provides a "Filter bots" toggle in the dashboard

This is the main defense against bots that ignore `robots.txt`. GoatCounter won't count visits from anything that identifies as Googlebot, Bingbot, etc. — even if the bot visits the page anyway.

**Layer 4: Drop the `<noscript>` counting pixel**

The original design included a `<noscript>` GoatCounter pixel on thank-you pages as a fallback for JS-disabled browsers. **This should be removed or reconsidered**, because:

- Most bots that ignore `robots.txt` are simple HTTP fetchers — they load HTML and images but don't execute JavaScript
- The `<noscript><img>` pixel fires for exactly these clients: things that load images but skip JS
- GoatCounter's JavaScript-based counting already has bot filtering built in; the raw pixel endpoint may have weaker filtering
- The tradeoff: a JS-disabled human visitor's feedback wouldn't be counted. But JS-disabled bots' "feedback" also wouldn't be counted. Given that bots vastly outnumber JS-disabled humans, dropping the pixel is a net improvement in data quality

**Recommendation:** Rely solely on GoatCounter's JavaScript-based counting. No `<noscript>` pixel. Accept the tiny data loss from JS-disabled human visitors in exchange for much cleaner data.

**Layer 5: Data hygiene**

Even with all the above, some noise will get through. Mitigation at the analysis level:

- **Spike detection**: A sudden burst of feedback across many posts simultaneously is almost certainly a crawler — ignore it
- **GoatCounter's referrer data**: Bot visits often have no referrer or come from suspicious sources. Filter these in the dashboard
- **Path pattern analysis**: A bot that hits every `/feedback/up/...` and `/feedback/down/...` page in sequence is easy to spot
- **Session de-duplication**: GoatCounter groups hits by session (User-Agent + approximate location). A bot cycling through pages would show as one session with hundreds of hits — trivially filterable
- **Manual baseline**: For the first few weeks after launch, compare feedback counts against total post traffic to establish a reasonable ratio. If a post with 10 views has 50 thumbs up, something is wrong

**What about intentional abuse / gaming?**

- GoatCounter's session de-duplication means a single person clicking the same link repeatedly doesn't multiply their vote significantly
- There's no way to fully prevent gaming on a static site without JavaScript or a backend
- For a personal blog, this is an acceptable tradeoff — the feedback is directional, not scientific
- If gaming becomes a real problem, GoatCounter's dashboard shows traffic patterns that would reveal anomalies
- The worst case is that feedback data becomes noisy enough to be useless — but no data is lost, no systems are compromised, and the feature can be removed by deleting a few template files

---

## Open Questions

1. **Should feedback be available on all posts or only recent ones?** Generating pages for the full archive increases build output but is trivially cheap. Recommend: all posts, for simplicity.

2. **Should the thank-you page auto-redirect back to the post?** A `<meta http-equiv="refresh">` tag could send the reader back after a few seconds. This is another gloriously old-school HTML feature (HTTP-EQUIV is from HTML 2.0). Downside: the reader might not see the thank-you message. Could compromise with a 3–5 second delay.

3. **Should feedback data be pulled into the build?** GoatCounter has an API. A build-time script could fetch feedback counts and inject them into the site as data (showing "47 people found this useful"). This would be a Phase 2 enhancement — it adds a build-time API dependency and caching complexity.

4. **Star ratings or binary?** Start with binary (thumbs up/down). It's simpler to build, simpler to interpret, and lower friction for the reader. Stars can be added later if the binary signal isn't granular enough.

5. **Should impact stories and regular posts have different feedback prompts?** Impact stories are professional case studies; the prompt might be better as "Was this case study helpful?" vs. the more casual "Was this useful?" for blog posts.

---

## Future Possibilities

- **Build-time feedback counts**: Fetch from GoatCounter API during build, display on post pages as static text ("X people found this useful"). No client-side JS needed.
- **Feedback dashboard page**: A site page (like `/feedback/`) that shows aggregated feedback across all posts, built from GoatCounter data at build time.
- **Star rating tier**: CSS-only star rating form using the same infrastructure.
- **Feedback on non-post pages**: Extend to work pages, the style guide, etc.
- **Webmention integration**: If someone boosts/likes the post via Webmention (already partially set up via webmention.io), surface that alongside the feedback counts.

---

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create feedback thank-you page layout (`src/site/_includes/layouts/feedback.njk`)
   - `<meta name="robots" content="noindex, nofollow">`
   - No `<noscript>` pixel (rely on GoatCounter JS only — see Bot Mitigation)
   - `kh-search-client-side--no-index` class on body content
2. Create pagination templates for thumbs up/down (`src/site/feedback-up.njk`, `src/site/feedback-down.njk`)
   - `eleventyExcludeFromCollections: true` (excludes from sitemap, social cards, RSS)
3. Add feedback section to `post.njk` — links use `rel="nofollow"` to prevent crawler discovery
4. Add `Disallow: /feedback/` to `robots.njk`
5. Add CSS for feedback section
6. Test with `yarn dev` — verify pages generate, links work, GoatCounter records views

### Phase 2: Polish
7. Add `<meta http-equiv="refresh">` auto-return on thank-you pages (if decided)
8. Refine thank-you page design and copy
9. Verify feedback data appears correctly in GoatCounter dashboard
10. Monitor for bot noise in first weeks — establish baseline feedback-to-traffic ratio

### Phase 3: Star Ratings (Future)
11. Refactor to computed collection (cross-product of posts × feedback types)
12. Add star rating form to post template
13. CSS-only star styling
14. Generate star-rating thank-you pages

---

## Success Criteria

- Feedback links render on all blog posts
- Clicking a feedback link navigates to a thank-you page and records a GoatCounter event
- Feedback data is visible in GoatCounter dashboard under `/feedback/` paths
- The flow relies on GoatCounter's JS for counting (noscript pixel intentionally omitted to reduce bot noise — see Bot Mitigation)
- No new external service dependencies
- Build time increase is negligible (< 1 second)
- Passes `yarn lint:css` and `yarn build` without errors
