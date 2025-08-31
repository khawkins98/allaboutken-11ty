# Refactor Next: Reduce CSS class surface area

Goal: lower the total number of CSS classes in use to simplify maintenance, improve clarity, and shrink CSS.

## Principles

- Prefer semantic HTML and a small, consistent utility set
- Reuse existing utilities instead of adding new one‑offs
- Avoid deep specificity; keep selectors short
- Remove dead or overlapping classes before adding new ones

## Plan (phased)

1) Inventory (quick)

- Generate a usage report of classes from built HTML/JS
- Count unique classes vs defined selectors in `styles.css`
- Identify top 50 unused or near‑unused selectors

2) Consolidate utilities

- Merge duplicate spacing/visibility helpers
- Define a minimal spacing scale and apply across templates
- Replace bespoke one‑off utilities with the unified set

3) Component selectors tidy

- Flatten selectors to 1 level where possible
- Remove redundant aliases (multiple class names for the same thing)
- Prefer BEM‑like clarity only where needed; otherwise simple single‑class hooks

4) Remove dead selectors (batch)

- Remove unused selectors in small batches (PR‑sized)
- Visual check key pages after each batch (home, blog index, 3–4 posts, CV, search)

5) Optional size trims

- Safelist critical state classes; run PurgeCSS against build for a report only
- Manually port safe deletions back to SCSS (no permanent purge step)

## Tasks (actionable)

- [ ] Produce class usage report from `build/` and compare with selectors in CSS
- [ ] Propose a minimal spacing/visibility utility set
- [ ] Replace bespoke utilities in templates with unified set
- [ ] Identify and remove 25–50 unused selectors (batch 1)
- [ ] Visual verify key pages; fix regressions
- [ ] Repeat unused selector removal (batch 2+)

## Notes

- Entry SCSS: `src/components/vf-componenet-rollup/index.scss`
- Keep breakpoints in `_settings.scss`; do not move media queries to CSS vars
- Avoid increasing selector specificity while consolidating
