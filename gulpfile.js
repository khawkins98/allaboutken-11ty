const path = require('path');
const gulp = require('gulp');
const resizer = require('gulp-images-resizer');

// Pull in optional configuration from the package.json file, a la:
const {componentPath, componentDirectories, buildDestionation} = require('@visual-framework/vf-config');

// Tasks to build/run vf-core component system
require('./node_modules/\@visual-framework/vf-core/tools/gulp-tasks/_gulp_rollup.js')(gulp, path, componentPath, componentDirectories, buildDestionation);
require('./node_modules/\@visual-framework/vf-extensions/gulp-tasks/_gulp_rollup.js')(gulp, path, componentPath, componentDirectories, buildDestionation);

// Watch folders for changess
gulp.task('watch', function() {
  // left for convience for local watch additions
  gulp.watch(['./build/css/styles.css'], gulp.series('eleventy:reload'));
});

// Process images
gulp.task('images', function(done) {
  // Copy  the original
  gulp.src('src/site/images/**/*.*')
    .pipe(gulp.dest('build/images/original/'));

  // Square crop
  gulp.src('src/site/images/**/*{.jpg,.png,.gif}')
    .pipe(resizer({
      // format: "png",
      width: 400,
      height: 400
    }))
    .pipe(gulp.dest('build/images/crop-square/'));

  // Cinematic crop
  gulp.src('src/site/images/**/*{.jpg,.png,.gif}')
    .pipe(resizer({
      verbose: true,
      // format: "png",
      width: 900,
      height: 600
    }))
    .pipe(gulp.dest('build/images/crop-cinema/'))
    .on('end', done);

});

// Let's build this sucker.
gulp.task('build', gulp.series(
  'vf-clean',
  gulp.parallel('vf-css','vf-scripts','vf-component-assets'),
  'vf-css:production', //optimise, prefix css
  'fractal:build',
  'fractal',
  'eleventy:init',
  'eleventy:build',
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
  'images',
  gulp.parallel('watch','vf-watch')
));
