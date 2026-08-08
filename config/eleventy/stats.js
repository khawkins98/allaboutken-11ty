const Fs = require('fs');
const Path = require('path');

const projectRoot = Path.resolve(__dirname, '../..');

module.exports = function registerStats(config) {
  // Per-year totals for the stats page: entry counts split by type, plus
  // words, so a single pass over the corpus feeds every mark on that page.
  config.addFilter('statsByYear', (items) => {
    try {
      const byYear = new Map();
      (items || []).forEach((item) => {
        const d = new Date(item.date);
        const y = d.getUTCFullYear();
        if (!byYear.has(y)) {
          byYear.set(y, {
            year: y,
            total: 0,
            words: 0,
            // Twelve slots so every year's sparkline covers Jan to Dec, and a
            // quiet year reads as quiet rather than as a short chart.
            months: Array.from({ length: 12 }, (_, m) => ({ month: m + 1, words: 0, entries: 0 }))
          });
        }
        const row = byYear.get(y);
        row.total += 1;
        const text = String(item.templateContent || '').replace(/<[^>]*>/g, ' ');
        const words = (text.match(/\S+/g) || []).length;
        row.words += words;
        const slot = row.months[d.getUTCMonth()];
        slot.words += words;
        slot.entries += 1;
      });
      const years = [...byYear.values()].sort((a, b) => a.year - b.year);
      const peak = Math.max(1, ...years.map((y) => y.total));
      years.forEach((y) => {
        y.share = Math.round((y.total / peak) * 100);
        // Deliberately a WITHIN-year peak: this sparkline shows the shape of a
        // year, while the bar beside it carries the across-year comparison.
        // Mixing scales in one table is only honest if it is labelled, which
        // the column head does.
        y.monthPeak = Math.max(1, ...y.months.map((m) => m.words));
        y.busiestMonth = y.months.reduce((a, b) => (b.words > a.words ? b : a), y.months[0]);
      });
      return years;
    } catch (e) {
      return [];
    }
  });

  // Whole-corpus figures. Median rather than mean for length: a couple of
  // very long pieces would drag a mean somewhere unrepresentative.
  config.addFilter('corpusStats', (items) => {
    try {
      const lengths = (items || []).map((item) => {
        const text = String(item.templateContent || '').replace(/<[^>]*>/g, ' ');
        return (text.match(/\S+/g) || []).length;
      }).filter((n) => n > 0).sort((a, b) => a - b);
      if (!lengths.length) return null;
      const mid = Math.floor(lengths.length / 2);
      const median = lengths.length % 2
        ? lengths[mid]
        : Math.round((lengths[mid - 1] + lengths[mid]) / 2);
      const dates = (items || []).map((i) => new Date(i.date)).sort((a, b) => a - b);
      // Cadence is stated as an average over the years that actually have
      // entries, not over the calendar span. Dividing by the span would let a
      // multi-year gap quietly halve the rate and make an active site look
      // dormant; dividing by active years answers "when they write, how much?"
      // The gap is visible in the pulse strip either way, so nothing is hidden.
      const years = dates.map((d) => d.getUTCFullYear());
      const activeYears = new Set(years).size;
      const perYearTally = new Map();
      years.forEach((y) => perYearTally.set(y, (perYearTally.get(y) || 0) + 1));
      const busiest = [...perYearTally.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        entries: lengths.length,
        words: lengths.reduce((a, b) => a + b, 0),
        median,
        longest: lengths[lengths.length - 1],
        shortest: lengths[0],
        first: dates[0],
        latest: dates[dates.length - 1],
        activeYears,
        // One decimal place: "2.4 a year" is a rate, "2 a year" reads as a count.
        perYear: Math.round((lengths.length / Math.max(1, activeYears)) * 10) / 10,
        busiestYear: busiest ? busiest[0] : null,
        busiestYearCount: busiest ? busiest[1] : 0
      };
    } catch (e) {
      return null;
    }
  });

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
