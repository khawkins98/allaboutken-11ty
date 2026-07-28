# Small data marks for a low-JavaScript site — research notes

Compiled July 2026. Research brief: find "data is beautiful" ideas that suit a
personal site, work with **no JavaScript or build-time rendering only**, and
stay **little touches rather than dashboards**.

Every URL below was checked and returns a live page, except where the "Could
not verify" section says otherwise. Attribution is to the named person; where
provenance was unclear it says so rather than guessing.

Existing marks on this site for reference: a twelve-month timeline of dots
sized by post count, a prev/next sequence rail, a word-count percentile gauge,
and topic tallies. See `src/site/_includes/partials/` and `_kh-dataviz.scss`.

---

## 1. Start here — the three findings worth acting on

### `eleventy-plugin-post-graph` — a drop-in contribution heatmap
A per-day grid of small squares, lit where a post exists, in the GitHub commit
graph idiom. Packaged as an Eleventy plugin and invoked with a single
shortcode: `{% postGraph collections.posts %}`.

- **Where:** <https://postgraph.rknight.me/> · repo <https://github.com/rknightuk/eleventy-plugin-post-graph>
- **Who:** Robb Knight
- **JS:** None. Verified by fetching the demo page: it is a CSS Grid of
  `div.epg__box` elements with a class swap for "has post". No `<script>` in
  the rendering path.
- **Fit:** Same generator, same aesthetic family, installable rather than
  merely inspirational. A dense grid of ticks is very close to the datasheet
  register already in use.

### `<meter>` instead of hand-rolled spans for the length gauge
The word-count percentile gauge currently uses `span.kh-length-gauge__track`
with a marker positioned by a custom property. `<meter>` is the native element
for "where does this value sit on a defined scale", with `min`/`max`/`low`/
`high`/`optimum`, and it carries the `meter` ARIA role for free.

- **Where:** <https://www.w3.org/WAI/ARIA/apg/patterns/meter/>
- **Who:** WAI-ARIA Authoring Practices (W3C)
- **JS:** None.
- **Fit:** Straight swap that trades custom markup for native semantics. The
  APG note about `aria-valuetext` matters here: "72nd percentile" is more
  meaningful to announce than a bare number. Caveat: `<meter>` is notoriously
  awkward to style consistently across browsers, so check the appearance
  before committing.

### Charts.css — table-as-chart
A CSS framework that turns an ordinary `<table>` into bar, column, area and
other charts through utility classes on the table's own markup. The numbers
stay in the DOM as a real table.

- **Where:** <https://chartscss.org/docs/> · <https://github.com/ChartsCSS/charts.css/>
- **Who:** Rami Yushuvaev and contributors. Release 1.2.0, July 2025 — active.
- **JS:** None.
- **Fit:** "Table as the source of truth, styled into a chart" *is* the
  datasheet register. If a real chart is ever wanted, this is the way in
  without a dependency graph.

---

## 2. Real examples on personal sites

### Pure-CSS "posts by year" bar chart
One row per year; a `div` whose inline `width` is a percentage of the busiest
year, with the count printed alongside.

- **Where:** <https://rknight.me/blog/stats/>
- **Who:** Robb Knight
- **JS:** None. The percentage is computed at build time and written inline.
- **Fit:** About as close to "a hairline rule turned into a bar" as it gets.

### The heatmap pattern spreading peer-to-peer
Photogabble adopted Knight's plugin and credited both him and Tim Hårek
Andreassen in the changelog — a visible chain of personal sites borrowing the
same mark.

- **Where:** <https://photogabble.co.uk/stats/> · <https://photogabble.co.uk/changelog/addition-of-post-graphs-to-stats-page/>
- **Who:** the Photogabble site owner (display name not confirmed beyond the handle)
- **JS:** None — same plugin output.
- **Fit:** Second independent confirmation this works in Eleventy specifically.

### A stats page as its own small artifact
- **Where:** <https://timharek.no/stats/>
- **Who:** Tim Hårek Andreassen
- **JS:** The numeric per-year breakdown reads as static. Whether this page
  carries the square grid was **not** confirmed — the grid is credited to
  Knight/Photogabble, not to this page.
