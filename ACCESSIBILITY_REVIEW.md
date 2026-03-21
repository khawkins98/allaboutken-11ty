# Accessibility Review: allaboutken.com
**Scope:** WCAG 2.1 AA compliance, keyboard navigation, screen reader compatibility, color contrast, ARIA attributes
**Date:** 2026-03-21
**Reviewer:** builder-review-accessibility-mnfx

---

## Summary

The site has solid accessibility foundations: skip link, `lang="en"`, semantic HTML5 landmarks, `aria-hidden` on decorative SVG, and `prefers-reduced-motion` support on most animations. The main gaps are color contrast failures on small secondary text and the orange tab label, a `javascript:` URL misuse on the CV page, and missing live region feedback for dynamic search results.

---

## Critical — WCAG A/AA Failures

### C1: White text on orange fails contrast (WCAG 1.4.3)
**Location:** `src/components/vf-componenet-rollup/index.scss` — `.kh-summary__tab`
**Color pair:** `#fff` on `var(--kh-color--orange)` (`#f49e17`)
**Contrast ratio:** ~2.1:1 (required: 4.5:1 for text at 11px/bold)
The "Digesting" rotated tab label visible on the blog index is unreadable for low-vision users. This also affects visited-state variants.

### C2: Small secondary text fails contrast (WCAG 1.4.3)
**Locations:**
- `src/components/vf-componenet-rollup/index.scss` — `.kh-summary__date`, `.kh-summary__author` (13px, weight 400, `#707372` on `#fbf6ef`): ~3.96:1 (required: 4.5:1)
- `.kh-figure__credit` (12px, weight 400, `#737373` on `#fbf6ef`): ~3.92:1 (required: 4.5:1)

Both sizes fall below the 18px/14px-bold threshold, so 4.5:1 applies. The margins are small but real failures under automated tooling.

### C3: `javascript:` URL on CV page link (WCAG 2.1.1, 4.1.2)
**Location:** `src/site/cv.njk:74`
```html
<a href="javascript:window.print()" class="kh-button kh-button--secondary">Download PDF</a>
```
`javascript:` URLs on `<a>` elements break the semantic contract (a link navigates; an action uses `<button>`). Screen readers may not announce it as a button. Some browsers/AT block `javascript:` hrefs.
**Fix:** Replace with `<button type="button" onclick="window.print()">`.

### C4: Multiple `<h1>` elements in CV accessible tree (WCAG 1.3.1)
**Location:** `src/site/cv.njk:37, 46, 47`
Three `<h1>` elements exist in the HTML. Lines 46 and 47 use breakpoint-only visibility classes (`kh-u-show-for-mobile-only` / `kh-u-show-for-medium-up`) — CSS-only hiding; both are exposed to screen readers. Combined with the print-only h1 on line 37, users get three level-1 headings announced.
**Fix:** Use a single `<h1>` and visually adapt it at breakpoints using CSS font-size, not duplicate elements.

---

## Serious — High Priority Issues

### S1: Button focus indicator uses `outline: 0` (WCAG 2.4.7)
**Location:** `src/components/vf-componenet-rollup/index.scss` — `.kh-button`
```scss
outline: 0;
```
The visual focus change (box-shadow + translate) satisfies most browsers but fails in Windows High Contrast Mode, where box-shadow is suppressed and the element becomes indistinguishable from unfocused state.
**Fix:** Replace `outline: 0` with `outline: 2px solid transparent` and add an explicit `outline` in `:focus-visible`.

### S2: Search results container has no live region (WCAG 4.1.3)
**Location:** `src/site/search.njk:47`
```html
<div id="search-results"></div>
```
When Pagefind returns results, the count and list are injected into this div. There is no `aria-live` or `role="status"`, so screen reader users receive no announcement that results have loaded or that the search returned zero matches.
**Fix:** Add `role="status"` (or `aria-live="polite"`) to `#search-results`.

### S3: SVG leaf animation ignores `prefers-reduced-motion` (WCAG 2.3.3)
**Location:** `src/site/_includes/partials/ambience.njk:13-18`
The `<animate>` elements inside the inline SVG (`baseFrequency` and `scale` animations) always run. The CSS for `.kh-ambience-blinds` correctly uses `@media (prefers-reduced-motion: no-preference)`, but the SVG `<animate>` tags are not gated.
**Separate issue:** The scroll-driven animation on `#kh-dappled-light` (`animation-timeline: scroll(root)`) is also not inside a `prefers-reduced-motion: no-preference` block.
**Fix:** Disable SVG `<animate>` and the scroll-driven animation with:
```css
@media (prefers-reduced-motion: reduce) {
  #kh-dappled-light { animation: none; }
}
```
And add `animateMotion` / `animate` pausing via `pauseAnimations()` in JS, or conditionally render the `<animate>` tags.

### S4: Post summary image alt text duplicates heading (WCAG 1.1.1)
**Location:** `src/site/_includes/partials/post-summary.njk:10`
```njk
alt="{{ post.data.title }}"
```
The thumbnail image uses the post title as alt text, but the post title is repeated in the `<h3>` directly below. Screen readers announce "image: [title], heading: [title]" — redundant and confusing.
**Fix:** Mark post thumbnails as decorative: `alt=""`. The heading provides the text equivalent.

---

## Moderate — Usability and Best Practice

