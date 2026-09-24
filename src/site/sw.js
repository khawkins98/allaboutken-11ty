// Offline reading for pages already visited, with /offline/ as the fallback.
//
// Scope is deliberately narrow: same-origin page navigations only. Everything
// else (CSS, images, fonts, the HuggingFace model, analytics) goes straight to
// the network with no interception. The PWABuilder boilerplate this replaced
// cached every GET forever, cross-origin included, so the ~23 MB embedding
// model was stored twice (Transformers.js already caches it) and the cache
// never shrank.
//
// Bump VERSION to discard every cached page on the next visit.
const VERSION = "v2";
const CACHE = `kh-pages-${VERSION}`;
const OFFLINE_URL = "/offline/";
const MAX_PAGES = 50;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

// Drop every other cache this origin's worker ever made, including the old
// "pwabuilder-offline" one.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate" || new URL(request.url).origin !== self.location.origin) return;

  // Network first: a reader online always gets the current page. The cached
  // copy is only for when the network fails.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy).then(() => trim(cache))));
        }
        return response;
      })
      .catch(() =>
        caches.open(CACHE).then((cache) =>
          cache.match(request).then((hit) => hit || cache.match(OFFLINE_URL))
        )
      )
  );
});

// Keep the most recent MAX_PAGES pages plus the offline page. Cache keys come
// back in insertion order, so the oldest are first.
function trim(cache) {
  return cache.keys().then((keys) => {
    const pages = keys.filter((k) => new URL(k.url).pathname !== OFFLINE_URL);
    return Promise.all(pages.slice(0, Math.max(0, pages.length - MAX_PAGES)).map((k) => cache.delete(k)));
  });
}
