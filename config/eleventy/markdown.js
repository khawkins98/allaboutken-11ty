const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');

module.exports = function registerMarkdown(config) {
  // Configure Markdown-It with anchor IDs for headings and use it globally
  // Plugin to convert double hyphens to em dashes in Markdown text tokens
  const emdashPlugin = (md) => {
    md.core.ruler.after('inline', 'emdash', (state) => {
      state.tokens.forEach((blockToken) => {
        if (blockToken.type !== 'inline' || !Array.isArray(blockToken.children)) return;
        blockToken.children.forEach((token) => {
          if (token.type === 'text') {
            token.content = token.content.replace(/--/g, '—');
          }
        });
      });
    });
  };

  const md = markdownIt({ html: true, linkify: true }).use(markdownItAnchor, {
    // Add ids to all heading levels so we can deep-link
    level: [1, 2, 3, 4, 5, 6],
    // Create clean ASCII slugs: remove punctuation/specials, collapse spaces to '-'
    slugify: (s) => (
      (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // strip combining marks
        .replace(/&amp;/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '') // drop punctuation and specials (e.g. ?!@():’–)
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
    ),

    // Append a discrete '#' permalink link to the end of the heading content
    permalink: (slug, opts, state, index) => {
      try {
        const inlineToken = state.tokens[index + 1];
        if (!inlineToken || !Array.isArray(inlineToken.children)) return;
        // Create a small '#' anchor link that is the only clickable element
        const linkOpen = new state.Token('link_open', 'a', 1);
        linkOpen.attrs = [
          ['href', `#${slug}`],
          ['class', 'kh-anchor'],
          ['aria-label', 'Permalink to this heading']
        ];
        const textToken = new state.Token('text', '', 0);
        textToken.content = '#';
        const linkClose = new state.Token('link_close', 'a', -1);

        inlineToken.children.push(linkOpen, textToken, linkClose);
      } catch (e) {
        // no-op
      }
    }
  }).use(emdashPlugin);

  // Wrap every markdown table in the same scroller the datasheet tables use.
  //
  // Without this a wide table makes the PAGE scroll sideways instead of the
  // table: unwrapped content tables were the single largest cause of
  // horizontal overflow on a phone, taking /ai/ to 585px of scroll width
  // inside a 360px viewport. /stats/ never had the problem because its table
  // is hand-wrapped in `.kh-table-scroll`; markdown tables had no way to opt
  // in.
  //
  // A renderer rule rather than an output transform, so it applies wherever
  // the markdown library runs -- posts, the `markdown` paired shortcode and
  // templates -- and touches nothing else in the HTML.
  md.renderer.rules.table_open = (tokens, idx, options, env, self) =>
    `<div class="kh-table-scroll kh-table-scroll--content">${self.renderToken(tokens, idx, options)}`;
  md.renderer.rules.table_close = (tokens, idx, options, env, self) =>
    `${self.renderToken(tokens, idx, options)}</div>`;

  // Use for Eleventy's markdown engine (for .md files and markdown in templates)
  config.setLibrary('md', md);
  // Paired shortcode to render inline markdown blocks consistently
  config.addPairedShortcode('markdown', (content) => md.render(content || ''));

  // Margin apparatus, markdown-authorable. Both render inline markdown (links,
  // emphasis, code, `--` em dashes) so posts no longer need raw `<a href>`
  // HTML inside the aside. Keep content to 1-2 sentences; no blank lines.
  //
  // {% marginnote %}A supporting citation with a [link](https://…).{% endmarginnote %}
  config.addPairedShortcode('marginnote', (content) => (
    `<aside class="kh-marginnote">${md.renderInline(String(content || '').trim())}</aside>`
  ));

  // {% pullquote %}A short phrase lifted verbatim from the paragraph.{% endpullquote %}
  // Pull-quotes repeat body text, so they are hidden from assistive tech and
  // the search index; never put content in one that exists nowhere else.
  config.addPairedShortcode('pullquote', (content) => (
    `<aside class="kh-pullquote" aria-hidden="true" data-pagefind-ignore>${md.renderInline(String(content || '').trim())}</aside>`
  ));

  // Paired shortcode: render escaped code and a live demo from the same HTML snippet
  // Usage (place outside of a {% markdown %} block):
  // {% codeAndDemo 'html' %}
  // <form>...</form>
  // <script>...</script>
  // {% endcodeAndDemo %}
  config.addPairedShortcode('codeAndDemo', (content, lang = 'html') => {
    const snippet = String(content || '');
    const escapeHtml = (s) => (
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    );
    const escaped = escapeHtml(snippet);
    return [
      '<div class="kh-demo" data-pagefind-ignore>',
      `<pre><code class="language-${lang}">${escaped}</code></pre>`,
      '<div class="kh-demo__live">',
      snippet,
      '</div>',
      '</div>'
    ].join('');
  });

  // Shortcode to generate Eleventy screenshot service URL for dynamic OG images
  // Usage: {% ogImageUrl %}
  config.addShortcode('ogImageUrl', function() {
    // Build the social card URL for this page
    const socialCardUrl = `https://www.allaboutken.com/social${this.page.url}`;
    // URI encode the URL for the screenshot service
    const encodedUrl = encodeURIComponent(socialCardUrl);
    // Return the screenshot service URL with opengraph size (1200x630)
    return `https://v1.screenshot.11ty.dev/${encodedUrl}/opengraph/`;
  });

  // Removed custom codeblock tag; posts now use fenced code blocks in markdown.
};
