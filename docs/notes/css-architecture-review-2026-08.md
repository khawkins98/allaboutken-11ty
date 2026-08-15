# CSS architecture review — August 2026

Scope: `src/components/vf-componenet-rollup/` + `src/components/kh-ambience/`, measured
against the built site at `build/` (336 HTML pages, `build/css/styles.css` 137,368 bytes).

---

## Executive summary

The stylesheet is in good shape and the growth is largely earned. Measured against
the built site, **1.9 KB of 125 KB of rule text is genuinely dead — 1.5%**. That is
an unusually low number for a six-year-old personal site and it is the headline
finding: there is no accumulation problem to solve here.

Duplication is likewise near-absent: two repeated declaration runs in the whole
codebase, and four selectors that silently lose to a later copy of themselves.

What the measurement did surface is smaller and sharper than "weight": a handful of
**silently inert declarations**. Three colour custom properties are read but never
defined, so six declarations across 15 live pages resolve to `unset` — a missing
border on `/blog` pagination, a missing background on the CV metrics. A `.kh-bleed-out`
rule is fully overridden by a later media block. Three `.kh-navigation` rules in
`_kh-datasheet.scss` lose to re-declarations in `index.scss`. All are the same
failure mode CLAUDE.md already documents for `--kh-cluster-margin`.

Payload is a non-issue: 134 KB uncompressed is 21 KB gzipped, 17 KB brotli. The
`body:has(...)` prefix costs 32 KB uncompressed and effectively nothing on the wire.

`index.scss` at 1,783 lines is the one place with a real structural drift, but the
cheap fix is ordering discipline, not a file split.

---

## Findings, ranked by value / effort

### 1. Three custom properties are read but never defined — 6 broken declarations on live pages

**Effort: 15 minutes. Highest value in the review.**

Evidence — these appear in `var()` with **no fallback** and have no definition anywhere
in the Sass:

| Property | Read at | Live pages affected |
|---|---|---|
| `--kh-color--text` | `index.scss:1337`, `:1409`, `:1441` | 2 (CV, homepage quote) |
| `--kh-color--yellow--lightest` | `index.scss:1395` | 2 |
| `--kh-color--grey--lightest` | `index.scss:1433`, `:1578` | 13 (`.kh-pager`) |

A `var()` with no fallback and no definition is *invalid at computed-value time*: the
declaration resolves to `unset`. Consequences, in order of visibility:

- `index.scss:1578` — `.kh-pager { border-top: 1px solid var(--kh-color--grey--lightest) }`.
  `border-top` is not inherited, so `unset` = `initial` = **no rule renders**. The
  pagination separator is missing on all 13 paginated pages.
- `index.scss:1395` — `.kh-metric { background: var(--kh-color--yellow--lightest) }`
  resolves to `transparent`. The CV metric tiles have no fill.
- `index.scss:1433` — `.kh-snapshot-list li` bottom rules do not render.
- The three `color:` cases are benign, because `color` inherits and `unset` = `inherit`
  lands on roughly the intended `#222` anyway. That is luck, not design.

Verified present in the compiled output at `build/css/styles.css:4186`, `:4229`,
`:4261`, `:4360`.

**Change:** define the three tokens next to the existing palette in the
`body:has(#kh-css-toggle:checked)` block (`index.scss:36–56`). `--kh-color--text: #222`
is the obvious value — see finding 4, where `#222` is already hardcoded 19 times.
For the two `--lightest` tones the existing literals `#f5f5f4` / `#d0d0ce` / `#e0ddd8`
are the candidates; pick one of each and use it.

**Prevention:** a stylelint rule cannot catch this, but a five-line build assertion can —
extract every `var(--x)` without a fallback from `build/css/styles.css`, extract every
`--x:` definition, and fail on the difference. That check would have caught all six.
Note there are also 22 properties read but never defined *by design* (`--kh-from`,
`--kh-strength`, `--kh-bar`, `--kh-slot-width` and friends in the dataviz partial),
set from inline `style=` in templates. They all carry fallbacks, so the check should
only flag fallback-less reads.

