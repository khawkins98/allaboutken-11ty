/**
 * Eleventy configuration — allaboutken-11ty
 *
 * Sections (in order):
 *   1. Plugins        — eleventyImageTransformPlugin (responsive image transforms)
 *   2. Server options — dev-server live-reload and HTTPS stubs
 *   3. Transforms     — fixImageSrcToAbsolute (rewrite build-time img paths)
 *   4. Filters        — dateDisplay, limitItems, ensureTrailingSlash, rssDate,
 *                       rssLastUpdatedDate, emdash, htmlToAbsoluteUrls,
 *                       sanitizeFeedHtml, wordCount, formatNumber
 *   5. Markdown       — markdown-it with heading anchors + emdash plugin;
 *                       `markdown` paired shortcode
 *   6. Shortcodes     — codeAndDemo (paired), ogImageUrl
 *   7. Passthrough    — JS files, favicon assets, images, fonts, legacy HTML
 *   8. Pagefind hook  — post-build keyword-search index (async in dev, sync in prod)
 *   9. Collections    — impactStories, blogPosts, allContent
 *  10. Return config  — dir, templateFormats, template engine overrides
 */

const { DateTime } = require('luxon');
const Path         = require('path');
const Fs           = require('fs');
const { execSync, exec } = require('child_process');
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
// const UpgradeHelper = require("@11ty/eleventy-upgrade-help");

