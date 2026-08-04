(() => {
  const root = document.getElementById('kh-radial-comparison');
  if (!root) return;

  const nodes = [...root.querySelectorAll('.kh-radial__node')];
  const edges = [...root.querySelectorAll('.kh-radial__edge')];
  const topics = [...root.querySelectorAll('.kh-radial__topic')];
  const years = [...root.querySelectorAll('.kh-radial-year')];
  const detail = root.querySelector('#kh-radial-detail');
  const tooltip = root.querySelector('.kh-radial-tooltip');
  const tooltipEntries = [...(tooltip?.querySelectorAll('.kh-radial-tooltip__entry') || [])];
  const tooltipMeta = tooltip?.querySelector('.kh-radial-tooltip__meta');
  if (!nodes.length || !edges.length || !topics.length || !years.length || !detail || !tooltip || tooltipEntries.length !== 2 || !tooltipMeta) return;

  const labels = new WeakMap();
  const interactive = [...nodes, ...edges, ...topics];

  // The native <title> has to go, or the browser tooltip races the custom one
  // and you get both. But removing it also removes the element's accessible
  // name, and this used to hand it back to nodes only -- leaving every edge and
  // topic arc anonymous to a screen reader the moment JavaScript ran. The
  // no-JS page was the accessible one, which is the wrong way round.
  //
  // So: every interactive element keeps its name as an aria-label. The <g>
  // wrappers also need role="img", because a bare group is not a name-bearing
  // role and the label would be ignored.
  function takeNativeTitle(element) {
    const title = [...element.children].find((child) => child.tagName.toLowerCase() === 'title');
    const text = title?.textContent?.trim() || '';
    if (text) {
      labels.set(element, text);
      element.setAttribute('aria-label', text);
      if (element.tagName.toLowerCase() === 'g') element.setAttribute('role', 'img');
    }
    title?.remove();
  }

  interactive.forEach(takeNativeTitle);

  // Topic families are made focusable; entries already are, being links. Edges
  // deliberately are not: there are several hundred, and turning each into a
  // tab stop would bury the rest of the page. They are named, not navigable --
  // every pair an edge represents is still reachable from both its entries.
  topics.forEach((topic) => {
    topic.setAttribute('tabindex', '0');
    topic.setAttribute('aria-describedby', 'kh-radial-detail');
  });

  const pairKey = (a, b) => [Number(a), Number(b)].sort((x, y) => x - y).join('|');
  const edgeTouchesNode = (edge, node) => edge.dataset.a === node || edge.dataset.b === node;
  const edgeTouchesGroup = (edge, group) => edge.dataset.firstGroup === group || edge.dataset.secondGroup === group;
  const panelName = (kind) => kind === 'authored' ? 'authored' : 'semantic';
  let hovered = null;
  let focused = null;

  function clearMarks() {
    root.classList.remove('has-highlight');
    [...interactive, ...years].forEach((element) => element.classList.remove('is-highlighted', 'is-related'));
  }

  function markYears(values, className) {
    years.forEach((year) => {
      if (values.has(year.dataset.year)) year.classList.add(className);
    });
  }

  function markNodes(indices, className) {
    nodes.forEach((node) => {
      if (indices.has(node.dataset.node)) node.classList.add(className);
    });
  }

  function highlightNode(target) {
    const selected = target.dataset.node;
    const related = new Set([selected]);
    const relatedGroups = new Set([target.dataset.group]);
    root.classList.add('has-highlight');

    edges.forEach((edge) => {
      if (!edgeTouchesNode(edge, selected)) return;
      edge.classList.add('is-highlighted');
      related.add(edge.dataset.a);
      related.add(edge.dataset.b);
      relatedGroups.add(edge.dataset.firstGroup);
      relatedGroups.add(edge.dataset.secondGroup);
    });
    markNodes(related, 'is-related');
    markNodes(new Set([selected]), 'is-highlighted');
    const relatedYears = new Set(nodes.filter((node) => related.has(node.dataset.node)).map((node) => node.dataset.year));
    markYears(relatedYears, 'is-related');
    markYears(new Set([target.dataset.year]), 'is-highlighted');
    topics.forEach((topic) => {
      if (relatedGroups.has(topic.dataset.group)) topic.classList.add(topic.dataset.group === target.dataset.group ? 'is-highlighted' : 'is-related');
    });
  }

  function highlightTopic(target) {
    const group = target.dataset.group;
    const related = new Set();
    root.classList.add('has-highlight');

    nodes.forEach((node) => {
      if (node.dataset.group === group) {
        node.classList.add('is-highlighted');
        related.add(node.dataset.node);
      }
    });
    edges.forEach((edge) => {
      if (!edgeTouchesGroup(edge, group)) return;
      edge.classList.add('is-highlighted');
      related.add(edge.dataset.a);
      related.add(edge.dataset.b);
    });
    markNodes(related, 'is-related');
    markYears(new Set(nodes.filter((node) => node.dataset.group === group).map((node) => node.dataset.year)), 'is-highlighted');
    topics.forEach((topic) => {
      if (topic.dataset.group === group) topic.classList.add('is-highlighted');
    });
  }

  function highlightEdge(target) {
    const key = pairKey(target.dataset.a, target.dataset.b);
    const selected = new Set([target.dataset.a, target.dataset.b]);
    const groups = new Set([target.dataset.firstGroup, target.dataset.secondGroup]);
    root.classList.add('has-highlight');

    edges.forEach((edge) => {
      if (pairKey(edge.dataset.a, edge.dataset.b) === key) edge.classList.add('is-highlighted');
    });
    markNodes(selected, 'is-highlighted');
    markYears(new Set([target.dataset.firstYear, target.dataset.secondYear]), 'is-highlighted');
    topics.forEach((topic) => {
      if (groups.has(topic.dataset.group)) topic.classList.add('is-related');
    });
  }

  function nodeDescription(target) {
    const index = target.dataset.node;
    const authored = edges.filter((edge) => edge.dataset.kind === 'authored' && edgeTouchesNode(edge, index)).length;
    const semantic = edges.filter((edge) => edge.dataset.kind === 'semantic' && edgeTouchesNode(edge, index)).length;
    return {
      first: {
        label: `${target.dataset.date} · ${target.dataset.groupLabel}`,
        title: target.dataset.title
      },
      meta: `${target.dataset.crossLinks} cross-family connection${target.dataset.crossLinks === '1' ? '' : 's'} in this panel · ${target.dataset.topic} · ${authored} authored connection${authored === 1 ? '' : 's'} · ${semantic} semantic connection${semantic === 1 ? '' : 's'}`
    };
  }

  function topicDescription(target) {
    const group = target.dataset.group;
    const authored = edges.filter((edge) => edge.dataset.kind === 'authored' && edgeTouchesGroup(edge, group)).length;
    const semantic = edges.filter((edge) => edge.dataset.kind === 'semantic' && edgeTouchesGroup(edge, group)).length;
    return {
      first: { label: 'Topic family', title: labels.get(target) },
      meta: `${authored} authored pairs touch this family · ${semantic} semantic pairs`
    };
  }

  function edgeDescription(target) {
    const kind = panelName(target.dataset.kind);
    const relation = target.classList.contains('is-cross-group') ? 'cross-family' : 'within one family';
    const overlap = target.classList.contains('is-overlap') ? ' · appears in both panels' : '';
    const measure = kind === 'semantic'
      ? `${target.dataset.matches} passage-pair match${target.dataset.matches === '1' ? '' : 'es'} · across at least ${target.dataset.support} passage${target.dataset.support === '1' ? '' : 's'} on each side · best similarity ${target.dataset.score}`
      : `${target.dataset.mentions} authored mention${target.dataset.mentions === '1' ? '' : 's'}`;
    return {
      first: {
        label: `${target.dataset.firstDate} · ${target.dataset.firstGroupLabel}`,
        title: target.dataset.firstTitle
      },
      second: {
        label: `${target.dataset.secondDate} · ${target.dataset.secondGroupLabel}`,
        title: target.dataset.secondTitle
      },
      meta: `${measure} · ${relation}${overlap}`
    };
  }

  function tooltipText(description) {
    const entries = [description.first, description.second]
      .filter(Boolean)
      .map((entry) => `${entry.label}: ${entry.title}`);
    return `${entries.join(' ↔ ')} — ${description.meta}`;
  }

  function renderTooltip(description) {
    tooltip.classList.toggle('is-pair', Boolean(description.second));
    tooltipEntries.forEach((entryElement, index) => {
      const entry = index === 0 ? description.first : description.second;
      entryElement.hidden = !entry;
      if (!entry) return;
      entryElement.querySelector('.kh-radial-tooltip__label').textContent = entry.label;
      entryElement.querySelector('strong').textContent = entry.title;
    });
    tooltipMeta.textContent = description.meta;
  }

  function positionTooltip(target) {
    const rootRect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 8;
    let left = targetRect.left - rootRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    let top = targetRect.top - rootRect.top - tooltipRect.height - 10;

    left = Math.max(padding, Math.min(left, rootRect.width - tooltipRect.width - padding));
    if (top < padding) top = targetRect.bottom - rootRect.top + 10;
    top = Math.max(padding, Math.min(top, rootRect.height - tooltipRect.height - padding));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function describe(target) {
    if (target.matches('.kh-radial__node')) return nodeDescription(target);
    if (target.matches('.kh-radial__topic')) return topicDescription(target);
    return edgeDescription(target);
  }

  function activate(target) {
    clearMarks();
    if (target.matches('.kh-radial__node')) highlightNode(target);
    else if (target.matches('.kh-radial__topic')) highlightTopic(target);
    else highlightEdge(target);

    const description = describe(target);
    renderTooltip(description);
    detail.textContent = tooltipText(description);
    tooltip.classList.add('is-visible');
    tooltip.setAttribute('aria-hidden', 'false');
    positionTooltip(target);
  }

  function deactivate() {
    clearMarks();
    tooltip.classList.remove('is-visible');
    tooltip.setAttribute('aria-hidden', 'true');
    detail.textContent = 'Hover a topic, entry or connection; keyboard users can focus a topic family or an entry link.';
  }

  interactive.forEach((element) => {
    element.addEventListener('pointerenter', () => {
      hovered = element;
      activate(element);
    });
    element.addEventListener('pointerleave', () => {
      if (hovered === element) hovered = null;
      if (focused) activate(focused);
      else deactivate();
    });
  });

  [...nodes, ...topics].forEach((element) => {
    element.addEventListener('focus', () => {
      focused = element;
      activate(element);
    });
    element.addEventListener('blur', () => {
      if (focused === element) focused = null;
      if (hovered) activate(hovered);
      else deactivate();
    });
  });

  window.addEventListener('resize', () => {
    const active = focused || hovered;
    if (active) positionTooltip(active);
  });
})();

(() => {
  const root = document.getElementById('kh-topic-sparks');
  if (!root) return;

  const series = [...root.querySelectorAll('.kh-topic-sparks__series')];
  const detail = root.querySelector('#kh-topic-sparks-detail');
  if (!series.length || !detail) return;

  const defaultDetail = detail.textContent;
  let hovered = null;
  let focused = null;

  function description(target) {
    const entries = target.dataset.total === '1' ? 'entry' : 'entries';
    const posts = target.dataset.peak === '1' ? 'post' : 'posts';
    return `${target.dataset.topic} · ${target.dataset.group} · ${target.dataset.total} ${entries} from ${target.dataset.first} to ${target.dataset.last} · peak ${target.dataset.peak} ${posts} in the six-month window ending ${target.dataset.peakPeriod}`;
  }

  function activate(target) {
    root.classList.add('has-highlight');
    series.forEach((item) => item.classList.toggle('is-highlighted', item === target));
    detail.textContent = description(target);
  }

  function deactivate() {
    root.classList.remove('has-highlight');
    series.forEach((item) => item.classList.remove('is-highlighted'));
    detail.textContent = defaultDetail;
  }

  series.forEach((item) => {
    const title = [...item.children].find((child) => child.tagName.toLowerCase() === 'title');
    if (title?.textContent) item.setAttribute('aria-label', title.textContent.trim());
    title?.remove();

    item.addEventListener('pointerenter', () => {
      hovered = item;
      activate(item);
    });
    item.addEventListener('pointerleave', () => {
      if (hovered === item) hovered = null;
      if (focused) activate(focused);
      else deactivate();
    });
    item.addEventListener('focus', () => {
      focused = item;
      activate(item);
    });
    item.addEventListener('blur', () => {
      if (focused === item) focused = null;
      if (hovered) activate(hovered);
      else deactivate();
    });
  });
})();

// ---------------------------------------------------------------------------
// Generic chart tooltips.
//
// Progressive enhancement, and the fallback is the whole reason the markup
// looks the way it does: every chart element ships a real SVG <title>, so with
// JavaScript off the browser's own tooltip still names it. When this runs it
// takes those titles over -- leave them in place and the native tooltip races
// the custom one, and you get both -- and hands the name straight back as an
// aria-label. Removing a <title> without doing that would make the no-JS page
// the accessible one, which is the wrong way round.
//
// #kh-radial-comparison and #kh-topic-sparks are skipped: they have bespoke
// tooltips above that also drive highlighting and a live detail line, and
// binding this on top would fight them.
// ---------------------------------------------------------------------------
(() => {
  const lab = document.querySelector('.kh-story-lab');
  if (!lab) return;

  const BESPOKE = '#kh-radial-comparison, #kh-topic-sparks';
  const named = [...lab.querySelectorAll('svg a, svg path, svg rect, svg circle, svg line, svg g')]
    .filter((element) => !element.closest(BESPOKE))
    .filter((element) => [...element.children].some((child) => child.tagName.toLowerCase() === 'title'));
  if (!named.length) return;

  const label = new WeakMap();
  named.forEach((element) => {
    const title = [...element.children].find((child) => child.tagName.toLowerCase() === 'title');
    const value = title?.textContent?.trim() || '';
    if (!value) return;
    label.set(element, value);
    element.setAttribute('aria-label', value);
    if (element.tagName.toLowerCase() === 'g') element.setAttribute('role', 'img');
    title.remove();
  });

  // aria-hidden: the accessible name already lives on the shape itself, so
  // announcing the tip as well would say everything twice.
  const tip = document.createElement('div');
  tip.className = 'kh-lab-tip';
  tip.setAttribute('aria-hidden', 'true');
  tip.hidden = true;
  // Inside the lab section, not on <body>: every style on this site is scoped
  // under the CSS toggle and the lab's own variables (--kh-lab-ink) are
  // declared on .kh-story-lab, so a tip parented to <body> would render
  // unstyled. It is `position: fixed` regardless, which is why the parent can
  // be chosen for cascade rather than for coordinates.
  lab.appendChild(tip);

  let current = null;

  // Prefer above the target, flip below when the top of the viewport is in the
  // way, then clamp on both axes. Fixed positioning, not absolute: several of
  // these charts sit inside horizontally scrolling containers, where an
  // absolutely positioned tip is clipped by the scroller or drifts away from
  // its target as you scroll.
  function place(target) {
    const pad = 8;
    const rect = target.getBoundingClientRect();
    const size = tip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - size.width / 2;
    let top = rect.top - size.height - 10;
    if (top < pad) top = rect.bottom + 10;
    left = Math.max(pad, Math.min(left, window.innerWidth - size.width - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - size.height - pad));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function show(target) {
    const value = label.get(target);
    if (!value) return;
    current = target;
    tip.textContent = value;
    tip.hidden = false;
    place(target);
  }

  function hide() {
    current = null;
    tip.hidden = true;
  }

  // Touch: a 1px arc cannot be hit with a finger, so on coarse pointers every
  // thin element gets an invisible fat twin to catch the tap. Built only when
  // a coarse pointer is actually present -- a few hundred extra nodes is not a
  // cost a mouse should pay. Inline styles rather than a class because the
  // chart CSS targets these by descendant selector and would restroke them.
  const hits = [];
  if (window.matchMedia('(hover: none)').matches) {
    named.forEach((element) => {
      const tag = element.tagName.toLowerCase();
      if (tag !== 'path' && tag !== 'line') return;
      const hit = element.cloneNode(false);
      hit.removeAttribute('aria-label');
      hit.removeAttribute('role');
      hit.setAttribute('aria-hidden', 'true');
      hit.setAttribute('style', 'fill:none;stroke:transparent;stroke-width:14;pointer-events:stroke');
      element.parentNode.insertBefore(hit, element.nextSibling);
      label.set(hit, label.get(element));
      hits.push(hit);
    });
  }

  [...named, ...hits].forEach((element) => {
    element.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      show(element);
    });
    element.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'touch') return;
      if (current === element) hide();
    });
    // Tap toggles, so a second tap on the same shape dismisses rather than
    // leaving a tip stuck under the finger.
    element.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'touch') return;
      event.stopPropagation();
      if (current === element) hide();
      else show(element);
    });
    element.addEventListener('focus', () => show(element));
    element.addEventListener('blur', () => hide());
  });

  document.addEventListener('pointerup', (event) => {
    if (current && event.pointerType === 'touch') hide();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
  // Reposition rather than hide: the tip stays glued to its shape while a
  // horizontally scrolling chart is dragged.
  window.addEventListener('scroll', () => { if (current) place(current); }, { passive: true, capture: true });
  window.addEventListener('resize', () => { if (current) place(current); });
})();
