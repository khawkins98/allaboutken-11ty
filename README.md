# allaboutken-11ty

This site runs on Eleventy v3 with Dart Sass for CSS. The legacy Visual Framework build (once used here to dogfood VF during my EMBL/EMBL‑EBI work) has been removed; local SCSS and simple Nunjucks templates remain for a lighter, more experimental setup.

## Quick start

1. Install Node and Yarn
   - [Node.js](https://nodejs.org/)
   - [Yarn](https://yarnpkg.com/)
2. Install dependencies
   - `yarn install`
3. Start development server
   - `yarn dev` (or `yarn start`) — watches Sass and serves Eleventy with live reload
4. Build static site to `/build`
   - `yarn build`

## Scripts

- `yarn dev`: runs Sass in watch mode and Eleventy `--serve`
- `yarn start`: alias for `yarn dev`
- `yarn build`: clean → compile Sass → Eleventy production build

## CSS

- Entry: `src/components/vf-componenet-rollup/index.scss`
  - Uses `@use` for `normalize` and content styling
  - Breakpoints centralized in `src/components/vf-componenet-rollup/_settings.scss`
- Output: `build/css/styles.css`

## Templates & content

- Nunjucks templates under `src/site/`
- Posts/pages often wrap sections in `{% markdown %}…{% endmarkdown %}` for fenced code and Markdown formatting
- Legacy custom tags (`render`, `codeblock`) were removed; posts now use plain HTML or fenced code

## Notes

- Images are processed by the Eleventy Image Transform plugin configured in [`eleventy.js`](eleventy.js) and output to `build/img/`
- The search index is generated post-build via [`scripts/build-search-index.js`](scripts/build-search-index.js)
- Eleventy config: [`eleventy.js`](eleventy.js)

## Monitoring

- [Analytics](https://khawkins98.goatcounter.com/)
- [Link backs](https://webmention.io/settings/sites)