module.exports = function(config) {
  const isDev = process.env.ELEVENTY_ENV === 'development';
  // Transform <img>/<picture> in HTML to responsive images at build time
  config.addPlugin(eleventyImageTransformPlugin, {
    outputDir: "./build/img/",
    urlPath: "/img/",
    widths: [320, 600, 900, 1280],
    formats: ["avif", "webp", "jpeg", "gif"],
    transformOnRequest: isDev,
    // Do not fail the entire build on a single image error (e.g., 404 remote)
    failOnError: false,
    // Preserve animation for GIF/WEBP when resizing/encoding
    sharpOptions: {
      animated: true
    },
    sharpWebpOptions: {
      animated: true
    },
    sharpGifOptions: {
      reoptimise: true
    },
    // Deterministic file names: <dir-token>-<base-name>-<width>.<format>
    filenameFormat: function filenameFormat(id, src, width, format) {
      try {
        let baseName = '';
        let dirToken = '';
        if (typeof src === 'string') {
          if (src.startsWith('http://') || src.startsWith('https://')) {
            const u = new URL(src);
            baseName = Path.basename(u.pathname) || u.hostname;
            const parts = (u.pathname || '').split('/').filter(Boolean);
            dirToken = parts.length > 1 ? parts[parts.length - 2] : '';
          } else {
            baseName = Path.basename(src);
            const parentDir = Path.basename(Path.dirname(src));
            dirToken = parentDir;
          }
        }
        baseName = String(baseName || 'image').replace(/\.[a-z0-9]+$/i, '');
        const safe = baseName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const dirSafe = String(dirToken || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const name = dirSafe ? `${dirSafe}-${safe}` : safe;
        return `${name}-${width}.${format}`;
      } catch (e) {
        return `${id}-${width}.${format}`;
      }
    },
    htmlOptions: {
      img: {
        decoding: "async",
        loading: "lazy",
        sizes: "100vw"
      }
    }
  });
  config.setServerOptions({
    showVersion: true,
    liveReload: true,

    // Whether DOM diffing updates are applied where possible instead of page reloads
    domDiff: true,

    watch: [
      "build/**/*.css" // watch compiled CSS from Sass for instant reloads
    ],

    // Show local network IP addresses for device testing
    showAllHosts: true,

    // Use a local key/certificate to opt-in to local HTTP/2 with https
    https: {
      // key: "./localhost.key",
      // cert: "./localhost.cert",
    },

    // Change the default file encoding for reading/serving files
    encoding: "utf-8",
  });

  // Fix any image src paths that were rewritten to input filesystem paths.
  // Ensures URLs point to passthrough-copied /images/ in output.
  config.addTransform("fixImageSrcToAbsolute", (content, outputPath) => {
    try {
      if (typeof content !== 'string') return content;
      if (!outputPath || !outputPath.endsWith('.html')) return content;
      return content.replace(/src="(?:\.\.\/)*src\/site\/images\//g, 'src="/images/');
    } catch (e) {
      return content;
    }
  });

  // Filters
  // https://www.11ty.io/docs/filters/
  // -----

  // Add any utility filters
  config.addFilter("dateDisplay", (dateObj, format = "d LLL y") => {
    return DateTime.fromJSDate(dateObj, {
      zone: "utc"
    }).toFormat(format);
  });

  // Return the first N items of an array (more specific name to avoid collisions)
  config.addFilter("limitItems", (array, n) => {
    if (!Array.isArray(array)) return array;
    if (typeof n !== 'number') return array;
    return n < 0 ? array.slice(n) : array.slice(0, n);
  });

  // Ensure trailing slash on URLs for canonical IDs
  config.addFilter("ensureTrailingSlash", (value) => {
    const v = String(value || '');
    if (!v) return v;
    return v.endsWith('/') ? v : v + '/';
  });
  config.addFilter("rssDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toISO();
  });
  config.addFilter("rssLastUpdatedDate", (posts) => {
    if (!Array.isArray(posts) || posts.length === 0) return DateTime.now().toISO();
    const latest = posts.reduce((a, b) => (a.date > b.date ? a : b));
    return DateTime.fromJSDate(latest.date, { zone: "utc" }).toISO();
  });
  // Convert double hyphens to em dashes for nicer typography
  config.addFilter("emdash", (value) => {
    const v = String(value || '');
    return v.replace(/--/g, '—');
  });
  config.addFilter("htmlToAbsoluteUrls", (content, siteBaseUrl) => {
    const base = (siteBaseUrl || '').replace(/\/$/, '');
    const html = content || '';
    return html
      // href attributes
      .replace(/href="\/(?!\/)/g, `href="${base}/`)
      // src attributes
      .replace(/src="\/(?!\/)/g, `src="${base}/`)
      // srcset attributes (handles comma-separated URLs)
      .replace(/srcset="([^"]*)"/g, (m, val) => {
        const updated = (val || '').replace(/\s+\/(?!\/)/g, ` ${base}/`).replace(/^\/(?!\/)/, `${base}/`);
        return `srcset="${updated}"`;
      });
  });

  // Strip unsafe elements/attributes from feed content
  config.addFilter("sanitizeFeedHtml", (content) => {
    const html = String(content || '');
    return html
      // remove script/style/link/iframe blocks
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      // drop inline style attributes
      .replace(/\sstyle="[^"]*"/gi, '')
      // drop inline event handlers (on*)
      .replace(/\son[a-z]+="[^"]*"/gi, '');
  });

  // Compute plain-text word count from HTML content
  config.addFilter("wordCount", (content) => {
    try {
      const html = String(content || '');
      const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<[^>]+>/g, ' ') // strip remaining tags
        .replace(/&[a-z#0-9]+;/gi, ' ') // drop entities
        .replace(/[\s\n\r\t]+/g, ' ') // collapse whitespace
        .trim();
      if (!cleaned) return 0;
      return cleaned.split(/\s+/).filter(Boolean).length;
    } catch (e) {
      return 0;
    }
  });

  // Format a number with locale separators (e.g., 1,234)
  config.addFilter("formatNumber", (value, locale = 'en-US') => {
    try {
      const n = Number(value);
      if (!isFinite(n)) return String(value ?? '');
      return n.toLocaleString(locale);
    } catch (e) {
      return String(value ?? '');
    }
  });

  // Extract h2 headings (id + text) from rendered content for the post
  // contents rail. Depends on the markdown-it-anchor ids added below; the
  // trailing '#' permalink anchor is stripped from the visible text.
  config.addFilter("tocEntries", (content) => {
    try {
      const html = String(content || '');
      const entries = [];
      const re = /<h2[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/gi;
      let match;
      while ((match = re.exec(html)) !== null) {
        const text = match[2]
          .replace(/<a[^>]*class="kh-anchor"[\s\S]*?<\/a>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/[\s\n\r\t]+/g, ' ')
          .trim();
        if (match[1] && text) entries.push({ id: match[1], text });
      }
      return entries;
    } catch (e) {
      return [];
    }
  });

  // Document reference for the post masthead, in the datasheet register.
  // Blog posts derive it from the dated file slug (`20260626-down-the-stack`
  // -> `AAK-20260626`), falling back to the post date if a slug ever lacks
  // the prefix. Stable because slugs are permalinks and never renamed.
  config.addFilter("docRef", (page) => {
    try {
      const m = /^(\d{8})(?:-|$)/.exec((page && page.fileSlug) || '');
      if (m) return `AAK-${m[1]}`;
      const d = new Date(page && page.date);
      if (!isNaN(d)) {
        const pad = (n) => String(n).padStart(2, '0');
        return `AAK-${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  // Impact stories carry an `IS-nn` part number, shared between the /work
  // spec table and the story's own masthead so the register row and the
  // document it points to can never disagree. Numbers are assigned in
  // date-ASCENDING order (oldest story = IS-01) so new work appends to the
  // register instead of renumbering it -- the impactStories collection
  // itself is newest-first for display. The only way an existing ref moves
  // is backdating a story before another; don't do that.
  config.addFilter("impactStoryRef", (stories, url) => {
    try {
      const ordered = (stories || []).slice().sort((a, b) => (
        (a.date - b.date) || String(a.url).localeCompare(String(b.url))
      ));
      const i = ordered.findIndex((p) => p.url === url);
      return i === -1 ? null : `IS-${String(i + 1).padStart(2, '0')}`;
    } catch (e) {
      return null;
    }
  });

  // Data marks (micro-visualisations)
  // ---------------------------------
  // Build-time data for the small marks on post pages: the twelve-month
  // pulse strip, the sequence rail, the length gauge, and topic tallies.
  // Everything is computed at build time and baked into markup — no JS.

  // Classify a collection item into the register's three entry types.
  // Notes are a flavour of article, not a fourth type.
  function khEntryType(item) {
    const tags = getTagArray(item);
    if (tags.includes('impact-stories')) return 'impact';
    if (tags.includes('digesting')) return 'digesting';
    return 'article';
  }

  // Twelve calendar months ending at the build month, each with counts by
  // entry type. Fed by a collection (usually allContent) so the strip shows
  // the whole register, not just one type.
  // months = 0 means "all time": span from the earliest item to this month.
  config.addFilter('pulseMonths', (items, months = 12) => {
    try {
      const now = DateTime.utc().startOf('month');
      let span = months;
      if (!span) {
        const dates = (items || []).map((i) => i.date).filter(Boolean);
        if (!dates.length) return [];
        const earliest = DateTime.fromJSDate(new Date(Math.min(...dates)), { zone: 'utc' })
          .startOf('month');
        span = Math.max(1, Math.round(now.diff(earliest, 'months').months) + 1);
      }
      const start = now.minus({ months: span - 1 });
      months = span;
      const slots = [];
      for (let i = 0; i < months; i += 1) {
        const m = start.plus({ months: i });
        slots.push({
          key: m.toFormat('yyyy-LL'),
          label: m.toFormat('LLL yy'),
          longLabel: m.toFormat('LLLL yyyy'),
          year: m.toFormat('yyyy'),
          // January starts a new year band on the axis. The first slot also
          // gets a label so a cropped view is never missing its leading year.
          yearStart: m.month === 1,
          counts: { article: 0, digesting: 0, impact: 0 },
          total: 0,
          url: null,
          size: 0
        });
      }
      const byKey = new Map(slots.map((s) => [s.key, s]));
      (items || []).forEach((item) => {
        const key = DateTime.fromJSDate(item.date, { zone: 'utc' }).toFormat('yyyy-LL');
        const slot = byKey.get(key);
        if (!slot) return;
        slot.counts[khEntryType(item)] += 1;
        slot.total += 1;
        // Newest entry of the month wins, so the dot links somewhere useful.
        if (!slot.newest || item.date > slot.newest) {
          slot.newest = item.date;
          slot.url = item.url;
          slot.title = (item.data && item.data.title) || item.url;
        }
      });
      // Size by AREA, not by side length: a month with four entries should
      // look twice as wide as one with a single entry, not four times.
      slots.forEach((s2) => {
        s2.size = s2.total ? Math.min(14, Math.round(4 * Math.sqrt(s2.total))) : 0;
        delete s2.newest;
      });
      return slots;
    } catch (e) {
      return [];
    }
  });

  // Collapse runs of complete empty calendar years into a single break, so
  // the timeline does not scroll through years of nothing. Only whole years
  // that fall entirely inside the range are collapsed; a partial year at
  // either end stays as months.
  config.addFilter('collapseEmptyYears', (slots, captions) => {
    try {
      const list = slots || [];
      if (!list.length) return list;
      const byYear = new Map();
      list.forEach((s2) => {
        if (!byYear.has(s2.year)) byYear.set(s2.year, []);
        byYear.get(s2.year).push(s2);
      });
      const empty = new Set();
      byYear.forEach((months, year) => {
        // 12 months present and none of them carrying an entry.
        if (months.length === 12 && months.every((m) => !m.total)) empty.add(year);
      });
      if (!empty.size) return list;

      const out = [];
      let run = [];
      const flush = () => {
        if (!run.length) return;
        const from = run[0];
        const to = run[run.length - 1];
        const key = from === to ? from : `${from}-${to}`;
        const caption = (captions && (captions[key] || captions[from])) || '';
        out.push({
          gap: true,
          key: `gap-${key}`,
          fromYear: from,
          toYear: to,
          months: run.length * 12,
          label: from === to ? from : `${from}\u2013${to}`,
          caption
        });
        run = [];
      };
      list.forEach((s2) => {
        if (empty.has(s2.year)) {
          if (!run.includes(s2.year)) run.push(s2.year);
          return;
        }
        flush();
        out.push(s2);
      });
      flush();
      return out;
    } catch (e) {
      return [];
    }
  });

  // The current page plus up to `span` neighbours either side, oldest first,
  // for the sequence rail. Input collection is newest-first.
  config.addFilter('neighbourhood', (items, url, span = 3) => {
    try {
      const list = items || [];
      const i = list.findIndex((p) => p.url === url);
      if (i === -1) return [];
      const out = [];
      for (let idx = i + span; idx >= i - span; idx -= 1) {
        if (idx < 0 || idx >= list.length) continue;
        const item = list[idx];
        out.push({
          url: item.url,
          title: (item.data && item.data.title) || item.url,
          dateLabel: DateTime.fromJSDate(item.date, { zone: 'utc' }).toFormat('d LLL yyyy'),
          type: khEntryType(item),
          current: idx === i
        });
      }
      return out;
    } catch (e) {
      return [];
    }
  });

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

  config.addFilter('sortByScore', (arr) => [...(arr || [])].sort((a, b) => b.s - a.s));

  // Force-directed view of the same graph. Included for comparison: with 100
  // nodes it tends toward a hairball, and force position encodes nothing
  // reliable, unlike the MDS view where distance means similarity.
  config.addShortcode('semanticForce', (map, w = 900, h = 520) => {
    try {
      if (!map || !map.nodes || !map.nodes.length) return '';
      const pad = 20;
      const px = (n) => (pad + (n.fx != null ? n.fx : n.x) * (w - pad * 2)).toFixed(1);
      const py = (n) => (pad + (1 - (n.fy != null ? n.fy : n.y)) * (h - pad * 2)).toFixed(1);
      const edges = (map.edges || []).map((e) => {
        const a = map.nodes[e.a]; const b = map.nodes[e.b];
        if (!a || !b) return '';
        return `<line x1="${px(a)}" y1="${py(a)}" x2="${px(b)}" y2="${py(b)}" stroke="#a89257" stroke-opacity="0.5" stroke-width="1"></line>`;
      }).join('');
      const dots = map.nodes.map((n) => {
        const r = 3 + Math.min(4, (n.degree || 0) * 0.5);
        return `<a href="${n.url}"><title>${n.title}${n.topic ? ` — ${n.topic}` : ''} (${n.degree || 0} links)</title>`
          + `<circle cx="${px(n)}" cy="${py(n)}" r="${r.toFixed(1)}" fill="#5b5e5a"></circle></a>`;
      }).join('');
      return `<svg class="kh-map" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" `
        + `aria-label="Force-directed view of the same ${map.nodes.length} entries and ${(map.edges || []).length} links. Point size shows how many links an entry has."><g>${edges}</g><g>${dots}</g></svg>`;
    } catch (e) { return ''; }
  });

  // Adjacency matrix. Rows and columns are entries grouped by primary topic; a
  // filled cell means that pair is linked. A matrix cannot produce a hairball:
  // density is read directly, and blocks on the diagonal are clusters.
  config.addShortcode('semanticMatrix', (map, cell = 7) => {
    try {
      if (!map || !map.order || !map.order.length) return '';
      const ord = map.order;
      const n = ord.length;
      const pos = new Map(ord.map((o, k) => [o.i, k]));
      const size = n * cell;
      const cells = (map.edges || []).flatMap((e) => {
        const a = pos.get(e.a); const b = pos.get(e.b);
        if (a == null || b == null) return [];
        const o = Math.min(0.95, 0.35 + (e.s - map.edgeMin) * 1.6).toFixed(2);
        const t = `${map.nodes[e.a].title} + ${map.nodes[e.b].title} (${e.s})`;
        return [
          `<rect x="${b * cell}" y="${a * cell}" width="${cell - 1}" height="${cell - 1}" fill="#5b5e5a" fill-opacity="${o}"><title>${t}</title></rect>`,
          `<rect x="${a * cell}" y="${b * cell}" width="${cell - 1}" height="${cell - 1}" fill="#5b5e5a" fill-opacity="${o}"><title>${t}</title></rect>`
        ];
      }).join('');
      // Rule between topic groups, so the blocks are readable as clusters.
      let rules = '';
      for (let k = 1; k < n; k += 1) {
        if (ord[k].topic !== ord[k - 1].topic) {
          const at = k * cell - 0.5;
          rules += `<line x1="0" y1="${at}" x2="${size}" y2="${at}" stroke="#ded2a8" stroke-width="1"></line>`
            + `<line x1="${at}" y1="0" x2="${at}" y2="${size}" stroke="#ded2a8" stroke-width="1"></line>`;
        }
      }
      return `<svg class="kh-map kh-matrix" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" `
        + `aria-label="Adjacency matrix of ${n} entries grouped by topic. A filled cell means the pair is linked; blocks along the diagonal are clusters."><g>${rules}</g><g>${cells}</g></svg>`;
    } catch (e) { return ''; }
  });

  // Arc diagram. Entries on one line in cluster order, links as arcs above.
  // Compact, and it fits a strip far better than any 2D layout.
  config.addShortcode('semanticArc', (map, w = 900, h = 190) => {
    try {
      if (!map || !map.order || !map.order.length) return '';
      const ord = map.order;
      const n = ord.length;
      const pos = new Map(ord.map((o, k) => [o.i, k]));
      const step = (w - 20) / (n - 1);
      const x = (k) => (10 + k * step);
      const base = h - 22;
      const arcs = (map.edges || []).map((e) => {
        const a = pos.get(e.a); const b = pos.get(e.b);
        if (a == null || b == null) return '';
        const x1 = x(Math.min(a, b)); const x2 = x(Math.max(a, b));
        const r = (x2 - x1) / 2;
        const o = Math.min(0.8, 0.25 + (e.s - map.edgeMin) * 1.6).toFixed(2);
        return `<path d="M ${x1.toFixed(1)} ${base} A ${r.toFixed(1)} ${Math.min(r, base - 6).toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${base}" `
          + `fill="none" stroke="#a89257" stroke-opacity="${o}" stroke-width="1"><title>${map.nodes[e.a].title} + ${map.nodes[e.b].title} (${e.s})</title></path>`;
      }).join('');
      const dots = ord.map((o, k) => {
        const nd = map.nodes[o.i];
        return `<a href="${nd.url}"><title>${nd.title}${nd.topic ? ` — ${nd.topic}` : ''}</title>`
          + `<circle cx="${x(k).toFixed(1)}" cy="${base}" r="2.5" fill="#5b5e5a"></circle></a>`;
      }).join('');
      return `<svg class="kh-map" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" `
        + `aria-label="Arc diagram: ${n} entries on a line in topic order, with an arc for each of the ${(map.edges || []).length} links."><g>${arcs}</g>`
        + `<line x1="10" y1="${base}" x2="${w - 10}" y2="${base}" stroke="#ded2a8" stroke-width="1"></line><g>${dots}</g></svg>`;
    } catch (e) { return ''; }
  });

  // Static SVG map of the corpus: entries positioned by semantic similarity,
  // with a link drawn where two are genuinely close. Built at build time from
  // src/site/_data/semanticMap.json; no client-side library, no layout run in
  // the browser, and the same picture every time.
  config.addShortcode('semanticMap', (map, w = 900, h = 520) => {
    try {
      if (!map || !map.nodes || !map.nodes.length) return '';
      const pad = 18;
      const px = (n) => (pad + n.x * (w - pad * 2)).toFixed(1);
      // SVG y grows downward; flip so the projection is not mirrored.
      const py = (n) => (pad + (1 - n.y) * (h - pad * 2)).toFixed(1);

      const edges = (map.edges || []).map((e) => {
        const a = map.nodes[e.a];
        const b = map.nodes[e.b];
        if (!a || !b) return '';
        // Opacity carries strength, faintly. The link's existence is the
        // signal; its exact weight is not worth reading off a line.
        const o = Math.min(0.85, 0.3 + (e.s - map.edgeMin) * 1.8).toFixed(2);
        return `<line x1="${px(a)}" y1="${py(a)}" x2="${px(b)}" y2="${py(b)}" `
          + `stroke="#a89257" stroke-opacity="${o}" stroke-width="1"></line>`;
      }).join('');

      const dots = map.nodes.map((n) => {
        const label = n.topic ? `${n.title} — ${n.topic}` : n.title;
        return `<a href="${n.url}"><title>${label}</title>`
          + `<circle cx="${px(n)}" cy="${py(n)}" r="3.5" fill="#5b5e5a"></circle></a>`;
      }).join('');

      return `<svg class="kh-map" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" `
        + `role="img" aria-label="Map of ${map.nodes.length} entries positioned by similarity of meaning, `
        + `with ${(map.edges || []).length} links between closely related pairs. `
        + `The axes carry no meaning; only relative distance does.">`
        + `<g>${edges}</g><g>${dots}</g></svg>`;
    } catch (e) {
      return '';
    }
  });

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
      const dir = Path.join(__dirname, 'src/site/posts');
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

  // // Estimate reading time in minutes at ~225 words per minute (min 1)
  // config.addFilter("readingTime", (content, wpm = 225) => {
  //   try {
  //     const words = config.getFilter("wordCount")(content);
  //     const perMinute = Number(wpm) > 0 ? Number(wpm) : 225;
  //     const minutes = Math.max(1, Math.ceil(words / perMinute));
  //     return minutes;
  //   } catch (e) {
  //     return 1;
  //   }
  // });

  // Configure Markdown-It with anchor IDs for headings and use it globally
  const markdownIt = require('markdown-it');
  const markdownItAnchor = require('markdown-it-anchor');

  // Plugin to convert double hyphens to em dashes in Markdown text tokens
  const emdashPlugin = (md) => {
    md.core.ruler.after('inline', 'emdash', (state) => {
      state.tokens.forEach((blockToken) => {
        if (blockToken.type !== 'inline' || !Array.isArray(blockToken.children)) return;
        blockToken.children.forEach((token) => {
          if (token.type === 'text') {
            token.content = token.content.replace(/--/g, '—');
          }
        });
      });
    });
  };

  const md = markdownIt({ html: true, linkify: true }).use(markdownItAnchor, {
    // Add ids to all heading levels so we can deep-link
    level: [1, 2, 3, 4, 5, 6],
    // Create clean ASCII slugs: remove punctuation/specials, collapse spaces to '-'
    slugify: (s) => (
      (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // strip combining marks
        .replace(/&amp;/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '') // drop punctuation and specials (e.g. ?!@():’–)
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
    ),

    // Append a discrete '#' permalink link to the end of the heading content
    permalink: (slug, opts, state, index) => {
      try {
        const inlineToken = state.tokens[index + 1];
        if (!inlineToken || !Array.isArray(inlineToken.children)) return;
        // Create a small '#' anchor link that is the only clickable element
        const linkOpen = new state.Token('link_open', 'a', 1);
        linkOpen.attrs = [
          ['href', `#${slug}`],
          ['class', 'kh-anchor'],
          ['aria-label', 'Permalink to this heading']
        ];
        const textToken = new state.Token('text', '', 0);
        textToken.content = '#';
        const linkClose = new state.Token('link_close', 'a', -1);

        inlineToken.children.push(linkOpen, textToken, linkClose);
      } catch (e) {
        // no-op
      }
    }
  }).use(emdashPlugin);

  // Use for Eleventy's markdown engine (for .md files and markdown in templates)
  config.setLibrary('md', md);
  // Paired shortcode to render inline markdown blocks consistently
  config.addPairedShortcode('markdown', (content) => md.render(content || ''));

  // Margin apparatus, markdown-authorable. Both render inline markdown (links,
  // emphasis, code, `--` em dashes) so posts no longer need raw `<a href>`
  // HTML inside the aside. Keep content to 1-2 sentences; no blank lines.
  //
  // {% marginnote %}A supporting citation with a [link](https://…).{% endmarginnote %}
  config.addPairedShortcode('marginnote', (content) => (
    `<aside class="kh-marginnote">${md.renderInline(String(content || '').trim())}</aside>`
  ));

  // {% pullquote %}A short phrase lifted verbatim from the paragraph.{% endpullquote %}
  // Pull-quotes repeat body text, so they are hidden from assistive tech and
  // the search index; never put content in one that exists nowhere else.
  config.addPairedShortcode('pullquote', (content) => (
    `<aside class="kh-pullquote" aria-hidden="true" data-pagefind-ignore>${md.renderInline(String(content || '').trim())}</aside>`
  ));

  // Paired shortcode: render escaped code and a live demo from the same HTML snippet
  // Usage (place outside of a {% markdown %} block):
  // {% codeAndDemo 'html' %}
  // <form>...</form>
  // <script>...</script>
  // {% endcodeAndDemo %}
  config.addPairedShortcode('codeAndDemo', (content, lang = 'html') => {
    const snippet = String(content || '');
    const escapeHtml = (s) => (
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    );
    const escaped = escapeHtml(snippet);
    return [
      '<div class="kh-demo" data-pagefind-ignore>',
      `<pre><code class="language-${lang}">${escaped}</code></pre>`,
      '<div class="kh-demo__live">',
      snippet,
      '</div>',
      '</div>'
    ].join('');
  });

  // Shortcode to generate Eleventy screenshot service URL for dynamic OG images
  // Usage: {% ogImageUrl %}
  config.addShortcode('ogImageUrl', function() {
    // Build the social card URL for this page
    const socialCardUrl = `https://www.allaboutken.com/social${this.page.url}`;
    // URI encode the URL for the screenshot service
    const encodedUrl = encodeURIComponent(socialCardUrl);
    // Return the screenshot service URL with opengraph size (1200x630)
    return `https://v1.screenshot.11ty.dev/${encodedUrl}/opengraph/`;
  });

  // Removed custom codeblock tag; posts now use fenced code blocks in markdown.

  // config.addFilter("makeLowercase", function(value) {
  //   value = value || '';
  //   return value.toLowerCase();
  // });

  // config.addFilter("spaceToDashes", function(value) {
  //   value = value || '';
  //   return value.replace(/\s+/g, '-').toLowerCase();
  // });

  // Shortcodes
  // https://www.11ty.io/docs/shortcodes/
  // nunjucks
  // {% sampleShortcode "firstName", "lastName" %}
  // handlebars
  // {{ sampleShortcode "firstName" "lastName" }}
  // config.addShortcode("sampleShortcode", function(firstName, lastName) {
  //   return 'hi ' + firstName + lastName;
  // });

  // config.addNunjucksTag("uppercase", function(nunjucksEngine) {
  //   return new function() {
  //     this.tags = ["uppercase"];
  //
  //     this.parse = function(parser, nodes, lexer) {
  //       var tok = parser.nextToken();
  //
  //       var args = parser.parseSignature(null, true);
  //       parser.advanceAfterBlockEnd(tok.value);
  //
  //       return new nodes.CallExtensionAsync(this, "run", args);
  //     };
  //
  //     this.run = function(context, myStringArg, callback) {
  //       let ret = new nunjucksEngine.runtime.SafeString(
  //         myStringArg.toUpperCase()
  //       );
  //       callback(null, ret);
  //     };
  //   }();
  // });

  // copy js files
  config.addPassthroughCopy("./src/site/**/*.js");
  // pass through favicon assets
  config.addPassthroughCopy({ "./src/components/ken-favicon/assets": "assets/ken-favicon/assets" });

  // pass some assets right through
  config.addPassthroughCopy("./src/site/images");

  // Copy local Recursive font assets to build
  config.addPassthroughCopy({ "./src/components/kh-font": "assets/kh-font" });
  // mostly needed for redirecting from old drupal urls
  config.addPassthroughCopy("./src/site/**/*.html");
  // downloadable text resources (starter kits, templates)
  config.addPassthroughCopy("./src/site/**/*.txt");

  // Watch source images for changes
  config.addWatchTarget("./src/site/images");

  // Post-build: generate Pagefind search index
  let pagefindChild = null;
  config.on('eleventy.after', () => {
    const cmd = 'pagefind --site build --exclude-selectors "pre, code"';
    if (isDev) {
      // Kill any previous run so overlapping builds don't corrupt the index
      if (pagefindChild) {
        pagefindChild.kill();
        pagefindChild = null;
      }
      // Run in background so dev rebuilds aren't blocked
      pagefindChild = exec(cmd, (err) => {
        pagefindChild = null;
        if (err && !err.killed) console.error('Pagefind index build failed');
      });
      pagefindChild.stdout?.pipe(process.stdout);
      pagefindChild.stderr?.pipe(process.stderr);
    } else {
      try {
        execSync(cmd, { stdio: 'inherit' });
      } catch (e) {
        console.error('Pagefind index build failed');
      }
    }
  });

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

  // Image transforms run on-request in dev; no separate watcher is required

  // If you have other `addPlugin` calls, it’s important that UpgradeHelper is added last.
  return {
    dir: {
      input: "src/site",
      output: "build",
      data: "_data",
      includes: "_includes"
    },
    templateFormats : [
      "njk", "md",
      "css", "js"
    ],
    htmlTemplateEngine : ["njk", "md"],
    markdownTemplateEngine : "njk",
    passthroughFileCopy: true,
    // pathPrefix: "/vf-eleventy/" // if your site is deployed to a sub-url, otherwise comment out
  };
};
