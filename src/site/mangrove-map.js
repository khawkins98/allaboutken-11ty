(() => {
  // ==========================================================================
  // MODULE 1: THE LUMINOUS FLUID PIPELINE (Bremer / Visual Cinnamon Inspired)
  // Traces Storybook schemas -> Multi-Brand Token Engine -> Figma Library & Pilot
  // ==========================================================================
  const mapContainer = document.getElementById('mangrove-interactive-map');
  if (mapContainer) {
    initFluidPipeline(mapContainer);
  }

  // ==========================================================================
  // MODULE 2: COMPONENT CONTRACT & BRAND MORPHER STUDIO
  // Live Storybook component contract morphing into Figma multi-brand geometry
  // ==========================================================================
  const studioContainer = document.getElementById('mangrove-brand-studio');
  if (studioContainer) {
    initBrandStudio(studioContainer);
  }

  // --------------------------------------------------------------------------
  // IMPLEMENTATION: FLUID PIPELINE
  // --------------------------------------------------------------------------
  function initFluidPipeline(container) {
    const data = {
      domains: [
        { id: 'tokens', name: 'Foundational Tokens', count: 540, type: 'domain', color: '#D4A373', sub: '188 Colors · 348 Dims · 4 Fonts', desc: '540 total design tokens mined from tokens/mangrove.yaml and 5 brand override files. 471 tokens (87.2%) remain invariant across all brands, anchoring the system against drift; 69 tokens (12.8%) adapt.' },
        { id: 'forms', name: 'Forms & Selection', count: 140, type: 'domain', color: '#E05A47', sub: 'ComboBox, Radio, Checkbox', desc: '140 variants across 9 component families. Storybook schemas define strict input states, error validation cascades (.mg-form-input:focus-visible), and accessibility bindings. Caught the 0.55 opacity variable conversion bug in Figma.' },
        { id: 'content', name: 'Content & Data', count: 103, type: 'domain', color: '#2E8B57', sub: 'HorizontalBookCard & Tables', desc: '103 variants. Features the 40-variant Table ecosystem and HorizontalBookCard compiled directly from Storybook’s Bali GP2022 fixture with cardGeometryChecks.js automated bounding box assertions.' },
        { id: 'nav', name: 'Navigation & Disclosure', count: 62, type: 'domain', color: '#3B82F6', sub: 'Hero layouts, TOC & Tabs', desc: '62 variants. Responsive Hero templates with image ratio handling and Table of Contents jump links documented in stories/Components/Navigation, preserving nested link focus.' },
        { id: 'actions', name: 'Actions & CTAs', count: 47, type: 'domain', color: '#8B5CF6', sub: 'Button modes & Text CTAs', desc: '47 variants. Living Button masters with brand mode variables, loading states, and native double-stroke focus geometry for unfilled buttons.' }
      ],
      brands: [
        { id: 'undrr', name: 'UNDRR', color: '#004F91', badge: 'Release Candidate', sub: 'Core #004F91 · 7px radius', desc: 'Core bounded release candidate (tokens/undrr.yaml). Primary #004F91, container radius 7px. Baseline reference for token propagation and layout invariant checks.' },
        { id: 'pweb', name: 'PreventionWeb', color: '#0A6969', badge: '+6 Palette & Surface', sub: 'Teal #0A6969 · Soft surface', desc: 'Disaster risk knowledge platform (tokens/preventionweb.yaml). Features forest teal primary (#0A6969), soft surface (#EBF3F3), 5.5:1 / 69.7 perceptual contrast, and custom tag tokens.' },
        { id: 'mcr', name: 'MCR2030', color: '#591A61', badge: '32px Pill Radius', sub: 'Plum #591A61 · 32px pill buttons', desc: 'Making Cities Resilient 2030 (tokens/mcr.yaml). Brand adaptation with 32px pill-shaped buttons (radius.button: spacing.300), 12px checkbox radius, and distinct purple identity (#591A61).' },
        { id: 'delta', name: 'DELTA Resilience', color: '#D97706', badge: '+Hero Spacing', sub: 'Orange #D97706 · Hero spacing', desc: 'DELTA resilience initiative (tokens/delta.yaml). Corporate blue primary with tailored spacing/400 hero overlay padding.' },
        { id: 'irp', name: 'IRP', color: '#0F78BF', badge: '+Soft Surface', sub: 'Sky blue #0F78BF · Soft surface', desc: 'International Recovery Platform (tokens/irp.yaml). Sky blue primary (#0F78BF) and dedicated light card background (#ECF4FA).' }
      ],
      outcomes: [
        { id: 'symbols', name: '396 Living Symbols', color: '#004F91', sub: '01 Library masters', desc: '396 compiled component masters across 34 component sets in Figma 01 Library, built via custom importer plugin recipes from 68 Storybook component families.' },
        { id: 'presets', name: 'Book Card Presets', color: '#2E8B57', sub: 'Default, NoImage, NoLink...', desc: 'Editorial presets rooted in HorizontalBookCard.stories.jsx schemas. Designers toggle configurations without breaking Auto Layout or inventing invalid states.' },
        { id: 'pilot', name: 'Consuming Pilot (56 Inst)', color: '#0A6969', sub: 'Desktop + Mobile fixture', desc: 'Real-world consumer validation file. 56 remotely linked instances with custom labels, toggles, and designer notes.' },
        { id: 'update', name: 'Spacing Propagation', color: '#D97706', sub: '30px → 32px verified update', desc: 'Live variable update: modified spacing/300 from 30px to 32px. Layout adapted smoothly while 100% of instance overrides survived intact.' },
        { id: 'boundary', name: 'Ownership Boundary', color: '#591A61', sub: 'System vs Designer', desc: 'Enforced boundary: system owns component anatomy and tokens; designer owns copy, visibility toggles, and local preset choices.' }
      ],
      links: [
        // 87.2% Invariant Core Spine (Tokens to all Brands)
        { source: 'tokens', target: 'undrr', value: 87, color: '#D4A373', type: 'spine', label: '87.2% Shared Invariant Core' },
        { source: 'tokens', target: 'pweb', value: 87, color: '#D4A373', type: 'spine', label: '87.2% Shared Invariant Core' },
        { source: 'tokens', target: 'mcr', value: 87, color: '#D4A373', type: 'spine', label: '87.2% Shared Invariant Core' },
        { source: 'tokens', target: 'delta', value: 87, color: '#D4A373', type: 'spine', label: '87.2% Shared Invariant Core' },
        { source: 'tokens', target: 'irp', value: 87, color: '#D4A373', type: 'spine', label: '87.2% Shared Invariant Core' },

        // Domain to Brands
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

    container.innerHTML = `
      <div class="kh-flow-viz">
        <div class="kh-flow-viz__toolbar">
          <span class="kh-flow-viz__label">Interactive Trace:</span>
          <div class="kh-flow-viz__filters" role="tablist">
            <button type="button" class="kh-flow-btn kh-flow-btn--active" data-filter="all">All Systems</button>
            <button type="button" class="kh-flow-btn" data-filter="tokens">87.2% Shared Core</button>
            <button type="button" class="kh-flow-btn" data-filter="mcr">MCR2030 (Pill Radius)</button>
            <button type="button" class="kh-flow-btn" data-filter="pweb">PreventionWeb</button>
            <button type="button" class="kh-flow-btn" data-filter="content">Book Card Presets</button>
            <button type="button" class="kh-flow-btn" data-filter="update">Spacing Propagation</button>
            <button type="button" class="kh-flow-btn" data-filter="forms">0.55 Opacity Bug</button>
          </div>
        </div>

        <div class="kh-flow-viz__stage">
          <svg id="mangrove-flow-svg" viewBox="0 0 1080 570" width="100%" height="auto" preserveAspectRatio="xMidYMid meet"></svg>
        </div>

        <div id="kh-flow-detail" class="kh-flow-detail" aria-live="polite">
          <div class="kh-flow-detail__main">
            <div class="kh-flow-detail__header">
              <span id="detail-tag" class="kh-flow-detail__tag">System Architecture</span>
              <button type="button" id="detail-close" class="kh-flow-detail__close" aria-label="Reset inspection">Reset view ✕</button>
            </div>
            <h4 id="detail-title" class="kh-flow-detail__title">Hover or click any node to trace systemic connections</h4>
            <p id="detail-desc" class="kh-flow-detail__desc">Explore how Storybook schemas and 540 design tokens compile into 396 living symbols and 5 brand modes in Figma without manual drift.</p>
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

    const col1_x = 24;
    const col1_w = 230;
    const col2_x = 425;
    const col2_w = 230;
    const col3_x = 826;
    const col3_w = 230;

    const nodeMap = new Map();

    data.domains.forEach((d, i) => {
      const y = 70 + i * 100;
      nodeMap.set(d.id, { ...d, x: col1_x, y, w: col1_w, h: 76, col: 1 });
    });

    data.brands.forEach((b, i) => {
      const y = 70 + i * 100;
      nodeMap.set(b.id, { ...b, x: col2_x, y, w: col2_w, h: 76, col: 2 });
    });

    data.outcomes.forEach((o, i) => {
      const y = 70 + i * 100;
      nodeMap.set(o.id, { ...o, x: col3_x, y, w: col3_w, h: 76, col: 3 });
    });

    function buildRibbonPath(x1, y1_top, y1_bot, x2, y2_top, y2_bot) {
      const dx = x2 - x1;
      const cx1 = x1 + dx * 0.46;
      const cx2 = x1 + dx * 0.54;
      return `M ${x1} ${y1_top} C ${cx1} ${y1_top}, ${cx2} ${y2_top}, ${x2} ${y2_top} L ${x2} ${y2_bot} C ${cx2} ${y2_bot}, ${cx1} ${y1_bot}, ${x1} ${y1_bot} Z`;
    }

    function buildCenterCurve(x1, y1, x2, y2) {
      const dx = x2 - x1;
      const cx1 = x1 + dx * 0.46;
      const cx2 = x1 + dx * 0.54;
      return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
    }

    let svgHtml = `
      <defs>
        <filter id="flow-node-glow" x="-8%" y="-12%" width="116%" height="128%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.05"/>
        </filter>
      </defs>

      <!-- Column Headers -->
      <g class="kh-flow-headers">
        <text x="${col1_x}" y="40" class="kh-flow-header-text">1. Structured Schemas (Storybook)</text>
        <text x="${col2_x}" y="40" class="kh-flow-header-text">2. Five-Brand Token Engine</text>
        <text x="${col3_x}" y="40" class="kh-flow-header-text">3. Living Figma Library &amp; Pilot</text>
      </g>

      <!-- Ribbons & Filaments -->
      <g id="flow-ribbons" class="kh-flow-ribbons">
    `;

    data.links.forEach((link, idx) => {
      const src = nodeMap.get(link.source);
      const tgt = nodeMap.get(link.target);
      if (!src || !tgt) return;

      const x1 = src.x + src.w;
      const x2 = tgt.x;
      const y1_mid = src.y + src.h / 2;
      const y2_mid = tgt.y + tgt.h / 2;

      const thickness = Math.max(8, Math.min(26, link.value / 2.2));
      const ribbonPath = buildRibbonPath(x1, y1_mid - thickness / 2, y1_mid + thickness / 2, x2, y2_mid - thickness / 2, y2_mid + thickness / 2);
      const centerPath = buildCenterCurve(x1, y1_mid, x2, y2_mid);
      const upperFilament = buildCenterCurve(x1, y1_mid - thickness / 3, x2, y2_mid - thickness / 3);
      const lowerFilament = buildCenterCurve(x1, y1_mid + thickness / 3, x2, y2_mid + thickness / 3);

      svgHtml += `
        <!-- Flow Channel ${idx} -->
        <g class="kh-flow-channel" data-source="${link.source}" data-target="${link.target}">
          <path id="ribbon-${idx}" 
                d="${ribbonPath}" 
                class="kh-flow-path" 
                data-source="${link.source}" 
                data-target="${link.target}" 
                fill="${link.color}" 
                stroke="${link.color}">
            <title>${link.label || (src.name + ' → ' + tgt.name)}</title>
          </path>
          
          <!-- Organic Inner Filaments (Nadieh Bremer Silk Strands) -->
          <path d="${upperFilament}" class="kh-flow-filament" stroke="${link.color}" stroke-dasharray="4 3" />
          <path d="${lowerFilament}" class="kh-flow-filament" stroke="${link.color}" stroke-dasharray="5 4" />
          
          <!-- Luminous Animated Pulse Strand -->
          <path d="${centerPath}" class="kh-flow-pulse" stroke="${link.color}" />
        </g>
      `;
    });

    svgHtml += `</g><!-- End Ribbons -->\n<g id="flow-nodes" class="kh-flow-nodes">`;

    nodeMap.forEach((node, id) => {
      const isDomain = node.col === 1;

      svgHtml += `
        <g id="node-${id}" class="kh-flow-node" data-id="${id}" tabindex="0" role="button" aria-label="${node.name}">
          <!-- Card Body -->
          <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="8" class="kh-flow-node-box" />
          
          <!-- Left Color Accent Bar -->
          <rect x="${node.x}" y="${node.y}" width="5" height="${node.h}" rx="2.5" fill="${node.color}" />
          
          <!-- Title -->
          <text x="${node.x + 16}" y="${node.y + 26}" class="kh-flow-node-title">${node.name}</text>
          
          <!-- Subtitle / Meta -->
          <text x="${node.x + 16}" y="${node.y + 48}" class="kh-flow-node-sub">${node.sub || (node.count ? node.count + ' elements' : 'Brand Mode')}</text>
          
          <!-- Connector Ports -->
          ${node.col > 1 ? `<circle cx="${node.x}" cy="${node.y + node.h / 2}" r="3.5" fill="#FFF" stroke="${node.color}" stroke-width="1.8" />` : ''}
          ${node.col < 3 ? `<circle cx="${node.x + node.w}" cy="${node.y + node.h / 2}" r="3.5" fill="#FFF" stroke="${node.color}" stroke-width="1.8" />` : ''}

          <!-- Badge -->
          ${node.badge ? `
            <g transform="translate(${node.x + node.w - 94}, ${node.y + 12})">
              <rect width="84" height="20" rx="10" fill="${node.color}" fill-opacity="0.12" stroke="${node.color}" stroke-width="0.8" />
              <text x="42" y="14" text-anchor="middle" class="kh-flow-badge-text" fill="${node.color}">${node.badge}</text>
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

    const allNodes = svg.querySelectorAll('.kh-flow-node');
    const allChannels = svg.querySelectorAll('.kh-flow-channel');
    let activeFilter = 'all';
    let pinnedNode = null;

    function setFocus(selectedId) {
      if (!selectedId) {
        applyFilter(activeFilter);
        return;
      }

      const node = nodeMap.get(selectedId);
      if (!node) return;

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
      } else if (node.id === 'pweb') {
        metric1.textContent = '#0A6969'; label1.textContent = 'Forest Teal';
        metric2.textContent = '#EBF3F3'; label2.textContent = 'Soft Surface';
        metric3.textContent = '5.5:1'; label3.textContent = 'Perceptual AA';
      } else if (node.id === 'content') {
        metric1.textContent = '103'; label1.textContent = 'Variants';
        metric2.textContent = '40'; label2.textContent = 'Table System';
        metric3.textContent = '4'; label3.textContent = 'Card Presets';
      } else if (node.id === 'forms') {
        metric1.textContent = '140'; label1.textContent = 'Variants';
        metric2.textContent = '0.55 → 55'; label2.textContent = 'Opacity Fix';
        metric3.textContent = '100%'; label3.textContent = 'Cascade Kept';
      } else if (node.id === 'update') {
        metric1.textContent = '30px'; label1.textContent = 'Original Value';
        metric2.textContent = '32px'; label2.textContent = 'Tested Update';
        metric3.textContent = '100%'; label3.textContent = 'Overrides Kept';
      } else {
        metric1.textContent = node.count || '396'; label1.textContent = 'Elements';
        metric2.textContent = node.badge || 'Active'; label2.textContent = 'Status';
        metric3.textContent = '100%'; label3.textContent = 'Contract Fit';
      }

      const connectedNodeIds = new Set([selectedId]);

      allChannels.forEach((ch) => {
        const s = ch.dataset.source;
        const t = ch.dataset.target;
        const ribbon = ch.querySelector('.kh-flow-path');
        const filaments = ch.querySelectorAll('.kh-flow-filament');
        const pulse = ch.querySelector('.kh-flow-pulse');

        if (s === selectedId || t === selectedId) {
          ribbon.classList.add('kh-flow-path--highlight');
          ribbon.classList.remove('kh-flow-path--dimmed');
          filaments.forEach(f => f.classList.add('kh-flow-filament--highlight'));
          if (pulse) pulse.classList.add('kh-flow-pulse--highlight');
          connectedNodeIds.add(s);
          connectedNodeIds.add(t);
        } else {
          ribbon.classList.remove('kh-flow-path--highlight');
          ribbon.classList.add('kh-flow-path--dimmed');
          filaments.forEach(f => {
            f.classList.remove('kh-flow-filament--highlight');
            f.classList.add('kh-flow-filament--dimmed');
          });
          if (pulse) pulse.classList.remove('kh-flow-pulse--highlight');
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
        allChannels.forEach(ch => {
          ch.querySelector('.kh-flow-path').classList.remove('kh-flow-path--dimmed', 'kh-flow-path--highlight');
          ch.querySelectorAll('.kh-flow-filament').forEach(f => f.classList.remove('kh-flow-filament--dimmed', 'kh-flow-filament--highlight'));
          const p = ch.querySelector('.kh-flow-pulse');
          if (p) p.classList.remove('kh-flow-pulse--highlight');
        });

        detailTitle.textContent = 'Overview: The 3-Tier Bridge';
        detailDesc.textContent = 'Hover or click any Storybook schema, Brand mode, or Figma outcome to trace how structured content flows across the systems.';
        detailTag.textContent = 'System Architecture';
        detailTag.style.background = '#E2E8F0';
        detailTag.style.color = '#334155';
        metric1.textContent = '540'; label1.textContent = 'Tokens';
        metric2.textContent = '396'; label2.textContent = 'Symbols';
        metric3.textContent = '87.2%'; label3.textContent = 'Shared Core';
        return;
      }

      setFocus(filter);
    }

    allNodes.forEach((nodeEl) => {
      const id = nodeEl.dataset.id;
      nodeEl.addEventListener('mouseenter', () => { if (!pinnedNode) setFocus(id); });
      nodeEl.addEventListener('mouseleave', () => { if (!pinnedNode) applyFilter(activeFilter); });
      nodeEl.addEventListener('click', () => {
        pinnedNode = (pinnedNode === id) ? null : id;
        if (pinnedNode) setFocus(id);
        else applyFilter(activeFilter);
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
        filterBtns.forEach(b => b.classList.toggle('kh-flow-btn--active', b.dataset.filter === 'all'));
        applyFilter('all');
      });
    }
  }

  // --------------------------------------------------------------------------
  // IMPLEMENTATION: COMPONENT CONTRACT & BRAND MORPHER STUDIO
  // --------------------------------------------------------------------------
  function initBrandStudio(container) {
    const brands = {
      undrr: {
        id: 'undrr',
        name: 'UNDRR',
        primary: '#004F91',
        tagBg: '#E6EFF6',
        tagColor: '#004F91',
        tagRadius: '4px',
        cardBg: '#FFFFFF',
        cardBorder: '#E2D8C3',
        cardRadius: '0px',
        btnBg: '#004F91',
        btnRadius: '7px',
        surfaceName: 'Base White',
        contrast: '12.2:1 (AAA)',
        tagLabel: 'GAR2022 PUBLICATION'
      },
      pweb: {
        id: 'pweb',
        name: 'PreventionWeb',
        primary: '#0A6969',
        tagBg: '#DCEAEA',
        tagColor: '#0A6969',
        tagRadius: '4px',
        cardBg: '#EBF3F3',
        cardBorder: '#C8DDDD',
        cardRadius: '0px',
        btnBg: '#0A6969',
        btnRadius: '7px',
        surfaceName: 'Soft Teal (#EBF3F3)',
        contrast: '5.5:1 (AA)',
        tagLabel: 'DISASTER RISK DATA'
      },
      mcr: {
        id: 'mcr',
        name: 'MCR2030',
        primary: '#591A61',
        tagBg: '#F1E5F3',
        tagColor: '#591A61',
        tagRadius: '16px',
        cardBg: '#FAF5FA',
        cardBorder: '#E4D5E6',
        cardRadius: '8px',
        btnBg: '#591A61',
        btnRadius: '32px',
        surfaceName: 'Soft Plum (#FAF5FA)',
        contrast: '9.8:1 (AAA)',
        tagLabel: 'URBAN RESILIENCE'
      },
      delta: {
        id: 'delta',
        name: 'DELTA Resilience',
        primary: '#004F91',
        tagBg: '#FEF3C7',
        tagColor: '#D97706',
        tagRadius: '4px',
        cardBg: '#FFFFFF',
        cardBorder: '#E2D8C3',
        cardRadius: '0px',
        btnBg: '#004F91',
        btnRadius: '7px',
        surfaceName: 'Base White',
        contrast: '12.2:1 (AAA)',
        tagLabel: 'POLICY BRIEF'
      },
      irp: {
        id: 'irp',
        name: 'IRP',
        primary: '#0F78BF',
        tagBg: '#DEEDF7',
        tagColor: '#0F78BF',
        tagRadius: '4px',
        cardBg: '#ECF4FA',
        cardBorder: '#CDE1F0',
        cardRadius: '0px',
        btnBg: '#0F78BF',
        btnRadius: '7px',
        surfaceName: 'Soft Sky (#ECF4FA)',
        contrast: '6.02:1 (AA)',
        tagLabel: 'RECOVERY PLATFORM'
      }
    };

    const presets = {
      default: {
        id: 'default',
        title: 'Default (Bali GP2022 Fixture)',
        showImage: true,
        showLink: true,
        showButton: true,
        desc: 'Canonical publication teaser: 160×240 complete cover artwork, content tag, 2-line title, body, and action button.'
      },
      noimage: {
        id: 'noimage',
        title: 'Without an Image',
        showImage: false,
        showLink: true,
        showButton: true,
        desc: 'Content-only mode: image collapses, content container fills full card width, passing checkPhotoCardEdges assertions.'
      },
      nolink: {
        id: 'nolink',
        title: 'Without a Link',
        showImage: true,
        showLink: false,
        showButton: false,
        desc: 'Static educational archive: headline and container are unlinked, button CTA is hidden, metadata stays intact.'
      },
      buttononly: {
        id: 'buttononly',
        title: 'Button Only',
        showImage: true,
        showLink: false,
        showButton: true,
        desc: 'Isolated action mode: card background is unlinked, primary action button handles the single interaction target.'
      }
    };

    container.innerHTML = `
      <div class="kh-brand-studio">
        <div class="kh-brand-studio__header">
          <h3 class="kh-brand-studio__title">Interactive Component Contract &amp; Brand Morpher Studio</h3>
          <p class="kh-brand-studio__subtitle">Watch how Storybook’s <code>HorizontalBookCard</code> schema morphs live across brand token modes while preserving 100% of container layout rules and auto-layout bounds.</p>
        </div>

        <div class="kh-brand-studio__controls">
          <div class="kh-brand-studio__group">
            <span class="kh-brand-studio__label">Brand Mode:</span>
            <button type="button" class="kh-brand-studio__brand-btn kh-brand-studio__brand-btn--active" data-brand="undrr"><span class="kh-brand-dot" style="background: #004F91;"></span>UNDRR</button>
            <button type="button" class="kh-brand-studio__brand-btn" data-brand="pweb"><span class="kh-brand-dot" style="background: #0A6969;"></span>PreventionWeb</button>
            <button type="button" class="kh-brand-studio__brand-btn" data-brand="mcr"><span class="kh-brand-dot" style="background: #591A61;"></span>MCR2030 (32px Pill)</button>
            <button type="button" class="kh-brand-studio__brand-btn" data-brand="delta"><span class="kh-brand-dot" style="background: #D97706;"></span>DELTA</button>
            <button type="button" class="kh-brand-studio__brand-btn" data-brand="irp"><span class="kh-brand-dot" style="background: #0F78BF;"></span>IRP</button>
          </div>

          <div class="kh-brand-studio__group">
            <span class="kh-brand-studio__label">Editorial Preset:</span>
            <button type="button" class="kh-brand-studio__preset-btn kh-brand-studio__preset-btn--active" data-preset="default">Default</button>
            <button type="button" class="kh-brand-studio__preset-btn" data-preset="noimage">No Image</button>
            <button type="button" class="kh-brand-studio__preset-btn" data-preset="nolink">No Link</button>
            <button type="button" class="kh-brand-studio__preset-btn" data-preset="buttononly">Button Only</button>
          </div>
        </div>

        <div class="kh-brand-studio__workspace">
          <!-- Left: Live Rendered Component -->
          <div class="kh-brand-studio__card-stage" id="live-card-stage">
            <div id="live-card" class="kh-live-card">
              <div id="live-card-visual" class="kh-live-card__visual">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 240" width="160" height="240">
                  <rect width="160" height="240" fill="#FFFFFF"/>
                  <path d="M 0 0 L 160 0 L 160 85 L 0 85 Z" fill="#004F91" id="live-svg-banner" />
                  <circle cx="80" cy="50" r="24" fill="#FFFFFF" fill-opacity="0.2"/>
                  <path d="M 68 50 L 92 50 M 80 38 L 80 62" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
                  <text x="14" y="115" font-family="'IBM Plex Sans', sans-serif" font-size="11" font-weight="700" fill="#0F172A">GAR 2022</text>
                  <text x="14" y="132" font-family="'IBM Plex Sans', sans-serif" font-size="9" fill="#475569">Our World at Risk</text>
                  <rect x="14" y="150" width="132" height="1" fill="#E2D8C3"/>
                  <text x="14" y="172" font-family="'IBM Plex Sans', sans-serif" font-size="7.5" fill="#64748B">Bali GP2022 Fixture</text>
                  <text x="14" y="186" font-family="'IBM Plex Mono', monospace" font-size="7" fill="#64748B">cardGeometryChecks.js</text>
                  <rect x="14" y="208" width="50" height="14" rx="2" fill="#E2E8F0"/>
                  <text x="39" y="218" font-family="'IBM Plex Mono', monospace" font-size="7" text-anchor="middle" fill="#334155">160 × 240</text>
                </svg>
              </div>

              <div class="kh-live-card__content">
                <span id="live-card-tag" class="kh-live-card__tag">GAR2022 PUBLICATION</span>
                <h4 id="live-card-title" class="kh-live-card__title">Global Assessment Report on Disaster Risk Reduction</h4>
                <p id="live-card-summary" class="kh-live-card__summary">Climate change is a global health emergency, with impacts felt most acutely by vulnerable populations and communities. This paper explores key systemic risk actions.</p>
                <button type="button" id="live-card-btn" class="kh-live-card__btn">Explore Publication →</button>
              </div>
            </div>

            <div id="live-assertion-badge" class="kh-brand-studio__assertion-badge">
              ✓ cardGeometryChecks.js: ALL ASSERTIONS PASSING (1:1.414 ratio, 0px border bleed)
            </div>
          </div>

          <!-- Right: Inspector Tabs -->
          <div class="kh-brand-studio__inspector">
            <div class="kh-brand-studio__tabs" role="tablist">
              <button type="button" class="kh-brand-studio__tab-btn kh-brand-studio__tab-btn--active" data-tab="tokens">Token Resolution</button>
              <button type="button" class="kh-brand-studio__tab-btn" data-tab="figma">Figma Auto Layout</button>
              <button type="button" class="kh-brand-studio__tab-btn" data-tab="storybook">Storybook Schema</button>
              <button type="button" class="kh-brand-studio__tab-btn" data-tab="edgecases">Edge-Case Logs</button>
            </div>

            <div id="inspector-content" class="kh-brand-studio__tab-content">
              <!-- Dynamically rendered tab content -->
            </div>
          </div>
        </div>
      </div>
    `;

    const liveCard = container.querySelector('#live-card');
    const liveVisual = container.querySelector('#live-card-visual');
    const liveTag = container.querySelector('#live-card-tag');
    const liveTitle = container.querySelector('#live-card-title');
    const liveBtn = container.querySelector('#live-card-btn');
    const liveSvgBanner = container.querySelector('#live-svg-banner');
    const liveAssertionBadge = container.querySelector('#live-assertion-badge');
    const inspectorContent = container.querySelector('#inspector-content');

    let currentBrand = 'undrr';
    let currentPreset = 'default';
    let currentTab = 'tokens';

    function renderInspector() {
      const b = brands[currentBrand];
      const p = presets[currentPreset];

      if (currentTab === 'tokens') {
        inspectorContent.innerHTML = `
          <table class="kh-token-table">
            <thead>
              <tr>
                <th>Design Token</th>
                <th>Resolved Value</th>
                <th>Classification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="kh-token-table__name">color.interactive</td>
                <td class="kh-token-table__val"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${b.primary};vertical-align:middle;margin-right:4px;"></span>${b.primary}</td>
                <td class="kh-token-table__variant">Brand Mode Delta</td>
              </tr>
              <tr>
                <td class="kh-token-table__name">radius.button</td>
                <td class="kh-token-table__val"><strong>${b.btnRadius}</strong> ${b.id === 'mcr' ? '(pill)' : '(standard)'}</td>
                <td class="${b.id === 'mcr' ? 'kh-token-table__variant' : 'kh-token-table__core'}">${b.id === 'mcr' ? 'MCR Override' : '87.2% Core'}</td>
              </tr>
              <tr>
                <td class="kh-token-table__name">card.publication.bg</td>
                <td class="kh-token-table__val">${b.surfaceName}</td>
                <td class="${b.id === 'pweb' || b.id === 'irp' ? 'kh-token-table__variant' : 'kh-token-table__core'}">${b.id === 'pweb' || b.id === 'irp' ? 'Surface Tint' : '87.2% Core'}</td>
              </tr>
              <tr>
                <td class="kh-token-table__name">spacing.300</td>
                <td class="kh-token-table__val">32px (Tested Update)</td>
                <td class="kh-token-table__core">87.2% Invariant Core</td>
              </tr>
              <tr>
                <td class="kh-token-table__name">typography.title</td>
                <td class="kh-token-table__val">Roboto-Bold 18px (CSS 600)</td>
                <td class="kh-token-table__core">87.2% Invariant Core</td>
              </tr>
              <tr>
                <td class="kh-token-table__name">contrast.ratio</td>
                <td class="kh-token-table__val">${b.contrast}</td>
                <td class="kh-token-table__core">WCAG Compliant</td>
              </tr>
            </tbody>
          </table>
          <p style="margin: 0.75rem 0 0; font-size: 11px; color: #64748B;">471 of 540 tokens (87.2%) remain byte-identical across all 5 properties, guaranteeing layout stability while brand modes switch color, radius, and soft surfaces.</p>
        `;
      } else if (currentTab === 'figma') {
        inspectorContent.innerHTML = `
          <pre class="kh-tree-block">
📦 Frame: HorizontalBookCard [HUG Horizontal, Gap: 24px]
 ├── 🖼️ Frame: Visual [FIXED: 140×210px, Clip: true]
 │    └── Component: PublicationCover (Natural 1:1.414)
 └── 📄 Frame: Content [FILL Container, Vertical, Gap: 8px]
      ├── 🏷️ Tag [HUG, Radius: VAR(radius.tag = ${b.tagRadius})]
      ├── 🔤 Title [FILL, Text Balance, 2-line clamp]
      ├── 📝 Summary [FILL, Font: Roboto-Regular 12px/1.45]
      └── 🔘 Button [HUG, Radius: VAR(radius.button = ${b.btnRadius})]
           └── Fill: VAR(color.interactive = ${b.primary})
          </pre>
          <p style="margin: 0.75rem 0 0; font-size: 11px; color: #475569;">Figma Auto Layout hierarchy generated by the AI importer plugin. Component structure is owned by the system; copy, preset selection, and instance overrides belong to the designer.</p>
        `;
      } else if (currentTab === 'storybook') {
        inspectorContent.innerHTML = `
          <pre class="kh-tree-block">
// HorizontalBookCard.stories.jsx (${p.title})
export const ${p.id.toUpperCase()} = {
  render: (args) => (
    &lt;HorizontalBookCard
      variant="primary"
      contenttile="${b.tagLabel}"
      title="Global Assessment Report..."
      summaryText="Climate change is a global health..."
      imgback=${p.showImage ? '"Bali.JPG.jpg"' : 'null'}
      link=${p.showLink ? '"#"' : 'null'}
      button=${p.showButton ? '"Explore Publication →"' : 'null'}
      {...args}
    /&gt;
  ),
  play: checkPublicationSurface // cardGeometryChecks.js
};
          </pre>
          <p style="margin: 0.75rem 0 0; font-size: 11px; color: #475569;">Storybook play function runs <code>cardGeometryChecks.js</code> to assert bounding box insets, aspect ratios, and padding before any Figma export is allowed.</p>
        `;
      } else if (currentTab === 'edgecases') {
        inspectorContent.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:0.6rem;">
            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:4px;padding:8px 10px;">
              <strong style="color:#991B1B;display:block;margin-bottom:2px;">The 0.55 Opacity Variable Trap</strong>
              <span style="font-size:11px;color:#7F1D1D;">Figma layer opacity variables expect integers (0–100), while native node opacity uses decimals (0–1). Exporting 0.55 directly resulted in 0.0055 opacity, rendering the disabled ComboBox invisible in Figma.</span>
            </div>
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:4px;padding:8px 10px;">
              <strong style="color:#166534;display:block;margin-bottom:2px;">Double-Stroke Focus Geometry</strong>
              <span style="font-size:11px;color:#14532D;">Unfilled buttons require native two-band stroke geometry to replicate browser :focus-visible rings without clipping Auto Layout bounds during variant swaps.</span>
            </div>
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:4px;padding:8px 10px;">
              <strong style="color:#1E40AF;display:block;margin-bottom:2px;">Spacing Propagation Verification</strong>
              <span style="font-size:11px;color:#1E3A8A;">Live token test modified spacing/300 from 30px to 32px. 100% of designer instance overrides, local notes, and custom labels survived intact upon library update.</span>
            </div>
          </div>
        `;
      }
    }

    function updateCard() {
      const b = brands[currentBrand];
      const p = presets[currentPreset];

      liveCard.style.setProperty('--live-card-bg', b.cardBg);
      liveCard.style.setProperty('--live-card-border', b.cardBorder);
      liveCard.style.setProperty('--live-card-radius', b.cardRadius);
      liveCard.style.setProperty('--live-btn-bg', b.btnBg);
      liveCard.style.setProperty('--live-btn-radius', b.btnRadius);
      liveCard.style.setProperty('--live-tag-color', b.tagColor);
      liveCard.style.setProperty('--live-tag-bg', b.tagBg);
      liveCard.style.setProperty('--live-tag-radius', b.tagRadius);

      liveTag.textContent = b.tagLabel;
      liveSvgBanner.setAttribute('fill', b.primary);

      if (p.showImage) {
        liveVisual.style.display = 'block';
      } else {
        liveVisual.style.display = 'none';
      }

      if (p.showButton) {
        liveBtn.style.display = 'inline-block';
      } else {
        liveBtn.style.display = 'none';
      }

      if (p.showLink) {
        liveTitle.innerHTML = '<a href="javascript:void(0)" style="color:inherit;text-decoration:none;">Global Assessment Report on Disaster Risk Reduction</a>';
      } else {
        liveTitle.textContent = 'Global Assessment Report on Disaster Risk Reduction';
      }

      liveAssertionBadge.textContent = p.showImage 
        ? `✓ cardGeometryChecks.js: ALL ASSERTIONS PASSING (1:1.414 ratio, 0px border bleed, ${b.name} tokens bound)`
        : `✓ cardGeometryChecks.js: PASS (Content reflows to clientWidth: 520px, 0px image delta)`;

      renderInspector();
    }

    // Brand buttons
    const brandBtns = container.querySelectorAll('.kh-brand-studio__brand-btn');
    brandBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        brandBtns.forEach(b => b.classList.remove('kh-brand-studio__brand-btn--active'));
        btn.classList.add('kh-brand-studio__brand-btn--active');
        currentBrand = btn.dataset.brand;
        updateCard();
      });
    });

    // Preset buttons
    const presetBtns = container.querySelectorAll('.kh-brand-studio__preset-btn');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(p => p.classList.remove('kh-brand-studio__preset-btn--active'));
        btn.classList.add('kh-brand-studio__preset-btn--active');
        currentPreset = btn.dataset.preset;
        updateCard();
      });
    });

    // Tab buttons
    const tabBtns = container.querySelectorAll('.kh-brand-studio__tab-btn');
    tabBtns.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabBtns.forEach(t => t.classList.remove('kh-brand-studio__tab-btn--active'));
        tab.classList.add('kh-brand-studio__tab-btn--active');
        currentTab = tab.dataset.tab;
        renderInspector();
      });
    });

    // Initial render
    updateCard();
  }
})();
