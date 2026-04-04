const { DateTime } = require("luxon");
const Path         = require("path");

/**
 * Deterministic image file names: <dir-token>-<base-name>-<width>.<format>
 */
function filenameFormat(id, src, width, format) {
  try {
    let baseName = "";
    let dirToken = "";
    if (typeof src === "string") {
      if (src.startsWith("http://") || src.startsWith("https://")) {
        const u = new URL(src);
        baseName = Path.basename(u.pathname) || u.hostname;
        const parts = (u.pathname || "").split("/").filter(Boolean);
        dirToken = parts.length > 1 ? parts[parts.length - 2] : "";
      } else {
        baseName = Path.basename(src);
        const parentDir = Path.basename(Path.dirname(src));
        dirToken = parentDir;
      }
    }
    baseName = String(baseName || "image").replace(/\.[a-z0-9]+$/i, "");
    const safe = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const dirSafe = String(dirToken || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const name = dirSafe ? `${dirSafe}-${safe}` : safe;
    return `${name}-${width}.${format}`;
  } catch (e) {
    return `${id}-${width}.${format}`;
  }
}

/**
 * Format a JS Date using Luxon in UTC.
 */
function dateDisplay(dateObj, format = "d LLL y") {
  return DateTime.fromJSDate(dateObj, {
    zone: "utc"
  }).toFormat(format);
}

/**
 * Return the first (or last) N items of an array.
 */
function limitItems(array, n) {
  if (!Array.isArray(array)) return array;
  if (typeof n !== "number") return array;
  return n < 0 ? array.slice(n) : array.slice(0, n);
}

/**
 * Ensure a URL ends with a trailing slash.
 */
function ensureTrailingSlash(value) {
  const v = String(value || "");
  if (!v) return v;
  return v.endsWith("/") ? v : v + "/";
}

/**
 * Convert a JS Date to an ISO string for RSS feeds (UTC).
 */
function rssDate(dateObj) {
  return DateTime.fromJSDate(dateObj, { zone: "utc" }).toISO();
}

/**
 * Return the ISO date of the most recently updated post, or now if empty.
 */
function rssLastUpdatedDate(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return DateTime.now().toISO();
  const latest = posts.reduce((a, b) => (a.date > b.date ? a : b));
  return DateTime.fromJSDate(latest.date, { zone: "utc" }).toISO();
}

/**
 * Convert double hyphens to em dashes.
 */
function emdash(value) {
  const v = String(value || "");
  return v.replace(/--/g, "\u2014");
}

/**
 * Convert root-relative URLs to absolute URLs in HTML content.
 */
function htmlToAbsoluteUrls(content, siteBaseUrl) {
  const base = (siteBaseUrl || "").replace(/\/$/, "");
  const html = content || "";
  return html
    // href attributes
    .replace(/href="\/(?!\/)/g, `href="${base}/`)
    // src attributes
    .replace(/src="\/(?!\/)/g, `src="${base}/`)
    // srcset attributes (handles comma-separated URLs)
    .replace(/srcset="([^"]*)"/g, (m, val) => {
      const updated = (val || "").replace(/\s+\/(?!\/)/g, ` ${base}/`).replace(/^\/(?!\/)/,  `${base}/`);
      return `srcset="${updated}"`;
    });
}

/**
 * Strip unsafe elements/attributes from feed content.
 */
function sanitizeFeedHtml(content) {
  const html = String(content || "");
  return html
    // remove script/style/link/iframe blocks
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    // drop inline style attributes
    .replace(/\sstyle="[^"]*"/gi, "")
    // drop inline event handlers (on*)
    .replace(/\son[a-z]+="[^"]*"/gi, "");
}

/**
 * Compute plain-text word count from HTML content.
 */
function wordCount(content) {
  try {
    const html = String(content || "");
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ") // strip remaining tags
      .replace(/&[a-z#0-9]+;/gi, " ") // drop entities
      .replace(/[\s\n\r\t]+/g, " ") // collapse whitespace
      .trim();
    if (!cleaned) return 0;
    return cleaned.split(/\s+/).filter(Boolean).length;
  } catch (e) {
    return 0;
  }
}

/**
 * Format a number with locale separators (e.g., 1,234).
 */
function formatNumber(value, locale = "en-US") {
  try {
    const n = Number(value);
    if (!isFinite(n)) return String(value ?? "");
    return n.toLocaleString(locale);
  } catch (e) {
    return String(value ?? "");
  }
}

/**
 * Create clean ASCII slugs for heading anchors.
 */
function slugify(s) {
  return (
    (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // strip combining marks
      .replace(/&amp;/g, "and")
      .replace(/[^a-z0-9\s-]/g, "") // drop punctuation and specials
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

module.exports = {
  filenameFormat,
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
  slugify,
};
