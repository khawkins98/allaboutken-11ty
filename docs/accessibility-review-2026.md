# Accessibility Review — allaboutken.com

**Date:** 2026-03-22
**Standard:** WCAG 2.1 AA
**Scope:** Templates, partials, SCSS, scripts — static site source code review

---

## Summary

| Severity | Count |
|----------|-------|
| High     | 5     |
| Medium   | 5     |
| Low      | 5     |

The site has solid foundational accessibility: a skip link, proper landmark roles, `aria-hidden` on decorative elements, `aria-live` on dynamic regions, and `prefers-reduced-motion` on scroll behaviour and heading animations. The issues below are specific and fixable.

---

## High Severity

### H1 — `kh-summary__tab` color contrast fails WCAG 1.4.3

**File:** `src/components/vf-componenet-rollup/index.scss:546`

White (`#fff`) text on orange (`#f49e17`) background yields approximately **2.56:1** contrast ratio. WCAG AA requires 4.5:1 for small text. The tab text is 11px, uppercase — among the smallest text on the site.

**WCAG criterion:** 1.4.3 Contrast (Minimum)

**Fix:** Darken the orange background (e.g. `#c47a00`) to achieve 4.5:1 against white, or switch to dark text on the current orange.

---

### H2 — Button `outline: 0` removes focus indicator

**File:** `src/components/vf-componenet-rollup/index.scss:345`

```scss
.kh-button {
  outline: 0;   // ← removes native focus ring
```

The focus state uses `box-shadow` and `transform` (translate 4px, 4px), which are not rendered in Windows High Contrast Mode. Keyboard users in forced-colors environments get no visible focus indication on any `.kh-button` element.

**WCAG criterion:** 2.4.7 Focus Visible

**Fix:** Replace `outline: 0` with `outline: transparent` and add a `forced-colors`-compatible focus style:
```scss
.kh-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

---

### H3 — Heading hierarchy skips level 3 in CV

**File:** `src/site/cv.njk:25-27` (via `position` macro)

The `position` macro outputs `<h2>` immediately followed by `<h4>`, skipping `<h3>`. Used for every job entry (7+ instances). Screen reader users who navigate by heading level will not find any `<h3>` elements and the hierarchy will be confusing.

**WCAG criterion:** 1.3.1 Info and Relationships

**Fix:** Change `<h4 class="kh-text-heading--4 ...">` to `<h3>` in the macro, and add a `.kh-text-heading--3` style or alias.

---

### H4 — Duplicate `<h1>` elements on CV page

**File:** `src/site/cv.njk:46-47`

```html
<h1 class="... kh-u-show-for-mobile-only">Ken <br/> Hawkins.</span></h1>
<h1 class="... kh-u-show-for-medium-up">Ken Hawkins.</span></h1>
```

Two `<h1>` elements are rendered to have one hidden at each breakpoint. However, both are present in the DOM at all times; screen readers see both. Also note the stray `</span>` closing tag on both elements (no matching open `<span>`), which is invalid HTML that may cause parser errors.

**WCAG criterion:** 1.3.1 Info and Relationships

**Fix:** Use a single `<h1>` with responsive content via CSS, or use a `<br>` conditionally via JavaScript. Remove the stray `</span>`.

---

### H5 — Search results have no live region announcement

**File:** `src/site/search.njk:47`

The keyword search results are injected into `<div id="search-results"></div>` via `resultsEl.innerHTML = ...`. This element has no `aria-live` attribute. Screen reader users who type in the search box receive no announcement when results appear or change.

(The semantic search conversation panel at line 57 correctly uses `aria-live="polite"`. The keyword results panel is missing the same treatment.)

**WCAG criterion:** 4.1.3 Status Messages

**Fix:**
```html
<div id="search-results" aria-live="polite" aria-atomic="false"></div>
```

---

## Medium Severity

### M1 — Date/author text contrast is marginally below AA

**File:** `src/components/vf-componenet-rollup/index.scss:501, 486`

`.kh-summary__date` and `.kh-summary__author` use `color: #707372` on the page background `#fbf6ef`. Calculated contrast ratio: approximately **4.35:1** — below the 4.5:1 AA minimum for small text (both are 13px). `.kh-figure__credit` (`color: #737373`) has nearly identical contrast.

**WCAG criterion:** 1.4.3 Contrast (Minimum)

**Fix:** Darken to `#6a6a6a` or similar to clear the 4.5:1 threshold.

---

### M2 — Ambience SVG animations ignore `prefers-reduced-motion`

**File:** `src/site/_includes/partials/ambience.njk:11-22`

The SVG turbulence and displacement animations use `repeatCount="indefinite"` with no reduced-motion equivalent. The CSS file has `@media (prefers-reduced-motion: reduce)` guards for scroll behaviour and heading animations, but not for the ambience layer.

**WCAG criterion:** 2.3.3 Animation from Interactions (AAA); best-practice for vestibular health.

**Fix:** Add to the CSS for the ambience layer:
```scss
@media (prefers-reduced-motion: reduce) {
  #kh-dappled-light {
    display: none;
  }
}
```
Or stop the SVG `<animate>` elements via JS when the media query matches.

---

### M3 — Post thumbnail `alt` text duplicates adjacent title

**File:** `src/site/_includes/partials/post-summary.njk:10`

```html
<img ... alt="{{ post.data.title }}">
```

