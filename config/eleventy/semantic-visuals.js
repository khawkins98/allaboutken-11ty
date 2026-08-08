const { esc, plural } = require('./escape');

module.exports = function registerSemanticVisuals(config) {
  config.addFilter('sortByScore', (arr) => [...(arr || [])].sort((a, b) => b.s - a.s));

  // Force-directed view of the same graph. Included for comparison: with 100
  // nodes it tends toward a hairball, and force position encodes nothing
  // reliable, unlike the MDS view where distance means similarity.
  config.addShortcode('semanticForce', (map, w = 900, h = 520) => {
    try {
      if (!map || !map.nodes || !map.nodes.length) return '';
      const pad = 20;
      const px = (n) => (pad + (n.fx != null ? n.fx : n.x) * (w - pad * 2)).toFixed(1);
      const py = (n) => (pad + (1 - (n.fy != null ? n.fy : n.y)) * (h - pad * 2)).toFixed(1);
      const edges = (map.edges || []).map((e) => {
        const a = map.nodes[e.a]; const b = map.nodes[e.b];
        if (!a || !b) return '';
        return `<line x1="${px(a)}" y1="${py(a)}" x2="${px(b)}" y2="${py(b)}" stroke="#a89257" stroke-opacity="0.5" stroke-width="1"></line>`;
      }).join('');
      const dots = map.nodes.map((n) => {
        const r = 3 + Math.min(4, (n.degree || 0) * 0.5);
        return `<a href="${esc(n.url)}"><title>${esc(n.title)}${n.topic ? ` — ${esc(n.topic)}` : ''} (${plural(n.degree || 0, 'link')})</title>`
          + `<circle cx="${px(n)}" cy="${py(n)}" r="${r.toFixed(1)}" fill="#5b5e5a"></circle></a>`;
      }).join('');
      return `<svg class="kh-map" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" `
        + `aria-label="Force-directed view of the same ${plural(map.nodes.length, 'entry', 'entries')} and ${plural((map.edges || []).length, 'link')}. Point size shows how many links an entry has."><g>${edges}</g><g>${dots}</g></svg>`;
    } catch (e) { return ''; }
  });

  // Adjacency matrix. Rows and columns are entries grouped by primary topic; a
  // filled cell means that pair is linked. A matrix cannot produce a hairball:
  // density is read directly, and blocks on the diagonal are clusters.
  config.addShortcode('semanticMatrix', (map, cell = 7) => {
    try {
      if (!map || !map.order || !map.order.length) return '';
      const ord = map.order;
      const n = ord.length;
      const pos = new Map(ord.map((o, k) => [o.i, k]));
      const size = n * cell;
      const cells = (map.edges || []).flatMap((e) => {
        const a = pos.get(e.a); const b = pos.get(e.b);
        if (a == null || b == null) return [];
        const o = Math.min(0.95, 0.35 + (e.s - map.edgeMin) * 1.6).toFixed(2);
        const t = esc(`${map.nodes[e.a].title} + ${map.nodes[e.b].title} (${e.s})`);
        return [
          `<rect x="${b * cell}" y="${a * cell}" width="${cell - 1}" height="${cell - 1}" fill="#5b5e5a" fill-opacity="${o}"><title>${t}</title></rect>`,
          `<rect x="${a * cell}" y="${b * cell}" width="${cell - 1}" height="${cell - 1}" fill="#5b5e5a" fill-opacity="${o}"><title>${t}</title></rect>`
        ];
      }).join('');
      // Rule between topic groups, so the blocks are readable as clusters.
      let rules = '';
      for (let k = 1; k < n; k += 1) {
        if (ord[k].topic !== ord[k - 1].topic) {
          const at = k * cell - 0.5;
          rules += `<line x1="0" y1="${at}" x2="${size}" y2="${at}" stroke="#ded2a8" stroke-width="1"></line>`
            + `<line x1="${at}" y1="0" x2="${at}" y2="${size}" stroke="#ded2a8" stroke-width="1"></line>`;
        }
      }
      return `<svg class="kh-map kh-matrix" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" `
        + `aria-label="Adjacency matrix of ${plural(n, 'entry', 'entries')} grouped by topic. A filled cell means the pair is linked; blocks along the diagonal are clusters."><g>${rules}</g><g>${cells}</g></svg>`;
    } catch (e) { return ''; }
  });

  // Arc diagram. Entries on one line in cluster order, links as arcs above.
  // Compact, and it fits a strip far better than any 2D layout.
  config.addShortcode('semanticArc', (map, w = 900, h = 190) => {
    try {
      if (!map || !map.order || !map.order.length) return '';
      const ord = map.order;
      const n = ord.length;
      const pos = new Map(ord.map((o, k) => [o.i, k]));
      // A single entry would divide by zero and place every mark at Infinity,
      // which renders as an empty box rather than an error. Centre it instead.
      const step = n > 1 ? (w - 20) / (n - 1) : 0;
      const x = (k) => (n > 1 ? 10 + k * step : w / 2);
      const base = h - 22;
      const arcs = (map.edges || []).map((e) => {
        const a = pos.get(e.a); const b = pos.get(e.b);
        if (a == null || b == null) return '';
        const x1 = x(Math.min(a, b)); const x2 = x(Math.max(a, b));
        const r = (x2 - x1) / 2;
        const o = Math.min(0.8, 0.25 + (e.s - map.edgeMin) * 1.6).toFixed(2);
        return `<path d="M ${x1.toFixed(1)} ${base} A ${r.toFixed(1)} ${Math.min(r, base - 6).toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${base}" `
          + `fill="none" stroke="#a89257" stroke-opacity="${o}" stroke-width="1"><title>${esc(`${map.nodes[e.a].title} + ${map.nodes[e.b].title} (${e.s})`)}</title></path>`;
      }).join('');
      const dots = ord.map((o, k) => {
        const nd = map.nodes[o.i];
        return `<a href="${esc(nd.url)}"><title>${esc(nd.title)}${nd.topic ? ` — ${esc(nd.topic)}` : ''}</title>`
          + `<circle cx="${x(k).toFixed(1)}" cy="${base}" r="2.5" fill="#5b5e5a"></circle></a>`;
      }).join('');
      return `<svg class="kh-map" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" `
        + `aria-label="Arc diagram: ${plural(n, 'entry', 'entries')} on a line in topic order, with an arc for each of the ${plural((map.edges || []).length, 'link')}."><g>${arcs}</g>`
        + `<line x1="10" y1="${base}" x2="${w - 10}" y2="${base}" stroke="#ded2a8" stroke-width="1"></line><g>${dots}</g></svg>`;
    } catch (e) { return ''; }
  });

  // Static SVG map of the corpus: entries positioned by semantic similarity,
  // with a link drawn where two are genuinely close. Built at build time from
  // src/site/_data/semanticMap.json; no client-side library, no layout run in
  // the browser, and the same picture every time.
  config.addShortcode('semanticMap', (map, w = 900, h = 520) => {
    try {
      if (!map || !map.nodes || !map.nodes.length) return '';
      const pad = 18;
      const px = (n) => (pad + n.x * (w - pad * 2)).toFixed(1);
      // SVG y grows downward; flip so the projection is not mirrored.
      const py = (n) => (pad + (1 - n.y) * (h - pad * 2)).toFixed(1);

      const edges = (map.edges || []).map((e) => {
        const a = map.nodes[e.a];
        const b = map.nodes[e.b];
        if (!a || !b) return '';
        // Opacity carries strength, faintly. The link's existence is the
        // signal; its exact weight is not worth reading off a line.
        const o = Math.min(0.85, 0.3 + (e.s - map.edgeMin) * 1.8).toFixed(2);
        return `<line x1="${px(a)}" y1="${py(a)}" x2="${px(b)}" y2="${py(b)}" `
          + `stroke="#a89257" stroke-opacity="${o}" stroke-width="1"></line>`;
      }).join('');

      const dots = map.nodes.map((n) => {
        const label = esc(n.topic ? `${n.title} — ${n.topic}` : n.title);
        return `<a href="${esc(n.url)}"><title>${label}</title>`
          + `<circle cx="${px(n)}" cy="${py(n)}" r="3.5" fill="#5b5e5a"></circle></a>`;
      }).join('');

      return `<svg class="kh-map" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" `
        + `role="img" aria-label="Map of ${plural(map.nodes.length, 'entry', 'entries')} positioned by similarity of meaning, `
        + `with ${plural((map.edges || []).length, 'link')} between closely related pairs. `
        + `The axes carry no meaning; only relative distance does.">`
        + `<g>${edges}</g><g>${dots}</g></svg>`;
    } catch (e) {
      return '';
    }
  });
};
