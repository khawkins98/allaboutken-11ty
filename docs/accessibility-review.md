# Accessibility Review — allaboutken.com

**Date:** 2026-03-22
**Standard:** WCAG 2.1 AA
**Reviewer:** builder-review-accessibility-207v (automated source review)
**Scope:** Templates, CSS, and JavaScript in `src/`

---

## Summary

The site demonstrates solid accessibility fundamentals: semantic landmarks (`<header role="banner">`, `<main id="main-content">`, `<footer role="contentinfo">`), a working skip link, `aria-hidden` on decorative elements, `lang="en"` on `<html>`, and `aria-live` regions where dynamic content changes. Several issues remain, ranging from structural errors to colour contrast concerns.

---

## Issues by Severity

### 🔴 Critical (WCAG AA Failures)

#### 1. Invalid HTML — Unclosed `</span>` in `<h1>` (cv.njk:46-47)

Both responsive h1 variants on the CV page close with `</span>` instead of `</h1>`:

```html
<h1 ...>Ken <br/> Hawkins.</span></h1>   <!-- line 46 -->
<h1 ...>Ken Hawkins.</span></h1>         <!-- line 47 -->
```

Browsers handle this silently, but it produces a DOM where the heading element may not close correctly. **WCAG 4.1.1 Parsing.**

**Fix:** Replace `</span>` with nothing — the `</h1>` closes the element correctly.

---

#### 2. Multiple `<h1>` elements on CV page (cv.njk:37,46,47)

Three `<h1>` elements exist in the DOM simultaneously: a print-only one (line 37) and two responsive screen variants (lines 46–47). The print-only one is visually hidden with `.kh-u-show-for-print-only` (CSS `display:none`) but only when CSS is enabled. When the CSS toggle is off, all three are visible. Screen readers encounter two simultaneous `<h1>` elements. **WCAG 1.3.1 Info and Relationships.**

**Fix:** Use a single `<h1>` with responsive font-size handling instead of duplicating the element. Apply `aria-hidden="true"` to the print-only duplicate if it must stay separate.

---

#### 3. Heading hierarchy skip in CV — `<h2>` to `<h4>` (cv.njk:25-26)

The `position` macro jumps from `<h2>` (job title) directly to `<h4>` (employer), skipping `<h3>`:

```html
<h2 class="kh-text-heading--2">{{ name }}</h2>
<h4 class="kh-text-heading--4 kh-u-text-color--grey">{{ employer }}</h4>
```

**WCAG 1.3.1 Info and Relationships.** Screen reader users navigating by heading level will miss the employer entirely when jumping from h2 to h2 (the next same-level heading), or be confused by the skip.

**Fix:** Make employer an `<h3>` or a `<p>` with appropriate styling (the employer is supplementary, not a sub-section heading).

---

#### 4. Section headers and job titles share the same heading level (cv.njk)

Both `sectionHeader` (e.g. "Professional Experience") and `position` (e.g. "Web Platform Lead") produce `<h2>` elements. Job titles should be one level below their section headers. **WCAG 1.3.1.**

**Fix:** Make section headers `<h2>` and job titles `<h3>` (with employer as `<p>` or `<h4>`).

---

### 🟠 Significant

#### 5. `javascript:window.print()` used as link href (cv.njk:74)

```html
<a href="javascript:window.print()" class="kh-button kh-button--secondary">Download PDF</a>
```

`javascript:` hrefs are announced by screen readers as links (not buttons), read aloud literally by some AT, and fail completely when JavaScript is disabled with no feedback. **WCAG 4.1.2 Name, Role, Value.**

**Fix:** Use `<button type="button" onclick="window.print()">` or a real PDF link. Since the CV plan notes PDF generation is pending, a `<button>` calling `window.print()` is the correct interim approach.

---

#### 6. `outline: 0` removes default focus ring on `.kh-button` (index.scss:345)

```scss
.kh-button {
  outline: 0;  /* removes UA focus ring */
}
```

The custom `:focus/:hover` style is applied but uses a `box-shadow` + `transform` approach. The focus indicator is indistinguishable from hover visually (same transform) and doesn't meet the distinct, high-contrast requirement for keyboard-only users. **WCAG 2.4.7 Focus Visible.**

**Fix:** Replace `outline: 0` with `outline: none` and add a dedicated `:focus-visible` rule using a clearly visible outline (e.g. `outline: 3px solid #193f90; outline-offset: 2px`) instead of the hover effect.

