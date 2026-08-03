/**
 * escape.js
 * ---------
 * Shared escaping for the shortcodes that build SVG by string concatenation.
 *
 * Why this exists: those shortcodes interpolate entry titles, URLs and topic
 * names straight into markup. Nunjucks does not help here, because a shortcode
 * returns a finished string that Eleventy inserts verbatim -- the autoescaping
 * that protects `{{ title }}` in a template never sees it.
 *
 * Nothing in the corpus currently contains a character that breaks, which is
 * exactly the problem: the failure is latent and silent. A title as ordinary as
 * "Q&A with the type designer" emits `&A` -- an invalid entity -- and a title
 * containing a `<` truncates the element. Neither throws, so the `try/catch`
 * wrapped around each shortcode catches nothing; the map simply renders wrong.
 *
 * Escape everything interpolated, including values that "cannot" contain
 * markup, because the day one does is the day nobody is looking.
 */

/**
 * Escape text for use in element content or a double-quoted attribute.
 * `&` must be replaced first or it would double-escape the entities below it.
 */
const esc = (value) => String(value == null ? '' : value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/**
 * Pluralise a count and its noun together, so aria-labels do not read
 * "Map of 1 entries". Only regular -s plurals; that is all these charts need.
 */
const plural = (count, noun, pluralNoun) => (
  `${count} ${Number(count) === 1 ? noun : (pluralNoun || `${noun}s`)}`
);

module.exports = { esc, plural };
