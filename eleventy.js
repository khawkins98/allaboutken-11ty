const { DateTime } = require('luxon');
const _            = require('lodash');
const Path         = require('path');
const { execSync } = require('child_process');
// const UpgradeHelper = require("@11ty/eleventy-upgrade-help");

module.exports = function(config) {
  // BroswerSync options
  // config.setBrowserSyncConfig({ open: true, open: "local" });
  // 11ty version 2 has its own dev server
  // https://www.11ty.dev/docs/dev-server/
  config.setServerOptions({
    // Default values are shown:
    showVersion: true,
    // Whether the live reload snippet is used
    liveReload: true,

    // It cannot open a browser tab without hacks
    // https://github.com/11ty/eleventy-dev-server/issues/28
    // open: true,

    // Whether DOM diffing updates are applied where possible instead of page reloads
    domDiff: true,

    // The starting port number
    // Will increment up to (configurable) 10 times if a port is already in use.
    // port: 8080,

    // Additional files to watch that will trigger server updates
    // Accepts an Array of file paths or globs (passed to `chokidar.watch`).
    // Works great with a separate bundler writing files to your output folder.
    // e.g. `watch: ["_site/**/*.css"]`
    // watch: [],

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

  // Add a no-op Nunjucks tag for `render` so legacy templates don't fail
  config.addNunjucksTag("render", function(nunjucksEngine) {
    return new function() {
      this.tags = ["render"];
      this.parse = function(parser, nodes) {
        const tok = parser.nextToken();
        const args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        return new nodes.CallExtensionAsync(this, "run", args);
      };
      this.run = function(context) {
        const cb = arguments[arguments.length - 1];
        const ret = new nunjucksEngine.runtime.SafeString("<!-- render tag omitted -->");
        cb(null, ret);
      };
    }();
  });

  // Paired shortcode to render inline markdown blocks
  const markdownIt = require('markdown-it')({ html: true, linkify: true });
  config.addPairedShortcode('markdown', (content) => markdownIt.render(content || ''));

  // Nunjucks codeblock tag shim
  config.addNunjucksTag('codeblock', function(nunjucksEngine) {
    return new function() {
      this.tags = ['codeblock'];
      this.parse = function(parser, nodes) {
        const tok = parser.nextToken();
        const args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        const body = parser.parseUntilBlocks('endcodeblock');
        parser.advanceAfterBlockEnd();
        return new nodes.CallExtensionAsync(this, 'run', args, [body]);
      };
      this.run = function(context, lang, body, cb) {
        const code = String(body());
        const escaped = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const ret = new nunjucksEngine.runtime.SafeString(`<pre data-lang="${lang}"><code>${escaped}</code></pre>`);
        cb(null, ret);
      };
    }();
  });

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
  // -----

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
  // pass through built scripts and css
  // these are already in output, no passthrough needed
  // pass through favicon assets
  config.addPassthroughCopy({ "./src/components/ken-favicon/assets": "assets/ken-favicon/assets" });
  // pass through vf-search-client-side JS for search page
  config.addPassthroughCopy({ "./node_modules/@visual-framework/vf-search-client-side/vf-search-client-side.js": "scripts/vf-search-client-side.js" });

  // pass some assets right through
  config.addPassthroughCopy("./src/site/images");

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