- **Fit:** Supports "a `/stats/` page is a legitimate genre on a personal site".

### Tag cloud as discrete size buckets
Tags wrapped in bucketed classes (`not-popular-at-all` … `ultra-popular`)
rather than a continuously scaled font size.

- **Where:** <https://simonwillison.net/tags/>
- **Who:** Simon Willison
- **JS:** None in the browser; classes are baked in server-side.
- **Fit:** Interesting given the word cloud was already rejected here.
  Bucketing into a few discrete steps is more defensible than continuous
  font-size scaling, though see §4 for why size-as-magnitude remains weak.

### Posting rhythm charts — included as a counter-example
Four line charts of posts by hour, day of month, weekday and month of year.

- **Where:** <https://www.jvt.me/post-frequency/>
- **Who:** Jamie Tanna
- **JS:** **Required.** Chart.js plus four `<canvas>` elements fetching a
  build-generated JSON file.
- **Fit:** The *datasets* are the interesting part and they are already static
  at build time. The same four rhythms could be four rows of CSS bars with no
  Chart.js at all. Worth citing as "the idea, not the implementation".

---

## 3. Techniques for rendering without JavaScript

### CSS Grid + custom properties bar chart
Data as a `<dl>`, each bar's size set by an inline `--value`, translated by
Grid and `calc()`.

- **Where:** <https://css-tricks.com/css-charts-grid-custom-properties/>
- **Who:** Miriam Suzanne
- **JS:** None.
- **A11y:** Readable as plain text, but a `<dl>` has no chart semantics in the
  accessibility API. Accessible by virtue of its text, not its structure.
- **Fit:** This is essentially the pattern already used for the month dots,
  generalised to bars.

### Build-time SVG from an Eleventy shortcode
A plain function in `eleventy.js` that takes an array and returns an SVG
string. Output ships as static inline SVG.

- **Where:** <https://www.11ty.dev/docs/languages/nunjucks/> · <https://chriskirknielsen.com/blog/manage-your-svg-files-with-eleventys-render-plugin/>
- **Who:** Eleventy core docs (Zach Leatherman); pattern write-up by Chris Kirk-Nielsen
- **JS:** Build-time only.
- **A11y:** Add `role="img"` plus `<title>`/`<desc>`, or pair with a real table.
- **Fit:** **Recommended default for any new mark**, ahead of reaching for a
  library. Full control, zero runtime cost.

### `<details>`/`<summary>` to disclose the underlying numbers
Native disclosure with keyboard support and exposed state, no ARIA needed.

- **Where:** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details> · <https://www.scottohara.me/blog/2022/09/12/details-summary.html>
- **Who:** HTML Living Standard; accessibility analysis by Scott O'Hara
- **JS:** None.
- **Fit:** A good answer to "where do the raw numbers live?" — tuck the twelve
  monthly counts into a `<details>` under the timeline. Give the `<summary>` a
  specific label, not "Details".

### `repeating-linear-gradient()` for ruled backgrounds
Already in use for the graph-paper ground. Listed for completeness.

- **Where:** <https://css-tricks.com/almanac/functions/r/repeating-linear-gradient/>
- **JS:** None. Decorative, so a11y-neutral provided it never carries meaning alone.

### `conic-gradient()` for proportion rings
- **Where:** <https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/conic-gradient>
- **JS:** None if the gradient string is computed at build time.
- **A11y:** MDN is explicit that gradients carry no semantics and should not be
  used for real infographics without an adjacent table or text summary.

### Typed `attr()` charts — frontier, not yet dependable
Semantic `<table>` plus CSS reading numeric `data-*` values directly.

- **Where:** <https://dev.to/madsstoumann/charts-in-css-1di1> (June 2025)
- **Who:** Mads Stoumann
- **JS:** None for core rendering, but the author notes Safari and Firefox
  lacked typed `attr()` at time of writing, so responsive resizing needs a JS
  fallback there. Browser support not independently re-checked.

