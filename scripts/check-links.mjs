/**
 * Validate internal links in the built site.
 *
 * Walks build/**\/*.html, extracts every href/src, and for each internal
 * link checks that the target file exists in the build output. For internal
 * links that include a #fragment, it also checks that an element with a
 * matching id (or name) exists on the target page.
 *
 * External links (http/https/protocol-relative/mailto/tel/data) are skipped
 * deliberately: they are non-deterministic in CI (rate limits, transient
 * outages) and not something a build can guarantee. This check is about
 * catching broken internal links and anchors, which a build *can* guarantee.
 *
 * Exits non-zero if any broken internal link is found. Run after `yarn eleventy`.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, dirname, resolve, extname } from 'path';

const BUILD_DIR = 'build';

// Links we never resolve on disk.
const EXTERNAL = /^(https?:|\/\/|mailto:|tel:|data:|javascript:|#)/i;

// Path prefixes served by Vercel rewrites to external origins (hobby projects
// proxied to GitHub Pages). They are valid in production but absent from the
// local build, so resolving them on disk would be a false positive. Derived
// from vercel.json rewrites, e.g. "/PDF-A-go-go/:path*" -> "/PDF-A-go-go/".
function proxiedPrefixes() {
  try {
    const cfg = JSON.parse(readFileSync('vercel.json', 'utf-8'));
    return (cfg.rewrites || [])
      .map(r => (r.source || '').split(':')[0]) // strip ":path*"
      .filter(Boolean);
  } catch {
    return [];
  }
}
const PROXIED = proxiedPrefixes();

function findHtmlFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) findHtmlFiles(full, files);
    else if (entry.endsWith('.html')) files.push(full);
  }
  return files;
}

// Extract href="..." and src="..." values (single or double quoted).
// Strips <script>/<style> first so JS template strings (e.g. `${item.url}`)
// aren't mistaken for links.
function extractLinks(html) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const links = [];
  const re = /(?:href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    const val = (m[2] ?? m[3] ?? '').trim();
    // Skip empty and unresolved template artifacts (e.g. `${...}`).
    if (val && !val.includes('${')) links.push(val);
  }
  return links;
}

// Does the target HTML contain an element with id="frag" or name="frag"?
function hasAnchor(html, frag) {
  const f = frag.replace(/"/g, '');
  const idRe = new RegExp(`\\b(?:id|name)\\s*=\\s*["']${escapeRegex(f)}["']`, 'i');
  return idRe.test(html);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Resolve a link to a candidate file path inside the build dir.
// Returns the resolved absolute-ish path under BUILD_DIR, or null if it
// escapes the build root.
function resolveTarget(link, fromFile) {
  let pathPart = link.split('#')[0].split('?')[0];
  if (pathPart === '') return null; // pure fragment / query, handled by caller

  let abs;
  if (pathPart.startsWith('/')) {
    abs = join(BUILD_DIR, pathPart);
  } else {
    abs = join(dirname(fromFile), pathPart);
  }
  abs = resolve(abs);
  const root = resolve(BUILD_DIR);
  if (abs !== root && !abs.startsWith(root + '/')) return null; // escapes build/
  return abs;
}

// Given a resolved path, find the actual file on disk (handling pretty URLs).
function locateFile(abs) {
  if (existsSync(abs) && statSync(abs).isFile()) return abs;
  // Directory or pretty URL → index.html
  if (existsSync(abs) && statSync(abs).isDirectory()) {
    const idx = join(abs, 'index.html');
    if (existsSync(idx)) return idx;
  }
  // Extensionless pretty URL → try /index.html or .html
  if (!extname(abs)) {
    const idx = join(abs, 'index.html');
    if (existsSync(idx)) return idx;
    const html = abs + '.html';
    if (existsSync(html)) return html;
  }
  return null;
}

function main() {
  if (!existsSync(BUILD_DIR)) {
    console.error(`Build directory "${BUILD_DIR}/" not found. Run \`yarn eleventy\` first.`);
    process.exit(1);
  }

  const files = findHtmlFiles(BUILD_DIR);
  const broken = [];
  let checked = 0;

  for (const file of files) {
    const html = readFileSync(file, 'utf-8');
    for (const link of extractLinks(html)) {
      if (EXTERNAL.test(link)) continue;
      // Skip Vercel-proxied hobby-project paths (valid in prod, not in build).
      if (PROXIED.some(p => link === p || link.startsWith(p))) continue;
      checked++;

      const target = resolveTarget(link, file);
      if (target === null) {
        broken.push({ file, link, reason: 'escapes build root or unresolvable' });
        continue;
      }

      const located = locateFile(target);
      if (!located) {
        broken.push({ file, link, reason: 'target file not found' });
        continue;
      }

      // Anchor check
      const hash = link.includes('#') ? link.split('#')[1] : '';
      if (hash && located.endsWith('.html')) {
        const targetHtml = readFileSync(located, 'utf-8');
        if (!hasAnchor(targetHtml, hash)) {
          broken.push({ file, link, reason: `no element with id/name "${hash}"` });
        }
      }
    }
  }

  console.log(`Checked ${checked} internal links across ${files.length} pages.`);

  if (broken.length > 0) {
    console.error(`\n❌ ${broken.length} broken internal link(s):\n`);
    for (const b of broken) {
      console.error(`  ${relative(BUILD_DIR, b.file)}\n    → ${b.link}  (${b.reason})`);
    }
    process.exit(1);
  }

  console.log('✅ No broken internal links.');
}

main();
