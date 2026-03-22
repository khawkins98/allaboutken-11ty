# Accessibility Review — AllAboutKen.com

**Date:** 2026-03-22
**Reviewer:** builder-review-accessibility-mwfy
**Standard:** WCAG 2.1 Level AA
**Scope:** Source templates, CSS, and JavaScript; static analysis (no browser runtime testing)

---

## Summary

The site has a solid accessibility foundation: skip link, landmark roles, SR-only utilities, reduced-motion support, `aria-live` on dynamic regions, and comprehensive alt text. Most issues are isolated and fixable. No systemic failures found.

**Issue count by severity:**
- 🔴 Critical (WCAG Level A failures): 3
- 🟠 Serious (WCAG Level AA failures): 2
- 🟡 Moderate (best-practice gaps): 5
- ✅ Positives noted: 12

---

## Critical Issues (WCAG Level A)

### 1. Positive `tabindex` disrupts tab order
**File:** `src/site/cv.njk:330`
**WCAG:** 2.4.3 Focus Order (Level A)

```html
<span data-tooltip aria-haspopup="true" class="has-tip" data-disable-hover="false"
  tabindex="1" title="If you ever want to talk about the properties of ink on paper...">
  pre-flight
</span>
```

`tabindex="1"` places this tooltip trigger first in the tab order regardless of its DOM position. Positive `tabindex` values are prohibited by WCAG 2.4.3 because they break predictable keyboard navigation. Use `tabindex="0"` to make the element focusable without reordering.

**Fix:** Change `tabindex="1"` → `tabindex="0"`.

---

### 2. `aria-haspopup="true"` without a real popup
**File:** `src/site/cv.njk:330`
**WCAG:** 4.1.2 Name, Role, Value (Level A)

Same element as above. `aria-haspopup="true"` tells assistive technologies to expect a menu, listbox, tree, grid, or dialog. The element only shows a `title` attribute tooltip — no actual ARIA popup widget. Screen reader users pressing Enter/Space will find nothing happens, creating a false expectation.

**Fix:** Remove `aria-haspopup="true"`. The `title` tooltip alone (or a proper `role="tooltip"` pattern with `aria-describedby`) is sufficient.

---

### 3. Keyword search results not announced to screen readers
**File:** `src/site/search.njk:47`
**WCAG:** 4.1.3 Status Messages (Level AA — but the underlying issue also touches 1.3.3)

```html
<div id="search-results"></div>
```

The keyword search results container has no `aria-live` attribute. When JavaScript populates it with results, screen reader users receive no announcement. By contrast, the semantic search correctly uses `role="log" aria-live="polite"`.

**Fix:** Add `aria-live="polite"` and `aria-atomic="false"` to `<div id="search-results">`:
```html
<div id="search-results" aria-live="polite" aria-atomic="false"></div>
```

---

## Serious Issues (WCAG Level AA)

### 4. Button focus indicator suppressed by `outline: 0`
**File:** `src/components/vf-componenet-rollup/index.scss:345`
**WCAG:** 2.4.7 Focus Visible (Level AA)

```scss
.kh-button {
  outline: 0;  /* removes browser default */
}

.kh-button:focus,
.kh-button:hover {
  box-shadow: 4px 4px 0 ...; /* visual change only */
}
```

The `outline: 0` removes the browser-default focus ring. The replacement `box-shadow` shift is visible to most users, but `box-shadow` is invisible in Windows High Contrast Mode (WHC). Users relying on WHC (a common accessibility accommodation) cannot see keyboard focus on buttons.

The general rule `[class*='kh-']:focus { outline: 1px dashed ... }` would apply, but `.kh-button`'s `outline: 0` is more specific and overrides it.

**Fix:** Replace `outline: 0` with `outline: none` is equivalent; the real fix is to restore the outline on focus:
```scss
.kh-button:focus-visible {
  outline: 2px solid var(--kh-color--blue);
  outline-offset: 2px;
}
```
Or at minimum, remove the `outline: 0` so the general `[class*='kh-']:focus` rule applies.

