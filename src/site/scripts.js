/**
 * Service Worker Registration Script
 *
 * This script is responsible for registering the "Offline copy of pages" service worker.
 * By setting the scope to '/', the service worker controls the entire domain, allowing it
 * to intercept and cache all network requests for offline fallback functionality.
 *
 * This script should be loaded on all pages where offline capabilities are desired.
 */
if ('serviceWorker' in navigator) {
  // Always attempt to register; the browser will update existing registrations as needed
  navigator.serviceWorker
    .register('/sw.js', {
      scope: '/',
    })
    .then(function (reg) {
      console.log('[PWA Builder] Service worker has been registered for scope: ' + reg.scope);
    })
    .catch(function (err) {
      console.error('[PWA Builder] Service worker registration failed:', err);
    });
}
