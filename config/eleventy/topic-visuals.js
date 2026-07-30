module.exports = function registerTopicVisuals(config) {
  // How many entries in a collection share a topic (case-insensitive).
  // Topics may be hierarchical: "typography > OpenType ligatures". The parent
  // is the controlled vocabulary and the only thing that groups; the child is
  // free-form detail that displays but never forms a bucket.
  //
  // '>' rather than ':' deliberately. YAML parses an unquoted `- a: b` list
  // item as an object, so a colon would give a mixed list of strings and
  // objects, and forgetting the quotes would change the type silently.
  const khTopicParent = (topic) => String(topic || '').split('>')[0].trim();
  const khTopicChild = (topic) => {
    const parts = String(topic || '').split('>');
    return parts.length > 1 ? parts.slice(1).join('>').trim() : '';
  };

  config.addFilter('topicParent', khTopicParent);
  config.addFilter('topicChild', khTopicChild);

  // Counts by parent, so "AI > Claude Code" tallies under "AI".
  config.addFilter('topicTally', (items, topic) => {
    try {
      const t = khTopicParent(topic).toLowerCase();
      if (!t) return 0;
      return (items || []).filter((item) => {
        const topics = item.data && item.data.topics;
        return Array.isArray(topics)
          && topics.some((x) => khTopicParent(x).toLowerCase() === t);
      }).length;
    } catch (e) {
      return 0;
    }
  });

  // Build-time sparkline for a topic's activity by year. Column marks rather
  // than a line, because the counts are discrete and frequently zero, and a
  // line through zeros implies a continuity that is not there.
  //
  // `peak` is passed in from the caller and is the maximum across ALL topics,
  // not this one: side-by-side sparklines are read as sharing a scale whether
  // or not they do (Few), so a per-row scale would make a quiet topic look as
  // busy as AI. Rows are therefore comparable by height.
  config.addShortcode('topicSparkline', (perYear, peak, label) => {
    try {
      const years = perYear || [];
      if (!years.length || !peak) return '';
      const w = 8;      // column pitch
      const gap = 1;
      const h = 20;     // drawing height
      const width = years.length * w;
      const bars = years.map((p, i) => {
        const x = i * w;
        if (!p.count) {
          // Absence is data: a baseline tick, not a gap.
          return `<rect x="${x}" y="${h - 1}" width="${w - gap}" height="1" fill="#ded2a8"></rect>`;
        }
        const bh = Math.max(2, Math.round((p.count / peak) * h));
        return `<rect x="${x}" y="${h - bh}" width="${w - gap}" height="${bh}" fill="#5b5e5a"></rect>`;
      }).join('');
      const first = years[0].year;
      const last = years[years.length - 1].year;
      const busiest = years.reduce((a, b) => (b.count > a.count ? b : a), years[0]);
      const desc = `${label}: activity by year, ${first} to ${last}. `
        + `Busiest year ${busiest.year} with ${busiest.count}.`;
      return `<svg class="kh-spark" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" `
        + `role="img" aria-label="${desc}"><title>${desc}</title>${bars}</svg>`;
    } catch (e) {
      return '';
    }
  });

  // Words-per-month sparkline for a single year. Scaled to that year's own
  // busiest month, not the corpus: see statsByYear.
  config.addShortcode('monthSparkline', (months, peak, year) => {
    try {
      const list = months || [];
      if (!list.length || !peak) return '';
      const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const w = 8;
      const gap = 1;
      const h = 20;
      const width = list.length * w;
      const bars = list.map((m, i) => {
        const x = i * w;
        if (!m.words) {
          return `<rect x="${x}" y="${h - 1}" width="${w - gap}" height="1" fill="#ded2a8"></rect>`;
        }
        const bh = Math.max(2, Math.round((m.words / peak) * h));
        return `<rect x="${x}" y="${h - bh}" width="${w - gap}" height="${bh}" fill="#5b5e5a"></rect>`;
      }).join('');
      const busiest = list.reduce((a, b) => (b.words > a.words ? b : a), list[0]);
      const active = list.filter((m) => m.entries).length;
      const desc = `${year}: words per month, scaled to this year. `
        + `Busiest ${names[busiest.month - 1]} with ${busiest.words} words. `
        + `${active} of 12 months active.`;
      return `<svg class="kh-spark" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" `
        + `role="img" aria-label="${desc}"><title>${desc}</title>${bars}</svg>`;
    } catch (e) {
      return '';
    }
  });
};
