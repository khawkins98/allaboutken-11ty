# Accessibility Review: allaboutken.com
**Scope:** WCAG 2.1 AA compliance, keyboard navigation, screen reader compatibility, color contrast, ARIA attributes
**Date:** 2026-03-22
**Reviewer:** builder-review-accessibility-jsrj
**Files audited:** base.njk, post.njk, digesting.njk, post-summary.njk, pager.njk, ambience.njk, footer.njk, cv.njk, index.njk, search.njk, eleventy.js, index.scss

---

## Summary

The site has a strong accessibility foundation: skip link, `lang="en"`, ARIA landmark roles, decorative element suppression via `aria-hidden`, and `prefers-reduced-motion` support for CSS animations. The primary gaps are color contrast failures on small secondary text and the orange rotated tab label, a `javascript:` URL masquerading as a link on the CV page, three `<h1>` elements exposed simultaneously in the CV accessibility tree, and SVG `<animate>` elements that run regardless of motion preferences. Secondary issues include missing live region feedback for keyword search results, a suppressed focus outline that breaks Windows High Contrast Mode, and unlabeled navigation landmarks.

---

## Critical — WCAG A/AA Failures

### C1: White text on orange fails contrast (WCAG 1.4.3)
**Location:** `src/components/vf-componenet-rollup/index.scss:546–563` — `.kh-summary__tab`
```scss
background: var(--kh-color--orange);  /* #f49e17 */
color: #fff;
font-size: 11px;
font-weight: 700;
```
`#fff` on `#f49e17` yields approximately 2.1:1. WCAG requires 4.5:1 for text smaller than 18px (or 14px bold). At 11px bold, this is a hard failure.
**Fix:** Darken the orange or switch to dark text (`#222`). `#222` on `#f49e17` yields ~7.5:1.

### C2: Small secondary text fails contrast (WCAG 1.4.3)
**Locations:**
- `index.scss:486–502` — `.kh-summary__author`, `.kh-summary__date`: color `#707372` on page background `#fbf6ef` → ~3.96:1 (required: 4.5:1 at 13px/400 weight)
- `index.scss:419–424` — `.kh-figure__credit`: color `#737373` on `#fbf6ef` at `0.75rem` (12px) → ~3.92:1 (required: 4.5:1)
- `index.scss:869` — footer secondary text at `#707372` on `#fbf6ef`

All fall below the 18px/14px-bold threshold so 4.5:1 applies. Small adjustments will fix all three: `#5e5e5e` or darker passes 4.5:1 on this cream background.

### C3: `javascript:` URL on CV page (WCAG 2.1.1, 4.1.2)
**Location:** `src/site/cv.njk:74`
```html
<a href="javascript:window.print()" class="kh-button kh-button--secondary">Download PDF</a>
```
An `<a>` element semantically navigates; `javascript:` URLs perform actions. Screen readers announce this as a link, not a button. Some assistive technologies or content security policies block `javascript:` hrefs entirely.
**Fix:**
```html
<button type="button" onclick="window.print()" class="kh-button kh-button--secondary">Download PDF</button>
```

### C4: Multiple `<h1>` elements in CV (WCAG 1.3.1)
**Location:** `src/site/cv.njk:37, 46, 47`
```html
<!-- Line 37: print-only -->
<div class="kh-u-show-for-print-only">
  <h1>{{title}}</h1>
</div>

<!-- Line 46: mobile screen only -->
<h1 class="kh-u-show-for-mobile-only">Ken <br/> Hawkins.</h1>

<!-- Line 47: medium+ screen only -->
<h1 class="kh-u-show-for-medium-up">Ken Hawkins.</h1>
```
CSS-only visibility classes hide elements visually but do not remove them from the accessibility tree. Screen readers receive three `<h1>` announcements. The unclosed `<span>` tag at the end of line 46 (`</span>` with no opening tag) is also an HTML validity issue.
**Fix:** Use a single `<h1>` and adapt it visually with CSS (e.g., `font-size` at breakpoints), not by duplicating elements:
```html
<h1 class="kh-font-headline kh-font-headline--display kh-u-margin__bottom--200">Ken Hawkins.</h1>
```

---

## Serious — High Priority Issues

### S1: Button `outline: 0` fails Windows High Contrast Mode (WCAG 2.4.7)
**Location:** `src/components/vf-componenet-rollup/index.scss:345`
```scss
.kh-button {
  outline: 0;
}
```
The `:focus` / `:hover` state uses `box-shadow` and `transform` as visual indicators, which satisfies most browsers. However, Windows High Contrast Mode suppresses `box-shadow`, making focused buttons visually indistinguishable from unfocused ones.
**Fix:** Replace `outline: 0` with `outline: 2px solid transparent` (invisible in normal mode, visible in HCM) and add an explicit `:focus-visible` outline:
```scss
.kh-button {
  outline: 2px solid transparent;
}
.kh-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

### S2: Keyword search results container has no live region (WCAG 4.1.3)
**Location:** `src/site/search.njk:47`
```html
<div id="search-results"></div>
```
When Pagefind injects results into `#search-results`, screen readers receive no announcement that results have loaded or that the query returned zero matches. (The semantic search panel correctly uses `role="log" aria-live="polite"` at line 57.)
**Fix:** Add `role="status"` (implicitly `aria-live="polite"`) to `#search-results`:
```html
<div id="search-results" role="status"></div>
```

