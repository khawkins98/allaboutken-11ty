# Accessibility Review: AllAboutKen.com

**Date:** 2026-03-22
**Standard:** WCAG 2.1 Level AA
**Scope:** Templates, CSS, JavaScript (Eleventy/Nunjucks site)
**Reviewer:** builder-review-accessibility-1mnj

---

## Summary

The site has a solid accessibility foundation: `lang="en"`, working skip link, landmark roles, `aria-live` regions on the semantic search conversation, `prefers-reduced-motion` support, and screen-reader-only utilities. Several issues need attention, most concentrated in color contrast, dynamic content announcements, and redundant link patterns.

---

## Issues by Severity

### HIGH — Must Fix (WCAG Failure)

#### H1 — Keyword search results container lacks `aria-live`

**File:** `src/site/search.njk:47`
**Element:** `<div id="search-results"></div>`
**WCAG:** 4.1.3 Status Messages (AA)

The keyword search results div is populated dynamically (loading message, count, results, error) but has no `aria-live` attribute. Screen reader users will not be notified when results appear or when the "Searching…" status changes. The semantic search panel correctly uses `role="log" aria-live="polite"` on `#ask-conversation`, but the Pagefind keyword results have no equivalent.

**Fix:** Add `aria-live="polite"` and `aria-atomic="false"` to `<div id="search-results">`.

---

#### H2 — `.kh-button` explicitly removes focus outline

**File:** `src/components/vf-componenet-rollup/index.scss:345`
**WCAG:** 2.4.7 Focus Visible (AA)

```scss
.kh-button {
  outline: 0;  // ← removes browser default focus ring
  ...
}
```

`.kh-button:focus` and `.kh-button:hover` share a box-shadow/transform effect, which provides some visual change on focus. However, explicitly setting `outline: 0` removes the browser's default focus ring. The box-shadow change (from 8px to 4px offset) is subtle and may not be perceptible to all users. The focus style for `.kh-button` should use `outline` rather than suppressing it.

**Affected elements:** "Blog index ⇤" button, "👍 This was useful" button, "Search" submit button on search page.

**Fix:** Remove `outline: 0` from `.kh-button`. Replace with a visible `outline` on `:focus-visible` that meets 3:1 contrast.

---

#### H3 — Metadata text color contrast fails WCAG AA

**File:** `src/components/vf-componenet-rollup/index.scss:487–507`
**WCAG:** 1.4.3 Contrast (Minimum) (AA)

`.kh-summary__date` and `.kh-summary__author` use `color: #707372` at `font-size: 13px` on a `#fbf6ef` background.

- Computed contrast ratio: **≈ 4.48:1**
- Required for small text (< 18pt normal, < 14pt bold): **4.5:1**
- **Result: FAILS** by a 0.02:1 margin

Additionally, `.kh-figure__credit` uses `color: #737373` (≈ 4.42:1 on the same background) — also fails.

**Fix:** Darken these colors slightly. `#6e706f` or darker would pass at 13px.

---

#### H4 — `<h3>` heading inside `<a>` anchor in search results

**File:** `src/site/search.njk:169` (keyword results JS) and `src/site/semantic-search.js:66`
**WCAG:** 4.1.2 Name, Role, Value (AA)

Both keyword and semantic search results render headings inside anchor tags:

```js
// Keyword results (search.njk inline script):
<a href="${esc(item.url)}"><h3>${esc(item.meta?.title || item.url)}</h3></a>

// Semantic results (semantic-search.js):
<a href="${esc(r.url)}"><h3>${esc(r.title || r.url)}</h3></a>
```

Nesting block-level heading elements inside `<a>` is invalid HTML (headings are block elements; anchors are inline). Browsers normalize this but screen readers can announce these inconsistently — some announce "heading level 3, link, Title" and others collapse them. It also breaks the heading structure within the live region.

**Fix:** Put the heading outside the link or invert the structure: `<h3><a href="...">Title</a></h3>`. This is the pattern used correctly in `post-summary.njk`.

---

### MEDIUM — Should Fix

#### M1 — Post summary thumbnail uses redundant alt text

**File:** `src/site/_includes/partials/post-summary.njk:10`
**WCAG:** 1.1.1 Non-text Content (AA)

```njk
<img width="300" class="kh-summary__image" src="/images{{ post.data.image }}" alt="{{ post.data.title }}">
```

The thumbnail alt text is set to `post.data.title` — the same text that appears in the `<h3>` immediately below. Screen readers announce it twice: once for the image, once for the heading. Since the image is wrapped in a link to the same URL as the title link, this creates triple redundancy (two links + alt text all saying the same thing).

