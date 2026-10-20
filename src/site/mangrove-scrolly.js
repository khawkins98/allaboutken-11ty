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
  // (its text comes from the post's .kh-scrolly__define asides). A callout's
  // leader line is NOT a stage key: card and leader share one switch (see
  // syncCallout), so neither can show without the other.
  // ------------------------------------------------------------------------
  const SOURCES = ['nS', 'nT', 'sS', 'sT'];
  const TRIANGLE = [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT', 'nF', 'sF'];
  const READS = ['rdS', 'lbS', 'rdT', 'lbT', 'rdSB', 'lbSB'];

  const STAGES = {
    0: {},
    // Schemas arrive alone; tokens rise in with their own paragraph (1.1).
    1: { on: ['nS', 'sS'], define: 'nS' },
    1.1: { on: [...SOURCES, 'dots', 'dotsLbl'], define: 'nT' },
    1.2: { on: [...SOURCES, 'peers', 'peersLbl'] },
    // Storybook's definition first; the "+ layout" chip pops on the next
    // paragraph (2.05) so the two never compete.
    2: { on: [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT'], define: 'nSB' },
    2.05: { on: [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT', 'chip'] },
    2.1: {
      on: [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT', 'chip'],
      strong: ['sS', 'sT', 'sSB'],
    },
    3: { on: TRIANGLE, dim: ['peers', 'peersLbl', 'stS', 'stT'], define: 'nF' },
    3.1: { on: [...TRIANGLE, ...READS], dim: ['peers', 'peersLbl', 'stS', 'stT'] },
    3.2: {
      on: [...TRIANGLE, ...READS, 'ckS', 'ckT', 'ckSB'],
      dim: ['peers', 'peersLbl', 'stS', 'stT'],
      strong: ['rdS', 'rdT', 'rdSB'],
    },
    // The three checks stay from 3.2: "all three were checked, now..." The
    // schema check leaves at 4.1, where the other two mean "these agreed".
    4: {
      on: [...TRIANGLE, 'rdS', 'rdT', 'rdSB', 'ckS', 'ckT', 'ckSB'],
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
    // Waits for the tokens box to finish rising (0.8s) before attaching.
    nT: { x: 196, y: 186, anchor: 'bl', w: 0.6, ld: 'M150 297 L196 186', delay: 0.8 },
    // Anchored right of the schema stream, which passes just left of it.
    nSB: { x: 232, y: 150, anchor: 'bl', w: 0.56, ld: `M${cx(N.SB)} 168 V152` },
    nF: { x: 536, y: 150, anchor: 'br', w: 0.46, ld: `M${cx(N.F)} 168 V152` },
  };
  const CALLOUT_DELAY = 0.35; // seconds; card and leader share it

  // Label entry delays follow their line: lb4T waits for rdT, which redraws
  // (from 0.7s) when scrolling back up from stage 5.

  // Hover / tap explainers that are not term definitions. Edit copy here.
  //   dots:   the two groups of the stage-1.1 dot field.
  //   checks: the check-mark discs; copy depends on the stage, with
  //           `default` used for any stage not listed.
  const EXPLAINERS = {
    dots: {
      shared: {
        term: '471 shared',
        text: 'the same value in all five brands. The spacing scale, type sizes, neutral and status colours, and component measurements: the core every brand builds on.',
      },
      brand: {
        term: '69 by brand',
        text: "these change per brand. About 40 are colours for buttons, links, heroes and tabs; the rest are corners, padding and a few sizes, such as MCR2030's pill button.",
      },
    },
    checks: {
      default: {
        ckS: { term: 'Checked against the schema', text: "the component's fields and presets matched what the content schema allows." },
        ckT: { term: 'Checked against the brand settings', text: 'every colour, size and spacing value matched the design tokens.' },
        ckSB: { term: 'Checked against Storybook', text: "the component's layout matched the working version in the browser." },
      },
      4.1: {
        ckT: { term: 'These agreed', text: 'the brand settings and Storybook both said 55% opacity, so the fault had to be in the conversion to Figma.' },
        ckSB: { term: 'These agreed', text: 'the brand settings and Storybook both said 55% opacity, so the fault had to be in the conversion to Figma.' },
      },
    },
  };

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
  // Accessibility: the SVG is exposed as a group whose only semantic content
  // is the "Explain:" buttons (boxes, check discs, dot groups). Everything
  // else is drawing and is aria-hidden; the definitions these buttons open
  // are the prose asides' text, which assistive tech already reads in the
  // prose, so only the opened popup is linked (aria-describedby), never the
  // static callout copies. Buttons enter the tab order only while visible
  // (see syncFocusables).
  const btn = (name) => `role="button" tabindex="-1" aria-label="Explain: ${name}"`;
  const node = (k, n, title, extra = '') => `
    <g class="kh-sv__el kh-sv__node${extra}" data-k="${k}" ${btn(title)}>
      <rect class="kh-sv__box" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6"/>
      <text class="kh-sv__title" x="${cx(n)}" y="${n.y + 26}" aria-hidden="true">${title}</text>
    </g>`;
  const sub = (k, n, text, extra = '') =>
    `<text class="kh-sv__el kh-sv__sub${extra}" data-k="${k}" x="${cx(n)}" y="${n.y + 47}" aria-hidden="true">${text}</text>`;
  const line = (k, d, cls, { head = false, delay = 0, mid = '' } = {}) =>
    `<path class="kh-sv__el kh-sv__line ${cls}" data-k="${k}" data-draw${head ? ' data-head' : ''}${mid ? ` data-mid-head="${mid}"` : ''} style="--d:${delay}s" d="${d}"/>`;
  const label = (k, x, y, text, { cls = '', anchor = 'middle', delay = 0 } = {}) =>
    `<text class="kh-sv__el kh-sv__label ${cls}" data-k="${k}" x="${x}" y="${y}" text-anchor="${anchor}" style="--d:${delay}s" aria-hidden="true">${text}</text>`;
  const check = (k, x, y, name, delay = 0) => `
    <g class="kh-sv__el kh-sv__check" data-k="${k}" style="--d:${delay}s" transform="translate(${x} ${y})" ${btn(name)}>
      <circle class="kh-sv__check-hit" r="19"/>
      <circle class="kh-sv__check-disc" r="11.5"/>
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
<svg class="kh-sv" id="${id}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Diagram: the sources the Figma library is derived from. Each box can be explained." tabindex="-1" focusable="false">
  <defs>${'' /* masks appended by JS */}</defs>
  <g class="kh-sv__lines" aria-hidden="true">
    ${line('peers', P.peers, 'kh-sv__line--peers', { delay: 0.35 })}
    ${line('stS', P.stS, 'kh-sv__line--stream', { head: true })}
    ${line('stT', P.stT, 'kh-sv__line--stream', { head: true })}
    ${line('rdS', P.rdS, 'kh-sv__line--read', { head: true, delay: 0 })}
    ${line('rdT', P.rdT, 'kh-sv__line--read', { head: true, delay: 0.7 })}
    ${line('rdSB', P.rdSB, 'kh-sv__line--read', { head: true, delay: 1.4 })}
    ${line('fix', P.fix, 'kh-sv__line--fix', { head: true, delay: 0.6, mid: '222,165' })}
    ${line('g5T', P.g5T, 'kh-sv__line--good', { head: true })}
    ${line('g5arc', P.g5arc, 'kh-sv__line--good', { head: true, delay: 0.3 })}
    ${Object.keys(CALLOUTS).map((k) => `<path class="kh-sv__leader" data-leader="${k}" style="--kh-co-delay:${CALLOUTS[k].delay ?? CALLOUT_DELAY}s" d="${CALLOUTS[k].ld}"/>`).join('')}
    <path class="kh-sv__el kh-sv__pulse" data-k="g5T" pathLength="1" d="${P.g5T}"/>
    <path class="kh-sv__el kh-sv__pulse" data-k="g5arc" pathLength="1" d="${P.g5arc}"/>
  </g>
  <g class="kh-sv__el kh-sv__dots" data-k="dots" aria-hidden="true">${dots}</g>
  ${label('dotsLbl', 200, 222, '471 shared · 87.2%', { anchor: 'start', cls: 'kh-sv__dotlbl--shared', delay: 0.6 })}
  ${label('dotsLbl', 520, 222, '69 by brand', { anchor: 'end', cls: 'kh-sv__label--brand kh-sv__dotlbl--brand', delay: 0.9 })}
  <rect class="kh-sv__el kh-sv__hit" data-k="dots" data-dots="shared" x="196" y="206" width="246" height="160" ${btn('the 471 shared variables')}/>
  <rect class="kh-sv__el kh-sv__hit" data-k="dots" data-dots="brand" x="446" y="206" width="80" height="160" ${btn('the 69 brand-specific variables')}/>
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
  ${label('peersLbl', 90, 194, 'peers,', { anchor: 'start', delay: 0.45 })}
  ${label('peersLbl', 90, 210, 'independent', { anchor: 'start', delay: 0.45 })}
  <g class="kh-sv__el kh-sv__chip" data-k="chip" style="--d:0.9s" aria-hidden="true">
    <rect x="${N.SB.x + N.SB.w - 70}" y="${N.SB.y - 34}" width="74" height="24" rx="12"/>
    <text x="${N.SB.x + N.SB.w - 33}" y="${N.SB.y - 17.5}">+ layout</text>
  </g>
  ${label('lbS', 318, 26, 'reads fields, presets', { delay: 0.6 })}
  ${label('lbT', 318, 394, 'reads variables', { delay: 1.3 })}
  ${label('lbSB', 357, 160, 'reads geometry', { delay: 2 })}
  ${label('lb4T', 318, 394, '0.55 read as 0.55%', { cls: 'kh-sv__label--flag', delay: 1 })}
  ${label('lb4SB', 357, 160, 'line-height', { cls: 'kh-sv__label--flag', delay: 0.5 })}
  ${label('fixLbl', 357, 250, 'the limit flows down', { cls: 'kh-sv__label--fix', delay: 1.6 })}
  ${check('ckS', N.S.x + N.S.w, N.S.y, 'the check against the content schema', 0)}
  ${check('ckT', N.T.x + N.T.w, N.T.y, 'the check against the design tokens', 0.15)}
  ${check('ckSB', N.SB.x + N.SB.w, N.SB.y + N.SB.h, 'the check against Storybook', 0.3)}
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

  // Keys that were on in the stage last applied to each SVG. An element that
  // stays on across a stage change is `is-held`: its entry delay (--d, the
  // draw-in stagger) is dropped, so a restyle (dim, fault, good, strong)
  // lands at once. Without this, the Storybook read line kept its 1.4s
  // stagger when it turned orange in 4.2, so its "line-height" label was
  // orange a second before the line was; and it stayed orange for 1.4s into
  // stage 5, the healthy-change stage.
  const prevOn = new WeakMap();

  function applyStage(svg, stageId) {
    const spec = STAGES[stageId] || {};
    const sets = {};
    ['on', 'dim', 'faint', 'strong', 'fault', 'good'].forEach((m) => {
      sets[m] = new Set(spec[m] || []);
    });
    const was = prevOn.get(svg) || new Set();
    prevOn.set(svg, sets.on);
    svg.setAttribute('data-stage', stageId);

    svg.querySelectorAll('[data-k]').forEach((el) => {
      const k = el.dataset.k;
      const on = sets.on.has(k);
      el.classList.toggle('is-on', on);
      el.classList.toggle('is-held', on && was.has(k));
      if (el.classList.contains('kh-sv__reveal')) return;
      el.classList.toggle('is-dim', on && sets.dim.has(k));
      el.classList.toggle('is-faint', on && sets.faint.has(k));
      el.classList.toggle('is-strong', on && sets.strong.has(k));
      el.classList.toggle('is-fault', on && sets.fault.has(k));
      el.classList.toggle('is-good', on && sets.good.has(k));
    });
    syncFocusables(svg);
  }

  // Tab order follows the stage: only buttons that are on screen now (on,
  // and not faded to near-invisible) are reachable; the rest sit at -1 and
  // come back when their stage does. Only the region whose graphic is
  // actually on screen takes part (`data-live`, set by update()): the other
  // regions keep their end states off screen, and a Tab landing in one of
  // those would scroll the page back to it and flip the stage under the
  // reader. Narrow screens keep the tap popups but stay out of the tab
  // order: the 44vh band has no room for a popup beside a focus ring. A
  // focused button that just left the stage is blurred so focus never rests
  // on something invisible.
  function syncFocusables(svg) {
    const live = wide.matches && svg.dataset.live === '1';
    svg.querySelectorAll('[role="button"]').forEach((el) => {
      const reachable = live && el.classList.contains('is-on') && !el.classList.contains('is-faint');
      el.setAttribute('tabindex', reachable ? '0' : '-1');
      if (!reachable && document.activeElement === el) el.blur();
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
    // Copies of the prose asides: hidden from assistive tech, which has
    // the originals.
    layer.setAttribute('aria-hidden', 'true');
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
      card.style.setProperty('--kh-co-delay', `${place.delay ?? CALLOUT_DELAY}s`);
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
    // Each term is defined once, in the region where it first appears, but
    // its box is hoverable in every later region: look it up document-wide,
    // preferring this region's copy.
    const sel = `.kh-scrolly__define[data-define="${key}"]`;
    const aside = region.querySelector(sel) || document.querySelector(sel);
    if (!aside) return null;
    const source = aside.querySelector('p') || aside;
    const term = source.querySelector('dfn');
    const body = source.cloneNode(true);
    const lead = body.querySelector('strong');
    if (lead && lead.querySelector('dfn')) lead.remove();
    return { term: term ? term.textContent : '', html: body.innerHTML.trim() };
  }

  // Popup placement, Mapbox-style: try each side of the box, slide the card
  // along that edge to stay inside the graphic, and keep the one that covers
  // the least of what is currently drawn (other boxes, checks, labels, the
  // chip, the dots). Ties go to the side with the most free space. The caret
  // points at the box edge midpoint, clamped to stay on the card.
  const OBSTACLES = '.kh-sv__node.is-on rect, .kh-sv__check.is-on, .kh-sv__label.is-on, .kh-sv__sub.is-on, .kh-sv__chip.is-on, .kh-sv__dots.is-on, .kh-sv__head.is-on';
  function overlap(a, b) {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 ? w * h : 0;
  }

  // Popup targets. Each returns its anchor element (what the caret points
  // at), its content, and what must not count as an obstacle to itself.
  //   node  -- a box: the term definition from the post's aside
  //   dots  -- a dot group (shared block / brand column, with its labels)
  //   check -- a check-mark disc: stage-dependent copy
  // Check discs are drawn after the boxes, so over a disc the check wins.
  function targetOf(el) {
    return el.closest('.kh-sv__check, .kh-sv__hit, .kh-sv__node');
  }

  function setupTips(region, graphic, svg) {
    const tip = document.createElement('div');
    tip.className = 'kh-scrolly__tip';
    graphic.appendChild(tip);
    let openId = null;
    const GAP = 12; // anchor edge to card edge; the caret spans it
    const PAD = 4; // keep inside the graphic

    const describe = (t) => {
      if (t.matches('.kh-sv__node')) {
        const key = t.dataset.k;
        // The stage callout is already explaining this box.
        if (graphic.dataset.callout === key) return null;
        const def = definitionParts(region, key);
        return def && { id: `node:${key}`, anchor: t.querySelector('rect'), term: def.term, html: def.html, own: [t] };
      }
      if (t.matches('.kh-sv__hit')) {
        const group = t.dataset.dots;
        const copy = EXPLAINERS.dots[group];
        const own = [...svg.querySelectorAll('.kh-sv__hit, .kh-sv__dots, [data-k="dotsLbl"]')];
        // Anchored on the group's label, not the whole block: around the
        // block every side is crowded, but below the label is the group's
        // own dot field, which may be covered.
        const anchor = svg.querySelector(`.kh-sv__dotlbl--${group}`) || t;
        return copy && { id: `dots:${group}`, anchor, term: copy.term, html: copy.text, own, dots: group, focus: t };
      }
      const key = t.dataset.k;
      const stage = svg.dataset.stage;
      const copy = (EXPLAINERS.checks[stage] || {})[key] || EXPLAINERS.checks.default[key];
      return copy && { id: `check:${key}@${stage}`, anchor: t.querySelector('.kh-sv__check-disc'), term: copy.term, html: copy.text, own: [t] };
    };

    const place = (d) => {
      const host = graphic.getBoundingClientRect();
      const box = d.anchor.getBoundingClientRect();
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      const rel = (r) => ({
        left: r.left - host.left, right: r.right - host.left, top: r.top - host.top, bottom: r.bottom - host.top,
      });
      const b = rel(box);
      const midX = (b.left + b.right) / 2;
      const midY = (b.top + b.bottom) / 2;
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
      const obstacles = [...svg.querySelectorAll(OBSTACLES)]
        .filter((el) => !d.own.some((o) => o.contains(el)))
        .map((el) => {
          // Boxes and check marks carry the meaning, so covering them costs
          // most; labels and arrowheads less; the dot field least.
          let w = 1;
          if (el.matches('rect')) w = 20;
          else if (el.matches('.kh-sv__check')) w = 6;
          else if (el.matches('.kh-sv__dots')) w = 0.3;
          if (el.closest('.is-dim, .is-faint')) w *= 0.4;
          return { r: rel(el.getBoundingClientRect()), w };
        });
      // A stage callout on screen is as important as a box; its leader
      // should not be crossed either.
      graphic.querySelectorAll('.kh-scrolly__callout.is-on').forEach((c) => {
        obstacles.push({ r: rel(c.getBoundingClientRect()), w: 20 });
      });
      svg.querySelectorAll('.kh-sv__leader.is-on').forEach((l) => {
        obstacles.push({ r: rel(l.getBoundingClientRect()), w: 2 });
      });
      // A dot popup should not hide the group it explains; covering the
      // other (dimmed) group is fine.
      if (d.focus) obstacles.push({ r: rel(d.focus.getBoundingClientRect()), w: 3 });
      const cands = [
        { side: 'bottom', x: midX - tw / 2, y: b.bottom + GAP, room: host.height - b.bottom },
        { side: 'top', x: midX - tw / 2, y: b.top - GAP - th, room: b.top },
        { side: 'right', x: b.right + GAP, y: midY - th / 2, room: host.width - b.right },
        { side: 'left', x: b.left - GAP - tw, y: midY - th / 2, room: b.left },
      ].map((c) => {
        const vertical = c.side === 'top' || c.side === 'bottom';
        // Slide along the edge to stay inside; the cross axis cannot move.
        const x = vertical ? clamp(c.x, PAD, host.width - tw - PAD) : c.x;
        const y = vertical ? c.y : clamp(c.y, PAD, host.height - th - PAD);
        const r = { left: x, top: y, right: x + tw, bottom: y + th };
        const out = Math.max(0, PAD - r.left) + Math.max(0, r.right - host.width + PAD)
          + Math.max(0, PAD - r.top) + Math.max(0, r.bottom - host.height + PAD);
        const hit = obstacles.reduce((sum, o) => sum + overlap(r, o.r) * o.w, 0);
        return { ...c, x, y, score: out * 1e4 + hit - c.room * 0.01, vertical };
      });
      cands.sort((p, q) => p.score - q.score);
      const c = cands[0];
      // Caret position along the card edge, aimed at the anchor's midpoint.
      const caret = c.vertical ? clamp(midX - c.x, 14, tw - 14) : clamp(midY - c.y, 14, th - 14);
      tip.dataset.side = c.side;
      tip.style.setProperty('--kh-tip-caret', `${caret}px`);
      tip.style.left = `${c.x}px`;
      tip.style.top = `${c.y}px`;
    };

    // The popup is linked to the button that opened it from the keyboard
    // (aria-describedby), so a screen reader hears the explanation on focus
    // and nothing else: the tip is otherwise plain content that nothing
    // points at, and the static callout cards stay aria-hidden.
    tip.id = `${svg.id}-tip`;
    let described = null; // element carrying aria-describedby
    let viaKeyboard = false;
    let lastShown = null;

    const hide = () => {
      openId = null;
      viaKeyboard = false;
      tip.classList.remove('is-on');
      delete svg.dataset.dotFocus;
      if (described) {
        described.removeAttribute('aria-describedby');
        described = null;
      }
    };

    const show = (t, keyboard = false) => {
      const d = t && t.classList.contains('is-on') ? describe(t) : null;
      if (!d) {
        hide();
        return;
      }
      openId = d.id;
      viaKeyboard = keyboard;
      lastShown = d;
      tip.innerHTML = `<span class="kh-scrolly__callout-term">${d.term}</span><span class="kh-scrolly__callout-text">${d.html}</span>`;
      if (d.dots) svg.dataset.dotFocus = d.dots;
      else delete svg.dataset.dotFocus;
      place(d);
      tip.classList.add('is-on');
      if (described && described !== t) described.removeAttribute('aria-describedby');
      described = null;
      if (keyboard) {
        t.setAttribute('aria-describedby', tip.id);
        described = t;
      }
    };

    // Keyboard: focus opens, blur closes, Escape closes and leaves focus on
    // the button, Enter/Space toggle. Focus arrives on the pinned graphic,
    // which is fully on screen, so tabbing does not scroll the page.
    svg.addEventListener('focusin', (e) => {
      const t = targetOf(e.target);
      if (t && t.matches('[role="button"]')) show(t, true);
    });
    svg.addEventListener('focusout', (e) => {
      if (!svg.contains(e.relatedTarget)) hide();
    });
    svg.addEventListener('keydown', (e) => {
      const t = targetOf(e.target);
      if (!t) return;
      if (e.key === 'Escape') {
        if (openId) {
          e.preventDefault();
          hide();
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (openId) hide();
        else show(t, true);
      }
    });

    // One delegated handler for every target: pointerover reaches the
    // innermost target, so a check disc beats the box it sits on.
    let current = null;
    svg.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const t = targetOf(e.target);
      if (t === current) return;
      current = t;
      show(t);
    });
    svg.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      current = null;
      hide();
    });
    // Touch: tap a target to toggle; tap elsewhere to close.
    svg.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'touch') return;
      const t = targetOf(e.target);
      const d = t && t.classList.contains('is-on') ? describe(t) : null;
      if (d && d.id === openId) hide();
      else show(t);
    });
    document.addEventListener('pointerdown', (e) => {
      if (openId && !targetOf(e.target)) hide();
    }, { passive: true });
    // A hover popup closes on scroll; a keyboard one follows its button
    // (the graphic is pinned, so it rarely moves) rather than vanishing
    // under the reader's hands.
    window.addEventListener('scroll', () => {
      if (!openId) return;
      if (viaKeyboard && lastShown) place(lastShown);
      else hide();
    }, { passive: true });
    return () => {
      current = null;
      hide();
    };
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
    // Not aria-hidden: the SVG's "Explain:" buttons are real controls, and
    // focusable content inside an aria-hidden subtree is a WCAG failure.
    // The drawing itself is hidden piece by piece in buildSvg, and the
    // callout layer below.
    graphic.hidden = true;
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
        // A data attribute, not a `kh-` class: _kh-content.scss styles
        // heading permalinks with `h2:not([class*='kh-'])`, so a class here
        // stripped the anchor's styling from this one heading.
        heading.setAttribute('data-scrolly-lead', '');
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

  // The ONE switch for a stage callout: its card and its leader line are
  // turned on and off together, from the same condition, with the same
  // delay. The condition: wide layout, graphic pinned (a callout popping out
  // while the graphic is still sliding into place reads as a glitch), and
  // the current stage defines a term.
  function syncCallout(inst) {
    if (!inst.layer) return;
    const g = inst.svg.parentNode;
    const top = parseFloat(getComputedStyle(g).top) || 0;
    const pinned = Math.abs(g.getBoundingClientRect().top - top) < 2;
    const spec = STAGES[inst.current] || {};
    const key = wide.matches && pinned && spec.define ? spec.define : '';
    if (key === (g.dataset.callout || '')) return;
    g.dataset.callout = key;
    g.querySelectorAll('.kh-scrolly__callout[data-define], .kh-sv__leader[data-leader]').forEach((el) => {
      el.classList.toggle('is-on', (el.dataset.define || el.dataset.leader) === key);
    });
  }

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
      syncCallout(inst);
      // Live = the graphic is wholly on screen (pinned, or in flow but
      // visible), so focusing a button in it cannot scroll the page.
      const g = inst.svg.parentNode.getBoundingClientRect();
      const live = g.top >= -2 && g.bottom <= window.innerHeight + 2 ? '1' : '0';
      if (inst.svg.dataset.live !== live) {
        inst.svg.dataset.live = live;
        syncFocusables(inst.svg);
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

  if (wide.addEventListener) {
    wide.addEventListener('change', () => {
      observe();
      instances.forEach((inst) => syncFocusables(inst.svg));
    });
  }
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
