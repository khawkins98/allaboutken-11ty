// This is the "Offline copy of pages" service worker
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