### S3: SVG `<animate>` elements run regardless of motion preference (WCAG 2.3.3)
**Location:** `src/site/_includes/partials/ambience.njk:11–22`
```html
<animate attributeName="baseFrequency" dur="16s" ... repeatCount="indefinite" />
<animate attributeName="scale" dur="20s" ... repeatCount="indefinite" />
```
The CSS for `.kh-ambience-blinds` correctly uses `@media (prefers-reduced-motion: no-preference)`, but the SVG `<animate>` tags inside the filter are not gated. The scroll-driven animation on `#kh-dappled-light` (CSS `animation-timeline: scroll(root)`) is similarly not inside a `prefers-reduced-motion: no-preference` block.
**Fix:** Add a CSS rule to disable the SVG animations and scroll-driven animation:
```css
@media (prefers-reduced-motion: reduce) {
  #kh-dappled-light { animation: none; }
  #kh-ambience-leaves-animation animate { display: none; }
}
```
Or conditionally render the `<animate>` elements only when JS detects `prefers-reduced-motion: no-preference`.

### S4: Post thumbnail alt text duplicates adjacent heading (WCAG 1.1.1)
**Location:** `src/site/_includes/partials/post-summary.njk:10`
```njk
<img ... alt="{{ post.data.title }}">
```
The thumbnail image uses the post title as alt text, but the `<h3>` immediately following (line 13) contains the same text linked to the same destination. Screen readers announce "image: [title]" then "heading: [title]" — redundant and disorienting.
**Fix:** Mark post thumbnails as decorative since the heading provides the text equivalent:
```njk
<img ... alt="">
```

---

## Moderate — Usability and Best Practice

### M1: Header `<nav>` missing `aria-label` (WCAG 2.4.1)
**Location:** `src/site/_includes/layouts/base.njk:90`
```html
<nav class="kh-cluster kh-navigation kh-u-do-not-print kh-u-show-for-medium">
```
Paginated pages include both this header nav and `partials/pager.njk`. The pager correctly has `aria-label="{{ pagerLabel }}"` but the header nav is unlabeled. Screen reader users navigating landmarks see two anonymous `<nav>` elements.
**Fix:** Add `aria-label="Main navigation"` to the header nav element.

### M2: Pagination link text is bare numbers (WCAG 2.4.4)
**Location:** `src/site/_includes/partials/pager.njk:12`
```njk
<a href="{{ href }}" ...>{{ loop.index }}</a>
```
Link text "1", "2", "3" is not descriptive out of context. When a screen reader lists all links on the page, users cannot distinguish page links from content links.
**Fix:** Add `aria-label="Page {{ loop.index }}"` to each page number link.

### M3: Breadcrumbs not marked as navigation landmarks (WCAG 2.4.8 best practice)
**Locations:** `src/site/_includes/layouts/post.njk:10–16`, `src/site/_includes/layouts/digesting.njk:10`
```html
<p class="kh-breadcrumb"><a href="/blog">← Blog</a></p>
```
A `<p>` element is not a navigation landmark. Screen reader users cannot identify this as a breadcrumb trail or skip to it by landmark.
**Fix:**
```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/blog">Blog</a></li>
    <li aria-current="page">{{ title }}</li>
  </ol>
</nav>
```

### M4: Button text color borderline contrast fail (WCAG 1.4.3)
**Location:** `src/components/vf-componenet-rollup/index.scss:28, 339`
```scss
--kh-color--blue: #3b6fb6;
/* button background: #fafafa */
color: var(--kh-color--blue);
```
`#3b6fb6` on `#fafafa` is approximately 4.4:1 — just below the 4.5:1 minimum for normal text. Automated tools will flag this. The margin is small but the failure is real.
**Fix:** Darken slightly: `#335fa5` yields ~4.6:1; `#193f90` (already defined as `--kh-color--blue--dark`) yields ~8.5:1.

### M5: Heading permalink `aria-label` is not unique across headings (WCAG 2.4.6)
**Location:** `eleventy.js:258`
```js
['aria-label', 'Permalink to this heading']
```
Every heading anchor uses the same label. In screen reader link lists, users see multiple identical "Permalink to this heading" entries with no way to distinguish them.
**Fix:** Include the heading text in the label:
```js
['aria-label', `Permalink to: ${headingText}`]
```

---

## Minor — Low Impact

