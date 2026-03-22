# Accessibility Audit — AllAboutKen.com

**Standard:** WCAG 2.1 AA
**Date:** 2026-03-22
**Scope:** Templates, CSS, JavaScript, and interactive components

---

## Summary

The site has a solid accessibility foundation: semantic HTML, proper landmark roles, skip navigation with visible focus, animated content behind `prefers-reduced-motion`, and a CSS-toggle mode that gracefully degrades without styles. Issues found are primarily color contrast failures in metadata/label text and a few structural gaps.

**3 WCAG AA failures. 4 advisory issues.**

---

## Failures (WCAG AA non-conformant)

### F1 — Color Contrast: "Digesting" tab label
**Severity: High | WCAG SC 1.4.3**

The "Digesting" category tab uses white text on the orange brand color `#f49e17`.

- **Contrast ratio:** 2.13:1
- **Required:** 4.5:1 (text is 11px, not large text)
- **Location:** `src/site/_includes/partials/post-summary.njk:6`, CSS `.kh-summary__tab` in `index.scss:546`

**Fix:** Darken the background to `#a05e00` or similar (achieves 4.5:1 with white), or use dark text `#222` on the orange (achieves ~4.7:1).

---

### F2 — Color Contrast: Post date and metadata text
**Severity: Medium | WCAG SC 1.4.3**

`.kh-summary__date` and `.kh-summary__author` use `#707372` at 13px on the `#fbf6ef` page background.

- **Contrast ratio:** ~4.43:1
- **Required:** 4.5:1
- **Location:** `index.scss:501–513`, `index.scss:486–498`

**Fix:** Darken to `#6b6e6c` or similar to cross the 4.5:1 threshold. Alternatively increase font size to 14px bold (qualifying as "large text" reduces requirement to 3:1).

---

### F3 — Color Contrast: Figure credit text
**Severity: Medium | WCAG SC 1.4.3**

`.kh-figure__credit` uses `#737373` at 12px (0.75rem) on `#fbf6ef`.

- **Contrast ratio:** ~4.43:1
- **Required:** 4.5:1
- **Location:** `index.scss:419–424`

**Fix:** Same as F2 — darken the grey slightly or increase font size.

---

## Advisory Issues (best-practice / low-risk failures)

### A1 — Button focus indicator relies on motion
**Severity: Medium | WCAG SC 2.4.7**

`.kh-button` removes the native focus outline (`outline: 0`). The `:focus` state provides visual feedback via a box-shadow change and a 4px translate transform. For users with `prefers-reduced-motion: reduce` or low motion sensitivity, the positional shift is subtle and may not satisfy the intent of SC 2.4.7.

- **Location:** `index.scss:326–366`

**Fix:** Add an explicit outline or border change to `.kh-button:focus-visible` that does not depend on motion. Example: `outline: 2px solid var(--kh-color--blue); outline-offset: 2px;`

---

### A2 — Primary navigation has no accessible name
**Severity: Low | WCAG SC 4.1.2 / best practice**

`<nav class="kh-navigation">` in `base.njk:90` has no `aria-label`. The footer also contains links. When multiple navigable landmark regions exist, screen reader users benefit from being able to distinguish them.

- **Location:** `src/site/_includes/layouts/base.njk:90`

**Fix:** Add `aria-label="Primary"` to the header `<nav>` and `aria-label="Footer"` (or similar) to the footer.

---

### A3 — Thumbnail image alt text duplicates adjacent heading
**Severity: Low | WCAG SC 1.1.1 / best practice**

In `post-summary.njk`, the thumbnail image uses `alt="{{ post.data.title }}"` (line 10). The image is wrapped in an `<a>` that leads to the same URL as the `<h3>` heading link. Screen readers announce the title twice in succession.

- **Location:** `src/site/_includes/partials/post-summary.njk:9–12`

**Fix:** Use `alt=""` on the thumbnail (marks it decorative) since the heading link already provides the text equivalent.

---

### A4 — 404 page search input hidden from assistive technology
**Severity: Low | WCAG SC 1.3.1**

The search form on the 404 page hides the input with `style="display:none"` (line 19). A label is present but references an inaccessible control. JavaScript pre-fills the value before submission, so sighted users experience the intended flow. Without JS, the submit button sends an empty query.

- **Location:** `src/site/404.njk:17–27`

**Fix:** Consider using `visibility: hidden; position: absolute;` instead of `display: none` so the input remains in the accessibility tree, or expose a visible pre-filled input that users can adjust.

---

## Conformant — Notable positives

| Area | Finding |
|------|---------|
| Skip navigation | Implemented with proper focus-reveal pattern (off-screen by default, slides in on `:focus-visible`) |
| Landmarks | `role="banner"`, `role="main"` (with `id` matching skip link), `role="contentinfo"` all present |
| Language | `<html lang="en">` declared |
| Animated background | `aria-hidden="true"` on ambience overlay; motion animation gated behind `prefers-reduced-motion: no-preference`; `prefers-contrast: high` hides it entirely |
| Form labels | All search inputs have associated `<label>` elements (sr-only where label is visually redundant with placeholder) |
| Dates | `<time datetime="…">` used consistently |
| Pagination | `<nav aria-label>` and `aria-current="page"` on active page |
| Feedback toast | `aria-live="polite"` announces "Thanks for the feedback!" to screen readers |
| Search page | `role="log"` with `aria-live="polite"` on semantic search conversation; noscript fallback to DuckDuckGo |
| Keyboard navigation | All interactive elements reachable by Tab; no keyboard traps observed |
| CSS-off mode | Graceful degradation to browser defaults when CSS toggle is off |

---

## Priority fix order

1. **F1** — Orange tab contrast (critical, visually prominent element)
2. **F2** — Date/metadata text contrast (affects every post listing)
3. **F3** — Figure credit contrast (affects every post with images)
4. **A1** — Button focus outline (affects all CTA buttons)
5. **A3** — Duplicate alt text (minor, easy fix)
6. **A2** — Nav aria-label (minor, one-line fix)
7. **A4** — 404 hidden input (edge case, low user impact)