### Things to avoid
- **CSS `attr()` tooltips** (<https://davidwalsh.name/css-attr-content-tooltips>,
  David Walsh): `content` generated by CSS is inconsistently announced by
  screen readers, and hover-only reveal excludes touch. Fine as a visual
  flourish over text that is already present; never as the only home for a value.
- **Checkbox hack / `:target` toggles**: no focus management, no `Escape`, no
  `aria-expanded`. Prefer `<details>`. Background:
  <https://www.smashingmagazine.com/2021/06/css-javascript-requirements-accessible-components/>
- **Eleventy's hosted sparkline service** — the Eleventy docs themselves mark
  it deprecated (<https://www.11ty.dev/docs/services/sparklines/>), and the
  `sparkline-svg` package it points to was last released around seven years
  ago. Use a build-time shortcode instead.

---

## 4. The idiom, and the honest-encoding cautions

### Sparklines
Tufte coined the term in *Beautiful Evidence* (2006) for a small, word-sized
graphic meant to sit inline with text at the scale of a letter, not pulled out
into a captioned figure.

- **Where:** <https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/> · <https://www.edwardtufte.com/notebook/sparklines-history-by-tufte-1324-to-now/>
- **Who:** Edward Tufte
- **Fit:** The direct ancestor of the marks already here.

### Sparklines in financial tables — one mark per row
Tufte's proposed newspaper stock-table redesign: a sparkline per row, hundreds
of thousands per page, exploiting print resolution.

- **Where:** as above
- **Fit:** A near-literal precedent for a tiny per-post mark in an index view
  without it becoming a dashboard.

### Data-ink ratio
Erase non-data ink; erase redundant data ink. A test for whether a line is
carrying information or just decorating.

- **Where:** <https://jtr13.github.io/cc19/tuftes-principles-of-data-ink.html> (secondary summary; the 1983 book is the primary source)
- **Who:** Edward Tufte

### Small multiples
The same graphic repeated, indexed by one changing variable, so the reader
learns the chart once and then reads only the differences.

- **Where:** <https://en.wikipedia.org/wiki/Small_multiple>
- **Who:** Tufte coined the term; antecedents in Walker's census atlases and Muybridge

### Cleveland & McGill's perceptual hierarchy — **the important one**
Their 1984 study ranked how accurately people judge visual encodings: position
on a common scale is most accurate, then length, then angle, with **area near
the bottom**. This is the empirical basis for distrusting size-encoded marks.

- **Where:** <https://creativeartsadventure.wordpress.com/2017/01/02/cleveland-mcgill-graphical-perception-theory-experimentation-and-application-to-the-development-of-graphical-methods/> (secondary summary; original in *JASA*)
- **Who:** William S. Cleveland and Robert McGill

### Isotype — repeat, don't resize
Neurath and Arntz's rule: show quantity by repeating a same-sized icon rather
than enlarging one, because enlarging conflates height, area and volume.

- **Where:** <https://en.wikipedia.org/wiki/Isotype_(picture_language)>
- **Who:** Otto Neurath (concept), Gerd Arntz (graphics)

### Banking to 45°
Cleveland's aspect-ratio rule: size a line chart so segments average roughly
45°, which maximises judgement of rate-of-change. A rule of thumb, not a formula.

- **Where:** <https://blogs.sas.com/content/iml/2016/01/20/banking-to-45-aspect-ratio-time-series.html>
- **Who:** William S. Cleveland

### Sparkline scale honesty
Because a sparkline's vertical scale is invisible, readers assume adjacent
sparklines share a scale — and a "flat" one may just be a large series
compressed. Few's fix is a visible reference band.

- **Where:** <https://www.perceptualedge.com/articles/visual_business_intelligence/best_practices_for_scaling_sparklines.pdf>
- **Who:** Stephen Few

### Tables beat charts at small n
For a few hundred items, an aligned table is often faster and more precise than
any chart.

- **Where:** <https://verstaresearch.com/blog/try-using-tables-instead-of-charts/>
- **Who:** Versta Research, citing Tufte

### Data humanism — permission to be irregular
Lupi and Posavec's *Dear Data* (2014–15): a year of hand-drawn weekly postcards
of personal data, now in MoMA's collection. Lupi's "Data Humanism" manifesto
argues against templated charts in favour of complexity and context.

- **Where:** <http://giorgialupi.com/dear-data> · <http://giorgialupi.com/data-humanism-my-manifesto-for-a-new-data-wold> (the "wold" typo is the site's own)
- **Who:** Giorgia Lupi and Stefanie Posavec
- **Fit:** A counterweight to a strict grid — permission for one personal,
  slightly irregular mark somewhere.

### Engineering drawing conventions
Title blocks in fixed positions, tolerance callouts, standardised line weights
— a vocabulary built so information is unambiguous without prose. The register
this site is named after.

- **Where:** <https://www.mcgill.ca/engineeringdesign/step-step-design-process/basics-graphics-communication/drawing-format-and-elements> (McGill teaching resource; returns 403 to automated fetches, loads in a browser)
- **Who:** Convention, codified in ISO/ASME drafting standards

### Field-guide notation
Peterson's field marks point at the distinguishing feature, paired with a
same-scale range map — compact standardised marks for fast comparison across
many similar entries.

- **Where:** <https://en.wikipedia.org/wiki/Peterson_Field_Guides>
- **Who:** Roger Tory Peterson

### Word clouds
Harris's argument: they conflate frequency with importance, encode magnitude
through font size (the weak channel above), and strip context.

- **Where:** <https://www.niemanlab.org/2011/10/word-clouds-considered-harmful/> (403 to automated fetches; live in a browser)
- **Who:** Jacob Harris, writing for Nieman Journalism Lab

---

## 5. Where this research challenges what is already built

Worth stating plainly rather than burying:

**The month dots are size-encoded, and size is a weak channel.** Cleveland &
McGill put area near the bottom of the accuracy hierarchy, and Isotype's whole
rule is *repeat, don't resize*. By both, the stacked-tick strip that the dots
replaced — where each entry was one countable tick — was the more honest
encoding.

Mitigations already in place: the dots scale by **area**, not diameter, which
is the correct form of the compromise; and every month carries a tooltip and
hidden text with the exact count, so the precise value is one hover away and
always present for assistive tech.

The dots were an explicit design choice for quietness over precision, and for
an ambient mark that is not the primary way anyone reads the archive, that is
a defensible trade. But it *is* a trade. If precision ever matters more than
calm, repeating fixed-size ticks is the better-founded option.

---

## Could not verify

- **`timharek.no/stats/`** — whether it carries the square grid, or only
  numeric tables. The grid is credited to Knight/Photogabble only.
- **Photogabble's owner display name** — not confirmed beyond the site handle.
- **`niemanlab.org`, `mcgill.ca`, `npmjs.com`, `cloudfour.com`** — return 403
  to automated requests including a browser user-agent. This is bot-blocking,
  not a dead page; content and attribution corroborated via search indexing.
- **Typed `attr()` browser support** — taken from Stoumann's own June 2025 note,
  not independently re-checked against caniuse.
- **Lupi's manifesto principles** — paraphrased from the page, not transcribed
  verbatim.
- **`@chrisburnell/svg-sparkline`** — excluded regardless of maintenance status,
  because it is a client-side Web Component and needs JS to render at all.
- No verified personal-site example was found for a "days since last post"
  counter, a Project 365 CSS calendar, or a native no-JS reading/watching
  rating grid. Searches surfaced only tutorials and JS widget services.

## A note on one source

While fetching <https://adactio.com/archive/>, the research agent's fetch
returned content that appeared to contain an embedded prompt-injection string
and a roleplay instruction aimed at the AI reading it. The agent did not act on
it and excluded the page. It could not confirm whether that text is genuinely
on Jeremy Keith's page or was an artefact of the fetch tooling — the latter
seems more likely, and no conclusion should be drawn about the site. Recorded
here only so the exclusion is explained rather than silent.