---

### 5. `<a href="javascript:window.print()">` — link acting as a button
**File:** `src/site/cv.njk:74`
**WCAG:** 4.1.2 Name, Role, Value (Level A)

```html
<a href="javascript:window.print()" class="kh-button kh-button--secondary">Download PDF</a>
```

`javascript:` URLs expose a link element that behaves as a button. Screen readers announce it as a link but it performs an action (print dialog), not navigation. Users who disable JavaScript will activate a broken href. The accessible name "Download PDF" is misleading — it does not download a PDF, it opens the print dialog.

**Fix:** Use a `<button>` element with an explicit `onclick`, or be honest in the label:
```html
<button type="button" class="kh-button kh-button--secondary" onclick="window.print()">
  Print / Save as PDF
</button>
```

---

## Moderate Issues (Best Practice / Minor Non-Conformances)

### 6. Main navigation missing `aria-label`
**File:** `src/site/_includes/layouts/base.njk:90`
**WCAG:** Best practice (ARIA Authoring Practices)

```html
<nav class="kh-cluster kh-navigation kh-u-do-not-print kh-u-show-for-medium">
```

The `<nav>` element has no `aria-label` or `aria-labelledby`. If a page has multiple `<nav>` landmarks (the pager partial also outputs `<nav>`), screen reader landmark navigation will show two unlabelled "navigation" regions, making it unclear which is the main site nav.

**Fix:** Add `aria-label="Main"` to the primary nav:
```html
<nav aria-label="Main" class="kh-cluster kh-navigation ...">
```

---

### 7. Undefined CSS class `kh-u-show-for-medium` on navigation
**File:** `src/site/_includes/layouts/base.njk:90`
**WCAG:** Not a direct WCAG violation; code quality

The nav uses `kh-u-show-for-medium` but this class is not defined in the SCSS. The available visibility utilities are `kh-u-show-for-medium-up`, `kh-u-show-for-medium-only`, and `kh-u-show-for-mobile-only`. The nav is always visible (no CSS hides it at any breakpoint), and there is no mobile navigation fallback (no hamburger menu). This is probably intentional given the compact nav, but the undefined class is dead markup and may indicate a different intent.

**Fix:** Either remove the unused class or replace with `kh-u-show-for-medium-up` if the intent is to hide on mobile and implement a mobile nav.

---

### 8. Post thumbnail image creates redundant adjacent links
**File:** `src/site/_includes/partials/post-summary.njk:9-14`
**WCAG:** Best practice (WCAG 2.4.4, Understanding 2.4.4)

```html
<a href="{{ post.url }}" class="kh-summary__image">
  <img width="300" ... alt="{{ post.data.title }}">
</a>
<h3>
  <a href="{{ post.url | url }}" class="kh-summary__link">{{ post.data.title }}</a>
</h3>
```

When a post has a thumbnail, the image link and the title link both go to the same URL with the same text (post title in alt + link text). Screen reader users in link-list mode encounter the same destination twice consecutively. This is not a failure, but creates noise.

**Fix:** Use `alt=""` (empty) on the image when it is wrapped in an adjacent same-destination link, or combine both into one link:
```html
<a href="{{ post.url }}">
  <img ... alt="">
  <h3>{{ post.data.title }}</h3>
</a>
```

---

### 9. Two H1 elements visible on CV page at some viewports
**File:** `src/site/cv.njk:46-47`
**WCAG:** 1.3.1 Info and Relationships (borderline)

```html
<h1 class="... kh-u-show-for-mobile-only">Ken <br/> Hawkins.</span></h1>
<h1 class="... kh-u-show-for-medium-up">Ken Hawkins.</span></h1>
```

