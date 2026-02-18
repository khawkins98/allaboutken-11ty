# Feedback Feature: Research Notes & Design Exploration

**Purpose:** Source material for a future blog post about the final implementation — how we got there, what we explored, and why we made the choices we did.

**Date:** 2026-02-18

---

## The problem in one sentence

How do you add reader feedback (thumbs up/down, star ratings) to a static site on GitHub Pages, with no JavaScript in the interaction, no backend, and minimal new dependencies?

---

## Part 1: Thinking like a 1998 web developer

### The key insight

In 1998, your personal page on GeoCities was static HTML — just like GitHub Pages today. You had no backend. But you wanted interactivity: hit counters, guestbooks, polls, voting buttons. So what did you do?

**You used other people's CGI scripts.**

The web was always a composition of origins. Your page was static, but `<img>` tags, `<form>` actions, and `<a>` links could point *anywhere*. The "server-side" part lived on someone else's server — a web ring host, a counter service, Bravenet, a university's shared `/cgi-bin/` directory. Your static page was the *frontend*; the internet was the *backend*.

This is exactly the architecture of a modern static site with serverless functions.

### Pattern 1: The web ring redirect

**What it was:** Web rings (1994–2005) used a central CGI script to navigate between member sites. The URL looked like:

```
http://www.webring.org/cgi-bin/webring?ring=navships;id=002;next
```

When visited, the CGI script would:
1. Look up the ring and current site
2. Log the click-through
3. Return a `302 Found` redirect to the next site in the ring

The user barely noticed the hop. Click → brief flash → you're at the next site. The CGI script was invisible infrastructure.

**"Top Sites" voting worked identically.** "Vote for my site!" buttons on ranking lists sent you through a CGI counter that incremented your vote and bounced you back.

**Why it matters for feedback:** This is literally the pattern we need. Replace "next site in ring" with "the post you just read" and "click-through count" with "thumbs-up count." The architecture is identical:

```
User clicks "👍" on blog post
  → GET https://feedback-worker.example/up/posts/my-post/
  → Worker increments counter
  → Worker returns: 302 Location: https://www.allaboutken.com/posts/my-post/#thanks
  → Browser follows redirect
  → CSS :target reveals "Thanks!" message on the original page
  → User never truly "left"
```

Sage Weil built this pattern in 1994 when he was still in high school. It's the same pattern, running on a Cloudflare Worker instead of a Pentium II.

### Pattern 2: The hit counter image

**What it was:** The iconic "You are visitor #12,345" counter. An `<img>` tag pointed to a CGI script:

```html
<img src="http://www.digits.com/cgi-bin/counter?id=mysite">
```

The script would:
1. Increment a counter in a flat file
2. Generate an image of the number (often with fancy digit graphics)
3. Return the image as `image/gif`

The browser thought it was loading a normal image. The server was secretly running code.

**Why it matters for feedback:** A modern Cloudflare Worker can return a dynamically generated SVG showing feedback counts:

```html
<img src="https://feedback-worker.example/count/posts/my-post.svg"
     alt="47 people found this useful">
```

The Worker looks up the count in KV storage, generates an SVG badge styled to match the site, and returns `image/svg+xml`. The blog page includes the image with a normal `<img>` tag. No JavaScript. The image is live data rendered by a "CGI script" running at the edge.

This is the 1x1 tracking pixel / hit counter concept from 1996, evolved into a useful UI element.

### Pattern 3: `<input type="image">` as submit button

**What it was:** HTML 2.0 (1995) introduced `<input type="image">` — a form submit button that displays an image instead of text. When clicked, it submits the form AND appends the click coordinates:

```
vote.x=47&vote.y=12
```

People used this before CSS made `<button>` elements styleable. You'd draw your "Submit" button in Microsoft Paint, save as a GIF, and use `<input type="image">`.

**Why it matters for feedback:** The feedback buttons could be literal image submit buttons in an HTML form, submitting to a Worker endpoint:

