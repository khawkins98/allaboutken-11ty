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

Decisions made 2026-02-19. This section forms the core of the blog post.

### Decision log

| Question | Decision | Rationale |
|---|---|---|
| GoatCounter vs. Worker? | **Worker** | Dedicated data store (not mixed with analytics noise), server-side bot filtering + rate limiting, no page navigation (302 redirect back), SVG badge for counts — all impossible with GoatCounter alone |
| Binary (thumbs) vs. stars? | **Binary first** | Lower friction, simpler to implement and interpret. Stars can be added later via ISMAP if binary signal feels insufficient |
| Show counts on posts? | **Yes, via SVG badge** | `<img src="https://feedback.allaboutken.com/count/posts/slug.svg">` — the 1996 hit counter pattern reborn. 5-minute cache, CORS restricted to site origin |
| Auto-redirect back? | **Yes, via 302 + `#thanks` fragment** | Worker returns `302 Location: https://www.allaboutken.com/posts/slug/#thanks`. CSS `:target` reveals the thank-you message. Reader never truly leaves the page |
| ISMAP star rating? | **Deferred to v2** | Delightfully archaic and genuinely functional, but binary is sufficient for launch. ISMAP + Worker coordinate parsing is a natural v2 addition |

### What we'd tell a 1998 web developer

The web development patterns haven't changed. The infrastructure got better. A Cloudflare Worker is a CGI script — it runs on someone else's server, handles one HTTP request, reads/writes a small data store, and returns a response. An SVG badge is a hit counter. A 302 redirect is a web ring hop. The best ideas in web development are 30 years old.

---

## Part 7: Existing solutions — who's already done this?

### vberlier/poll — The exact redirect-count-redirect pattern

**This is the closest existing project to what we're building.** It's an MIT-licensed Cloudflare Worker written in Rust that implements the redirect-count-redirect pattern. No client-side JavaScript required.

- **GitHub:** github.com/vberlier/poll
- **Live instance:** poll.fizzy.wtf

**How it works:**
1. You put a plain `<a>` link on your page: `<a href="https://poll.fizzy.wtf/vote?scope.poll_name=option">`
2. User clicks → Worker increments counter in KV → returns redirect (uses `history.back()` by default, or 302 to explicit `?redirect=URL`)
3. SVG result widgets available as `<img>` tags: `<img src="https://poll.fizzy.wtf/show?scope.poll=option">`
4. Vote deduplication via cookies

**Endpoints:**
- `/vote?scope.poll=option` — Cast a vote
- `/vote?scope.poll=option&redirect=URL` — Cast with explicit redirect target
- `/show?scope.poll=option` — SVG bar chart widget
- `/count?scope.poll=option` — Vote count for specific option

**Why it matters:** This proves the pattern works. We could either use this directly, fork it, or build our own Worker inspired by it. The SVG widget endpoint is particularly relevant — it's the hit counter pattern reborn.

### Andrew Walpole's like button — Eleventy + CF Workers + KV (with client-side JS)

**The closest real-world precedent for what we're building.** Andrew Walpole built a "like" button for his Eleventy blog using Cloudflare Workers and KV storage. He wrote two blog posts about it:

- **"Building a Like Button with Cloudflare Workers"** — andrewwalpole.com/blog/building-a-like-button-with-cloudflare-workers/
- **"Audit Content Reads with Cloudflare KV"** — andrewwalpole.com/blog/audit-content-reads-with-cloudflare-kv/

**His architecture:**
- Cloudflare Worker with KV namespace for storing like counts
- Client-side JavaScript (petite-vue) renders the like button and handles click events
- Fetch API calls to the Worker endpoint (not a redirect)
- The Worker returns JSON; the UI updates the count in-place

**What this proves:** The Eleventy + Cloudflare Workers + KV infrastructure works. Walpole deployed it, ran it in production, and wrote about the experience. The plumbing is proven.

**Where it diverges from our approach:**
- Walpole's interaction **requires JavaScript** — the button is rendered by petite-vue and communicates via `fetch()` API calls
- No redirect pattern — it's a modern SPA-style API call
- No SVG badge — counts are rendered client-side
- No fallback for JS-disabled browsers

**The gap this reveals:** Nobody has combined the *infrastructure* Walpole proved (Eleventy + CF Workers + KV) with the *interaction pattern* vberlier/poll proved (redirect-count-redirect, no client JS). That's the novel combination we're building.

