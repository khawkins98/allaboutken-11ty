# PRD: No-JavaScript Post Feedback System

**Status:** Implemented (Phase 1 + 2 complete)
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

### Approach 1: GoatCounter Page-View Counting (Not chosen)

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

**Primary: Cloudflare Worker redirect-count-redirect pattern** — a modern implementation of the 1994 web ring CGI architecture.

### Rationale

1. **No page navigation** — the Worker returns a 302 redirect back to the original post with a `#thanks` fragment; the reader never truly leaves
2. **Dedicated data store** — feedback counts live in Cloudflare KV, separate from analytics noise
3. **Server-side bot filtering** — Worker checks User-Agent and request headers before counting
4. **Rate limiting** — one vote per IP+path per 24 hours, enforced server-side via KV TTL keys
5. **Live feedback counts** — SVG badge endpoint returns a dynamically generated image (the 1996 hit counter pattern)
6. **No client-side JavaScript** — the interaction is pure HTML links and HTTP redirects
7. **Privacy-first** — no cookies, no PII stored; only anonymous integer counters in KV
8. **Archaic charm** — the architecture is identical to how web rings counted click-throughs in 1994

### Why not GoatCounter (Approach 1)?

GoatCounter was the original recommendation. The Worker approach wins on:
- **UX**: redirect back vs. navigate to thank-you page
- **Data quality**: dedicated counters vs. mixed with analytics noise
- **Bot resistance**: server-side filtering vs. client-side JS only
- **Counts display**: SVG badge vs. build-time API dependency
- **Rate limiting**: per-IP enforcement vs. session de-duplication only

The tradeoff is one new dependency (Cloudflare Workers, free tier). The site already runs through Cloudflare DNS, so no new account is needed.

### Feedback Types

**Implemented: Positive-only feedback** — a single "Yes, this was useful" button:
- Simplest to implement and interpret
- One link per post, minimal UI surface area
- Clear signal: which posts helped people
- The Worker still supports `/down/` routes, but the UI doesn't expose them — binary up/down adds complexity (what does the count mean? net? total?) without much signal for a personal blog

**Future: Star rating (1–5 stars)** via ISMAP server-side image maps — deferred to v2. The Worker already supports arbitrary path-based counting, so adding star routes is straightforward.

**Feature gap vs. poll.fizzy.wtf:** poll.fizzy.wtf supports arbitrary key-value voting via query parameters (`?key=value`), allowing multiple questions and answers with no code changes. This Worker only counts one signal per post. That's a deliberate scope constraint — if flexible multi-question polls are needed, poll.fizzy.wtf has the better architecture for it.

---

## Technical Design

### Architecture

The feedback system is a Cloudflare Worker at `feedback.allaboutken.com` that implements three route families:

```
feedback.allaboutken.com/up/{post-path}/       → count vote, 302 redirect back
feedback.allaboutken.com/count/{post-path}.svg → SVG badge with count
feedback.allaboutken.com/count/{post-path}/    → plain text count
```

The Worker also supports `/down/` routes, but the UI currently only exposes the positive feedback button.

The Worker lives in `worker/` at the repo root, deployed independently from the static site via its own GitHub Actions workflow.

### Worker Routes

**Vote routes (`/up/` and `/down/`)**:
1. Parse the vote type and post path from the URL
2. Bot check: reject requests with known bot User-Agent substrings or missing `Accept-Language` header
3. Rate limit: SHA-256 hash of IP + path stored as a KV key with 24-hour TTL. If key exists, skip counting but still redirect
4. Increment: `count:{type}:{path}` key in KV via `ctx.waitUntil()` (non-blocking)
5. Redirect: `302 Location: https://www.allaboutken.com/{path}/#thanks`

**Badge route (`/count/{path}.svg`)**:
1. Read `count:up:{path}` from KV
2. Generate a shields.io-style SVG badge
3. Return with `Content-Type: image/svg+xml`, 5-minute cache, CORS restricted to site origin

**Everything else**: 404

### KV Data Schema

```
count:up:posts/my-post-slug      → "47"     (thumbs-up count)
count:down:posts/my-post-slug    → "3"      (thumbs-down count)
rl:<sha256-hash>                 → "1"      (rate limit flag, 24h TTL)
```