```html
<form action="https://feedback-worker.example/vote" method="GET">
  <input type="hidden" name="post" value="/posts/my-post/">
  <input type="image" src="/images/thumbs-up.svg"
         name="vote" value="up" alt="Thumbs up">
</form>
```

Pure HTML form semantics from 1995. The browser handles everything. The Worker receives the vote, records it, and redirects back.

### Pattern 4: Server-side image maps (the delightfully archaic one)

**What it was:** Before client-side `<map>` elements existed, there was the `ismap` attribute (HTML 1.0, 1993). Wrap an `<img>` in an `<a>` tag, add `ismap`, and when the user clicks the image, the browser appends `?x,y` coordinates to the URL:

```html
<a href="/cgi-bin/imagemap">
  <img src="/images/navbar.gif" ismap>
</a>
```

Clicking at position (150, 20) would request `/cgi-bin/imagemap?150,20`. The CGI script would use a map file to determine which region was clicked and redirect accordingly.

Server-side image maps were first supported in NCSA Mosaic 1.1. They required a round-trip to the server for every click — browsers didn't know what the regions meant, only the server did.

**Why it matters for feedback:** A star rating could be implemented as a literal server-side image map:

```html
<a href="https://feedback-worker.example/rate/posts/my-post/">
  <img src="/images/five-stars-empty.svg" ismap
       alt="Rate this post from 1 to 5 stars">
</a>
```

The user clicks on the third star → browser sends `?147,20` → Worker calculates which star based on the X coordinate (each star occupies a known pixel range) → records the rating → redirects back.

This is the most 1993-faithful approach to a star rating system. It's a delightful anachronism and it would genuinely work.

### Pattern 5: The `<iframe>` widget

**What it was:** In the late 1990s, third-party services like Bravenet, GeoCities, and FreePolls offered embeddable widgets via iframes. You'd paste a snippet into your HTML:

```html
<iframe src="http://www.bravenet.com/poll?id=12345"
        width="300" height="200" frameborder="0"></iframe>
```

The iframe loaded a fully interactive page from the service's server. Your static page just provided the container. This was the "component model" before JavaScript frameworks existed.

**Why it matters for feedback:** An `<iframe>` pointing to a Worker-hosted page could contain the entire voting UI — buttons, current counts, thank-you state — all self-contained. The parent page (the blog post) has zero JavaScript involvement. The iframe is a portal to a different origin that handles everything.

```html
<iframe src="https://feedback-worker.example/widget/posts/my-post/"
        width="400" height="60" title="Rate this post"></iframe>
```

### Pattern 6: Mailto form action

**What it was:** In the earliest days of HTML forms, before most people had CGI access, there was a hack:

```html
<form action="mailto:webmaster@example.com" method="POST" enctype="text/plain">
```

Submitting the form would open the user's email client with the form data in the body. The "server" was the webmaster's inbox. This was documented in RFC 1738 (1994) and RFC 2368 (1998).

**Why it's charming but impractical:** It genuinely works. A feedback form could email you the vote. But it requires the user to have an email client configured, confirm the send, and actually click through. The friction is astronomical. It also exposes your email to scraping.

As a thought experiment: your email inbox as a feedback database, with each message subject line being a structured vote. You could even write a GitHub Action that reads a dedicated inbox and tallies the votes. This is a Rube Goldberg machine and I love it, but it's not a real solution.

### The comparison table

| 1998 pattern | How it worked | Modern equivalent | Needs JS? |
|---|---|---|---|
| Web ring CGI redirect | Click → CGI counts → 302 back | Cloudflare Worker → KV → 302 back | No |
| Hit counter `<img>` | `<img src="/cgi-bin/counter.pl">` → returns digit GIF | Worker returns SVG badge with count | No |
| `<input type="image">` | Image as form submit → sends to CGI | Form submits to Worker | No |
| ISMAP server-side image map | Click coordinates → CGI determines action | Worker parses coordinates → star rating | No |
| `<iframe>` widget | Bravenet poll in a frame | Worker-hosted mini voting UI in iframe | No (in parent) |
| Guestbook form POST | POST → CGI appends to flat file → redirect | POST → Worker → KV → redirect | No |
| `mailto:` form action | Form data sent as email | Still works, still terrible | No |