### The gap analysis — what doesn't exist yet

| Component | Proven by | Uses client JS? |
|---|---|---|
| Eleventy + CF Workers + KV | Andrew Walpole | Yes (petite-vue + fetch) |
| Redirect-count-redirect pattern | vberlier/poll | No |
| SVG badge for showing counts | vberlier/poll | No |
| **All three combined for Eleventy** | **Nobody** | **No** |

**Blog post angle:** "Walpole proved the infrastructure works. vberlier/poll proved the no-JS pattern works. Nobody has combined them. We did — and the result is a feedback system for a static Eleventy site that works without a single line of client-side JavaScript, using a web architecture pattern from 1994."

### Other tools evaluated

| Project | Type | No-JS? | Open Source? | Notes |
|---|---|---|---|---|
| **vberlier/poll** | CF Worker | **Yes** | Yes (MIT) | Exact redirect pattern, SVG widgets |
| **Applause Button** | Self-hosted | No (JS widget) | Yes | Medium-style clap; hosted service defunct, self-host only |
| **Lyket** | SaaS | No (JS widget) | Client only | Free tier: 500 pageviews/mo — too low |
| **Giscus** | GitHub Discussions | No (JS widget) | Yes | Requires GitHub account for readers |
| **Rockee** | SaaS | No (JS widget) | No | Lightweight but commercial |
| **FeedbackFin** | Webhook | No (JS widget) | Yes | Text feedback form, not reaction buttons |
| **CounterAPI.dev** | API | Needs JS | Partial | Free counter API — no redirect, no SVG |
| **Webmention.io** | IndieWeb | Varies | Yes | Already on the site; captures remote reactions, not on-page |

**Key finding:** No Eleventy-specific feedback plugin exists. Every existing tool either requires client-side JavaScript or is the vberlier/poll project. The redirect-count-redirect pattern appears to be genuinely uncommon — which is what makes it interesting for a blog post.

**Blog post angle:** "We looked for an existing solution and found exactly one project (vberlier/poll) that uses the 1994 web ring redirect pattern for feedback. Maybe there should be more. Maybe we can make one that other Eleventy sites can use."

---

## Part 8: Cloudflare Worker implementation plan

### What we need

The site already runs through Cloudflare (DNS). The free plan includes Workers + KV with no credit card required.

**Free tier limits (relevant to a feedback counter):**

| Resource | Limit |
|---|---|
| Worker requests | 100,000/day |
| CPU time | 10ms per invocation |
| KV reads | 100,000/day |
| KV writes | 1,000/day |
| KV storage | 1 GB total |

The 1,000 KV writes/day is the binding constraint — that's 1,000 feedback clicks per day. More than enough for a personal blog.

### Setup steps

1. **Install Wrangler CLI:** `npm create cloudflare@latest -- feedback-worker`
2. **Authenticate:** `npx wrangler login` (opens browser for OAuth)
3. **Create KV namespace:** `npx wrangler kv namespace create FEEDBACK_COUNTS`
4. **Configure `wrangler.toml`** with the KV binding and custom domain
5. **Deploy:** `npx wrangler deploy`
6. **Custom domain:** `feedback.allaboutken.com` — Cloudflare auto-provisions DNS + TLS

### Configuration file

```toml
name = "feedback-worker"
main = "src/index.js"
compatibility_date = "2025-01-01"

# Custom domain (Cloudflare handles DNS + TLS automatically)
[[routes]]
pattern = "feedback.allaboutken.com"
custom_domain = true

# KV namespace for storing counts
[[kv_namespaces]]
binding = "FEEDBACK_COUNTS"
id = "<created-by-wrangler-kv-namespace-create>"
```

### Worker code sketch

