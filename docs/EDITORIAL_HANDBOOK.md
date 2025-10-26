# Editorial Handbook & Style Guide

## Purpose

This handbook codifies how Ken's posts are written and presented: the voice, structure, formatting, and quality bar. It is intended for humans and LLMs to produce consistent, on-brand posts.

## Table of Contents

- [Bio (for reference)](#bio-for-reference)
- [Voice and Tone](#voice-and-tone)
- [Choosing Content Type: Impact Stories vs Blog Posts](#choosing-content-type-impact-stories-vs-blog-posts)
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

- **Role**: Ken Hawkins — web design architect and product‑minded editorial lead.
- **Focus**: information architecture, design systems, Eleventy/Drupal, and pragmatic content tooling.
- **Unique value**: translating between communications and engineering; show‑first, evidence‑led writing; reusable, production‑ready patterns.
- **Style anchors**: approachable, specific, generous with links and examples.

## Voice and Tone

- **Core voice**: friendly, conversational, practical; confident but not performative; lightly self‑deprecating when helpful.
- **Audience**: practitioners and curious readers; assume web/dev literacy but explain project context.
- **Energy**: start with value, keep momentum with scannable structure, end warmly.
- **Humor/emojis**: Use sparingly and only when they enhance clarity or tone. Aim for 0–1 per post. Never use emojis as replacements for clear writing.
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
- The story merits 800–1,500 words to tell comprehensively
- Goal: showcase portfolio-worthy work for professional context (hiring managers, collaborators, clients)

**Write a Blog Post when**:

- Explaining a specific technique, tool, or solution (e.g., "How to integrate Eleventy with gulp")
- Sharing a focused tutorial or implementation guide
- Discussing a narrow technical topic or discovery
- Writing timely commentary on tools, trends, or experiences
- Content fits naturally in 600–1,200 words
- Goal: teach, explain, or share knowledge with practitioners

**Key differences**:

- **Scope**: Impact stories cover end-to-end projects; blog posts address focused topics
- **Evidence**: Impact stories require metrics and outcomes; blog posts prioritize clarity and examples
- **Tone**: Impact stories use narrative storytelling; blog posts are conversational and tutorial-focused
- **Length**: Impact stories are comprehensive (800–1,500 words); blog posts are concise (600–1,200 words)
- **Audience**: Impact stories target evaluators (hiring managers, collaborators); blog posts target practitioners learning a technique

**Examples**:

- Impact story: "Scaled Drupal platform to 150k+ users with caching strategy" → comprehensive project narrative with performance metrics
- Blog post: "Integrating Eleventy with gulp for better Node.js tooling" → focused how-to with code examples

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
- **Code**: use fenced code blocks inside `{% markdown %}` sections; rely on standard language‑tagged fences for syntax highlighting. Do not use legacy macros. Show code/visuals first; then explain. Prefer minimal comments in code.
- **Nunjucks in code fences**: when showing Njk templates, wrap content in `{% raw %}…{% endraw %}` inside the fence to avoid evaluation.
- **Links**: embed on descriptive nouns/phrases; avoid “here”. Use absolute links for external sites; relative for internal routes.
- **Lists**: convert dense prose into bullets or numbered steps where possible.
- **Headings spacing**: always include a blank line after any heading before the following paragraph or list.

```markdown
## Header 2

Paragraph
```

- **Length**: aim for 600–1,200 words unless the user has otherwise suggested a length.
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
---
```

### Code demos (codeAndDemo shortcode)

- Use the `codeAndDemo` paired shortcode to show a snippet as both an escaped code block and a live demo from the same source.
- Place it outside `{% markdown %}` blocks (Markdown will double‑escape otherwise).
- Prefer plain HTML/JS snippets for live demos; keep them minimal and self‑contained.
- Don’t duplicate the same example in both a fenced code block and inline—let the shortcode handle both.

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
> #### tl;dr
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

- **Lede**: opens with value; sets stakes and audience in first 1–2 sentences.
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

Write comprehensive, evidence‑led impact stories that demonstrate measurable outcomes and tell the full story of complex work.

### Required components

- **Title**: Begin with "Impact story:" followed by an outcome-focused, specific headline. Include org/context when allowed.
- **Teaser**: Narrative hook (not metrics). One sentence that tells the story arc or challenge. Avoid repeating tl;dr content.
- **tl;dr block**: 3–6 bullets covering key quantified outcomes, approach highlights, and sustained impact. This is where metrics go.
- **Organization context (after tl;dr)**: Use `{% from "partials/orgs.njk" import orgIntro %}` and `<p class="kh-text-body--3">{{ orgIntro(org) }}</p>` to provide organization background after the tl;dr.
- **Narrative opening**: 2–4 paragraphs that set context, explain the challenge, and frame why this work mattered. Make it compelling and human-focused.
- **Body sections** (flexible structure based on story needs):
  - **Problem**: Detailed problem framing with specific pain points and stakeholder impact
  - **Approach**: Comprehensive description of the solution with subsections for major components
  - **Outcomes**: Categorized results (e.g., Performance, Reliability, Cost, User Satisfaction) with human-impact framing
  - **What made this work**: Reflection on key factors, lessons learned, and why the approach succeeded
  - **Links**: Related impact stories, deep-dive blog posts, external artifacts

### Conventions (this site)

- **Tag**: Use `impact-stories` tag (required). This ensures they appear in the Work section and are excluded from blog listings.
- **Date display**: Show only the year in UI. Use full `date` in front matter for sorting.
- **Permalinks**: Use `/work/YYYY/impact-story-slug/` format (not `/posts/`).
- **Filename**: Use `YYYYMMDD-impact-story-slug.njk` format for consistency.
- **Organization & topics**: Provide `org` and `topics` — both render on the Work table (`/work/`).
- **Images**: Store under `src/site/images/blog/` and reference via `image: "/blog/…"`; include `image_meta.altext` and `image_meta.text`.
- **Cross‑linking**: Include links to related impact stories and deep-dive blog posts. Link text should be descriptive, not naked URLs.

### Structure and narrative depth

Impact stories should be comprehensive (800–1,500 words) and tell the complete story:

**Opening narrative** (after tl;dr and orgIntro):

- Set context about the organization, scale, and constraints
- Frame the challenge in human terms (what was at stake for users/stakeholders)
- Introduce the approach and why it mattered

**Problem section**:

- Break down specific pain points with concrete examples
- Show impact on different stakeholder groups
- Include context about organizational constraints or complexity

**Approach section**:

- Use descriptive subsection headers (e.g., "Risk register as prioritization tool" not just "Risk register")
- Explain technical decisions with rationale
- Include specific examples, numbers, and implementation details
- Show the "how" not just the "what"

**Outcomes section**:

- Categorize results (Performance, Reliability, Cost, etc.)
- Add human-impact framing: what the metrics mean for real users
- Include specific numbers with baselines and timeframes
- Connect technical improvements to organizational value

**What made this work**:

- Reflect on key factors that enabled success
- Share lessons learned or principles discovered
- Acknowledge collaboration and cross-functional work
- End with the ultimate impact or transformation

### Metrics and evidence

- **Specific over ranges**: Use single numbers when possible (e.g., "2x faster" or "0.88s → 0.45s" not "50-70% faster")
- **Baselines and timeframes**: Always show before/after and specify duration
- **Attribution**: Note sources (GA4, Looker Studio, CWV, platform logs) when relevant
- **Relative metrics**: For team-size sensitive data, normalize (e.g., "per 100 editors" instead of absolute team size)
- **Human framing**: Explain what metrics mean (e.g., "~120 hours monthly per 100 editors—equivalent to 3 full work weeks")
- **Multiple dimensions**: Show outcomes across performance, cost, reliability, user satisfaction, etc.

### Tone and style

- **Narrative first**: Tell a story, not just a project report
- **Concrete and specific**: Use real examples, specific tools, named locations/teams
- **Human impact**: Connect technical work to user/stakeholder outcomes
- **Honest about challenges**: Include problems encountered and how they were solved
- **Avoid superlatives**: Let outcomes speak for themselves
- **Professional objectivity**: Focus on facts and problem-solving over validation

### Accessibility and compliance

- Provide meaningful alt text and captions for screenshots/diagrams
- Expand acronyms on first use (e.g., "GAR (Global Assessment Report)")
- Review for confidentiality: no internal credentials, private endpoints, or sensitive team data
- Use relative metrics when absolute numbers could expose confidential information

### Front matter template

```yaml
---
title: 'Impact story: Descriptive outcome-focused headline'
layout: layouts/post.njk
teaser: 'Narrative hook that tells the story arc (not metrics).'
date: YYYY-MM-DD
tags:
  - posts
  - impact-stories
topics:
  - keyword one
  - keyword two
org: Organization Name
permalink: /work/YYYY/impact-story-slug/
image: '/blog/example.jpg' # optional
image_meta:
  altext: 'Accurate alt text.'
  text: 'Attribution or context.'
---
```

### Checklist (author)

- [ ] Title starts with "Impact story:" and is outcome-focused
- [ ] Teaser is narrative (not metrics), doesn't repeat tl;dr
- [ ] tl;dr has 3–6 bullets with quantified outcomes
- [ ] orgIntro appears after tl;dr (not before)
- [ ] Opening narrative (2–4 paragraphs) sets context compellingly
- [ ] Problem section includes specific pain points and human impact
- [ ] Approach section has descriptive subsections with implementation details
- [ ] Outcomes categorized and include human-impact framing
- [ ] "What made this work" section provides reflection
- [ ] Metrics use specific numbers with baselines and timeframes
- [ ] Links use descriptive text (no naked URLs)
- [ ] Accessibility (alt text, acronyms) and confidentiality reviewed
- [ ] Cross-links to related impact stories or deep-dive posts included

### Examples (Impact Stories)

These examples show good and bad patterns specific to impact stories.

#### Teaser (narrative vs metrics)

**Good** (narrative hook that sets up the story):

```yaml
teaser: 'Managed a large‑scale Drupal platform with 150k+ users and integrated commerce; optimized caching and DB performance.'
```

This tells the _story_ (what was at stake, what was involved) without repeating the tl;dr.

**Bad** (metrics dump that duplicates tl;dr):

```yaml
teaser: 'Achieved 80% cache hit rate, reduced query times by 40%, and scaled to 150k users.'
```

#### Opening narrative (compelling vs technical)

**Good** (human-focused context):

```markdown
Running a high-traffic Drupal platform with 150,000+ registered users and integrated e-commerce meant operating with near-zero tolerance for latency. Every timeout during checkout cost revenue. Every slow page load accessing account data eroded trust.
```

Sets stakes in human terms before diving into technical details.

**Bad** (immediate technical detail):

```markdown
We implemented Varnish caching with a 30-minute TTL and optimized MySQL queries using indexes on user_id and product_id columns.
```

#### Approach section (descriptive vs generic headers)

**Good** (descriptive subsection headers):

```markdown
## Approach: multi-layered performance strategy

**Reverse proxy caching (Varnish)**

Implemented Varnish in front of the application layer…

**Database optimization (MySQL)**

Profiled slow queries and optimized the hot paths…
```

Headers describe _what was done_ and _why_, making the approach scannable.

**Bad** (generic headers):

```markdown
## Approach

**Caching**

We added caching.

**Database**

We optimized queries.
```

#### Outcomes (human-impact framing vs raw metrics)

**Good** (metrics + what they mean):

```markdown
**Operational reliability**:

- **Confident deployments**: Multiple deployments per week with instant rollback capability
- **Proactive monitoring**: APM and slow query logs caught issues before they affected users
- **Graceful scaling**: Platform handled traffic spikes during promotional campaigns without degradation
```

Each metric is framed in terms of what it enabled or prevented.

**Bad** (raw metrics only):

```markdown
**Outcomes**:

- 80% cache hit rate
- 40% faster queries
- 99.9% uptime
```

#### Cross-linking (descriptive vs naked URLs)

**Good** (descriptive link text):

```markdown
- Related impact story: [UNDRR platform transformation](/work/2025/impact-story-undrr-platform-transformation/) (includes similar database optimization work)
- Related writing: [UX success: Doubling conversion rates](/posts/20140407-ux-success-double-conversion.html) (Drupal e-commerce from same period)
```

**Bad** (naked or generic links):

```markdown
- See also: /work/2025/impact-story-undrr-platform-transformation/
- Related post [here](/posts/20140407-ux-success-double-conversion.html)
```

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
- Verify links are current—update when content moves or is renamed

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
