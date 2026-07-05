![allaboutken.com — Hello. I am Ken Hawkins.](.github/site-hero.jpg)

# allaboutken.com

[My personal site](https://www.allaboutken.com/) and digital playground, with writing about digital transformation, web platform engineering, and practical AI. Built on Eleventy v3, hosted on Vercel.

Most posts are practitioner-level takes and technical tutorials. The [Work section](https://www.allaboutken.com/work/) collects impact stories from real projects: design systems, platform migrations, editorial tooling, with actual metrics where I have them.

## What's interesting

- **Semantic search without a backend.** Build-time vector embeddings (MiniLM-L6-v2 via Transformers.js) + in-browser cosine similarity. Same model runs both sides. No API keys, no server. [Read the post](https://www.allaboutken.com/posts/20260302-semantic-search-browser-embeddings/)
- **Keyword search via Pagefind.** Rust-based static indexer, ~10 KB JS on the client. Runs as an Eleventy after-hook. [Read the post](https://www.allaboutken.com/posts/20260228-replacing-lunr-with-pagefind/)
- **CSS-free viewing mode.** All custom styles are scoped under `body:has(#kh-css-toggle:checked)`. The site renders legibly with zero CSS. [Read the post](https://www.allaboutken.com/posts/20250906-css-naked-css-only/)
- **AI-assisted image generation pipeline.** Browser-based tool (`/image-generator/`) for generating consistent blog hero images via Together AI. Documented in `docs/IMAGE_GENERATION.md`. [Read the post](https://www.allaboutken.com/posts/20260303-generating-blog-art/)
- **Readable image filenames.** Eleventy Image normally hashes filenames (`a1b2c3d4.avif`). A custom `filenameFormat` keeps them human-readable (`blog-my-photo-600.avif`). [Read the post](https://www.allaboutken.com/posts/20250907-deterministic-image-filenames/)
- **Feedback buttons without JavaScript.** A Cloudflare Worker acts as a CGI script for a static site -- thumbs up/down with no JS, no framework. [Read the post](https://www.allaboutken.com/posts/20260220-feedback-buttons-cgi-pattern/)

## Quick start

```bash
yarn install
yarn dev        # Sass watch + Eleventy --serve
yarn build      # Full production build: clean → sass → eleventy → embeddings
                # The embeddings step downloads ~476 MB of ONNX Runtime on first run for the build-time ML toolchain.
                # The MiniLM model is cached under .cache/transformers (CI restores it between runs).
yarn lint:links # Validate internal links/anchors in build/ (run after a build)
```

## Stack

| Layer           | Choice                                                                        |
| --------------- | ----------------------------------------------------------------------------- |
| Site generator  | [Eleventy v3](https://www.11ty.dev/)                                          |
| CSS             | Sass, scoped to a toggle                                                      |
| Keyword search  | [Pagefind](https://pagefind.app/)                                             |
| Semantic search | [Transformers.js](https://huggingface.co/docs/transformers.js) + MiniLM-L6-v2 |
| Deployment      | Vercel (auto-deploys from GitHub) + GitHub Actions                            |
| Templates       | Nunjucks + Markdown                                                           |

## Repository layout

```
src/site/         Templates, posts, data, includes
src/components/   Sass entry point and component styles
scripts/          Build-time tooling (embeddings, image generation)
docs/             Editorial handbook, publishing workflow, reviewer roles
eleventy.js       All config: filters, shortcodes, collections, image transform
```

For the full stack breakdown and design principles, see the [colophon](https://www.allaboutken.com/colophon/).
For contribution workflow and commit/PR conventions, see [`CONTRIBUTING.md`](CONTRIBUTING.md).
For hook setup and commit/PR title enforcement details, see [`docs/GIT_HOOKS.md`](docs/GIT_HOOKS.md).
For font asset placement and build wiring, see [`docs/FONTS.md`](docs/FONTS.md).
For offline/service-worker architecture and cache behavior, see [`docs/OFFLINE_SERVICE_WORKER.md`](docs/OFFLINE_SERVICE_WORKER.md).
For the full documentation map, see [`docs/README.md`](docs/README.md).
For command behavior and script lifecycle details, see [`docs/SCRIPTS.md`](docs/SCRIPTS.md).

## Social cards

All pages auto-generate OpenGraph/Twitter card images via [Eleventy's Screenshot Service](https://www.11ty.dev/docs/services/opengraph/):

- Card pages live at `/social/<page-url>/`
- Override with `og_image: 'https://full-url.jpg'` in frontmatter

<!-- Link to a blog post here once written -->

## Monitoring

- [Analytics](https://khawkins98.goatcounter.com/)
- [Link backs](https://webmention.io/settings/sites)
