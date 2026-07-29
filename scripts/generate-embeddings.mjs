/**
 * Generate vector embeddings for all site content at build time.
 *
 * Reads the Eleventy build output, extracts text from pages with
 * `data-pagefind-body`, generates embeddings with MiniLM-L6-v2
 * via Transformers.js, and writes build/semantic-search/vectors.json.
 *
 * Run after `yarn eleventy` (which also runs Pagefind).
 *
 * The browser fetches the model directly from HuggingFace at query time;
 * Transformers.js handles caching via the Cache API.
 *
 * To update the model:
 *   1. Change MODEL_NAME below AND MODEL_ID in src/site/semantic-search.js
 *   2. Run `yarn build` to regenerate embeddings
 *   3. Both build-time and browser-side must use the same model
 *   4. Browse https://huggingface.co/models?library=transformers.js&sort=trending
 *      for compatible models (look for ONNX exports with sentence-transformers)
 */

import { pipeline, env } from '@huggingface/transformers';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// Cache downloaded model files in a stable, repo-local directory so CI can
// restore them between builds (see actions/cache in build-and-deploy.yml).
// Without this, the model re-downloads from HuggingFace on every build.
env.cacheDir = '.cache/transformers';

const BUILD_DIR = 'build';
const OUTPUT_DIR = join(BUILD_DIR, 'semantic-search');
const OUTPUT_FILE = join(OUTPUT_DIR, 'vectors.json');
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

// Paths to skip (not real content pages)
const SKIP_PATTERNS = [
  /\/social\//,
  /\/node\//,
  /\/404\//,
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
  // Remove regions marked as not-content before anything else. Navigational
  // chrome must never reach the embeddings: the "closest in meaning" list
  // prints the titles of related entries, so embedding it feeds the model's
  // own output back in and those entries drift closer together on every
  // build. The register timeline prints an identical sentence on every page,
  // which lifts baseline similarity across the whole corpus. Both inflate the
  // similarity graph without any writing having changed.
  html = String(html).replace(/<!--embed:skip-->[\s\S]*?<!--\/embed:skip-->/gi, ' ');
  return stripTagsInner(html);
}

function stripTagsInner(html) {
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
 * Extract a clean snippet from chunk text.
 * Trims a leading partial sentence (for overlap chunks that start mid-sentence),
 * then takes up to 200 chars and snaps to the last sentence end or space.
 */
function makeSnippet(text, isFirstChunk) {
  let s = text;
  // Non-first chunks start in the overlap zone — skip the leading partial sentence
  if (!isFirstChunk) {
    const firstSentenceEnd = s.search(/[.?!]\s/);
    if (firstSentenceEnd !== -1 && firstSentenceEnd < 100) {
      s = s.slice(firstSentenceEnd + 2);
    }
  }
  if (s.length <= 200) return s;
  // Snap to last sentence end within the 200-char window
  const window = s.slice(0, 200);
  const sentEnd = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('? '),
    window.lastIndexOf('! ')
  );
  if (sentEnd > 80) return s.slice(0, sentEnd + 1);
  // Fall back to last space
  const spaceIdx = window.lastIndexOf(' ');
  if (spaceIdx > 80) return s.slice(0, spaceIdx);
  return window;
}

/**
 * Split body text into overlapping chunks for embedding.
 * Each chunk is ~1000 chars with ~200-char overlap (stride 800).
 * Boundaries snap to sentence-ending punctuation when possible.
 */
function chunkText(bodyText) {
  if (bodyText.length < 1000) {
    return [{ text: bodyText, snippet: makeSnippet(bodyText, true) }];
  }

  const chunks = [];
  let start = 0;
  while (start < bodyText.length) {
    let end = start + 1000;

    if (end < bodyText.length) {
      // Try to snap to sentence boundary within a 100-char window before the target end
      const window = bodyText.slice(end - 100, end);
      const sentenceEnd = Math.max(
        window.lastIndexOf('. '),
        window.lastIndexOf('? '),
        window.lastIndexOf('! ')
      );
      if (sentenceEnd !== -1) {
        // +2 to include the punctuation and space
        end = end - 100 + sentenceEnd + 2;
      } else {
        // Fall back to nearest space
        const spaceIdx = window.lastIndexOf(' ');
        if (spaceIdx !== -1) {
          end = end - 100 + spaceIdx + 1;
        }
      }
    } else {
      end = bodyText.length;
    }

    const isFirst = start === 0;
    const text = bodyText.slice(start, end).trim();
    if (text.length > 0) {
      chunks.push({ text, snippet: makeSnippet(text, isFirst) });
    }

    start = start + 800;
    // Stop if we've captured the end
    if (end >= bodyText.length) break;
  }

  return chunks;
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

  // Filter, extract content, and split into chunks
  const entries = [];
  let pageCount = 0;
  for (const file of allFiles) {
    const urlPath = '/' + relative(BUILD_DIR, file).replace(/index\.html$/, '').replace(/\.html$/, '/');

    // Skip non-content paths
    if (SKIP_PATTERNS.some(p => p.test(urlPath))) continue;

    const html = readFileSync(file, 'utf-8');
    const content = extractContent(html);
    if (!content) continue;

    pageCount++;
    const chunks = chunkText(content.bodyText);
    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci];
      // Chunk 0 gets title + description + body for maximum signal;
      // later chunks get title + body only (description would dilute).
      const embeddingInput = ci === 0
        ? content.title + ' ' + content.description + ' ' + chunk.text
        : content.title + ' ' + chunk.text;

      const entry = {
        url: urlPath,
        title: content.title,
        snippet: chunk.snippet,
        embeddingInput,
      };
      // Only chunk 0 carries teaser and date (used for display)
      if (ci === 0) {
        entry.teaser = content.description;
        entry.date = content.date;
      }
      entries.push(entry);
    }
  }

  console.log(`Extracted content from ${pageCount} pages (${entries.length} chunks)`);

  if (entries.length === 0) {
    console.warn('No content found to embed. Skipping.');
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
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const output = await extractor(entry.embeddingInput, { pooling: 'mean', normalize: true });
    // Round to 4 decimal places — well within MiniLM's noise floor, reduces JSON size
    const embedding = Array.from(output.data).map(v => Math.round(v * 10000) / 10000);

    const chunk = {
      url: entry.url,
      title: entry.title,
      snippet: entry.snippet,
      embedding,
    };
    if (entry.teaser) chunk.teaser = entry.teaser;
    if (entry.date) chunk.date = entry.date;
    results.push(chunk);

    if ((i + 1) % 10 === 0 || i === entries.length - 1) {
      console.log(`  ${i + 1}/${entries.length} chunks embedded`);
    }
  }

  // Write output
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const output = {
    model: MODEL_NAME,
    dimension: results[0].embedding.length,
    version: 2,
    chunks: results,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output));
  const fileSizeKB = Math.round(statSync(OUTPUT_FILE).size / 1024);
  console.log(`Wrote ${OUTPUT_FILE} (${fileSizeKB} KB, ${pageCount} pages, ${results.length} chunks, ${output.dimension} dimensions)`);
  // Model files for browser self-hosting are downloaded separately
  // via eleventy.after hook in eleventy.js (runs in both dev and production).
}

main().catch(err => {
  console.error('Embedding generation failed:', err);
  process.exit(1);
});