**Fix:** Set `alt=""` on summary thumbnails to mark them as decorative (the title link provides the accessible name for the post).

---

#### M2 — Duplicate adjacent links to the same URL in post summaries

**File:** `src/site/_includes/partials/post-summary.njk:9–14`
**WCAG:** 2.4.4 Link Purpose (AA)

Each post summary renders both an image link and a title link pointing to the same URL. Keyboard and screen reader users must tab through both to reach the next post. For 15 posts per page (blog index pagination), that is 30 redundant tab stops.

```njk
<a href="{{ post.url }}" class="kh-summary__image">   {# image link #}
  <img ... alt="{{ post.data.title }}">
</a>
...
<h3 class="kh-font-headline kh-summary__title">
  <a href="{{ post.url | url }}" class="kh-summary__link">{{ post.data.title }}</a>
</h3>
```

**Fix:** Either remove the image link and let the title link be the only navigation point, or use `aria-hidden="true"` and `tabindex="-1"` on the image link so it's invisible to AT while remaining visually linked.

---

#### M3 — Heading hierarchy skip in CV page

**File:** `src/site/cv.njk:24–28`
**WCAG:** 1.3.1 Info and Relationships (AA)

The `position()` macro uses `<h2>` for job title and `<h4>` for employer, skipping `<h3>`:

```njk
<h2 class="kh-text-heading--2">{{ name }}</h2>
<h4 class="kh-text-heading--4 ...">{{ employer }}</h4>
```

Non-sequential heading levels disrupt the document outline and make navigation by heading (a common screen reader strategy) confusing.

**Fix:** Change `<h4>` to `<h3>` for employer name. If the visual size needs to differ from h3 defaults, use the existing utility classes to adjust styling without changing semantics.

---

#### M4 — Multiple H1 elements visible when CSS is disabled

**File:** `src/site/cv.njk:47–48`
**WCAG:** 1.3.1 Info and Relationships (AA)

The CV page uses two `<h1>` elements shown/hidden by responsive CSS classes:

```njk
<h1 class="... kh-u-show-for-mobile-only">Ken <br/> Hawkins.</span></h1>
<h1 class="... kh-u-show-for-medium-up">Ken Hawkins.</span></h1>
```

Because all CSS is scoped inside `body:has(#kh-css-toggle:checked)`, toggling CSS off removes the `display:none` from these elements, making both H1s visible simultaneously. Additionally, there is a third print-only H1.

The page also has an unclosed `</span>` tag inside both `<h1>` elements (malformed HTML).

**Fix:** Use a single `<h1>` with a `<br>` or CSS-only line break, rather than two separate headings.

---

#### M5 — `href="#"` used for JavaScript-only actions in search

**File:** `src/site/semantic-search.js:45, 72`
**WCAG:** 4.1.2 Name, Role, Value (AA)

Semantic search result messages include inline links:

```js
`<a href="#" onclick="setMode('keyword'); return false;">keyword search</a>`
```

`href="#"` causes the page to scroll to top and adds a `#` to the URL when JS fails or is slow. The action (switching search mode) is a JavaScript-only behavior — not navigation. A `<button>` element is semantically correct for triggering actions.

**Fix:** Replace with `<button>` styled as a link (using CSS), or at minimum use `href="javascript:void(0)"`.

---

#### M6 — `progress` element in semantic search has no accessible label

**File:** `src/site/semantic-search.js:78`
**WCAG:** 1.3.1 Info and Relationships (AA)

The model-loading progress bar is created dynamically with no label:

```js
statusMsg.innerHTML = '<p>Loading search model...</p><progress max="100" value="0"></progress>';
```

The `<progress>` has no `id`/`<label>` association, no `aria-label`, and no `aria-labelledby`. Screen readers may announce "progress bar, 0%" with no context.

**Fix:** Add `aria-label="Model loading progress"` to the `<progress>` element.

---

### LOW — Informational / Minor

#### L1 — `altext` typo in image alt fallback

**File:** `src/site/_includes/layouts/post.njk:32`
**Impact:** Low — falls back gracefully to `image_meta.alt`

```njk
alt="{{ image_meta.altext or image_meta.alt or '' }}"
```

`altext` is likely a typo for `alttext` or `alt`. If any frontmatter uses `altext` as a key, the fallback chain works. If frontmatter exclusively uses `alt`, it also works. But if `altext` was intended to be the primary key, it may silently produce empty alt text.

**Fix:** Clarify and standardize to `image_meta.alt` only, remove the `altext` variant.

---

#### L2 — Duplicate `rel="webmention"` links in `<head>`

**File:** `src/site/_includes/layouts/base.njk:10, 17`