---

#### 7. Keyword search results container has no `aria-live` (search.njk:47)

```html
<div id="search-results"></div>
```

When Pagefind injects results into this div via JavaScript, screen readers are not notified. Users will have no indication that results have appeared. **WCAG 4.1.3 Status Messages.**

**Fix:** Add `aria-live="polite"` and `aria-atomic="false"` to `#search-results`, or announce result counts in a separate status region.

---

#### 8. Post summary thumbnail alt text is redundant (post-summary.njk:10)

```html
<img ... alt="{{ post.data.title }}">
```

The image is wrapped in a link whose adjacent `<h3>` already contains the post title. The duplicate alt text causes screen readers to announce the title twice. **WCAG 1.1.1 Non-text Content** (decorative image in linked context should use `alt=""`).

**Fix:** Use `alt=""` on thumbnail images inside post-summary cards — they are decorative in context.

---

#### 9. CSS pipe separator in pseudo-element announced by screen readers (index.scss:494-497)

```scss
.kh-summary__author::before {
  content: "|";
}
```

The `|` character is CSS-generated content and is read by some screen readers as "vertical bar" or "pipe". **WCAG 1.3.1.**

**Fix:** Replace content with a CSS border-left or use a non-speech character (`content: " "` with a visual border), or add `speak: none` (where supported).

---

### 🟡 Moderate

#### 10. `kh-u-show-for-medium` class used on `<nav>` but not defined in CSS (base.njk:90)

```html
<nav class="kh-cluster kh-navigation kh-u-do-not-print kh-u-show-for-medium">
```

The CSS defines `kh-u-show-for-medium-up` and `kh-u-show-for-medium-only` but NOT `kh-u-show-for-medium`. The nav is therefore always displayed (the class has no effect). This is likely an unintentional class name mismatch that could cause confusion when modifying the responsive behaviour. Not a current accessibility failure but a maintenance risk.

**Fix:** Clarify intent — either remove the unused class or replace it with the correct breakpoint class.

---

#### 11. General focus selector uses `:focus` not `:focus-visible` (index.scss:112-116)

```scss
.kh-content a:focus,
[class*='kh-']:focus {
  outline: 1px dashed rgb(0 0 0 / 60%);
}
```

`:focus` shows outlines to mouse/touch users who click. Using `:focus-visible` would match browser behaviour for keyboard-only focus indicators. Not a WCAG AA failure, but causes visual noise for pointer users and may erode trust in the styles.

**Fix:** Update to `:focus-visible`. Keep a `.kh-content a:focus` fallback for browsers that don't support `:focus-visible` (though support is now >95%).

---

#### 12. Focus indicator contrast may be marginal (index.scss:114)

```scss
outline: 1px dashed rgb(0 0 0 / 60%);
```

60% opacity black on `#fbf6ef` (the page background) calculates to approximately `#676762`, giving a contrast ratio against the background of ~4.5:1. This meets WCAG 2.1 AA for the focus indicator itself, but the 1px width is thin. WCAG 2.2 introduces Focus Appearance (2.4.11, AA) requiring a minimum 2px offset area — worth noting for future compliance.

**Fix:** Increase to `2px solid` and ensure sufficient contrast against all possible background colours the site uses.

---

#### 13. Deprecated `name` attribute on anchor (cv.njk:146)

```html
<a id="cv" name="cv"></a>
```

The `name` attribute on `<a>` is deprecated in HTML5. The `id` attribute alone is sufficient.

**Fix:** Remove `name="cv"`.

---

#### 14. `kh-summary__tab` ("Digesting" label) — positional reliance (post-summary.njk:6)

```html
<a href="/digesting" class="kh-summary__tab">Digesting</a>
```

The tab link is positioned absolutely and rotated 90° via CSS. The link text "Digesting" is meaningful and the href is correct, so keyboard/screen reader users can access it. However, a sighted keyboard user may not see where focus moves when tabbing to this link, as it's off to the left side of the card. Consider ensuring the tab link has a visible focus indicator even at its rotated position.

---

#### 15. Feedback count SVG from external server lacks fallback (post.njk:108)

```html
<img src="https://feedback.allaboutken.com/count{{ page.url }}.svg"
     alt="Feedback count"
     style="display:inline;vertical-align:middle;height:1.5em;max-width:none">
```

If the external server is unavailable, the `<img>` renders as a broken image. The alt text "Feedback count" is acceptable for AT, but there's no numeric value available in text form. Consider including the count in surrounding text or using a `<picture>` with a fallback.

