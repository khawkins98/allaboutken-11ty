/**
 * Fail the build if a raster image reached build/ untransformed.
 *
 * The image transform rewrites every processed <img> to point at /img/…, so a
 * JPEG, PNG or WebP still pointing at its source path under /images/ was never
 * optimised. `failOnError: false` makes that silent: the plugin swallows the
 * error and leaves the tag exactly as written. Unlike the `/.11ty/image/`
 * failure, nothing broken is left behind, so `lint:links` cannot see it.
 *
 * That is how every post hero and garage card shipped as full-size originals
 * from Sept 2025 to Sept 2026: the plugin's default attributes were set under
 * a key it never reads, so each tag failed on "Missing sizes".
 *
 * SVG and GIF are left out on purpose. An SVG gains nothing from rasterising,
 * and a large animated GIF can exceed sharp's pixel limit, so both are
 * legitimately passed through with `eleventy:ignore` (which the transform
 * strips from the output, so it cannot be checked for here). HTML comments are
 * stripped first; commented-out markup is never rendered.
 *
 * Run after `yarn eleventy`.
 */

import { readFileSync } from 'fs';
import { relative } from 'path';
import { findHtmlFiles } from './lib/find-html-files.mjs';

const BUILD_DIR = 'build';
const UNTRANSFORMED = /<img\b[^>]*\bsrc="(\/images\/[^"]+\.(?:jpe?g|png|webp))"/gi;

const failures = [];
for (const file of findHtmlFiles(BUILD_DIR)) {
  const html = readFileSync(file, 'utf-8').replace(/<!--[\s\S]*?-->/g, '');
  for (const match of html.matchAll(UNTRANSFORMED)) {
    failures.push(`${relative(BUILD_DIR, file)}: ${match[1]}`);
  }
}

if (failures.length) {
  console.error(`❌ ${failures.length} untransformed image(s) in build/:`);
  for (const f of failures) console.error(`  ${f}`);
  console.error('\nThe image transform skipped these. Rebuild with failOnError: true in config/eleventy/images.js to see why.');
  process.exit(1);
}
console.log('✅ Every raster image under /images/ was transformed.');