---

### 2. Four rule pairs where a later copy silently wins — the header and nav

**Effort: 30 minutes, plus a visual check of the masthead.**

`index.scss` `@include`s the partial mixins at lines 27–34 and then emits its own
rules from line 36 onward. So **anything `index.scss` declares beats the identical
selector in any partial**, regardless of which file reads as more specific.

Four selectors are declared twice in the same media context with overlapping properties:

| Selector | Loses at | Wins at | Properties lost |
|---|---|---|---|
| `.kh-global-header` | `_kh-datasheet.scss:286` | `index.scss:735` | `gap: 0`, `padding: 0` |
| `.kh-navigation` | `_kh-datasheet.scss:309` | `index.scss:1255` | `display: flex` (→ `block`) |
| `.kh-navigation__list` | `_kh-datasheet.scss:314` | `index.scss:1264` | `height: 100%` |
| `.kh-navigation__item` | `_kh-datasheet.scss:322` | `index.scss:1260` | `display: flex` (→ `inline-flex`) |

Two things make this worth fixing rather than shrugging at:

- The comment at `_kh-datasheet.scss:284` says *"Horizontal padding lives at 0 here AND
  in the later `.kh-global-header` rule in index.scss, which would otherwise win"* — so
  the padding duplication is deliberate and documented. But `gap: 0` on the same rule
  is **not** duplicated, and loses to `gap: var(--kh-page-grid-gap)`. The masthead has
  a gap the datasheet design explicitly asked it not to have. Half the fix was done and
  the other half was not noticed.
- `height: 100%` on `.kh-navigation__list` is what makes the nav cells full-height
  against the 2px masthead rule. It is currently inert.

**Change:** decide which file owns the header and nav — the datasheet mixin is the
better home, since that is where the masthead's whole visual register lives — and
delete the loser. Do this **before** any reordering of `index.scss` (finding 6), because
moving `.kh-navigation` earlier in `index.scss` would flip which rule wins and change
the rendering. That interaction is the reason this is ranked above the file split.

---

### 3. A `.kh-bleed-out` media block that can never apply

**Effort: 10 minutes.**

`index.scss:198–207` sets, at `min-width: $kh-breakpoint--lg` (1024px):

```scss
.kh-bleed-out { margin-left: -46%; margin-right: 0; }
```

`index.scss:209–226` then sets, at `@media (width >= 767px)`:

```scss
.kh-bleed-out { margin-left: -22%; margin-right: 0; }
```

Equal specificity, later source order, and 767px is a subset of 1024px — so **the
`-46%` rule never applies at any viewport width**. Confirmed in the compiled output at
`build/css/styles.css:3301–3315`.

The long comment at `index.scss:210–221` documents verification "390 to 1800" for the
`-22%` value, so the site is behaving as intended; `-46%` is simply a leftover that
now reads as live configuration. Worse, it is a trap: the next person to widen the
bleed will edit the `-46%` and see nothing change.

Also note `@media (width >= 767px)` is a magic number outside the breakpoint scale in
`_settings.scss`. The nearest token is `$kh-breakpoint--md` (846px).

**Change:** delete `index.scss:202–205`. Separately, decide whether 767 is meaningful;
if not, move it to `$kh-breakpoint--md`.

---

### 4. The token layer exists and is bypassed 21+ times

**Effort: 30 minutes, mechanical, low risk.**

87 hex literals appear outside custom-property definitions. 27 are distinct. The
concerning subset is literals that **duplicate a token that already exists**:

| Literal | Occurrences | Existing token |
|---|---|---|
| `#373a36` | 6 | `--kh-color--grey--darkest` (`index.scss:37`) |
| `#3b6fb6` | 5 | `--kh-color--blue` (`index.scss:38`) |
| `#707372` | 5 | `--kh-color--grey` (`index.scss:36`) |
| `#193f90` | 3 | `--kh-color--blue--dark` (`index.scss:39`) |
| `#fffae1` | 2 | `--kh-ground` (`index.scss:44`) |