The Worker is ~50 lines:

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // /up/posts/my-post-slug/ → increment, redirect back
    if (pathname.startsWith('/up/') || pathname.startsWith('/down/')) {
      const type = pathname.startsWith('/up/') ? 'up' : 'down';
      const postPath = pathname.replace(/^\/(up|down)\//, '').replace(/\/$/, '');
      const key = `count:${type}:${postPath}`;

      const current = await env.FEEDBACK_COUNTS.get(key);
      const newCount = (parseInt(current, 10) || 0) + 1;

      // Write in background so redirect returns instantly
      ctx.waitUntil(env.FEEDBACK_COUNTS.put(key, newCount.toString()));

      const destination = `https://www.allaboutken.com/${postPath}/#thanks`;
      return Response.redirect(destination, 302);
    }

    // /count/posts/my-post-slug.svg → return SVG badge
    if (pathname.startsWith('/count/') && pathname.endsWith('.svg')) {
      const postPath = pathname.replace(/^\/count\//, '').replace(/\.svg$/, '');
      const upKey = `count:up:${postPath}`;
      const count = parseInt(await env.FEEDBACK_COUNTS.get(upKey), 10) || 0;

      return new Response(generateBadgeSvg(count), {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': 'https://www.allaboutken.com',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
```

### Rate limiting

Two options:

**Option A: Workers Rate Limiting binding (GA since Sept 2025)**

```toml
[[ratelimits]]
name = "UPVOTE_LIMITER"
namespace_id = "1001"
  [ratelimits.simple]
  limit = 10
  period = 60
```

**Option B: KV-based TTL approach (free tier safe)**

Store `ratelimit:{ip-hash}` keys with `expirationTtl: 60` — one extra read/write per request but stays within free limits.

### Secrets and keys

The basic counter Worker needs **zero secrets**. KV namespace IDs in `wrangler.toml` are not sensitive. If an admin endpoint is added later, protect it with:

```bash
npx wrangler secret put ADMIN_TOKEN
```

For local dev, use a `.dev.vars` file (gitignored).

### CI/CD via GitHub Actions

```yaml
name: Deploy Feedback Worker
on:
  push:
    branches: [main]
    paths: ['worker/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: 'worker'
```

Needs two GitHub secrets: `CLOUDFLARE_API_TOKEN` (create via Cloudflare dashboard → API Tokens → "Edit Cloudflare Workers" template) and `CLOUDFLARE_ACCOUNT_ID`.

### Local testing

```bash
npx wrangler dev
# Worker runs at http://localhost:8787
# KV is simulated locally in .wrangler/state/

curl -v http://localhost:8787/up/posts/my-post-slug/   # Should 302 redirect
curl http://localhost:8787/count/posts/my-post-slug.svg  # Should return SVG
```

---

## Part 9: Related posts on the site

These existing posts thematically connect to the feedback feature and could be cross-linked in the blog post:

### Directly relevant (web standards, no-JS, retro patterns)

| Post | Theme connection |
|---|---|
| **Exposing HTML: The No-JS nudist CSS toggle** (`/posts/20250906-css-naked-css-only/`) | "No JavaScript. No build trickery. Just a checkbox in the footer and modern CSS." Same philosophy as the feedback feature. |
| **URLs are the state management you should use** (`/posts/20251226-url-state-management/`) | The feedback feature literally uses URLs as state — `/feedback/up/post-slug/` IS the vote. The `#thanks` fragment IS the UI state. |
| **Your browser utility wants to be a floating palette** (`/posts/20260216-90s-desktop-paradigm-browser-utilities/`) | Late-90s desktop UI patterns applied to modern web design. Same "old patterns, new infrastructure" thesis. |
| **Output: An HTML-native tag once again saves JS befuddling** (`/posts/20251013-html-output-tag/`) | Discovering that HTML has native capabilities that make JS unnecessary. Same discovery process. |
| **Publishing since the 2000s** (`/posts/20200208-its-been-20-years/`) | Historical perspective on web evolution. The feedback post extends this thread. |

### Analytics and measurement

| Post | Theme connection |
|---|---|
| **How to measure impact when analytics lie** (`/posts/20260115-how-to-measure-impact-when-analytics-lie/`) | Privacy-by-design measurement. The feedback feature is another take on meaningful, privacy-respecting signals. |
| **Measuring success beyond the page view** (`/posts/20251203-measuring-success-beyond-page-view/`) | Explicitly discusses "Was this page helpful?" feedback. The feedback feature implements exactly this idea. |
| **Sacrificing knowledge in the name of data** (`/posts/20250912-knowledge-over-data/`) | Data vs. knowledge — the feedback feature provides directional knowledge, not scientific data. |

### Static sites and simplicity

| Post | Theme connection |
|---|---|
| **A simpler, faster site: moving to pure Eleventy v3** (`/posts/20250831-site-overhaul-eleventy-v3/`) | Removed 7,183 lines while improving the site. The feedback feature follows this "do more with less" ethos. |
| **Creating warm, dappled light with CSS and SVG** (`/posts/20251108-sunlit-dappled-light-effect/`) | Pure CSS and SVG, no JavaScript. Shows what's possible without JS. |
| **Predictable, token-based filenames with Eleventy Image** (`/posts/20250907-deterministic-image-filenames/`) | Thoughtful technical choices in the Eleventy build pipeline. |

### Indie web and privacy

| Post | Theme connection |
|---|---|
| **Individualism is the flavor AI chatbots can't stomach** (`/posts/20250914-ai-and-the-commoditization-of-reference/`) | The "small shop" beating the "big box" through craft and individuality. Building your own feedback system vs. using a SaaS widget. |

### Blog post cross-linking strategy

The blog post could open with a callback to "URLs are the state management you should use" — because the feedback feature is literally URL-as-state. It could reference the CSS toggle post as prior art for "no-JS interactivity." And it could close with the measurement posts, framing the feedback feature as a practical implementation of "measuring success beyond the page view."

---

## Appendix A: Primary sources and specifications

### RFCs and W3C specs

| Pattern | Spec | Date | Link |
|---|---|---|---|
| HTML 2.0 (forms, `INPUT IMAGE`, `ISMAP`) | RFC 1866 | Nov 1995 | rfc-editor.org/rfc/rfc1866 |
| HTML 3.2 (`ISMAP`, client-side maps) | W3C REC-html32 | Jan 1997 | w3.org/TR/REC-html32 |
| HTML 4.0 (`NOSCRIPT`, scripts) | W3C HTML 4.01 | Dec 1997 | w3.org/TR/html401/interact/scripts.html |
| CGI 1.1 | RFC 3875 | Oct 2004 | datatracker.ietf.org/doc/html/rfc3875 |
| `mailto:` (original) | RFC 1738 | Dec 1994 | ietf.org/rfc/rfc1738.txt |
| `mailto:` (expanded) | RFC 2368 | Jul 1998 | datatracker.ietf.org/doc/html/rfc2368 |
| `mailto:` (current) | RFC 6068 | Oct 2010 | datatracker.ietf.org/doc/html/rfc6068 |
| File upload in forms | RFC 1867 | Nov 1995 | ietf.org/rfc/rfc1867.txt |
| `meta refresh` | Not in any RFC; Netscape proprietary (~1995), now in WHATWG HTML Living Standard | — | html.spec.whatwg.org |

### MDN modern references

- `<input type="image">`: developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/image
- `<noscript>`: developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/noscript
- `HTMLImageElement.isMap`: developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/isMap
- `<meta http-equiv="refresh">`: developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/http-equiv

### Historical retrospectives

**Web rings:**
- Tedium: "Webring History: Social Media Before Social Media" — tedium.co/2020/11/20/webring-history
- Wikipedia: Webring — en.wikipedia.org/wiki/Webring
- WebRing History (official): webring.com/webring-history

**Hit counters:**
- Priceonomics: "Hit Counters: The Analytics Tool of the Early Web" — priceonomics.com/hit-counters-the-analytics-tool-of-the-early-web
- Wide Angle: "Visitor Counters, Blinking Tags, GeoCities" — wideangle.co/blog/visitor-counter-geocities-and-the-90s
- Matt's Script Archive: scriptarchive.com (the original source of 1990s counter scripts)

**CGI scripts:**
- Rick Carlino: "What Were CGI Scripts?" — rickcarlino.com/2019/what-were-cgi-scripts.html
- Cybercultural: "1993: CGI Scripts and Early Server-Side Web Programming" — cybercultural.com/p/1993-cgi-scripts-and-early-server-side-web-programming
- Matt's Script Archive (est. 1995): scriptarchive.com
- NMS ("Not Matt's Scripts") rewrite: nms-cgi.sourceforge.net

**Server-side image maps:**
- Rick Carlino: "What Were Server-Side Image Maps?" — rickcarlino.com/2021/what-were-server-side-image-maps.html
- NCSA Imagemap Tutorial (University of Oviedo mirror): www6.uniovi.es/~antonio/ncsa_httpd/tutorials/imagemapping.html
- NCSA Imagemap Tutorial (University of Genoa mirror): www.diam.unige.it/informatica/documentazione/httpd_docs/docs/tutorials/imagemapping.html

**Tracking pixels / web bugs:**
- Richard M. Smith: "The Web Bug FAQ" (1999, hosted by EFF): w2.eff.org/Privacy/Marketing/web_bug.html
- Wikipedia: Web beacon — en.wikipedia.org/wiki/Web_beacon

**Guestbooks:**
- Matt's Script Archive: Guestbook — scriptarchive.com/guestbook.html
- O'Reilly: "Running a CGI Guestbook" — oreilly.com/library/view/perl-for-web/1565926471/ch12.html
- Veronica Explains: "Guestbooks: The Cozy 90s Web Fad" (video) — tilvids.com/w/7pTHGVbQkfPSQKHQufcYi7

**GeoCities / Bravenet:**
- Wikipedia: GeoCities — en.wikipedia.org/wiki/GeoCities
- Cybercultural: "GeoCities in 1995" — cybercultural.com/p/geocities-1995
- Bravenet (still operational): bravenet.com
- Cameron's World (GeoCities collage): cameronsworld.net
- Internet Archive: GeoCities Special Collection: archive.org/web/geocities.php
- localghost.dev: "Building a website like it's 1999... in 2022": localghost.dev/blog/building-a-website-like-it-s-1999-in-2022

**`<form method="GET">` pre-JavaScript:**
- Jukka Korpela: "Methods GET and POST in HTML forms" — jkorpela.fi/forms/methods.html

**`mailto:` form action in browsers:**
- Mozilla Bug #61893 (documenting the GeoCities/Tripod era): bugzilla.mozilla.org/show_bug.cgi?id=61893

### Cloudflare Workers documentation

- Workers pricing & free tier: developers.cloudflare.com/workers/platform/pricing
- Workers KV limits: developers.cloudflare.com/kv/platform/limits
- Workers KV getting started: developers.cloudflare.com/kv/get-started
- Workers redirect examples: developers.cloudflare.com/workers/examples/redirect
- Workers custom domains: developers.cloudflare.com/workers/configuration/routing/custom-domains
- Workers secrets: developers.cloudflare.com/workers/configuration/secrets
- Workers rate limiting (GA Sept 2025): developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit
- Workers GitHub Actions: developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions
- Wrangler action on GitHub Marketplace: github.com/marketplace/actions/deploy-to-cloudflare-workers-with-wrangler
- Using Workers to make static sites dynamic (Cloudflare blog): blog.cloudflare.com/using-workers-to-make-static-sites-dynamic
- Hit counter with Workers + KV tutorial: linzichun.com/posts/web-counter-cloudflare-worker

### GoatCounter documentation

- GDPR documentation: goatcounter.com/help/gdpr
- Privacy policy: goatcounter.com/privacy
- API documentation: goatcounter.com/help/api
- v2.4.0 release notes (Manage pageviews): github.com/arp242/goatcounter/releases/tag/v2.4.0
- GitHub repository: github.com/arp242/goatcounter

### Eleventy + Cloudflare Workers precedents

- Andrew Walpole: "Building a Like Button with Cloudflare Workers": andrewwalpole.com/blog/building-a-like-button-with-cloudflare-workers/
- Andrew Walpole: "Audit Content Reads with Cloudflare KV": andrewwalpole.com/blog/audit-content-reads-with-cloudflare-kv/
- Jon Kuperman: dynamic-static-11ty (Eleventy + Workers example): github.com/jkup/dynamic-static-11ty
- Dmytro Kozin: "How to Create a Full Stack Website Using Cloudflare Workers and 11ty" (Medium): medium.com/@nicku5765

### Existing feedback tools

- vberlier/poll (CF Worker, MIT, exact redirect pattern): github.com/vberlier/poll
- Applause Button (self-hosted clap button): applause-button.com / github.com/ColinEberhardt/applause-button
- Lyket (SaaS reaction buttons): lyket.dev
- Giscus (GitHub Discussions comments): giscus.app
- FeedbackFin (open-source webhook widget): feedbackfin.com
- sound-buttons/worker-click-counter (CF Worker counter): github.com/sound-buttons/worker-click-counter
- Webmention.io (IndieWeb reactions): webmention.io
- CounterAPI.dev (free counter API): counterapi.dev
