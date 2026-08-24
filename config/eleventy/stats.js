const Fs = require('fs');
const Path = require('path');

const projectRoot = Path.resolve(__dirname, '../..');

module.exports = function registerStats(config) {
  // Total pixel width of the timeline track. Firefox mis-computes the
  // scrollable overflow of a shrink-wrapped flex track inside an RTL
  // scroller, which is what broke `direction: rtl` before; giving the track
  // an explicit width avoids the bug entirely. Keep the two numbers in step
  // with --kh-slot-width and the gap slot width in _kh-dataviz.scss.
  config.addFilter('trackWidth', (slots, slotPx = 40, gapPx = 96) => {
    try {
      return (slots || []).reduce((sum, s2) => sum + (s2 && s2.gap ? gapPx : slotPx), 0);
    } catch (e) {
      return 0;
    }
  });

  // Other posts in the same series, oldest first, for in-series navigation.
  config.addFilter('seriesPosts', (items, seriesName) => {
    try {
      const name = String(seriesName || '').toLowerCase();
      if (!name) return [];
      return (items || [])
        .filter((item) => String((item.data && item.data.series) || '').toLowerCase() === name)
        .sort((a, b) => {
          const pa = Number((a.data && a.data.series_part) || 0);
          const pb = Number((b.data && b.data.series_part) || 0);
          return pa === pb ? a.date - b.date : pa - pb;
        });
    } catch (e) {
      return [];
    }
  });

  // Word-count corpus for the length gauge: every file in posts/ whose
  // frontmatter carries the `posts` tag (articles + impact stories — the same
  // population that renders through post.njk). Counted from raw source with
  // tags stripped, which tracks the rendered count closely enough to place a
  // post on a percentile scale. Computed once per build.
  let khLengthCorpus = null;
  function khGetLengthCorpus() {
    if (khLengthCorpus) return khLengthCorpus;
    const counts = [];
    try {
      const dir = Path.join(projectRoot, 'src/site/posts');
      for (const f of Fs.readdirSync(dir)) {
        if (!/\.(njk|md)$/.test(f)) continue;
        const raw = Fs.readFileSync(Path.join(dir, f), 'utf8');
        const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
        if (!m) continue;
        const fm = m[1];
        if (!/^tags:\s*posts\s*$/m.test(fm) && !/^\s*-\s*posts\s*$/m.test(fm)) continue;
        const body = m[2]
          .replace(/{%[\s\S]*?%}/g, ' ')
          .replace(/{{[\s\S]*?}}/g, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (body) counts.push(body.split(/\s+/).length);
      }
    } catch (e) {
      // fall through with whatever was gathered
    }
    counts.sort((a, b) => a - b);
    khLengthCorpus = counts;
    return counts;
  }

  // Place a word count on the corpus: percentile rank plus the median.
  config.addFilter('lengthFrame', (words) => {
    try {
      const corpus = khGetLengthCorpus();
      if (!corpus.length) return null;
      const n = Number(words) || 0;
      const below = corpus.filter((c) => c < n).length;
      return {
        pct: Math.round((below / corpus.length) * 100),
        median: corpus[Math.floor(corpus.length / 2)]
      };
    } catch (e) {
      return null;
    }
  });
};
