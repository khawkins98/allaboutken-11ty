# Contributing

How to make changes to this site consistently. For editorial workflow (review stages, roles, content sign-off) see [`docs/PUBLISHING_WORKFLOW.md`](docs/PUBLISHING_WORKFLOW.md). For voice and formatting see the [editorial style guide](src/site/style-guide/editorial.njk).

This guide is for Ken, AI assistants working in the repo, and occasional human collaborators. The goal is consistency, not ceremony.

## Branch naming

Use a prefix that matches the work:

- `post/<slug>`: new or updated content posts (e.g., `post/ars-technica-ai-policy-digest`)
- `feature/<slug>`: functional site changes (e.g., `feature/semantic-search`)
- `fix/<slug>`: bug fixes and small corrections
- `chore/<slug>`: deps, tooling, infra, procedural docs
- `draft/<slug>`: exploratory work not yet ready for PR

One branch per unit of work. If a content post and an unrelated refactor ship together, split them.

## Commit messages

Format: `prefix: sentence-case description`

| Prefix | Use for |
|--------|---------|
| `content:` | Posts, pages, editorial copy, images |
| `feature:` | New site functionality or pages |
| `fix:` | Bug fixes, broken builds, broken links |
| `ci:` | GitHub Actions, Vercel config, deployment |
| `chore:` | Deps, tooling, refactoring, procedural docs |

Examples:

- `content: Add garage page intro and how-it-works section`
- `content: Draft post on Vercel proxy for hobby projects`
- `feature: Add /garage/ index page and data file`
- `fix: Correct trailing-slash redirect for proxied paths`
- `ci: Add pinment rewrite and CORS headers to vercel.json`
- `chore: Upgrade pagefind 1.4.0 → 1.5.2`

### General rules

- First line ≤ 72 characters when practical
- Body optional; when present, focus on the *why* (the diff already shows the *what*)
- One logical change per commit
- Never use `--no-verify` or `--no-gpg-sign` to bypass hooks

## Pull requests

One PR per unit of work. Keep noisy refactors out of content PRs.

**Title**: same conventions as commit messages. Under 70 characters.

**Body**: use [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). Two sections:

- **Summary**: 1–3 bullets on what changed and why
- **Test plan**: what you verified locally; for content posts, include rendering and link checks

### Content posts

Track readiness via the `kens_status` frontmatter field:

- `draft`: initial draft, work in progress
- `final_draft`: content complete, ready for editorial review
- `ready_for_publication`: reviewed and approved per [`PUBLISHING_WORKFLOW.md`](docs/PUBLISHING_WORKFLOW.md)

## Before pushing

- `yarn build` runs clean
- `yarn lint:css` runs clean (for SCSS changes)
- Visually confirm new or edited pages render locally via `yarn dev`
- No trailing whitespace; final newline in each file
- Internal links resolve; external links resolve and aren't behind login

## Merging

Always merge through a PR, even for solo work. Don't push directly to `main`. Regular merge commits by default; squash only when a branch has noisy WIP commits not worth preserving.

## References

- [`CLAUDE.md`](CLAUDE.md): project-specific gotchas (image paths, embeddings, CSS toggle scoping, the intentional typo in `vf-componenet-rollup`)
- [`docs/PUBLISHING_WORKFLOW.md`](docs/PUBLISHING_WORKFLOW.md): editorial review stages and roles
- [`src/site/style-guide/editorial.njk`](src/site/style-guide/editorial.njk): voice, tone, structure
- [`docs/IMAGE_GENERATION.md`](docs/IMAGE_GENERATION.md): hero image pipeline
