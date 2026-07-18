/**
 * Feedback Worker — redirect-count-redirect pattern
 *
 * A no-JavaScript feedback system for static sites. Readers click a plain
 * HTML link, the Worker increments a counter in KV storage, and a 302
 * redirect sends them back to the original page with a #thanks fragment
 * that triggers a CSS :target reveal. The pattern is identical to how
 * 1994 web rings counted click-throughs.
 *
 * Blog post & setup guide:
 *   https://www.allaboutken.com/posts/20260220-feedback-buttons-cgi-pattern/
 *
 * Routes:
 *   /up/{path}/        — increment thumbs-up, 302 redirect back to post
 *   /down/{path}/      — increment thumbs-down, 302 redirect back to post
 *   /count/{path}.svg  — SVG number (image/svg+xml, 5-min cache)
 *                        ?color=white for light text; defaults to black.
 *                        Use in <img> tags. Not CSS-styleable from the page.
 *   /count/{path}/     — plain text number (text/plain, 5-min cache)
 *                        Use for build-time fetches, JS enhancements, or scripts.
 *   everything else    — 404
 *
 * Both /count endpoints return the thumbs-up count only.
 * CORS is restricted to SITE_ORIGIN and DEV_ORIGINS.
 *
 * Defenses:
 *   - Bot filtering via User-Agent and Accept-Language header checks
 *   - Referer origin validation (spoofable, but filters casual misuse)
 *   - Rate limiting: one vote per IP+path per 24h via KV TTL keys
 *
 * Inspired by:
 *   - poll.fizzy.wtf (github.com/vberlier/poll) — MIT-licensed CF Worker
 *     that proved the redirect-count-redirect pattern for voting
 *   - Andrew Walpole's Eleventy + CF Workers + KV like button
 *     (andrewwalpole.com/blog/building-a-like-button-with-cloudflare-workers/)
 *
 * @author Ken Hawkins <khawkins98@gmail.com>
 * @license Apache-2.0
 */

const SITE_ORIGIN = 'https://www.allaboutken.com';

// Local dev origins — Referer check allows these in addition to SITE_ORIGIN.
// Remove or empty this array in production if you prefer stricter validation.
const DEV_ORIGINS = ['http://localhost', 'http://127.0.0.1', 'http://192.168.'];

const BOT_UA_PATTERNS = ['bot', 'crawl', 'spider', 'slurp', 'wget', 'curl', 'python-requests', 'go-http-client', 'java/', 'libwww', 'httpunit', 'nutch', 'phpcrawl', 'msnbot', 'adidxbot', 'blekkobot', 'teoma', 'ia_archiver', 'gigablast', 'yandex', 'twiceler', 'mediapartners-google', 'adsbot-google', 'googlebot', 'bingbot', 'ahrefsbot', 'semrushbot', 'dotbot', 'petalbot', 'bytespider', 'gptbot', 'claudebot'];

/**
 * Return the request's Origin if it's on the allow list, otherwise SITE_ORIGIN.
 * Browsers send the Origin header on fetch() / CORS requests.
 */
function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = [SITE_ORIGIN, ...DEV_ORIGINS];
  if (allowed.some((o) => origin.startsWith(o))) return origin;
  return SITE_ORIGIN;
}

function isBot(request) {
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();
  if (!ua) return true;
  if (BOT_UA_PATTERNS.some((p) => ua.includes(p))) return true;
  if (!request.headers.get('Accept-Language')) return true;
  return false;
}

async function hashKey(ip, path) {
  const data = new TextEncoder().encode(`${ip}:${path}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateBadgeSvg(count, color) {
  const value = String(count);
  const fill = color === 'white' ? '#fff' : '#000';
  const width = value.length * 8 + 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20">
  <text x="${width / 2}" y="15" text-anchor="middle" fill="${fill}" font-family="Verdana,Geneva,sans-serif" font-size="13" text-rendering="geometricPrecision">${value}</text>
</svg>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // --- Vote routes: /up/{path}/ and /down/{path}/ ---
    const voteMatch = pathname.match(/^\/(up|down)\/(.+)/);
    if (voteMatch) {
      const type = voteMatch[1];
      const postPath = voteMatch[2].replace(/\/$/, '');

      if (isBot(request)) {
        return new Response('Not found', { status: 404 });
      }

      // Origin check: only count votes referred from our own site.
      // Referer is spoofable, so this is a mild defense — not airtight.
      // Cloudflare's built-in bot protection adds another layer.
      const referer = request.headers.get('Referer') || '';
      const allowedOrigins = [SITE_ORIGIN, ...DEV_ORIGINS];
      if (!allowedOrigins.some((origin) => referer.startsWith(origin))) {
        return new Response('Not found', { status: 404 });
      }

      // Rate limit: one vote per IP+path per 24 hours
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rlKey = `rl:${await hashKey(ip, `${type}:${postPath}`)}`;
      const existing = await env.FEEDBACK_COUNTS.get(rlKey);
      if (existing) {
        // Already voted — still redirect, just don't count again
        return Response.redirect(`${SITE_ORIGIN}/${postPath}/#thanks`, 302);
      }

      // Increment the counter
      const countKey = `count:${type}:${postPath}`;
      const current = parseInt(await env.FEEDBACK_COUNTS.get(countKey), 10) || 0;
      ctx.waitUntil(Promise.all([env.FEEDBACK_COUNTS.put(countKey, String(current + 1)), env.FEEDBACK_COUNTS.put(rlKey, '1', { expirationTtl: 86400 })]));

      return Response.redirect(`${SITE_ORIGIN}/${postPath}/#thanks`, 302);
    }

    // --- Count routes: /count/{path}.svg (badge) or /count/{path} (plain text) ---
    if (pathname.startsWith('/count/')) {
      const isSvg = pathname.endsWith('.svg');
      const postPath = (isSvg ? pathname.slice('/count/'.length, -'.svg'.length) : pathname.slice('/count/'.length)).replace(/\/$/, '');
      const count = parseInt(await env.FEEDBACK_COUNTS.get(`count:up:${postPath}`), 10) || 0;
      const corsOrigin = getAllowedOrigin(request);

      if (isSvg) {
        const color = url.searchParams.get('color') || 'black';
        return new Response(generateBadgeSvg(count, color), {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=2',
            'Access-Control-Allow-Origin': corsOrigin,
          },
        });
      }

      // Plain text count — useful for build-time fetches or JS enhancements
      return new Response(String(count), {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=2',
          'Access-Control-Allow-Origin': corsOrigin,
        },
      });
    }

    // --- Everything else ---
    return new Response('Not found', { status: 404 });
  },
};
