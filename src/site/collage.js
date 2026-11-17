// Optional progressive enhancement for editorial figures. Images and captions
// remain complete without JS. External modules are evaluated once per URL even
// when several figures include the same script.
const motion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const cssToggle = document.getElementById('kh-css-toggle');

for (const figure of document.querySelectorAll('.kh-collage--parallax')) {
  const stage = figure.querySelector('.kh-collage__stage');
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    stage.style.removeProperty('--kh-collage-x');
    stage.style.removeProperty('--kh-collage-y');
  };
  const update = () => {
    frame = 0;
    if (!motion.matches || !cssToggle?.checked) return reset();
    const rect = stage.getBoundingClientRect();
    const clamp = n => Math.max(-1, Math.min(1, n));
    stage.style.setProperty('--kh-collage-x', clamp((pointerX - rect.left) / rect.width * 2 - 1).toFixed(3));
    stage.style.setProperty('--kh-collage-y', clamp((pointerY - rect.top) / rect.height * 2 - 1).toFixed(3));
  };

  stage.addEventListener('pointermove', event => {
    if (!motion.matches || !cssToggle?.checked || event.pointerType === 'touch') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  stage.addEventListener('pointerleave', reset);
  stage.addEventListener('pointercancel', reset);
  motion.addEventListener('change', reset);
  cssToggle?.addEventListener('change', reset);
}