Plus `#222`, used **19 times** as the de-facto body ink with no token at all — which is
the same gap as finding 1's `--kh-color--text`. Fixing finding 1 by defining
`--kh-color--text: #222` gives all 19 a home in one move; that is why the two should
be done together.

One genuine inconsistency worth resolving while in there: visited-link purple is
`#563d82` in six places (`index.scss:650`, `:654`, `:882`, `:886`, …) and `#734595`
in one (`index.scss:131`). Two purples for the same semantic state.

**Change:** replace the 21 token-duplicating literals with `var()`, define
`--kh-color--text`, pick one visited purple. Do not chase the remaining literals —
see "not worth doing".

---

### 5. Ship compressed CSS

**Effort: 5 minutes (one flag). Genuine trade-off, read below.**

`package.json:17` compiles with no `--style` flag, so the output ships with all
5,936 bytes of source comments and full whitespace.

| | uncompressed | gzip | brotli |
|---|---|---|---|
| current | 137,368 | 21,046 | 17,208 |
| `--style=compressed` | 114,831 | 17,131 | 14,489 |
| saving | −16% | −19% | −16% |

`build/index.html` loads it as a plain render-blocking `<link rel="stylesheet">`, so
this is on the critical path for every page.

**The trade-off is real and yours to make.** This site ships a CSS-free viewing toggle
and 36 comment blocks in `index.scss` that read as design documentation. Minifying
means a reader who views source gets a wall. 2.7 KB brotli is not much to buy that
with. If you want both, minify to `build/css/styles.css` and also copy the unminified
file to a stable path linked from the style guide.

Unrelated but adjacent: `postcss@^8.5.23` is in `devDependencies` (`package.json:46`)
and referenced nowhere in `eleventy.js`, `config/`, or any script. Removable.

---

### 6. `index.scss` is not a drawer, but it has three ordering regimes

**Effort: 1–2 hours for consolidation only; a full split is 4+ hours and is not recommended.**

The file is 1,783 lines and grew from 1,190 in six months. Reading it top to bottom,
it is more coherent than the line count suggests — but it has drifted into three
regimes:

1. **12–330** — global scope: pre-toggle `html` rules, the token block, `body`, element
   defaults, print/visibility utilities, `.kh-bleed-out`, `.kh-video`. Coherent.
2. **331–1327** — components, in **two separate alphabetical runs**. The first runs
   `.kh-badge` → `.kh-summary` → header/footer → text scale → `.kh-u-*` (line 1077).
   The second restarts at `.kh-box` (1081) and runs to `.kh-u-text--nowrap` (1327).
3. **1330–1783** — append-only. Featured quotes, CV metrics, career snapshot, feedback
   toast, `.kh-details`, pager, print block, `.kh-compare`. Chronological, not alphabetical.

The cost of the two-run structure is concrete, not aesthetic: **the same component is
declared in two places.**

- `.kh-navigation__link` at `553–578`, `.kh-navigation` / `__item` / `__list` at `1255–1271`
- `.kh-summary` block at `580–727`, `.kh-summary__image` at `1288–1307`
- `.kh-badge` at `373`, `.kh-badges` / `.kh-badge__link` at `1166–1188`
- `.kh-u-*` at `999–1077` and again at `1309–1327`

That split is how finding 2 happened: `.kh-navigation` ended up 700 lines away from
`.kh-navigation__link`, in the second run, past the point where anyone comparing it
against `_kh-datasheet.scss` would look.

**Recommended change (the cheap half):** merge the second alphabetical run into the
first so each component appears once, and leave the append-only tail alone. Roughly
250 lines move. **Do finding 2 first** — reordering changes which rule wins against
the partial mixins, and the nav is already contested.

**Not recommended (the expensive half):** splitting into `_kh-nav.scss`,
`_kh-summary.scss`, `_kh-button.scss`, `_kh-compare.scss`, `_kh-cv.scss`,
`_kh-utilities.scss`. It would take `index.scss` to roughly 900 lines, but every
partial must be wrapped in a mixin and `@include`d **in exactly the right order**,
because the cascade here is source-order-dependent by design. That is 4+ hours with a
real regression surface and no functional gain. If you ever do it, extract
`.kh-compare` (1669–1783) and the CV block (1330–1447) first: both are self-contained,
neither is contested by any partial, and both are trivially verifiable because they
appear on 3 and 2 pages respectively.

