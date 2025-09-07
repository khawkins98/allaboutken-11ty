const { DateTime } = require('luxon');
const _            = require('lodash');
const Path         = require('path');
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
