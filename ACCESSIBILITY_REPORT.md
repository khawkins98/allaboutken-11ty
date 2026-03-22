# Accessibility Review — AllAboutKen.com

**Date:** 2026-03-22
**Reviewer:** builder-review-accessibility-ilb1
**Standard:** WCAG 2.1 Level AA
**Scope:** Static analysis of source templates, CSS, and JavaScript

---

## Status of Prior Reports

Ten prior accessibility review branches exist in this repo. All critical issues
identified in those reports remain unfixed in the current codebase. This report
documents those outstanding issues plus new findings, and applies fixes where
unambiguous.

---

## Summary

The site has a sound accessibility foundation: semantic HTML, skip link, landmark
roles, SR-only utilities, reduced-motion support, `aria-live` on the semantic
search log, and descriptive alt text throughout. Most issues are isolated.

**Fixes applied in this pass:** 6 (see details below)

**Issue count by severity:**
- 🔴 Critical (WCAG Level A violations): 3 (all fixed)
- 🟠 Serious (WCAG Level AA violations): 3 (2 fixed, 1 mitigated)
- 🟡 Moderate (advisory/best-practice): 4 (noted, not fixed)

---

## 🔴 Critical Issues (WCAG Level A) — All Fixed

### 1. Positive `tabindex` disrupts tab order ✅ Fixed

**File:** `src/site/cv.njk:330`
**WCAG:** 2.4.3 Focus Order (Level A)
**Was:** `tabindex="1"` — places this element first in tab order regardless of DOM position, breaking predictable keyboard navigation.
**Fix:** Changed to `tabindex="0"`.

---

### 2. `aria-haspopup` without a real popup widget ✅ Fixed

**File:** `src/site/cv.njk:330`
**WCAG:** 4.1.2 Name, Role, Value (Level A)
**Was:** `aria-haspopup="true"` on a `<span>` that only shows a `title` tooltip. Tells assistive technologies to expect a menu/dialog; none exists, creating false expectations.
**Fix:** Removed `aria-haspopup="true"`.

---

### 3. Two `<h1>` elements in DOM creates duplicate page title ✅ Fixed

**File:** `src/site/cv.njk:46–47`
**WCAG:** 1.3.1 Info and Relationships (Level A)
**Was:** Two `<h1>` elements (one `kh-u-show-for-mobile-only`, one `kh-u-show-for-medium-up`) created a duplicate page title in the accessibility tree. Both were always present in the DOM; only visual display differed.
**Fix:** Added `aria-hidden="true"` to the mobile-only `<h1>`. Also fixed invalid `</span>` closing tags inside both `<h1>` elements.

---

## 🟠 Serious Issues (WCAG Level AA) — 2 Fixed, 1 Mitigated

### 4. Keyword search results not announced to screen readers ✅ Fixed

**File:** `src/site/search.njk:47`
**WCAG:** 4.1.3 Status Messages (Level AA)
**Was:** `<div id="search-results"></div>` — JavaScript populates this with results dynamically, but no `aria-live` attribute exists. Screen reader users received no announcement when results loaded. The semantic search container at line 57 correctly uses `role="log" aria-live="polite"`.
**Fix:** Added `aria-live="polite" aria-atomic="false"` to `<div id="search-results">`.

---

### 5. `.kh-summary__tab` text fails contrast at 11px ✅ Fixed

**File:** `src/components/vf-componenet-rollup/index.scss:553`
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA)
**Was:** `color: #fff` (white) on `background: #f49e17` (orange) — calculated contrast ratio **2.15:1**. WCAG requires 4.5:1 for normal text; 11px bold does not qualify as large text.
**Fix:** Changed to `color: #222` — provides **7.4:1** contrast against the orange background.

---

### 6. `.kh-button { outline: 0 }` suppresses browser focus ring — Mitigated

**File:** `src/components/vf-componenet-rollup/index.scss:345`
**WCAG:** 2.4.7 Focus Visible (Level AA)
**Status:** Not fixed — mitigation confirmed present. The `[class*='kh-']:focus` rule at line 113 (specificity 0,2,0) overrides the `.kh-button` rule (specificity 0,1,0) at focus time, providing a `1px dashed rgba(0,0,0,0.6)` outline. Focus IS visible in practice.

