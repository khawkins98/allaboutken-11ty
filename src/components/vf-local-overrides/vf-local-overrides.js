 /**
  * The global function for this component
  * @example vfcomponentName(firstPassedVar)
  * @param {string} [firstPassedVar]  - An option to be passed
  */
function vfLocalOverrides(firstPassedVar) {
  firstPassedVar = firstPassedVar || 'defaultVal';
  console.log('vfLocalOverrides invoked with a value of', firstPassedVar);

  // This is the "Offline copy of pages" service worker
  // Add this below content to your HTML page, or add the js file to your page at the very top to register service worker

  // Check compatibility for the browser we're running this in
  if ("serviceWorker" in navigator) {
    if (navigator.serviceWorker.controller) {
      console.log("[PWA Builder] active service worker found, no need to register");
    } else {
      // Register the service worker
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/"
        })
        .then(function (reg) {
          console.log("[PWA Builder] Service worker has been registered for scope: " + reg.scope);
        });
    }
  }

}

// By default your component should be usable with js imports
export { vfLocalOverrides };
