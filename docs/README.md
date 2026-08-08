# Documentation index

Use this page as the entry point for repository documentation. It maps each doc to its intent, audience, and the moment you should reach for it.

| Document | Purpose | Audience / owner | Use when |
| --- | --- | --- | --- |
| [`../README.md`](../README.md) | Project overview, stack, and quick start | Anyone entering the repo | You are orienting or setting up local dev |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Branch, commit, and PR conventions | Contributors and assistants | You are preparing commits, PR titles, and merge flow |
| [`GIT_HOOKS.md`](GIT_HOOKS.md) | Local hook behavior, commit/PR title enforcement, and troubleshooting | Contributors and maintainers | You need to set up hooks or debug local vs CI title/commit checks |
| [`SCRIPTS.md`](SCRIPTS.md) | Source of truth for `package.json` scripts and lifecycle behavior | Contributors running local/CI commands | You need the right command and expected output |
| [`FONTS.md`](FONTS.md) | IBM Plex font asset placement, build passthrough, and verification | Contributors editing typography or static assets | You are changing font files or `@font-face` wiring |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Runtime architecture and platform ownership (Vercel, DNS, Pages, Worker) | Maintainer/operators | You are changing deploy config, DNS, or rewrites |
| [`SEARCH.md`](SEARCH.md) | Keyword and semantic search architecture | Contributors touching search/indexing | You are changing Pagefind, embeddings, or search UI |
| [`CSS_ARCHITECTURE.md`](CSS_ARCHITECTURE.md) | Sass structure and CSS toggle constraints | Contributors editing styles | You are adding or refactoring SCSS |
| [`IMAGE_GENERATION.md`](IMAGE_GENERATION.md) | Hero image workflow and attribution rules | Content authors/editors | You are creating or updating post hero art |
| [`PUBLISHING_WORKFLOW.md`](PUBLISHING_WORKFLOW.md) | Editorial stages, handoffs, and quality gates | Editorial roles and maintainers | You are moving a draft toward publication |
| [`STYLE_REVIEW_PROCESS.md`](STYLE_REVIEW_PROCESS.md) | Editorial style review process | Editorial reviewers | You are running a focused style pass |
| [`ROLE_TECHNICAL_REVIEWER.md`](ROLE_TECHNICAL_REVIEWER.md) | Technical reviewer role brief | Technical reviewers | You are doing technical correctness review |
| [`ROLE_EDITORIAL_STYLE_EDITOR.md`](ROLE_EDITORIAL_STYLE_EDITOR.md) | Editorial style editor role brief | Style reviewers | You are editing for tone, structure, and readability |
| [`ROLE_SEO_DISCOVERABILITY_EDITOR.md`](ROLE_SEO_DISCOVERABILITY_EDITOR.md) | SEO/discoverability role brief | SEO reviewers | You are improving metadata, findability, and internal links |
| [`ROLE_TEMPLATE.md`](ROLE_TEMPLATE.md) | Template for defining new reviewer roles | Maintainers adding roles | You are introducing a new role profile |
| [`../worker/README.md`](../worker/README.md) | Feedback worker routes, local dev, and deploy commands | Maintainer/operators | You are operating or debugging `feedback.allaboutken.com` |
| [`../src/site/style-guide/editorial.njk`](../src/site/style-guide/editorial.njk) | Canonical voice/tone/style guidance | Authors and editors | You need writing standards while drafting or editing |
| [`FRONTMATTER.md`](FRONTMATTER.md) | Reference for every YAML frontmatter field used across post, page, and digest templates | Authors, editors, and contributors adding posts | You need to know what a field does, which templates use it, and whether it is required |
| [`ELEVENTY_CONFIG.md`](ELEVENTY_CONFIG.md) | Reference for all plugins, filters, shortcodes, collections, and config options assembled by `eleventy.js` and `config/eleventy/` | Contributors modifying build config or templates | You are adding a filter, shortcode, or collection, or need to understand how the build pipeline works |
| [`DATA_FILES.md`](DATA_FILES.md) | Schema and template usage for `siteConfig.json` and `garage.json` | Contributors editing site-wide config or the garage project listing | You are adding a garage project, updating site metadata, or tracing where a global value comes from |
| [`TEMPLATES.md`](TEMPLATES.md) | Layout hierarchy, partials, macros, and Nunjucks patterns used in site templates | Contributors changing page/layout templates | You are adding a page template, editing layouts, or tracing where markup is shared |
| [`COMPONENTS.md`](COMPONENTS.md) | Component directory structure and Sass/asset build wiring | Contributors editing UI components and styles | You are adding/changing SCSS modules, assets, or component markup |
| [`DEVELOPMENT_SETUP.md`](DEVELOPMENT_SETUP.md) | Local environment setup, Node/Yarn baseline, and troubleshooting | New contributors and maintainers | You need a reliable local dev environment or need to fix setup issues quickly |
| [`OFFLINE_SERVICE_WORKER.md`](OFFLINE_SERVICE_WORKER.md) | Offline/service-worker runtime behavior, caching, and update safety notes | Contributors touching service worker behavior or static asset delivery | You are changing `sw.js`, registration flow, or offline cache strategy |

## Suggested read paths

- **New contributor:** `../README.md` -> `../CONTRIBUTING.md` -> `GIT_HOOKS.md` -> `SCRIPTS.md`
- **Template work:** `TEMPLATES.md` -> `FRONTMATTER.md` -> `ELEVENTY_CONFIG.md`
- **Component work:** `COMPONENTS.md` -> `CSS_ARCHITECTURE.md` -> `FONTS.md` -> `ELEVENTY_CONFIG.md`
- **Local setup/debugging:** `DEVELOPMENT_SETUP.md` -> `SCRIPTS.md`
- **Offline behavior:** `OFFLINE_SERVICE_WORKER.md` -> `ELEVENTY_CONFIG.md` -> `DEVELOPMENT_SETUP.md`
- **Content workflow:** `PUBLISHING_WORKFLOW.md` -> `../src/site/style-guide/editorial.njk` -> `IMAGE_GENERATION.md`
- **Operations/deploy:** `DEPLOYMENT.md` -> `../worker/README.md`