---

### 7. Dead CSS: 1.9 KB of 125 KB (1.5%)

**Effort: 15 minutes. Low value — reported because it is the number you asked for.**

Method: extracted all 839 class-bearing rules from `build/css/styles.css`; extracted
every `class` attribute token from all 336 built HTML pages; a rule counts as reachable
if any of its comma-separated parts has all its required classes (ignoring classes that
only appear inside `:not()`) present together on at least one page. Then cross-checked
unreachable rules against `build/*.js`, all inline `<script>` blocks, and every `.njk`
in `src/`.

| | count | bytes |
|---|---|---|
| class tokens in CSS | 397 | |
| present in built HTML | 378 | |
| applied at runtime by JS | 16 | |
| never matchable rules | 50 | 7.7 KB |
| — of which JS-applied state | 28 | 4.7 KB |
| — of which genuinely dead | 22 | **1.9 KB (1.5%)** |

The 28 JS-applied are correct and should stay: `is-highlighted`, `has-highlight`,
`is-related`, `is-pair`, `is-visible` (`story-lab.js`), `.kh-ask__*`
(`semantic-search.js:19`, a template literal — `--status` is produced by the
`addMessage('status', …)` calls at `:114` and `:119`), and `.kh-search-count` /
`.kh-search-more` (set via `className` at `search.njk:204` and `:208`).

The genuinely dead, all of them:

| Selector | Source | Bytes | Note |
|---|---|---|---|
| `.kh-u-show-for-medium-only` / `--medium-up` / `--mobile-only` (7 rules) | `index.scss:180–195`, `1298`-ish | ~660 | documented in `style-guide/components.njk:1445`, used nowhere — **and buggy, see below** |
| `.kh-box__text a` + states (3 rules) | `index.scss:489–504` | ~610 | documented at `components.njk:552`, used nowhere |
| `.kh-link` + 3 states | `index.scss:1211–1231` | ~440 | documented at `components.njk:1466`, used nowhere |
| `.kh-trail__node--digesting` | `_kh-story-lab.scss` | 134 | |
| `.kh-topic-child__sep` | `_kh-datasheet.scss` | 93 | |

Three of these five are *documented API in the style guide*, which is a defensible
reason to keep them. The two that are not — `.kh-trail__node--digesting` and
`.kh-topic-child__sep` — are 227 bytes and look like variants that were designed and
then not used.

**The show-for utilities have an off-by-one that makes them wrong as well as unused.**
`index.scss:186` hides `.kh-u-show-for-medium-up` at `max-width: $kh-breakpoint--sm`
(600px) while `:192` hides `.kh-u-show-for-mobile-only` at `min-width:
$kh-breakpoint--sm` (600px) — so at exactly 600px **both are hidden**. Same pattern at
md and lg. `_settings.scss` defines `--sm-down` / `--md-down` / `--lg-down` precisely
to avoid this, and they are used correctly elsewhere in the file (`index.scss:241`,
`:258`, `:292`). Either switch the four `max-width` queries to the `-down` variants, or
delete the utilities and their style-guide row.

---

### 8. Duplication: essentially none

**No action recommended. Recorded so it is not re-investigated.**

Scanning for repeated runs of four or more identical declarations across all nine
partials found exactly two:

- `_kh-datasheet.scss:519–522`, `:560–563`, `:861–864` —
  `border-top: 1px solid var(--kh-rule--strong); list-style: none; margin: 0; padding: 0`
  on three list roots. Four lines, three times. A shared placeholder would save eight
  lines and cost a level of indirection.
- `_semantic-search.scss:81–84` and `:111–114` — a shared rule/heading treatment,
  twice.

Both are below the threshold where abstraction pays. Near-identical *variants* that
suggest a missing abstraction: I looked for these specifically in `_kh-story-lab.scss`
(1,129 lines) and `_kh-datasheet.scss` (1,132 lines) and did not find any. Both files
are large because they describe genuinely large components, not because they repeat
themselves.