### The thesis

**A Cloudflare Worker is a CGI script.** It runs on someone else's server. It handles one HTTP request, does a small computation, reads/writes a small data store, and returns a response. The only differences from 1998:

- It runs on a global edge network instead of a single machine
- The "flat file" is a KV store instead of `/var/www/data/counter.txt`
- The free tier is 100,000 requests/day instead of "whatever the sysadmin allows"
- You deploy via `wrangler publish` instead of FTPing a Perl script to `/cgi-bin/`

The web development patterns haven't changed. The infrastructure got better.

---

## Part 2: The two architectural approaches

### Approach A: GoatCounter page-view counting (zero new dependencies)

**Core idea:** Feedback links point to static thank-you pages generated by Eleventy. GoatCounter (already on the site) counts the page view. The URL path encodes the vote.

```
/feedback/up/posts/my-post-slug/     → GoatCounter sees a page view → that's a thumbs up
/feedback/down/posts/my-post-slug/   → GoatCounter sees a page view → that's a thumbs down
```

**Strengths:**
- Zero new dependencies — GoatCounter is already integrated
- Proven Eleventy pagination pattern (same as social card generation)
- Feedback data is immediately available in the existing analytics dashboard
- Fully static, fully cacheable

**Weaknesses:**
- Navigates the reader away from the post to a thank-you page
- Feedback data is mixed with analytics — noise from bots, accidental visits, etc.
- No way to display feedback counts on the post without a build-time API call
- No server-side rate limiting — relies on GoatCounter's session de-duplication
- Cannot distinguish between "reader gave feedback" and "bot crawled the page"

### Approach B: Cloudflare Worker redirect (modern CGI pattern)

**Core idea:** Feedback links point to a Cloudflare Worker endpoint. The Worker increments a counter in KV storage and returns a 302 redirect back to the original post. A dynamic SVG badge shows the count.

```
User clicks "👍"
  → GET https://feedback.allaboutken.workers.dev/up/posts/my-post/
  → Worker: KV increment, return 302 → https://www.allaboutken.com/posts/my-post/#thanks
  → CSS :target shows "Thanks!" on the original page
```

**Strengths:**
- No page navigation — redirect is near-instant, reader stays on the post
- Dedicated data store — feedback is separate from analytics noise
- Worker can enforce rate limiting (one vote per IP/session)
- Worker can filter bots server-side (User-Agent checks, header validation)
- Dynamic SVG badge can show live feedback counts with zero client-side JS
- The redirect-back-with-fragment pattern is elegant

**Weaknesses:**
- Adds a new dependency (Cloudflare Workers)
- Requires deploying and maintaining a small Worker script
- KV has eventual consistency (not an issue for a vote counter)
- Cloudflare free tier: 100k requests/day, 1k KV writes/day (more than enough for a personal blog)

### Head-to-head comparison

| Dimension | GoatCounter approach | Worker approach |
|---|---|---|
| User experience | Navigates to thank-you page | Instant redirect, stays on post |
| Bot resistance | GoatCounter JS filtering only | Worker-side bot checks + rate limiting |
| Data quality | Mixed with analytics noise | Dedicated, clean |
| Show counts on page? | Not without build-time API | Yes, via SVG `<img>` tag |
| Rate limiting | GoatCounter session de-dup | Worker enforces per-IP/session |
| New dependencies | None | Cloudflare account (free) |
| Deployment complexity | None (Eleventy pagination) | Deploy a ~50-line Worker script |
| Data durability | GoatCounter dashboard | Cloudflare KV (exportable) |
| Archaic web charm | Tracking pixel | Full CGI redirect pattern |

---

## Part 3: GDPR and privacy analysis

### Does this need a consent banner?

