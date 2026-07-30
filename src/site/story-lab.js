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

  function takeNativeTitle(element) {
    const title = [...element.children].find((child) => child.tagName.toLowerCase() === 'title');
    const text = title?.textContent?.trim() || '';
    if (text) labels.set(element, text);
    if (element.matches('.kh-radial__node') && text) element.setAttribute('aria-label', text);
    title?.remove();
  }

  interactive.forEach(takeNativeTitle);

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
    detail.textContent = 'Hover a topic, entry or connection; keyboard users can focus an entry link.';
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

  nodes.forEach((node) => {
    node.addEventListener('focus', () => {
      focused = node;
      activate(node);
    });
    node.addEventListener('blur', () => {
      if (focused === node) focused = null;
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
