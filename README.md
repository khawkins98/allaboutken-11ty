# allaboutken-11ty

A semi-professional site powered by the [Visual Framework 2.0](https://visual-framework.github.io/vf-welcome/)

## 3. Developing your new site

1. You'll need to [install npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
1. If you don't have `yarn`, install it
   - https://yarnpkg.com/lang/en/docs/install/
1. Install all the things
   - `yarn install`
1. Generate the site in `/build`
   - `gulp dev` renders and serves
   - `gulp build` build static assets

## 4. Adding Visual Framework components

To add a component, use the command line or install it manually.

### By package

- installation: `yarn add @visual-framework/vf-logo`
- updating components: `yarn upgrade-interactive --latest`
  - alias: `yarn run update-components`

### Manual installation for customisation

1. Download a pattern
2. Copy it to `./src/components/vf-component-name`

### Create your own local component

You can add a custom VF-compatible component to `./src/components` and use it in
your site.

- `gulp vf-component`

You'll find a `vf-sample` component already placed in `./src/components`


## 4. Footnotes

- Why `yarn` and not `npm`?
  For the particular structure of the Visual Framework components, Yarn is considerably
  faster at installing and does so more efficiently (about half the total file size). You'll
  also be able to use `yarn upgrade-interactive --latest`, which makes it easier to update
  VF components.
