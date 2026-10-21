// Mangrove impact story: one persistent scroll-driven diagram, cover to close.
//
// Progressive enhancement over the five static <svg> figures and the closing
// <ol> in 20261019-impact-story-mangrove-figma.njk. Without this script (or
// with the site CSS toggle off) the reader gets those inline, unchanged.
//
// How it works
//   - The post body is ONE `.kh-scrolly` region. It gets one SVG, built here,
//     inserted as `.kh-scrolly__graphic` (with the `hidden` attribute, which
//     only the toggle-scoped CSS overrides, so CSS-off readers never see it)
//     and pinned beside the prose for the whole story.
//   - The page's cover (layouts/story.njk renders it above the body) is
//     adopted into the region's step column (`data-scrolly-cover`), so the
//     title page sits beside the opening constellation on wide screens while
//     no-JS and RSS readers keep the plain cover.
//   - The diagram has three lives. COVER: a constellation of dots, each one a
//     real thing the plugin reads or writes (540 Figma variables, 69 of them
//     brand-specific; 297 variants; 25 families; the schemas as an unnumbered
//     cluster), scattered (seeded) across the graphic on load; the 297
//     variants are not there yet. Scrolling gathers them in story order:
//     schemas, then variables and families. The variants are born at the
//     Figma section as a new field on the Figma side and are pulled into
//     their cluster as the plugin's reads draw. BODY: the boxes draw themselves around the
//     clusters as the sections name them, and the stages play (sources,
//     Storybook, Figma reads all three, faults, token change). CLOSE: the
//     triangle crossfades to the flow of numbers and the dots regroup under
//     the figures they honestly count.
//   - Each `.kh-scrolly__section[data-scrolly-steps]` lists one stage per
//     paragraph, e.g. "4 4.1 4.2 4.3". If it lists one MORE stage than it has
//     paragraphs, the first stage is a lead step owned by the heading. A
//     section with `data-scrolly-plain` is ordinary prose over one resting
//     stage. Any element with `data-scrolly-stage` is a step on its own.
//   - Panels: an element with `data-scrolly-panel` (the brand studio, the two
//     screenshots) stays in the prose flow for reading and tab order, and is
//     shown position:fixed over the pinned graphic while a stage names it.
//   - A single update() path reads step positions (with hysteresis) and sets
//     the stage; CSS transitions do all of the motion.
//
// No dependencies. Pinning is CSS (`position: sticky`).
(() => {
  const regions = document.querySelectorAll('.kh-scrolly');
  if (!regions.length || !('IntersectionObserver' in window)) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const HEAD = 11; // arrowhead length and base width, viewBox units
  // Line draw-in time and the lag before its arrowhead fades in; both must
  // match .kh-sv__reveal and .kh-sv__head.is-on in _kh-scrolly.scss.
  const DRAW = 0.6;
  const HEAD_LAG = 0.5;
  const W = 540;
  const H = 400;
  const wide = window.matchMedia('(min-width: 1024px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ------------------------------------------------------------------------
  // Stage specs. Each key names elements in the SVG (data-k). Unlisted keys
  // are hidden. `dim`, `faint`, `strong`, `fault`, `good` are modifiers on
  // keys that are on. `define` names the term callout shown with that stage
  // (its text comes from the post's .kh-scrolly__define asides). A callout's
  // leader line is NOT a stage key: card and leader share one switch (see
  // syncCallout), so neither can show without the other.
  //   dots     the dot layout (see LAYOUT): cloud, c1, c2, settled, spread,
  //            full, chain. Default settled.
  //   panel    a data-scrolly-panel shown in place of the diagram.
  //   release  narrow screens: the band slides away for this stage.
  //   chain    the closing state: the triangle leaves, the figures draw.
  // Which clusters are "named" (their box is drawn, so their dots drop to a
  // faint texture under it) follows from which node keys are on.
  // ------------------------------------------------------------------------
  const SOURCES = ['nS', 'nT', 'sS', 'sT'];
  const TRIANGLE = [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT', 'nF', 'sF'];
  const READS = ['rdS', 'lbS', 'rdT', 'lbT', 'rdSB', 'lbSB'];
  const LOW = ['peers', 'peersLbl', 'stS', 'stT'];
  const REST = {
    on: [...TRIANGLE, 'rdS', 'rdT', 'rdSB'],
    dim: [...LOW, 'rdS', 'rdT', 'rdSB', 'sS', 'sT', 'sSB', 'sF'],
  };
  const CHAIN = ['ch1', 'ch2', 'ch3', 'ch4', 'ca1', 'ca2', 'ca3', 'chNote'];

  const STAGES = {
    // The opening: scattered, then gathering as the paragraphs name things.
    cover: { on: [], dots: 'cloud' },
    c0: { on: [], dots: 'cloud' },
    c1: { on: [], dots: 'c1' },
    c2: { on: [], dots: 'c2' },
    // "Two layout engines" (see buildClash): the dots stop being data.
    // The container resizes once on entry (narrow, then wide, then holds):
    // the flow side reflows like liquid, the frames recalculate in steps.
    // See resizeW.
    w: { on: ['bucket', 'seam', 'frA', 'frB', 'frC', 'ring', 'lbFlow', 'lbFrames', 'anFlow', 'anFrames', 'anRing', 'hitFlow', 'hitFrames'], dim: ['seam'], fault: ['ring'], dots: 'clash', resize: true },
    'w.1': { on: ['bucket', 'seam', 'frA2', 'frB2', 'frC2', 'ring', 'lbFlow', 'lbFrames', 'br1', 'br2', 'anBr', 'anCross', 'hitFlow', 'hitFrames', 'hitBr1', 'hitBr2', 'hitCross'], dim: ['seam'], fault: ['ring'], dots: 'clash2' },
    'w.2': { on: [], dots: 'settled' },
    // Schemas arrive alone; tokens rise in with their own paragraph (1.1).
    1: { on: ['nS', 'sS'], define: 'nS' },
    1.1: { on: [...SOURCES, 'dots', 'dotsLbl'], define: 'nT', dots: 'spread' },
    // Keeps the token definition: nothing in 1.2 needs that space (the peers
    // label sits left of it), so it stays until the studio takes over.
    1.2: { on: [...SOURCES, 'peers', 'peersLbl'], define: 'nT' },
    1.3: { on: [...SOURCES, 'peers', 'peersLbl'], panel: 'studio', release: true },
    // Storybook's definition first; the "+ layout" chip pops on the next
    // paragraph (2.05) so the two never compete.
    2: { on: [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT'], define: 'nSB' },
    2.05: { on: [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT', 'chip'] },
    2.1: {
      on: [...SOURCES, 'peers', 'peersLbl', 'nSB', 'sSB', 'stS', 'stT', 'chip'],
      strong: ['sS', 'sT', 'sSB'],
    },
    // Figma: the variants are BORN here (a new field of free radicals on
    // the Figma side), then pulled into their cluster as the reads draw.
    3: { on: TRIANGLE, dim: LOW, define: 'nF', dots: 'born' },
    3.1: { on: [...TRIANGLE, ...READS], dim: LOW, dots: 'full' },
    3.2: {
      on: [...TRIANGLE, ...READS, 'ckS', 'ckT', 'ckSB'],
      dim: LOW,
      strong: ['rdS', 'rdT', 'rdSB'],
      dots: 'full',
    },
    3.3: {
      on: [...TRIANGLE, ...READS, 'ckS', 'ckT', 'ckSB'],
      dim: LOW,
      strong: ['rdS', 'rdT', 'rdSB'],
      panel: 'figma',
      release: true,
      dots: 'full',
    },
    // The three checks stay from 3.2: "all three were checked, now..." The
    // schema check leaves at 4.1, where the other two mean "these agreed".
    4: {
      on: [...TRIANGLE, 'rdS', 'rdT', 'rdSB', 'ckS', 'ckT', 'ckSB'],
      dim: [...LOW, 'rdS', 'rdT', 'rdSB', 'sS', 'sT', 'sSB', 'sF'],
      dots: 'full',
    },
    4.1: {
      on: [...TRIANGLE, 'rdS', 'rdT', 'rdSB', 'lb4T', 'ckT', 'ckSB'],
      dim: [...LOW, 'rdS', 'rdSB', 'sS', 'sT', 'sSB', 'sF'],
      fault: ['rdT', 'lb4T'],
      dots: 'full',
    },
    4.2: {
      on: [...TRIANGLE, 'rdS', 'rdT', 'rdSB', 'lb4T', 'lb4SB'],
      dim: [...LOW, 'rdS', 'sS', 'sT', 'sF'],
      fault: ['rdT', 'lb4T', 'rdSB', 'lb4SB'],
      strong: ['sSB'],
      dots: 'full',
    },
    4.3: {
      on: [...TRIANGLE.filter((k) => k !== 'sS'), 'rdS', 'rdT', 'rdSB', 'lb4T', 'lb4SB', 'sS4', 'fix', 'fixLbl'],
      dim: [...LOW, 'rdS', 'sT', 'sSB', 'sF'],
      fault: ['rdT', 'lb4T', 'rdSB', 'lb4SB', 'nS', 'sS4'],
      dots: 'full',
    },
    5: {
      on: ['nS', 'nT', 'nSB', 'nF', 'sS', 'sSB', 'sT5', 'sF5', 'lbF5', 'peers', 'stS', 'rdS', 'rdSB', 'g5T', 'g5arc'],
      dim: ['peers', 'stS', 'rdS', 'rdSB', 'sS', 'sSB'],
      good: ['nT', 'sT5', 'g5T', 'g5arc', 'lbF5'],
      dots: 'full',
    },
    5.1: {
      on: ['nS', 'nT', 'nSB', 'nF', 'sS', 'sSB', 'sT5', 'sF5', 'lbF5', 'peers', 'stS', 'rdS', 'rdSB', 'g5T', 'g5arc'],
      dim: ['peers', 'stS', 'sS', 'sSB'],
      faint: ['rdS', 'rdSB'],
      good: ['nT', 'sT5', 'g5T', 'g5arc', 'lbF5'],
      dots: 'full',
    },
    // Cost and reflection: the whole picture at rest.
    6: { ...REST, release: true, dots: 'full' },
    6.5: { ...REST, panel: 'plate', release: true, dots: 'full' },
    7: { on: CHAIN, good: ['ch4', 'ca3'], dots: 'chain', chain: true },
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

  // Closing chain: four figures in a row. The sub-labels are the post's own
  // (see the .kh-story-flow <ol>), so the two never drift.
  const CH = [
    { k: 'ch1', x: 6, y: 150, w: 116, h: 70, num: '2,700', label: 'brand values', pw: 82, sub: '5 brands × 540 variables' },
    { k: 'ch2', x: 144, y: 150, w: 116, h: 70, num: '110', label: 'styles', pw: 46, sub: '102 text, 8 effects' },
    { k: 'ch3', x: 282, y: 150, w: 116, h: 70, num: '297', label: 'variants', pw: 58, sub: 'in 25 component families' },
    { k: 'ch4', x: 420, y: 150, w: 116, h: 70, num: '56', label: 'linked instances', pw: 108, sub: 'every edit kept', good: true },
  ];

  // Term callouts. Position is in viewBox units: (x, y) is the callout's
  // anchor corner (tl = top-left, bl = bottom-left, br = bottom-right), `w`
  // its maximum width as a share of the diagram (capped at 22rem in CSS).
  // Each sits in space that is empty at its stage; `ld` is the leader line
  // from the node to that corner.
  const CALLOUTS = {
    nS: { x: 192, y: 24, anchor: 'tl', w: 0.6, ld: 'M158 70 H190' },
    // Waits for the tokens box to finish rising (0.5s) before attaching.
    nT: { x: 196, y: 186, anchor: 'bl', w: 0.6, ld: 'M150 297 L196 186', delay: 0.5 },
    // Anchored right of the schema stream, which passes just left of it.
    nSB: { x: 232, y: 150, anchor: 'bl', w: 0.56, ld: `M${cx(N.SB)} 168 V152` },
    nF: { x: 536, y: 150, anchor: 'br', w: 0.46, ld: `M${cx(N.F)} 168 V152` },
  };
  const CALLOUT_DELAY = 0.15; // seconds; card and leader share it

  // Label entry delays follow their line: lb4T waits for rdT, which redraws
  // (from 0.5s) when scrolling back up from stage 5.

  // Hover / tap explainers that are not term definitions. Edit copy here.
  //   dots:   the two groups of the stage-1.1 dot field.
  //   checks: the check-mark discs; copy depends on the stage, with
  //           `default` used for any stage not listed.
  const EXPLAINERS = {
    // Stage w, "two layout engines": the flow and frames areas, each seam
    // ring, the bridges and the crossing dot.
    w: {
      flow: { term: 'CSS flow', text: 'In the browser, layout is CSS: content flows and wraps to fit the space it is given. Resize the container and the content flows into the new shape. That is how Storybook renders a component.' },
      frames: { term: 'Auto Layout', text: 'Figma lays things out with Auto Layout: frames with set padding, gaps and resizing rules. Resize one and it recalculates: fixed padding and gaps, edges that stretch while the corners hold. Similar ideas, a different engine.' },
      ring: { term: 'Fits neither', text: 'Some details exist on one side with no exact equivalent on the other, such as a CSS behaviour Auto Layout cannot express. Those are where copies drift.' },
      bridge: { term: 'A converter', text: 'Off-the-shelf converters get you part of the way. Every system differs, so the last stretch is custom.' },
      cross: { term: 'By hand', text: 'Without a shared source, someone carries each change across by hand.' },
    },
    // The formed clusters, before a box names them. `aside` prepends the
    // post's own definition of that term (the .kh-scrolly__define copy).
    clusters: {
      S: {
        term: 'Content schemas',
        aside: 'nS',
        text: 'The dots here stand for those agreed lists, one for each kind of content UNDRR\'s sites share. The story never counts them, so this cluster shows where they sit in the picture, not how many there are.',
      },
      T: {
        term: '540 brand variables',
        text: 'Each dot is one of the 540 variables the plugin generates from the brand settings: a colour, a type size, a spacing value, with a value for each of the five brands. 471 are the same in every brand; the 69 in blue are where the brands differ.',
      },
      B: {
        term: '25 component families',
        text: 'Each dot is one family of components, such as the Book Card with its four presets or the Button with its sizes and states. Storybook is where each family is built and laid out.',
      },
      F: {
        term: '297 component variants',
        text: 'Each dot is one variant of a component: one component in one of its states or presets. There are 297 of them, across the 25 families. Where they end up is the rest of the story.',
      },
    },
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

  // ------------------------------------------------------------------------
  // Dots. One circle per real thing, in groups:
  //   S  the content schemas (an unnumbered cluster: the post never counts
  //      them, so the cluster is labelled without a number);
  //   T  540 Figma variables, the last 69 brand-specific (blue);
  //   B  25 component families;
  //   F  297 variants;
  //   K  56 linked instances, in the close only (they are instances placed in
  //      a designer's file, not a subset of the 297, so they are new dots).
  // The dots are HTML (<i> elements in a layer over the SVG, scaled to the
  // viewBox), not SVG circles: each is placed by a CSS transform from two
  // custom properties, so a layout change is one style write per dot and CSS
  // does the travel, and each one drifts on its own compositor layer. As
  // SVG circles the same drift re-rasterised the whole SVG every frame
  // (20 fps in Chromium, 3 in Firefox); as HTML it is 60 fps in both. The
  // SVG keeps the hit rects, the labels and the close's pattern copies, and
  // the layer mirrors the SVG's data attributes (see mirrorDots).
  // ------------------------------------------------------------------------
  const COUNTS = { S: 12, T: 540, B: 25, F: 297, K: 56 };
  const SHARED = 471;

  // Seeded so the cover is the same frame every time (social screenshots).
  function mulberry32(a) {
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20261019);

  const grid = (i, x0, y0, rows, gap) => ({ x: x0 + Math.floor(i / rows) * gap, y: y0 + (i % rows) * gap });
  const gridRow = (i, x0, y0, cols, gap) => ({ x: x0 + (i % cols) * gap, y: y0 + Math.floor(i / cols) * gap });

  // Full: a cluster inside each box region, so the box can be drawn around
  // it. The 540 fill the tokens box; the 297 fill Figma's.
  const full = (g, i) => {
    if (g === 'S') return grid(i, 55, 62, 2, 10);
    if (g === 'T') return gridRow(i, 10, 304, 36, 4);
    if (g === 'B') return grid(i, 237, 184, 5, 8);
    if (g === 'F') return gridRow(i, 400, 184, 33, 4);
    return chain('K', i);
  };
  // The variants before Figma is in the story: a loose, faint drift on the
  // Figma side, not yet a cluster.
  const driftRng = mulberry32(297);
  const DRIFT = [];
  for (let i = 0; i < COUNTS.F; i += 1) DRIFT.push({ x: 336 + driftRng() * 196, y: 36 + driftRng() * 330 });
  // Settled: the three sources formed; no variants yet (CSS hides F). Born:
  // the same, with the variants scattered on the Figma side.
  const settled = (g, i) => (g === 'F' ? DRIFT[i] : full(g, i));
  const born = settled;
  // Opening beats: schemas first (c1), then variables and families (c2).
  const c1 = (g, i) => (g === 'S' || g === 'K' ? full(g, i) : CLOUD[g][i]);
  const c2 = (g, i) => (g === 'F' ? CLOUD[g][i] : full(g, i));
  // Spread (stage 1.1): the 540 laid out beside the tokens box, 471 shared
  // in one block and 69 brand-specific split off to the right.
  const spread = (g, i) => {
    if (g !== 'T') return settled(g, i);
    const brand = i >= SHARED;
    const j = brand ? i - SHARED : i;
    return grid(j, brand ? 480 : 204, 238, 16, 8);
  };
  // Chain (the close): under the figure each group honestly counts.
  //   T  under "2,700 brand values": one block of 540, which the SVG shows
  //      five times over (<use>), one per brand: 2,700 marks.
  //   B  under "297 variants": a row of 25, the families...
  //   F  ...and the 297 themselves beneath them.
  //   K  under "56 linked instances".
  //   S  nothing counts them; they leave.
  const chain = (g, i) => {
    if (g === 'T') return gridRow(i, 10, 252, 48, 2.25);
    if (g === 'B') return gridRow(i, 285.5, 254, 25, 4.5);
    if (g === 'F') return gridRow(i, 287, 266, 27, 4);
    if (g === 'K') return gridRow(i, 450, 256, 14, 4.4);
    return full('S', i);
  };
  // The first frame: scattered across the whole graphic, seeded so it is the
  // same picture every time.
  const cloud = () => ({ x: 6 + rng() * 528, y: 14 + rng() * 372 });
  const CLOUD = {};
  Object.keys(COUNTS).forEach((g) => {
    CLOUD[g] = [];
    for (let i = 0; i < COUNTS[g]; i += 1) CLOUD[g].push(g === 'K' ? chain('K', i) : g === 'F' ? DRIFT[i] : cloud());
  });
  // "Two layout engines" (stage w): the same content dots (S, T, B; no F
  // yet) fall under two rule sets either side of a seam at x = SEAM. Each
  // dot's side is fixed at build by its index (alternating). Left, "flow":
  // ragged wrapping rows, like CSS flow. Right, "frames": rigid grids with
  // fixed padding and gap inside dashed Auto-Layout frames, which hug their
  // content in `clash` and fill their column in `clash2`, so the dots
  // re-grid and the misfits shift. Five right-side dots are stuck at the
  // seam (ringed in the fault colour); one left-side dot crosses once, by
  // hand, in clash2 (a CSS animation, see --kh-cx/--kh-cy).
  const SEAM = 270;
  const CONTENT = ['S', 'T', 'B'];
  const SIDE = {};
  const CLASH = { clash: {}, clashN: {}, clash2: {} };
  const FRAMES = { clash: [], clashN: [], clash2: [] };
  // The flow side's container ("bucket"): wide, and narrowed for the resize.
  const BUCKET = { x: 10, y: 50, h: 268, w: { clash: 240, clashN: 184 } };
  const SEAM_PTS = [70, 130, 190, 250, 310].map((y) => ({ x: SEAM, y }));
  let CROSS = null;
  const rr = (x, y, w, h, r = 6) => `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  (function buildClash() {
    const r2 = mulberry32(7);
    const left = [];
    const right = [];
    let n = 0;
    CONTENT.forEach((g) => {
      for (let i = 0; i < COUNTS[g]; i += 1) {
        const key = `${g}${i}`;
        SIDE[key] = n % 2 ? 'R' : 'L';
        (n % 2 ? right : left).push(key);
        n += 1;
      }
    });
    // Flow: rows of a random length (16-27 dots), 8.5 apart, 18 down. In
    // the narrowed container the same stream rewraps at 20 a row, like
    // text, so the level rises.
    let row = 0;
    let col = 0;
    let len = 16 + Math.floor(r2() * 12);
    left.forEach((key, idx) => {
      if (col >= len) {
        row += 1;
        col = 0;
        len = 16 + Math.floor(r2() * 12);
      }
      const pt = { x: 16 + col * 8.5, y: 60 + row * 18 };
      CLASH.clash[key] = pt;
      CLASH.clash2[key] = pt;
      CLASH.clashN[key] = { x: 16 + (idx % 20) * 8.5, y: 60 + Math.floor(idx / 20) * 17 };
      col += 1;
    });
    // Frames: fixed padding 10 and gap 9. Hug: as many columns as the frame
    // was drawn for, rows as needed. Fill: wider frames, more columns.
    const seamKeys = right.slice(-SEAM_PTS.length);
    const framed = right.slice(0, right.length - SEAM_PTS.length);
    const plan = {
      clash: [{ x: 292, y: 56, cols: 20, cap: 120 }, { x: 292, y: 142, cols: 9, cap: 108 }, { x: 404, y: 142, cols: 9, cap: 108 }],
      // Narrowed: fewer columns, same padding and gap, so rows are added.
      clashN: [{ x: 292, y: 56, cols: 15, cap: 120 }, { x: 292, y: 142, cols: 7, cap: 108 }, { x: 404, y: 142, cols: 7, cap: 108 }],
      clash2: [{ x: 292, y: 56, cols: 24, cap: 120, fill: { w: 232, h: 68 } }, { x: 292, y: 142, cols: 11, cap: 108, fill: { w: 112, h: 230 } }, { x: 414, y: 142, cols: 11, cap: 108, fill: { w: 110, h: 230 } }],
    };
    Object.keys(plan).forEach((lay) => {
      let k = 0;
      plan[lay].forEach((f) => {
        const take = framed.slice(k, k + f.cap);
        k += f.cap;
        take.forEach((key, j) => {
          CLASH[lay][key] = { x: f.x + 10 + (j % f.cols) * 9, y: f.y + 10 + Math.floor(j / f.cols) * 9 };
        });
        const rows = Math.ceil(take.length / f.cols);
        const hug = { w: 20 + (Math.min(take.length, f.cols) - 1) * 9, h: 20 + (rows - 1) * 9 };
        FRAMES[lay].push({ x: f.x, y: f.y, w: f.fill ? f.fill.w : hug.w, h: f.fill ? f.fill.h : hug.h });
      });
    });
    seamKeys.forEach((key, j) => {
      CLASH.clash[key] = SEAM_PTS[j];
      CLASH.clashN[key] = SEAM_PTS[j];
      CLASH.clash2[key] = SEAM_PTS[j];
      SIDE[key] = 'seam';
    });
    // The crossing dot: the last dot of the third flow row goes to the
    // third frame's next free cell (in the fill layout), by hand.
    const rowEnd = left.find((key, idx) => idx > 0 && CLASH.clash[left[idx + 1]] && CLASH.clash[left[idx + 1]].y > CLASH.clash[key].y && CLASH.clash[key].y === 60 + 2 * 18);
    const f3 = plan.clash2[2];
    const n3 = framed.length - plan.clash2[0].cap - plan.clash2[1].cap;
    if (rowEnd && n3 >= 0 && n3 < f3.cap) {
      const from = CLASH.clash2[rowEnd];
      const to = { x: f3.x + 10 + (n3 % f3.cols) * 9, y: f3.y + 10 + Math.floor(n3 / f3.cols) * 9 };
      CROSS = { key: rowEnd, dx: (to.x - from.x).toFixed(1), dy: (to.y - from.y).toFixed(1), to };
    }
  }());
  const clash = (g, i) => CLASH.clash[`${g}${i}`] || settled(g, i);
  const clashN = (g, i) => CLASH.clashN[`${g}${i}`] || settled(g, i);
  const clash2 = (g, i) => CLASH.clash2[`${g}${i}`] || settled(g, i);

  const LAYOUT = { cloud: (g, i) => CLOUD[g][i], c1, c2, settled, spread, born, full, chain, clash, clashN, clash2 };
  // Which clusters have formed in each layout (so can be labelled, hovered).
  // The variants (F) only form at stage 3, when their box names them, so
  // their drift answers no hover before that.
  const FORMED = { cloud: [], c1: ['S'], c2: ['S', 'T', 'B'], settled: ['S', 'T', 'B'], spread: ['S'], born: ['S', 'T', 'B'], full: ['S', 'T', 'B', 'F'], chain: [], clash: [], clashN: [], clash2: [] };

  function buildDotLayer() {
    const dot = (g, i) => {
      const cls = ['kh-sv__dot', `kh-sv__dot--${g}`];
      if (g === 'T' && i >= SHARED) cls.push('kh-sv__dot--brand');
      const side = SIDE[`${g}${i}`];
      if (side) cls.push(`kh-sv__dot--${side}`);
      const cross = CROSS && CROSS.key === `${g}${i}` ? `;--kh-cx:${CROSS.dx}px;--kh-cy:${CROSS.dy}px` : '';
      if (cross) cls.push('kh-sv__dot--cross');
      // The dots stuck at the seam (stage w) wait 0.35s before any move, so
      // their fault rings (0.2s exit) are always gone before they go.
      const dl = SIDE[`${g}${i}`] === 'seam' ? '0.35' : (rng() * 0.6).toFixed(2);
      const c0 = CLOUD[g][i];
      // Drift: each dot wanders its own slow loop (duration, phase and two
      // waypoints seeded here); the stage sets the amplitude, see
      // --kh-drift in _kh-scrolly.scss.
      const u = () => (rng() * 2 - 1).toFixed(2);
      const drift = `--kh-dr-d:${(7 + rng() * 6).toFixed(1)}s;--kh-dr-p:${(-rng() * 13).toFixed(1)}s;--kh-dr-x1:${u()};--kh-dr-y1:${u()};--kh-dr-x2:${u()};--kh-dr-y2:${u()};--kh-dr-in:${(rng() * 0.7).toFixed(2)}s`;
      return `<i class="${cls.join(' ')}" data-g="${g}" data-i="${i}" style="--dl:${dl}s;--x:${c0.x.toFixed(1)}px;--y:${c0.y.toFixed(1)}px;${drift}${cross}"></i>`;
    };
    let out = '';
    Object.keys(COUNTS).forEach((g) => {
      out += `<span class="kh-sv__dotgroup kh-sv__dotgroup--${g}">`;
      for (let i = 0; i < COUNTS[g]; i += 1) out += dot(g, i);
      out += '</span>';
    });
    return `<div class="kh-sv-dots" data-dots="cloud" aria-hidden="true">${out}</div>`;
  }

  function buildDots(id) {
    let out = '';
    // Four more blocks of 540 for the close, one per brand, below the one
    // the real dots travel to. These do not travel, so they are a dot
    // pattern (one circle per 2.25-unit cell, phased to the real grid)
    // clipped to exactly 540 cells: eleven full rows and twelve of the
    // twelfth. (<use> copies of the group were tried; a <use> does not
    // follow the clones' CSS-variable transforms.)
    const c = chain('T', 0);
    const gap = 2.25;
    out += `<pattern id="${id}-pt" x="${(c.x - gap / 2).toFixed(3)}" y="${(c.y - gap / 2).toFixed(3)}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse"><circle class="kh-sv__ptdot" cx="${gap / 2}" cy="${gap / 2}" r="0.57"/></pattern>`;
    for (let b = 1; b < 5; b += 1) {
      const top = c.y - gap / 2 + b * 13 * gap;
      out += `<g class="kh-sv__dotcopy" style="--d:${(1.3 + b * 0.1).toFixed(1)}s" fill="url(#${id}-pt)">`
        + `<rect x="${(c.x - gap / 2).toFixed(3)}" y="${top.toFixed(3)}" width="${48 * gap}" height="${11 * gap}"/>`
        + `<rect x="${(c.x - gap / 2).toFixed(3)}" y="${(top + 11 * gap).toFixed(3)}" width="${12 * gap}" height="${gap}"/></g>`;
    }
    return out;
  }

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
      <rect class="kh-sv__box" pathLength="1" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6"/>
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
  const chainBox = (c, i) => `
    <g class="kh-sv__el kh-sv__chain${c.good ? ' kh-sv__chain--good' : ''}" data-k="${c.k}" style="--d:${(0.5 + i * 0.35).toFixed(2)}s" aria-hidden="true">
      <rect class="kh-sv__chbox" pathLength="1" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="6"/>
      <text class="kh-sv__num" data-num="${c.num}" x="${c.x + c.w / 2}" y="${c.y + 34}">${c.num}</text>
      <g class="kh-sv__pill"><rect x="${c.x + c.w / 2 - c.pw / 2}" y="${c.y + 42}" width="${c.pw}" height="18" rx="9"/><text x="${c.x + c.w / 2}" y="${c.y + 55}">${c.label}</text></g>
      <text class="kh-sv__chsub" x="${c.x + c.w / 2}" y="${c.y + c.h + 18}">${c.sub}</text>
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
    // Chain arrows, each ~7 units short of the next figure.
    ca1: 'M124 185 L135 185',
    ca2: 'M262 185 L273 185',
    ca3: 'M400 185 L411 185',
  };

  function buildSvg(id) {
    return `
<svg class="kh-sv" id="${id}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Diagram: the sources the Figma library is derived from. Each box can be explained." tabindex="-1" focusable="false">
  <defs>${'' /* masks appended by JS */}</defs>
  <g class="kh-sv__lines" aria-hidden="true">
    ${line('peers', P.peers, 'kh-sv__line--peers', { delay: 0.35 })}
    ${line('stS', P.stS, 'kh-sv__line--stream', { head: true })}
    ${line('stT', P.stT, 'kh-sv__line--stream', { head: true })}
    ${line('rdS', P.rdS, 'kh-sv__line--read', { head: true, delay: 0 })}
    ${line('rdT', P.rdT, 'kh-sv__line--read', { head: true, delay: 0.5 })}
    ${line('rdSB', P.rdSB, 'kh-sv__line--read', { head: true, delay: 1 })}
    ${line('fix', P.fix, 'kh-sv__line--fix', { head: true, delay: 0.6, mid: '222,165' })}
    ${line('g5T', P.g5T, 'kh-sv__line--good', { head: true })}
    ${line('g5arc', P.g5arc, 'kh-sv__line--good', { head: true, delay: 0.3 })}
    ${line('ca1', P.ca1, 'kh-sv__line--chain', { head: true, delay: 1.1 })}
    ${line('ca2', P.ca2, 'kh-sv__line--chain', { head: true, delay: 1.45 })}
    ${line('ca3', P.ca3, 'kh-sv__line--chain', { head: true, delay: 1.8 })}
    ${line('seam', `M${SEAM} 36 V384`, 'kh-sv__line--seam', { delay: 0.6 })}
    ${'' /* The flow side's container: a dashed box whose top edge is covered by a ground-coloured lid, so it reads as an open bucket. Its width transitions. */}
    <rect class="kh-sv__el kh-sv__bucket" data-k="bucket" x="${BUCKET.x}" y="${BUCKET.y}" width="${BUCKET.w.clash}" height="${BUCKET.h}" rx="4" style="--d:0.3s"/>
    <rect class="kh-sv__el kh-sv__bucket-lid" data-k="bucket" x="${BUCKET.x - 2}" y="${BUCKET.y - 3}" width="${BUCKET.w.clash + 4}" height="6" style="--d:0.3s"/>
    ${'' /* Nine-slice frames: a dashed rect whose edges stretch (width/height transition, stepped) and four fixed-size corner marks that translate with the edges. */}
    ${FRAMES.clash.map((f, i) => `<rect class="kh-sv__el kh-sv__frame" data-k="fr${'ABC'[i]}" data-frame="${i}" x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="6" style="--d:${(0.8 + i * 0.15).toFixed(2)}s"/>`
      + ['tl', 'tr', 'br', 'bl'].map((c) => { const L = 9; const d = c === 'tl' ? `M${f.x} ${f.y + L} V${f.y + 6} Q${f.x} ${f.y} ${f.x + 6} ${f.y} H${f.x + L}` : c === 'tr' ? `M${f.x + f.w - L} ${f.y} H${f.x + f.w - 6} Q${f.x + f.w} ${f.y} ${f.x + f.w} ${f.y + 6} V${f.y + L}` : c === 'br' ? `M${f.x + f.w} ${f.y + f.h - L} V${f.y + f.h - 6} Q${f.x + f.w} ${f.y + f.h} ${f.x + f.w - 6} ${f.y + f.h} H${f.x + f.w - L}` : `M${f.x + L} ${f.y + f.h} H${f.x + 6} Q${f.x} ${f.y + f.h} ${f.x} ${f.y + f.h - 6} V${f.y + f.h - L}`; return `<path class="kh-sv__el kh-sv__corner" data-k="fr${'ABC'[i]}" data-frame="${i}" data-corner="${c}" d="${d}" style="--d:${(0.8 + i * 0.15).toFixed(2)}s"/>`; }).join('')).join('')}
    ${FRAMES.clash2.map((f, i) => line(`fr${'ABC'[i]}2`, rr(f.x, f.y, f.w, f.h), 'kh-sv__line--frame', { delay: 0.3 + i * 0.15 })).join('')}
    ${line('br1', 'M238 112 C258 90, 272 90, 284 104', 'kh-sv__line--bridge', { head: true, delay: 1.2 })}
    ${line('br2', 'M238 232 C258 210, 272 210, 284 224', 'kh-sv__line--bridge', { head: true, delay: 1.6 })}
    ${line('anFlow', 'M70 304 V350', 'kh-sv__line--note', { delay: 1.6 })}
    ${line('anFrames', 'M380 302 V350', 'kh-sv__line--note', { delay: 1.8 })}
    ${line('anRing', `M${SEAM + 5} ${SEAM_PTS[4].y + 5} L${SEAM + 12} ${SEAM_PTS[4].y + 14}`, 'kh-sv__line--note', { delay: 2 })}
    ${line('anBr', 'M262 230 V318', 'kh-sv__line--note', { delay: 2.3 })}
    ${CROSS ? line('anCross', `M${CROSS.to.x} ${CROSS.to.y + 7} V376`, 'kh-sv__line--note', { delay: 5.7 }) : ''}
    <path class="kh-sv__el kh-sv__hit kh-sv__hit--line" data-k="hitBr1" data-w="bridge" d="M238 112 C258 90, 272 90, 284 104" ${btn('a converter that stops short')}/>
    <path class="kh-sv__el kh-sv__hit kh-sv__hit--line" data-k="hitBr2" data-w="bridge" d="M238 232 C258 210, 272 210, 284 224" ${btn('a converter that stops short')}/>
    ${Object.keys(CALLOUTS).map((k) => `<path class="kh-sv__leader" data-leader="${k}" style="--kh-co-delay:${CALLOUTS[k].delay ?? CALLOUT_DELAY}s" d="${CALLOUTS[k].ld}"/>`).join('')}
    <path class="kh-sv__el kh-sv__pulse" data-k="g5T" pathLength="1" d="${P.g5T}"/>
    <path class="kh-sv__el kh-sv__pulse" data-k="g5arc" pathLength="1" d="${P.g5arc}"/>
  </g>
  <g class="kh-sv__dots" aria-hidden="true">${buildDots(id)}</g>
  <rect class="kh-sv__el kh-sv__hit kh-sv__hit--w" data-k="hitFlow" data-w="flow" x="10" y="52" width="240" height="250" ${btn('the flow side, how the browser lays out')}/>
  <rect class="kh-sv__el kh-sv__hit kh-sv__hit--w" data-k="hitFrames" data-w="frames" x="288" y="52" width="246" height="326" ${btn('the frames side, how Figma lays out')}/>
  ${'' /* Rings wait 2.1s: a seam dot can take 1.85s to arrive on a fling. */}
  ${SEAM_PTS.map((pt) => `<g class="kh-sv__el kh-sv__ring" data-k="ring" data-w="ring" transform="translate(${pt.x} ${pt.y})" style="--d:2.1s" ${btn('a detail that fits neither side')}><circle class="kh-sv__ring-hit" r="12"/><circle class="kh-sv__ring-disc" r="5"/></g>`).join('')}
  ${CROSS ? `<circle class="kh-sv__el kh-sv__hit kh-sv__hit--cross" data-k="hitCross" data-w="cross" cx="${CROSS.to.x}" cy="${CROSS.to.y}" r="11" style="--d:5.6s" ${btn('the dot carried across by hand')}/>` : ''}
  ${label('lbFlow', 16, 44, 'flow', { cls: 'kh-sv__label--cover', anchor: 'start', delay: 1 })}
  ${label('lbFrames', 292, 44, 'frames', { cls: 'kh-sv__label--cover', anchor: 'start', delay: 1 })}
  ${label('anFlow', 16, 364, 'CSS flow: content reflows to fit', { cls: 'kh-sv__label--note', anchor: 'start', delay: 1.6 })}
  ${label('anFrames', 292, 364, 'Auto Layout: frames recalculate', { cls: 'kh-sv__label--note', anchor: 'start', delay: 1.8 })}
  ${label('anRing', SEAM + 14, SEAM_PTS[4].y + 24, 'fits neither', { cls: 'kh-sv__label--note', anchor: 'start', delay: 2 })}
  ${label('anBr', 262, 332, 'a converter stops short', { cls: 'kh-sv__label--note', anchor: 'end', delay: 2.3 })}
  ${CROSS ? label('anCross', Math.min(CROSS.to.x + 40, 534), 390, 'fixed by hand', { cls: 'kh-sv__label--note', anchor: 'end', delay: 5.7 }) : ''}
  ${label('cvS', N.S.x + 4, N.S.y + N.S.h + 16, 'content schemas', { cls: 'kh-sv__label--cover', anchor: 'start', delay: 1.4 })}
  ${label('cvT', N.T.x + 4, N.T.y + N.T.h + 16, '540 Figma variables, 69 by brand', { cls: 'kh-sv__label--cover', anchor: 'start', delay: 1.5 })}
  ${label('cvB', cx(N.SB), N.SB.y + N.SB.h + 16, '25 component families', { cls: 'kh-sv__label--cover', delay: 1.6 })}
  <rect class="kh-sv__el kh-sv__hit kh-sv__hit--cluster" data-k="hitS" data-cluster="S" x="${N.S.x}" y="${N.S.y}" width="${N.S.w}" height="${N.S.h + 20}" ${btn('the content schemas')}/>
  <rect class="kh-sv__el kh-sv__hit kh-sv__hit--cluster" data-k="hitT" data-cluster="T" x="${N.T.x}" y="${N.T.y}" width="${N.T.w}" height="${N.T.h + 20}" ${btn('the 540 brand variables')}/>
  <rect class="kh-sv__el kh-sv__hit kh-sv__hit--cluster" data-k="hitB" data-cluster="B" x="${N.SB.x}" y="${N.SB.y}" width="${N.SB.w}" height="${N.SB.h + 20}" ${btn('the 25 component families')}/>
  <rect class="kh-sv__el kh-sv__hit kh-sv__hit--cluster" data-k="hitF" data-cluster="F" x="336" y="36" width="200" height="330" ${btn('the 297 component variants')}/>
  ${label('dotsLbl', 200, 222, '471 shared · 87.2%', { anchor: 'start', cls: 'kh-sv__dotlbl--shared', delay: 0.6 })}
  ${label('dotsLbl', 520, 222, '69 by brand', { anchor: 'end', cls: 'kh-sv__label--brand kh-sv__dotlbl--brand', delay: 0.9 })}
  <rect class="kh-sv__el kh-sv__hit" data-k="dots" data-dots="shared" x="196" y="206" width="246" height="160" ${btn('the 471 shared variables')}/>
  <rect class="kh-sv__el kh-sv__hit" data-k="dots" data-dots="brand" x="446" y="206" width="80" height="160" ${btn('the 69 brand-specific variables')}/>
  ${label('dotsLbl', 200, 384, 'Each dot is one of 540 Figma variables', { anchor: 'start', cls: 'kh-sv__label--quiet', delay: 1 })}
  ${node('nS', N.S, 'Content schemas')}
  ${node('nT', N.T, 'Design tokens')}
  ${node('nSB', N.SB, 'Storybook')}
  ${node('nF', N.F, 'Figma', ' kh-sv__node--figma')}
  ${sub('sS', N.S, 'the content it holds')}
  ${sub('sS4', N.S, 'no length limit', ' kh-sv__sub--flag')}
  ${sub('sT', N.T, 'colour, type, spacing')}
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
  ${label('lbS', 318, 26, 'reads fields, presets', { delay: 0.5 })}
  ${label('lbT', 318, 394, 'reads variables', { delay: 1 })}
  ${label('lbSB', 357, 160, 'reads geometry', { delay: 1.5 })}
  ${label('lb4T', 318, 394, '0.55 read as 0.55%', { cls: 'kh-sv__label--flag', delay: 1 })}
  ${label('lb4SB', 357, 160, 'line-height', { cls: 'kh-sv__label--flag', delay: 0.5 })}
  ${label('fixLbl', 357, 250, 'the limit flows down', { cls: 'kh-sv__label--fix', delay: 1.6 })}
  ${check('ckS', N.S.x + N.S.w, N.S.y, 'the check against the content schema', 0)}
  ${check('ckT', N.T.x + N.T.w, N.T.y, 'the check against the design tokens', 0.15)}
  ${check('ckSB', N.SB.x + N.SB.w, N.SB.y + N.SB.h, 'the check against Storybook', 0.3)}
  ${CH.map(chainBox).join('')}
  ${label('chNote', 270, 396, 'about 77,000 lines of code, 33,000 of them tests and audits', { cls: 'kh-sv__label--quiet', delay: 2.2 })}
</svg>`;
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
          head.setAttribute('style', `--d:${(delay - HEAD_LAG + DRAW * share).toFixed(2)}s`);
          anchor.after(head);
          anchor = head;
        });
      }
    });
  }

  // ------------------------------------------------------------------------
  // Applying a stage
  // ------------------------------------------------------------------------
  // Keys that were on in the stage last applied to each SVG. An element that
  // stays on across a stage change is `is-held`: its entry delay (--d, the
  // draw-in stagger) is dropped, so a restyle (dim, fault, good, strong)
  // lands at once. Without this, the Storybook read line kept its 1.4s
  // stagger when it turned orange in 4.2, so its "line-height" label was
  // orange a second before the line was; and it stayed orange for 1.4s into
  // stage 5, the healthy-change stage.
  const prevOn = new WeakMap();
  const NAMED = { nS: 'S', nT: 'T', nSB: 'B', nF: 'F' };

  function placeDots(inst, layout) {
    if (inst.svg.dataset.dots === layout) return;
    const fn = LAYOUT[layout];
    const sq = layout === 'clash' || layout === 'clash2';
    inst.dots.forEach((d) => {
      const p = fn(d.dataset.g, Number(d.dataset.i));
      d.style.setProperty('--x', `${p.x.toFixed(1)}px`);
      d.style.setProperty('--y', `${p.y.toFixed(1)}px`);
      // Square dots inside the frames: a class, set once per stage, never
      // animated.
      d.classList.toggle('is-sq', sq && d.classList.contains('kh-sv__dot--R'));
    });
    inst.svg.dataset.dots = layout;
  }

  function applyStage(inst, stageId) {
    const { svg } = inst;
    const spec = STAGES[stageId] || {};
    const sets = {};
    ['on', 'dim', 'faint', 'strong', 'fault', 'good'].forEach((m) => {
      sets[m] = new Set(spec[m] || []);
    });
    // A cluster's label shows while it is unnamed and the dots are settled
    // in their regions; it leaves when its box is drawn around it.
    const named = [];
    Object.keys(NAMED).forEach((k) => {
      if (sets.on.has(k)) named.push(NAMED[k]);
    });
    const layout = spec.dots || 'settled';
    // A formed, unnamed cluster carries its label and answers a hover; the
    // variants' drift has no label (Figma is not in the story yet) but can
    // be asked about.
    (FORMED[layout] || []).forEach((g) => {
      if (named.includes(g)) return;
      if (g !== 'F') sets.on.add(`cv${g}`);
      sets.on.add(`hit${g}`);
    });
    const was = prevOn.get(svg) || new Set();
    prevOn.set(svg, sets.on);
    svg.setAttribute('data-stage', stageId);
    svg.dataset.named = named.join(' ');
    svg.classList.toggle('is-chain', !!spec.chain);

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

    placeDots(inst, layout);
    resizeW(inst, !!spec.resize);
    syncPanels(inst, spec);
    syncChain(inst, spec);
    syncFocusables(svg);
  }

  // Stage w's one shared action: the container resizes. The bucket and the
  // frames narrow (the dots following each in their own way), then widen
  // again, then hold. Geometry goes on the elements as inline style, so the
  // CSS transitions (fluid on the left, stepped on the right) do the motion.
  // Not under reduced motion: the finished, wide state only.
  function setResize(inst, narrow) {
    const { svg } = inst;
    const lay = narrow ? 'clashN' : 'clash';
    const bw = BUCKET.w[lay];
    svg.querySelector('.kh-sv__bucket').style.width = `${bw}px`;
    svg.querySelector('.kh-sv__bucket-lid').style.width = `${bw + 4}px`;
    FRAMES[lay].forEach((f, i) => {
      const wide = FRAMES.clash[i];
      const rect = svg.querySelector(`.kh-sv__frame[data-frame="${i}"]`);
      rect.style.width = `${f.w}px`;
      rect.style.height = `${f.h}px`;
      const dx = `${(f.w - wide.w).toFixed(1)}px`;
      const dy = `${(f.h - wide.h).toFixed(1)}px`;
      svg.querySelectorAll(`.kh-sv__corner[data-frame="${i}"]`).forEach((c) => {
        const k = c.dataset.corner;
        c.style.setProperty('--kh-cnx', k === 'tr' || k === 'br' ? dx : '0px');
        c.style.setProperty('--kh-cny', k === 'br' || k === 'bl' ? dy : '0px');
      });
    });
    placeDots(inst, lay);
  }
  function resizeW(inst, on) {
    (inst.wTimers || []).forEach(clearTimeout);
    inst.wTimers = [];
    inst.dotLayer.classList.remove('is-pour');
    if (!on) {
      if (inst.svg.querySelector('.kh-sv__frame').style.width) setResize(inst, false);
      return;
    }
    if (reduce.matches) {
      setResize(inst, false);
      return;
    }
    // Pour in (CSS: is-pour), settle, narrow, widen, hold.
    inst.dotLayer.classList.add('is-pour');
    setResize(inst, false);
    inst.wTimers.push(setTimeout(() => inst.dotLayer.classList.remove('is-pour'), 1400));
    inst.wTimers.push(setTimeout(() => setResize(inst, true), 1500));
    inst.wTimers.push(setTimeout(() => setResize(inst, false), 2800));
  }

  // Panels: the named one shows over the graphic (wide) and the diagram
  // steps back; the others are hidden and, on wide screens, `inert`, so a
  // hidden studio's buttons are not in the tab order. On narrow screens the
  // panels are in the prose flow and the band slides away for them.
  function syncPanels(inst, spec) {
    const panel = spec.panel || '';
    const g = inst.svg.parentNode;
    g.classList.toggle('is-panel', !!panel && wide.matches);
    g.classList.toggle('is-released', !wide.matches && !!spec.release);
    inst.svg.dataset.panel = wide.matches ? panel : '';
    inst.panels.forEach((p) => {
      const on = p.dataset.scrollyPanel === panel;
      p.classList.toggle('is-on', on);
      p.inert = wide.matches && !on;
    });
  }

  // The closing figures count up on arrival (not under reduced motion) and
  // sit at their final values otherwise, including on the way back out.
  const fmt = new Intl.NumberFormat('en-US');
  function syncChain(inst, spec) {
    inst.timers.forEach(clearTimeout);
    inst.timers = [];
    inst.svg.querySelectorAll('.kh-sv__num[data-num]').forEach((el, i) => {
      const finalText = el.dataset.num;
      if (!spec.chain || reduce.matches) {
        el.textContent = finalText;
        return;
      }
      el.textContent = '0';
      inst.timers.push(setTimeout(() => countUp(inst, el, finalText), 800 + i * 350));
    });
  }
  function countUp(inst, el, finalText) {
    const target = Number(finalText.replace(/[^\d]/g, ''));
    const start = performance.now();
    const tick = (now) => {
      if (!inst.svg.classList.contains('is-chain')) return;
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - (1 - t) ** 3;
      el.textContent = t < 1 ? fmt.format(Math.round(target * eased)) : finalText;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Tab order follows the stage: only buttons that are on screen now (on,
  // and not faded to near-invisible) are reachable; the rest sit at -1 and
  // come back when their stage does. Only while the graphic is actually on
  // screen (`data-live`, set by update()) and showing the diagram rather
  // than a panel: a Tab landing in an off-screen graphic would scroll the
  // page and flip the stage under the reader. Narrow screens keep the tap
  // popups but stay out of the tab order: the 44vh band has no room for a
  // popup beside a focus ring. A focused button that just left the stage is
  // blurred so focus never rests on something invisible.
  function syncFocusables(svg) {
    const live = wide.matches && svg.dataset.live === '1' && !svg.dataset.panel;
    svg.querySelectorAll('[role="button"]').forEach((el) => {
      const reachable = live && el.classList.contains('is-on') && !el.classList.contains('is-faint');
      el.setAttribute('tabindex', reachable ? '0' : '-1');
      if (!reachable && document.activeElement === el) el.blur();
    });
  }

  // ------------------------------------------------------------------------
  // Callouts
  // ------------------------------------------------------------------------
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
      card.style.setProperty('--kh-co-x', `${((place.x / W) * 100).toFixed(2)}%`);
      card.style.setProperty('--kh-co-y', `${((place.y / H) * 100).toFixed(2)}%`);
      card.style.setProperty('--kh-co-w', `${(place.w * 100).toFixed(0)}%`);
      card.style.setProperty('--kh-co-delay', `${place.delay ?? CALLOUT_DELAY}s`);
      card.innerHTML = `${term ? `<span class="kh-scrolly__callout-term">${term.textContent}</span>` : ''}
        <span class="kh-scrolly__callout-text">${body.innerHTML.trim()}</span>
        ${WIREFRAME[key] ? wireframe(WIREFRAME[key]) : ''}`;
      layer.appendChild(card);
    });
    graphic.appendChild(layer);
  }

  // Hover (and tap) tooltips on the node boxes: the same definition text as
  // the asides, without the wireframe.
  function definitionParts(region, key) {
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
  const OBSTACLES = '.kh-sv__node.is-on rect, .kh-sv__check.is-on, .kh-sv__label.is-on, .kh-sv__sub.is-on, .kh-sv__chip.is-on, .kh-sv__dotgroup, .kh-sv__head.is-on';
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
    return el.closest('.kh-sv__check, .kh-sv__hit, .kh-sv__node, .kh-sv__ring');
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
        const def = definitionParts(region, key);
        // If the stage callout is already explaining this box, it yields
        // (fades back) while the popup is open and returns on leave, so the
        // box always answers a hover and the two never show at once.
        return def && { id: `node:${key}`, anchor: t.querySelector('rect'), term: def.term, html: def.html, own: [t], yields: graphic.dataset.callout === key ? key : '' };
      }
      if (t.dataset.w) {
        // Stage w explainers. The area popups anchor on their word labels;
        // the ring, bridge and crossing-dot popups on the element itself.
        const copy = EXPLAINERS.w[t.dataset.w];
        const anchor = t.dataset.w === 'flow' ? svg.querySelector('[data-k="lbFlow"]') : t.dataset.w === 'frames' ? svg.querySelector('[data-k="lbFrames"]') : t.matches('.kh-sv__ring') ? t.querySelector('.kh-sv__ring-disc') : t;
        return copy && { id: `w:${t.dataset.w}:${t.dataset.k}`, anchor: anchor || t, term: copy.term, html: copy.text, own: [t] };
      }
      if (t.matches('.kh-sv__hit--cluster')) {
        const g = t.dataset.cluster;
        const copy = EXPLAINERS.clusters[g];
        const def = copy.aside ? definitionParts(region, copy.aside) : null;
        const html = `${def ? `${def.html} ` : ''}${copy.text}`;
        const own = [t, graphic.querySelector(`.kh-sv__dotgroup--${g}`), svg.querySelector(`[data-k="cv${g}"]`)].filter(Boolean);
        return { id: `cluster:${g}`, anchor: t, term: copy.term, html, own, cluster: g };
      }
      if (t.matches('.kh-sv__hit')) {
        const group = t.dataset.dots;
        const copy = EXPLAINERS.dots[group];
        const own = [...graphic.querySelectorAll('.kh-sv__hit, .kh-sv__dotgroup, [data-k="dotsLbl"]')];
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
      const obstacles = [...graphic.querySelectorAll(OBSTACLES)]
        .filter((el) => !d.own.some((o) => o.contains(el)))
        .map((el) => {
          // Boxes and check marks carry the meaning, so covering them costs
          // most; labels and arrowheads less; the dot field least.
          let w = 1;
          if (el.matches('rect')) w = 20;
          else if (el.matches('.kh-sv__check')) w = 6;
          else if (el.matches('.kh-sv__dotgroup')) w = 0.3;
          if (el.closest('.is-dim, .is-faint')) w *= 0.4;
          return { r: rel(el.getBoundingClientRect()), w };
        });
      // A stage callout on screen, and its leader, are hard obstacles: a
      // popup never sits on a card if any side is clear. If every side
      // overlaps one, the chosen side still minimises the overlap and the
      // card yields (fades back) while the popup is open, see show().
      const hard = [];
      graphic.querySelectorAll('.kh-scrolly__callout.is-on:not(.is-yield)').forEach((c) => {
        hard.push(rel(c.getBoundingClientRect()));
      });
      svg.querySelectorAll('.kh-sv__leader.is-on:not(.is-yield)').forEach((l) => {
        hard.push(rel(l.getBoundingClientRect()));
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
        const onCard = hard.reduce((sum, h) => sum + overlap(r, h), 0);
        return { ...c, x, y, onCard, score: out * 1e4 + onCard * 1e3 + hit - c.room * 0.01, vertical };
      });
      cands.sort((p, q) => p.score - q.score);
      const c = cands[0];
      place.onCard = c.onCard > 0;
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

    const setYield = (key) => {
      graphic.querySelectorAll('.kh-scrolly__callout[data-define], .kh-sv__leader[data-leader]').forEach((el) => {
        el.classList.toggle('is-yield', !!key && (el.dataset.define || el.dataset.leader) === key);
      });
    };

    const hide = () => {
      openId = null;
      viaKeyboard = false;
      tip.classList.remove('is-on');
      setYield('');
      delete svg.dataset.dotFocus;
      delete svg.dataset.clusterFocus;
      if (described) {
        described.removeAttribute('aria-describedby');
        described = null;
      }
    };

    const show = (t, keyboard = false) => {
      const d = t && t.classList.contains('is-on') && !svg.dataset.panel ? describe(t) : null;
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
      if (d.cluster) svg.dataset.clusterFocus = d.cluster;
      else delete svg.dataset.clusterFocus;
      setYield(d.yields || '');
      place(d);
      // Nowhere clear of the stage callout: it yields, as it does to its
      // own box's popup.
      if (place.onCard && graphic.dataset.callout) setYield(graphic.dataset.callout);
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
    // under the reader's hands. Called from update(), the one scroll path.
    const onScroll = () => {
      if (!openId) return;
      if (viaKeyboard && lastShown) place(lastShown);
      else hide();
    };
    const reset = () => {
      current = null;
      hide();
    };
    return { reset, onScroll };
  }

  // Keep the callout layer exactly over the drawn viewBox: the SVG letterboxes
  // (preserveAspectRatio meet), so percentages of the layer are viewBox units.
  // The same measurement publishes the graphic's column to the region, which
  // the fixed panels use to sit exactly over it.
  function placeLayer(inst) {
    const { svg, region } = inst;
    const graphic = svg.parentNode;
    const box = svg.getBoundingClientRect();
    const host = graphic.getBoundingClientRect();
    region.style.setProperty('--kh-scrolly-gx', `${host.left.toFixed(1)}px`);
    region.style.setProperty('--kh-scrolly-gw', `${host.width.toFixed(1)}px`);
    const w = box.width;
    const h = box.height;
    if (!w || !h) return;
    const s = Math.min(w / W, h / H);
    const left = `${box.left - host.left + (w - W * s) / 2}px`;
    const top = `${box.top - host.top + (h - H * s) / 2}px`;
    // The dot layer is viewBox-sized and scaled, so dot positions and drift
    // are in viewBox units like everything in the SVG.
    inst.dotLayer.style.left = left;
    inst.dotLayer.style.top = top;
    inst.dotLayer.style.setProperty('--kh-sv-s', s.toFixed(3));
    const layer = graphic.querySelector('.kh-scrolly__callouts');
    if (!layer) return;
    layer.style.left = left;
    layer.style.top = top;
    layer.style.width = `${W * s}px`;
    layer.style.height = `${H * s}px`;
  }

  // ------------------------------------------------------------------------
  // Regions and steps
  // ------------------------------------------------------------------------
  const instances = [];

  regions.forEach((region, r) => {
    const stepsCol = region.querySelector('.kh-scrolly__steps') || region;
    // Adopt the page cover into the step column, so the title page sits
    // beside the opening state of the graphic.
    const coverSel = region.dataset.scrollyCover;
    const cover = coverSel ? document.querySelector(coverSel) : null;
    if (cover && !region.contains(cover)) {
      cover.setAttribute('data-scrolly-adopted', '');
      stepsCol.insertBefore(cover, stepsCol.firstChild);
    }
    const coverNotes = [...region.querySelectorAll('.kh-scrolly__cover-note[hidden]')];
    coverNotes.forEach((el) => {
      el.hidden = false;
    });

    const graphic = document.createElement('div');
    graphic.className = 'kh-scrolly__graphic';
    // Not aria-hidden: the SVG's "Explain:" buttons are real controls, and
    // focusable content inside an aria-hidden subtree is a WCAG failure.
    // The drawing itself is hidden piece by piece in buildSvg, and the
    // callout layer below.
    graphic.hidden = true;
    graphic.setAttribute('data-pagefind-ignore', '');
    graphic.innerHTML = buildDotLayer() + buildSvg(`kh-sv-${r}`);
    // On wide screens the cover note is a caption under the dot field: a
    // copy inside the graphic, aria-hidden (the original stays in the prose
    // for assistive tech and narrow screens, and is visually hidden on wide
    // ones by CSS). It shows only while the dots are gathering.
    coverNotes.forEach((el) => {
      const cap = el.cloneNode(true);
      cap.className = 'kh-scrolly__dots-caption';
      cap.setAttribute('aria-hidden', 'true');
      graphic.appendChild(cap);
    });
    region.appendChild(graphic);
    const svg = graphic.querySelector('svg');
    const dotLayer = graphic.querySelector('.kh-sv-dots');
    // The dot CSS keys off the SVG's state attributes (data-dots, data-named,
    // the hover focus, live, hidden) and its is-jump / is-chain classes;
    // mirror them onto the layer so one state drives both.
    const MIRROR = ['data-dots', 'data-named', 'data-cluster-focus', 'data-dot-focus', 'data-live', 'data-hidden'];
    const mirrorDots = () => {
      MIRROR.forEach((a) => {
        if (svg.hasAttribute(a)) dotLayer.setAttribute(a, svg.getAttribute(a));
        else dotLayer.removeAttribute(a);
      });
      ['is-jump', 'is-chain'].forEach((c) => dotLayer.classList.toggle(c, svg.classList.contains(c)));
    };
    new MutationObserver(mirrorDots).observe(svg, { attributes: true, attributeFilter: [...MIRROR, 'class'] });
    buildCallouts(region, graphic);
    const tips = setupTips(region, graphic, svg);

    const steps = [];
    region.querySelectorAll('.kh-scrolly__section[data-scrolly-steps]').forEach((section) => {
      const ids = section.dataset.scrollySteps.trim().split(/\s+/);
      const paras = section.querySelectorAll(':scope > p');
      const plain = section.hasAttribute('data-scrolly-plain');
      const short = section.hasAttribute('data-scrolly-short');
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
        if (plain) p.classList.add('kh-scrolly__step--plain');
        if (short) p.classList.add('kh-scrolly__step--short');
        // The first step of a section starts at the section top, so the
        // heading above it already counts as part of that step.
        steps.push({ el: p, anchor: i === 0 && !lead ? section : p, stage: ids[Math.min(i, ids.length - 1)] });
      });
    });
    // Figures and other blocks that are steps in their own right.
    region.querySelectorAll('[data-scrolly-stage]').forEach((el) => {
      el.classList.add('kh-scrolly__step');
      steps.push({ el, anchor: el, stage: el.dataset.scrollyStage });
    });
    // Document order, whatever order they were found in.
    steps.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    if (steps.length) steps[steps.length - 1].el.classList.add('kh-scrolly__step--last');

    const panels = [...region.querySelectorAll('[data-scrolly-panel]')];
    const dots = [...dotLayer.querySelectorAll('.kh-sv__dot')];
    const initial = region.dataset.scrollyInitial || 'cover';
    const inst = {
      region, svg, dotLayer, steps, panels, dots, initial, current: null, active: null, layer: graphic.querySelector('.kh-scrolly__callouts'), tips, timers: [],
    };
    instances.push(inst);

    region.classList.add('kh-scrolly--enhanced');
    // Masks and arrowheads need layout-free geometry only, so the SVG can be
    // decorated while the graphic is still `hidden`.
    decorate(svg);
    // The first frame is the scattered cloud (positions written at build);
    // scrolling does the gathering. On a fresh load at the top the field
    // precipitates in (a seeded, staggered entrance, CSS: is-arriving); a
    // landing mid-page or reduced motion shows the dots simply present.
    svg.dataset.dots = 'cloud';
    // (A hash landing scrolls after this runs, so scrollY alone is not enough.)
    if (window.scrollY < 100 && !window.location.hash && !reduce.matches) {
      dotLayer.classList.add('is-arriving');
      setTimeout(() => dotLayer.classList.remove('is-arriving'), 2500);
    }
    inst.current = initial;
    applyStage(inst, initial);
    // Publish the rendered scale so CSS can cap label sizes: scaled up to
    // fill a wide column, 17px labels rendered at ~26px and out-shouted the
    // prose. The cap only ever shrinks text; on small screens it scales down.
    if ('ResizeObserver' in window) {
      new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (!width || !height) return;
        svg.style.setProperty('--kh-sv-s', Math.min(width / W, height / H).toFixed(3));
        placeLayer(inst);
      }).observe(svg);
    }
  });

  // The ONE switch for a stage callout: its card and its leader line are
  // turned on and off together, from the same condition, with the same
  // delay. The condition: wide layout and the current stage defines a term
  // this region has a card for.
  function syncCallout(inst) {
    if (!inst.layer) return;
    const g = inst.svg.parentNode;
    const spec = STAGES[inst.current] || {};
    const has = spec.define && inst.layer.querySelector(`.kh-scrolly__callout[data-define="${spec.define}"]`);
    const key = wide.matches && has ? spec.define : '';
    if (key === (g.dataset.callout || '')) return;
    g.dataset.callout = key;
    g.querySelectorAll('.kh-scrolly__callout[data-define], .kh-sv__leader[data-leader]').forEach((el) => {
      el.classList.toggle('is-on', (el.dataset.define || el.dataset.leader) === key);
    });
  }

  // The trigger line is a share of a REFERENCE height, not of the live
  // innerHeight: on a phone the address bar collapsing changes innerHeight
  // by ~10% while the layout (vh/svh) stays put, and a line that moved with
  // it flipped the stage under the reader. The reference follows width
  // changes (a real resize or rotation) and only large height changes.
  let refHeight = window.innerHeight;
  let refWidth = window.innerWidth;
  function refreshRef() {
    const dh = Math.abs(window.innerHeight - refHeight) / refHeight;
    if (window.innerWidth !== refWidth || dh > 0.25) {
      refHeight = window.innerHeight;
      refWidth = window.innerWidth;
    }
  }
  function triggerLine() {
    return refHeight * (wide.matches ? 0.55 : 0.66);
  }

  // Hysteresis: a step takes over when its top passes a line slightly ABOVE
  // the trigger, and hands back only when it drops slightly BELOW it, so a
  // few pixels of scroll jitter around the line cannot flip the stage back
  // and forth. Both lines are read from current positions, so a fling still
  // lands on the right step.
  const HYST = 0.04; // of the viewport height, each side of the trigger line

  function update() {
    const y = triggerLine();
    const band = refHeight * HYST;
    instances.forEach((inst) => {
      let fwd = -1;
      let back = -1;
      inst.steps.forEach((s, i) => {
        const top = s.anchor.getBoundingClientRect().top;
        if (top <= y - band) fwd = i;
        if (top <= y + band) back = i;
      });
      const cur = inst.steps.indexOf(inst.active);
      let idx = cur;
      if (cur < fwd) idx = fwd;
      else if (cur > back) idx = back;
      const active = idx >= 0 ? inst.steps[idx] : null;
      const stage = active ? active.stage : inst.initial;
      if (active !== inst.active) {
        inst.steps.forEach((s) => s.el.classList.toggle('is-active', s === active));
        inst.active = active;
      }
      if (stage !== inst.current) {
        inst.current = stage;
        applyStage(inst, stage);
        inst.tips.reset();
      }
      syncCallout(inst);
      inst.tips.onScroll();
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

  // The drift animation pauses with the tab (CSS: [data-hidden]); browsers
  // throttle background tabs anyway, but this is explicit and free.
  document.addEventListener('visibilitychange', () => {
    instances.forEach((inst) => {
      inst.svg.dataset.hidden = document.hidden ? '1' : '0';
    });
  });

  if (wide.addEventListener) {
    wide.addEventListener('change', () => {
      observe();
      // Panels, the band release and the tab order all depend on the layout.
      instances.forEach((inst) => {
        applyStage(inst, inst.current);
        placeLayer(inst);
      });
    });
  }
  window.addEventListener('resize', () => {
    refreshRef();
    window.requestAnimationFrame(() => {
      instances.forEach(placeLayer);
      update();
    });
  }, { passive: true });
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
