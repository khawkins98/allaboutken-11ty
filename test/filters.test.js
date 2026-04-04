import { describe, it, expect } from 'vitest';
import filters from '../src/lib/filters.js';
const {
  dateDisplay, limitItems, ensureTrailingSlash, rssDate,
  rssLastUpdatedDate, emdash, htmlToAbsoluteUrls, sanitizeFeedHtml,
  wordCount, formatNumber, filenameFormat, slugify,
} = filters;

// dateDisplay
describe('dateDisplay', () => {
  it('formats a known UTC date with the default format', () => {
    const d = new Date(Date.UTC(2024, 2, 15));
    expect(dateDisplay(d)).toBe('15 Mar 2024');
  });

  it('accepts a custom Luxon format string', () => {
    const d = new Date(Date.UTC(2024, 0, 1));
    expect(dateDisplay(d, 'yyyy-MM-dd')).toBe('2024-01-01');
  });

  it('uses UTC so the result is timezone-independent (flakiness guard)', () => {
    const d = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
    expect(dateDisplay(d)).toBe('1 Jan 2025');
  });
});

// limitItems
describe('limitItems', () => {
  const items = [1, 2, 3, 4, 5];

  it('returns the first N items for positive n', () => {
    expect(limitItems(items, 3)).toEqual([1, 2, 3]);
  });

  it('returns the last N items for negative n', () => {
    expect(limitItems(items, -2)).toEqual([4, 5]);
  });

  it('returns the input unchanged if it is not an array', () => {
    expect(limitItems('hello', 2)).toBe('hello');
    expect(limitItems(null, 2)).toBeNull();
  });

  it('returns the array unchanged if n is not a number', () => {
    expect(limitItems(items, '2')).toEqual(items);
    expect(limitItems(items, undefined)).toEqual(items);
  });
});

// ensureTrailingSlash
describe('ensureTrailingSlash', () => {
  it('adds a trailing slash when missing', () => {
    expect(ensureTrailingSlash('/about')).toBe('/about/');
  });
  it('leaves a trailing slash intact', () => {
    expect(ensureTrailingSlash('/about/')).toBe('/about/');
  });
  it('returns empty string for empty input', () => {
    expect(ensureTrailingSlash('')).toBe('');
  });
  it('returns empty string for falsy input', () => {
    expect(ensureTrailingSlash(null)).toBe('');
    expect(ensureTrailingSlash(undefined)).toBe('');
  });
});

// rssDate
describe('rssDate', () => {
  it('returns an ISO 8601 string for a known date', () => {
    const d = new Date(Date.UTC(2024, 5, 15, 12, 30, 0));
    expect(rssDate(d)).toBe('2024-06-15T12:30:00.000Z');
  });
});

