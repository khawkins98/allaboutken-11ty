const { DateTime } = require('luxon');
const _            = require('lodash');
const Path         = require('path');
const Fs           = require('fs');
const { execSync } = require('child_process');
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
// const UpgradeHelper = require("@11ty/eleventy-upgrade-help");

module.exports = function(config) {
  const isDev = process.env.ELEVENTY_ENV === 'development';
  // Transform <img>/<picture> in HTML to responsive images at build time
  config.addPlugin(eleventyImageTransformPlugin, {
    outputDir: "./build/img/",
    urlPath: "/img/",
    widths: [320, 600, 900, 1280],
    formats: ["avif", "webp", "jpeg"],
    transformOnRequest: isDev,
    // Do not fail the entire build on a single image error (e.g., 404 remote)
    failOnError: false,
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

  // Async shortcode: list all cached webmentions (for an admin/utility page)
  config.addNunjucksAsyncShortcode('webmentions_all', async () => {
    try {
      const cacheDir = Path.join(process.cwd(), '.cache');
      if (!Fs.existsSync(cacheDir)) return '<p>No cache yet.</p>';
      const files = Fs.readdirSync(cacheDir).filter(f => f.startsWith('webmentions-') && f.endsWith('.json'));
      const sanitize = config.getFilter('sanitizeFeedHtml');
      const items = [];
      for (const f of files) {
        try {
          const data = JSON.parse(Fs.readFileSync(Path.join(cacheDir, f), 'utf-8'));
          const children = Array.isArray(data.children) ? data.children : [];
          for (const c of children) {
            items.push(c);
          }
        } catch (e) {
          // skip bad cache file
        }
      }
      // basic normalization
      const entries = items.map(it => ({
        id: it['wm-id'],
        prop: it['wm-property'],
        target: it['wm-target'],
        source: it['wm-source'],
        url: it.url,
        published: it.published || it['wm-received'],
        author: it.author?.name || it.author?.url || 'Someone',
        authorUrl: it.author?.url || '',
        authorPhoto: it.author?.photo || '',
        contentHtml: it.content?.html ? sanitize(it.content.html) : '',
        contentText: it.content?.text || ''
      }));
      // sort newest first
      entries.sort((a, b) => String(b.published || '').localeCompare(String(a.published || '')));

      let html = `<table class="kh-table"><thead><tr><th>Type</th><th>Author</th><th>Source</th><th>Target</th><th>When</th></tr></thead><tbody>`;
      for (const e of entries) {
        const author = e.authorUrl ? `<a href="${e.authorUrl}">${_.escape(e.author)}</a>` : _.escape(e.author);
        const body = e.contentHtml || _.escape(e.contentText || '');
        html += `<tr><td>${_.escape(e.prop || '')}</td><td>${author}</td><td><a href="${e.source}">source</a></td><td><code>${_.escape(e.target || '')}</code></td><td>${_.escape(e.published || '')}</td></tr>`;
        if (body) {
          html += `<tr><td></td><td colspan="4" class="kh-text-body--2">${body}</td></tr>`;
        }
      }
      html += `</tbody></table>`;
      return html;
    } catch (e) {
      return '<p>Error reading webmentions cache.</p>';
    }
  });

  // Async Nunjucks filter: fetch and render Webmentions for an absolute URL
  // Cached locally to avoid rate limits and speed up builds
  //
  // Inspiration & references:
  // - Max Böck’s eleventy-webmentions (MIT): https://github.com/maxboeck/eleventy-webmentions
  // - Sia K’s “Webmentions & Eleventy in depth”: https://sia.codes/posts/webmentions-eleventy-in-depth/
  //
  // Note: This implementation is bespoke for this site (target-scoped cache files,
  // minimal dependencies, and rendering tailored to existing CSS utilities).
  config.addNunjucksAsyncFilter('webmentions', async (absoluteUrl, callback) => {
    try {
      const target = String(absoluteUrl || '').trim();
      if (!target || !/^https?:\/\//i.test(target)) {
        return callback(null, '');
      }

      const cacheDir = Path.join(process.cwd(), '.cache');
      const cacheTtlMs = 60 * 60 * 1000; // 1 hour

      if (!Fs.existsSync(cacheDir)) {
        try { Fs.mkdirSync(cacheDir, { recursive: true }); } catch (e) { /* no-op */ }
      }

      // Support legacy host (work.allaboutken.com) by merging mentions
      const newUrl = new URL(target);
      const legacyBase = 'https://work.allaboutken.com';
      const legacyTarget = `${legacyBase}${newUrl.pathname}`;
      const targets = Array.from(new Set([target, legacyTarget]));

      const fetchMentions = async (tgt) => {
        const cacheKey = tgt.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
        const cacheFile = Path.join(cacheDir, `webmentions-${cacheKey}.json`);
        let cached = null;
        try {
          const stat = Fs.existsSync(cacheFile) ? Fs.statSync(cacheFile) : null;
          if (stat && (Date.now() - stat.mtimeMs) < cacheTtlMs) {
            cached = JSON.parse(Fs.readFileSync(cacheFile, 'utf-8'));
          }
        } catch (e) {
          cached = null;
        }
        if (cached) return cached;
        const params = new URLSearchParams({ target: tgt, 'per-page': '100' });
        // Example:
        // https://webmention.io/api/mentions.jf2?target=https%3A%2F%2Fwww.allaboutken.com%2Fposts%2F20250912-knowledge-over-data%2F&per-page=100
        const url = `https://webmention.io/api/mentions.jf2?${params.toString()}`;
        let resJson = { children: [] };
        try {
          const res = await (global.fetch ? fetch(url) : await import('node-fetch').then(m => m.default(url)));
          if (res && res.ok) {
            resJson = await res.json();
          }
        } catch (e) {
          // network error -> fall back to empty
        }
        try { Fs.writeFileSync(cacheFile, JSON.stringify(resJson || { children: [] }), 'utf-8'); } catch (e) { /* no-op */ }
        return resJson || { children: [] };
      };

      // Merge children from all targets and de-duplicate by wm-id
      let merged = [];
      for (const t of targets) {
        const jf2 = await fetchMentions(t);
        const children = Array.isArray(jf2.children) ? jf2.children : [];
        merged = merged.concat(children);
      }
      const seen = new Set();
      const entries = merged.filter((it) => {
        const id = it && it['wm-id'];
        if (id && !seen.has(id)) { seen.add(id); return true; }
        return !id; // keep if no id, rare
      });
      const sanitize = config.getFilter('sanitizeFeedHtml');

      const byType = {
        replies: [],
        mentions: [],
        likes: [],
        reposts: []
      };

      for (const item of entries) {
        const prop = item && item["wm-property"]; // e.g., in-reply-to, mention-of, like-of, repost-of
        const published = item && (item.published || item["wm-received"]) || '';
        const author = item && item.author || {};
        const content = item && item.content || {};
        const contentHtml = typeof content.html === 'string' ? sanitize(content.html) : '';
        const contentText = typeof content.text === 'string' ? content.text : '';
        const authorName = author.name || author.url || 'Someone';
        const authorPhoto = author.photo || '';
        const authorUrl = author.url || '';

        const base = { authorName, authorPhoto, authorUrl, published, contentHtml, contentText, url: item.url };
        if (prop === 'in-reply-to') {
          byType.replies.push(base);
        } else if (prop === 'mention-of') {
          byType.mentions.push(base);
        } else if (prop === 'like-of') {
          byType.likes.push(base);
        } else if (prop === 'repost-of') {
          byType.reposts.push(base);
        }
      }

      const formatDate = (d) => {
        try { return d ? DateTime.fromISO(d, { zone: 'utc' }).toFormat('d LLL y') : ''; } catch { return ''; }
      };

      const avatarImg = (src, alt) => (src ? `<img src="${src}" alt="" title="${_.escape(alt || '')}" width="24" height="24" loading="lazy">` : '');

      let html = '';
      const total = byType.replies.length + byType.mentions.length + byType.likes.length + byType.reposts.length;
      html += `<section class="kh-stack kh-u-padding__top--800 kh-u-do-not-print"><h2 class="kh-text-heading--2">Webmentions${total ? ` (${total})` : ''}</h2>`;

      const renderList = (items, heading) => {
        if (!items.length) return '';
        let out = `<h3 class="kh-text-heading--3">${heading}</h3><ul class="kh-stack">`;
        for (const it of items) {
          const text = it.contentText || it.contentHtml || '';
          const body = it.contentHtml || _.escape(it.contentText || '');
          const byline = [it.authorUrl ? `<a href="${it.authorUrl}">${_.escape(it.authorName)}</a>` : _.escape(it.authorName), formatDate(it.published)].filter(Boolean).join(' · ');
          out += `<li class="kh-media">${avatarImg(it.authorPhoto, it.authorName)}<div class="kh-media__body"><div class="kh-text-body--2">${body}</div><div class="kh-text-body--3 kh-u-color--muted">${byline}</div></div></li>`;
        }
        out += `</ul>`;
        return out;
      };

      html += renderList(byType.replies, 'Replies');
      html += renderList(byType.mentions, 'Mentions');

      const renderFaces = (items, heading) => {
        if (!items.length) return '';
        let out = `<h3 class="kh-text-heading--3">${heading} (${items.length})</h3><p class="kh-cluster">`;
        for (const it of items) {
          out += `<span class="kh-avatar">${avatarImg(it.authorPhoto, it.authorName)}</span>`;
        }
        out += `</p>`;
        return out;
      };

      html += renderFaces(byType.likes, 'Likes');
      html += renderFaces(byType.reposts, 'Reposts');

      html += `</section>`;
      return callback(null, html);
    } catch (e) {
      return callback(null, '');
    }
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

  // Watch source images for changes
  config.addWatchTarget("./src/site/images");

  // Post-build tasks
  config.on('eleventy.after', () => {
    try {
      execSync('node scripts/build-search-index.js', { stdio: 'inherit' });
    } catch (e) {
      console.error('Search index build failed in eleventy.after');
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