---

### 9. Specificity and the cascade: healthy

**No action beyond findings 2 and 3.**

- `!important` appears **7 times** in 6,111 lines. Five are the `display: none` visibility
  utilities (`index.scss:176–200`) where it is the conventional choice; one is
  `_kh-ambience.scss:189` under `prefers-contrast: high`, which is defensible; one is
  `_kh-content.scss:61` (`> :first-child { margin-top: 0 !important }`), the standard
  first-child margin reset. The eighth, `_semantic-search.scss:263`, sits on a rule
  that is JS-applied and is redundant with the sibling rule two blocks down — remove it
  when convenient. This is a low-`!important` codebase and the CLAUDE.md incident
  clearly changed behaviour.
- Nesting is genuinely flat; stylelint's `max-nesting-depth: 1` is doing its job.
- The `body:has(#kh-css-toggle:checked)` prefix adds (0,2,1) uniformly to every rule.
  Because it is uniform it does **not** create specificity contests — it shifts the whole
  system up by a constant. It is the cheapest possible implementation of the feature.
  The only real cost is that a third-party or inline style now needs unusual force to
  win, and that has not bitten anything I can find.

**One thing that is not a cascade bug but reads as one.** `index.scss:120–121`:

```scss
a,
a:not([class*='kh-']) { … }
```

The bare `a` already matches everything the `:not()` matches, so the second half is
inert — 2 such selectors in the compiled output, and they are the only two. This
matters less for the ~200 wasted bytes than for what it says: the rule *announces* a
`kh-` opt-out that it does not implement. Every `.kh-*` link on the site inherits
`color: #333` and the blue underline from this rule, and each component that wants
different link colour has to override it. Compare `_kh-content.scss`, which uses the
pattern correctly (43 occurrences, always as the sole selector) — there, `:not([class*='kh-'])`
genuinely does let a `kh-` component opt out of editorial-prose defaults, which is the
right design. `index.scss:120` is the one place the pattern is written without
understanding what it does.

**Change:** either drop the `:not()` half (honest: this is a global default), or drop
the bare `a` (makes the opt-out real, but will change the appearance of every `kh-`
link — needs a visual pass). Do not leave it as-is.

---

### 10. Payload: fine, and the 134 KB figure is misleading

**No action beyond finding 5.**

| measure | value |
|---|---|
| uncompressed | 137,368 B |
| gzip | 21,046 B |
| brotli | 17,208 B |
| of which the `body:has(...)` prefix | 992 occurrences × 33 B = **32,736 B uncompressed (23.8%)** |

The toggle prefix is nearly a quarter of the uncompressed file and costs approximately
nothing over the wire — it is a perfectly repeating string, which is the best case for
any compressor. **Do not treat the 134 KB number as the site's CSS weight; 17 KB is.**

Per-page utilisation, computed by the same reachability method as finding 7:

| page | matchable rule bytes | share |
|---|---|---|
| `/` | 38.3 KB | 31% |
| a typical post | 40.5 KB | 32% |
| median across 60 posts | — | 38% |

So a typical page uses about a third of the rules. That sounds bad and is not: the
unused two-thirds costs roughly 11 KB brotli, spread across a stylesheet that is cached
after the first page view. The largest single lever would be `_kh-story-lab.scss` —
27.7 KB, 20.6% of the compiled output, and **87 of its 91 classes appear on three or
fewer pages**. Splitting it out is discussed and rejected below.

Byte attribution by source (via the source map):

| file | KB | share |
|---|---|---|
| `index.scss` | 39.3 | 29.3% |
| `_kh-story-lab.scss` | 27.7 | 20.6% |
| `_kh-datasheet.scss` | 21.1 | 15.7% |
| `_kh-content.scss` | 16.3 | 12.1% |
| `_kh-dataviz.scss` | 13.0 | 9.7% |
| `_semantic-search.scss` | 7.3 | 5.4% |
| `_kh-ambience.scss` | 3.4 | 2.6% |
| `normalize.scss` | 2.6 | 1.9% |
| `_kh-photos.scss` | 1.5 | 1.1% |

