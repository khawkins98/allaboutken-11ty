module.exports = function registerCollections(config) {
  // Collections
  function getTagArray(item) {
    const tags = item.data?.tags || [];
    return Array.isArray(tags) ? tags : [tags];
  }

  // `kens_status: draft` used to be a note to self with no build behaviour, so
  // a post marked draft still reached the blog index, the sitemap, the feed and
  // the embedding corpus -- merging the branch published it. It now means what
  // it says: the page still renders at its URL, so a draft can be read and
  // shared for review, but it is absent from every collection and carries a
  // noindex tag (see layouts/base.njk), which in turn keeps it out of Pagefind
  // and out of the semantic corpus.
  //
  // Rendering rather than suppressing the page is the deliberate half of this.
  // A draft you cannot open is a draft you cannot review, and `permalink: false`
  // would also break any link already shared.
  // The vocabulary comes from CONTRIBUTING.md: draft -> final_draft ->
  // ready_for_publication -> published. Only the first two are withheld.
  // `ready_for_publication` means reviewed and approved, so holding it back
  // would strand finished work behind a second, undocumented gate, and an
  // absent field means the post predates the workflow and is already live.
  const UNPUBLISHED = new Set(['draft', 'final_draft']);
  const isDraft = (item) => UNPUBLISHED.has(item.data?.kens_status);
  const published = (items) => items.filter((item) => !isDraft(item));

  // Eleventy builds `collections.posts` itself from the `posts` tag, and an
  // automatic tag collection cannot be filtered at registration. Templates that
  // consume it -- the feed, chiefly -- pipe through this instead.
  config.addFilter('published', (items) => published(items || []));

  config.addCollection('impactStories', (collectionApi) => {
    try {
      return published(collectionApi.getAll())
        .filter((item) => getTagArray(item).includes('impact-stories'))
        .sort((a, b) => b.date - a.date);
    } catch (e) {
      return [];
    }
  });

  config.addCollection('blogPosts', (collectionApi) => {
    try {
      return published(collectionApi.getAll())
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

  // Photographs are a fourth kind of entry. They live in src/site/posts/ like
  // digesting notes and are distinguished only by tag and layout, so the
  // permalink, the pulse strip and the sequence rail all work unchanged.
  config.addCollection('photos', (collectionApi) => {
    try {
      return published(collectionApi.getAll())
        .filter((item) => getTagArray(item).includes('photos'))
        .sort((a, b) => b.date - a.date);
    } catch (e) {
      return [];
    }
  });

  // The feed used to iterate `collections.posts`, Eleventy's own tag
  // collection, which is why digesting notes have never been in it. Photographs
  // are meant to go out to subscribers but are not blog posts, so the feed now
  // reads from an explicit merged collection instead of from a raw tag. If you
  // later want digests in the feed, this is the one place to add them.
  config.addCollection('feedEntries', (collectionApi) => {
    try {
      return published(collectionApi.getAll())
        .filter((item) => {
          const tags = getTagArray(item);
          return tags.includes('posts') || tags.includes('photos');
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
      return published(collectionApi.getAll())
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
      // Drafts excluded here too. Without this a withheld post is absent from
      // the blog index, the feed, the sitemap and search, then appears in full
      // on its topic page -- and worse, its existence counts toward MIN, so a
      // topic could earn a page on the strength of unpublished writing.
      published(collectionApi.getAll())
        .filter((item) => {
          const tags = getTagArray(item);
          return tags.includes('posts') || tags.includes('digesting') || tags.includes('photos');
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
      return published(collectionApi.getAll())
        .filter((item) => {
          const tags = getTagArray(item);
          return tags.includes('posts') || tags.includes('digesting') || tags.includes('photos');
        })
        .sort((a, b) => b.date - a.date);
    } catch (e) {
      return [];
    }
  });
};
