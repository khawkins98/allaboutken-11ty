// vf-local-overrides

// Don't need JS? Then feel free to delete this file.

/*
 * A note on the Visual Framework and JavaScript:
 * The VF is primairly a CSS framework so we've included only a minimal amount
 * of JS in components and it's fully optional (just remove the JavaScript selectors
 * i.e. `data-vf-js-tabs`). So if you'd rather use Angular or Bootstrap for your
 * tabs, the Visual Framework won't get in the way.
 *
 * When querying the DOM for elements that should be acted on:
 * 🚫 Don't: const tabs = document.querySelectorAll('.vf-tabs');
 * ✅ Do:    const tabs = document.querySelectorAll('[data-vf-js-tabs]');
 *
 * This allows users who would prefer not to have this JS engange on an element
 * to drop `data-vf-js-component` and still maintain CSS styling.
 */

// // if you need to import any other components' JS to use here
// import { vfOthercomponent } from 'vf-other-component/vf-other-component';

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

// // If you need to invoke the component by default
// vfLocalOverrides();

// By default your component should be usable with js imports
export { vfLocalOverrides };
//
// // You should also import it at ./components/vf-core/scripts.js
// // import { vfcomponentName } from '../components/raw/vf-component/vf-component.js';
// // And, if needed, invoke it
// // vfcomponentName();
