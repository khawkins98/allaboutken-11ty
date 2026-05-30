# CSS architecture

---

## Sass entry point

All styles are compiled from a single entry point:

```
src/components/vf-componenet-rollup/index.scss
```

> **Note:** the directory name `vf-componenet-rollup` (with the transposed letters in "component") is a legacy typo. **Do not rename it** — renaming would break the build and any tooling that references the path by name.

The entry point uses `@use` (not `@import`) to pull in partials:

| Partial | Purpose |
|---|---|
| `normalize` | CSS normalisation reset |
| `kh-content` | Main content and layout styles |
| `settings` | Breakpoint and colour variables |
| `semantic-search` | Search UI styles |
| `../kh-ambience/kh-ambience` | Ambient / background styles |

---

## CSS-free viewing mode

The entire custom stylesheet is scoped under a single root selector:

```scss
body:has(#kh-css-toggle:checked) {
  /* all custom styles go here */
}
```

A visually-hidden checkbox (`#kh-css-toggle`) in the page controls whether styles are applied. When unchecked, the page renders with only browser defaults, enabling a "CSS naked" / accessible view.

**This means every new style rule must be written inside the `body:has(#kh-css-toggle:checked)` block.** Rules placed outside this scope will apply unconditionally and break the CSS-free mode.

The only exceptions are rules that must apply regardless of the toggle, such as `html { scroll-behavior: smooth }` and `@media (prefers-reduced-motion)` which appear before the root selector in `index.scss`.

---

## Breakpoints

Breakpoint variables are defined in `_settings.scss`:

| Variable | Value |
|---|---|
| `$kh-breakpoint--sm` | `600px` |
| `$kh-breakpoint--md` | `846px` |
| `$kh-breakpoint--lg` | `1024px` |
| `$kh-breakpoint--xl` | `1300px` |
| `$kh-breakpoint--sm-down` | `599px` (one below sm) |
| `$kh-breakpoint--md-down` | `845px` (one below md) |
| `$kh-breakpoint--lg-down` | `1023px` (one below lg) |

Use `@media (min-width: $kh-breakpoint--md)` for mobile-first breakpoints.

---

## Nesting and selector limits

The Stylelint configuration enforces:

- **Max nesting depth: 1** for regular rules. Blockless at-rules (`@media`, `@supports`) are exempt and do not count toward the depth.
- **Max compound selectors: 3** per rule.
- **Number precision: 4** decimal places.

Keep selectors flat. Nest only when there is a direct parent–child relationship that cannot be expressed otherwise.

---

## Adding new styles

1. Open (or create) the relevant partial under `src/components/vf-componenet-rollup/`.
2. Place all rules inside the `body:has(#kh-css-toggle:checked)` mixin or block. If you are adding to a partial that is `@include`d by `index.scss`, your rules are already inside that scope as long as you follow the existing file structure.
3. Use `@use` to import any settings variables you need — do not use `@import`.
4. Run `yarn lint:css` before committing to catch nesting depth, compound-selector, and duplicate-selector violations.
5. Run `yarn sass` (or `yarn dev`) to verify the compiled CSS is valid.

---

## Linting

```bash
yarn lint:css         # check all SCSS/CSS files
yarn lint:css:fix     # auto-fix fixable violations
```

The linter is configured in `.stylelintrc.json` using `stylelint-config-recommended-scss` and `@stylistic/stylelint-plugin`.
