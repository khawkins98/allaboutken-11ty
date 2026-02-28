# Search Migration: Lunr.js to Pagefind

## Justification

The original search system was a two-part homegrown setup:
1. A Node.js post-build script (`scripts/build-search-index.js`) that crawled all HTML and dumped it into a single JSON file
2. Lunr.js v2.3.9 which built an inverted index client-side

Problems:
- Three unmaintained dependencies: Lunr.js (last release 2020), strip-js (2018), striptags (2020)
- Large upfront download: 627 KB raw search index + 34 KB of JS (Lunr + client script)
- Indexed all 194 HTML pages including 93+ social card pages as junk entries
- No highlighted excerpts in results
- 600ms debounce on input

## Before/After Measurements

| Metric | Before (Lunr.js) | After (Pagefind) |
|---|---|---|
| Dependencies removed | 3 (node-html-parser, strip-js, striptags) | 0 runtime deps |
| Dependencies added | 0 | 1 devDep (pagefind) |
| Search index size (raw) | 627 KB (search_index.js) | ~1 MB total (chunked, only ~10 KB loaded initially) |
| Initial JS download (gzip) | ~204 KB (193 KB index + 8.4 KB Lunr + 1.9 KB client) | ~10 KB (pagefind.js) |
| Per-query download | 0 (all pre-loaded) | ~10-30 KB (fragment on demand) |
| Pages indexed | 194 (including social cards) | 90 (content pages only) |
| Build time | ~50s | ~50s (Pagefind adds ~0.2s) |
| Highlighted excerpts | No | Yes |
| Input debounce | 600ms | 300ms |

## What Changed

### Files Modified
- `package.json` — Added `pagefind` devDep, removed `node-html-parser`/`strip-js`/`striptags`, removed `search:index` script
- `eleventy.js` — Replaced `eleventy.after` hook to run `npx pagefind --site build`
- `src/site/_includes/layouts/base.njk` — Added `data-pagefind-body` to `<main>`, removed `kh-search-client-side--no-index` from header
- `src/site/_includes/footer.njk` — Removed `kh-search-client-side--no-index` class
- `src/site/_includes/layouts/post.njk` — Added `data-pagefind-ignore` to boilerplate section
- `src/site/search.njk` — Rewritten to use Pagefind JS API
- `src/site/404.njk` — Cleaned up legacy `data-kh-search-client-side-*` attributes
- `src/site/colophon.njk` — Updated search technology description
- `CLAUDE.md` — Updated search-related documentation

### Files Deleted
- `scripts/build-search-index.js`
- `src/site/js-search-lunr.js`
- `src/site/js-search-client-side.js`

## How It Works

1. `<main>` in `base.njk` has `data-pagefind-body` — only content inside `<main>` is indexed
2. Pages without `base.njk` layout (social cards, `/node/` redirects) are automatically excluded
3. Post boilerplate (comments, prev/next) has `data-pagefind-ignore` — excluded from index
4. After Eleventy builds all HTML, the `eleventy.after` hook runs `npx pagefind --site build`
5. Pagefind generates a chunked index in `build/pagefind/`
6. The search page imports `/pagefind/pagefind.js` as an ES module
7. On search, Pagefind loads only the relevant index chunks and returns highlighted excerpts

## Testing Checklist

- [x] `yarn build` completes without errors
- [x] `build/pagefind/` directory exists with index files
- [x] Old files removed: no `search_index.js`, `js-search-lunr.js`, `js-search-client-side.js` in build
- [x] 90 pages indexed (social cards excluded)
- [ ] Search page shows results with highlighted excerpts
- [ ] `?search_query=eleventy` pre-populates and auto-searches
- [ ] 404 "Try a search for it" redirects to search page with query
- [ ] No `/social/` URLs in results
- [ ] `<noscript>` fallback visible with JS disabled