### M1: Header `<nav>` lacks `aria-label` (WCAG 2.4.1)
**Location:** `src/site/_includes/layouts/base.njk:90`
```html
<nav class="kh-cluster kh-navigation ...">
```
Pages that include a pager (`partials/pager.njk`) have two `<nav>` elements. The pager correctly has `aria-label="{{ pagerLabel }}"` but the header nav has none. Screen readers present a list of nameless landmarks, making it hard to distinguish them.
**Fix:** Add `aria-label="Main navigation"` to the header `<nav>`.

### M2: Pagination link text is bare numbers (WCAG 2.4.4)
**Location:** `src/site/_includes/partials/pager.njk:12`
```njk
<a href="...">{{ loop.index }}</a>
```
Link text "1", "2", "3" is not descriptive out of context. The surrounding `<nav aria-label="Pagination">` provides partial context, but an `aria-label="Page 1"` on each link would be unambiguous when links are listed in screen reader navigation.
**Fix:** Add `aria-label="Page {{ loop.index }}"` to each pagination link.

### M3: Breadcrumb not marked up as a landmark (WCAG 2.4.8 best practice)
**Locations:** `src/site/_includes/layouts/post.njk:10-16`, `src/site/_includes/layouts/digesting.njk:10`
The breadcrumb uses a `<p class="kh-breadcrumb">` rather than the ARIA breadcrumb pattern. Screen reader users cannot identify it as a navigation trail.
**Fix:**
```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/blog">Blog</a></li>
    <li aria-current="page">{{ title }}</li>
  </ol>
</nav>
```

### M4: Button text contrast borderline (WCAG 1.4.3)
**Location:** `src/components/vf-componenet-rollup/index.scss` — `.kh-button`
Text color `#3b6fb6` on background `#fafafa` yields approximately 4.4:1. The minimum for normal text (16px, 700 weight at 12pt — below the 14pt bold threshold) is 4.5:1. This is a very marginal fail that may pass with some rounding, but automated tools will flag it.
**Fix:** Darken the text color slightly (e.g., `#335fa5` or use `#193f90` which has sufficient contrast).

### M5: Heading permalink `aria-label` is not unique across headings (WCAG 2.4.6)
**Location:** `eleventy.js:258`
```js
['aria-label', 'Permalink to this heading']
```
Every heading anchor uses the same label. When a screen reader lists links on the page, users see multiple identical "Permalink to this heading" entries with no way to distinguish them.
**Fix:** Append the heading text: `'Permalink to: ' + headingText`.

---

## Minor — Low Impact

### m1: `<div></div>` spacer elements could use `aria-hidden`
**Locations:** `src/site/cv.njk:43, 55`, `src/site/index.njk:47`, etc.
Empty `<div>` elements used for CSS grid layout are exposed to the accessibility tree. They have no semantic content and should have `aria-hidden="true"` to avoid confusing AT users navigating by element.

### m2: CSS toggle label description only in `title` attribute
**Location:** `src/site/_includes/footer.njk:14`
```html
<label title="Toggle site CSS on or off">
  <input type="checkbox" id="kh-css-toggle" ...> CSS
</label>
```
The `title` attribute is only surfaced by some AT on hover and is not reliably announced. The visible label "CSS" is cryptic. Adding `aria-describedby` or a visually hidden span with the description would make the control's purpose clearer.

### m3: `<section>` elements without accessible headings
**Locations:** `src/site/index.njk:46` (first `<section>` in grid-stylized), others
The ARIA spec notes sections should have an accessible name. Several `<section>` elements are structurally unnamed. Changing unnamed sections to `<div>` where there is no associated heading removes the false semantic expectation.

### m4: `image_meta.altext` typo in post layout
**Location:** `src/site/_includes/layouts/post.njk:32`
```njk
alt="{{ image_meta.altext or image_meta.alt or '' }}"
```
`altext` is not a standard field name; the correct field is `image_meta.alt` (the fallback). If any frontmatter uses `altext` (mirroring this typo), alt text would not work as expected. Standardize on `alt` only.

---

## What's Working Well

- Skip link (`base.njk:85`) correctly hides off-screen and becomes visible on focus.
- `aria-hidden="true"` on `#kh-dappled-light` decorative overlay (`ambience.njk:5`).
- `lang="en"` on `<html>` (`base.njk:2`).
- `role="banner"`, `role="main"`, `role="contentinfo"` on structural elements (`base.njk:88, 110`; `footer.njk:1`).
- Pagination has `aria-current="page"` on the current page link.
- Search fieldset uses `<legend>` for mode selection (`search.njk:14`).
- All form inputs have associated `<label>` elements (including `kh-u-sr-only` variants).
- `prefers-contrast: high` hides the decorative ambience layer (`kh-ambience.scss:184`).
- Blinds sway animation is gated behind `prefers-reduced-motion: no-preference`.
- `aria-live="polite"` on feedback toast (`post.njk:107`).

---

## Priority Fix Order

| # | Finding | WCAG | Effort |
|---|---------|------|--------|
| 1 | C1: White on orange contrast | 1.4.3 AA | Low |
| 2 | C2: Small grey text contrast | 1.4.3 AA | Low |
| 3 | C3: `javascript:` link | 2.1.1, 4.1.2 A | Low |
| 4 | S2: Search results no live region | 4.1.3 AA | Low |
| 5 | M1: Header nav no aria-label | 2.4.1 A | Low |
| 6 | S4: Post thumbnail alt text duplicate | 1.1.1 A | Low |
| 7 | C4: Multiple h1 on CV | 1.3.1 A | Medium |
| 8 | S1: Button outline:0 | 2.4.7 AA | Medium |
| 9 | S3: SVG animation + scroll animation | 2.3.3 AA | Medium |
| 10 | M2: Pagination aria-label | 2.4.4 AA | Low |
