#!/usr/bin/env node
/**
 * Remove duplicate selector blocks that have the exact same declarations.
 *
 * - Parses SCSS with PostCSS using the SCSS syntax
 * - Considers at-rule context (e.g. @media) so duplicates are compared within the same context
 * - Keeps the first occurrence, removes subsequent duplicates
 * - Strips stray @charset at-rules (which must only appear at the top of a file)
 *
 * Default target: src/components/vf-componenet-rollup/index.scss
 * By default writes a sibling file with .dedup.scss; pass --write to overwrite.
 *
 * Usage:
 *   node scripts/dedupe-scss.js
 *   node scripts/dedupe-scss.js --write
 *   node scripts/dedupe-scss.js --source path/to/file.scss [--out path/to/output.scss]
 */

const fs = require('fs');
const path = require('path');

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || true;
}

function normalizeWhitespace(str) {
  return String(str).replace(/\s+/g, ' ').trim();
}

function canonicalDeclSignature(rule) {
  const decls = [];
  if (!rule.nodes) return '';
  for (const node of rule.nodes) {
    if (node.type !== 'decl') continue;
    const prop = String(node.prop || '').trim().toLowerCase();
    // Keep value as-is but normalize whitespace and important flag
    const important = node.important ? ' !important' : '';
    const value = normalizeWhitespace(String(node.value || '')) + important;
    decls.push(`${prop}:${value}`);
  }
  // Sort to make ordering irrelevant when comparing blocks
  decls.sort();
  return decls.join(';');
}

async function run() {
  let postcss, scssSyntax;
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    postcss = require('postcss');
    // eslint-disable-next-line import/no-extraneous-dependencies
    scssSyntax = require('postcss-scss');
  } catch (err) {
    console.error('\nMissing dependencies: postcss, postcss-scss');
    console.error('Install with: yarn add -D postcss postcss-scss');
    process.exit(1);
  }

  const sourceArg = getArg('--source');
  const write = !!getArg('--write');
  const defaultSource = path.join('src', 'components', 'vf-componenet-rollup', 'index.scss');
  const sourcePath = path.resolve(process.cwd(), sourceArg || defaultSource);

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source SCSS not found: ${sourcePath}`);
    process.exit(1);
  }

  const scss = fs.readFileSync(sourcePath, 'utf8');
  // Use process API so the scss syntax is honored
  const parsed = await postcss().process(scss, { syntax: scssSyntax, from: sourcePath });
  const root = parsed.root;

  let removedRules = 0;
  let removedCharsets = 0;

  // Remove all stray @charset at-rules; they are invalid except at very top
  root.walkAtRules('charset', (atrule) => {
    atrule.remove();
    removedCharsets += 1;
  });

  const seen = new Set();

  function walk(node, contextChain) {
    if (!node.nodes) return;
    for (const child of [...node.nodes]) {
      if (child.type === 'atrule') {
        const atKey = `@${child.name} ${normalizeWhitespace(child.params || '')}`.trim();
        const nextContext = contextChain.length ? [...contextChain, atKey] : [atKey];
        walk(child, nextContext);
        // Remove empty at-rules created by deletions
        if (!child.nodes || child.nodes.length === 0) {
          child.remove();
        }
      } else if (child.type === 'rule') {
        const selector = normalizeWhitespace(child.selector || '');
        const declSig = canonicalDeclSignature(child);
        if (!selector || !declSig) {
          continue;
        }
        const contextKey = contextChain.join(' | ');
        const key = `${contextKey} || ${selector} || ${declSig}`;
        if (seen.has(key)) {
          child.remove();
          removedRules += 1;
        } else {
          seen.add(key);
        }
      }
    }
  }

  walk(root, []);

  const outArg = getArg('--out');
  const outPath = write
    ? sourcePath
    : path.resolve(
        path.dirname(sourcePath),
        path.basename(sourcePath, '.scss') + '.dedup.scss'
      );

  const outCss = root.toResult({ syntax: scssSyntax, from: sourcePath }).css;
  fs.writeFileSync(outPath, outCss, 'utf8');

  const beforeSize = Buffer.byteLength(scss, 'utf8');
  const afterSize = Buffer.byteLength(outCss, 'utf8');
  const delta = beforeSize - afterSize;

  console.log(`SCSS dedupe complete: removed ${removedRules} duplicate rule(s), stripped ${removedCharsets} @charset.`);
  console.log(`Wrote: ${path.relative(process.cwd(), outPath)} (${afterSize} bytes, -${delta} bytes)`);
  if (!write) {
    console.log('Dry run. Use --write to overwrite the source file.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


