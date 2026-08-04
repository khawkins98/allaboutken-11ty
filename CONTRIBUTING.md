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

Format: `prefix[(scope)]: sentence-case description`

| Prefix | Use for |
|--------|---------|
| `content` | Posts, pages, editorial copy, images |
| `feature` | New site functionality or pages |
| `fix` | Bug fixes, broken builds, broken links |
| `ci` | GitHub Actions, Vercel config, deployment |
| `chore` | Deps, tooling, refactoring, procedural docs |

Examples:

- `content: add garage page intro and how-it-works section`
- `content: draft post on Vercel proxy for hobby projects`
- `feature(search): add semantic search results page`
- `fix: correct trailing-slash redirect for proxied paths`
- `ci: add pinment rewrite and CORS headers to vercel.json`
- `chore(deps): upgrade pagefind 1.4.0 to 1.5.2`

### General rules

- Commit subject rules are normalized then enforced for the first line only:
  - `prepare-commit-msg` lowercases known prefixes (`content`, `feature`, `fix`, `ci`, `chore`)
  - `prepare-commit-msg` normalizes colon spacing to exactly one space
  - `prepare-commit-msg` trims leading/trailing subject whitespace
  - `prepare-commit-msg` removes one trailing period
  - `prepare-commit-msg` leaves unknown prefixes untouched so validation can reject them
- First line ≤ 72 characters (enforced by `commit-msg`)
- No trailing period on the subject (enforced by `commit-msg`)
- Body optional; when present, focus on the *why* (the diff already shows the *what*)
- One logical change per commit
- Never use `--no-verify` or `--no-gpg-sign` to bypass hooks

Commit subjects are normalized by `.githooks/prepare-commit-msg` then enforced by `.githooks/commit-msg` (activated on `yarn install` via the `prepare` script). PR titles are enforced in CI by `pr-title-check` for the same prefix set and optional scope, but CI does not enforce the 72-character limit or trailing-period rule.

## Pull requests

One PR per unit of work. Keep noisy refactors out of content PRs.

**Title**: must match CI's enforced pattern (`<prefix>[(<scope>)]: <description>`) using prefixes `content|feature|fix|ci|chore`.

**Examples**:

- `feature(search): add semantic search results page`
- `fix: correct trailing-slash redirect`
- `chore(deps): upgrade pagefind to v1.5.2`

**Body**: use [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). Two sections:

- **Summary**: 1–3 bullets on what changed and why
- **Test plan**: what you verified locally; for content posts, include rendering and link checks

### Content posts

Track readiness via the `kens_status` frontmatter field:

- `draft`: initial draft, work in progress
- `final_draft`: content complete, ready for editorial review
- `ready_for_publication`: reviewed and approved per [`PUBLISHING_WORKFLOW.md`](docs/PUBLISHING_WORKFLOW.md)

## Before pushing

- Use [`docs/SCRIPTS.md`](docs/SCRIPTS.md) as the source of truth for command behavior and expected outputs.
- `yarn build` runs clean
- `yarn lint:css` runs clean (for SCSS changes)
- Visually confirm new or edited pages render locally via `yarn dev`
- No trailing whitespace; final newline in each file
- Internal links resolve; external links resolve and aren't behind login

## Merging

Always merge through a PR, even for solo work. Don't push directly to `main`. Regular merge commits by default; squash only when a branch has noisy WIP commits not worth preserving.

## References

- [`CLAUDE.md`](CLAUDE.md): project-specific gotchas (image paths, embeddings, CSS toggle scoping, the intentional typo in `vf-componenet-rollup`)
- [`docs/GIT_HOOKS.md`](docs/GIT_HOOKS.md): hook setup, commit/PR title rules, and troubleshooting
- [`docs/FONTS.md`](docs/FONTS.md): Recursive asset placement and `@font-face`/passthrough wiring
- [`docs/PUBLISHING_WORKFLOW.md`](docs/PUBLISHING_WORKFLOW.md): editorial review stages and roles
- [`src/site/style-guide/editorial.njk`](src/site/style-guide/editorial.njk): voice, tone, structure
- [`docs/IMAGE_GENERATION.md`](docs/IMAGE_GENERATION.md): hero image pipeline
- [`docs/SCRIPTS.md`](docs/SCRIPTS.md): local commands and script behavior
