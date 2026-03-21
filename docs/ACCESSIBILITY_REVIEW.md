# Accessibility Review — AllAboutKen.com

**Date:** 2026-03-21
**Scope:** Full site audit — templates, CSS, JavaScript
**Standard:** WCAG 2.1 Level AA
**Method:** Static code analysis of templates, styles, and scripts

---

## Summary

The site has a solid accessibility foundation: semantic HTML landmarks, a skip link, proper `lang` attribute, descriptive `<title>` elements, `aria-current` on pagination, `aria-live` on the feedback toast, and decorative animations hidden from assistive technology (`aria-hidden="true"`). Keyboard navigation is largely functional. The following issues were found ranked by severity.

---

## Findings

### CRITICAL

#### 1. Navigation CSS class has no effect — undefined utility class in use
**File:** `src/site/_includes/layouts/base.njk:90`
**WCAG:** N/A (not a failure per se, but masks real intent)

```html
<nav class="kh-cluster kh-navigation kh-u-do-not-print kh-u-show-for-medium">
```

The class `kh-u-show-for-medium` has no CSS definition (only `kh-u-show-for-medium-up` and `kh-u-show-for-medium-only` are defined in `index.scss`). The nav is currently visible at all screen sizes because the class is a no-op. This appears to be a leftover/vestigial class name — the intent was likely to show the nav only at medium-and-up breakpoints. The nav is accidentally always visible. If the intent ever changes and a dev adds a CSS rule for this class, the nav could disappear unexpectedly.

**Recommendation:** Either remove the class or replace with `kh-u-show-for-medium-up` if a mobile nav is planned, or add `aria-label="Site navigation"` to document intent clearly.

---

### HIGH

#### 2. White text on orange tab fails colour contrast — WCAG 1.4.3
**File:** `src/components/vf-componenet-rollup/index.scss:546–563`
**WCAG SC 1.4.3:** Contrast (Minimum) — Level AA

The "Digesting" category tab on post summary cards uses:
```css
.kh-summary__tab {
  background: var(--kh-color--orange);  /* #f49e17 */
  color: #fff;
  font-size: 11px;
}
```

**Contrast ratio: ~2.15:1** (white `#fff` on orange `#f49e17`).
WCAG AA requires **4.5:1** for text under 18pt/24px or 14pt bold/~18.5px bold. At 11px this fails by a large margin.

**Recommendation:** Darken the text to a dark brown/near-black (e.g., `#3a2600`) or darken the background. A dark text `#1a1000` on `#f49e17` would achieve >7:1. Alternatively use the `--kh-color--grey--darkest` (`#373a36`) as text color.

---

### MEDIUM

#### 3. Figure credit text is too small and low contrast — WCAG 1.4.3
**File:** `src/components/vf-componenet-rollup/index.scss:419–424`
**WCAG SC 1.4.3:** Contrast (Minimum) — Level AA

```css
.kh-figure__credit {
  color: #737373;
  font-size: 0.75rem;  /* 12px */
}
```

Contrast of `#737373` on the page background `#fbf6ef`: **~4.41:1**.
WCAG AA requires **4.5:1** for text below 18pt (24px). At 12px, this marginally fails.

**Recommendation:** Darken to `#6b6b6b` or similar to achieve ≥4.5:1, or increase font size to at least 14px (the 3:1 threshold for large text starts at 18pt/24px for normal weight, or 14pt/~18.5px bold).

#### 4. `.kh-button` removes native focus ring without `:focus-visible` — WCAG 2.4.7
**File:** `src/components/vf-componenet-rollup/index.scss:326–366`
**WCAG SC 2.4.7:** Focus Visible — Level AA

```css
.kh-button {
  outline: 0;   /* removes native ring */
}
.kh-button:focus,
.kh-button:hover {
  /* combined — hover and keyboard focus are visually identical */
  box-shadow: 4px 4px 0 ...;
  transform: translate(4px, 4px);
}
```

Two problems:
1. `outline: 0` removes the native focus ring without using `:focus-visible`, so keyboard-only users may miss the focus indicator in browsers that require it.
2. Focus and hover states are identical. Keyboard users cannot distinguish focus from hover visually.

