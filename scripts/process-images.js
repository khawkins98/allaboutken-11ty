/**
 * process-images.js — batch image pre-processing helper (not yet implemented)
 *
 * Intended as a CLI script to be run locally before committing new images.
 * Future responsibilities:
 *   - Accept a source image path (or glob) as a CLI argument
 *   - Strip EXIF metadata (privacy)
 *   - Resize / optimise to a sensible maximum dimension before committing
 *   - Output to src/site/images/blog/ ready for Eleventy's image transform
 *
 * The Eleventy build already generates responsive AVIF/WebP/JPEG variants at
 * build time via eleventyImageTransformPlugin; this script handles the
 * upstream source images before they enter version control.
 *
 * Usage (planned):
 *   node scripts/process-images.js <source-image> [<source-image> ...]
 */
