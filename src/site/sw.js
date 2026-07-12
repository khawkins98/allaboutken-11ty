/**
 * Service Worker: Offline copy of pages
 *
 * Implements a "Network falling back to cache" strategy for offline support.
 *
 * Strategy details:
 * 1. During install, the root page (offline fallback) is pre-cached.
 * 2. On fetch (GET requests only), the service worker tries the network first.
 * 3. If the network request succeeds, the response is copied to the cache (caching pages as the user visits them).
 * 4. If the network request fails (e.g., user is offline), the service worker serves the requested resource from the cache.
 */
const CACHE = 'pwabuilder-offline';

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "index.html";
const offlineFallbackPage = 'index.html';

// Install stage sets up the index page (home page) in the cache and opens a new cache
self.addEventListener('install', function (event) {
  console.log('[PWA Builder] Install Event processing');

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log('[PWA Builder] Cached offline page during install');
      return cache.add(offlineFallbackPage);
    }),
  );
  // Activate the new service worker as soon as it's finished installing
  self.skipWaiting();
});

// Ensure the newly activated service worker takes control of the page ASAP
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        console.log('[PWA Builder] add page to offline cache: ' + response.url);

        // If request was success, add or update it in the cache
        event.waitUntil(updateCache(event.request, response.clone()));

        return response;
      })
      .catch(function (error) {
        console.log('[PWA Builder] Network request Failed. Serving content from cache: ' + error);
        return fromCache(event.request);
      }),
  );
});

/**
 * Retrieves a requested resource from the offline cache.
 *
 * Checks the defined offline cache for a match to the incoming request.
 * If the resource is not found or has a 404 status, it returns a rejected promise,
 * allowing the fetch event to gracefully handle the missing resource.
 *
 * @param {Request} request - The HTTP request to look up in the cache.
 * @returns {Promise<Response>} A promise that resolves to the cached Response, or rejects if no match is found.
 */
function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return error page
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject('no-match');
      }

      return matching;
    });
  });
}

/**
 * Updates the offline cache with a successful network response.
 *
 * This function caches pages and assets dynamically as the user navigates the site,
 * ensuring they are available for future offline access.
 *
 * @param {Request} request - The HTTP request used as the cache key.
 * @param {Response} response - The successful HTTP response to store in the cache.
 * @returns {Promise<void>} A promise that resolves when the cache is successfully updated.
 */
function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}
