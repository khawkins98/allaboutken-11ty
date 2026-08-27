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

  // Place a word count on the rendered post corpus: percentile rank plus the
  // median. The corpus is derived between the two Eleventy passes, keeping
  // this gauge on the same counting basis as the statistics pages.
  config.addFilter('lengthFrame', (words, lengths) => {
    try {
      const corpus = Array.isArray(lengths) ? lengths : [];
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