**Recommendation:** Use `:focus-visible` for the `outline: 0` override to keep native focus rings for keyboard users while hiding them for mouse users. Add a distinct focus style (e.g., a contrasting outline) separate from the hover state:

```css
.kh-button:focus:not(:focus-visible) {
  outline: 0;
}
.kh-button:focus-visible {
  outline: 3px solid var(--kh-color--blue--dark);
  outline-offset: 2px;
}
```

#### 5. Search results container lacks `aria-live` region — WCAG 4.1.3
**File:** `src/site/search.njk:47`
**WCAG SC 4.1.3:** Status Messages — Level AA

```html
<div id="search-results"></div>
```

This element receives dynamically injected search results, a "Searching..." status, "No results found" messages, and error states — all via `innerHTML`. There is no `aria-live` attribute, so screen reader users receive no announcement when results change.

The semantic search conversation (`#ask-conversation`) correctly uses `role="log" aria-live="polite"` — the same approach should be applied to keyword results.

**Recommendation:**
```html
<div id="search-results" aria-live="polite" aria-relevant="additions removals"></div>
```

#### 6. General focus style uses `:focus` not `:focus-visible` — WCAG 2.4.7
**File:** `src/components/vf-componenet-rollup/index.scss:112–116`
**WCAG SC 2.4.7:** Focus Visible — Level AA

```css
.kh-content a:focus,
[class*='kh-']:focus {
  outline: 1px dashed rgb(0 0 0 / 60%);
  outline-offset: 4px;
}
```

The `[class*='kh-']:focus` selector is very broad and applies to all `kh-` classed elements on mouse click as well as keyboard focus. This can cause unwanted outlines for mouse users and may lead maintainers to remove the rule entirely to "fix" the aesthetic issue, at the expense of keyboard accessibility.

**Recommendation:** Migrate to `:focus-visible`:
```css
.kh-content a:focus-visible,
[class*='kh-']:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}
```

---

### LOW

#### 7. Post summary thumbnail alt text is redundant — WCAG 1.1.1
**File:** `src/site/_includes/partials/post-summary.njk:9–11`
**WCAG SC 1.1.1:** Non-text Content — Level A

```html
<a href="{{ post.url }}" class="kh-summary__image">
  <img width="300" ... alt="{{ post.data.title }}">
</a>
```

The image uses the post title as alt text, but is wrapped in the same link as the `<h3>` heading directly below it (which also links to the same URL with the same title text). Screen reader users hear the title announced twice in rapid succession.

Per WCAG H2 technique: when an image and adjacent text link to the same resource, the image should have `alt=""` so it doesn't create duplicate link text.

**Recommendation:** Change to `alt=""` for summary thumbnails. The image is decorative here — the heading carries the meaning.

#### 8. `altext` typo in image alt text fallback — fragile code
**File:** `src/site/_includes/layouts/post.njk:32`

```html
alt="{{ image_meta.altext or image_meta.alt or '' }}"
```

The property name `altext` is likely a typo for `alt`. In Nunjucks, accessing an undefined property returns `undefined`, which is falsy, so the fallback chain works correctly for content using `image_meta.alt`. However, if any post frontmatter uses `image_meta.altext` by mistake, it would silently be used. The typo also creates confusion about the correct frontmatter key.

**Recommendation:** Change `image_meta.altext` to `image_meta.alt`, or rename the property consistently to `altext` everywhere if intentional.

#### 9. `<progress>` in semantic search lacks accessible name — WCAG 1.3.1
**File:** `src/site/semantic-search.js:78`
**WCAG SC 1.3.1:** Info and Relationships — Level A

```js
statusMsg.innerHTML = '<p>Loading search model (one-time ~30 MB download)...</p><progress max="100" value="0"></progress>';
```

The dynamically created `<progress>` element has no accessible name. While the preceding `<p>` text provides context visually, the progress element itself has no `aria-label` or `aria-labelledby`.

