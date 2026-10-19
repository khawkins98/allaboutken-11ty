(() => {
  const container = document.getElementById('mangrove-interactive-map');
  if (!container) return;

  // Data model extracted from Mangrove kit (exploratory).fig and undrr-mangrove Storybook
  const data = {
    domains: [
      { id: 'forms', name: 'Forms & Selection', count: 140, type: 'domain', color: '#E05A47', sub: 'Checkbox, Radio, Select, ComboBox', desc: '140 variants across 9 component families. Storybook schemas define strict input states, error validation cascades (.mg-form-input:focus-visible), and accessibility bindings.' },
      { id: 'content', name: 'Content & Data', count: 103, type: 'domain', color: '#2E8B57', sub: 'Table ecosystem, Cards, Details', desc: '103 variants. Features the 40-variant Table ecosystem and HorizontalBookCard compiled directly from Storybook’s Bali GP2022 fixture with cardGeometryChecks.js assertions.' },
      { id: 'nav', name: 'Navigation & Disclosure', count: 62, type: 'domain', color: '#3B82F6', sub: 'Hero layouts, Table of contents, Tabs', desc: '62 variants. Responsive Hero templates with image ratio handling and Table of Contents jump links documented in stories/Components/Navigation.' },
      { id: 'actions', name: 'Actions & CTAs', count: 47, type: 'domain', color: '#8B5CF6', sub: 'Button modes, Editorial & Text CTAs', desc: '47 variants. Living Button masters with brand mode variables, loading states, and native double-stroke focus geometry for unfilled buttons.' },
      { id: 'tokens', name: 'Foundational Tokens', count: 540, type: 'domain', color: '#D4A373', sub: '188 Colors · 348 Dimensions · 4 Fonts', desc: '540 total design tokens mined from tokens/mangrove.yaml and 5 brand override files. 471 tokens (87.2%) remain invariant across all brands; 69 tokens (12.8%) adapt.' }
    ],
    brands: [
      { id: 'undrr', name: 'UNDRR', color: '#004F91', badge: 'Release Candidate', sub: 'Core #004F91 · 7px radius', desc: 'Core bounded release candidate (tokens/undrr.yaml). Primary #004F91, container radius 7px. The baseline reference for token propagation tests.' },
      { id: 'pweb', name: 'PreventionWeb', color: '#0A6969', badge: '+6 Palette & Surface', sub: 'Teal #0A6969 · Soft surface', desc: 'Disaster risk knowledge platform (tokens/preventionweb.yaml). Features forest teal primary (#0A6969), soft surface (#EBF3F3), and custom tag tokens.' },
      { id: 'mcr', name: 'MCR2030', color: '#591A61', badge: '32px Pill Radius', sub: 'Plum #591A61 · 32px pill buttons', desc: 'Making Cities Resilient 2030 (tokens/mcr.yaml). Brand adaptation with 32px pill-shaped buttons (radius.button: spacing.300), 12px checkbox radius, and distinct purple identity (#591A61).' },
      { id: 'delta', name: 'DELTA Resilience', color: '#D97706', badge: '+Hero Spacing', sub: 'Orange #D97706 · Hero spacing', desc: 'DELTA resilience initiative (tokens/delta.yaml). Shared UNDRR blue primary with tailored spacing/400 hero overlay padding.' },
      { id: 'irp', name: 'IRP', color: '#0F78BF', badge: '+Soft Surface', sub: 'Sky blue #0F78BF · Soft surface', desc: 'International Recovery Platform (tokens/irp.yaml). Sky blue primary (#0F78BF) and dedicated light card background (#ECF4FA).' }
    ],
    outcomes: [
      { id: 'symbols', name: '396 Living Symbols', color: '#004F91', sub: '01 Library masters', desc: '396 compiled component masters across 34 component sets in Figma 01 Library, built via custom importer plugin recipes from 68 Storybook component families.' },
      { id: 'presets', name: 'Book Card Presets', color: '#2E8B57', sub: 'Default, NoImage, NoLink...', desc: 'Editorial presets rooted in HorizontalBookCard.stories.jsx schemas. Designers toggle configurations without breaking Auto Layout or inventing invalid states.' },
      { id: 'pilot', name: 'Consuming Pilot (56 Inst)', color: '#0A6969', sub: 'Desktop + Mobile fixture', desc: 'Real-world consumer validation file. 56 remotely linked instances with custom labels, toggles, and designer notes.' },
      { id: 'update', name: 'Spacing Propagation', color: '#D97706', sub: '30px → 32px verified update', desc: 'Live variable update: modified spacing/300 from 30px to 32px. Layout adapted smoothly while 100% of instance overrides survived intact.' },
      { id: 'boundary', name: 'Ownership Boundary', color: '#591A61', sub: 'System vs Designer', desc: 'Enforced boundary: system owns component anatomy and tokens; designer owns copy, visibility toggles, and local preset choices.' }
    ],
    // Links connecting Stage 1 (domain) -> Stage 2 (brand) -> Stage 3 (outcome)
    links: [
      // Tokens spine to all brands
      { source: 'tokens', target: 'undrr', value: 87, color: '#D4A373', type: 'spine', label: '87.2% Shared Invariant Core' },
      { source: 'tokens', target: 'pweb', value: 87, color: '#D4A373', type: 'spine', label: '87.2% Shared Invariant Core' },
      { source: 'tokens', target: 'mcr', value: 87, color: '#D4A373', type: 'spine', label: '87.2% Shared Invariant Core' },
      { source: 'tokens', target: 'delta', value: 87, color: '#D4A373', type: 'spine', label: '87.2% Shared Invariant Core' },
      { source: 'tokens', target: 'irp', value: 87, color: '#D4A373', type: 'spine', label: '87.2% Shared Invariant Core' },

      // Domains to Brands
      { source: 'forms', target: 'undrr', value: 30, color: '#E05A47', label: 'Forms: Base 7px radius' },
      { source: 'forms', target: 'mcr', value: 25, color: '#E05A47', label: 'Forms: 12px Checkbox & 32px pill' },
      { source: 'forms', target: 'pweb', value: 20, color: '#E05A47', label: 'Forms: Teal focus & validation' },

      { source: 'content', target: 'undrr', value: 35, color: '#2E8B57', label: 'Cards & Table: Base tokens' },
      { source: 'content', target: 'pweb', value: 25, color: '#2E8B57', label: 'Cards: Soft teal surface' },
      { source: 'content', target: 'irp', value: 20, color: '#2E8B57', label: 'Cards: Soft blue surface' },

      { source: 'nav', target: 'undrr', value: 20, color: '#3B82F6', label: 'Hero & TOC layouts' },
      { source: 'nav', target: 'delta', value: 15, color: '#3B82F6', label: 'Hero: Spacing/400 overlay' },

      { source: 'actions', target: 'undrr', value: 25, color: '#8B5CF6', label: 'Buttons: Primary #004F91' },
      { source: 'actions', target: 'mcr', value: 20, color: '#8B5CF6', label: 'Buttons: 32px Pill Radius' },
      { source: 'actions', target: 'pweb', value: 15, color: '#8B5CF6', label: 'Buttons: Teal #0A6969' },

      // Brands to Outcomes
      { source: 'undrr', target: 'symbols', value: 40, color: '#004F91', label: 'Library compilation' },
      { source: 'undrr', target: 'presets', value: 30, color: '#004F91', label: 'Editorial preset schemas' },
      { source: 'undrr', target: 'pilot', value: 35, color: '#004F91', label: 'Pilot fixture consumption' },
      { source: 'undrr', target: 'update', value: 45, color: '#004F91', label: 'Spacing 30px → 32px test' },

      { source: 'pweb', target: 'symbols', value: 25, color: '#0A6969', label: 'Multi-brand Tag integration' },
      { source: 'pweb', target: 'presets', value: 20, color: '#0A6969', label: 'Preset brand styling' },

      { source: 'mcr', target: 'symbols', value: 25, color: '#591A61', label: 'Pill button variants' },
      { source: 'mcr', target: 'boundary', value: 30, color: '#591A61', label: 'Protected designer overrides' },

      { source: 'delta', target: 'symbols', value: 15, color: '#D97706', label: 'Hero variant modes' },
      { source: 'delta', target: 'update', value: 20, color: '#D97706', label: 'Spacing token propagation' },

      { source: 'irp', target: 'symbols', value: 15, color: '#0F78BF', label: 'Surface tint modes' }
    ]
  };

  // Render HTML scaffolding for interactive controls and inspector
  container.innerHTML = `
    <div class="kh-flow-viz">
      <div class="kh-flow-viz__toolbar">
        <span class="kh-flow-viz__label">Interactive Filter:</span>
        <div class="kh-flow-viz__filters" role="tablist">
          <button type="button" class="kh-flow-btn kh-flow-btn--active" data-filter="all">All Systems</button>
          <button type="button" class="kh-flow-btn" data-filter="mcr">MCR2030 (Pill Radius)</button>
          <button type="button" class="kh-flow-btn" data-filter="pweb">PreventionWeb</button>
          <button type="button" class="kh-flow-btn" data-filter="content">Book Card Presets</button>
          <button type="button" class="kh-flow-btn" data-filter="update">Spacing Propagation</button>
          <button type="button" class="kh-flow-btn" data-filter="tokens">87.2% Shared Core</button>
        </div>
      </div>

      <div class="kh-flow-viz__stage">
        <svg id="mangrove-flow-svg" viewBox="0 0 1080 570" width="100%" height="auto" preserveAspectRatio="xMidYMid meet"></svg>
      </div>

      <!-- Interactive Slide-out Detail Panel -->
      <div id="kh-flow-detail" class="kh-flow-detail" aria-live="polite">
        <div class="kh-flow-detail__main">
          <div class="kh-flow-detail__header">
            <span id="detail-tag" class="kh-flow-detail__tag">Interactive Mode</span>
            <button type="button" id="detail-close" class="kh-flow-detail__close" aria-label="Reset inspection">Reset view ✕</button>
          </div>
          <h4 id="detail-title" class="kh-flow-detail__title">Hover or click any node to trace systemic connections</h4>
          <p id="detail-desc" class="kh-flow-detail__desc">Explore how Storybook schemas and token variables compile into 396 living symbols and 5 brand modes in Figma without manual drift.</p>
        </div>
        <div class="kh-flow-detail__metrics">
          <div class="kh-flow-metric">
            <span class="kh-flow-metric__num" id="detail-metric-1">540</span>
            <span class="kh-flow-metric__label" id="detail-label-1">Tokens</span>
          </div>
          <div class="kh-flow-metric">
            <span class="kh-flow-metric__num" id="detail-metric-2">396</span>
            <span class="kh-flow-metric__label" id="detail-label-2">Symbols</span>
          </div>
          <div class="kh-flow-metric">
            <span class="kh-flow-metric__num" id="detail-metric-3">87.2%</span>
            <span class="kh-flow-metric__label" id="detail-label-3">Shared Core</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const svg = document.getElementById('mangrove-flow-svg');
  const detailPanel = document.getElementById('kh-flow-detail');
  const detailTitle = document.getElementById('detail-title');
  const detailDesc = document.getElementById('detail-desc');
  const detailTag = document.getElementById('detail-tag');
  const metric1 = document.getElementById('detail-metric-1');
  const label1 = document.getElementById('detail-label-1');
  const metric2 = document.getElementById('detail-metric-2');
  const label2 = document.getElementById('detail-label-2');
  const metric3 = document.getElementById('detail-metric-3');
  const label3 = document.getElementById('detail-label-3');
  const closeBtn = document.getElementById('detail-close');

  // SVG Layout Coordinates (1080 x 570 canvas)
  const col1_x = 24;
  const col1_w = 230;

  const col2_x = 425;
  const col2_w = 230;

  const col3_x = 826;
  const col3_w = 230;

  // Compute node Y positions
  const nodeMap = new Map();

  data.domains.forEach((d, i) => {
    const y = 70 + i * 100;
    const h = 76;
    nodeMap.set(d.id, { ...d, x: col1_x, y, w: col1_w, h, col: 1 });
  });

  data.brands.forEach((b, i) => {
    const y = 70 + i * 100;
    const h = 76;
    nodeMap.set(b.id, { ...b, x: col2_x, y, w: col2_w, h, col: 2 });
  });

  data.outcomes.forEach((o, i) => {
    const y = 70 + i * 100;
    const h = 76;
    nodeMap.set(o.id, { ...o, x: col3_x, y, w: col3_w, h, col: 3 });
  });

  // Helper to construct cubic Bezier ribbon
  function buildRibbonPath(x1, y1_top, y1_bot, x2, y2_top, y2_bot) {
    const dx = x2 - x1;
    const cx1 = x1 + dx * 0.48;
    const cx2 = x1 + dx * 0.52;
    return `M ${x1} ${y1_top} C ${cx1} ${y1_top}, ${cx2} ${y2_top}, ${x2} ${y2_top} L ${x2} ${y2_bot} C ${cx2} ${y2_bot}, ${cx1} ${y1_bot}, ${x1} ${y1_bot} Z`;
  }

  // Draw elements
  let svgHtml = `
    <defs>
      <filter id="flow-card-shadow" x="-5%" y="-10%" width="110%" height="125%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.06"/>
      </filter>
    </defs>

    <!-- Column Headers -->
    <g class="kh-flow-headers">
      <text x="${col1_x}" y="40" class="kh-flow-header-text">1. Storybook Schemas</text>
      <text x="${col2_x}" y="40" class="kh-flow-header-text">2. Five-Brand Token Engine</text>
      <text x="${col3_x}" y="40" class="kh-flow-header-text">3. Living Figma Library &amp; Pilot</text>
    </g>

    <!-- Ribbons Container -->
    <g id="flow-ribbons" class="kh-flow-ribbons">
  `;

  // Render Ribbons
  data.links.forEach((link, idx) => {
    const src = nodeMap.get(link.source);
    const tgt = nodeMap.get(link.target);
    if (!src || !tgt) return;

    // Distribute connection points
    const x1 = src.x + src.w;
    const x2 = tgt.x;

    const y1_mid = src.y + src.h / 2;
    const y2_mid = tgt.y + tgt.h / 2;

    const thickness = Math.max(8, Math.min(24, link.value / 2.2));
    const pathD = buildRibbonPath(x1, y1_mid - thickness / 2, y1_mid + thickness / 2, x2, y2_mid - thickness / 2, y2_mid + thickness / 2);

    svgHtml += `
      <path id="ribbon-${idx}" 
            d="${pathD}" 
            class="kh-flow-path" 
            data-source="${link.source}" 
            data-target="${link.target}" 
            data-type="${link.type || 'standard'}"
            fill="${link.color}" 
            stroke="${link.color}">
        <title>${link.label || (src.name + ' → ' + tgt.name)}</title>
      </path>
    `;
  });

  svgHtml += `</g><!-- End Ribbons -->\n<g id="flow-nodes" class="kh-flow-nodes">`;

  // Render Nodes
  nodeMap.forEach((node, id) => {
    const isDomain = node.col === 1;
    const isBrand = node.col === 2;
    const isOutcome = node.col === 3;

    svgHtml += `
      <g id="node-${id}" class="kh-flow-node" data-id="${id}" tabindex="0" role="button" aria-label="${node.name}">
        <!-- Card Base -->
        <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="8" class="kh-flow-node-box" />
        
        <!-- Left Color Accent Bar -->
        <rect x="${node.x}" y="${node.y}" width="5" height="${node.h}" rx="2.5" fill="${node.color}" />
        
        <!-- Title -->
        <text x="${node.x + 16}" y="${node.y + 26}" class="kh-flow-node-title">${node.name}</text>
        
        <!-- Subtitle -->
        <text x="${node.x + 16}" y="${node.y + 48}" class="kh-flow-node-sub">${node.sub || (node.count ? node.count + ' elements' : 'Brand Mode')}</text>
        
        <!-- Badge / Metric -->
        ${node.badge ? `
          <g transform="translate(${node.x + node.w - 92}, ${node.y + 12})">
            <rect width="82" height="20" rx="10" fill="${node.color}" fill-opacity="0.12" stroke="${node.color}" stroke-width="0.8" />
            <text x="41" y="14" text-anchor="middle" class="kh-flow-badge-text" fill="${node.color}">${node.badge}</text>
          </g>
        ` : ''}
        ${node.metric ? `
          <g transform="translate(${node.x + node.w - 82}, ${node.y + 12})">
            <rect width="72" height="20" rx="4" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="0.8" />
            <text x="36" y="14" text-anchor="middle" class="kh-flow-badge-text" fill="#334155">${node.metric}</text>
          </g>
        ` : ''}
        ${isDomain && node.count ? `
          <text x="${node.x + node.w - 14}" y="${node.y + 26}" text-anchor="end" class="kh-flow-node-count" fill="${node.color}">${node.count}</text>
        ` : ''}
      </g>
    `;
  });

  svgHtml += `</g>`;
  svg.innerHTML = svgHtml;

  // Interactivity Controller
  const allNodes = svg.querySelectorAll('.kh-flow-node');
  const allPaths = svg.querySelectorAll('.kh-flow-path');
  let activeFilter = 'all';
  let pinnedNode = null;

  function setFocus(selectedId) {
    if (!selectedId) {
      // Reset to current filter
      applyFilter(activeFilter);
      return;
    }

    const node = nodeMap.get(selectedId);
    if (!node) return;

    // Highlight detail panel
    detailTitle.textContent = node.name;
    detailDesc.textContent = node.desc || node.sub;
    detailTag.textContent = node.col === 1 ? 'Storybook Source' : (node.col === 2 ? 'Brand Mode' : 'Figma Pilot Outcome');
    detailTag.style.background = node.color + '22';
    detailTag.style.color = node.color;

    if (node.id === 'mcr') {
      metric1.textContent = '32px'; label1.textContent = 'Pill Radius';
      metric2.textContent = '12px'; label2.textContent = 'Checkbox Radius';
      metric3.textContent = '#591A61'; label3.textContent = 'Primary Plum';
    } else if (node.id === 'tokens') {
      metric1.textContent = '540'; label1.textContent = 'Total Tokens';
      metric2.textContent = '471'; label2.textContent = 'Invariant (87.2%)';
      metric3.textContent = '69'; label3.textContent = 'Variant (12.8%)';
    } else if (node.id === 'content') {
      metric1.textContent = '103'; label1.textContent = 'Variants';
      metric2.textContent = '40'; label2.textContent = 'Table System';
      metric3.textContent = '4'; label3.textContent = 'Card Presets';
    } else if (node.id === 'update') {
      metric1.textContent = '30px'; label1.textContent = 'Original Value';
      metric2.textContent = '32px'; label2.textContent = 'Tested Update';
      metric3.textContent = '100%'; label3.textContent = 'Overrides Kept';
    } else {
      metric1.textContent = node.count || '396'; label1.textContent = 'Elements';
      metric2.textContent = node.badge || 'Active'; label2.textContent = 'Status';
      metric3.textContent = '100%'; label3.textContent = 'Contract Fit';
    }

    // Determine connected node IDs
    const connectedNodeIds = new Set([selectedId]);

    allPaths.forEach((path) => {
      const s = path.dataset.source;
      const t = path.dataset.target;
      if (s === selectedId || t === selectedId) {
        path.classList.add('kh-flow-path--highlight');
        path.classList.remove('kh-flow-path--dimmed');
        connectedNodeIds.add(s);
        connectedNodeIds.add(t);
      } else {
        path.classList.remove('kh-flow-path--highlight');
        path.classList.add('kh-flow-path--dimmed');
      }
    });

    allNodes.forEach((n) => {
      const nid = n.dataset.id;
      if (connectedNodeIds.has(nid)) {
        n.classList.add('kh-flow-node--active');
        n.classList.remove('kh-flow-node--dimmed');
      } else {
        n.classList.remove('kh-flow-node--active');
        n.classList.add('kh-flow-node--dimmed');
      }
    });
  }

  function applyFilter(filter) {
    activeFilter = filter;
    pinnedNode = null;

    if (filter === 'all') {
      allNodes.forEach(n => n.classList.remove('kh-flow-node--dimmed', 'kh-flow-node--active'));
      allPaths.forEach(p => p.classList.remove('kh-flow-path--dimmed', 'kh-flow-path--highlight'));
      detailTitle.textContent = 'Overview: The 3-Tier Bridge';
      detailDesc.textContent = 'Hover or click on any Storybook schema, Brand mode, or Figma outcome to trace how structured content flows across the systems.';
      detailTag.textContent = 'Interactive Mode';
      detailTag.style.background = '#E2E8F0';
      detailTag.style.color = '#334155';
      metric1.textContent = '540'; label1.textContent = 'Tokens';
      metric2.textContent = '396'; label2.textContent = 'Symbols';
      metric3.textContent = '87.2%'; label3.textContent = 'Shared Core';
      return;
    }

    setFocus(filter);
  }

  // Attach Node Events
  allNodes.forEach((nodeEl) => {
    const id = nodeEl.dataset.id;

    nodeEl.addEventListener('mouseenter', () => {
      if (!pinnedNode) setFocus(id);
    });

    nodeEl.addEventListener('mouseleave', () => {
      if (!pinnedNode) applyFilter(activeFilter);
    });

    nodeEl.addEventListener('click', () => {
      if (pinnedNode === id) {
        pinnedNode = null;
        applyFilter(activeFilter);
      } else {
        pinnedNode = id;
        setFocus(id);
      }
    });

    nodeEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pinnedNode = (pinnedNode === id) ? null : id;
        if (pinnedNode) setFocus(id);
        else applyFilter(activeFilter);
      }
    });
  });

  // Attach Filter Button Events
  const filterBtns = container.querySelectorAll('.kh-flow-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('kh-flow-btn--active'));
      btn.classList.add('kh-flow-btn--active');
      applyFilter(btn.dataset.filter);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      pinnedNode = null;
      applyFilter('all');
    });
  }
})();
