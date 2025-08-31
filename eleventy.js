const { DateTime } = require('luxon');
const _            = require('lodash');
const Path         = require('path');
const { execSync } = require('child_process');
// const UpgradeHelper = require("@11ty/eleventy-upgrade-help");

module.exports = function(config) {
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

  // {{ "myContent" | sampleFilter }}
  // config.addFilter("sampleFilter", function(value) {
  //   return 'ddd' + value;
  // });

  // Add any utility filters
  config.addFilter("dateDisplay", (dateObj, format = "d LLL y") => {
    return DateTime.fromJSDate(dateObj, {
      zone: "utc"
    }).toFormat(format);
  });

  // Minimal RSS helpers replacing vf-extensions filters
  config.addFilter("rssDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toISO();
  });
  config.addFilter("rssLastUpdatedDate", (posts) => {
    if (!Array.isArray(posts) || posts.length === 0) return DateTime.now().toISO();
    const latest = posts.reduce((a, b) => (a.date > b.date ? a : b));
    return DateTime.fromJSDate(latest.date, { zone: "utc" }).toISO();
  });
  config.addFilter("htmlToAbsoluteUrls", (content, absoluteUrl) => {
    return (content || '').replace(/href="\//g, `href="${absoluteUrl.replace(/\/$/, '')}/`);
  });

  // Configure Markdown-It with anchor IDs for headings and use it globally
  const markdownIt = require('markdown-it');
  const markdownItAnchor = require('markdown-it-anchor');
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
    // Wrap heading text with an <a href="#slug" name="slug">…</a>,
    // but skip if the heading already contains a link to avoid nesting
    permalink: (slug, opts, state, index) => {
      try {
        const inlineToken = state.tokens[index + 1];
        if (!inlineToken || !Array.isArray(inlineToken.children)) return;
        const hasExistingLink = inlineToken.children.some((t) => {
          if (t.type === 'link_open') return true;
          if (t.type === 'html_inline' && typeof t.content === 'string') {
            return /<a\s/i.test(t.content);
          }
          return false;
        });
        if (hasExistingLink) return;

        const linkOpen = new state.Token('link_open', 'a', 1);
        linkOpen.attrs = [
          ['href', `#${slug}`],
          ['name', slug]
        ];
        const linkClose = new state.Token('link_close', 'a', -1);

        inlineToken.children.unshift(linkOpen);
        inlineToken.children.push(linkClose);
      } catch (e) {
        // no-op
      }
    }
  });
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

  // If you want to minify html output
  // config.addTransform("htmlmin", require("./node_modules/\@visual-framework/vf-eleventy--extensions/utils/minify-html.js"));

  // Add any custom tags

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

  // Copy font assets to locations used by compiled CSS
  config.addPassthroughCopy({ "./src/components/vf-font-now-alt/assets": "vf-font-now-alt/assets" });
  // mostly needed for redirecting from old drupal urls
  config.addPassthroughCopy("./src/site/**/*.html");

  // Watch source images for changes
  config.addWatchTarget("./src/site/images");

  // Run image processing after each Eleventy build
  config.on('eleventy.after', () => {
    try {
      execSync('node scripts/process-images.js', { stdio: 'inherit' });
    } catch (e) {
      console.error('Image processing failed in eleventy.after');
    }
    try {
      execSync('node scripts/build-search-index.js', { stdio: 'inherit' });
    } catch (e) {
      console.error('Search index build failed in eleventy.after');
    }
  });

  // When dev server detects image changes, re-run processing immediately
  config.on('eleventy.beforeWatch', (changedFiles) => {
    if (Array.isArray(changedFiles) && changedFiles.some((f) => f.includes('src/site/images'))) {
      try {
        execSync('node scripts/process-images.js', { stdio: 'inherit' });
      } catch (e) {
        console.error('Image processing failed in eleventy.beforeWatch');
      }
    }
  });

  // // If you have other `addPlugin` calls, it’s important that UpgradeHelper is added last.
  // config.addPlugin(UpgradeHelper);
  return {
    dir: {
      input: "src/site",
      output: "build",
      data: "_data",
      includes: "_includes"
    },
    templateFormats : [
      "njk", "md", // note that .md files will also be parsed with njk processor
      "css", "js"
    ],
    htmlTemplateEngine : ["njk", "md"],
    markdownTemplateEngine : "njk",
    passthroughFileCopy: true,
    // pathPrefix: "/vf-eleventy/" // if your site is deployed to a sub-url, otherwise comment out
  };
};