**Recommendation:**
```js
'<progress max="100" value="0" aria-label="Model download progress"></progress>'
```

#### 10. `href="#"` links in JavaScript-rendered content
**File:** `src/site/semantic-search.js:45,72`

```js
'<a href="#" onclick="setMode(\'keyword\'); return false;">keyword search</a>'
```

`href="#"` scrolls the page to the top if JavaScript fails or the `onclick` handler doesn't execute properly. While these are JS-only rendered strings (so no-JS users won't see them), it's still fragile.

**Recommendation:** Use `href="javascript:void(0)"` or a button element instead, or better: `href="/search/"` so it gracefully degrades to the search page.

#### 11. Navigation link lacks `aria-label` on logo link
**File:** `src/site/_includes/layouts/base.njk:89`

```html
<a href="/" class="kh-logo kh-navigation__link">AllAboutKen.com</a>
```

This is acceptable as the link text "AllAboutKen.com" is descriptive enough. No action needed, but adding an `aria-label="Go to home page"` would make it more explicit for screen reader users.

#### 12. Duplicate `<link rel="webmention">` in `<head>`
**File:** `src/site/_includes/layouts/base.njk:10,17`

```html
<link rel="webmention" href="https://webmention.io/allaboutken.com/webmention" />
...
<link rel="webmention" href="https://webmention.io/www.allaboutken.com/webmention" />
```

Two `rel="webmention"` links exist with slightly different URLs (`allaboutken.com` vs `www.allaboutken.com`). This is a minor HTML validity issue rather than an accessibility issue, but worth cleaning up.

---

## Positive Findings

These patterns are done well and worth preserving:

- **Skip link** — `<a href="#main-content" class="kh-u-sr-only kh-skip-link">` with CSS that reveals on focus — correctly implemented.
- **HTML `lang` attribute** — `<html lang="en">` present on all layouts.
- **Landmark roles** — `<header role="banner">`, `<main role="main" id="main-content">`, `<footer role="contentinfo">` are all present.
- **Pagination** — `aria-label="{{ pagerLabel }}"` on the nav, `aria-current="page"` on the current page link.
- **Decorative animation** — `<div id="kh-dappled-light" aria-hidden="true">` correctly hides the ambient effect from AT.
- **Feedback toast** — `aria-live="polite"` on `#thanks` span.
- **Semantic search conversation** — `role="log" aria-live="polite" aria-relevant="additions"` correctly marks the result area.
- **Search form labels** — All search inputs have associated `<label>` elements (even if visually hidden with `kh-u-sr-only`).
- **`<time>` element** — `datetime` attribute present on post dates.
- **`prefers-reduced-motion`** — `scroll-behavior: auto` applied under this media query. Animations in `kh-feedback-thanks` and `kh-ambience` would benefit from the same treatment (not currently guarded).
- **Form fieldset + legend** — Search mode toggle uses `<fieldset>` with `<legend class="kh-u-sr-only">Search mode</legend>`.
- **`font-display: swap`** — Custom font uses swap to prevent invisible text during load.
- **`noscript` fallback** — Search page includes a DuckDuckGo fallback link for no-JS users.

---

## Recommendations by Priority

| # | Issue | WCAG SC | Severity | Effort |
|---|-------|---------|----------|--------|
| 2 | White text on orange tab | 1.4.3 | High | Low |
| 5 | Search results no `aria-live` | 4.1.3 | Medium | Low |
| 4 | `.kh-button` outline:0 / focus+hover combined | 2.4.7 | Medium | Medium |
| 6 | `:focus` instead of `:focus-visible` sitewide | 2.4.7 | Medium | Low |
| 3 | Figure credit contrast at 12px | 1.4.3 | Medium | Low |
| 7 | Redundant alt text on summary thumbnails | 1.1.1 | Low | Low |
| 9 | `<progress>` no accessible name | 1.3.1 | Low | Low |
| 8 | `altext` typo in alt fallback | — | Low | Low |
| 10 | `href="#"` in JS-rendered links | — | Low | Low |
| 1 | Undefined CSS class on nav | — | Informational | Low |
