/**
 * compute-related.mjs
 * -------------------
 * Derives "closest in meaning" neighbours for each entry from the semantic
 * search vectors, and writes them to src/site/_data/related.json.
 *
 * Why this exists: the site already computes 384-dimension embeddings for
 * semantic search. Those vectors know which posts are *about* similar things,
 * which is different from, and often better than, which posts share an
 * editorial topic tag. This turns that latent signal into navigation without
 * any new model, index or runtime cost.
 *
 * Ordering, and the one-build lag
 * -------------------------------
 * generate-embeddings.mjs reads the BUILT HTML, so it must run after Eleventy;
 * and `yarn clean` deletes build/ at the start of every build. The neighbours
 * therefore cannot be computed and consumed within a single pass.
 *
 * So the output is written into src/site/_data/ and committed. Each build
 * publishes the neighbours computed at the end of the previous one. In
 * practice this only matters for a brand new post, which has no neighbours
 * until the next build. Everything else stays correct, and the file is plain
 * JSON that can be inspected in a diff.
 *
 * Run: yarn related   (wired into `yarn build` after `yarn embeddings`)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const VECTORS = 'build/semantic-search/vectors.json';
const OUT = 'src/site/_data/related.json';
const NEIGHBOURS = 3;
// Below this cosine similarity the "closest" entry is not meaningfully close,
// and offering it as a suggestion would be noise dressed up as a signal.
// Chosen from the corpus: the median entry's best match scores 0.70, and at
// 0.55 eighteen entries keep no neighbour at all. That is the right outcome
// for a genuinely singular post; padding it with a 0.50 match to something
// unrelated would be worse than showing nothing.
const MIN_SIMILARITY = 0.55;

if (!existsSync(VECTORS)) {
  console.error(`compute-related: ${VECTORS} not found. Run \`yarn embeddings\` first.`);
  process.exit(0); // not fatal: a build without it simply renders no neighbours
}

const { chunks } = JSON.parse(readFileSync(VECTORS, 'utf-8'));

// Only real entries. The vectors cover every page, so without this the
// nearest neighbour of a post is often an index page: /blog/ is "about"
// everything, so it sits near everything and drowns out real matches.
const isEntry = (url) => /^\/posts\/[^/]+/.test(url) || /^\/work\/\d{4}\/[^/]+/.test(url);

// Average the chunk vectors per URL, so each entry is one point in the space.
const byUrl = new Map();
for (const c of chunks) {
  if (!c.url || !Array.isArray(c.embedding)) continue;
  if (!isEntry(c.url)) continue;
  if (!byUrl.has(c.url)) byUrl.set(c.url, { title: c.title, sum: null, n: 0 });
  const e = byUrl.get(c.url);
  if (!e.sum) e.sum = new Array(c.embedding.length).fill(0);
  for (let i = 0; i < c.embedding.length; i += 1) e.sum[i] += c.embedding[i];
  e.n += 1;
  if (!e.title && c.title) e.title = c.title;
}

// Normalise to unit length so cosine similarity is a plain dot product.
const entries = [];
for (const [url, e] of byUrl) {
  if (!e.sum || !e.n) continue;
  const v = e.sum.map((x) => x / e.n);
  const mag = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
  if (!mag) continue;
  entries.push({ url, title: e.title || url, v: v.map((x) => x / mag) });
}

const related = {};
let withNeighbours = 0;

for (const a of entries) {
  const scored = [];
  for (const b of entries) {
    if (a.url === b.url) continue;
    let dot = 0;
    for (let i = 0; i < a.v.length; i += 1) dot += a.v[i] * b.v[i];
    if (dot >= MIN_SIMILARITY) scored.push({ url: b.url, title: b.title, score: dot });
  }
  scored.sort((x, y) => y.score - x.score);
  const top = scored.slice(0, NEIGHBOURS).map((s) => ({
    url: s.url,
    title: s.title,
    // Rounded: the exact float is false precision for what is a soft signal.
    score: Math.round(s.score * 100) / 100
  }));
  if (top.length) {
    related[a.url] = top;
    withNeighbours += 1;
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(related, null, 1)}\n`);

console.log(
  `compute-related: ${entries.length} entries, ${withNeighbours} with neighbours ` +
  `at similarity >= ${MIN_SIMILARITY}, wrote ${OUT}`
);
