// Offline reading for visited pages; see sw.js for what it does and does not cache.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function (err) {
    console.error('Service worker registration failed:', err);
  });
}

// Timeline: bring the current entry's month into view.
//
// The strip opens at the recent end with no JavaScript (`direction: rtl` on
// the scroller — see .kh-timeline in _kh-dataviz.scss). That is the right
// default for the homepage and for recent entries, but on an old post the
// highlighted month sits far off the left edge with nothing to say so.
//
// This is progressive enhancement: without it the strip still works, still
// scrolls, and still marks the current month. It just opens somewhere else.
//
// Two things it deliberately does NOT do. It does not use scrollIntoView,
// which would also scroll the PAGE vertically to reach the strip — the reader
// should land at the top of the post, not at the timeline. And it does not
// animate: this is an initial position, not a transition, so there is nothing
// for a reader to follow and nothing to respect prefers-reduced-motion for.
(function () {
  var scroller = document.querySelector('.kh-timeline');
  if (!scroller) return;

  var current = scroller.querySelector('.kh-timeline__slot--current');
  if (!current) return; // homepage and index pages: leave the rtl default

  // Adjust by a DELTA rather than assigning an absolute scrollLeft. In an RTL
  // scroller the engines disagree about where scrollLeft starts — 0, a
  // negative number, or the max — but they all agree on what adding to it
  // does. Measuring with getBoundingClientRect sidesteps the question.
  var offset = current.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
  var centred = offset - (scroller.clientWidth - current.offsetWidth) / 2;

  // Clamped by the browser at both ends, so the newest entry still opens
  // flush with the recent end rather than half a screen past it.
  if (Math.abs(centred) > 1) scroller.scrollLeft += centred;
})();
