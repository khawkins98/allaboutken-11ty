/**
 * Fail the build on a custom property that is read without a fallback and
 * never defined.
 *
 * Why this exists: `var(--x)` with no fallback and no definition is invalid at
 * computed-value time, so the whole declaration resolves to `unset`. Nothing
 * warns. The rule sits in the compiled CSS looking correct and simply does not
 * render, which is the same failure mode CLAUDE.md records for `.kh-cluster`.
 *
 * An August 2026 audit found six of these. The visible damage was a missing
 * `border-top` on `.kh-pager` across 13 paginated pages and no fill on the CV
 * metric tiles. Three more were `color:` declarations that looked fine only
 * because `color` inherits, so `unset` meant `inherit` and landed near the
 * intended value by luck.
 *
 * The subtlety this check has to get right: several properties are read in the
 * stylesheet and set from inline `style=` attributes emitted by templates at
 * build time, never defined in the CSS at all. `--kh-track-width` and friends
 * in the dataviz partial are legitimate. So a read counts as satisfied if the
 * property is defined anywhere in the CSS *or* set inline anywhere in the
 * built HTML. Checking only the CSS would flag six false positives and get
 * this check switched off within a week.
 *
 * Reads that carry a fallback -- `var(--x, 1rem)` -- are always fine and are
 * not matched here.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const CSS = 'build/css/styles.css';
const BUILD = 'build';

function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

const css = readFileSync(CSS, 'utf-8');

// Only fallback-less reads: `var(--x)` and not `var(--x, …)`.
const read = new Set([...css.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((m) => m[1]));
const definedInCss = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

const unresolved = [...read].filter((name) => !definedInCss.has(name));

// Second chance: set from an inline style attribute in any built page.
const setInline = new Set();
if (unresolved.length) {
  for (const file of htmlFiles(BUILD)) {
    const html = readFileSync(file, 'utf-8');
    for (const name of unresolved) {
      if (!setInline.has(name) && html.includes(`${name}:`)) setInline.add(name);
    }
    if (setInline.size === unresolved.length) break;
  }
}

const broken = unresolved.filter((name) => !setInline.has(name));

if (broken.length) {
  console.error(`\n❌ ${broken.length} custom propert${broken.length === 1 ? 'y is' : 'ies are'} read without a fallback and never defined:\n`);
  for (const name of broken) {
    const lines = css
      .split('\n')
      .map((line, i) => (line.includes(`var(${name})`) ? i + 1 : 0))
      .filter(Boolean);
    console.error(`  ${name}  →  ${CSS}:${lines.join(', ')}`);
  }
  console.error(
    '\nEach of those declarations resolves to `unset` and does not render.\n' +
    'Define the property, give the read a fallback, or point it at an existing token.\n'
  );
  process.exit(1);
}

console.log(
  `✅ No undefined custom properties. ` +
  `${read.size} fallback-less reads checked; ${setInline.size} satisfied by inline styles.`
);
