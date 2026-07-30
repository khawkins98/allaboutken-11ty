const { DateTime } = require('luxon');

function getTagArray(item) {
  const tags = item.data?.tags || [];
  return Array.isArray(tags) ? tags : [tags];
}

module.exports = function registerTimeline(config) {
  // Data marks (micro-visualisations)
  // ---------------------------------
  // Build-time data for the small marks on post pages: the twelve-month
  // pulse strip, the sequence rail, the length gauge, and topic tallies.
  // Everything is computed at build time and baked into markup — no JS.

  // Classify a collection item into the register's three entry types.
  // Notes are a flavour of article, not a fourth type.
  function khEntryType(item) {
    const tags = getTagArray(item);
    if (tags.includes('impact-stories')) return 'impact';
    if (tags.includes('digesting')) return 'digesting';
    return 'article';
  }

  // Twelve calendar months ending at the build month, each with counts by
  // entry type. Fed by a collection (usually allContent) so the strip shows
  // the whole register, not just one type.
  // months = 0 means "all time": span from the earliest item to this month.
  // Entries grouped by calendar month, newest first, for the archive page.
  // The timeline's month marks link at a month rather than at a single entry:
  // a month with five entries has no "the" post, and picking the newest one
  // quietly hid the other four behind a mark whose whole encoding is "there
  // are five things here".
  //
  // Keys are 'yyyy-LL' so they match pulseMonths' keys exactly -- the mark's
  // href and the archive's anchor are the same string, generated once.
  config.addFilter('groupByMonth', (items) => {
    try {
      const groups = new Map();
      (items || []).forEach((item) => {
        const d = DateTime.fromJSDate(item.date, { zone: 'utc' });
        const key = d.toFormat('yyyy-LL');
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            label: d.toFormat('LLLL yyyy'),
            year: d.toFormat('yyyy'),
            items: []
          });
        }
        groups.get(key).items.push(item);
      });
      return [...groups.values()]
        .sort((a, b) => (a.key < b.key ? 1 : -1))
        .map((g) => {
          g.items.sort((a, b) => b.date - a.date);
          return g;
        });
    } catch (e) {
      return [];
    }
  });

  config.addFilter('pulseMonths', (items, months = 12) => {
    try {
      const now = DateTime.utc().startOf('month');
      let span = months;
      if (!span) {
        const dates = (items || []).map((i) => i.date).filter(Boolean);
        if (!dates.length) return [];
        const earliest = DateTime.fromJSDate(new Date(Math.min(...dates)), { zone: 'utc' })
          .startOf('month');
        span = Math.max(1, Math.round(now.diff(earliest, 'months').months) + 1);
      }
      const start = now.minus({ months: span - 1 });
      months = span;
      const slots = [];
      for (let i = 0; i < months; i += 1) {
        const m = start.plus({ months: i });
        slots.push({
          key: m.toFormat('yyyy-LL'),
          label: m.toFormat('LLL yy'),
          longLabel: m.toFormat('LLLL yyyy'),
          year: m.toFormat('yyyy'),
          // January starts a new year band on the axis. The first slot also
          // gets a label so a cropped view is never missing its leading year.
          yearStart: m.month === 1,
          counts: { article: 0, digesting: 0, impact: 0 },
          total: 0,
          url: null,
          size: 0
        });
      }
      const byKey = new Map(slots.map((s) => [s.key, s]));
      (items || []).forEach((item) => {
        const key = DateTime.fromJSDate(item.date, { zone: 'utc' }).toFormat('yyyy-LL');
        const slot = byKey.get(key);
        if (!slot) return;
        slot.counts[khEntryType(item)] += 1;
        slot.total += 1;
        // Newest entry of the month wins, so the dot links somewhere useful.
        if (!slot.newest || item.date > slot.newest) {
          slot.newest = item.date;
          slot.url = item.url;
          slot.title = (item.data && item.data.title) || item.url;
        }
      });
      // Size by AREA, not by side length: a month with four entries should
      // look twice as wide as one with a single entry, not four times.
      slots.forEach((s2) => {
        s2.size = s2.total ? Math.min(14, Math.round(4 * Math.sqrt(s2.total))) : 0;
        delete s2.newest;
      });
      return slots;
    } catch (e) {
      return [];
    }
  });

  // Collapse runs of complete empty calendar years into a single break, so
  // the timeline does not scroll through years of nothing. Only whole years
  // that fall entirely inside the range are collapsed; a partial year at
  // either end stays as months.
  config.addFilter('collapseEmptyYears', (slots, captions) => {
    try {
      const list = slots || [];
      if (!list.length) return list;
      const byYear = new Map();
      list.forEach((s2) => {
        if (!byYear.has(s2.year)) byYear.set(s2.year, []);
        byYear.get(s2.year).push(s2);
      });
      const empty = new Set();
      byYear.forEach((months, year) => {
        // 12 months present and none of them carrying an entry.
        if (months.length === 12 && months.every((m) => !m.total)) empty.add(year);
      });
      if (!empty.size) return list;

      const out = [];
      let run = [];
      const flush = () => {
        if (!run.length) return;
        const from = run[0];
        const to = run[run.length - 1];
        const key = from === to ? from : `${from}-${to}`;
        const caption = (captions && (captions[key] || captions[from])) || '';
        out.push({
          gap: true,
          key: `gap-${key}`,
          fromYear: from,
          toYear: to,
          months: run.length * 12,
          label: from === to ? from : `${from}\u2013${to}`,
          caption
        });
        run = [];
      };
      list.forEach((s2) => {
        if (empty.has(s2.year)) {
          if (!run.includes(s2.year)) run.push(s2.year);
          return;
        }
        flush();
        out.push(s2);
      });
      flush();
      return out;
    } catch (e) {
      return [];
    }
  });

  // The current page plus up to `span` neighbours either side, oldest first,
  // for the sequence rail. Input collection is newest-first.
  config.addFilter('neighbourhood', (items, url, span = 3) => {
    try {
      const list = items || [];
      const i = list.findIndex((p) => p.url === url);
      if (i === -1) return [];
      const out = [];
      for (let idx = i + span; idx >= i - span; idx -= 1) {
        if (idx < 0 || idx >= list.length) continue;
        const item = list[idx];
        out.push({
          url: item.url,
          title: (item.data && item.data.title) || item.url,
          dateLabel: DateTime.fromJSDate(item.date, { zone: 'utc' }).toFormat('d LLL yyyy'),
          type: khEntryType(item),
          current: idx === i
        });
      }
      return out;
    } catch (e) {
      return [];
    }
  });
};
