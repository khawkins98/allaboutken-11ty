# Eleventy configuration modules

`eleventy.js` is the assembly point. It keeps the server options, general
filters and returned directory/template configuration visible in one place,
then calls the registration modules in this directory.

Each module exports one function that accepts the Eleventy configuration
object. Do not rename a registered filter, shortcode or collection when moving
code between modules; templates depend on those names as the public API.

| Module | Responsibility |
| --- | --- |
| `images.js` | Responsive image plugin and output-path transform |
| `timeline.js` | Archive grouping, register timeline and sequence neighbourhood |
| `topic-visuals.js` | Hierarchical topic helpers and topic/month sparklines |
| `semantic-visuals.js` | Static semantic map, matrix, arc and force SVG shortcodes |
| `stats.js` | Timeline sizing, series navigation and length framing |
| `markdown.js` | Markdown-it setup and markdown-backed shortcodes |
| `assets-and-search.js` | Passthrough copies, image watch target and Pagefind hook |
| `collections.js` | Blog, impact-story, featured, topic and combined collections |

Prefer a new module only when a concern has its own dependencies or lifecycle.
A one-off filter that is useful across the site still belongs in `eleventy.js`.
