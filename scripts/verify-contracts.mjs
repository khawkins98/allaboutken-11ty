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

function error(msg) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg) { console.warn(`  WARN:  ${msg}`); warnings++; }
function ok(msg) { console.log(`  OK:    ${msg}`); }

// Extract the raw YAML frontmatter string (between the --- delimiters).
function getFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

// Return values from a YAML block-style array, e.g. "tags:\n  - value".
function getBlockArray(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*\\n((?:[ \\t]+-[^\\n]*\\n?)*)`, 'm'));
  if (!match) return [];
  return match[1].split('\n').filter(l => /^\s+-/.test(l)).map(l => l.replace(/^\s+-\s*/, '').replace(/\s*#.*$/, '').trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Check 1: Embedding model name sync
// ---------------------------------------------------------------------------
function checkModelSync() {
  console.log('\n[1/5] Embedding model name sync');
  const producerMatch = readFileSync(EMBEDDINGS_SCRIPT, 'utf-8').match(/const MODEL_NAME\s*=\s*['"]([^'"]+)['"]/);
  const consumerMatch = readFileSync(SEMANTIC_SEARCH, 'utf-8').match(/const MODEL_ID\s*=\s*['"]([^'"]+)['"]/);
  if (!producerMatch) { error('Could not parse MODEL_NAME from scripts/generate-embeddings.mjs'); return; }
  if (!consumerMatch) { error('Could not parse MODEL_ID from src/site/semantic-search.js'); return; }
  if (producerMatch[1] !== consumerMatch[1]) {
    error(`Model mismatch: generate-embeddings.mjs MODEL_NAME="${producerMatch[1]}" vs semantic-search.js MODEL_ID="${consumerMatch[1]}"`);
  } else {
    ok(`Model names match: "${producerMatch[1]}"`);
  }
}

// ---------------------------------------------------------------------------
// Check 2: vectors.json schema (only when build artifact exists)
// ---------------------------------------------------------------------------
function checkVectorsSchema() {
  console.log('\n[2/5] vectors.json schema');
  if (!existsSync(VECTORS_FILE)) { ok('vectors.json not found (pre-build) -- skipping'); return; }
  let data;
  try { data = JSON.parse(readFileSync(VECTORS_FILE, 'utf-8')); } catch (e) { error(`vectors.json is not valid JSON: ${e.message}`); return; }
  if (typeof data.model !== 'string' || !data.model) error('vectors.json missing or empty "model" field');
  if (typeof data.dimension !== 'number' || data.dimension <= 0) error('vectors.json missing or invalid "dimension" field');
  if (data.version !== 2) error(`vectors.json "version" must be 2, got ${data.version}`);
  if (!Array.isArray(data.chunks)) { error('vectors.json missing "chunks" array'); return; }
  let chunkErrors = 0;
  for (const [i, chunk] of data.chunks.slice(0, 5).entries()) {
    const missing = ['url', 'title', 'snippet'].filter(f => typeof chunk[f] !== 'string');
    if (!Array.isArray(chunk.embedding) || chunk.embedding.length === 0) missing.push('embedding[]');
    if (missing.length > 0) { error(`vectors.json chunk[${i}] missing fields: ${missing.join(', ')}`); chunkErrors++; }
  }
  if (chunkErrors === 0) ok(`vectors.json valid (${data.chunks.length} chunks, dimension ${data.dimension}, version ${data.version})`);
}

// ---------------------------------------------------------------------------
// Check 3: siteConfig.json completeness
// ---------------------------------------------------------------------------
function checkSiteConfig() {
  console.log('\n[3/5] siteConfig.json completeness');
  let config;
  try { config = JSON.parse(readFileSync(SITE_CONFIG, 'utf-8')); } catch (e) { error(`Cannot read siteConfig.json: ${e.message}`); return; }
  const info = config.siteInformation;
  if (!info) { error('siteConfig.json missing "siteInformation" object'); return; }
  const missing = ['title', 'short_description', 'url', 'author', 'email'].filter(f => typeof info[f] !== 'string' || info[f].trim() === '');
  missing.length > 0 ? error(`siteConfig.json siteInformation missing or empty: ${missing.join(', ')}`) : ok('All required siteInformation fields present');
}

// ---------------------------------------------------------------------------
// Check 4: Post frontmatter required/recommended fields
// ---------------------------------------------------------------------------
function checkFrontmatter() {
  console.log('\n[4/5] Post frontmatter required fields');
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.njk') || f.endsWith('.md'));
  let checkedCount = 0;
  let requiredIssues = 0;
  for (const file of files) {
    const fm = getFrontmatter(readFileSync(join(POSTS_DIR, file), 'utf-8'));
    if (!fm) { warn(`${file}: could not parse frontmatter`); continue; }
    checkedCount++;
    const missing = ['title', 'date'].filter(k => !new RegExp(`^${k}\\s*:`, 'm').test(fm));
    if (missing.length > 0) { error(`${file}: missing required fields: ${missing.join(', ')}`); requiredIssues++; }
    if (!/^tags\s*:/m.test(fm)) warn(`${file}: missing recommended "tags" field`);
    if (!/^teaser\s*:/m.test(fm)) warn(`${file}: missing recommended "teaser" field`);
  }
  if (requiredIssues === 0) ok(`All ${checkedCount} posts have required fields (title, date)`);
}

// ---------------------------------------------------------------------------
// Check 5: Collection tag consistency
// ---------------------------------------------------------------------------
function checkCollectionConsistency() {
  console.log('\n[5/5] Collection tag consistency');
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.njk') || f.endsWith('.md'));
  let impactIssues = 0;
  let imageMetaIssues = 0;
  for (const file of files) {
    const fm = getFrontmatter(readFileSync(join(POSTS_DIR, file), 'utf-8'));
    if (!fm) continue;
    if (getBlockArray(fm, 'tags').includes('impact-stories') && !/^org\s*:/m.test(fm)) {
      error(`${file}: tagged "impact-stories" but missing "org" field (required by orgs.njk)`);
      impactIssues++;
    }
    const imageMetaBlock = fm.match(/^image_meta:\s*\n((?:[ \t]+\S[^\n]*\n?)*)/m);
    if (imageMetaBlock && imageMetaBlock[1].trim()) {
      if (!/^\s+text\s*:/m.test(imageMetaBlock[1])) { warn(`${file}: image_meta missing "text" subfield`); imageMetaIssues++; }
      if (!/^\s+credit\s*:/m.test(imageMetaBlock[1])) { warn(`${file}: image_meta missing "credit" subfield`); imageMetaIssues++; }
    }
  }
  if (impactIssues === 0) ok('All impact-stories posts have "org" field');
  if (imageMetaIssues === 0) ok('All image_meta blocks have text and credit');
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
if (errors > 0) process.exit(1);