Two H1 elements are used to create different line-break layouts for mobile vs desktop. Both share the same visual text. CSS hides one at each breakpoint. However, at the exact breakpoint boundary, or if CSS is disabled, both H1s are present. There are also unclosed `</span>` tags (mismatched closing tags) in both H1 elements.

**Fix:** Use a single H1 with a CSS class that handles the line break, or use a `<wbr>` element:
```html
<h1 class="kh-font-headline kh-font-headline--display kh-u-margin__bottom--200">
  Ken<wbr> Hawkins.
</h1>
```

Also fix the stray `</span>` closing tags inside the H1 elements (no opening `<span>`).

---

### 10. Orphaned `<label>` in image generator
**File:** `src/site/image-generator.njk:411`
**WCAG:** 1.3.1, 4.1.2 (Level A) — mitigated by dev-tool context

```html
<label>Reference images <span class="label-hint">(optional)</span></label>
<button class="btn-secondary btn-sm" id="ref-add-btn" type="button">+ Add reference image</button>
```

This `<label>` has no `for` attribute and does not wrap a form control. It labels a visual group but is not programmatically associated with any input. This page is excluded from collections and noindex'd (dev tool only), so the real-world impact is low.

**Fix:** Use a `<p>` or `<legend>` inside a `<fieldset>` for the reference images group, or add `for="ref-add-btn"`. Note that `<label>` for a `<button>` is valid in HTML but unusual.

---

## What's Working Well

| Criterion | Implementation | Status |
|-----------|---------------|--------|
| Skip to main content | `base.njk:85` — properly visible on focus | ✅ |
| `lang="en"` attribute | `base.njk:2` | ✅ |
| Semantic landmark roles | `role="banner"`, `role="contentinfo"`, `role="main"` | ✅ |
| Decorative animation hidden | `aria-hidden="true"` on ambience elements | ✅ |
| Reduced motion respect | `@media (prefers-reduced-motion: no-preference)` gates all animations | ✅ |
| Pagination accessible | `aria-label`, `aria-current="page"` on pager | ✅ |
| Search form labels | All search inputs have associated labels (visible or SR-only) | ✅ |
| SR-only utility | `.kh-u-sr-only` correctly implemented with `clip-path` technique | ✅ |
| Live regions | `aria-live="polite"` on feedback toast and semantic search log | ✅ |
| Image alt text | Consistent use of `image_meta.altext` field across posts | ✅ |
| Meaningful link text | Navigation and content links use descriptive text | ✅ |
| Focus visible (links) | `[class*='kh-']:focus` provides dashed outline on all kh-prefixed elements | ✅ |

---

## Priority Fix Order

1. **`tabindex="1"` → `tabindex="0"`** on cv.njk tooltip (5 min, no risk)
2. **Remove `aria-haspopup="true"`** from cv.njk tooltip (5 min, no risk)
3. **Add `aria-live="polite"` to `#search-results`** in search.njk (5 min, no risk)
4. **Fix button focus indicator** in index.scss — restore outline on `.kh-button:focus-visible` (15 min, low risk)
5. **Replace `javascript:window.print()` link with `<button>`** in cv.njk (10 min, low risk)
6. **Add `aria-label="Main"` to nav** in base.njk (2 min)
7. **Fix duplicate H1 and stray `</span>` tags** in cv.njk (15 min)
8. **Fix redundant adjacent links** in post-summary.njk (10 min)

---

## Testing Recommendations

Static analysis was performed. For complete WCAG verification, also run:

- **axe DevTools** browser extension on homepage, a blog post, CV, and search pages
- **Keyboard-only navigation** — Tab through each page type, verify all interactive elements are reachable and focus is visible
- **Screen reader test** — NVDA+Firefox or VoiceOver+Safari on homepage, CV, search; verify search results are announced, nav landmarks are clear
- **Windows High Contrast Mode** — verify button focus indicator is visible
- **Pagefind output** — verify generated search result HTML includes appropriate semantic structure

