// Mangrove impact story: scroll-driven triangulation diagram.
//
// Progressive enhancement over the five static <svg> figures in
// 20261019-impact-story-mangrove-figma.njk. Without this script (or with the
// site CSS toggle off) the reader gets those figures inline, unchanged.
//
// How it works
//   - Each `.kh-scrolly` region gets ONE shared SVG, built here, inserted as
//     `.kh-scrolly__graphic` (with the `hidden` attribute, which only the
//     toggle-scoped CSS overrides, so CSS-off readers never see it).
//   - Each `.kh-scrolly__section[data-scrolly-steps]` lists one stage per
//     paragraph, e.g. "4 4.1 4.2 4.3". Paragraph N drives stage N (extra
//     paragraphs reuse the last stage). If it lists one MORE stage than it
//     has paragraphs, the first stage is a lead step owned by the heading.
//   - An IntersectionObserver watches a thin band across the viewport; any
//     step crossing it triggers a recompute of "last step whose top is above
//     the trigger line". That stage's spec (STAGES below) sets classes on the
//     SVG's keyed elements; CSS transitions do all of the motion.
//
// No dependencies. Pinning is CSS (`position: sticky`).
(() => {
  const regions = document.querySelectorAll('.kh-scrolly');
  if (!regions.length || !('IntersectionObserver' in window)) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const HEAD = 11; // arrowhead length and base width, viewBox units
  const W = 540;
  const H = 400;

  // ------------------------------------------------------------------------
  // Stage specs. Each key names elements in the SVG (data-k). Unlisted keys
  // are hidden. `dim`, `faint`, `strong`, `fault`, `good` are modifiers on
  // keys that are on. `define` names the term callout shown with that stage
  // (its text comes from the post's .kh-scrolly__define asides); `ld*` keys
  // are the leader lines joining a callout to its node.
  // ------------------------------------------------------------------------
  const SOURCES = ['nS', 'nT', 'sS', 'sT'];
  const TRIANGLE = [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT', 'nF', 'sF'];
  const READS = ['rdS', 'lbS', 'rdT', 'lbT', 'rdSB', 'lbSB'];

  const STAGES = {
    0: {},
    // Schemas arrive alone; tokens rise in with their own paragraph (1.1).
    1: { on: ['nS', 'sS', 'ldS'], define: 'nS' },
    1.1: { on: [...SOURCES, 'dots', 'dotsLbl', 'ldT'], define: 'nT' },
    1.2: { on: [...SOURCES, 'peers', 'peersLbl'] },
    // Storybook's definition first; the "+ layout" chip pops on the next
    // paragraph (2.05) so the two never compete.
    2: { on: [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT', 'ldSB'], define: 'nSB' },
    2.05: { on: [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT', 'chip'] },
    2.1: {
      on: [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT', 'chip'],
      strong: ['sS', 'sT', 'sSB'],
    },
    3: { on: [...TRIANGLE, 'ldF'], dim: ['peers', 'peersLbl', 'stS', 'stT'], define: 'nF' },
    3.1: { on: [...TRIANGLE, ...READS], dim: ['peers', 'peersLbl', 'stS', 'stT'] },
    3.2: {
      on: [...TRIANGLE, ...READS, 'ckS', 'ckT', 'ckSB'],
      dim: ['peers', 'peersLbl', 'stS', 'stT'],
      strong: ['rdS', 'rdT', 'rdSB'],
    },
    4: {
      on: [...TRIANGLE, 'rdS', 'rdT', 'rdSB'],
      dim: ['peers', 'peersLbl', 'stS', 'stT', 'rdS', 'rdT', 'rdSB', 'sS', 'sT', 'sSB', 'sF'],
    },
    4.1: {
      on: [...TRIANGLE, 'rdS', 'rdT', 'rdSB', 'lb4T', 'ckT', 'ckSB'],
      dim: ['peers', 'peersLbl', 'stS', 'stT', 'rdS', 'rdSB', 'sS', 'sT', 'sSB', 'sF'],
      fault: ['rdT', 'lb4T'],
    },
    4.2: {
      on: [...TRIANGLE, 'rdS', 'rdT', 'rdSB', 'lb4T', 'lb4SB'],
      dim: ['peers', 'peersLbl', 'stS', 'stT', 'rdS', 'sS', 'sT', 'sF'],
      fault: ['rdT', 'lb4T', 'rdSB', 'lb4SB'],
      strong: ['sSB'],
    },
    4.3: {
      on: [...TRIANGLE.filter((k) => k !== 'sS'), 'rdS', 'rdT', 'rdSB', 'lb4T', 'lb4SB', 'sS4', 'fix', 'fixLbl'],
      dim: ['peers', 'peersLbl', 'stS', 'stT', 'rdS', 'sT', 'sSB', 'sF'],
      fault: ['rdT', 'lb4T', 'rdSB', 'lb4SB', 'nS', 'sS4'],
    },
    5: {
      on: ['nS', 'nT', 'nSB', 'nF', 'sS', 'sSB', 'sT5', 'sF5', 'lbF5', 'peers', 'stS', 'rdS', 'rdSB', 'g5T', 'g5arc'],
      dim: ['peers', 'stS', 'rdS', 'rdSB', 'sS', 'sSB'],
      good: ['nT', 'sT5', 'g5T', 'g5arc', 'lbF5'],
    },
    5.1: {
      on: ['nS', 'nT', 'nSB', 'nF', 'sS', 'sSB', 'sT5', 'sF5', 'lbF5', 'peers', 'stS', 'rdS', 'rdSB', 'g5T', 'g5arc'],
      dim: ['peers', 'stS', 'sS', 'sSB'],
      faint: ['rdS', 'rdSB'],
      good: ['nT', 'sT5', 'g5T', 'g5arc', 'lbF5'],
    },
  };

  // ------------------------------------------------------------------------
  // Geometry. Same topology as the static figures (schemas top-left, tokens
  // bottom-left, Storybook centre, Figma right), squared up so labels stay
  // legible when the graphic is pinned in a half-width column or a 44vh band.
  // Fixed from stage 3 onward: stages 4 and 5 only restyle it.
  // ------------------------------------------------------------------------
  const N = {
    S: { x: 4, y: 40, w: 152, h: 60 },
    T: { x: 4, y: 300, w: 152, h: 60 },
    SB: { x: 186, y: 170, w: 134, h: 60 },
    F: { x: 392, y: 170, w: 144, h: 60 },
  };
  const cx = (n) => n.x + n.w / 2;

  // Term callouts. Position is in viewBox units: (x, y) is the callout's
  // anchor corner (tl = top-left, bl = bottom-left, br = bottom-right), `w`
  // its maximum width as a share of the diagram (capped at 22rem in CSS).
  // Each sits in space that is empty at its stage; `ld` is the leader line
  // from the node to that corner.
  const CALLOUTS = {
    nS: { x: 192, y: 24, anchor: 'tl', w: 0.6, ld: 'M158 70 H190' },
    nT: { x: 196, y: 186, anchor: 'bl', w: 0.6, ld: 'M150 297 L196 186' },
    // Anchored right of the schema stream, which passes just left of it.
    nSB: { x: 232, y: 150, anchor: 'bl', w: 0.56, ld: `M${cx(N.SB)} 168 V152` },
    nF: { x: 536, y: 150, anchor: 'br', w: 0.46, ld: `M${cx(N.F)} 168 V152` },
  };
  const LEADER_KEYS = { nS: 'ldS', nT: 'ldT', nSB: 'ldSB', nF: 'ldF' };

  // The schema callout carries a wireframe of the Book Card: structure, not
  // appearance. Dashed = optional. Edit the slots here.
  const WIREFRAME = {
    nS: {
      media: { label: 'image', note: 'optional', optional: true },
      slots: [
        { label: 'title', size: 'l' },
        { label: 'summary', note: 'max length', size: 'm' },
        { label: 'link' },
        { label: 'button', note: 'optional', optional: true },
      ],
    },
  };

  // `draw` paths are revealed with a mask so dashed and dotted lines can
  // draw in too. `head` adds an arrowhead at the path end once drawn.
  const node = (k, n, title, extra = '') => `
    <g class="kh-sv__el kh-sv__node${extra}" data-k="${k}">
      <rect class="kh-sv__box" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6"/>
      <text class="kh-sv__title" x="${cx(n)}" y="${n.y + 26}">${title}</text>
    </g>`;
  const sub = (k, n, text, extra = '') =>
    `<text class="kh-sv__el kh-sv__sub${extra}" data-k="${k}" x="${cx(n)}" y="${n.y + 47}">${text}</text>`;
  const line = (k, d, cls, { head = false, delay = 0, mid = '' } = {}) =>
    `<path class="kh-sv__el kh-sv__line ${cls}" data-k="${k}" data-draw${head ? ' data-head' : ''}${mid ? ` data-mid-head="${mid}"` : ''} style="--d:${delay}s" d="${d}"/>`;
  const label = (k, x, y, text, { cls = '', anchor = 'middle', delay = 0 } = {}) =>
    `<text class="kh-sv__el kh-sv__label ${cls}" data-k="${k}" x="${x}" y="${y}" text-anchor="${anchor}" style="--d:${delay}s">${text}</text>`;
  const check = (k, x, y, delay = 0) => `
    <g class="kh-sv__el kh-sv__check" data-k="${k}" style="--d:${delay}s" transform="translate(${x} ${y})">
      <circle r="11.5"/>
      <path d="M-5 0.5 L-1.5 4 L5 -3.5"/>
    </g>`;

  const P = {
    peers: `M80 ${N.S.y + N.S.h} V${N.T.y}`,
    // Arrow tips stop ~7 units short of the target box: a tip that touches
    // the border disappears into the stroke.
    // The two source streams aim at the heart of the Storybook box (253,200)
    // and stop ~7 units before the edge they meet.
    stS: 'M157 90 L222 165',
    stT: 'M157 310 L222 235',
    rdS: 'M464 170 C464 60, 300 16, 164 56',
    rdT: 'M464 230 C464 340, 300 384, 164 344',
    rdSB: 'M392 200 L328 200',
    // The 4.3 fix: ONE path out of the schema box, down the same route as the
    // schema stream into Storybook, under the Storybook box (the node's fill
    // hides that stretch) and on to Figma. Arrowheads at both arrivals, each
    // ~7 units short of the box it points at.
    fix: 'M157 90 L253 200 L320 213 L385 213',
    g5T: 'M157 310 L222 235',
    g5arc: 'M158 350 C300 392, 432 350, 432 238',
  };

  function buildSvg(id) {
    const dots = buildDots();
    return `
<svg class="kh-sv" id="${id}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <defs>${'' /* masks appended by JS */}</defs>
  <g class="kh-sv__lines">
    ${line('peers', P.peers, 'kh-sv__line--peers')}
    ${line('stS', P.stS, 'kh-sv__line--stream', { head: true })}
    ${line('stT', P.stT, 'kh-sv__line--stream', { head: true })}
    ${line('rdS', P.rdS, 'kh-sv__line--read', { head: true, delay: 0 })}
    ${line('rdT', P.rdT, 'kh-sv__line--read', { head: true, delay: 0.7 })}
    ${line('rdSB', P.rdSB, 'kh-sv__line--read', { head: true, delay: 1.4 })}
    ${line('fix', P.fix, 'kh-sv__line--fix', { head: true, delay: 0.6, mid: '222,165' })}
    ${line('g5T', P.g5T, 'kh-sv__line--good', { head: true })}
    ${line('g5arc', P.g5arc, 'kh-sv__line--good', { head: true, delay: 0.3 })}
    ${Object.keys(CALLOUTS).map((k) => line(LEADER_KEYS[k], CALLOUTS[k].ld, 'kh-sv__line--leader')).join('')}
    <path class="kh-sv__el kh-sv__pulse" data-k="g5T" pathLength="1" d="${P.g5T}"/>
    <path class="kh-sv__el kh-sv__pulse" data-k="g5arc" pathLength="1" d="${P.g5arc}"/>
  </g>
  <g class="kh-sv__el kh-sv__dots" data-k="dots">${dots}</g>
  ${label('dotsLbl', 200, 222, '471 shared · 87.2%', { anchor: 'start', delay: 0.6 })}
  ${label('dotsLbl', 520, 222, '69 by brand', { anchor: 'end', cls: 'kh-sv__label--brand', delay: 0.9 })}
  ${label('dotsLbl', 200, 384, 'Each dot is one of 540 Figma variables', { anchor: 'start', cls: 'kh-sv__label--quiet', delay: 1 })}
  ${node('nS', N.S, 'Content schemas')}
  ${node('nT', N.T, 'Design tokens', ' kh-sv__rise')}
  ${node('nSB', N.SB, 'Storybook')}
  ${node('nF', N.F, 'Figma', ' kh-sv__node--figma')}
  ${sub('sS', N.S, 'the content it holds')}
  ${sub('sS4', N.S, 'no length limit', ' kh-sv__sub--flag')}
  ${sub('sT', N.T, 'colour, type, spacing', ' kh-sv__rise')}
  ${sub('sT5', N.T, '30px → 32px', ' kh-sv__sub--flag')}
  ${sub('sSB', N.SB, 'the page layout')}
  ${sub('sF', N.F, '297 variants')}
  ${sub('sF5', N.F, '56 instances')}
  ${label('lbF5', N.F.x + N.F.w, N.F.y + N.F.h + 20, 'edits kept', { anchor: 'end', cls: 'kh-sv__label--flag', delay: 1.2 })}
  ${label('peersLbl', 90, 194, 'peers,', { anchor: 'start' })}
  ${label('peersLbl', 90, 210, 'independent', { anchor: 'start' })}
  <g class="kh-sv__el kh-sv__chip" data-k="chip" style="--d:0.9s">
    <rect x="${N.SB.x + N.SB.w - 70}" y="${N.SB.y - 34}" width="74" height="24" rx="12"/>
    <text x="${N.SB.x + N.SB.w - 33}" y="${N.SB.y - 17.5}">+ layout</text>
  </g>
  ${label('lbS', 318, 26, 'reads fields, presets', { delay: 0.6 })}
  ${label('lbT', 318, 394, 'reads variables', { delay: 1.3 })}
  ${label('lbSB', 357, 160, 'reads geometry', { delay: 2 })}
  ${label('lb4T', 318, 394, '0.55 read as 0.55%', { cls: 'kh-sv__label--flag' })}
  ${label('lb4SB', 357, 160, 'line-height', { cls: 'kh-sv__label--flag' })}
  ${label('fixLbl', 357, 250, 'the limit flows down', { cls: 'kh-sv__label--fix', delay: 1.6 })}
  ${check('ckS', N.S.x + N.S.w, N.S.y, 0)}
  ${check('ckT', N.T.x + N.T.w, N.T.y, 0.15)}
  ${check('ckSB', N.SB.x + N.SB.w, N.SB.y + N.SB.h, 0.3)}
</svg>`;
  }

  // 540 Figma variables (generated from the tokens) as dots: 471 shared in one block, 69 brand-specific split off
  // to the right. Column-major so the shared block fills left to right. Each
  // dot starts collapsed onto the Design tokens node and travels out.
  function buildDots() {
    const rows = 16;
    const gap = 8;
    const x0 = 204;
    const y0 = 238;
    const shared = 471;
    const total = 540;
    const origin = { x: cx(N.T), y: N.T.y + N.T.h / 2 };
    let out = '';
    for (let i = 0; i < total; i += 1) {
      const brand = i >= shared;
      const j = brand ? i - shared : i;
      const col = Math.floor(j / rows);
      const row = j % rows;
      const x = (brand ? 480 : x0) + col * gap;
      const y = y0 + row * gap;
      const dx = Math.round(origin.x - x);
      const dy = Math.round(origin.y - y);
      out += `<circle class="kh-sv__dot${brand ? ' kh-sv__dot--brand' : ''}" cx="${x}" cy="${y}" r="2.6" style="--kh-sv-dx:${dx}px;--kh-sv-dy:${dy}px;--kh-sv-i:${i}"/>`;
    }
    return out;
  }

  // Masks reveal each drawable line from its start; arrowheads sit at the end
  // and fade in after the draw.
  function decorate(svg) {
    const defs = svg.querySelector('defs');
    svg.querySelectorAll('[data-draw]').forEach((path, idx) => {
      const id = `${svg.id}-m${idx}`;
      const mask = document.createElementNS(SVG_NS, 'mask');
      mask.setAttribute('id', id);
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      mask.setAttribute('x', '0');
      mask.setAttribute('y', '0');
      mask.setAttribute('width', W);
      mask.setAttribute('height', H);
      const reveal = document.createElementNS(SVG_NS, 'path');
      reveal.setAttribute('d', path.getAttribute('d'));
      reveal.setAttribute('pathLength', '1');
      reveal.setAttribute('class', 'kh-sv__reveal');
      reveal.setAttribute('data-k', path.dataset.k);
      reveal.setAttribute('style', path.getAttribute('style') || '');
      mask.appendChild(reveal);
      defs.appendChild(mask);
      path.setAttribute('mask', `url(#${id})`);

      if (path.hasAttribute('data-head')) {
        let len;
        try {
          len = path.getTotalLength();
        } catch (e) {
          return;
        }
        const heads = [len];
        // Optional extra arrowhead part-way along (x,y): the nearest point
        // on the path, found by sampling.
        if (path.dataset.midHead) {
          const [mx, my] = path.dataset.midHead.split(',').map(Number);
          let best = 0;
          let bestD = Infinity;
          for (let l = 0; l <= len; l += 1) {
            const pt = path.getPointAtLength(l);
            const dist = (pt.x - mx) ** 2 + (pt.y - my) ** 2;
            if (dist < bestD) {
              bestD = dist;
              best = l;
            }
          }
          heads.unshift(best);
        }
        let anchor = path;
        heads.forEach((at, i) => {
          const isMid = i < heads.length - 1;
          const end = path.getPointAtLength(at);
          const before = path.getPointAtLength(Math.max(0, at - 4));
          const angle = (Math.atan2(end.y - before.y, end.x - before.x) * 180) / Math.PI;
          const head = document.createElementNS(SVG_NS, 'path');
          // 11 long x 11 wide: proportionate to the heaviest (4-unit) strokes.
          const place = `translate(${end.x.toFixed(1)} ${end.y.toFixed(1)}) rotate(${angle.toFixed(1)})`;
          head.setAttribute('d', `M-${HEAD} -${HEAD / 2} L0 0 L-${HEAD} ${HEAD / 2} Z`);
          head.setAttribute('transform', place);
          // Cut the line out from under the head inside its reveal mask, so
          // no stroke or cap can poke past the tip at any weight. The line
          // stops 1 unit inside the head's base, so there is no seam. A mid
          // head also hides the stretch between its tip and the box it points
          // into (the line runs on underneath that box).
          const cut = document.createElementNS(SVG_NS, 'rect');
          const ahead = isMid ? 12 : 3;
          cut.setAttribute('x', `${-(HEAD - 1)}`);
          cut.setAttribute('y', '-9');
          cut.setAttribute('width', `${HEAD - 1 + ahead}`);
          cut.setAttribute('height', '18');
          cut.setAttribute('fill', '#000');
          cut.setAttribute('transform', place);
          mask.appendChild(cut);
          head.setAttribute('class', `kh-sv__el kh-sv__head ${path.classList.contains('kh-sv__line--good') ? 'kh-sv__head--good' : ''}`);
          head.setAttribute('data-k', path.dataset.k);
          // A mid-path head arrives part-way through the draw, not at its end.
          const delay = parseFloat((path.getAttribute('style') || '').replace(/[^0-9.]/g, '')) || 0;
          const share = at / len;
          head.setAttribute('style', `--d:${(delay - 0.6 + 0.8 * share).toFixed(2)}s`);
          anchor.after(head);
          anchor = head;
        });
      }
    });
  }

  function applyStage(svg, stageId) {
    const spec = STAGES[stageId] || {};
    const sets = {};
    ['on', 'dim', 'faint', 'strong', 'fault', 'good'].forEach((m) => {
      sets[m] = new Set(spec[m] || []);
    });
    svg.setAttribute('data-stage', stageId);
    const layer = svg.parentNode.querySelector('.kh-scrolly__callouts');
    if (layer) {
      layer.querySelectorAll('[data-define]').forEach((c) => {
        c.classList.toggle('is-on', c.dataset.define === spec.define);
      });
    }
    svg.querySelectorAll('[data-k]').forEach((el) => {
      const k = el.dataset.k;
      const on = sets.on.has(k);
      el.classList.toggle('is-on', on);
      if (el.classList.contains('kh-sv__reveal')) return;
      el.classList.toggle('is-dim', on && sets.dim.has(k));
      el.classList.toggle('is-faint', on && sets.faint.has(k));
      el.classList.toggle('is-strong', on && sets.strong.has(k));
      el.classList.toggle('is-fault', on && sets.fault.has(k));
      el.classList.toggle('is-good', on && sets.good.has(k));
    });
  }

  // Callouts are copies of the post's definition asides, so the copy lives in
  // one place (the markup). The copies are aria-hidden with the rest of the
  // graphic; the asides stay in the prose for assistive tech (visually
  // hidden on wide screens by CSS).
  function wireframe(spec) {
    const slot = (s) => `<span class="kh-scrolly__wire-slot${s.optional ? ' is-optional' : ''}${s.size ? ` kh-scrolly__wire-slot--${s.size}` : ''}">${s.label}${s.note ? ` <i>${s.note}</i>` : ''}</span>`;
    return `<span class="kh-scrolly__wire">
      <span class="kh-scrolly__wire-media${spec.media.optional ? ' is-optional' : ''}">${spec.media.label}${spec.media.note ? ` <i>${spec.media.note}</i>` : ''}</span>
      <span class="kh-scrolly__wire-body">${spec.slots.map(slot).join('')}</span>
    </span>`;
  }

  function buildCallouts(region, graphic) {
    const asides = region.querySelectorAll('.kh-scrolly__define[data-define]');
    if (!asides.length) return;
    const layer = document.createElement('div');
    layer.className = 'kh-scrolly__callouts';
    asides.forEach((aside) => {
      const key = aside.dataset.define;
      const place = CALLOUTS[key];
      if (!place) return;
      const source = aside.querySelector('p') || aside;
      const term = source.querySelector('dfn');
      const body = source.cloneNode(true);
      const lead = body.querySelector('strong');
      if (lead && lead.querySelector('dfn')) lead.remove();
      const card = document.createElement('div');
      card.className = `kh-scrolly__callout kh-scrolly__callout--${place.anchor}`;
      card.dataset.define = key;
      card.style.setProperty('--x', `${((place.x / W) * 100).toFixed(2)}%`);
      card.style.setProperty('--y', `${((place.y / H) * 100).toFixed(2)}%`);
      card.style.setProperty('--w', `${(place.w * 100).toFixed(0)}%`);
      card.innerHTML = `${term ? `<span class="kh-scrolly__callout-term">${term.textContent}</span>` : ''}
        <span class="kh-scrolly__callout-text">${body.innerHTML.trim()}</span>
        ${WIREFRAME[key] ? wireframe(WIREFRAME[key]) : ''}`;
      layer.appendChild(card);
    });
    graphic.appendChild(layer);
  }

  // Hover (and tap) tooltips on the node boxes: the same definition text as
  // the asides, without the wireframe. Only for nodes visible in the current
  // stage, and never for a node whose stage callout is already showing.
  function definitionParts(region, key) {
    const aside = region.querySelector(`.kh-scrolly__define[data-define="${key}"]`);
    if (!aside) return null;
    const source = aside.querySelector('p') || aside;
    const term = source.querySelector('dfn');
    const body = source.cloneNode(true);
    const lead = body.querySelector('strong');
    if (lead && lead.querySelector('dfn')) lead.remove();
    return { term: term ? term.textContent : '', html: body.innerHTML.trim() };
  }

  function setupTips(region, graphic, svg) {
    const tip = document.createElement('div');
    tip.className = 'kh-scrolly__tip';
    graphic.appendChild(tip);
    let openKey = null;

    const hide = () => {
      openKey = null;
      tip.classList.remove('is-on');
    };

    const show = (group) => {
      const key = group.dataset.k;
      const callout = graphic.querySelector(`.kh-scrolly__callout[data-define="${key}"]`);
      const layer = graphic.querySelector('.kh-scrolly__callouts');
      const calloutShowing = callout && callout.classList.contains('is-on')
        && layer && layer.classList.contains('is-pinned')
        && getComputedStyle(layer).display !== 'none';
      if (!group.classList.contains('is-on') || calloutShowing) {
        hide();
        return;
      }
      const def = definitionParts(region, key);
      if (!def) return;
      openKey = key;
      tip.innerHTML = `<span class="kh-scrolly__callout-term">${def.term}</span><span class="kh-scrolly__callout-text">${def.html}</span>`;
      // Measure, then place beside the box without covering it: below if
      // there is room in the graphic, otherwise above; clamped to the sides.
      const host = graphic.getBoundingClientRect();
      const box = group.querySelector('rect').getBoundingClientRect();
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      const gap = 8;
      let top = box.bottom - host.top + gap;
      if (top + th > host.height) top = box.top - host.top - gap - th;
      let left = box.left - host.left + box.width / 2 - tw / 2;
      left = Math.max(4, Math.min(left, host.width - tw - 4));
      tip.style.left = `${left}px`;
      tip.style.top = `${Math.max(4, top)}px`;
      tip.classList.add('is-on');
    };

    svg.querySelectorAll('.kh-sv__node').forEach((group) => {
      group.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'touch') show(group);
      });
      group.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'touch') hide();
      });
      // Touch: tap a box to toggle its tooltip.
      group.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'touch') return;
        if (openKey === group.dataset.k) hide();
        else show(group);
      });
    });
    // Tap elsewhere, scroll, or a stage change closes it.
    document.addEventListener('pointerdown', (e) => {
      if (openKey && !e.target.closest('.kh-sv__node')) hide();
    }, { passive: true });
    window.addEventListener('scroll', () => { if (openKey) hide(); }, { passive: true });
    return hide;
  }

  // Keep the callout layer exactly over the drawn viewBox: the SVG letterboxes
  // (preserveAspectRatio meet), so percentages of the layer are viewBox units.
  function placeLayer(svg) {
    const layer = svg.parentNode.querySelector('.kh-scrolly__callouts');
    if (!layer) return;
    // SVG elements have no offsetLeft/Top; measure against the graphic box.
    const box = svg.getBoundingClientRect();
    const host = svg.parentNode.getBoundingClientRect();
    const w = box.width;
    const h = box.height;
    if (!w || !h) return;
    const s = Math.min(w / W, h / H);
    layer.style.left = `${box.left - host.left + (w - W * s) / 2}px`;
    layer.style.top = `${box.top - host.top + (h - H * s) / 2}px`;
    layer.style.width = `${W * s}px`;
    layer.style.height = `${H * s}px`;
  }

  // ------------------------------------------------------------------------
  // Regions and steps
  // ------------------------------------------------------------------------
  const wide = window.matchMedia('(min-width: 1024px)');
  const instances = [];

  regions.forEach((region, r) => {
    const graphic = document.createElement('div');
    graphic.className = 'kh-scrolly__graphic';
    graphic.hidden = true;
    graphic.setAttribute('aria-hidden', 'true');
    graphic.setAttribute('data-pagefind-ignore', '');
    graphic.innerHTML = buildSvg(`kh-sv-${r}`);
    region.appendChild(graphic);
    const svg = graphic.querySelector('svg');
    buildCallouts(region, graphic);
    const hideTip = setupTips(region, graphic, svg);

    const steps = [];
    region.querySelectorAll('.kh-scrolly__section[data-scrolly-steps]').forEach((section) => {
      const ids = section.dataset.scrollySteps.trim().split(/\s+/);
      const paras = section.querySelectorAll(':scope > p');
      // One more stage than paragraphs: the first belongs to the heading (a
      // "lead" step, e.g. a definition placed straight under the heading).
      const heading = section.querySelector(':scope > h2, :scope > h3');
      const lead = ids.length > paras.length && heading ? ids.shift() : null;
      if (lead) {
        heading.classList.add('kh-scrolly__lead');
        steps.push({ el: heading, anchor: section, stage: lead });
      }
      paras.forEach((p, i) => {
        p.classList.add('kh-scrolly__step');
        // The first step of a section starts at the section top, so the
        // heading above it already counts as part of that step.
        steps.push({ el: p, anchor: i === 0 && !lead ? section : p, stage: ids[Math.min(i, ids.length - 1)] });
      });
    });

    if (steps.length) steps[steps.length - 1].el.classList.add('kh-scrolly__step--last');

    const initial = region.dataset.scrollyInitial || '0';
    region.classList.add('kh-scrolly--enhanced');
    // Masks and arrowheads need layout-free geometry only, so the SVG can be
    // decorated while the graphic is still `hidden`.
    decorate(svg);
    applyStage(svg, initial);
    // Publish the rendered scale so CSS can cap label sizes: scaled up to
    // fill a wide column, 17px labels rendered at ~26px and out-shouted the
    // prose. The cap only ever shrinks text; on small screens it scales down.
    if ('ResizeObserver' in window) {
      new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (!width || !height) return;
        svg.style.setProperty('--kh-sv-s', Math.min(width / W, height / H).toFixed(3));
        placeLayer(svg);
      }).observe(svg);
    }
    instances.push({ region, svg, steps, initial, current: initial, active: null, layer: graphic.querySelector('.kh-scrolly__callouts'), hideTip });
  });

  function triggerLine() {
    return window.innerHeight * (wide.matches ? 0.55 : 0.66);
  }

  function update() {
    const y = triggerLine();
    instances.forEach((inst) => {
      let active = null;
      inst.steps.forEach((s) => {
        if (s.anchor.getBoundingClientRect().top <= y) active = s;
      });
      const stage = active ? active.stage : inst.initial;
      if (active !== inst.active) {
        inst.steps.forEach((s) => s.el.classList.toggle('is-active', s === active));
        inst.active = active;
      }
      if (stage !== inst.current) {
        inst.current = stage;
        applyStage(inst.svg, stage);
        inst.hideTip();
      }
      if (inst.layer) {
        // Pinned = the sticky graphic is sitting at its sticky offset.
        const g = inst.svg.parentNode;
        const top = parseFloat(getComputedStyle(g).top) || 0;
        const pinned = Math.abs(g.getBoundingClientRect().top - top) < 2;
        inst.layer.classList.toggle('is-pinned', pinned);
      }
    });
  }

  // A one-pixel band at the trigger line: every step boundary crossing it
  // fires, and update() then reads positions directly, so a fast fling that
  // skips several steps still lands on the right stage.
  let observer;
  function observe() {
    if (observer) observer.disconnect();
    const pct = wide.matches ? 55 : 66;
    observer = new IntersectionObserver(update, {
      rootMargin: `-${pct}% 0px -${99 - pct}% 0px`,
    });
    instances.forEach((inst) => {
      inst.steps.forEach((s) => {
        observer.observe(s.el);
        if (s.anchor !== s.el) observer.observe(s.anchor);
      });
    });
    update();
  }

  if (wide.addEventListener) wide.addEventListener('change', observe);
  window.addEventListener('resize', () => window.requestAnimationFrame(update), { passive: true });
  // The observer band is a few pixels tall, so a step can enter it while its
  // top is still just below the trigger line; with no further crossing,
  // nothing fires again and the stage sticks. Re-checking on scroll (once
  // per frame) closes that gap; update() is a handful of rect reads.
  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      update();
    });
  }, { passive: true });
  observe();
})();