### Post Template Changes

Feedback section inserted into `post.njk`, inside the `kh-stack` wrapper, **before** the "Comment?" section:

```html
<article class="kh-grid kh-grid__col-3 kh-u-do-not-print">
  <div class="kh-grid__col--span-1"></div>
  <div class="kh-content kh-grid__col--span-2">
    <h2 class="kh-text-heading--2">Was this useful?</h2>
    <p class="kh-cluster">
      <a href="https://feedback.allaboutken.com/up{{ page.url }}"
         rel="nofollow" class="kh-button kh-button--sm">👍 Yes, this was useful</a>
    </p>
    <p id="thanks" class="kh-feedback-thanks" aria-live="polite">Thanks for the feedback!</p>
  </div>
</article>
```

The `#thanks` element is hidden by default and revealed via CSS `:target` when the Worker redirects back with the `#thanks` fragment.

### CSS

Two rules added inside `body:has(#kh-css-toggle:checked)` in `index.scss`:

```scss
.kh-feedback-thanks {
  display: none;
}

.kh-feedback-thanks:target {
  display: block;
}
```

Feedback buttons reuse existing `.kh-button` / `.kh-button--sm` styles. The feedback section uses `kh-u-do-not-print` to hide from print.

### Build Considerations

The Worker approach **simplifies** the build compared to the original GoatCounter design:
- No extra pages generated by Eleventy (no feedback thank-you pages, no pagination templates)
- No exclusions needed from collections, sitemap, RSS, or social cards
- No changes to `robots.txt` (feedback URLs are on a different origin)
- The only site-side changes are: one template block in `post.njk`, two CSS rules in `index.scss`

---

## UX Considerations

### Placement
- Between the article content and the existing "Comment?" section
- The feedback section is a softer ask than commenting — it should come first
- Use the same grid layout pattern as the comment section (1/3 + 2/3 columns)

### Copy
- Heading: "Was this useful?" (direct, low-pressure)
- Button: "👍 Yes, this was useful" (positive-only, friendly)
- Thank-you message: "Thanks for the feedback!" (revealed via CSS `:target`, no page navigation)
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

The Worker approach provides significantly stronger bot defense than the original GoatCounter design, because filtering happens server-side before any count is incremented.

**Layer 1: Prevent discovery**

| Mechanism | What it does |
|---|---|
| `rel="nofollow"` on feedback links in `post.njk` | Tells crawlers not to follow the link |
| Feedback URLs are on a different origin (`feedback.allaboutken.com`) | Not discoverable via site crawl unless a bot follows `nofollow` links |
| No sitemap or robots.txt entries needed | The Worker is a separate origin; site-side `robots.txt` doesn't apply |

**Layer 2: Worker-side bot filtering**

