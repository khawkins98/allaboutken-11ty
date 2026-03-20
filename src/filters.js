'use strict';

const { DateTime } = require('luxon');
const Path = require('path');

/**
 * Pure filter functions extracted from eleventy.js for testability.
 * Registered onto the Eleventy config in eleventy.js via registerFilters().
 */

function dateDisplay(dateObj, format = 'd LLL y') {
  return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat(format);
}

function limitItems(array, n) {
  if (!Array.isArray(array)) return array;
  if (typeof n !== 'number') return array;
  return n < 0 ? array.slice(n) : array.slice(0, n);
}

function ensureTrailingSlash(value) {
  const v = String(value || '');
  if (!v) return v;
  return v.endsWith('/') ? v : v + '/';
}

function rssDate(dateObj) {
  return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toISO();
}

function rssLastUpdatedDate(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return DateTime.now().toISO();
  const latest = posts.reduce((a, b) => (a.date > b.date ? a : b));
  return DateTime.fromJSDate(latest.date, { zone: 'utc' }).toISO();
}

function emdash(value) {
  const v = String(value || '');
  return v.replace(/--/g, '—');
}

function htmlToAbsoluteUrls(content, siteBaseUrl) {
  const base = (siteBaseUrl || '').replace(/\/$/, '');
  const html = content || '';
  return html
    .replace(/href="\/(?!\/)/g, `href="${base}/`)
    .replace(/src="\/(?!\/)/g, `src="${base}/`)
    .replace(/srcset="([^"]*)"/g, (m, val) => {
      const updated = (val || '').replace(/\s+\/(?!\/)/g, ` ${base}/`).replace(/^\/(?!\/)/, `${base}/`);
      return `srcset="${updated}"`;
    });
}

function sanitizeFeedHtml(content) {
  const html = String(content || '');
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\son[a-z]+="[^"]*"/gi, '');
}

function wordCount(content) {
  try {
    const html = String(content || '');
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/[\s\n\r\t]+/g, ' ')
      .trim();
    if (!cleaned) return 0;
    return cleaned.split(/\s+/).filter(Boolean).length;
  } catch (e) {
    return 0;
  }
}

function formatNumber(value, locale = 'en-US') {
  try {
    const n = Number(value);
    if (!isFinite(n)) return String(value ?? '');
    return n.toLocaleString(locale);
  } catch (e) {
    return String(value ?? '');
  }
}

/**
 * Deterministic filename format for eleventy-img.
 * Produces <dir-token>-<base-name>-<width>.<format>
 */
function filenameFormat(id, src, width, format) {
  try {
    let baseName = '';
    let dirToken = '';
    if (typeof src === 'string') {
      if (src.startsWith('http://') || src.startsWith('https://')) {
        const u = new URL(src);
        baseName = Path.basename(u.pathname) || u.hostname;
        const parts = (u.pathname || '').split('/').filter(Boolean);
        dirToken = parts.length > 1 ? parts[parts.length - 2] : '';
      } else {
        baseName = Path.basename(src);
        const parentDir = Path.basename(Path.dirname(src));
        dirToken = parentDir;
      }
    }
    baseName = String(baseName || 'image').replace(/\.[a-z0-9]+$/i, '');
    const safe = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const dirSafe = String(dirToken || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const name = dirSafe ? `${dirSafe}-${safe}` : safe;
    return `${name}-${width}.${format}`;
  } catch (e) {
    return `${id}-${width}.${format}`;
  }
}

function registerFilters(config) {
  config.addFilter('dateDisplay', dateDisplay);
  config.addFilter('limitItems', limitItems);
  config.addFilter('ensureTrailingSlash', ensureTrailingSlash);
  config.addFilter('rssDate', rssDate);
  config.addFilter('rssLastUpdatedDate', rssLastUpdatedDate);
  config.addFilter('emdash', emdash);
  config.addFilter('htmlToAbsoluteUrls', htmlToAbsoluteUrls);
  config.addFilter('sanitizeFeedHtml', sanitizeFeedHtml);
  config.addFilter('wordCount', wordCount);
  config.addFilter('formatNumber', formatNumber);
}

module.exports = {
  dateDisplay,
  limitItems,
  ensureTrailingSlash,
  rssDate,
  rssLastUpdatedDate,
  emdash,
  htmlToAbsoluteUrls,
  sanitizeFeedHtml,
  wordCount,
  formatNumber,
  filenameFormat,
  registerFilters,
};
