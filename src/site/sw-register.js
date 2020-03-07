//This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

if ('serviceWorker' in navigator) {
  // Do a one-off check to see if a service worker's in control.
  if (navigator.serviceWorker.controller) {
    // console.log('This page is currently controlled by:',
      // navigator.serviceWorker.controller);
  } else {
    // console.log('This page is not currently controlled ' +
      // 'by a service worker.');
    // Register the ServiceWorker
    navigator.serviceWorker.register('/sw.js', {
      scope: './'
    }).then(function(reg) {
      // console.log('Service worker has been registered for scope:'+ reg.scope);
    });
  }
} else {
  // console.log('Service workers are not supported.');
}