The Worker rejects requests before counting:
- **User-Agent check**: rejects requests matching ~30 known bot UA substrings (Googlebot, Bingbot, Ahrefsbot, GPTBot, etc.)
- **Missing User-Agent**: rejected (real browsers always send one)
- **Missing `Accept-Language` header**: rejected (browsers always send it; most bots don't)
- Rejected requests return a 404, not a redirect — bots get no signal that the endpoint exists

**Layer 3: Rate limiting**

One vote per IP+path per 24 hours, enforced via KV TTL keys:
- SHA-256 hash of `IP:type:path` stored with `expirationTtl: 86400`
- If the key exists, the Worker still redirects (good UX) but doesn't increment the counter
- This prevents both bot spam and human over-clicking

**Layer 4: Data cleanup**

KV counters can be managed directly:
- `wrangler kv:key delete` to zero specific counters
- `wrangler kv:key list` to audit all keys
- Worker logic can be updated to add new filtering rules without redeploying the site

**What about intentional abuse / gaming?**

- Rate limiting means one vote per IP per post per day
- For a personal blog, this is an acceptable tradeoff — the feedback is directional, not scientific
- The worst case is noisy data, not compromised systems
- The feature can be disabled by removing the template block from `post.njk`

---

## Open Questions (Resolved)

1. ~~**Should feedback be available on all posts or only recent ones?**~~ **Resolved: all posts.** The feedback button is in `post.njk`, so it appears on every post automatically.

2. ~~**Should the thank-you page auto-redirect back to the post?**~~ **Resolved: no thank-you page.** The Worker 302-redirects back to the post with `#thanks` fragment. CSS `:target` reveals the message in-place. No separate page needed.

3. ~~**Should feedback data be pulled into the build?**~~ **Resolved: not yet.** Live SVG badge and plain text count endpoints serve counts directly. Build-time fetch remains a future option via the `/count/{path}/` endpoint.

4. ~~**Star ratings or binary?**~~ **Resolved: positive-only for now.** A single "Yes, this was useful" button. Stars via ISMAP deferred to v2.

5. **Should impact stories and regular posts have different feedback prompts?** Still open. Currently all posts use "Was this useful?" — may revisit once there's feedback data to evaluate.

---

## Future Possibilities

- **Build-time feedback counts**: Fetch from Worker's `/count/{path}/` endpoint during build, bake counts into static HTML. No client-side JS needed.
- **Feedback dashboard page**: A site page (like `/feedback/`) that shows aggregated feedback across all posts, built from KV data at build time via `wrangler kv key list`.
- **Star rating via ISMAP**: Server-side image maps (HTML 1993) for 1–5 star ratings. Worker parses click coordinates to determine rating.
- **Feedback on non-post pages**: Extend to work pages, the style guide, etc.
- **Webmention integration**: If someone boosts/likes the post via Webmention (already partially set up via webmention.io), surface that alongside the feedback counts.
- **Arbitrary key-value polls**: Adopt poll.fizzy.wtf's `?key=value` query parameter pattern for flexible multi-question polls. Currently out of scope — adds validation complexity and unbounded KV key patterns.

---

## Implementation Plan

### Phase 1: Worker + Site Integration ✓ Complete
1. ✓ Create `worker/` directory with `package.json`, `wrangler.toml`, and `src/index.js`
2. ✓ Worker implements: vote routes (`/up/`, `/down/`), SVG badge route (`/count/.svg`), plain text count route (`/count/`), bot filtering, rate limiting, Referer origin check, dynamic CORS
3. ✓ Add feedback section to `post.njk` — positive-only button with `rel="nofollow"`, SVG badge
4. ✓ Add `:target` CSS for `#thanks` reveal in `index.scss`
5. ✓ Add `.wrangler` and `worker/node_modules` to `.gitignore`
6. ✓ Create GitHub Actions workflow for Worker deployment (`deploy-feedback-worker.yml`)
7. ✓ Test locally: `cd worker && npm install && npm run dev` → routes verified
8. ✓ Test site build: `yarn build` → passes

### Phase 2: Deployment ✓ Complete
9. ✓ Run `npx wrangler kv namespace create FEEDBACK_COUNTS` and update `wrangler.toml` with real namespace ID
10. ✓ Custom domain `feedback.allaboutken.com` provisioned via `wrangler deploy` (Cloudflare DNS)
11. ✗ GitHub repository secrets not yet configured (Worker deployed manually via `npx wrangler deploy`)
12. ✓ Deploy Worker: `npx wrangler deploy` → live at `feedback.allaboutken.com`
13. ✓ End-to-end test: vote button → 302 redirect → count increments → SVG badge updates

### Phase 3: Star Ratings (Future)
14. Add ISMAP star rating image + route to Worker
15. Worker parses click coordinates to determine star rating
16. Add star rating UI to post template

---

## Success Criteria

- Feedback links render on all blog posts
- Clicking a feedback link redirects via the Worker and returns to the original post with `#thanks` visible
- Worker increments KV counter on each unique vote (rate-limited to one per IP+path per 24h)
- SVG badge endpoint returns correct count
- Bot requests are rejected (return 404, not counted)
- Site build passes: `yarn build` completes without errors
- CSS lint passes: `yarn lint:css` completes without errors
- Feedback section is hidden in print preview (`kh-u-do-not-print`)
- `#thanks` message is hidden by default, visible only when fragment is in URL
