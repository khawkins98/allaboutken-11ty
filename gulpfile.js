const path = require('path');
const gulp = require('gulp');

// Pull in optional configuration from the package.json file, a la:
const {componentPath, componentDirectories, buildDestionation} = require('@visual-framework/vf-config');


// search index
require('./node_modules/\@visual-framework/vf-extensions/gulp-tasks/gulp-build-search-index.js')(gulp, path, buildDestionation);

// Let's build this sucker.
gulp.task('build', gulp.series(
  'vf-clean',
  gulp.parallel('vf-css','vf-scripts','vf-component-assets'),
  'vf-css:production', //optimise, prefix css
  'fractal:build',
  'fractal',
  'eleventy:init',
  'eleventy:build',
  'vf-build-search-index',
  'images'
));

// Build and watch things during dev
gulp.task('dev', gulp.series(
  'vf-clean',
  gulp.parallel('vf-css','vf-scripts','vf-component-assets'),
  'fractal:development',
  'fractal',
  'eleventy:init',
  'eleventy:develop',
  'vf-build-search-index',
  'images',
  gulp.parallel('watch','vf-watch')
));
