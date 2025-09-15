#!/usr/bin/env node
/*
  Hydrate local Webmention cache for development.

  - Discovers target URLs from CLI args or from the built site under build/posts/
  - For each target, fetches Webmention.io JF2 for both current and legacy hosts
  - Writes cache files in .cache/ matching the eleventy.js filter naming scheme

  Usage:
    node scripts/hydrate-webmentions.js                    # hydrate for all built posts
    node scripts/hydrate-webmentions.js https://.../post/  # hydrate for specific URLs

  Credits / references:
  - Max Böck’s Eleventy webmentions starter (MIT): https://github.com/maxboeck/eleventy-webmentions
  - Sia K.’s “Webmentions & Eleventy in depth”: https://sia.codes/posts/webmentions-eleventy-in-depth/
  - equk’s write-up: https://equk.co.uk/2023/07/18/adding-webmentions-in-eleventy/
  - Webmention.io JF2 API: https://webmention.io/
  Note: This script is bespoke for this site (legacy-host merge + cache format matching our runtime filter).
*/

const Fs = require('fs');
const Path = require('path');

function slugifyForCache(value) {
  return String(value || '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

function ensureTrailingSlash(u) {
  return u.endsWith('/') ? u : u + '/';
}

function readSiteBaseUrl() {
  try {
    const cfgPath = Path.join(process.cwd(), 'src/site/_data/siteConfig.json');
    const raw = JSON.parse(Fs.readFileSync(cfgPath, 'utf-8'));
    const url = raw && raw.siteInformation && raw.siteInformation.url;
    if (typeof url === 'string' && url.startsWith('http')) return url.replace(/\/$/, '');
  } catch (e) {}
  return 'https://www.allaboutken.com';
}

function discoverTargetsFromBuild(siteBaseUrl) {
  const results = new Set();
  const root = Path.join(process.cwd(), 'build/posts');
  if (!Fs.existsSync(root)) return Array.from(results);
  const walk = (dir, rel) => {
    const entries = Fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = Path.join(dir, e.name);
      const r = Path.join(rel, e.name);
      if (e.isDirectory()) {
        // If it has index.html, treat directory URL
        const indexHtml = Path.join(abs, 'index.html');
        if (Fs.existsSync(indexHtml)) {
          const urlPath = `/posts/${r}/`.replace(/\\/g, '/');
          results.add(ensureTrailingSlash(siteBaseUrl + urlPath));
        }
        walk(abs, r);
      } else if (e.isFile() && e.name.endsWith('.html')) {
        // A standalone html file
        const urlPath = `/posts/${r}`.replace(/\\/g, '/');
        const final = urlPath.endsWith('/index.html')
          ? ensureTrailingSlash(siteBaseUrl + urlPath.replace(/\/index\.html$/, '/'))
          : siteBaseUrl + urlPath;
        results.add(final);
      }
    }
  };
  try { walk(root, ''); } catch (e) {}
  return Array.from(results);
}

async function fetchMentionsForTarget(target) {
  const params = new URLSearchParams({ target, 'per-page': '100' });
  const url = `https://webmention.io/api/mentions.jf2?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return { children: [] };
  return await res.json();
}

async function main() {
  const siteBase = readSiteBaseUrl();
  const args = process.argv.slice(2).filter(Boolean);
  const inputTargets = args.length ? args : discoverTargetsFromBuild(siteBase);
  if (!inputTargets.length) {
    console.log('No targets discovered. Build the site first or pass URLs as arguments.');
    process.exit(0);
  }

  if (!global.fetch) {
    try { global.fetch = (await import('node-fetch')).default; } catch (e) {}
  }

  const cacheDir = Path.join(process.cwd(), '.cache');
  try { if (!Fs.existsSync(cacheDir)) Fs.mkdirSync(cacheDir, { recursive: true }); } catch (e) {}

  const legacyBase = 'https://work.allaboutken.com';
  let totalRequests = 0;
  for (const t of inputTargets) {
    try {
      const u = new URL(t);
      const pathname = u.pathname || '/';
      const currentTarget = ensureTrailingSlash(`${siteBase}${pathname}`);
      const legacyTarget = ensureTrailingSlash(`${legacyBase}${pathname}`);
      for (const tgt of [currentTarget, legacyTarget]) {
        const cacheKey = slugifyForCache(tgt);
        const cacheFile = Path.join(cacheDir, `webmentions-${cacheKey}.json`);
        const jf2 = await fetchMentionsForTarget(tgt);
        Fs.writeFileSync(cacheFile, JSON.stringify(jf2), 'utf-8');
        totalRequests += 1;
        console.log(`Cached ${Array.isArray(jf2.children) ? jf2.children.length : 0} mentions for ${tgt}`);
      }
    } catch (e) {
      console.warn(`Skip invalid URL: ${t}`);
    }
  }
  console.log(`Done. Performed ${totalRequests} API requests.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


