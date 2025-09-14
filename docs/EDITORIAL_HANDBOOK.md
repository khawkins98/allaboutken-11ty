# Editorial Handbook & Style Guide

## Purpose

This handbook codifies how Ken’s posts are written and presented: the voice, structure, formatting, and quality bar. It is intended for humans and LLMs to produce consistent, on-brand posts.

## Voice and Tone

- **Core voice**: friendly, conversational, practical; confident but not performative; lightly self‑deprecating when helpful.
- **Audience**: practitioners and curious readers; assume web/dev literacy but explain project context.
- **Energy**: start with value, keep momentum with scannable structure, end warmly.
- **Humor/emojis**: occasional, tasteful, in service of clarity; 0–1 per post is plenty.

Examples

- Conversational setup: “Still here? Great. Read on.”
- Light aside: “This is important for local development.”
- Warm close: “If you have feedback, I’d love to hear it.”

## Structure of a Blog Post

1. **Front matter** (YAML) with `title`, `teaser`, `image`, `image_meta.text`, `image_meta.altext`, `date`, `layout`, optional `tags`, `topics`, `url`/`permalink`.
2. **Headline**: concise Title Case; no trailing punctuation.
3. **Teaser**: one sentence, persuasive, ≤ 25 words.
4. **Opening value statement**: a crisp sentence on what the reader gets or why it matters.
5. Optional **tl;dr / You’ll learn / This assumes** block near the top.
6. **Body**: H2/H3 sections, bullets/steps, code or visuals before deep explanation, short paragraphs.
7. **Wrap‑up**: restate the main point, invite feedback, link to next steps.

Suggested intro blocks

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

- **Headlines**: Title Case; avoid ending punctuation. Use sentence‑case for section headings unless a proper noun.
- **Teasers**: one sentence; avoid links unless essential.
- **Images**: always include meaningful alt text and attribution in front matter. Prefer figures with captions when the image carries information.
- **Code**: use fenced code blocks inside `{% markdown %}` sections, or the site’s `{% codeblock %}` macro for syntax highlighting. Show code/visuals first; then explain. Prefer minimal comments in code.
- **Nunjucks in code fences**: when showing Njk templates, wrap content in `{% raw %}…{% endraw %}` inside the fence to avoid evaluation.
- **Links**: embed on descriptive nouns/phrases; avoid “here”. Use absolute links for external sites; relative for internal routes.
- **Lists**: convert dense prose into bullets or numbered steps where possible.
- **Length**: aim for 600–1,200 words unless the user has otherwise suggested a length.
- **Whitespace**: no trailing spaces; leave a blank line between major sections.

Front matter template

```yaml
---
title: "Concise, Clear Headline in Title Case"
layout: layouts/post.njk
teaser: "One‑sentence persuasive summary (≤ 25 words)."
image: "/blog/example.jpg"
image_meta:
  text: "Attribution or context."
  altext: "Accurate alt text."
date: YYYY-MM-DD
tags: posts
topics:
  - keyword one, keyword two
---
```

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
image: "/blog/whatever.jpg" # no alt text, no attribution
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

- [ ] Headline in Title Case; concise; no trailing punctuation.
- [ ] Teaser is one sentence (≤ 25 words) and persuasive.
- [ ] Opening includes a crisp value statement.
- [ ] tl;dr / You’ll learn / This assumes box added when appropriate.
- [ ] Dense prose converted into bullets/steps where possible.
- [ ] Code/visuals shown before deep explanation.
- [ ] Markdown polished: correct headings, fenced code, no trailing whitespace.
- [ ] All images have alt text and attribution.
- [ ] Warm closing that restates the main point and invites feedback.

## Notes for This Site’s Stack

- Wrap post bodies in `{% markdown %}` in `.njk` files so standard fenced code blocks render correctly.
- When demonstrating Nunjucks templates, use `{% raw %}` inside code fences to avoid evaluation.
- Prefer the project’s `{% codeblock %}` macro for component docs or when you need consistent styling.
- Use `@ken-figure` or standard `figure/figcaption` for images that carry meaning; provide `alttext` and a succinct caption.

## Representative Patterns Observed

- Posts often include a short “Scenario”, “How it works/making it happen”, and “Here’s some code/links” cadence.
- Occasional emoji is acceptable; ensure it does not replace clarity.
- Calls to action typically point to a GitHub repo, demo, or invite feedback on X/Twitter.
