import { describe, test, expect } from 'bun:test';
import {
  limitItems,
  ensureTrailingSlash,
  emdash,
  htmlToAbsoluteUrls,
  sanitizeFeedHtml,
  wordCount,
  formatNumber,
  filenameFormat,
  rssDate,
  rssLastUpdatedDate,
  dateDisplay,
} from '../src/filters.js';

// ---------------------------------------------------------------------------
// limitItems
// ---------------------------------------------------------------------------
describe('limitItems', () => {
  test('returns first N items', () => {
    expect(limitItems([1, 2, 3, 4], 2)).toEqual([1, 2]);
  });

  test('returns last N items for negative n', () => {
    expect(limitItems([1, 2, 3, 4], -2)).toEqual([3, 4]);
  });

  test('returns full array when n > length', () => {
    expect(limitItems([1, 2], 10)).toEqual([1, 2]);
  });

  test('returns non-array value unchanged', () => {
    expect(limitItems('hello', 3)).toBe('hello');
  });

  test('returns value unchanged when n is not a number', () => {
    expect(limitItems([1, 2, 3], 'two')).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// ensureTrailingSlash
// ---------------------------------------------------------------------------
describe('ensureTrailingSlash', () => {
  test('adds trailing slash when missing', () => {
    expect(ensureTrailingSlash('/about')).toBe('/about/');
  });

  test('does not double-add trailing slash', () => {
    expect(ensureTrailingSlash('/about/')).toBe('/about/');
  });

  test('handles empty string', () => {
    expect(ensureTrailingSlash('')).toBe('');
  });

  test('handles null/undefined', () => {
    expect(ensureTrailingSlash(null)).toBe('');
    expect(ensureTrailingSlash(undefined)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// emdash
// ---------------------------------------------------------------------------
describe('emdash', () => {
  test('converts double hyphens to em dash', () => {
    expect(emdash('hello -- world')).toBe('hello — world');
  });

  test('converts multiple occurrences', () => {
    expect(emdash('a--b--c')).toBe('a—b—c');
  });

  test('leaves single hyphens alone', () => {
    expect(emdash('a-b')).toBe('a-b');
  });

  test('handles empty string', () => {
    expect(emdash('')).toBe('');
  });

  test('handles null', () => {
    expect(emdash(null)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// htmlToAbsoluteUrls
// ---------------------------------------------------------------------------
describe('htmlToAbsoluteUrls', () => {
  test('rewrites href root-relative URLs', () => {
    const result = htmlToAbsoluteUrls('<a href="/about">link</a>', 'https://example.com');
    expect(result).toBe('<a href="https://example.com/about">link</a>');
  });

  test('rewrites src root-relative URLs', () => {
    const result = htmlToAbsoluteUrls('<img src="/img/photo.jpg">', 'https://example.com');
    expect(result).toBe('<img src="https://example.com/img/photo.jpg">');
  });

  test('does not rewrite protocol-relative URLs (//cdn...)', () => {
    const result = htmlToAbsoluteUrls('<img src="//cdn.example.com/photo.jpg">', 'https://example.com');
    expect(result).toBe('<img src="//cdn.example.com/photo.jpg">');
  });

  test('strips trailing slash from base before prepending', () => {
    const result = htmlToAbsoluteUrls('<a href="/page">x</a>', 'https://example.com/');
    expect(result).toBe('<a href="https://example.com/page">x</a>');
  });

  test('rewrites srcset', () => {
    const result = htmlToAbsoluteUrls('<img srcset="/img/a.jpg 1x, /img/b.jpg 2x">', 'https://example.com');
    expect(result).toContain('https://example.com/img/a.jpg');
    expect(result).toContain('https://example.com/img/b.jpg');
  });
});

// ---------------------------------------------------------------------------
// sanitizeFeedHtml
// ---------------------------------------------------------------------------
describe('sanitizeFeedHtml', () => {
  test('removes script tags', () => {
    expect(sanitizeFeedHtml('<p>hi</p><script>alert(1)</script>')).not.toContain('<script>');
  });

  test('removes style tags', () => {
    expect(sanitizeFeedHtml('<p style="color:red">hi</p><style>body{}</style>')).not.toContain('<style>');
  });

  test('removes inline style attributes', () => {
    expect(sanitizeFeedHtml('<p style="color:red">hi</p>')).not.toContain('style=');
  });

  test('removes inline event handlers', () => {
    expect(sanitizeFeedHtml('<button onclick="evil()">click</button>')).not.toContain('onclick=');
  });

  test('removes link tags', () => {
    expect(sanitizeFeedHtml('<link rel="stylesheet" href="/a.css"><p>hi</p>')).not.toContain('<link');
  });

  test('removes iframe', () => {
    expect(sanitizeFeedHtml('<iframe src="x"></iframe>')).not.toContain('<iframe');
  });

  test('preserves safe content', () => {
    const safe = '<p>Hello <strong>world</strong></p>';
    expect(sanitizeFeedHtml(safe)).toBe(safe);
  });
});

// ---------------------------------------------------------------------------
// wordCount
// ---------------------------------------------------------------------------
describe('wordCount', () => {
  test('counts words in plain text', () => {
    expect(wordCount('one two three')).toBe(3);
  });

  test('counts words in HTML, ignoring tags', () => {
    expect(wordCount('<p>hello <strong>world</strong></p>')).toBe(2);
  });

  test('strips script content', () => {
    const html = '<p>hi</p><script>var x = 1;</script>';
    expect(wordCount(html)).toBe(1);
  });

  test('returns 0 for empty string', () => {
    expect(wordCount('')).toBe(0);
  });

  test('returns 0 for null', () => {
    expect(wordCount(null)).toBe(0);
  });

  test('collapses whitespace correctly', () => {
    expect(wordCount('  one   two  ')).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// formatNumber
// ---------------------------------------------------------------------------
describe('formatNumber', () => {
  test('formats integer with locale separators', () => {
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567');
  });

  test('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  test('returns string as-is for non-finite value', () => {
    expect(formatNumber('not-a-number')).toBe('not-a-number');
  });

  test('handles string numbers', () => {
    expect(formatNumber('1000', 'en-US')).toBe('1,000');
  });
});

// ---------------------------------------------------------------------------
// filenameFormat
// ---------------------------------------------------------------------------
describe('filenameFormat', () => {
  test('generates filename for local path', () => {
    const result = filenameFormat('id1', 'src/site/images/blog/photo.jpg', 800, 'webp');
    expect(result).toBe('blog-photo-800.webp');
  });

  test('generates filename for remote URL', () => {
    const result = filenameFormat('id2', 'https://example.com/images/photos/sunset.jpg', 320, 'avif');
    expect(result).toBe('photos-sunset-320.avif');
  });

  test('handles URL with no parent dir', () => {
    const result = filenameFormat('id3', 'https://example.com/photo.jpg', 600, 'jpeg');
    // only one path segment — dirToken should be empty
    expect(result).toBe('photo-600.jpeg');
  });

  test('sanitizes special characters in filename', () => {
    const result = filenameFormat('id4', 'src/images/My Photo (1).jpg', 400, 'webp');
    expect(result).toContain('my-photo-1');
    expect(result).toContain('400.webp');
  });

  test('uses "image" as basename when src is null', () => {
    // null src → baseName defaults to 'image', no dir token
    const result = filenameFormat('id5', null, 100, 'jpeg');
    expect(result).toBe('image-100.jpeg');
  });
});

// ---------------------------------------------------------------------------
// dateDisplay
// ---------------------------------------------------------------------------
describe('dateDisplay', () => {
  test('formats date with default format', () => {
    const d = new Date('2024-06-15T00:00:00.000Z');
    expect(dateDisplay(d)).toBe('15 Jun 2024');
  });

  test('accepts custom format', () => {
    const d = new Date('2024-01-05T00:00:00.000Z');
    expect(dateDisplay(d, 'yyyy-MM-dd')).toBe('2024-01-05');
  });
});

// ---------------------------------------------------------------------------
// rssDate
// ---------------------------------------------------------------------------
describe('rssDate', () => {
  test('returns ISO string', () => {
    const d = new Date('2024-03-10T12:00:00.000Z');
    expect(rssDate(d)).toBe('2024-03-10T12:00:00.000Z');
  });
});

// ---------------------------------------------------------------------------
// rssLastUpdatedDate
// ---------------------------------------------------------------------------
describe('rssLastUpdatedDate', () => {
  test('returns ISO date of the most recent post', () => {
    const posts = [
      { date: new Date('2024-01-01T00:00:00.000Z') },
      { date: new Date('2024-06-15T00:00:00.000Z') },
      { date: new Date('2024-03-20T00:00:00.000Z') },
    ];
    expect(rssLastUpdatedDate(posts)).toBe('2024-06-15T00:00:00.000Z');
  });

  test('returns current date for empty array', () => {
    const result = rssLastUpdatedDate([]);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns current date for non-array', () => {
    const result = rssLastUpdatedDate(null);
    expect(typeof result).toBe('string');
  });
});