### m1: `<div>` elements inside `<h1>` is invalid HTML (index.njk)
**Location:** `src/site/index.njk:14–19`
```html
<h1 class="kh-font-headline kh-text-heading--1">
  <div class="kh-font-headline--display">{{title}}.</div>
  <div class="kh-font-headline--display">...</div>
</h1>
```
Block-level `<div>` elements inside `<h1>` is invalid HTML. Browsers often auto-correct by closing the heading before the div, breaking the heading structure. Use `<span>` with `display: block` instead.

### m2: `tabindex="1"` on tooltip span in CV breaks tab order (cv.njk)
**Location:** `src/site/cv.njk:330`
```html
<span ... tabindex="1" title="...">pre-flight</span>
```
Any `tabindex` value greater than 0 moves the element to the front of the tab order, ahead of all natural-order elements. This is almost always wrong. Should be `tabindex="0"` if keyboard focus is desired.

### m3: CSS toggle label text is cryptic; `title` not reliably announced (footer.njk)
**Location:** `src/site/_includes/footer.njk:14`
```html
<label title="Toggle site CSS on or off">
  <input type="checkbox" id="kh-css-toggle" name="css-toggle" checked> CSS
</label>
```
The visible label "CSS" gives no indication of purpose. The `title` attribute description is surfaced by some AT only on hover and is not reliably announced as the accessible name. A visually hidden description would be more reliable:
```html
<label>
  <input type="checkbox" id="kh-css-toggle" name="css-toggle" checked>
  <span aria-hidden="true">CSS</span>
  <span class="kh-u-sr-only">Toggle site CSS styling on or off</span>
</label>
```

### m4: `image_meta.altext` typo may silently discard alt text (post.njk)
**Location:** `src/site/_includes/layouts/post.njk:32`
```njk
alt="{{ image_meta.altext or image_meta.alt or '' }}"
```
`altext` is not a standard Eleventy/frontmatter field. If no author uses `altext` in frontmatter, this is harmless — the fallback `image_meta.alt` applies. But if any post frontmatter uses `altext` (mirroring this typo), alt text would fail silently. Simplify to `image_meta.alt or ''` and document that `alt` is the correct key.

### m5: Empty layout spacer elements exposed to accessibility tree
**Locations:** `src/site/cv.njk:43, 55, 157, etc.`, `src/site/index.njk:12, 47, 66`
```html
<div></div>
<span></span>
```
Grid layout spacers are exposed to the accessibility tree with no meaningful content. Adding `aria-hidden="true"` removes them from AT navigation without affecting layout.

---

## What's Working Well

- Skip link (`base.njk:85`) correctly hides off-screen and becomes visible on focus with a proper `:focus-visible` style at `index.scss:856–860`.
- `aria-hidden="true"` on `#kh-dappled-light` decorative overlay (`ambience.njk:5`).
- `lang="en"` on `<html>` (`base.njk:2`).
- `role="banner"`, `role="main"`, `role="contentinfo"` on structural elements.
- Pagination has `aria-current="page"` on the current page link (`pager.njk:12`).
- Search fieldset uses `<fieldset>` with `<legend class="kh-u-sr-only">Search mode</legend>` for radio group (`search.njk:13–14`).
- Semantic search conversation has `role="log"` and `aria-live="polite" aria-relevant="additions"` (`search.njk:57`).
- All visible form inputs have associated `<label>` elements.
- `prefers-contrast: high` hides the decorative ambience layer (kh-ambience.scss).
- Blinds sway CSS animation is gated behind `@media (prefers-reduced-motion: no-preference)`.
- `aria-live="polite"` on feedback toast (`post.njk:107`).
- General focus style `outline: 1px dashed rgb(0 0 0 / 60%)` applied to `.kh-content a:focus` and `[class*='kh-']:focus` (`index.scss:112–115`).

---

## Priority Fix Order

| # | Finding | WCAG | Effort |
|---|---------|------|--------|
| 1 | C1: White on orange contrast (`kh-summary__tab`) | 1.4.3 AA | Low |
| 2 | C2: Small grey text contrast (`date`, `author`, `credit`) | 1.4.3 AA | Low |
| 3 | C3: `javascript:` link on CV → replace with `<button>` | 2.1.1, 4.1.2 A | Low |
| 4 | S2: Search results no live region | 4.1.3 AA | Low |
| 5 | M1: Header nav no `aria-label` | 2.4.1 A | Low |
| 6 | S4: Post thumbnail alt text duplicates heading | 1.1.1 A | Low |
| 7 | C4: Three `<h1>` elements in CV | 1.3.1 A | Medium |
| 8 | S1: Button `outline: 0` — add HCM-compatible outline | 2.4.7 AA | Low |
| 9 | S3: SVG animation + scroll animation not motion-gated | 2.3.3 AA | Medium |
| 10 | M2: Pagination links need `aria-label="Page N"` | 2.4.4 AA | Low |
| 11 | M5: Heading permalink labels not unique | 2.4.6 AA | Low |
| 12 | m2: Fix `tabindex="1"` → `tabindex="0"` in CV tooltip | Best practice | Low |
