/**
 * Fail on horizontal overflow at real device widths.
 *
 * Why a browser is required: horizontal overflow is a layout outcome, not a
 * property of the CSS. A long unbreakable URL, a wide table, a new full-bleed
 * element or a `100vw` next to a scrollbar all produce it, and none is visible
 * by reading the stylesheet.
 *
 * Why mobile emulation specifically: without it, headless Chrome ignores the
 * `width=device-width` viewport meta and lays a narrow window out as a desktop
 * page. That reports the whole site as broken below ~640px, which is an
 * artifact of the harness rather than a fact about the site -- a false alarm
 * this check exists partly to stop anyone raising twice.
 *
 * Baseline when written (Aug 2026): clean at 320/360/390/414 and at desktop
 * widths. The only real offender found was the inline search box overflowing
 * 320px by 5px, fixed by giving it the datasheet treatment.
 *
 * Usage: yarn lint:overflow  (expects a server on PORT serving build/)
 * Skips with exit 0, loudly, when Chrome is not installed: this is a local
 * quality gate, not something that should fail a machine that lacks a browser.
 */
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';

// Node's built-in WebSocket, unflagged from Node 22. Deliberately not the `ws`
// package: that is only present here as a transitive dependency of
// eleventy-dev-server, so importing it would work today and break silently the
// day Eleventy changes its dependency tree. package.json still declares
// `node >= 18`, which has no WebSocket, so this degrades rather than throws.
const WebSocket = globalThis.WebSocket;
if (!WebSocket) {
  console.log('⏭  check-overflow skipped: needs Node 22+ for the built-in WebSocket.');
  process.exit(0);
}

const WIDTHS = [320, 360, 390, 414, 600, 2048];
const PAGES = [
  '/', '/all/', '/blog/', '/digesting/', '/archive/', '/directory/',
  '/cv/', '/stats/', '/search/', '/work/', '/garage/', '/colophon/',
  '/style-guide/components/', '/design-lab/type/', '/design-lab/collage/',
  '/posts/20261115-a-cartridge-cover-for-the-homepage/',
  '/posts/20261019-johnny-castaway-browser/',
];
const TOLERANCE = 1; // sub-pixel rounding, not a layout fault
const PORT = 8123;
const CDP_PORT = 9444;

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
];
const chrome = CHROME_PATHS.find((p) => existsSync(p));
if (!chrome) {
  console.log('⏭  check-overflow skipped: no Chrome/Chromium found.');
  process.exit(0);
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join('build', p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('nope'); }
});
await new Promise((r) => server.listen(PORT, r));