---

## Not worth doing

Recorded with reasons so these are not re-litigated.

**Splitting `_kh-story-lab.scss` (or any partial) into a per-template stylesheet.**
It is the most tempting number in the review — 20.6% of the output for a handful of
pages. But 20.6% of 17 KB brotli is **~3.5 KB**, on pages that are already the heaviest
on the site in every other respect. It costs a second Sass entry point, a conditional
`<link>` in `base.njk`, a second cache entry, and a new way for the CSS-free toggle to
be half-applied. The same argument disposes of `_kh-photos.scss` (1.5 KB, 2 pages) and
`_semantic-search.scss` (7.3 KB, 47 pages) — both are too small to be worth a second
request.

**Removing or re-implementing the `body:has(#kh-css-toggle:checked)` scope.**
Out of scope by instruction, but for the record: measured, it is the right
implementation. 32 KB uncompressed, ~0 KB compressed, uniform specificity shift, no
contests created. There is no cheaper way to get the same result — a `@scope` rule or
a class on `<html>` would need JavaScript and would lose the no-JS property that makes
the toggle interesting.

**A full `index.scss` file split.** See finding 6. The cascade here is source-order
dependent by design, so the split is not the mechanical operation it appears to be.
4+ hours, real regression risk, no functional gain. The 1,783 lines are not the problem;
the two interleaved alphabetical runs are, and merging them is 1–2 hours.

**Adding PurgeCSS / a coverage step to the build.** With 1.5% dead CSS the tool would
find nothing, and it would be actively dangerous: 28 of the 50 unreachable rules are
JS-applied state classes that any static analyser would delete. The manual measurement
in finding 7 is repeatable in about twenty minutes when it is next wanted; automating
it would cost more than it returns.

**Extracting the two duplicated declaration runs (finding 8) into placeholders.**
Two occurrences of four lines is below the threshold where a `%placeholder` pays for
the indirection.

**Chasing the remaining hex literals.** 87 total, of which only ~21 duplicate an
existing token (finding 4). The rest — the `#54585a` in the search-cancel SVG data URI,
one-off chart inks in `_kh-dataviz.scss`, `#fff`/`#000` — are genuinely local and
tokenising them would create dead tokens, which is the failure mode in the opposite
direction. `--kh-color--orange` (`index.scss:54`, an explicitly deprecated alias) and
`--box-text-color` (`index.scss:1082`) are already defined-but-never-read; that is two
too many, not a pattern to extend.

**Consolidating the 29 `@media` blocks in `index.scss` into fewer, grouped blocks.**
Tempting for tidiness. But media queries gzip extremely well and, more importantly,
consolidation *moves rules*, which in a source-order-dependent cascade is exactly the
operation that caused findings 2 and 3. Not worth the risk for zero measurable gain.

---

## Suggested order of work

| # | Item | Effort |
|---|---|---|
| 1 | Define `--kh-color--text` / `--grey--lightest` / `--yellow--lightest` (finding 1) | 15 min |
| 2 | Add the fallback-less-`var()` build assertion (finding 1) | 30 min |
| 3 | Resolve the `.kh-global-header` / `.kh-navigation` duplicates (finding 2) | 30 min |
| 4 | Delete the dead `.kh-bleed-out` `-46%` block (finding 3) | 10 min |
| 5 | Fix or delete the `.kh-u-show-for-*` off-by-one (finding 7) | 15 min |
| 6 | Replace the 21 token-duplicating hex literals (finding 4) | 30 min |
| 7 | Decide on `--style=compressed`; drop unused `postcss` (finding 5) | 15 min |
| 8 | Resolve `a, a:not([class*='kh-'])` (finding 9) | 20 min |
| 9 | Merge the second alphabetical run into the first (finding 6) — **after step 3** | 1–2 h |

Steps 1–8 are about two and a half hours total and fix every measured defect in the
stylesheet. Step 9 is optional maintenance.
