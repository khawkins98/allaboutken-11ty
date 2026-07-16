# Style guide surfaces

This reference explains the three public style-guide pages in `src/site/style-guide/`, who owns them, and when contributors should use each one.

## Quick map

| Surface | Source file | Public URL | Primary owner | Use it when |
| --- | --- | --- | --- | --- |
| Style guide landing page | `src/site/style-guide/index.njk` | `/style-guide/` | Maintainer/editorial lead | You need the entry point that routes contributors to visual vs editorial guidance |
| Component reference | `src/site/style-guide/components.njk` | `/style-guide/components/` | Frontend/design-system maintainers | You are implementing or reviewing UI markup/classes and need live visual + class-level examples |
| Editorial style guide | `src/site/style-guide/editorial.njk` | `/style-guide/editorial/` | Editorial owner (Ken) | You are drafting or editing content and need voice, structure, frontmatter, and reasoning standards |

## What each page is for

### `index.njk` (navigator)

- Keeps the style-guide area discoverable from a single URL.
- Should stay brief; it is a routing page, not a duplicate of detailed guidance.
- Update this page when adding/removing style-guide subpages or changing naming.

### `components.njk` (visual and implementation reference)

This is the under-documented surface this backfill addresses most directly. It is the canonical implementation reference for visual patterns.

- Documents live demos and markup for tokens, typography, buttons, note boxes, layout primitives, utility classes, accessibility helpers, and feedback/search UI patterns.
- Use this page as the first check when deciding whether an existing class/pattern already exists before adding new CSS.
- Treat examples here as behavioral contracts for reusable UI patterns; when refactoring styles/components, confirm this page still renders correctly.
- Cross-reference:
  - [`TEMPLATES.md`](TEMPLATES.md) for where markup is assembled.
  - [`CSS_ARCHITECTURE.md`](CSS_ARCHITECTURE.md) for Sass organization and toggle constraints.

### `editorial.njk` (voice and content system)

- Defines tone, content-type expectations, frontmatter expectations, and writing quality checks.
- Pair this with `components.njk` when content guidance references a visual pattern (for example note boxes, margin notes, and code+demo blocks).

## Contributor workflow

1. Start with `/style-guide/` when orienting.
2. For template/CSS/UI work, read `/style-guide/components/` first, then `docs/TEMPLATES.md` and `docs/CSS_ARCHITECTURE.md`.
3. For writing/review work, read `/style-guide/editorial/` first, then `docs/PUBLISHING_WORKFLOW.md`.