---

### 🟢 Low (Best Practice)

#### 16. Ambience animation respects `prefers-reduced-motion` only via `aria-hidden`, not CSS animation pause

The `aria-hidden="true"` on `#kh-dappled-light` (ambience.njk:5) correctly hides it from AT. The SVG `<animate>` elements run indefinitely regardless of `prefers-reduced-motion`. While WCAG 2.3.3 (Animation from Interactions) is AAA, the infinite background animation without a pause mechanism may be uncomfortable for vestibular disorder users. **WCAG 2.2.2 Pause, Stop, Hide (AA)** applies if the animation starts automatically and lasts more than 5 seconds (this one does).

**Fix:** Add a media query to disable the animation in CSS:
```scss
@media (prefers-reduced-motion: reduce) {
  #kh-dappled-light { display: none; }
}
```
Or add a pause/stop control in the UI.

---

#### 17. Post layout: nested `<article>` elements (post.njk:90,116)

The outer `<article>` wraps the full post, and nested `<article>` elements are used for "Comment?" and "Read more" sections. While nested articles are technically valid, the nested articles don't have their own headings that describe their independent self-contained nature clearly, which may confuse screen reader landmark navigation.

**Fix:** Replace the nested `<article>` elements with `<section>` elements (since they are sections of the post, not independently reusable content).

---

#### 18. `<h1>` contains `<div>` elements on homepage (index.njk:14-18)

```html
<h1 class="kh-font-headline kh-text-heading--1">
  <div class="kh-font-headline--display">{{title}}.</div>
  <div class="kh-font-headline--display">...</div>
</h1>
```

`<div>` is a block-level element and is invalid inside `<h1>` (which is also block-level). Browsers handle this by implicitly closing the `<h1>`, resulting in the second `<div>` being outside the heading. The text "I am Ken Hawkins." may not be read as part of the heading. **WCAG 4.1.1.**

**Fix:** Replace `<div>` with `<span>` inside `<h1>`:
```html
<h1 ...>
  <span class="kh-font-headline--display">{{title}}.</span>
  <span class="kh-font-headline--display">I am Ken Hawkins.</span>
</h1>
```

---

## What's Working Well

- **Skip link** — implemented correctly with `:focus-visible` reveal and working `#main-content` target.
- **Landmark roles** — `banner`, `main`, `contentinfo` all present; `<nav>` in header with no `aria-label` needed (only one nav).
- **`aria-hidden="true"` on ambience** — decorative background element correctly hidden from AT.
- **Pager** — `<nav aria-label="{{ pagerLabel }}">` with `aria-current="page"` on current page. Well implemented.
- **Search** — `aria-live="polite"` on semantic search conversation; hidden fieldset revealed by JS; `<legend class="kh-u-sr-only">` for radio group; labels present for all inputs.
- **Permalink anchors** — `aria-label="Permalink to this heading"` on `#` anchor links. Correct.
- **`lang="en"` on `<html>`** — present.
- **`prefers-reduced-motion`** — scroll-behavior correctly disabled; heading animation gated on `no-preference`.
- **`aria-live="polite"` on feedback toast** — correct implementation.
- **Labels for all form inputs** — either visible or `.kh-u-sr-only`. No unlabelled inputs found.
- **`image_meta.altext`/`image_meta.alt` fallback pattern** — post lead images have alt text, with empty string fallback for decorative.

---

## Issue Count by Severity

| Severity | Count |
|----------|-------|
| 🔴 Critical (WCAG AA fail) | 4 |
| 🟠 Significant | 5 |
| 🟡 Moderate | 6 |
| 🟢 Low / Best practice | 3 |
| **Total** | **18** |

---

## Priority Fixes

1. **cv.njk** — Fix unclosed `</span>`, reduce to single `<h1>`, fix heading hierarchy (h2→h3 for position names).
2. **cv.njk** — Replace `javascript:window.print()` with `<button>`.
3. **index.njk** — Replace `<div>` with `<span>` inside `<h1>`.
4. **index.scss** — Fix `.kh-button` focus: remove `outline: 0`, add `:focus-visible` style.
5. **search.njk** — Add `aria-live="polite"` to `#search-results`.
6. **post-summary.njk** — Change thumbnail `alt="{{ post.data.title }}"` to `alt=""`.
7. **index.scss / ambience.njk** — Add `prefers-reduced-motion` CSS rule to disable animation.
