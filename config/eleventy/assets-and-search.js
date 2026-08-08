const { execSync, exec } = require('child_process');

module.exports = function registerAssetsAndSearch(config, isDev, isBootstrap) {
  // copy js files
  config.addPassthroughCopy("./src/site/**/*.js");
  // pass through favicon assets
  config.addPassthroughCopy({ "./src/components/ken-favicon/assets": "assets/ken-favicon/assets" });

  // pass some assets right through
  config.addPassthroughCopy("./src/site/images");

  // Copy local font assets to build
  config.addPassthroughCopy({ "./src/components/kh-font": "assets/kh-font" });
  // mostly needed for redirecting from old drupal urls
  config.addPassthroughCopy("./src/site/**/*.html");
  // downloadable text resources (starter kits, templates)
  config.addPassthroughCopy("./src/site/**/*.txt");

  // Watch source images for changes
  config.addWatchTarget("./src/site/images");

  // The production build renders once to create embedding input, derives its
  // semantic data, then renders the final site. Pagefind is useful only after
  // that final pass; skipping it here avoids indexing disposable bootstrap
  // output.
  if (isBootstrap) return;

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
};
