// Story flow: draw a .kh-story-flow chain in, and count its numbers up,
// the first time it scrolls into view.
//
// Progressive enhancement only. The markup is an <ol> of finished figures;
// without this script (or under reduced motion) it simply shows them. With
// it, the figure gets --armed (CSS hides the steps), then .is-in when it is
// on screen (CSS staggers the arrows and boxes by each step's --i), and each
// .kh-story-flow__num counts from zero to the value already in its text.
// See the .kh-story-flow block in _kh-story.scss.
(() => {
  const flows = document.querySelectorAll('.kh-story-flow');
  if (!flows.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const STEP = 550; // ms between steps; matches 0.55s in the CSS
  const LEAD = 300; // a box arrives this long after its arrow starts
  const COUNT = 900; // ms for one number to count up
  const fmt = new Intl.NumberFormat('en-US');

  const countUp = (el, delay) => {
    const finalText = el.textContent;
    const target = Number(finalText.replace(/[^\d]/g, ''));
    if (!target) return;
    el.textContent = '0';
    setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / COUNT);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = t < 1 ? fmt.format(Math.round(target * eased)) : finalText;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const flow = entry.target;
        flow.classList.add('is-in');
        // With the site CSS toggle off nothing is hidden or staggered, so a
        // number ticking over in plain text would just be noise.
        const toggle = document.getElementById('kh-css-toggle');
        if (toggle && !toggle.checked) return;
        flow.querySelectorAll('.kh-story-flow__step').forEach((step, i) => {
          const num = step.querySelector('.kh-story-flow__num');
          if (num) countUp(num, i * STEP + LEAD);
        });
      });
    },
    { threshold: 0.2 },
  );

  flows.forEach((flow) => {
    // Inside an enhanced scrolly region the chain is the pinned graphic's
    // closing state and the <ol> is hidden; nothing here to draw.
    if (flow.closest('.kh-scrolly--enhanced')) return;
    const steps = flow.querySelectorAll('.kh-story-flow__step');
    steps.forEach((step, i) => step.style.setProperty('--i', i));
    flow.style.setProperty('--kh-flow-n', steps.length);
    flow.classList.add('kh-story-flow--armed');
    io.observe(flow);
  });
})();