**No.** The analysis is the same regardless of which approach (GoatCounter or Worker) is chosen.

**GoatCounter's GDPR position** (from their own documentation at goatcounter.com/help/gdpr):
- No personally identifiable information is collected
- No cookies are used
- Session de-duplication uses a non-reversible hash (User-Agent + approximate location), not stored in a way that can identify individuals
- Since v2.4.0, GoatCounter no longer stores individual pageviews by default — only aggregate data
- GoatCounter argues this falls under "legitimate interest" (GDPR Article 6(1)(f)) — analogous to a store counting foot traffic
- The GDPR's recital 26 states that it "does not apply to anonymous information, namely information which does not relate to an identified or identifiable natural person"

**For the feedback feature specifically:**
- A visit to `/feedback/up/posts/my-post/` is recorded identically to a visit to `/posts/my-post/` — same mechanism, same (lack of) personal data
- A page view is not an "opinion" under GDPR because there's no way to attribute it to an identifiable person
- No additional data is collected beyond what GoatCounter already collects for every page view
- The Worker approach would collect even less — just an incrementing counter in KV, with no session data at all

**For the Cloudflare Worker approach:**
- The Worker would only increment a counter in KV — no IP addresses stored, no User-Agent logged, no cookies set
- If anything, this is *more* private than GoatCounter, since the Worker doesn't need any session concept at all
- Rate limiting could use a hash of the IP (stored only in memory for the request duration), never persisted

**Recommendation:** Add a line to the privacy page: "Feedback clicks are recorded as anonymous page view counts — no additional personal data is collected." This is for transparency, not legal obligation.

**Caveat from GoatCounter's own docs:** "The GDPR is fairly new, and lacks case law to clarify what exactly counts as identifiable personal data." They recommend consulting a lawyer for specific situations. For a personal blog with aggregate-only analytics and no cookies, the risk is minimal.

### Sources consulted
- GoatCounter GDPR documentation: goatcounter.com/help/gdpr
- GoatCounter privacy policy: goatcounter.com/privacy
- GoatCounter v2.4.0 release notes: github.com/arp242/goatcounter/releases/tag/v2.4.0
- The site's existing privacy page: `/src/site/privacy.njk`

---

## Part 4: The JavaScript compromise

### Is it hypocritical to rely on GoatCounter's JS for a "no-JavaScript" feature?

**No.** There are two distinct claims being made:

1. **"The feedback interaction requires no JavaScript"** — True. Clicking a link or submitting a form is pure HTML. The user's action is JS-free.
2. **"The feedback recording uses GoatCounter's existing JS"** — Also true. GoatCounter's script is already loaded on every page of the site. The feedback feature doesn't add any new JavaScript — it just allows a page view that GoatCounter was going to count anyway to carry meaning via its URL path.

This is the same posture as the rest of the site:
- The search page works without JS (the form degrades to a GET request)
- The CSS toggle is pure HTML (a checkbox)
- GoatCounter silently counts views if JS is available
- The site is fully functional without JS — analytics is an enhancement, not a dependency

**The feedback feature follows this pattern exactly.** The interaction is HTML. The recording is an existing analytics enhancement. If GoatCounter's JS doesn't load (ad blocker, JS disabled, network issue), the user's feedback experience is unchanged — they click, they land on a thank-you page — the only difference is the vote doesn't get counted. That's graceful degradation.

**With the Worker approach, this concern disappears entirely.** The Worker counts the redirect server-side — it doesn't depend on any client-side JS at all. The reader's browser just follows a 302 redirect, which is pure HTTP protocol. Even `curl` would register the vote.

---

## Part 5: Cleaning up bad data in GoatCounter

### What tools are available?

**Dashboard UI: Settings → Manage pageviews**

GoatCounter provides a "Manage pageviews" panel (renamed from "Delete pageviews" in v2.4.0) where you can:
- **Delete pageviews** for specific paths — e.g., wipe all hits to `/feedback/up/posts/some-post/`
- **Merge paths** — combine counts from one path into another (useful if URLs change)
- Filter by path pattern, so you can clean up all `/feedback/` paths at once