const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${CDP_PORT}`, '--user-data-dir=/tmp/kh-overflow-profile', 'about:blank',
], { stdio: 'ignore' });

let id = 0;
const send = (ws, method, params = {}) => new Promise((resolve) => {
  const i = ++id;
  const on = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id === i) { ws.removeEventListener('message', on); resolve(m.result); }
  };
  ws.addEventListener('message', on);
  ws.send(JSON.stringify({ id: i, method, params }));
});
const waitFor = (ws, method) => new Promise((resolve) => {
  const t = setTimeout(() => { ws.removeEventListener('message', on); resolve(null); }, 10000);
  const on = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === method) { clearTimeout(t); ws.removeEventListener('message', on); resolve(m.params); }
  };
  ws.addEventListener('message', on);
});

// Names the offenders, skipping anything inside a scroll/clip container, whose
// overflow is contained on purpose (the timeline strip, table scrollers).
const PROBE = `(() => {
  const de = document.documentElement;
  const over = de.scrollWidth - de.clientWidth;
  if (over <= ${TOLERANCE}) return JSON.stringify({ over: 0, items: [] });
  const items = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (!(r.width || r.height)) continue;
    if (getComputedStyle(el).position === 'fixed') continue;
    if (r.right <= de.clientWidth + ${TOLERANCE}) continue;
    let p = el.parentElement, clipped = false;
    while (p && p !== document.body) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') { clipped = true; break; }
      p = p.parentElement;
    }
    if (clipped) continue;
    items.push((el.tagName.toLowerCase()
      + (el.id ? '#' + el.id : '')
      + (typeof el.className === 'string' && el.className.trim()
          ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''))
      + '  (+' + Math.round(r.right - de.clientWidth) + 'px)');
  }
  return JSON.stringify({ over, items: [...new Set(items)].slice(0, 5) });
})()`;

// The cover clips decorative shapes intentionally, so document overflow alone
// cannot detect text disappearing inside it. Check actual text fragments too.
const RESIZED_COVER_PROBE = `(async () => {
  await document.fonts.ready;
  const root = document.documentElement;
  const previousSize = root.style.fontSize;
  root.style.fontSize = '200%';
  try {
    const cover = document.querySelector('.kh-cartridge-cover');
    if (!cover) return [];
    const bounds = cover.getBoundingClientRect();
    const errors = [];
    for (const el of cover.querySelectorAll('.kh-cartridge-title span, .kh-cartridge-ribbon')) {
      const range = document.createRange();
      range.selectNodeContents(el);
      if ([...range.getClientRects()].some((r) => r.left < bounds.left - 1 || r.right > bounds.right + 1)) {
        errors.push('Clipped cover text: ' + el.textContent.trim());
      }
    }
    if (root.scrollWidth > root.clientWidth + 1) errors.push('Page overflows at 200% text size');
    return errors;
  } finally {
    root.style.fontSize = previousSize;
  }
})()`;

// Document overflow cannot detect query text concealed by an inset button.
// Expose both production panels without invoking a model or submitting a query.
const SEARCH_CONTROLS_PROBE = `(async () => {
  await document.fonts.ready;
  const panels = [...document.querySelectorAll('#keyword-section[hidden], #semantic-section[hidden]')];
  const inputs = [...document.querySelectorAll('.kh-search-widget__form .kh-form__input')];
  const saved = inputs.map((input) => input.value);
  const errors = [];
  panels.forEach((panel) => panel.removeAttribute('hidden'));
  try {
    for (const input of inputs) {
      input.value = 'how to improve search across digital platforms';
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      const button = input.form.querySelector('.kh-button');
      const field = input.getBoundingClientRect();
      const target = button.getBoundingClientRect();
      const fieldStyle = getComputedStyle(input);
      const buttonStyle = getComputedStyle(button);
      const textRight = field.right - parseFloat(fieldStyle.borderRightWidth) - parseFloat(fieldStyle.paddingRight);
      const gap = target.left - textRight;
      const requiredGap = buttonStyle.position === 'absolute' ? 16 : 0;
      if (gap < requiredGap - 1) errors.push(input.id + ': text/clear area overlaps submit target');
      if (target.width < 43 || target.height < 43) errors.push(input.id + ': submit target is below 44px');
      if (!buttonStyle.fontFamily.includes('IBM Plex Sans') || buttonStyle.fontWeight !== '600') {
        errors.push(input.id + ': submit typography differs from Sans 600 contract');
      }
    }
    return errors;
  } finally {
    inputs.forEach((input, i) => { input.value = saved[i]; });
    panels.forEach((panel) => panel.setAttribute('hidden', ''));
  }
})()`;

let ws, failures = 0, checked = 0;
try {
  for (let i = 0; i < 40 && !ws; i++) {
    try {
      const tab = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })).json();
      ws = new WebSocket(tab.webSocketDebuggerUrl);
      await new Promise((res, rej) => {
        ws.addEventListener('open', res, { once: true });
        ws.addEventListener('error', rej, { once: true });
      });
    } catch { ws = null; await new Promise((r) => setTimeout(r, 250)); }
  }
  if (!ws) throw new Error('could not reach Chrome over CDP');
  await send(ws, 'Page.enable');

  for (const width of WIDTHS) {
    await send(ws, 'Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: true });
    for (const page of PAGES) {
      await send(ws, 'Page.navigate', { url: `http://127.0.0.1:${PORT}${page}` });
      await waitFor(ws, 'Page.loadEventFired');
      await new Promise((r) => setTimeout(r, 120));
      const { result } = await send(ws, 'Runtime.evaluate', { expression: PROBE, returnByValue: true });
      const data = JSON.parse(result.value);
      checked++;
      if (data.over > TOLERANCE) {
        failures++;
        console.error(`\n❌ ${page} at ${width}px overflows by ${data.over}px`);
        for (const it of data.items) console.error(`     ${it}`);
      }
      if (page === '/search/' || page === '/style-guide/components/') {
        const { result: controls } = await send(ws, 'Runtime.evaluate', {
          expression: SEARCH_CONTROLS_PROBE, returnByValue: true, awaitPromise: true,
        });
        if (controls.value.length) {
          failures++;
          console.error(`\n❌ ${page} at ${width}px: ${controls.value.join('; ')}`);
        }
      }
      if (page === '/') {
        const { result: bleed } = await send(ws, 'Runtime.evaluate', {
          expression: `['.kh-cartridge-cover', '.kh-cartridge-writing', '.kh-footer'].filter((selector) => {
            const bounds = document.querySelector(selector).getBoundingClientRect();
            return Math.abs(bounds.left) > 1 || Math.abs(bounds.right - document.documentElement.clientWidth) > 1;
          })`, returnByValue: true,
        });
        if (bleed.value.length) {
          failures++;
          console.error(`\n❌ Homepage at ${width}px has inset full-width fields: ${bleed.value.join(', ')}`);
        }
        const { result: resized } = await send(ws, 'Runtime.evaluate', {
          expression: RESIZED_COVER_PROBE, returnByValue: true, awaitPromise: true,
        });
        if (resized.value.length) {
          failures++;
          console.error(`\n❌ Homepage at ${width}px with 200% text: ${resized.value.join('; ')}`);
        }
      }
    }
  }
} finally {
  if (ws) ws.close();
  proc.kill();
  server.close();
}

if (failures) {
  console.error(`\n${failures} layout/control checks failed across ${checked} page/width combinations.\n`);
  process.exit(1);
}
console.log(`✅ ${checked} page/width combinations pass (${WIDTHS.join(', ')}px), including search-control geometry and homepage text at 200%.`);