Two `<link rel="webmention">` tags pointing to different domains (`allaboutken.com` and `www.allaboutken.com`). Not an accessibility issue, but malformed metadata. The duplicate on line 17 is on the same line as an unrelated `<meta>` tag, suggesting a copy-paste error.

**Fix:** Remove the duplicate; keep only the `www.allaboutken.com` endpoint (or whichever is canonical).

---

#### L3 — Redundant ARIA landmark roles on semantic HTML

**File:** `src/site/_includes/layouts/base.njk:88, 110`
**File:** `src/site/_includes/footer.njk:1`

```html
<header ... role="banner">
<main role="main" ...>
<footer ... role="contentinfo">
```

In HTML5, `<header>`, `<main>`, and `<footer>` already carry these implicit ARIA roles. The explicit roles are harmless but unnecessary.

**Fix:** Remove redundant `role` attributes.

---

#### L4 — CSS-off `<aside>` has no accessible name

**File:** `src/site/_includes/layouts/base.njk:87`

```html
<aside class="kh-css-off-note">If you're reading this the site styles are currently disabled...</aside>
```

When CSS is toggled off, this `<aside>` becomes visible but has no `aria-label`. ARIA best practice recommends landmark elements have distinguishing labels when multiple landmarks of the same type exist on a page.

**Fix:** Add `aria-label="CSS disabled notice"` to the `<aside>`.

---

#### L5 — Unclosed `</span>` tags in CV page H1s

**File:** `src/site/cv.njk:46–47`

Both H1 elements contain an orphaned `</span>` closing tag with no matching open tag. Browsers tolerate this but it's invalid HTML and may confuse screen reader announcement boundaries.

```njk
<h1 ...>Ken <br/> Hawkins.</span></h1>
<h1 ...>Ken Hawkins.</span></h1>
```

**Fix:** Remove the stray `</span>` tags.

---

## Color Contrast Quick Reference

| Element | Color | Background | Ratio | Size | Result |
|---|---|---|---|---|---|
| Body text | `#222` | `#fbf6ef` | ~14.9:1 | 16px | ✓ Pass |
| Links (default) | `#333` | `#fbf6ef` | ~12.0:1 | 16px | ✓ Pass |
| Metadata / dates | `#707372` | `#fbf6ef` | ~4.48:1 | 13px | ✗ Fail |
| Figure credit | `#737373` | `#fbf6ef` | ~4.42:1 | 12px | ✗ Fail |
| Nav link active | `#333` bold | `#fbf6ef` | ~12.0:1 | 16px | ✓ Pass |
| Button text | `#3b6fb6` | `#fafafa` | ~3.9:1 | 14px | ✗ Fail* |

*Button text color `#3b6fb6` on `#fafafa` background: contrast ≈ 3.9:1. For 14px bold text (bold is ≥ 14pt, which is ~18.67px), this is below the 4.5:1 AA threshold for normal text and below 3:1 for large text. However, 14px bold in px may be considered "large text" at 14pt = 18.67px. At 14px CSS = 10.5pt, it is NOT large text and requires 4.5:1. This fails.

---

## What's Working Well

- Skip-to-content link with correct CSS show-on-focus implementation
- `lang="en"` on `<html>`, `charset`, `viewport` all correct
- Decorative ambience SVG has `aria-hidden="true"`
- Pagination nav has `aria-label` and `aria-current="page"`
- Semantic search conversation uses `role="log" aria-live="polite" aria-relevant="additions"`
- Feedback "thanks" message uses `aria-live="polite"`
- Search mode toggle uses native `<fieldset>/<legend>/<input type="radio">` with focus-visible indication
- `prefers-reduced-motion` disables scroll animation
- `.kh-u-sr-only` correctly implemented (clip-path approach)
- Font preload with `crossorigin` attribute
- All form inputs have associated `<label>` elements
- `og:image:alt` and `twitter:image:alt` meta tags present
- `<noscript>` fallback for search

---

## Priority Fix Order

1. **H1** — Add `aria-live` to `#search-results` (2-minute fix, high impact)
2. **H4** — Fix `<h3>` inside `<a>` in search results (affects both search modes)
3. **H3** — Fix metadata color contrast (CSS change, borderline failure)
4. **H2** — Replace `outline: 0` on `.kh-button` with `outline: none` on non-`:focus` only, add visible focus ring on `:focus-visible`
5. **M1+M2** — Fix post summary thumbnail alt text and duplicate links
6. **M3** — Fix CV heading hierarchy (h2→h4 skip)
7. **M4** — Consolidate CV H1 elements
8. **M5** — Replace `href="#"` action links with buttons
9. **L1–L5** — Minor fixes as time allows