**What you cannot do:**
- No REST API endpoint for deletion (it's dashboard-only, or CLI for self-hosted instances)
- No surgical per-timestamp deletion (e.g., "remove only hits from Tuesday 3-4am") — it's path-level
- Exported CSV data can't be un-exported
- The GoatCounter API (`/api/v0/`) only supports reading data and sending pageviews, not deleting them

**For self-hosted GoatCounter:**
- The `goatcounter db` CLI command can edit and delete data
- Go functions `Site.DeleteAll()` and `Site.DeleteOlderThan()` are available programmatically
- Direct database access provides full control

**For the hosted service (which allaboutken.com uses):**
- Dashboard "Manage pageviews" is the only deletion tool
- GoatCounter's data export (`/api/v0/export`) lets you pull all data as CSV
- You own your data — you can always export and cancel

**Practical scenario for the feedback feature:**

If you spot a bot crawl spike in GoatCounter:
1. Go to Settings → Manage pageviews
2. Filter for `/feedback/` paths
3. Delete the affected paths
4. The counts reset, and clean data accumulates going forward

This is workable but coarse. The layered bot prevention (robots.txt, nofollow, GoatCounter's bot filtering) is the primary defense. Dashboard cleanup is the fallback.

**With the Worker approach:**
- You have full control over the KV data store
- Can write a simple script to zero out specific counters
- Can add logic to the Worker itself to detect and reject bot patterns in real-time
- Data cleanup is a `wrangler kv:key delete` command

### Sources consulted
- GoatCounter v2.4.0 release notes: github.com/arp242/goatcounter/releases/tag/v2.4.0
- GoatCounter API documentation: goatcounter.com/help/api
- GoatCounter CHANGELOG: github.com/arp242/goatcounter/blob/main/CHANGELOG.md

---

## Part 6: What we chose and why

*(To be filled in after implementation decisions are made. This section will form the core of the blog post.)*

### Decision log

| Question | Decision | Rationale |
|---|---|---|
| GoatCounter vs. Worker? | TBD | |
| Binary (thumbs) vs. stars? | TBD | |
| Show counts on posts? | TBD | |
| Auto-redirect back? | TBD | |
| ISMAP star rating? | TBD | |

### What we'd tell a 1998 web developer

*(For the blog post conclusion: the web development patterns haven't changed. The infrastructure got better. A Cloudflare Worker is a CGI script. An SVG badge is a hit counter. A 302 redirect is a web ring hop. The best ideas in web development are 30 years old.)*

---

## Appendix: Reference links

**Web history:**
- Webring history (Wikipedia): en.wikipedia.org/wiki/Webring
- Webring history (Tedium): tedium.co/2020/11/20/webring-history
- Visitor counters & 90s internet (WideAngle): wideangle.co/blog/visitor-counter-geocities-and-the-90s
- `<input type="image">` (MDN): developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/image
- Server-side image maps (InformIT): informit.com/articles/article.aspx?p=26145&seqNum=9

**Cloudflare Workers:**
- Pricing & free tier: developers.cloudflare.com/workers/platform/pricing
- KV limits: developers.cloudflare.com/kv/platform/limits
- Redirect examples: developers.cloudflare.com/workers/examples/redirect
- Making static sites dynamic (Cloudflare blog): blog.cloudflare.com/using-workers-to-make-static-sites-dynamic
- Hit counter with Workers + KV tutorial: linzichun.com/posts/web-counter-cloudflare-worker

**GoatCounter:**
- GDPR documentation: goatcounter.com/help/gdpr
- Privacy policy: goatcounter.com/privacy
- API documentation: goatcounter.com/help/api
- v2.4.0 release notes (Manage pageviews): github.com/arp242/goatcounter/releases/tag/v2.4.0
- GitHub repository: github.com/arp242/goatcounter
