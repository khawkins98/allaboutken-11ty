# Offline and service worker behavior

Source files:

- `src/site/sw.js` — service worker lifecycle, fetch handling, and cache updates
- `src/site/scripts.js` — client-side service worker registration
- `eleventy.js` — passthrough copy for `src/site/**/*.js` so `sw.js` is available at `/sw.js`

## Architecture summary

The site uses a single service worker (`/sw.js`) registered from `src/site/scripts.js` with:

- `scope: '/'`
- unconditional registration attempt when `navigator.serviceWorker` exists

The worker uses one Cache Storage bucket:

- Cache name: `pwabuilder-offline`
- Install pre-cache target: `index.html`

## Runtime behavior

`src/site/sw.js` implements a network-first strategy for all `GET` requests:

1. It tries `fetch(event.request)`.
2. On success, it stores a cloned response in `pwabuilder-offline` via `cache.put(request, response.clone())`.
3. On network failure, it tries to satisfy the request from the cache (`cache.match(request)`).
4. If there is no cache hit, it rejects with `no-match` (there is no custom offline error page response today).

Worker lifecycle behavior:

- `install`: opens `pwabuilder-offline`, caches `index.html`, and calls `self.skipWaiting()`
- `activate`: calls `self.clients.claim()` so the new worker controls pages without waiting for a full tab restart

## Current limitations

- The fallback constant is `index.html`, but fallback behavior is effectively "cached request only." If a request was never cached and the network is unavailable, it fails.
- There is no route-specific offline shell and no custom offline page response in `fromCache`.
- The cache is unversioned (`pwabuilder-offline`), so stale assets can persist until replaced by successful network responses.
- Only successful `GET` responses are cached; non-GET traffic is ignored.

## Safe update workflow

When changing offline behavior:

1. Update `src/site/sw.js` (and `src/site/scripts.js` if registration/scope changes).
2. Run `yarn build` so generated output reflects current worker and asset references.
3. Hard refresh once after deploy to ensure clients pick up the newest worker quickly.
4. If cache schema/keys change, bump the cache name in `sw.js` and handle cleanup in `activate` before rollout.

## Related docs

- [`ELEVENTY_CONFIG.md`](ELEVENTY_CONFIG.md) for passthrough copy details that expose `sw.js` at the site root
- [`DEVELOPMENT_SETUP.md`](DEVELOPMENT_SETUP.md) for local workflow and troubleshooting context