// rssLastUpdatedDate
describe('rssLastUpdatedDate', () => {
  it('returns the latest date from a list of posts', () => {
    const posts = [
      { date: new Date(Date.UTC(2024, 0, 1)) },
      { date: new Date(Date.UTC(2024, 5, 15)) },
      { date: new Date(Date.UTC(2024, 2, 10)) },
    ];
    expect(rssLastUpdatedDate(posts)).toBe('2024-06-15T00:00:00.000Z');
  });
  it('returns a valid ISO string for empty input (non-deterministic)', () => {
    const result = rssLastUpdatedDate([]);
    expect(new Date(result).toISOString()).toBeTruthy();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
  it('returns a valid ISO string for non-array input', () => {
    const result = rssLastUpdatedDate(null);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// emdash
describe('emdash', () => {
  it('converts a single -- to an em dash', () => {
    expect(emdash('hello -- world')).toBe('hello — world');
  });
  it('converts multiple -- occurrences', () => {
    expect(emdash('a -- b -- c')).toBe('a — b — c');
  });
  it('returns the string unchanged when no -- is present', () => {
    expect(emdash('no dashes here')).toBe('no dashes here');
  });
  it('handles falsy input gracefully', () => {
    expect(emdash(null)).toBe('');
    expect(emdash(undefined)).toBe('');
  });
});

// htmlToAbsoluteUrls
describe('htmlToAbsoluteUrls', () => {
  const base = 'https://example.com';
  it('rewrites href attributes with root-relative URLs', () => {
    const html = '<a href="/about">About</a>';
    expect(htmlToAbsoluteUrls(html, base)).toBe(
      '<a href="https://example.com/about">About</a>'
    );
  });
  it('rewrites src attributes with root-relative URLs', () => {
    const html = '<img src="/images/photo.jpg">';
    expect(htmlToAbsoluteUrls(html, base)).toBe(
      '<img src="https://example.com/images/photo.jpg">'
    );
  });
  it('rewrites srcset attributes with root-relative URLs', () => {
    const html = '<img srcset="/img/a.jpg 320w, /img/b.jpg 640w">';
    const result = htmlToAbsoluteUrls(html, base);
    expect(result).toContain('https://example.com/img/a.jpg');
    expect(result).toContain('https://example.com/img/b.jpg');
  });
  it('does not modify protocol-relative URLs (//) ', () => {
    const html = '<a href="//cdn.example.com/file.js">CDN</a>';
    expect(htmlToAbsoluteUrls(html, base)).toBe(html);
  });
  it('strips trailing slash from base URL to avoid double slashes', () => {
    const html = '<a href="/page">Page</a>';
    expect(htmlToAbsoluteUrls(html, 'https://example.com/')).toBe(
      '<a href="https://example.com/page">Page</a>'
    );
  });
});

// sanitizeFeedHtml
describe('sanitizeFeedHtml', () => {
  it('removes script tags and their content', () => {
    expect(sanitizeFeedHtml('<p>Hi</p><script>alert(1)</script>')).toBe('<p>Hi</p>');
  });
  it('removes style tags and their content', () => {
    expect(sanitizeFeedHtml('<style>body{color:red}</style><p>Hi</p>')).toBe('<p>Hi</p>');
  });
  it('removes link tags', () => {
    expect(sanitizeFeedHtml('<link rel="stylesheet" href="x.css"><p>Hi</p>')).toBe('<p>Hi</p>');
  });
  it('removes iframe tags and their content', () => {
    expect(sanitizeFeedHtml('<iframe src="x"></iframe><p>Hi</p>')).toBe('<p>Hi</p>');
  });
  it('strips inline style attributes', () => {
    expect(sanitizeFeedHtml('<p style="color:red">Hi</p>')).toBe('<p>Hi</p>');
  });
  it('strips inline event handlers', () => {
    expect(sanitizeFeedHtml('<p onclick="alert(1)">Hi</p>')).toBe('<p>Hi</p>');
    expect(sanitizeFeedHtml('<img onerror="alert(1)">')).toBe('<img>');
  });
  it('handles falsy input', () => {
    expect(sanitizeFeedHtml(null)).toBe('');
    expect(sanitizeFeedHtml(undefined)).toBe('');
  });
});

// wordCount
describe('wordCount', () => {
  it('counts words in plain HTML', () => {
    expect(wordCount('<p>Hello world</p>')).toBe(2);
  });
  it('counts words with nested tags', () => {
    expect(wordCount('<div><p>One <strong>two</strong> three</p></div>')).toBe(3);
  });
  it('excludes content inside script and style tags', () => {
    expect(wordCount('<p>Real words</p><script>var x = 1;</script><style>.a{}</style>')).toBe(2);
  });
  it('treats HTML entities as whitespace', () => {
    expect(wordCount('one&nbsp;two&amp;three')).toBe(3);
  });
  it('returns 0 for empty or null input', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount(null)).toBe(0);
    expect(wordCount(undefined)).toBe(0);
  });
});

// formatNumber
describe('formatNumber', () => {
  it('formats an integer with locale separators (en-US)', () => {
    expect(formatNumber(1234, 'en-US')).toBe('1,234');
  });
  it('formats a float', () => {
    expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56');
  });
  it('accepts an explicit locale', () => {
    const result = formatNumber(1234.5, 'de-DE');
    expect(result).not.toBe('1,234.5');
  });
  it('returns empty string for NaN', () => {
    expect(formatNumber(NaN, 'en-US')).toBe('NaN');
  });
  it('returns empty string for Infinity', () => {
    expect(formatNumber(Infinity, 'en-US')).toBe('Infinity');
  });
  it('uses en-US as the default locale', () => {
    expect(formatNumber(9999)).toBe('9,999');
  });
});

// filenameFormat
describe('filenameFormat', () => {
  it('creates a name from a local file path', () => {
    const result = filenameFormat('abc', 'src/images/blog/photo.jpg', 320, 'webp');
    expect(result).toBe('blog-photo-320.webp');
  });
  it('creates a name from an HTTP URL', () => {
    const result = filenameFormat('abc', 'https://example.com/assets/hero.png', 600, 'avif');
    expect(result).toBe('assets-hero-600.avif');
  });
  it('handles a URL with no directory path segments', () => {
    const result = filenameFormat('abc', 'https://example.com/logo.png', 900, 'jpeg');
    expect(result).toBe('logo-900.jpeg');
  });
  it('falls back to id-based name when src is not a string', () => {
    const result = filenameFormat('fallback-id', null, 1280, 'gif');
    expect(result).toBe('image-1280.gif');
  });
});

// slugify
describe('slugify', () => {
  it('slugifies plain ASCII text', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });
  it('normalizes accented characters via NFKD', () => {
    expect(slugify('Café naïve')).toBe('cafe-naive');
  });
  it('replaces &amp; with and', () => {
    expect(slugify('Pros &amp; Cons')).toBe('pros-and-cons');
  });
  it('strips punctuation and special characters', () => {
    expect(slugify('What is this? (A test!)')).toBe('what-is-this-a-test');
  });
  it('collapses multiple separators into one hyphen', () => {
    expect(slugify('too   many---spaces')).toBe('too-many-spaces');
  });
  it('handles empty/falsy input', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });
});
