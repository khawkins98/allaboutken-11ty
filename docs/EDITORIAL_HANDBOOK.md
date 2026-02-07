# Editorial Handbook — Internal Supplement

> **Canonical style guide**: [`/style-guide/editorial/`](https://allaboutken.com/style-guide/editorial/) (source: `src/site/style-guide/editorial.njk`)
>
> This file contains **internal-only guidance** that supplements the published style guide: editorial review passes, site-stack notes, and observed patterns. For voice, tone, structure, formatting, content types, frontmatter, dos/don'ts, examples, checklists, and cross-linking — see the published page.

## Bio (for reference)

- **Role**: Ken Hawkins — web design architect and product-minded editorial lead.
- **Focus**: information architecture, design systems, Eleventy/Drupal, and pragmatic content tooling.
- **Unique value**: translating between communications and engineering; show-first, evidence-led writing; reusable, production-ready patterns.
- **Style anchors**: approachable, specific, generous with links and examples.

## Narrative & Flow (GW quick pass)

- **Lede**: opens with value; sets stakes and audience in first 1–2 sentences.
- **Outline**: sections flow logically (problem → approach → steps → wrap-up).
- **Transitions**: each section opens with a bridge sentence that orients the reader.
- **Scannability**: convert dense prose into bullets/steps; keep paragraphs short.
- **Headings**: informative, parallel structure; avoid cleverness that hides meaning.
- **Redundancy**: trim repetition; ensure examples precede explanations where helpful.

## Reasoning & Fallacy Checks (FF quick pass)

- **Quantifiers**: soften absolutes unless supported (avoid always/never/best without evidence).
- **Causality**: qualify causal language; prefer correlation/association unless you show mechanism or evidence.
- **Generality**: avoid overgeneralizing benchmark results; state task/model/context.
- **Dichotomies**: replace false either/or with both/and where appropriate.
- **Scope**: keep claims within the post's stated audience, constraints, and sources.
- **Evidence**: ensure every non-obvious claim has a citation or internal justification.

## Notes for This Site's Stack

- Wrap post bodies in `{% markdown %}` in `.njk` files so standard fenced code blocks render correctly.
- When demonstrating Nunjucks templates, use `{% raw %}` inside code fences to avoid evaluation.
- Use standard `figure/figcaption` for images that carry meaning; project classes (e.g., `kh-figure`) are fine. Provide alt text and a succinct caption.

## Representative Patterns Observed

**Blog post cadence**:

- Posts often follow a "Scenario → How it works/making it happen → Here's some code/links" structure
- Opening value statements establish benefit quickly: "This will help you…" or "Here's a faster way to…"
- Code examples appear early, followed by explanation (show first, then tell)
- Closing typically includes a repo/demo link and invitation for feedback

**Technical writing style**:

- Contractions and conversational tone throughout ("Let's", "Here's", "You'll")
- Short paragraphs (2-4 sentences typical)
- Bulleted lists preferred over dense prose
- Inline code and keyboard shortcuts formatted with backticks: `npm install`, `Cmd+Shift+P`

**Visual conventions**:

- Screenshots and diagrams include descriptive captions via `<figure>`/`<figcaption>` or image_meta
- Code blocks use language tags for syntax highlighting: `js`, `bash`, `yaml`
- Note boxes (`<aside class="kh-note-box">`) for updates, related links, or short asides

**Calls to action**:

- GitHub repo links for code examples
- Invitations for feedback: "If you have feedback, I'd love to hear it" or "Let me know if this helped"
- Cross-references to related posts or impact stories
