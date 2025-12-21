# Editorial Handbook & Style Guide

## Purpose

This handbook codifies how Ken's posts are written and presented: the voice, structure, formatting, and quality bar. It is intended for humans and LLMs to produce consistent, on-brand posts.

## Table of Contents

- [Bio (for reference)](#bio-for-reference)
- [Voice and Tone](#voice-and-tone)
- [Choosing Content Type: Impact Stories vs Blog Posts](#choosing-content-type-impact-stories-vs-blog-posts)
- [Digesting Posts](#digesting-posts)
- [Structure of a Blog Post](#structure-of-a-blog-post)
- [Formatting Rules](#formatting-rules)
  - [Note boxes (kh-note)](#note-boxes-kh-note)
  - [Code demos (codeAndDemo shortcode)](#code-demos-codeanddemo-shortcode)
- [Dos and Don'ts](#dos-and-donts)
- [Examples (Good vs Bad)](#examples-good-vs-bad)
- [Checklist for Writers](#checklist-for-writers)
- [Narrative & Flow (GW quick pass)](#narrative--flow-gw-quick-pass)
- [Reasoning & Fallacy Checks (FF quick pass)](#reasoning--fallacy-checks-ff-quick-pass)
- [Notes for This Site's Stack](#notes-for-this-sites-stack)
- [Impact Stories](#impact-stories)
  - [Required components](#required-components)
  - [Conventions (this site)](#conventions-this-site)
  - [Structure and narrative depth](#structure-and-narrative-depth)
  - [Metrics and evidence](#metrics-and-evidence)
  - [Tone and style](#tone-and-style)
  - [Accessibility and compliance](#accessibility-and-compliance)
  - [Front matter template](#front-matter-template)
  - [Checklist (author)](#checklist-author)
  - [Examples (Impact Stories)](#examples-impact-stories)
- [Cross-linking Guidance](#cross-linking-guidance)

## Bio (for reference)

- **Role**: Ken Hawkins – web design architect and product‑minded editorial lead.
- **Focus**: information architecture, design systems, Eleventy/Drupal, and pragmatic content tooling.
- **Unique value**: translating between communications and engineering; show‑first, evidence‑led writing; reusable, production‑ready patterns.
- **Style anchors**: approachable, specific, generous with links and examples.

## Voice and Tone

- **Core voice**: friendly, conversational, practical; confident but not performative; lightly self‑deprecating when helpful.
- **Audience**: practitioners and curious readers; assume web/dev literacy but explain project context.
- **Energy**: start with value, keep momentum with scannable structure, end warmly.
- **Humor/emojis**: Use sparingly and only when they enhance clarity or tone. Aim for 0 – 1 per post. Never use emojis as replacements for clear writing.
- **Perspective**: prefer first‑person singular for personal experience; use "we" only when work was truly collaborative.
- **Style**: use contractions and plain English; keep sentences and paragraphs short.
- **Tense**: default to present tense; use past tense for specific events or chronology.
- **Specificity**: avoid hype; be concrete and show first, then tell.

**Note**: For impact stories, apply a more formal narrative tone. See the [Impact Stories: Tone and style](#tone-and-style) section for specific guidance.

Examples

- Conversational setup: “Still here? Great. Read on.”
- Light aside: "This is important for local development."
- Warm close: "If you have feedback, I'd love to hear it."

## Choosing Content Type: Impact Stories vs Blog Posts

Use this decision guide to determine which format best suits your content:

**Write an Impact Story when**:

- Documenting substantial professional work with measurable outcomes (e.g., platform migrations, system optimizations, design system rollouts)
- You have quantifiable metrics showing business/organizational impact (performance gains, efficiency improvements, user outcomes)
- The work involved multiple phases, stakeholders, or technical components worth explaining in depth
- You want to demonstrate problem-solving approach, technical decisions, and lessons learned
- The story merits 800 – 1,500 words to tell comprehensively
- Goal: showcase portfolio-worthy work for professional context (hiring managers, collaborators, clients)

**Write a Blog Post when**:

- Explaining a specific technique, tool, or solution (e.g., "How to integrate Eleventy with gulp")
- Sharing a focused tutorial or implementation guide
- Discussing a narrow technical topic or discovery
- Writing timely commentary on tools, trends, or experiences
- Content fits naturally in 600 – 1,200 words
- Goal: teach, explain, or share knowledge with practitioners

**Key differences**:

- **Scope**: Impact stories cover end-to-end projects; blog posts address focused topics
- **Evidence**: Impact stories require metrics and outcomes; blog posts prioritize clarity and examples
- **Tone**: Impact stories use narrative storytelling; blog posts are conversational and tutorial-focused
- **Length**: Impact stories are comprehensive (800 – 1,500 words); blog posts are concise (600 – 1,200 words)
- **Audience**: Impact stories target evaluators (hiring managers, collaborators); blog posts target practitioners learning a technique

**Examples**:

- Impact story: "Scaled Drupal platform to 150k+ users with caching strategy" → comprehensive project narrative with performance metrics
- Blog post: "Integrating Eleventy with gulp for better Node.js tooling" → focused how-to with code examples

## Digesting Posts

Digesting posts are short-form commentary on external articles, tools, or resources. They help you track what you're reading and provide brief reactions.

**Key principle**: Never use the source article's title as your headline. Rewrite titles in your own voice to reflect what you found valuable or learned.

**Title patterns**:

- Focus on what you learned or discovered (e.g., "Why I should have been using the output tag all along")
- Make it specific and actionable (e.g., "Engineers need 45 minutes to hit peak focus")
- State a clear takeaway (e.g., "Context engineering beats prompt tricks for AI agents")
- Use conversational language (e.g., "Thoughtful AI integration beats bolted-on Clippy")

**Guidelines**:

- Titles should be concise, conversational, and specific
- Avoid simply restating the source headline
- Frame titles around the insight or value you gained
- No trailing punctuation
- Use first-person perspective when appropriate ("Why I should have...")

**Examples**:

Good (in your voice):
- "Why I should have been using the output tag all along"
- "Engineers need 45 minutes to hit peak focus"
- "Developers are becoming context curators for AI"
- "Thoughtful AI integration beats bolted-on Clippy"

Bad (source titles):
- "HTML's Best‑Kept Secret: the output tag"
- "Distracting software engineers is way more harmful than most managers think"
- "Effective context engineering for AI agents"
- "Smart AI integration comes only with knowledge"

**Front matter**:

```yaml
---
title: "Your rewritten title in your voice"
layout: layouts/digesting.njk
teaser: "Brief description of what the source covers."
date: YYYY-MM-DD
digest_link: https://example.com/source-article
tags: digesting
topics:
  - keyword one
  - keyword two
---
```

## Structure of a Blog Post

1. **Front matter** (YAML) with `title`, `teaser`, `image`, `image_meta.text`, `image_meta.altext`, `date`, `layout`, optional `tags`, `topics`, `url`/`permalink`.
2. **Headline**: concise title; no trailing punctuation.
3. **Teaser**: one sentence, persuasive, ≤ 25 words.
4. **Opening value statement**: a crisp sentence on what the reader gets or why it matters.
5. Optional **tl;dr / You’ll learn / This assumes** block near the top.
6. **Body**: H2/H3 sections, bullets/steps, code or visuals before deep explanation, short paragraphs.
7. **Wrap‑up**: restate the main point, invite feedback, link to next steps.

Suggested intro blocks (use only 1)

```markdown
> tl;dr
>
> - Key outcome 1
> - Link to demo/repo/docs
```

```markdown
> You’ll learn
>
> - What problem this solves
> - How the solution is structured
> - Where to change X in your project
```

## Formatting Rules

- **Headlines**: Avoid ending punctuation. Use sentence‑case for section headings unless a proper noun.
- **Teasers**: one sentence; avoid links unless essential.
- **Images**: always include meaningful alt text and attribution in front matter. Prefer figures with captions when the image carries information.
- **Em-dashes**: Use spaced em-dashes " — " (space-emdash-space) for better readability and line-breaking. Example: "Footer reduced from 80+ links — users could quickly scan."
- **Code**: use fenced code blocks inside `{% markdown %}` sections; rely on standard language‑tagged fences for syntax highlighting. Do not use legacy macros. Show code/visuals first; then explain. Prefer minimal comments in code.
- **Nunjucks in code fences**: when showing Njk templates, wrap content in `{% raw %}…{% endraw %}` inside the fence to avoid evaluation.
- **Links**: embed on descriptive nouns/phrases; avoid "here". Use absolute links for external sites; relative for internal routes.
- **Lists**: convert dense prose into bullets or numbered steps where possible.
- **Headings spacing**: always include a blank line after any heading before the following paragraph or list.

```markdown
## Header 2

Paragraph
```

- **Length**: aim for 600 – 1,200 words unless the user has otherwise suggested a length.
- **Whitespace**: no trailing spaces; leave a blank line between major sections.

### Note boxes (kh-note)

Use a compact aside for short callouts, updates, or related links.

```html
<aside class="kh-note-box">
  <span class="kh-note-box__label">Label</span>
  Your short note content goes here.
</aside>
```

Guidelines

- Keep the label short (e.g., “Update”, “Sidebar”, “Related”).
- Place a blank line before and after the aside.
- Prefer `aside` in post bodies; `div` is acceptable in layouts.

Front matter template

```yaml
---
title: 'Concise, clear headline'
layout: layouts/post.njk
teaser: 'One‑sentence persuasive summary (≤ 25 words).'
image: '/blog/example.jpg'
image_meta:
  text: 'Attribution or context.'
  altext: 'Accurate alt text.'
date: YYYY-MM-DD
via: 'https://example.com/source' # optional source/attribution URL for link posts
tags: posts
topics:
  - keyword one, keyword two
kens_status: draft # draft | final_draft | ready_for_publication
---
```

**Status tracking** (`kens_status`):
- `draft`: Initial draft, work in progress
- `final_draft`: Content complete, ready for final review
- `ready_for_publication`: Reviewed and approved, ready to publish

### Code demos (codeAndDemo shortcode)

- Use the `codeAndDemo` paired shortcode to show a snippet as both an escaped code block and a live demo from the same source.
- Place it outside `{% markdown %}` blocks (Markdown will double‑escape otherwise).
- Prefer plain HTML/JS snippets for live demos; keep them minimal and self‑contained.
- Don’t duplicate the same example in both a fenced code block and inline – let the shortcode handle both.

Usage

```njk
{% codeAndDemo 'html' -%}
<output id="result">Waiting…</output>
<script>
  const out = document.getElementById('result');
  out.textContent = 'Updated';
</script>
{% endcodeAndDemo %}
```

Notes

- The first argument (e.g., `'html'`) is used as a language class on the code block for syntax highlighting.
- When demonstrating Nunjucks templates, prefer fenced code within `{% markdown %}` and wrap the template with `{% raw %}…{% endraw %}` so it isn’t evaluated. The `codeAndDemo` shortcode is best for runnable HTML/JS examples.

## Dos and Don’ts

### ✅ Dos

- **Open with value**: one crisp sentence that sets context and benefit.
- **Use a tl;dr or You’ll learn box** near the top when posts exceed ~700 words.
- **Prefer bullets/steps** over long paragraphs for procedures.
- **Show first, then tell**: place code/visuals before deep explanation.
- **Write descriptive links** and include image alt text + attribution.
- **Keep Markdown tidy**: proper headings, fenced code, consistent spacing.
- **Close warmly** with a brief summary and invitation for feedback.

### ❌ Don’ts

- **Don’t** ship walls of text; break with headings and lists.
- **Don’t** over‑optimize for wit; keep humor subtle and sparse.
- **Don’t** omit alt text or captions when images convey meaning.
- **Don’t** embed “click here”; link meaningful phrases.
- **Don’t** leave trailing whitespace or inconsistent heading levels.

## Examples (Good vs Bad)

### tl;dr usage

Good

```12:35:src/site/posts/20191021-integrating-eleventy-with-gulp.njk
> ## tl;dr
> - We forked 11ty’s cmd.js to better integrate with gulp and other Node JS.
> - I made a demo at khawkins98/gulp-eleventy-example.
```

Bad

```markdown
In this post I’m going to tell you about a lot of things. It might be useful. Let’s get started.
```

### Image metadata

Good

```5:9:src/site/posts/20130612-ubuntu-ips-ec2-multiple.njk
image_meta:
  text: 'Image credit: …'
  altext: Ethernet cable
```

Bad

```yaml
image: '/blog/whatever.jpg' # no alt text, no attribution
```

### Descriptive links

Good

```18:24:src/site/posts/20171112-ibm-plex-font-and-fira.njk
… particularly when you're showing a lot of scientific data tables, as we do at EMBL‑EBI.
```

Bad

```markdown
See more details [here].
```

### Show code before deep explanation

Good

````47:66:src/site/posts/20191021-integrating-eleventy-with-gulp.njk
```js
fractalComponents = {
  component: “myComponent”,
  files: { … }
}
````

````

Bad

```markdown
First, a long explanation spanning multiple paragraphs… (code appears much later)
````

## Checklist for Writers

- [ ] Headline should be concise; no trailing punctuation.
- [ ] Teaser is one sentence (≤ 25 words) and persuasive.
- [ ] Opening includes a crisp value statement.
- [ ] tl;dr / You’ll learn / This assumes box added when appropriate.
- [ ] Dense prose converted into bullets/steps where possible.
- [ ] Code/visuals shown before deep explanation.
- [ ] Markdown polished: correct headings, fenced code, no trailing whitespace.
- [ ] All images have alt text and attribution.
- [ ] Warm closing that restates the main point and invites feedback.

## Narrative & Flow (GW quick pass)

- **Lede**: opens with value; sets stakes and audience in first 1 – 2 sentences.
- **Outline**: sections flow logically (problem → approach → steps → wrap‑up).
- **Transitions**: each section opens with a bridge sentence that orients the reader.
- **Scannability**: convert dense prose into bullets/steps; keep paragraphs short.
- **Headings**: informative, parallel structure; avoid cleverness that hides meaning.
- **Redundancy**: trim repetition; ensure examples precede explanations where helpful.

## Reasoning & Fallacy Checks (FF quick pass)

- **Quantifiers**: soften absolutes unless supported (avoid always/never/best without evidence).
- **Causality**: qualify causal language; prefer correlation/association unless you show mechanism or evidence.
- **Generality**: avoid overgeneralizing benchmark results; state task/model/context.
- **Dichotomies**: replace false either/or with both/and where appropriate.
- **Scope**: keep claims within the post’s stated audience, constraints, and sources.
- **Evidence**: ensure every non‑obvious claim has a citation or internal justification.

## Notes for This Site’s Stack

- Wrap post bodies in `{% markdown %}` in `.njk` files so standard fenced code blocks render correctly.
- When demonstrating Nunjucks templates, use `{% raw %}` inside code fences to avoid evaluation.
- Use standard `figure/figcaption` for images that carry meaning; project classes (e.g., `kh-figure`) are fine. Provide alt text and a succinct caption.

## Impact Stories

Impact stories are portfolio case studies demonstrating measurable outcomes through narrative. Unlike agency case studies (which sell services), these showcase *how you think and work* for potential employers and collaborators.

**Inspiration**: [Clearleft's case study format](https://clearleft.com/work) — active titles, question-based section headers, narrative momentum.

### Titles

Use **gerund/action format** by default. Questions and outcome statements work but are less common.

| Pattern | Example | Use when |
|---------|---------|----------|
| **Gerund** (default) | "Reclaiming three weeks of editorial time every month" | Process or transformation is interesting |
| **Outcome** | "Platform recovery after a cloud migration failure" | Result is more compelling than process |
| **Question** (sparingly) | "What happens when cloud best practices fail?" | Inherent tension or counterintuitive challenge |

**Avoid**: "Impact story: X", "Case study: Y", passive constructions.

### Section headers

Use **questions** for section headers — they create narrative momentum even when the title is a statement.

```
What was actually breaking?
How do you fix death by a thousand paper cuts?
What did we actually achieve?
Why did this actually work?
```

### Structure

Typical pattern (flexible, 3-5 sections):

1. **Result themes** — 3 short phrases at top (e.g., **Efficiency** | **Reliability** | **Consistency**). Not metrics — let the narrative reveal those.
2. **Organization context** — `{{ orgIntro(org) }}` macro after result themes.
3. **Opening** — 2-3 short paragraphs. Set stakes, frame challenge, state your role.
4. **Challenge section** — What was broken? Frame as question header.
5. **Approach section** — How did you solve it? Show constraints, tradeoffs, vulnerability.
6. **Outcomes section** — Metrics with human-impact framing. Bold labels, not bullet dumps.
7. **Reflection section** — Why this worked. Specific factors, not generic lessons.
8. **Links** — Related stories, deep dives, external artifacts.

### Conventions (this site)

- **Tag**: `impact-stories` (required) — appears in Work section, excluded from blog
- **Permalink**: `/work/YYYY/impact-story-slug/`
- **Filename**: `YYYYMMDD-impact-story-slug.njk`
- **Front matter**: Include `org` and `topics` (both render on Work table)
- **Images**: Store in `src/site/images/blog/`, include `image_meta.altext`

### Writing guidelines

**Length**: 600-1,200 words. Shorter and scannable beats exhaustive.

**Paragraphs**: 2-3 sentences max. Single sentences for emphasis.

**Formatting**: Bold lead-ins over bullet lists (`**Key point**: explanation`).

**Perspective**: Use **first-person singular** ("I") to emphasize personal contribution and decision-making. These are portfolio pieces — showcase *your* thinking. Use "I led the team to..." when describing collaborative work, not "we." Reserve "we" only when the team's collective action is genuinely the point.

**Metrics**: Specific numbers with baselines (e.g., "0.88s → 0.45s" not "50-70% faster"). Include human framing ("equivalent to 3 full work weeks").

**Tone**: Conversational, honest. Show process and tradeoffs, not just deliverables. Acknowledge what almost didn't work — strategic vulnerability builds credibility.

**Accessibility**: Alt text on images. Expand uncommon acronyms on first use (common ones like CSS, API, HTML need not be expanded).

### Front matter

```yaml
---
title: '[Gerund phrase describing the work]'
layout: layouts/post.njk
teaser: 'Narrative hook — tension/challenge, not metrics.'
date: YYYY-MM-DD
tags:
  - posts
  - impact-stories
topics:
  - keyword one
  - keyword two
org: Organization Name
permalink: /work/YYYY/impact-story-slug/
kens_status: draft
image: '/blog/example.jpg'
image_meta:
  altext: 'Descriptive alt text.'
  text: 'Attribution or context.'
---
```

### Checklist

- [ ] Title uses gerund format (preferred), outcome format, or question — not "Impact story: X"
- [ ] Teaser sets up challenge (not metrics)
- [ ] Result themes (3 short phrases) appear after opening
- [ ] Section headers are questions
- [ ] Uses "I" perspective (not "we") — portfolio pieces showcase personal contribution
- [ ] Shows constraints, tradeoffs, vulnerability — not just success
- [ ] Metrics include human-impact framing
- [ ] Paragraphs are 2-3 sentences; bold lead-ins over bullets
- [ ] 600-1,200 words

### Examples

#### Titles

| Good | Bad |
|------|-----|
| "Reclaiming three weeks of editorial time every month" | "Impact story: Editorial efficiency" |
| "Platform recovery after a cloud migration failure" | "Case study: UNDRR platform optimization" |

#### Section headers

| Good (questions) | Bad (generic) |
|------------------|---------------|
| "What was actually breaking?" | "Problem" |
| "How do you fix death by a thousand paper cuts?" | "Approach" |
| "Why did this actually work?" | "Outcomes" |

#### Outcomes

**Good** (bold labels + human framing):
```
**Efficiency**: 120 hours/month reclaimed — equivalent to 3 full work weeks.
**Reliability**: Timeout failures reduced 85%. Editors stopped losing work.
```

**Bad** (raw bullets):
```
- 120 hours saved
- 85% fewer timeouts
```

#### Vulnerability

**Good**: "Any single element could tank Core Web Vitals. Together, they seemed impossible. Some ideas didn't make the cut."

**Bad**: "We successfully implemented all features while maintaining excellent performance."

## Cross-linking Guidance

Effective cross-linking helps readers discover related content and builds a connected portfolio narrative.

**Patterns for cross-linking**:

1. **Impact story → related impact stories**: Link to stories covering related domains, technologies, or time periods

   ```markdown
   - Related impact story: [EMBL Visual Framework](/work/2019/impact-story-embl-visual-framework/) (design system work from same organization)
   ```

2. **Impact story → deep-dive blog posts**: Link to tutorial/technical posts that explain specific techniques used

   ```markdown
   - Deep dive: [Integrating Eleventy with gulp](/posts/20191021-integrating-eleventy-with-gulp/) (tooling approach used in this project)
   ```

3. **Blog post → impact stories**: Reference portfolio context where techniques were applied at scale

   ```markdown
   I used this pattern while building the [EMBL Visual Framework](/work/2019/impact-story-embl-visual-framework/), where we needed to support multiple technology stacks.
   ```

4. **Chronological linking**: Connect stories that show progression or evolution of approach

   ```markdown
   This work built on lessons learned from [DRS scaled Drupal platform](/work/2014/impact-story-drs-scaled-drupal/) and informed later optimizations at [UNDRR platform transformation](/work/2025/impact-story-undrr-platform-transformation/).
   ```

**Guidelines**:

- Use descriptive link text that explains _why_ the link is relevant (not "see also" or "here")
- Add brief parenthetical context when helpful: `(similar caching approach)` or `(design system from same organization)`
- Place cross-links at natural transition points (end of sections, in "Links and related" section)
- Prefer relative URLs for internal content: `/work/YYYY/slug/` or `/posts/slug/`
- Verify links are current – update when content moves or is renamed

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
- Code blocks use language tags for syntax highlighting: `js,`bash, ```yaml
- Note boxes (`<aside class="kh-note-box">`) for updates, related links, or short asides

**Calls to action**:

- GitHub repo links for code examples
- Invitations for feedback: "If you have feedback, I'd love to hear it" or "Let me know if this helped"
- Cross-references to related posts or impact stories
