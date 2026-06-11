# Documentation index

Use this page as the entry point for repository documentation. It maps each doc to its intent, audience, and the moment you should reach for it.

| Document | Purpose | Audience / owner | Use when |
| --- | --- | --- | --- |
| [`../README.md`](../README.md) | Project overview, stack, and quick start | Anyone entering the repo | You are orienting or setting up local dev |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Branch, commit, and PR conventions | Contributors and assistants | You are preparing commits, PR titles, and merge flow |
| [`SCRIPTS.md`](SCRIPTS.md) | Source of truth for `package.json` scripts and lifecycle behavior | Contributors running local/CI commands | You need the right command and expected output |
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

## Suggested read paths

- **New contributor:** `../README.md` -> `../CONTRIBUTING.md` -> `SCRIPTS.md`
- **Content workflow:** `PUBLISHING_WORKFLOW.md` -> `../src/site/style-guide/editorial.njk` -> `IMAGE_GENERATION.md`
- **Operations/deploy:** `DEPLOYMENT.md` -> `../worker/README.md`
