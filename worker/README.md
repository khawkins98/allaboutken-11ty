# Feedback Worker

A Cloudflare Worker that powers the "Was this useful?" button on [allaboutken.com](https://www.allaboutken.com). No client-side JavaScript — the interaction is pure HTML links and HTTP redirects.

**Full writeup:** [No-JS feedback buttons for static sites, using a 1994 web pattern](https://www.allaboutken.com/posts/20260220-feedback-buttons-cgi-pattern/)

## How it works

1. Reader clicks the feedback button (a plain `<a>` link)
2. Worker increments a counter in KV storage
3. Worker returns a `302` redirect back to the post with `#thanks` in the URL
4. CSS `:target` reveals a "Thanks!" message — no page navigation

## Routes

| Route | Response |
|---|---|
| `/up/{path}/` | Increment count, 302 redirect back |
| `/count/{path}.svg` | SVG number (5-min cache). `?color=white` for dark backgrounds |
| `/count/{path}/` | Plain text count (5-min cache) |

## Files

- `src/index.js` — Worker source (~80 lines)
- `wrangler.toml` — Cloudflare config (KV binding, custom domain)
- `package.json` — Only dependency is Wrangler

## Quick start

```bash
npm install
npx wrangler login
npx wrangler dev        # local dev server
npx wrangler deploy     # deploy to Cloudflare
```

## Adapting for your own site

See the [setup tutorial](https://www.allaboutken.com/posts/20260220-feedback-buttons-cgi-pattern/#setting-this-up-on-your-own-site) in the blog post, or check the comments in `wrangler.toml` for the three values you need to change.

## Credits

Inspired by two projects that proved different halves of the solution:

- **[poll.fizzy.wtf](https://poll.fizzy.wtf)** ([source](https://github.com/vberlier/poll)) — MIT-licensed Cloudflare Worker that implements the redirect-count-redirect pattern with SVG result widgets. Proved the architecture works for voting without client-side JavaScript.
- **[Andrew Walpole](https://andrewwalpole.com/blog/building-a-like-button-with-cloudflare-workers/)** — Built a like button for his Eleventy blog using Cloudflare Workers and KV storage. Proved the Eleventy + Workers + KV infrastructure works in production.