The thumbnail image's alt text repeats the post title, which is immediately rendered in the adjacent `<h3>`. Screen readers announce the link text twice. When the image itself conveys no additional information beyond the title, it should be marked as decorative.

**WCAG criterion:** 1.1.1 Non-text Content

**Fix:** `alt=""` on the thumbnail image (it's wrapped in a link whose text context is the post title).

---

### M4 — Positive `tabindex` breaks tab order in CV

**File:** `src/site/cv.njk:330`

```html
<span ... tabindex="1" title="If you ever want to talk ...">pre-flight</span>
```

`tabindex="1"` places this element first in the tab order across the entire page (before the skip link, logo, and navigation). Any positive tabindex value other than 0 disrupts natural tab order.

**WCAG criterion:** 2.4.3 Focus Order

**Fix:** Change to `tabindex="0"` to make the element focusable without disrupting order.

---

### M5 — `<div>` elements inside `<h1>` (invalid HTML)

**File:** `src/site/index.njk:15-18`

```html
<h1 class="kh-font-headline kh-text-heading--1">
  <div class="kh-font-headline--display">{{title}}.</div>
  <div class="kh-font-headline--display">...</div>
</h1>
```

Block-level `<div>` elements inside `<h1>` is invalid HTML5. Browsers handle it inconsistently (most promote the div out of the heading), which can break heading parsing in some assistive technologies.

**WCAG criterion:** 4.1.1 Parsing

**Fix:** Replace `<div class="kh-font-headline--display">` with `<span class="kh-font-headline--display">` (inline element, valid inside headings).

---

## Low Severity

### L1 — `kh-u-sr-only` implementation is missing `margin: -1px`

**File:** `src/components/vf-componenet-rollup/index.scss:833`

The screen-reader-only class omits `margin: -1px` from the standard pattern. This can cause a 1px ghost layout shift in some browser/zoom combinations. The `clip-path: inset(50%)` makes this unlikely to be visible, but it's non-standard and may create sub-pixel issues.

**Severity:** Low (cosmetic/edge case)

**Fix:** Add `margin: -1px` to the `.kh-u-sr-only` declaration.

---

### L2 — `javascript:` URL on CV "Download PDF" link

**File:** `src/site/cv.njk:74`

```html
<a href="javascript:window.print()" ...>Download PDF</a>
```

If JavaScript is unavailable or blocked, clicking the link does nothing. Screen readers may announce this as a link to a "javascript:" resource. A `<button>` element would be more semantically appropriate for a print action.

**WCAG criterion:** 2.1.1 Keyboard (if JS unavailable — edge case)

**Fix:** Replace with `<button type="button" onclick="window.print()">Download PDF</button>` and style via `.kh-button`.

---

### L3 — CSS toggle label is cryptic

**File:** `src/site/_includes/footer.njk:14`

```html
<label title="Toggle site CSS on or off">
  <input type="checkbox" id="kh-css-toggle" ... checked> CSS
</label>
```

The label text "CSS" and the `title` tooltip are not exposed to screen readers in the same way. A visually-hidden label like "Toggle site CSS styling on or off" alongside the short "CSS" text would be more descriptive.

**Severity:** Low (developer feature, unlikely to be encountered by typical users)

---

### L4 — Redundant ARIA landmark roles on semantic elements

**File:** `src/site/_includes/layouts/base.njk:88, 110`

```html
<header ... role="banner">
<main role="main" ...>
<footer ... role="contentinfo">
```

These elements already have implicit ARIA roles matching their HTML semantics. The explicit `role` attributes are harmless but redundant and may confuse developers reading the code into thinking they're required.

**Severity:** Low (informational)

---

### L5 — Deprecated `name` attribute on anchor in CV

**File:** `src/site/cv.njk:146`

```html
<a id="cv" name="cv"></a>
```

The `name` attribute on `<a>` elements is deprecated in HTML5. Only `id` is needed for fragment navigation.

**Severity:** Low (deprecated but functional)

**Fix:** `<span id="cv"></span>` or simply ensure the `id` is on a nearby meaningful element.

---

## What's Working Well

- **Skip link** — present, functional, reveals on focus (`kh-skip-link`)
- **`aria-hidden="true"`** on decorative ambience layer
- **`prefers-reduced-motion`** respected for scroll behaviour and heading animations
- **`aria-live="polite"`** on semantic search conversation panel
- **`aria-current="page"`** on active pagination item
- **`aria-label`** on pagination nav
- **Screen-reader-only labels** on search inputs (via `kh-u-sr-only`)
- **`lang="en"`** on `<html>` element
- **Structured `<nav>`, `<main>`, `<header>`, `<footer>`** landmarks
- **`<time datetime="...">` elements** on post dates
- **Image `height: auto`** prevents layout shift

---

## Priority Order for Fixes

1. H5 — Search live region (one-line HTML change, immediate user impact)
2. H1 — Tab label contrast (one CSS color change)
3. H2 — Button focus in high-contrast mode (CSS addition)
4. H3 — Heading hierarchy in CV (macro change)
5. H4 — Duplicate H1 + invalid HTML in CV
6. M4 — Positive tabindex (one attribute change)
7. M3 — Thumbnail alt text (one template change)
8. M1 — Date text contrast (one color value change)
9. M2 — Ambience reduced-motion (one CSS media query)
10. M5 — Div inside H1 (template change, low risk)
