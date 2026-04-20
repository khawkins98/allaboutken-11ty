/**
 * Verify internal API contracts between build scripts, templates, and client-side JS.
 *
 * Checks:
 *   1. Embedding model name sync between producer and consumer
 *   2. vectors.json schema (post-build only, when artifact exists)
 *   3. siteConfig.json required fields
 *   4. Post frontmatter required/recommended fields
 *   5. Collection tag consistency (impact-stories need org, image_meta needs text+credit)
 *
 * No external dependencies -- uses only Node.js built-ins.
 * Run: node scripts/verify-contracts.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const POSTS_DIR = join(ROOT, 'src/site/posts');
const SITE_CONFIG = join(ROOT, 'src/site/_data/siteConfig.json');
const EMBEDDINGS_SCRIPT = join(ROOT, 'scripts/generate-embeddings.mjs');
const SEMANTIC_SEARCH = join(ROOT, 'src/site/semantic-search.js');
const VECTORS_FILE = join(ROOT, 'build/semantic-search/vectors.json');

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  ERROR: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  WARN:  ${msg}`);
  warnings++;
}

function ok(msg) {
  console.log(`  OK:    ${msg}`);
}

// ---------------------------------------------------------------------------
// Check 1: Embedding model name sync
// ---------------------------------------------------------------------------
function checkModelSync() {
  console.log('\n[1/5] Embedding model name sync');

  const embeddingsSrc = readFileSync(EMBEDDINGS_SCRIPT, 'utf-8');
  const searchSrc = readFileSync(SEMANTIC_SEARCH, 'utf-8');

  const producerMatch = embeddingsSrc.match(/const MODEL_NAME\s*=\s*['"]([^'"]+)['"]/);
  const consumerMatch = searchSrc.match(/const MODEL_ID\s*=\s*['"]([^'"]+)['"]/);

  if (!producerMatch) {
    error('Could not parse MODEL_NAME from scripts/generate-embeddings.mjs');
    return;
  }
  if (!consumerMatch) {
    error('Could not parse MODEL_ID from src/site/semantic-search.js');
    return;
  }

  const producer = producerMatch[1];
  const consumer = consumerMatch[1];

  if (producer !== consumer) {
    error(`Model mismatch: generate-embeddings.mjs MODEL_NAME="${producer}" vs semantic-search.js MODEL_ID="${consumer}"`);
  } else {
    ok(`Model names match: "${producer}"`);
  }
}

// ---------------------------------------------------------------------------
// Check 2: vectors.json schema (only when build artifact exists)
// ---------------------------------------------------------------------------
function checkVectorsSchema() {
  console.log('\n[2/5] vectors.json schema');

  if (!existsSync(VECTORS_FILE)) {
    ok('vectors.json not found (pre-build) -- skipping');
    return;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(VECTORS_FILE, 'utf-8'));
  } catch (e) {
    error(`vectors.json is not valid JSON: ${e.message}`);
    return;
  }

  if (typeof data.model !== 'string' || !data.model) {
    error('vectors.json missing or empty "model" field');
  }
  if (typeof data.dimension !== 'number' || data.dimension <= 0) {
    error('vectors.json missing or invalid "dimension" field');
  }
  if (data.version !== 2) {
    error(`vectors.json "version" must be 2, got ${data.version}`);
  }
  if (!Array.isArray(data.chunks)) {
    error('vectors.json missing "chunks" array');
    return;
  }

  const sample = data.chunks.slice(0, 5);
  let chunkErrors = 0;
  for (const [i, chunk] of sample.entries()) {
    const missing = [];
    if (typeof chunk.url !== 'string') missing.push('url');
    if (typeof chunk.title !== 'string') missing.push('title');
    if (typeof chunk.snippet !== 'string') missing.push('snippet');
    if (!Array.isArray(chunk.embedding) || chunk.embedding.length === 0) missing.push('embedding[]');
    if (missing.length > 0) {
      error(`vectors.json chunk[${i}] missing fields: ${missing.join(', ')}`);
      chunkErrors++;
    }
  }

  if (chunkErrors === 0) {
    ok(`vectors.json valid (${data.chunks.length} chunks, dimension ${data.dimension}, version ${data.version})`);
  }
}

// ---------------------------------------------------------------------------
// Check 3: siteConfig.json completeness
// ---------------------------------------------------------------------------
function checkSiteConfig() {
  console.log('\n[3/5] siteConfig.json completeness');

  let config;
  try {
    config = JSON.parse(readFileSync(SITE_CONFIG, 'utf-8'));
  } catch (e) {
    error(`Cannot read siteConfig.json: ${e.message}`);
    return;
  }

  const required = ['title', 'short_description', 'url', 'author', 'email'];
  const info = config.siteInformation;

  if (!info) {
    error('siteConfig.json missing "siteInformation" object');
    return;
  }

  const missing = required.filter(f => typeof info[f] !== 'string' || info[f].trim() === '');
  if (missing.length > 0) {
    error(`siteConfig.json siteInformation missing or empty: ${missing.join(', ')}`);
  } else {
    ok('All required siteInformation fields present');
  }
}

// ---------------------------------------------------------------------------
// Check 4 & 5: Frontmatter validation and collection tag consistency
// ---------------------------------------------------------------------------
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let inArray = false;

  for (const line of lines) {
    if (inArray && /^\s+-\s+/.test(line)) {
      const val = line.replace(/^\s+-\s+/, '').trim();
      if (currentKey) fm[currentKey].push(val);
      continue;
    }

    if (currentKey && /^\s+\w+:/.test(line) && fm[currentKey] && typeof fm[currentKey] === 'object' && !Array.isArray(fm[currentKey])) {
      const nestedMatch = line.match(/^\s+(\w+):\s*(.*)$/);
      if (nestedMatch) {
        fm[currentKey][nestedMatch[1]] = nestedMatch[2].replace(/^["']|["']$/g, '').trim();
      }
      continue;
    }

    const keyMatch = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (keyMatch) {
      const key = keyMatch[1];
      let val = keyMatch[2].trim();

      if (val === '') {
        fm[key] = [];
        currentKey = key;
        inArray = true;
        continue;
      }

      inArray = false;
      val = val.replace(/^["']|["']$/g, '');
      fm[key] = val;
      currentKey = key;
    } else if (currentKey && Array.isArray(fm[currentKey]) && line.trim() === '') {
      inArray = false;
    } else if (!inArray) {
      if (currentKey && typeof fm[currentKey] === 'string' && fm[currentKey] === '' && line.trim() !== '') {
        fm[currentKey] = {};
        const nestedMatch = line.match(/^\s+(\w+):\s*(.*)$/);
        if (nestedMatch) {
          fm[currentKey][nestedMatch[1]] = nestedMatch[2].replace(/^["']|["']$/g, '').trim();
        }
      }
    }
  }

  return fm;
}

function checkFrontmatter() {
  console.log('\n[4/5] Post frontmatter required fields');

  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.njk') || f.endsWith('.md'));
  let checkedCount = 0;
  let requiredIssues = 0;

  for (const file of files) {
    const content = readFileSync(join(POSTS_DIR, file), 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm) {
      warn(`${file}: could not parse frontmatter`);
      continue;
    }

    checkedCount++;
    const missing = [];
    if (!fm.title) missing.push('title');
    if (!fm.date) missing.push('date');

    if (missing.length > 0) {
      error(`${file}: missing required fields: ${missing.join(', ')}`);
      requiredIssues++;
    }

    // Recommended fields (warn only)
    const tags = fm.tags;
    if (!tags || (Array.isArray(tags) && tags.length === 0)) {
      warn(`${file}: missing recommended "tags" field`);
    }
    if (!fm.teaser) {
      warn(`${file}: missing recommended "teaser" field`);
    }
  }

  if (requiredIssues === 0) {
    ok(`All ${checkedCount} posts have required fields (title, date, tags)`);
  }
}

function checkCollectionConsistency() {
  console.log('\n[5/5] Collection tag consistency');

  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.njk') || f.endsWith('.md'));
  let impactIssues = 0;
  let imageMetaIssues = 0;

  for (const file of files) {
    const content = readFileSync(join(POSTS_DIR, file), 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm) continue;

    const tags = Array.isArray(fm.tags) ? fm.tags : [];

    if (tags.includes('impact-stories') && !fm.org) {
      error(`${file}: tagged "impact-stories" but missing "org" field (required by orgs.njk)`);
      impactIssues++;
    }

    if (fm.image_meta && typeof fm.image_meta === 'object' && !Array.isArray(fm.image_meta)) {
      const hasSomeField = Object.keys(fm.image_meta).length > 0;
      if (hasSomeField) {
        if (!fm.image_meta.text) {
          warn(`${file}: image_meta present but missing "text" subfield`);
          imageMetaIssues++;
        }
        if (!fm.image_meta.credit) {
          warn(`${file}: image_meta present but missing "credit" subfield`);
          imageMetaIssues++;
        }
      }
    }
  }

  if (impactIssues === 0) {
    ok('All impact-stories posts have "org" field');
  }
  if (imageMetaIssues === 0) {
    ok('All image_meta blocks have text and credit');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log('Verifying internal API contracts...');

checkModelSync();
checkVectorsSchema();
checkSiteConfig();
checkFrontmatter();
checkCollectionConsistency();

console.log('\nDone: ' + errors + ' error(s), ' + warnings + ' warning(s)');

if (errors > 0) {
  process.exit(1);
}
