/**
 * Build experimental narrative views from the generated semantic corpus map.
 *
 * This is deliberately separate from compute-semantic-map.mjs. The semantic
 * map answers "what is close?"; this file adds editorial context (date, career
 * chapter and content type) and prepares several possible stories. It is a lab,
 * not production data, and its ignored output can be removed without touching
 * the search system. The production build regenerates it before the final
 * Eleventy pass.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const MAP = 'src/site/_data/semanticMap.json';
const VECTORS = 'build/semantic-search/vectors.json';
const BUILD = 'build';
const POSTS = 'src/site/posts';
const OUT = 'src/site/_data/storyLab.json';

if (!existsSync(MAP)) {
  console.error(`story-lab: ${MAP} not found; run yarn semantic-map first.`);
  process.exit(0);
}

const decode = (value = '') => String(value)
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/&ndash;/g, '–')
  .replace(/&mdash;/g, '—')
  .replace(/&hellip;/g, '…')
  .replace(/<[^>]*>/g, '')
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

const unquote = (value = '') => String(value).trim().replace(/^(['"])(.*)\1$/, '$2');
const titleKey = (value = '') => decode(unquote(value)).toLowerCase();
const cleanSnippet = (value = '') => {
  let text = decode(value)
    .replace(/&middot;/g, '·')
    .replace(/&hairsp;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (/^[a-z]/.test(text)) text = `…${text}`;
  if (text.length > 220) text = `${text.slice(0, 217).replace(/\s+\S*$/, '')}…`;
  return text;
};

function blockList(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s+.*\\n?)+)`, 'm'));
  if (!match) return [];
  return [...match[1].matchAll(/^\s+-\s+(.+)$/gm)].map((m) => unquote(m[1]));
}

const sourceByTitle = new Map();
for (const file of readdirSync(POSTS).filter((name) => /\.(njk|md)$/.test(name))) {
  const source = readFileSync(join(POSTS, file), 'utf8');
  const frontmatter = (source.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
  const title = (frontmatter.match(/^title:\s*(.+)$/m) || [])[1] || '';
  const date = (frontmatter.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m) || [])[1]
    || `${file.slice(0, 4)}-01-01`;
  const tags = blockList(frontmatter, 'tags');
  const topics = blockList(frontmatter, 'topics');
  const series = unquote((frontmatter.match(/^series:\s*(.+)$/m) || [])[1] || '');
  const kind = file.includes('impact-story') || tags.includes('impact-stories')
    ? 'impact'
    : tags.includes('digesting') ? 'digesting' : 'article';
  sourceByTitle.set(titleKey(title), { date, file, tags, topics, series, kind, source });
}

const careers = [
  { key: 'drs', label: 'DRS', start: '2011-02-01', end: '2015-06-30' },
  { key: 'ebi', label: 'EMBL-EBI', start: '2015-07-01', end: '2018-05-31' },
  { key: 'embl', label: 'EMBL', start: '2018-06-01', end: '2021-12-31' },
  { key: 'undrr', label: 'UNDRR', start: '2022-01-01', end: '2026-12-31' }
];

function careerFor(date) {
  return careers.find((career) => date >= career.start && date <= career.end) || careers[0];
}

function fallbackDate(node) {
  const postDate = node.url.match(/\/posts\/(\d{4})(\d{2})(\d{2})-/);
  if (postDate) return `${postDate[1]}-${postDate[2]}-${postDate[3]}`;
  const workYear = node.url.match(/\/work\/(\d{4})\//);
  return workYear ? `${workYear[1]}-07-01` : '2011-02-01';
}

const map = JSON.parse(readFileSync(MAP, 'utf8'));
const vectorCorpus = existsSync(VECTORS) ? JSON.parse(readFileSync(VECTORS, 'utf8')) : null;
const nodes = map.nodes.map((node, index) => {
  const source = sourceByTitle.get(titleKey(node.title)) || {};
  const date = source.date || fallbackDate(node);
  const career = careerFor(date);
  // Prefer the map's topic, but recover it from source when the map's legacy
  // URL-to-filename join misses `.html` and custom /work/ permalinks.
  const topic = node.topic || String((source.topics || [])[0] || '').split('>')[0].trim();
  return {
    index,
    url: node.url,
    title: decode(node.title),
    topic,
    date,
    year: Number(date.slice(0, 4)),
    career: career.key,
    careerLabel: career.label,
    kind: source.kind || (node.url.startsWith('/work/') ? 'impact' : 'article'),
    series: source.series || ''
  };
});

const minDate = Date.parse('2011-01-01T00:00:00Z');
const maxDate = Date.parse('2027-01-01T00:00:00Z');
const plotLeft = 72;
const plotRight = 1128;
const plotWidth = plotRight - plotLeft;
const xForDate = (date) => {
  const ratio = (Date.parse(`${date}T00:00:00Z`) - minDate) / (maxDate - minDate);
  return Math.round((plotLeft + Math.max(0, Math.min(1, ratio)) * plotWidth) * 10) / 10;
};

nodes.forEach((node) => {
  node.x = xForDate(node.date);
  node.xPercent = Math.round(((node.x - plotLeft) / plotWidth) * 1000) / 10;
});

function sourceLinksTo(from, to) {
  const source = (sourceByTitle.get(titleKey(from.title)) || {}).source || '';
  const targetMeta = sourceByTitle.get(titleKey(to.title)) || {};
  const base = String(targetMeta.file || '').replace(/\.(njk|md)$/, '');
  const tokens = [
    to.url,
    to.url.replace(/\/$/, ''),
    base ? `/posts/${base}.html` : '',
    base ? `/posts/${base}/` : ''
  ].filter(Boolean);
  return tokens.some((token) => source.includes(token));
}

const allEdges = map.edges.map((edge) => {
  const a = nodes[edge.a];
  const b = nodes[edge.b];
  const first = a.date <= b.date ? a : b;
  const second = first === a ? b : a;
  const gapDays = Math.abs(Date.parse(`${a.date}T00:00:00Z`) - Date.parse(`${b.date}T00:00:00Z`)) / 86400000;
  const gapYears = Math.round((gapDays / 365.25) * 10) / 10;
  const sameSeries = Boolean(a.series && b.series && a.series.toLowerCase() === b.series.toLowerCase());
  const companion = sameSeries || (a.kind === 'impact' && b.kind !== 'impact') || (b.kind === 'impact' && a.kind !== 'impact');
  const explicitLink = sourceLinksTo(a, b) || sourceLinksTo(b, a);
  const narrativeClass = sameSeries
    ? 'series'
    : gapYears >= 3 && explicitLink ? 'explicit-return'
      : gapYears >= 3 ? 'uncited-echo'
        : gapYears < 1 ? 'contemporary-cluster' : 'midrange';
  return {
    a: first.index,
    b: second.index,
    first,
    second,
    score: edge.s,
    gapYears,
    crossCareer: a.career !== b.career,
    companion,
    explicitLink,
    narrativeClass
  };
});

const returnEdges = allEdges
  .filter((edge) => edge.gapYears >= 3 && !edge.companion)
  .sort((a, b) => b.gapYears - a.gapYears || b.score - a.score)
  .map((edge, index) => {
    const x1 = edge.first.x;
    const x2 = edge.second.x;
    const span = Math.max(12, x2 - x1);
    const base = 250;
    const lift = Math.min(205, 34 + span * 0.33 + (index % 3) * 5);
    return {
      ...edge,
      x1,
      x2,
      fromPercent: edge.first.xPercent,
      toPercent: edge.second.xPercent,
      path: `M ${x1} ${base} Q ${Math.round(((x1 + x2) / 2) * 10) / 10} ${Math.round((base - lift) * 10) / 10} ${x2} ${base}`
    };
  });

const practiceEdges = allEdges
  .filter((edge) => (edge.first.kind === 'impact') !== (edge.second.kind === 'impact'))
  .map((edge) => {
    const article = edge.first.kind === 'impact' ? edge.second : edge.first;
    const impact = edge.first.kind === 'impact' ? edge.first : edge.second;
    const middle = Math.round(((article.x + impact.x) / 2) * 10) / 10;
    return {
      ...edge,
      article,
      impact,
      path: `M ${article.x} 78 C ${middle} 112 ${middle} 158 ${impact.x} 192`
    };
  })
  .sort((a, b) => b.score - a.score);

const careerBands = careers.map((career) => ({
  ...career,
  x: xForDate(career.start),
  width: Math.max(1, xForDate(career.end) - xForDate(career.start)),
  entries: nodes.filter((node) => node.career === career.key).length,
  tagged: nodes.filter((node) => node.career === career.key && node.topic).length
}));

const topicCounts = new Map();
nodes.forEach((node) => {
  if (node.topic) topicCounts.set(node.topic, (topicCounts.get(node.topic) || 0) + 1);
});
const topTopics = [...topicCounts.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 10)
  .map(([topic]) => topic);

const maxTopicCareerCount = Math.max(1, ...topTopics.flatMap((topic) => careers.map((career) =>
  nodes.filter((node) => node.topic === topic && node.career === career.key).length
)));
const topicCareer = topTopics.map((topic) => ({
  topic,
  total: topicCounts.get(topic),
  cells: careers.map((career) => {
    const count = nodes.filter((node) => node.topic === topic && node.career === career.key).length;
    const denominator = Math.max(1, nodes.filter((node) => node.career === career.key && node.topic).length);
    // Fill is globally comparable post volume. Square-root scaling keeps the
    // many low counts distinguishable without letting the largest cell swamp
    // the table; chapter share remains available as the printed percentage.
    const strength = count === 0 ? 0 : Math.round(Math.sqrt(count / maxTopicCareerCount) * 55);
    return { career: career.key, label: career.label, count, share: Math.round((count / denominator) * 100), strength };
  })
}));

const years = Array.from({ length: 14 }, (_, index) => 2013 + index);
const peakByTopic = new Map(topTopics.map((topic) => [topic, Math.max(1, ...years.map((year) =>
  nodes.filter((node) => node.topic === topic && node.year === year).length
))]));
const topicYears = topTopics.map((topic) => ({
  topic,
  total: topicCounts.get(topic),
  cells: years.map((year) => {
    const count = nodes.filter((node) => node.topic === topic && node.year === year).length;
    return { year, count, strength: Math.round((count / peakByTopic.get(topic)) * 100) };
  })
}));

const scatter = allEdges.map((edge) => ({
  x: Math.round((72 + (Math.min(edge.gapYears, 10) / 10) * 1040) * 10) / 10,
  y: Math.round((228 - ((edge.score - map.edgeMin) / (0.92 - map.edgeMin)) * 190) * 10) / 10,
  gapYears: edge.gapYears,
  score: edge.score,
  crossCareer: edge.crossCareer,
  companion: edge.companion,
  first: edge.first,
  second: edge.second
}));

const candidateTrails = [
  {
    name: 'Content as infrastructure',
    match: ['Better corporate design through information architecture', 'Introducing the Content-Action Model for Web Systems', 'Decoupling content from platforms across 80 properties', 'Content architecture: the delivery problem']
  },
  {
    name: 'A typeface for data',
    match: ['What if: A web font for data', 'A data font, from the inside out']
  },
  {
    name: 'Rebuilding the personal site',
    match: ['A new site for little reason', 'Moving from Panini to Eleventy', 'A simpler, faster site: moving to pure Eleventy v3']
  },
  {
    name: 'Reusable systems becoming organizational systems',
    match: ['Faster scientific websites through reusability', 'EMBL-EBI Day: Visual Framework 2.0 outreach', 'Enabling a more dynamic EMBL online', 'Building a component library adopted across 50+ scientific properties']
  }
];
const trails = candidateTrails.map((trail) => ({
  name: trail.name,
  nodes: trail.match
    .map((title) => nodes.find((node) => node.title === title))
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))
})).filter((trail) => trail.nodes.length >= 2);

const counts = {
  entries: nodes.length,
  links: allEdges.length,
  tagged: nodes.filter((node) => node.topic).length,
  returnLinks: returnEdges.length,
  companions: allEdges.filter((edge) => edge.companion).length,
  explicitLinks: allEdges.filter((edge) => edge.explicitLink).length,
  sameYear: allEdges.filter((edge) => edge.gapYears < 1).length,
  crossCareer: allEdges.filter((edge) => edge.crossCareer).length
};

// ---- the external web cited by entries -----------------------------------
// Read rendered <article> elements rather than source text so Markdown links,
// raw HTML and digest source buttons are counted consistently. Repeated links
// remain in the raw total, while domain recurrence is ranked by distinct entry
// count so one reference-heavy technical post cannot dominate the story.
const ownHosts = new Set(['allaboutken.com', 'www.allaboutken.com', 'feedback.allaboutken.com']);
const suffixClasses = [
  { key: 'commercial', label: '.com / .co.*' },
  { key: 'organization', label: '.org / .org.*' },
  { key: 'academic', label: '.edu / .ac.*' },
  { key: 'government', label: '.gov / .go.*' },
  { key: 'developer', label: '.dev / .io / .ai / .app' },
  { key: 'country-code', label: 'other country-code' },
  { key: 'other', label: 'other suffixes' }
];

function suffixClass(host) {
  if (/(?:^|\.)(?:edu|ac)\.[a-z]{2}$/.test(host) || host.endsWith('.edu')) return 'academic';
  if (/(?:^|\.)(?:gov|go)\.[a-z]{2}$/.test(host) || host.endsWith('.gov') || host === 'europa.eu') return 'government';
  if (host.endsWith('.org') || /\.org\.[a-z]{2}$/.test(host)) return 'organization';
  if (host.endsWith('.com') || /\.(?:com|co)\.[a-z]{2}$/.test(host)) return 'commercial';
  if (/\.(?:dev|io|ai|app)$/.test(host)) return 'developer';
  if (/\.[a-z]{2}$/.test(host)) return 'country-code';
  return 'other';
}

function builtFileFor(url) {
  return url.endsWith('/') ? join(BUILD, url, 'index.html') : join(BUILD, url);
}

const normalizedEntryPath = (value) => {
  try {
    return decodeURIComponent(value).replace(/\/index\.html$/, '/').replace(/\/$/, '').replace(/\.html$/, '');
  } catch {
    return String(value).replace(/\/$/, '').replace(/\.html$/, '');
  }
};
const nodeByPath = new Map(nodes.map((node) => [normalizedEntryPath(node.url), node]));
const authoredPairs = new Map();
const domains = new Map();
const suffixByCareer = new Map(careers.map((career) => [career.key, new Map()]));
const linkedEntries = new Set();
let outboundLinks = 0;
let domainMentions = 0;
for (const node of nodes) {
  const file = builtFileFor(node.url);
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  const article = (html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) || [])[1] || '';
  const hostsInEntry = new Set();
  for (const match of article.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    try {
      const target = new URL(match[1].replace(/&amp;/g, '&'), `https://www.allaboutken.com${node.url}`);
      if (target.hostname === 'allaboutken.com' || target.hostname === 'www.allaboutken.com') {
        const linkedNode = nodeByPath.get(normalizedEntryPath(target.pathname));
        if (linkedNode && linkedNode.index !== node.index) {
          const key = [node.index, linkedNode.index].sort((a, b) => a - b).join('|');
          if (!authoredPairs.has(key)) authoredPairs.set(key, { a: node.index, b: linkedNode.index, mentions: 0 });
          authoredPairs.get(key).mentions += 1;
        }
        continue;
      }
      const host = target.hostname.toLowerCase().replace(/^www\./, '');
      if (!/^https?:$/.test(target.protocol) || ownHosts.has(host)) continue;
      outboundLinks += 1;
      linkedEntries.add(node.url);
      hostsInEntry.add(host);
      if (!domains.has(host)) domains.set(host, { host, href: target.origin, links: 0, entries: new Set() });
      const domain = domains.get(host);
      domain.links += 1;
      domain.entries.add(node.url);
    } catch {
      // Relative, malformed and non-web hrefs are outside this experiment.
    }
  }
  for (const host of hostsInEntry) {
    domainMentions += 1;
    const key = suffixClass(host);
    const careerCounts = suffixByCareer.get(node.career);
    careerCounts.set(key, (careerCounts.get(key) || 0) + 1);
  }
}

const topDomains = [...domains.values()]
  .map((domain) => ({ ...domain, entries: domain.entries.size }))
  .sort((a, b) => b.entries - a.entries || b.links - a.links || a.host.localeCompare(b.host))
  .slice(0, 15);
const maxDomainEntries = Math.max(1, ...topDomains.map((domain) => domain.entries));
topDomains.forEach((domain) => { domain.bar = Math.round((domain.entries / maxDomainEntries) * 100); });

const maxSuffixMentions = Math.max(1, ...careers.flatMap((career) =>
  suffixClasses.map((item) => suffixByCareer.get(career.key).get(item.key) || 0)
));
const suffixCareer = suffixClasses.map((item) => ({
  ...item,
  cells: careers.map((career) => {
    const countsForCareer = suffixByCareer.get(career.key);
    const count = countsForCareer.get(item.key) || 0;
    const total = [...countsForCareer.values()].reduce((sum, value) => sum + value, 0);
    return {
      career: career.key,
      label: career.label,
      count,
      share: total ? Math.round((count / total) * 100) : 0,
      strength: count ? Math.round(Math.sqrt(count / maxSuffixMentions) * 55) : 0
    };
  })
}));

const outbound = {
  links: outboundLinks,
  linkedEntries: linkedEntries.size,
  uniqueHosts: domains.size,
  domainMentions,
  topDomains,
  suffixCareer
};

// ---- two radial readings of the same topic-and-time layout ---------------
// Angle is an editorial topic family and distance from the centre is
// panel-specific cross-family degree: hubs move inward.
// Curves are bundled through one inner anchor per family, borrowing the radial
// family-tree grammar without implying ancestry. The paired panels keep
// authored cross-links and modelled neighbours comparable without conflating
// them into one relationship type.
const radialGroupDefs = [
  { key: 'ai', label: 'AI', topics: ['AI', 'context engineering'] },
  { key: 'content', label: 'Content', topics: ['content strategy', 'content architecture', 'editorial workflow'] },
  { key: 'ia', label: 'IA / UX', topics: ['information architecture', 'UX design'] },
  { key: 'publishing', label: 'Publishing', topics: ['Eleventy', 'static sites', 'web development'] },
  { key: 'systems', label: 'Design systems', topics: ['Visual Framework', 'design systems', 'CSS'] },
  { key: 'type', label: 'Typography', topics: ['typography'] },
  { key: 'platforms', label: 'Platforms', topics: ['Drupal', 'cloud infrastructure'] },
  { key: 'evidence', label: 'Evidence', topics: ['analytics', 'search', 'data visualization'] },
  { key: 'change', label: 'Transformation', topics: ['digital transformation', 'project management', 'productivity'] },
  { key: 'making', label: 'Making', topics: ['PDF', 'developer tools', 'JavaScript', 'open source', 'software engineering'] },
  { key: 'personal', label: 'Personal', topics: ['career reflection', 'retro computing'] },
  { key: 'other', label: 'Other', topics: [] }
];
const radialViewBox = 900;
const radialCentre = radialViewBox / 2;
const radialInner = 110;
const radialOuter = 300;
const radialLabelRadius = 350;
const radialAnchorRadius = 78;
const radialDegreeAxisAngle = -73;
const radialMinYear = 2013;
const radialMaxYear = 2026;
const round1 = (value) => Math.round(value * 10) / 10;
const polar = (angle, radius) => {
  const radians = angle * Math.PI / 180;
  return { x: round1(radialCentre + Math.cos(radians) * radius), y: round1(radialCentre + Math.sin(radians) * radius) };
};
const coveredRadialTopics = new Set(radialGroupDefs.flatMap((group) => group.topics));
const activeRadialGroupDefs = radialGroupDefs.filter((group) =>
  group.key !== 'other' || nodes.some((node) => !coveredRadialTopics.has(node.topic))
);
const radialGroups = activeRadialGroupDefs.map((group, index) => {
  const angle = -90 + (index / activeRadialGroupDefs.length) * 360;
  const labelPoint = polar(angle, radialLabelRadius);
  const anchor = polar(angle, radialAnchorRadius);
  const cosine = Math.cos(angle * Math.PI / 180);
  return {
    ...group,
    index,
    angle,
    anchor,
    labelX: labelPoint.x,
    labelY: labelPoint.y,
    textAnchor: cosine > 0.25 ? 'start' : cosine < -0.25 ? 'end' : 'middle'
  };
});
const radialGroupForTopic = (topic) => radialGroups.find((group) => group.topics.includes(topic))
  || radialGroups.find((group) => group.key === 'other');
const radialNodes = [];
for (const group of radialGroups) {
  const members = nodes.filter((node) => radialGroupForTopic(node.topic).key === group.key)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  const sector = (360 / radialGroups.length) * 0.72;
  members.forEach((node, index) => {
    const offset = members.length === 1 ? 0 : -sector / 2 + (index / (members.length - 1)) * sector;
    const angle = group.angle + offset;
    radialNodes.push({
      index: node.index,
      url: node.url,
      title: node.title,
      topic: node.topic,
      date: node.date,
      group: group.key,
      groupLabel: group.label,
      isAI: group.key === 'ai',
      angle
    });
  });
}
radialNodes.sort((a, b) => a.index - b.index);
const radialNodeByIndex = new Map(radialNodes.map((node) => [node.index, node]));
const radialGroupByKey = new Map(radialGroups.map((group) => [group.key, group]));
const radialPairKey = (a, b) => [a, b].sort((x, y) => x - y).join('|');
const authoredKeys = new Set(authoredPairs.keys());
const semanticKeys = new Set(allEdges.map((edge) => radialPairKey(edge.a, edge.b)));

// The production map averages each whole entry, then keeps three neighbours at
// >= 0.60. This lab view instead counts matching passage pairs. Chunk zero is
// metadata-heavy, so remove it; retain every entry pair with at least one match
// in both directions. `support` is the smaller number of distinct passages on
// either side that found a counterpart, which is less length-biased than the
// raw Cartesian match count used only in the tooltip.
const radialSemanticMin = 0.45;
function buildRadialSemanticPairs() {
  if (!vectorCorpus) {
    return allEdges.map((edge) => ({
      a: edge.a, b: edge.b, score: edge.score, matches: 1, support: 1
    }));
  }
  const wanted = new Map(nodes.map((node) => [node.url, node.index]));
  const chunksByIndex = nodes.map(() => []);
  for (const chunk of vectorCorpus.chunks || []) {
    const index = wanted.get(chunk.url);
    if (index === undefined || !Array.isArray(chunk.embedding)) continue;
    chunksByIndex[index].push(chunk.embedding);
  }
  const dot = (a, b) => {
    let score = 0;
    for (let dimension = 0; dimension < a.length; dimension += 1) score += a[dimension] * b[dimension];
    return score;
  };
  const pairs = [];
  for (let first = 0; first < nodes.length; first += 1) {
    for (let second = first + 1; second < nodes.length; second += 1) {
      const firstChunks = chunksByIndex[first].slice(1);
      const secondChunks = chunksByIndex[second].slice(1);
      if (!firstChunks.length || !secondChunks.length) continue;
      let matches = 0;
      let bestScore = -1;
      let firstSupport = 0;
      let secondSupport = 0;
      for (const a of firstChunks) {
        let bestForPassage = -1;
        for (const b of secondChunks) {
          const score = dot(a, b);
          if (score >= radialSemanticMin) matches += 1;
          if (score > bestForPassage) bestForPassage = score;
          if (score > bestScore) bestScore = score;
        }
        if (bestForPassage >= radialSemanticMin) firstSupport += 1;
      }
      for (const b of secondChunks) {
        let bestForPassage = -1;
        for (const a of firstChunks) bestForPassage = Math.max(bestForPassage, dot(a, b));
        if (bestForPassage >= radialSemanticMin) secondSupport += 1;
      }
      const support = Math.min(firstSupport, secondSupport);
      if (!support) continue;
      pairs.push({
        a: first,
        b: second,
        score: Math.round(bestScore * 1000) / 1000,
        matches,
        support
      });
    }
  }
  return pairs;
}
const radialSemanticSourceEdges = buildRadialSemanticPairs();
const radialSemanticKeys = new Set(radialSemanticSourceEdges.map((edge) => radialPairKey(edge.a, edge.b)));
const crossDegreesFor = (edges) => {
  const degrees = new Array(radialNodes.length).fill(0);
  for (const edge of edges) {
    const first = radialNodeByIndex.get(edge.a);
    const second = radialNodeByIndex.get(edge.b);
    if (!first || !second || first.group === second.group) continue;
    degrees[edge.a] += 1;
    degrees[edge.b] += 1;
  }
  return degrees;
};
const radialAuthoredSourceEdges = [...authoredPairs.values()];
const radialAuthoredCrossDegrees = crossDegreesFor(radialAuthoredSourceEdges);
const radialSemanticCrossDegrees = crossDegreesFor(radialSemanticSourceEdges);
const radialCrossDegreeMax = Math.max(...radialAuthoredCrossDegrees, ...radialSemanticCrossDegrees);
const radiusForCrossDegree = (degree) => radialOuter
  - Math.sqrt(degree / radialCrossDegreeMax) * (radialOuter - radialInner);
const positionRadialNodes = (degrees) => radialNodes.map((node) => {
  const crossLinks = degrees[node.index];
  const point = polar(node.angle, radiusForCrossDegree(crossLinks));
  return { ...node, crossLinks, x: point.x, y: point.y };
});
const radialAuthoredNodes = positionRadialNodes(radialAuthoredCrossDegrees);
const radialSemanticNodes = positionRadialNodes(radialSemanticCrossDegrees);
const radialAuthoredNodeByIndex = new Map(radialAuthoredNodes.map((node) => [node.index, node]));
const radialSemanticNodeByIndex = new Map(radialSemanticNodes.map((node) => [node.index, node]));
for (const edge of allEdges) {
  edge.explicitLink = authoredKeys.has(radialPairKey(edge.a, edge.b));
  if (edge.gapYears >= 3) edge.narrativeClass = edge.explicitLink ? 'explicit-return' : 'uncited-echo';
}
for (const edge of returnEdges) {
  edge.explicitLink = authoredKeys.has(radialPairKey(edge.a, edge.b));
  edge.narrativeClass = edge.explicitLink ? 'explicit-return' : 'uncited-echo';
}
counts.explicitLinks = allEdges.filter((edge) => edge.explicitLink).length;

function radialEdge(aIndex, bIndex, positionedNodes, extra = {}) {
  const a = positionedNodes.get(aIndex);
  const b = positionedNodes.get(bIndex);
  const aAnchor = radialGroupByKey.get(a.group).anchor;
  const bAnchor = radialGroupByKey.get(b.group).anchor;
  return {
    a: aIndex,
    b: bIndex,
    first: a,
    second: b,
    crossGroup: a.group !== b.group,
    involvesAI: a.isAI || b.isAI,
    path: `M ${a.x} ${a.y} C ${aAnchor.x} ${aAnchor.y} ${bAnchor.x} ${bAnchor.y} ${b.x} ${b.y}`,
    ...extra
  };
}

const radialAuthoredEdges = [...authoredPairs.entries()].map(([key, edge]) =>
  radialEdge(edge.a, edge.b, radialAuthoredNodeByIndex, { mentions: edge.mentions, overlap: radialSemanticKeys.has(key) })
);
const radialSemanticEdges = radialSemanticSourceEdges.map((edge) =>
  radialEdge(edge.a, edge.b, radialSemanticNodeByIndex, {
    score: edge.score,
    matches: edge.matches,
    support: edge.support,
    overlap: authoredKeys.has(radialPairKey(edge.a, edge.b))
  })
);
const radialTimelineWidth = 1200;
const radialTimelineHeight = 104;
const radialTimelineLeft = 44;
const radialTimelineRight = radialTimelineWidth - radialTimelineLeft;
const radialTimelineBaseline = 66;
const radialTimelineCounts = Array.from(
  { length: radialMaxYear - radialMinYear + 1 },
  (_, index) => {
    const year = radialMinYear + index;
    return { year, count: radialNodes.filter((node) => Number(node.date.slice(0, 4)) === year).length };
  }
);
const radialTimelineMax = Math.max(...radialTimelineCounts.map((item) => item.count));
const radialTimelinePoints = radialTimelineCounts.map((item, index) => ({
  ...item,
  x: round1(radialTimelineLeft + (index / (radialTimelineCounts.length - 1)) * (radialTimelineRight - radialTimelineLeft)),
  y: round1(radialTimelineBaseline - (item.count / radialTimelineMax) * 46)
}));
const radialCrossRingValues = [...new Set([0, 5, 15, radialCrossDegreeMax]
  .filter((value) => value <= radialCrossDegreeMax))].sort((a, b) => a - b);
const radial = {
  viewBox: radialViewBox,
  centre: radialCentre,
  groups: radialGroups.map(({ topics, ...group }) => ({ ...group, entries: radialNodes.filter((node) => node.group === group.key).length })),
  nodes: radialNodes,
  degreeAxis: {
    start: polar(radialDegreeAxisAngle, radialInner),
    end: polar(radialDegreeAxisAngle, radialOuter)
  },
  rings: radialCrossRingValues.map((value) => {
    const radius = round1(radiusForCrossDegree(value));
    const labelPoint = polar(radialDegreeAxisAngle, radius);
    return {
      value,
      radius,
      label: value === 0 ? '0 · edge' : value === radialCrossDegreeMax ? `${value} · inner` : String(value),
      labelX: labelPoint.x + 8,
      labelY: labelPoint.y + 5
    };
  }),
  panels: [
    { key: 'authored', label: 'Authored cross-links', nodes: radialAuthoredNodes, edges: radialAuthoredEdges },
    { key: 'semantic', label: 'Passage-supported neighbours', nodes: radialSemanticNodes, edges: radialSemanticEdges }
  ],
  crossDegreeMax: radialCrossDegreeMax,
  semanticMin: radialSemanticMin,
  strictSemanticCount: allEdges.length,
  timeline: {
    width: radialTimelineWidth,
    height: radialTimelineHeight,
    baseline: radialTimelineBaseline,
    total: radialNodes.length,
    path: radialTimelinePoints.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' '),
    points: radialTimelinePoints
  },
  counts: {
    authored: radialAuthoredEdges.length,
    semantic: radialSemanticEdges.length,
    overlap: [...authoredKeys].filter((key) => radialSemanticKeys.has(key)).length,
    authoredCrossGroup: radialAuthoredEdges.filter((edge) => edge.crossGroup).length,
    semanticCrossGroup: radialSemanticEdges.filter((edge) => edge.crossGroup).length
  }
};

// ---- publication activity as layered topic sparklines -------------------
// Kevin Marks's Joy of Sparks uses vertically offset daily activity lines to
// turn many small time series into one terrain. Here each line is a primary
// topic and each point is a trailing six-month publication count. Series are
// normalized independently: the shape shows timing and recurrence, while the
// directly printed total preserves the otherwise-lost magnitude.
const sparksStartYear = 2013;
const sparksEndYear = 2026;
const sparksWindowMonths = 6;
const sparksMonths = Array.from(
  { length: (sparksEndYear - sparksStartYear + 1) * 12 },
  (_, index) => ({
    index,
    year: sparksStartYear + Math.floor(index / 12),
    month: index % 12
  })
);
const sparksWidth = 1200;
const sparksPlotLeft = 178;
const sparksPlotRight = 1120;
const sparksTop = 78;
const sparksRowGap = 27;
const sparksAmplitude = 62;
const sparksTopicSlug = (topic) => String(topic).toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const sparksMonthIndex = (date) => {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7)) - 1;
  return (year - sparksStartYear) * 12 + month;
};
const sparksX = (index) => round1(sparksPlotLeft
  + (index / (sparksMonths.length - 1)) * (sparksPlotRight - sparksPlotLeft));
const sparksTopics = [...topicCounts.entries()]
  .filter(([, count]) => count >= 2)
  .map(([topic, total]) => {
    const entries = nodes.filter((node) => node.topic === topic).sort((a, b) => a.date.localeCompare(b.date));
    return { topic, total, entries, group: radialGroupForTopic(topic) };
  })
  .sort((a, b) => a.entries[0].date.localeCompare(b.entries[0].date)
    || a.group.index - b.group.index
    || a.topic.localeCompare(b.topic));
const sparksSeries = sparksTopics.map((series, row) => {
  const raw = new Array(sparksMonths.length).fill(0);
  series.entries.forEach((entry) => {
    const index = sparksMonthIndex(entry.date);
    if (index >= 0 && index < raw.length) raw[index] += 1;
  });
  const rolling = raw.map((_, index) => {
    let value = 0;
    for (let offset = 0; offset < sparksWindowMonths; offset += 1) value += raw[index - offset] || 0;
    return value;
  });
  const peak = Math.max(1, ...rolling);
  const peakIndex = rolling.indexOf(peak);
  const baseline = sparksTop + row * sparksRowGap;
  const points = rolling.map((value, index) => ({
    x: sparksX(index),
    y: round1(baseline - (value / peak) * sparksAmplitude),
    value
  }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const peakMonth = sparksMonths[peakIndex];
  return {
    key: sparksTopicSlug(series.topic),
    topic: series.topic,
    total: series.total,
    group: series.group.key,
    groupLabel: series.group.label,
    firstDate: series.entries[0].date,
    lastDate: series.entries.at(-1).date,
    peak,
    peakPeriod: `${peakMonth.year}-${String(peakMonth.month + 1).padStart(2, '0')}`,
    baseline,
    line,
    area: `M ${sparksPlotLeft} ${baseline} ${line.replace(/^M /, 'L ')} L ${sparksPlotRight} ${baseline} Z`,
    posts: series.entries.map((entry) => {
      const index = sparksMonthIndex(entry.date);
      return { ...entry, x: sparksX(index), y: points[index].y };
    })
  };
});
const topicSparks = {
  width: sparksWidth,
  height: sparksTop + sparksSeries.length * sparksRowGap + 58,
  plotLeft: sparksPlotLeft,
  plotRight: sparksPlotRight,
  windowMonths: sparksWindowMonths,
  topics: sparksSeries.length,
  entries: sparksSeries.reduce((sum, series) => sum + series.total, 0),
  series: sparksSeries,
  years: Array.from({ length: sparksEndYear - sparksStartYear + 1 }, (_, index) => {
    const year = sparksStartYear + index;
    return { year, x: sparksX(index * 12) };
  })
};

// ---- the passage layer beneath whole-entry semantic averages -------------
// The public map averages every chunk for an entry and then keeps a maximum of
// three strong neighbours. Here we retain the best individual passage pair for
// long-range entry pairs that did not become a displayed map edge. Chunk zero
// is skipped because it contains the entry title and header metadata; every
// later embedding still includes the title, so these are passage-weighted
// signals rather than pure sentence-to-sentence comparisons.
let semanticIndex = {
  model: '', dimension: 0, totalPages: 0, totalChunks: 0,
  entryPages: 0, entryChunks: 0, passageEchoes: []
};
if (vectorCorpus) {
  const vectors = vectorCorpus;
  const wanted = new Map(nodes.map((node) => [node.url, node]));
  const chunksByUrl = new Map();
  for (const chunk of vectors.chunks || []) {
    if (!wanted.has(chunk.url) || !Array.isArray(chunk.embedding)) continue;
    if (!chunksByUrl.has(chunk.url)) chunksByUrl.set(chunk.url, []);
    chunksByUrl.get(chunk.url).push(chunk);
  }

  const dot = (a, b) => {
    let value = 0;
    for (let index = 0; index < a.length; index += 1) value += a[index] * b[index];
    return value;
  };
  const averages = new Map();
  for (const [url, chunks] of chunksByUrl) {
    const sum = new Array(vectors.dimension).fill(0);
    for (const chunk of chunks) {
      for (let index = 0; index < sum.length; index += 1) sum[index] += chunk.embedding[index];
    }
    const magnitude = Math.sqrt(dot(sum, sum));
    averages.set(url, sum.map((value) => value / magnitude));
  }

  const displayedPairs = new Set(map.edges.map((edge) =>
    [map.nodes[edge.a].url, map.nodes[edge.b].url].sort().join('|')
  ));
  const urls = [...chunksByUrl.keys()];
  const candidates = [];
  for (let ai = 0; ai < urls.length; ai += 1) {
    for (let bi = ai + 1; bi < urls.length; bi += 1) {
      const first = wanted.get(urls[ai]);
      const second = wanted.get(urls[bi]);
      const gapYears = Math.abs(first.year - second.year);
      if (gapYears < 3) continue;
      const pairKey = [first.url, second.url].sort().join('|');
      if (displayedPairs.has(pairKey)) continue;
      const firstChunks = chunksByUrl.get(first.url).slice(1);
      const secondChunks = chunksByUrl.get(second.url).slice(1);
      if (!firstChunks.length || !secondChunks.length) continue;
      let passageScore = -1;
      let firstPassage;
      let secondPassage;
      for (const a of firstChunks) {
        for (const b of secondChunks) {
          const score = dot(a.embedding, b.embedding);
          if (score > passageScore) {
            passageScore = score;
            firstPassage = a;
            secondPassage = b;
          }
        }
      }
      const entryScore = dot(averages.get(first.url), averages.get(second.url));
      const lift = passageScore - entryScore;
      if (passageScore < 0.56 || entryScore >= map.edgeMin || lift < 0.04) continue;
      candidates.push({
        first,
        second,
        gapYears,
        passageScore: Math.round(passageScore * 1000) / 1000,
        entryScore: Math.round(entryScore * 1000) / 1000,
        lift: Math.round(lift * 1000) / 1000,
        explicitLink: authoredKeys.has(radialPairKey(first.index, second.index)),
        firstSnippet: cleanSnippet(firstPassage.snippet),
        secondSnippet: cleanSnippet(secondPassage.snippet)
      });
    }
  }
  candidates.sort((a, b) => b.passageScore - a.passageScore || b.lift - a.lift || b.gapYears - a.gapYears);
  semanticIndex = {
    model: vectors.model,
    dimension: vectors.dimension,
    totalPages: new Set((vectors.chunks || []).map((chunk) => chunk.url)).size,
    totalChunks: (vectors.chunks || []).length,
    entryPages: chunksByUrl.size,
    entryChunks: [...chunksByUrl.values()].reduce((sum, chunks) => sum + chunks.length, 0),
    passageEchoes: candidates.slice(0, 8)
  };
}

writeFileSync(OUT, `${JSON.stringify({
  generated: 'experimental storytelling derivatives; not production data',
  counts,
  years,
  nodes,
  careerBands,
  allEdges,
  returnEdges,
  featuredReturns: returnEdges.slice(0, 4),
  practiceEdges,
  topicCareer,
  topicYears,
  scatter,
  trails,
  outbound,
  semanticIndex,
  radial,
  topicSparks
}, null, 1)}\n`);

console.log(`story-lab: ${counts.entries} entries, ${counts.returnLinks} non-companion returns, wrote ${OUT}`);