**However,** `outline: 0` as a base style is fragile — any `.kh-button`-derived class that adds a `:focus` rule could win over the `[class*='kh-']:focus` rule and leave no focus indicator. Recommend replacing `outline: 0` with `outline: none` on `:not(:focus-visible)` to preserve browser behavior for keyboard users while removing the ring for mouse users.

---

## 🟡 Moderate / Advisory Issues

### 7. Borderline contrast on small grey text — Partially Fixed

**Files:** `index.scss:422` (`.kh-figure__credit`), `index.scss:502` (`.kh-summary__date`)
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA)

Both used grey values (#737373 and #707372) against the cream body background (#fbf6ef). Calculated contrast was approximately 4.4:1 — just below the 4.5:1 threshold for normal text at 12–13px.

**Fixes applied:**
- `.kh-figure__credit`: `#737373` → `#6f6f6f` (≈4.7:1 on cream)
- `.kh-summary__date`: `#707372` → `#6d6d6d` (≈4.9:1 on cream)

Note: `#707372` is also used via the `--kh-color--grey` custom property for the `.kh-u-text-color--grey` class (CV employer names in `<h4>`). Those are heading-size text (≥18px or 14px bold), qualifying as large text where 3:1 suffices. No change needed there.

---

### 8. `javascript:` URI used for print action ✅ Fixed

**File:** `src/site/cv.njk:74`
**Was:** `<a href="javascript:window.print()">` — anchor with a `javascript:` URI degrades poorly (no-JS: dead link; screen readers: announced as a link to "#javascript"). Should be a button for scripted actions.
**Fix:** Replaced with `<button type="button" onclick="window.print()">`.

---

### 9. Post-summary thumbnail creates duplicate adjacent links

**File:** `src/site/_includes/partials/post-summary.njk:9–14`
**Issue:** Post thumbnails (`<a href="{{ post.url }}"><img alt="{{ post.data.title }}"></a>`) are immediately followed by `<h3><a href="{{ post.url }}">{{ post.data.title }}</a></h3>` with the same destination and the same accessible name. Screen reader users encounter the post title twice consecutively while tabbing.
**Recommendation:** Set `alt=""` on the thumbnail image (making it decorative from the link perspective, since the text link immediately follows with the same destination and label). Alternatively, wrap the image and title in a single `<a>`.

---

### 10. CV heading hierarchy skips levels

**File:** `src/site/cv.njk` — `position()` macro
**WCAG:** 1.3.1 Info and Relationships (advisory)
**Issue:** The `position()` macro renders `<h2>` (job title) followed by `<h4>` (employer name), skipping `<h3>`. Screen reader users navigating by heading level will find an unexpected gap.
**Recommendation:** Change employer `<h4>` to `<h3>`, or use `<p>` with styling if the employer name is not a true sub-section heading.

---

## Positives Worth Preserving

1. **Skip link** — `<a href="#main-content">` present and functional
2. **Landmark roles** — `role="banner"` (header), `role="main"` (main), `role="contentinfo"` (footer) all present
3. **SR-only utilities** — `.kh-u-sr-only` used appropriately on nav labels and search labels
4. **Reduced-motion** — `@media (prefers-reduced-motion: reduce)` disables scroll animation and `kh-target-pop` keyframe
5. **Semantic search aria-live** — `role="log" aria-live="polite"` on conversation container
6. **Pagination** — `aria-label` on `<nav>`, `aria-current="page"` on active page
7. **Ambience decoration** — `aria-hidden="true"` on dappled light SVG
8. **Open-graph image alt** — `og:image:alt` populated from `image_meta.alt`
9. **`<time>` element** — used on post dates with `datetime` attribute
10. **Alt text** — all `<img>` elements have `alt` attributes

---

## Files Modified

| File | Changes |
|------|---------|
| `src/site/cv.njk` | tabindex 1→0; remove aria-haspopup; aria-hidden on duplicate h1; fix stray `</span>`; javascript: → button |
| `src/site/search.njk` | aria-live + aria-atomic on search-results div |
| `src/components/vf-componenet-rollup/index.scss` | .kh-summary__tab color #fff→#222; .kh-figure__credit #737373→#6f6f6f; .kh-summary__date #707372→#6d6d6d |
