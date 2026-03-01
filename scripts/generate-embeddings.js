/**
 * Generate vector embeddings for all site content at build time.
 *
 * Reads the Eleventy build output, extracts text from pages with
 * `data-pagefind-body`, generates embeddings with MiniLM-L6-v2
 * via Transformers.js, and writes build/semantic-search/vectors.json.
 *
 * Run after `yarn eleventy` (which also runs Pagefind).
 *
 * Model files for browser self-hosting are handled separately by the
 * eleventy.after hook in eleventy.js (runs in both dev and production).
 *
 * To update the model:
 *   1. Change MODEL_NAME below AND modelName in eleventy.js
 *   2. Run `yarn build` to regenerate embeddings and download new model files
 *   3. Both build-time and browser-side must use the same model
 *   4. Browse https://huggingface.co/models?library=transformers.js&sort=trending
 *      for compatible models (look for ONNX exports with sentence-transformers)
 */

import { pipeline } from '@huggingface/transformers';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const BUILD_DIR = 'build';
const OUTPUT_DIR = join(BUILD_DIR, 'semantic-search');
const OUTPUT_FILE = join(OUTPUT_DIR, 'vectors.json');
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

// Paths to skip (not real content pages)
const SKIP_PATTERNS = [
  /\/social\//,
  /\/node\//,
  /\/404\.html$/,
  /\/search\//,
  /\/sitemap/,
  /\/robots/,
  /\/feed/,
  /\/style-guide\//,
  /\/pagefind\//,
  /\/semantic-search\//,
  /\/css\//,
  /\/img\//,
  /\/assets\//,
];

/**
 * Recursively find all HTML files in a directory.
 */
function findHtmlFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      findHtmlFiles(full, files);
    } else if (entry.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Extract text content from HTML, stripping tags.
 */
function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract content from an HTML file.
 * Returns null if the page should be skipped.
 */
function extractContent(html) {
  // Must have data-pagefind-body to be indexable
  if (!html.includes('data-pagefind-body')) return null;

  // Extract title
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  let title = titleMatch ? titleMatch[1] : '';
  // Remove " | All about Ken Hawkins" suffix
  title = title.replace(/\s*\|\s*All about Ken Hawkins$/i, '').trim();

  // Extract description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const description = descMatch ? descMatch[1] : '';

  // Extract published date
  const dateMatch = html.match(/<meta\s+property="article:published_time"\s+content="([^"]*)"/i);
  const date = dateMatch ? dateMatch[1] : '';

  // Extract main content (data-pagefind-body)
  const mainMatch = html.match(/<main[^>]*data-pagefind-body[^>]*>([\s\S]*?)<\/main>/i);
  if (!mainMatch) return null;

  let mainHtml = mainMatch[1];

  // Remove data-pagefind-ignore sections
  mainHtml = mainHtml.replace(/<[^>]+data-pagefind-ignore[^>]*>[\s\S]*?<\/[^>]+>/gi, '');

  const bodyText = stripTags(mainHtml);

  // Skip pages with very little content
  if (bodyText.length < 50) return null;

  return { title, description, date, bodyText };
}

async function main() {
  console.log('Generating semantic search embeddings...');
  console.log(`Model: ${MODEL_NAME}`);

  // Find all HTML files
  const allFiles = findHtmlFiles(BUILD_DIR);
  console.log(`Found ${allFiles.length} HTML files in ${BUILD_DIR}/`);

  // Filter and extract content
  const documents = [];
  for (const file of allFiles) {
    const urlPath = '/' + relative(BUILD_DIR, file).replace(/index\.html$/, '').replace(/\.html$/, '/');

    // Skip non-content paths
    if (SKIP_PATTERNS.some(p => p.test(urlPath))) continue;

    const html = readFileSync(file, 'utf-8');
    const content = extractContent(html);
    if (!content) continue;

    documents.push({
      url: urlPath,
      title: content.title,
      teaser: content.description,
      date: content.date,
      text: content.title + ' ' + content.description + ' ' + content.bodyText.slice(0, 500),
    });
  }

  console.log(`Extracted content from ${documents.length} pages`);

  if (documents.length === 0) {
    console.warn('No documents found to embed. Skipping.');
    return;
  }

  // Load model
  console.log('Loading embedding model (this may download on first run)...');
  const extractor = await pipeline('feature-extraction', MODEL_NAME, {
    dtype: 'q8',
  });

  // Generate embeddings
  console.log('Generating embeddings...');
  const results = [];
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const output = await extractor(doc.text, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);

    results.push({
      url: doc.url,
      title: doc.title,
      teaser: doc.teaser,
      date: doc.date,
      embedding,
    });

    if ((i + 1) % 10 === 0 || i === documents.length - 1) {
      console.log(`  ${i + 1}/${documents.length} pages embedded`);
    }
  }

  // Write output
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const output = {
    model: MODEL_NAME,
    dimension: results[0].embedding.length,
    documents: results,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output));
  const fileSizeKB = Math.round(statSync(OUTPUT_FILE).size / 1024);
  console.log(`Wrote ${OUTPUT_FILE} (${fileSizeKB} KB, ${results.length} documents, ${output.dimension} dimensions)`);
  // Model files for browser self-hosting are downloaded separately
  // via eleventy.after hook in eleventy.js (runs in both dev and production).
}

main().catch(err => {
  console.error('Embedding generation failed:', err);
  process.exit(1);
});
