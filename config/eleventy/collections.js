module.exports = function registerCollections(config) {
  // Collections
  function getTagArray(item) {
    const tags = item.data?.tags || [];
    return Array.isArray(tags) ? tags : [tags];
  }

  config.addCollection('impactStories', (collectionApi) => {
    try {
      return collectionApi.getAll()
        .filter((item) => getTagArray(item).includes('impact-stories'))
        .sort((a, b) => b.date - a.date);
    } catch (e) {
      return [];
    }
  });

  config.addCollection('blogPosts', (collectionApi) => {
    try {
      return collectionApi.getAll()
        .filter((item) => {
          const tags = getTagArray(item);
          return tags.includes('posts')
            && !tags.includes('case-studies')
            && !tags.includes('impact-stories');
        })
        .sort((a, b) => b.date - a.date);
    } catch (e) {
      return [];
    }
  });

  // Topics grouped by PARENT, so `AI > Claude Code` counts under AI. Only
  // topics with enough entries to be worth browsing get a page; the taxonomy
  // was consolidated precisely so that a topic index is not mostly singletons.
  // Hand-picked entries, the one part of the register that is chosen rather
  // than computed. Everything else here — topics, neighbours, cadence, the
  // timeline — is derived at build time and therefore complete and neutral,
  // which is exactly why none of it can answer "what's worth reading?".
  // Ordering is explicit (`featured: 1`) rather than by date or score, because
  // the point is an editorial sequence.
  config.addCollection('featured', (collectionApi) => {
    try {
      return collectionApi.getAll()
        .filter((item) => item.data && typeof item.data.featured === 'number')
        .sort((a, b) => a.data.featured - b.data.featured);
    } catch (e) {
      return [];
    }
  });

  config.addCollection('topics', (collectionApi) => {
    try {
      const MIN = 3;
      const map = new Map();
      collectionApi.getAll()
        .filter((item) => {
          const tags = getTagArray(item);
          return tags.includes('posts') || tags.includes('digesting');
        })
        .forEach((item) => {
          const topics = (item.data && item.data.topics) || [];
          const seen = new Set();
          topics.forEach((t) => {
            const parent = String(t || '').split('>')[0].trim();
            if (!parent || seen.has(parent)) return;
            seen.add(parent);
            if (!map.has(parent)) map.set(parent, []);
            map.get(parent).push(item);
          });
        });
      // Year range spans the whole corpus so every topic's sparkline covers
      // the same years. Comparing rows only means anything on a shared axis.
      const all = [...map.values()].flat();
      const years = all.map((i) => new Date(i.date).getUTCFullYear());
      const firstYear = Math.min(...years);
      const lastYear = Math.max(...years);
      const span = [];
      for (let y = firstYear; y <= lastYear; y += 1) span.push(y);

      return [...map.entries()]
        .filter(([, items]) => items.length >= MIN)
        .map(([topic, items]) => {
          const perYear = span.map((y) => ({
            year: y,
            count: items.filter((i) => new Date(i.date).getUTCFullYear() === y).length
          }));
          return {
            topic,
            slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            count: items.length,
            firstYear,
            lastYear,
            perYear,
            peak: Math.max(...perYear.map((p) => p.count)),
            items: items.sort((a, b) => b.date - a.date)
          };
        })
        .sort((a, b) => (b.count - a.count) || a.topic.localeCompare(b.topic));
    } catch (e) {
      return [];
    }
  });

  config.addCollection('allContent', (collectionApi) => {
    try {
      return collectionApi.getAll()
        .filter((item) => {
          const tags = getTagArray(item);
          return tags.includes('posts') || tags.includes('digesting');
        })
        .sort((a, b) => b.date - a.date);
    } catch (e) {
      return [];
    }
  });
};
