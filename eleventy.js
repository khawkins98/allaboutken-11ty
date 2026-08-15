/**
 * Eleventy configuration — allaboutken-11ty
 *
 *
 * Keep this root file as the assembly point: server options, broadly useful
 * filters and the returned directory/template configuration remain visible
 * here. Concern-specific registrations live in config/eleventy/. Each module
 * exports one registration function and preserves the public filter,
 * shortcode and collection names used by templates.
 */

const { DateTime } = require('luxon');
const { registerImagePlugin, registerImageTransform } = require('./config/eleventy/images');
const registerTimeline = require('./config/eleventy/timeline');
const registerTopicVisuals = require('./config/eleventy/topic-visuals');
const registerSemanticVisuals = require('./config/eleventy/semantic-visuals');
const registerStats = require('./config/eleventy/stats');
const registerMarkdown = require('./config/eleventy/markdown');
const registerCollections = require('./config/eleventy/collections');
const registerAssetsAndSearch = require('./config/eleventy/assets-and-search');

module.exports = function(config) {
  const isDev = process.env.ELEVENTY_ENV === 'development';
  const isBootstrap = process.env.ELEVENTY_BOOTSTRAP === '1';
  registerImagePlugin(config, isDev);
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

  registerImageTransform(config);

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

  // Drop every item carrying a tag, without building a second collection for
  // it. Used by the homepage to keep photographs out of "Recent writing" while
  // leaving them in `allContent` itself, which /all/, /archive/ and /directory/
  // all still read. Filtering here rather than in the collection is the whole
  // point: the exclusion is one surface's editorial choice, not a fact about
  // the entry.
  config.addFilter("withoutTag", (items, tag) => {
    if (!Array.isArray(items)) return items;
    return items.filter((item) => {
      const tags = item?.data?.tags || [];
      return !(Array.isArray(tags) ? tags : [tags]).includes(tag);
    });
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

  registerTimeline(config);
  registerTopicVisuals(config);
  registerSemanticVisuals(config);
  registerStats(config);

  registerMarkdown(config);

  registerAssetsAndSearch(config, isDev, isBootstrap);

  registerCollections(config);

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
