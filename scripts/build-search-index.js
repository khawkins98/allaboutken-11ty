#!/usr/bin/env node
/**
 * Build a client-side search index from built HTML.
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');
const stripJs = require('strip-js');
const striptags = require('striptags');

const buildDir = path.resolve(__dirname, '..', 'build');
const outFile = path.join(buildDir, 'search_index.js');

function walk(dir) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(full);
  }
  return result;
}

const files = walk(buildDir);
let pages = [];
let id = 0;

for (const file of files) {
  const rel = file.replace(buildDir, '');
  let html = fs.readFileSync(file, 'utf8');
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].split('|')[0].trim() : rel;

  const bodyMatch = html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  const root = parse(body);
  root.querySelectorAll('.kh-search-client-side--no-index').forEach((el) => el.set_content(''));
  body = String(root);
  body = stripJs(striptags(body));
  body = body.replace(/&quot;/g, ' ').replace(/class=/g, ' ');
  body = body.replace(/\r?\n|\r/g, ' ').replace(/ {2,}/g, ' ');
  body = body.replace(/"/g, "'");

  pages.push({ id: String(id++), title, text: body, tags: '', url: rel });
}

const out = `let searchIndex = ${JSON.stringify({ pages })};`;
fs.writeFileSync(outFile, out);
console.log(`Wrote ${pages.length} pages to ${outFile}`);
