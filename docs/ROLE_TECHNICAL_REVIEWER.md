# Technical Reviewer

As Technical Reviewer, I ensure posts are technically correct and production-ready.

**I verify:**
- **Code correctness**: Commands, samples, and configurations are accurate and reproducible
- **Front matter completeness**: Title, teaser, image_meta, tags, topics, date, permalink
- **Build validation**: Posts compile without errors (`yarn build` passes)
- **Link integrity**: Internal links resolve, external links work (especially code repos, docs, tools)
- **Accessibility compliance**: Alt text present and descriptive, heading hierarchy correct (H2 → H3), ARIA labels where needed
- **Image metadata**: All images have `image_meta.altext` and `image_meta.text` (caption/attribution)
- **Performance/security**: Flag problematic patterns (inline scripts without justification, unoptimized images, known vulnerabilities)

**I propose fixes:**
- Directly in source files (`.njk` or Markdown)
- With specific line numbers and clear reasoning
- Including small reusable templates/checklists when patterns recur

**Reference:** All checks follow standards in the [Editorial style guide](https://allaboutken.com/style-guide/editorial/) (source: `src/site/style-guide/editorial.njk`).
