const { DateTime } = require('luxon');
const _            = require('lodash');
const Path         = require('path');
// const UpgradeHelper = require("@11ty/eleventy-upgrade-help");

module.exports = function(config) {
  // Add in tags, filters useful for Visual Framework installs
  // (fractal's render tag, codeblock, markdown, etc)
  // and common configuration

  // const vfEleventyExtension = require("@visual-framework/vf-extensions\/11ty");
  // revert once https://github.com/visual-framework/vf-core/pull/1848 is merged in and published to npm
  const vfEleventyExtension = require("./temp-fixes/vf-extensions/11ty");
  
  config.addPlugin(vfEleventyExtension);

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
  // this is necessary now that 11ty tries to compile JS files as templates
  // @todo: backport to vf-eleventy
  config.addPassthroughCopy("./src/site/**/*.js");

  // pass some assets right through
  config.addPassthroughCopy("./src/site/images");

  // mostly needed for redirecting from old drupal urls
  config.addPassthroughCopy("./src/site/**/*.html");

  // // If you have other `addPlugin` calls, it’s important that UpgradeHelper is added last.
  // config.addPlugin(UpgradeHelper);

  return {
    dir: {
      input: "src/site",
      output: "build",
      data: "_data"
    },
    templateFormats : [
      "njk", "md", // note that .md files will also be parsed with njk processor
      "css" // passthrough file copying for static assets
    ],
    htmlTemplateEngine : ["njk", "md"],
    markdownTemplateEngine : "njk",
    passthroughFileCopy: true,
    // pathPrefix: "/vf-eleventy/" // if your site is deployed to a sub-url, otherwise comment out
  };

};
