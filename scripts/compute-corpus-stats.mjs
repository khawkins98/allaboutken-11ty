/**
 * Derive corpus statistics from the rendered bootstrap HTML.
 *
 * Eleventy 4 can render a collection consumer before every collection item's
 * `templateContent` is ready. Reading that property in a Nunjucks filter is
 * therefore render-order dependent. The production build already has two
 * Eleventy passes, so compute these figures between them from explicit markers
 * around each entry's rendered body.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { findHtmlFiles } from './lib/find-html-files.mjs';

const BUILD_DIR = 'build';
const OUTPUT_FILE = 'src/site/_data/corpusStats.json';
const BODY_START = '<!-- kh-entry-content:start -->';
const BODY_END = '<!-- kh-entry-content:end -->';

function getMatch(html, pattern, label, file) {
  const match = html.match(pattern);
  if (!match) throw new Error(`compute-corpus-stats: missing ${label} in ${file}`);
  return match[1];
}

function renderedWordCount(html) {
  const start = html.indexOf(BODY_START);
  const end = html.indexOf(BODY_END, start + BODY_START.length);
  if (start === -1 || end === -1) return null;

  // Match the former `templateContent` calculation exactly: remove markup,
  // then count whitespace-separated tokens. Script/style text and entities
  // deliberately retain their previous counting behaviour.
  const body = html.slice(start + BODY_START.length, end);
  const text = body.replace(/<[^>]*>/g, ' ');
  return (text.match(/\S+/g) || []).length;
}

function summarize(entries) {
  const lengths = entries.map((entry) => entry.words).sort((a, b) => a - b);
  if (!lengths.length) return null;

  const dates = entries.map((entry) => new Date(entry.date)).sort((a, b) => a - b);
  const years = dates.map((date) => date.getUTCFullYear());
  const activeYears = new Set(years).size;
  const perYearTally = new Map();
  years.forEach((year) => perYearTally.set(year, (perYearTally.get(year) || 0) + 1));
  const busiest = [...perYearTally.entries()].sort((a, b) => b[1] - a[1])[0];
  const mid = Math.floor(lengths.length / 2);
  const median = lengths.length % 2
    ? lengths[mid]
    : Math.round((lengths[mid - 1] + lengths[mid]) / 2);

  const byYear = new Map();
  for (const entry of entries) {
    const date = new Date(entry.date);
    const year = date.getUTCFullYear();
    if (!byYear.has(year)) {
      byYear.set(year, {
        year,
        total: 0,
        words: 0,
        months: Array.from({ length: 12 }, (_, month) => ({
          month: month + 1,
          words: 0,
          entries: 0
        }))
      });
    }
    const row = byYear.get(year);
    const slot = row.months[date.getUTCMonth()];
    row.total += 1;
    row.words += entry.words;
    slot.words += entry.words;
    slot.entries += 1;
  }

  const yearRows = [...byYear.values()].sort((a, b) => a.year - b.year);
  const peak = Math.max(1, ...yearRows.map((year) => year.total));
  yearRows.forEach((year) => {
    year.share = Math.round((year.total / peak) * 100);
    year.monthPeak = Math.max(1, ...year.months.map((month) => month.words));
    year.busiestMonth = year.months.reduce(
      (a, b) => (b.words > a.words ? b : a),
      year.months[0]
    );
  });

  return {
    entries: lengths.length,
    words: lengths.reduce((sum, length) => sum + length, 0),
    median,
    longest: lengths[lengths.length - 1],
    shortest: lengths[0],
    first: dates[0].toISOString(),
    latest: dates[dates.length - 1].toISOString(),
    activeYears,
    perYear: Math.round((lengths.length / Math.max(1, activeYears)) * 10) / 10,
    busiestYear: busiest ? busiest[0] : null,
    busiestYearCount: busiest ? busiest[1] : 0,
    years: yearRows
  };
}

const entries = [];
for (const file of findHtmlFiles(BUILD_DIR)) {
  const html = readFileSync(file, 'utf8');
  const kindMatch = html.match(/<!--\s*kh-entry-kind:([a-z-]+)\s*-->/i);
  if (!kindMatch) continue;
  const words = renderedWordCount(html);
  if (words === null) throw new Error(`compute-corpus-stats: missing entry body markers in ${file}`);
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue;

  const kind = kindMatch[1];
  const date = getMatch(
    html,
    /<!--\s*kh-entry-date:([^>]+?)\s*-->/i,
    'publication date',
    file
  );
  entries.push({ kind, date, words });
}

const allContent = summarize(entries);
const blogPosts = summarize(entries.filter((entry) => entry.kind === 'blog'));
if (!allContent || !blogPosts) {
  throw new Error('compute-corpus-stats: no marked entry pages found; run the bootstrap build first');
}

// post.njk serves both regular posts and impact stories. Keep its length
// gauge population aligned with that layout rather than the narrower blog set.
const postLengths = entries
  .filter((entry) => entry.kind === 'blog' || entry.kind === 'impact-story')
  .map((entry) => entry.words)
  .sort((a, b) => a - b);

const output = {
  generated: 'from rendered bootstrap entry bodies',
  allContent,
  blogPosts,
  postLengths
};

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 1)}\n`);
console.log(
  `compute-corpus-stats: ${allContent.entries} entries, ${allContent.words} words; ` +
  `${blogPosts.entries} blog posts; wrote ${OUTPUT_FILE}`
);
