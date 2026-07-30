/**
 * compute-semantic-map.mjs
 * ------------------------
 * Projects the semantic search vectors down to two dimensions so the corpus
 * can be drawn as a map, and finds the strong pairwise links between entries.
 * Writes src/site/_data/semanticMap.json.
 *
 * Why classical MDS and not UMAP or t-SNE
 * --------------------------------------
 * Both would separate clusters more crisply, and both would mean a new
 * dependency plus a stochastic layout that moves every build. Classical MDS is
 * deterministic, is about forty lines of plain arithmetic, and preserves large
 * distances well, which is what a "what is near what" map needs. The trade is
 * that it preserves *global* structure at the expense of tight local clusters:
 * broad neighbourhoods are trustworthy, exact adjacency less so.
 *
 * What the axes mean: nothing. MDS axes are whatever directions carry the most
 * variance; they have no interpretation and are not labelled on the page. Only
 * relative distance is meaningful, and only roughly.
 *
 * Same one-build lag as compute-related.mjs: embeddings are computed from the
 * built HTML, and `yarn clean` wipes build/, so the output is committed and
 * each build publishes what the previous one measured.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';

const VECTORS = 'build/semantic-search/vectors.json';
const POSTS_DIR = 'src/site/posts';
const OUT = 'src/site/_data/semanticMap.json';
const EDGE_MIN = 0.6;   // only draw a link where the pair is genuinely close
const MAX_EDGES_PER_NODE = 3;

if (!existsSync(VECTORS)) {
  console.error(`compute-semantic-map: ${VECTORS} not found. Run \`yarn embeddings\` first.`);
  process.exit(0);
}

const isEntry = (url) => /^\/posts\/[^/]+/.test(url) || /^\/work\/\d{4}\/[^/]+/.test(url);

// ---- gather one unit vector per entry -------------------------------------
const { chunks } = JSON.parse(readFileSync(VECTORS, 'utf-8'));
const byUrl = new Map();
for (const c of chunks) {
  if (!c.url || !Array.isArray(c.embedding) || !isEntry(c.url)) continue;
  if (!byUrl.has(c.url)) byUrl.set(c.url, { title: c.title, sum: null, n: 0 });
  const e = byUrl.get(c.url);
  if (!e.sum) e.sum = new Array(c.embedding.length).fill(0);
  for (let i = 0; i < c.embedding.length; i += 1) e.sum[i] += c.embedding[i];
  e.n += 1;
  if (!e.title && c.title) e.title = c.title;
}

const nodes = [];
for (const [url, e] of byUrl) {
  if (!e.sum || !e.n) continue;
  const v = e.sum.map((x) => x / e.n);
  const mag = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
  if (!mag) continue;
  nodes.push({ url, title: e.title || url, v: v.map((x) => x / mag) });
}

// ---- attach a primary topic, for colouring and for cluster labels ---------
// Read straight from frontmatter: the vectors know nothing about taxonomy.
const topicByUrl = new Map();
const topicByTitle = new Map();
for (const file of readdirSync(POSTS_DIR).filter((f) => f.endsWith('.njk'))) {
  const src = readFileSync(join(POSTS_DIR, file), 'utf-8');
  const fm = src.split('---')[1] || '';
  const block = fm.match(/^topics:\s*\n((?:\s+-\s+.*\n)+)/m);
  if (!block) continue;
  const first = (block[1].match(/-\s+(.+)/) || [])[1];
  if (!first) continue;
  // Parent only: `AI > Claude Code` groups under AI.
  const topic = String(first).split('>')[0].trim();
  const base = file.replace(/\.njk$/, '');
  topicByUrl.set(base, topic);
  // Work entries use custom permalinks whose slug need not match the source
  // filename. Title is the stable join shared by the source and vector data.
  const title = ((fm.match(/^title:\s*['"]?(.+?)['"]?\s*$/m) || [])[1] || '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/&(?:#39|apos);/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
  if (title) topicByTitle.set(title, topic);
}
for (const n of nodes) {
  // Legacy post URLs end in `.html`; source basenames do not. Custom /work/
  // permalinks may differ entirely, so fall back to the entry title.
  const slug = n.url.replace(/\/$/, '').split('/').pop().replace(/\.html$/, '');
  const decodedTitle = String(n.title || '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .trim();
  n.topic = topicByUrl.get(slug) || topicByTitle.get(decodedTitle) || '';
}

const N = nodes.length;
if (N < 3) {
  console.error('compute-semantic-map: not enough entries to project.');
  process.exit(0);
}

// ---- cosine similarity, then classical MDS -------------------------------
const sim = Array.from({ length: N }, () => new Array(N).fill(0));
for (let i = 0; i < N; i += 1) {
  for (let j = i; j < N; j += 1) {
    let d = 0;
    for (let k = 0; k < nodes[i].v.length; k += 1) d += nodes[i].v[k] * nodes[j].v[k];
    sim[i][j] = d;
    sim[j][i] = d;
  }
}

// Squared distance, double-centred: B = -0.5 * J D² J
const d2 = Array.from({ length: N }, (_, i) =>
  Array.from({ length: N }, (_, j) => {
    const dist = Math.max(0, 1 - sim[i][j]);
    return dist * dist;
  }));
const rowMean = d2.map((r) => r.reduce((a, b) => a + b, 0) / N);
const grandMean = rowMean.reduce((a, b) => a + b, 0) / N;
const B = Array.from({ length: N }, (_, i) =>
  Array.from({ length: N }, (_, j) => -0.5 * (d2[i][j] - rowMean[i] - rowMean[j] + grandMean)));

// Power iteration for the leading eigenvector, then deflate and repeat.
// Deterministic seed so the layout does not shift between builds.
function leadingEigen(M, iterations = 500) {
  let v = Array.from({ length: N }, (_, i) => Math.sin(i + 1));
  let norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
  v = v.map((x) => x / norm);
  let lambda = 0;
  for (let it = 0; it < iterations; it += 1) {
    const w = new Array(N).fill(0);
    for (let i = 0; i < N; i += 1) {
      let s = 0;
      for (let j = 0; j < N; j += 1) s += M[i][j] * v[j];
      w[i] = s;
    }
    norm = Math.sqrt(w.reduce((a, b) => a + b * b, 0));
    if (!norm) break;
    const next = w.map((x) => x / norm);
    lambda = norm;
    const delta = next.reduce((a, x, i) => a + Math.abs(x - v[i]), 0);
    v = next;
    if (delta < 1e-10) break;
  }
  return { vector: v, value: lambda };
}

const e1 = leadingEigen(B);
for (let i = 0; i < N; i += 1) {
  for (let j = 0; j < N; j += 1) B[i][j] -= e1.value * e1.vector[i] * e1.vector[j];
}
const e2 = leadingEigen(B);

const s1 = Math.sqrt(Math.max(0, e1.value));
const s2 = Math.sqrt(Math.max(0, e2.value));
nodes.forEach((n, i) => {
  n.x = e1.vector[i] * s1;
  n.y = e2.vector[i] * s2;
});

// Normalise into a 0..1 box so the template can scale to any viewBox.
const xs = nodes.map((n) => n.x);
const ys = nodes.map((n) => n.y);
const minX = Math.min(...xs); const spanX = Math.max(...xs) - minX || 1;
const minY = Math.min(...ys); const spanY = Math.max(...ys) - minY || 1;
nodes.forEach((n) => {
  n.x = Math.round(((n.x - minX) / spanX) * 1000) / 1000;
  n.y = Math.round(((n.y - minY) / spanY) * 1000) / 1000;
});

// ---- strong links only ---------------------------------------------------
const edges = [];
for (let i = 0; i < N; i += 1) {
  const near = [];
  for (let j = 0; j < N; j += 1) {
    if (i === j || sim[i][j] < EDGE_MIN) continue;
    near.push({ j, s: sim[i][j] });
  }
  near.sort((a, b) => b.s - a.s);
  near.slice(0, MAX_EDGES_PER_NODE).forEach(({ j, s }) => {
    // One edge per pair, whichever direction found it first.
    const a = Math.min(i, j); const b = Math.max(i, j);
    if (!edges.some((e) => e.a === a && e.b === b)) {
      edges.push({ a, b, s: Math.round(s * 100) / 100 });
    }
  });
}

// ---- alternative layouts, for comparison ---------------------------------
// A) Force-directed (Fruchterman-Reingold), seeded from the MDS coordinates so
//    it is deterministic across builds. Included mostly so the hairball can be
//    judged against the alternatives rather than assumed to be best.
// Seeded on a circle, not from the MDS coordinates. Seeding from MDS looks
// tempting but the layout never escapes that starting axis: measured, it left
// the middle 50% of nodes spanning 0.44 of the width but only 0.17 of the
// height, a flattened smear. A circle gives the simulation no prior.
const fr = nodes.map((_, i) => {
  const a = (2 * Math.PI * i) / nodes.length;
  return { x: 50 + 35 * Math.cos(a), y: 50 + 35 * Math.sin(a), dx: 0, dy: 0 };
});
const adj = Array.from({ length: N }, () => []);
edges.forEach((e) => { adj[e.a].push(e.b); adj[e.b].push(e.a); });
{
  // Work in a 0..100 box rather than 0..1: at unit scale the repulsion term
  // k^2/d swamps everything and every node ends up flattened against a wall.
  const SC = 100;
  // Slightly larger k than textbook FR: spreads the linked cluster so it is
  // not a single dark blob at this node count.
  // Textbook Fruchterman-Reingold k is sqrt(area/N); at this node count that
  // collapses into a single blob. 7x was chosen by sweeping the parameter and
  // measuring how much of the frame the middle 50% of nodes occupy, rather
  // than by eye: it lands at 0.42 of the width and 0.48 of the height.
  const k = Math.sqrt((SC * SC) / N) * 7;
  let temp = SC / 12;
  for (let it = 0; it < 450; it += 1) {
    fr.forEach((p) => { p.dx = 0; p.dy = 0; });
    for (let i = 0; i < N; i += 1) {
      for (let j = i + 1; j < N; j += 1) {
        let dx = fr[i].x - fr[j].x;
        let dy = fr[i].y - fr[j].y;
        const d = Math.hypot(dx, dy) || 0.01;
        const rep = (k * k) / d;
        dx = (dx / d) * rep; dy = (dy / d) * rep;
        fr[i].dx += dx; fr[i].dy += dy;
        fr[j].dx -= dx; fr[j].dy -= dy;
      }
    }
    edges.forEach((e) => {
      let dx = fr[e.a].x - fr[e.b].x;
      let dy = fr[e.a].y - fr[e.b].y;
      const d = Math.hypot(dx, dy) || 0.01;
      const att = (d * d) / k;
      dx = (dx / d) * att; dy = (dy / d) * att;
      fr[e.a].dx -= dx; fr[e.a].dy -= dy;
      fr[e.b].dx += dx; fr[e.b].dy += dy;
    });
    // Mild pull to the centre keeps disconnected nodes from drifting off,
    // which is what a hard clamp was doing badly.
    fr.forEach((p) => {
      // Gravity has to be strong enough to bring unconnected nodes back in;
      // too weak and they drift to the corners while the linked bulk collapses.
      p.dx += (SC / 2 - p.x) * 0.04;
      p.dy += (SC / 2 - p.y) * 0.04;
      const d = Math.hypot(p.dx, p.dy) || 0.01;
      p.x += (p.dx / d) * Math.min(d, temp);
      p.y += (p.dy / d) * Math.min(d, temp);
    });
    temp *= 0.985;
  }
  const fx = fr.map((p) => p.x); const fy = fr.map((p) => p.y);
  const nx = Math.min(...fx); const sx = (Math.max(...fx) - nx) || 1;
  const ny = Math.min(...fy); const sy = (Math.max(...fy) - ny) || 1;
  nodes.forEach((n, i) => {
    n.fx = Math.round(((fr[i].x - nx) / sx) * 1000) / 1000;
    n.fy = Math.round(((fr[i].y - ny) / sy) * 1000) / 1000;
  });
}

// B) An ordering for the matrix and arc views: group by primary topic, largest
//    group first, and order within a group by how connected each entry is.
//    A node-link diagram hides density; a matrix shows it exactly.
const order = (() => {
  const groups = new Map();
  nodes.forEach((n, i) => {
    const key = n.topic || 'unfiled';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  });
  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .flatMap(([topic, idx]) => {
      idx.sort((p, q) => adj[q].length - adj[p].length);
      return idx.map((i) => ({ i, topic }));
    });
})();

const out = {
  generated: 'classical MDS on cosine distance; axes carry no meaning',
  edgeMin: EDGE_MIN,
  nodes: nodes.map((n) => ({
    url: n.url, title: n.title, topic: n.topic, x: n.x, y: n.y, fx: n.fx, fy: n.fy,
    degree: adj[nodes.indexOf(n)].length
  })),
  order,
  edges
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
console.log(
  `compute-semantic-map: ${N} entries projected, ${edges.length} links at similarity >= ${EDGE_MIN}, wrote ${OUT}`
);
