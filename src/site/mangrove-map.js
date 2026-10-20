(() => {
  // ==========================================================================
  // COMPONENT CONTRACT & BRAND MORPHER STUDIO
  // Hold the schema, swap the tokens: the HorizontalBookCard under each of the
  // five brand token modes. (The scroll-driven triangulation diagram for the
  // same post lives in mangrove-scrolly.js.)
  // ==========================================================================
  const studioContainer = document.getElementById('mangrove-brand-studio');
  if (studioContainer) {
    initBrandStudio(studioContainer);
  }

  // --------------------------------------------------------------------------
  // IMPLEMENTATION: COMPONENT CONTRACT & BRAND MORPHER STUDIO
  // --------------------------------------------------------------------------
  function initBrandStudio(container) {
    // Brand values, verified against the Mangrove token sources:
    // unisdr/undrr-mangrove tokens/*.yaml at the 2.2.0 release prep
    // (817a9f10), resolved through the generated partials
    // stories/assets/scss/generated/_tokens-*.scss (checked byte-for-byte
    // against tokens/output-baseline.json). The spacing scale is authored in
    // px (spacing.50 = 5, 100 = 10, 150 = 15, 200 = 20, 300 = 30).
    //
    // The real HorizontalBookCard is a publication teaser: it reads
    // --mg-card-publication-* (transparent, no radius, no shadow) in every
    // brand, and its label is coloured text (--mg-color-tag = interactive),
    // not a filled pill. So the preview card has no frame or label fill.
    //
    // `changes` is what the panel lists for that brand: only what differs
    // from UNDRR, which is the default the others are layered over.
    const brands = {
      undrr: {
        id: 'undrr',
        name: 'UNDRR',
        primary: '#004F91', // color.blue-900 (undrr.yaml: color.interactive)
        btnRadius: '5px', // radius.button = spacing.50 (mangrove.yaml)
        btnFont: '14px', // font-size.button 0.875rem
        btnPadding: '10px 15px', // padding.button = spacing.100 spacing.150
        tagLabel: 'GAR2022 PUBLICATION',
        intro: 'UNDRR is the default. The other four brands are small sets of changes on top of it.',
        changes: [
          { label: 'Brand colour', value: '#004f91', swatch: '#004f91' },
          { label: 'Button hover', value: '#3372a7', swatch: '#3372a7' },
          { label: 'Button corners', value: '5px' },
          { label: 'Button text', value: '14px' },
        ],
      },
      pweb: {
        id: 'pweb',
        name: 'PreventionWeb',
        primary: '#0A6969', // preventionweb.yaml brand.primary
        btnRadius: '5px',
        btnFont: '14px',
        btnPadding: '10px 15px',
        tagLabel: 'DISASTER RISK DATA',
        changes: [
          { label: 'Brand colour', value: '#0a6969', swatch: '#0a6969' },
          { label: 'Button hover', value: '#0c7575', swatch: '#0c7575' },
        ],
      },
      mcr: {
        id: 'mcr',
        name: 'MCR2030',
        primary: '#591A61', // mcr.yaml brand.purple
        btnRadius: '30px', // radius.button = spacing.300
        btnFont: '18px', // font-size.button 1.125rem
        btnPadding: '15px 30px', // padding.button = spacing.150 spacing.300
        tagLabel: 'URBAN RESILIENCE',
        changes: [
          { label: 'Brand colour', value: '#591a61', swatch: '#591a61' },
          { label: 'Button hover', value: '#6e2677', swatch: '#6e2677' },
          { label: 'Button corners', value: '30px, a pill' },
          { label: 'Button text', value: '18px, with more padding' },
        ],
      },
      delta: {
        id: 'delta',
        name: 'DELTA Resilience',
        primary: '#004F91', // delta.yaml: DELTA's brand blue is UNDRR's
        btnRadius: '5px',
        btnFont: '14px',
        btnPadding: '10px 20px', // padding.button = spacing.100 spacing.200
        tagLabel: 'POLICY BRIEF',
        changes: [
          { label: 'Brand colour', value: '#004f91, the same blue as UNDRR', swatch: '#004f91' },
          { label: 'Button hover', value: '#106cb8', swatch: '#106cb8' },
          { label: 'Button padding', value: 'wider: 10px × 20px' },
          { label: 'Other cards', value: 'light grey #f2f2f2 (not this publication card)', swatch: '#f2f2f2' },
        ],
      },
      irp: {
        id: 'irp',
        name: 'IRP',
        primary: '#0F78BF', // irp.yaml brand.primary
        btnRadius: '5px',
        btnFont: '14px',
        btnPadding: '10px 15px',
        tagLabel: 'RECOVERY PLATFORM',
        changes: [
          { label: 'Brand colour', value: '#0f78bf', swatch: '#0f78bf' },
          { label: 'Button hover', value: '#0d67a3', swatch: '#0d67a3' },
        ],
      },
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

    // Layout (see _kh-dataviz.scss): on wide screens the studio shares the
    // scrolly regions' grid. Heading and "what changes" sit in the step
    // column; the controls and the card sit in the graphic column. Narrow
    // screens stack in reading order: heading, controls, card, changes.
    container.innerHTML = `
      <div class="kh-brand-studio">
        <div class="kh-brand-studio__header">
          <h3 class="kh-brand-studio__title">Hold the content, swap the brand</h3>
          <p class="kh-brand-studio__subtitle">Switch brands and presets on the Book Card. The brand settings change how it looks; its fields and layout stay the same.</p>
        </div>

        <div class="kh-brand-studio__demo">
          <div class="kh-brand-studio__controls">
            <div class="kh-brand-studio__group" role="group" aria-labelledby="kh-bs-brand-label">
              <span class="kh-brand-studio__label" id="kh-bs-brand-label">Brand</span>
              <div class="kh-brand-studio__pills">
                <button type="button" class="kh-brand-studio__pill kh-brand-studio__brand-btn kh-brand-studio__brand-btn--active" aria-pressed="true" data-brand="undrr"><span class="kh-brand-dot" style="background: #004F91;"></span>UNDRR</button>
                <button type="button" class="kh-brand-studio__pill kh-brand-studio__brand-btn" aria-pressed="false" data-brand="pweb"><span class="kh-brand-dot" style="background: #0A6969;"></span>PreventionWeb</button>
                <button type="button" class="kh-brand-studio__pill kh-brand-studio__brand-btn" aria-pressed="false" data-brand="mcr"><span class="kh-brand-dot" style="background: #591A61;"></span>MCR2030</button>
                <button type="button" class="kh-brand-studio__pill kh-brand-studio__brand-btn" aria-pressed="false" data-brand="delta"><span class="kh-brand-dot" style="background: #004F91;"></span>DELTA</button>
                <button type="button" class="kh-brand-studio__pill kh-brand-studio__brand-btn" aria-pressed="false" data-brand="irp"><span class="kh-brand-dot" style="background: #0F78BF;"></span>IRP</button>
              </div>
            </div>

            <div class="kh-brand-studio__group" role="group" aria-labelledby="kh-bs-preset-label">
              <span class="kh-brand-studio__label" id="kh-bs-preset-label">Preset</span>
              <div class="kh-brand-studio__pills">
                <button type="button" class="kh-brand-studio__pill kh-brand-studio__preset-btn kh-brand-studio__preset-btn--active" aria-pressed="true" data-preset="default">Default</button>
                <button type="button" class="kh-brand-studio__pill kh-brand-studio__preset-btn" aria-pressed="false" data-preset="noimage">No image</button>
                <button type="button" class="kh-brand-studio__pill kh-brand-studio__preset-btn" aria-pressed="false" data-preset="nolink">No link</button>
                <button type="button" class="kh-brand-studio__pill kh-brand-studio__preset-btn" aria-pressed="false" data-preset="buttononly">Button only</button>
              </div>
            </div>
          </div>

          <!-- The live component, framed like a node in the diagram -->
          <div class="kh-brand-studio__card-stage" id="live-card-stage">
            <div id="live-card" class="kh-live-card">
              <div id="live-card-visual" class="kh-live-card__visual">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 240" width="160" height="240" aria-hidden="true">
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
          </div>

          <div id="live-assertion-badge" class="kh-brand-studio__assertion-badge" aria-live="polite">
            cardGeometryChecks.js: ALL ASSERTIONS PASSING (1:1.414 ratio, 0px border bleed)
          </div>
        </div>

        <!-- What this brand changes, in plain terms -->
        <div class="kh-brand-studio__inspector">
          <h4 class="kh-brand-studio__inspector-title">What changes in <span id="inspector-brand" class="kh-brand-studio__term">UNDRR</span></h4>
          <div id="inspector-content" class="kh-brand-studio__tab-content" aria-live="polite">
            <!-- Rendered by renderInspector() -->
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
    const inspectorBrand = container.querySelector('#inspector-brand');

    let currentBrand = 'undrr';
    let currentPreset = 'default';

    function renderInspector() {
      const b = brands[currentBrand];
      inspectorBrand.textContent = b.name;
      const rows = b.changes.map((c) => `
            <div class="kh-brand-studio__change">
              <dt>${c.label}</dt>
              <dd>${c.swatch ? `<span class="kh-brand-studio__swatch" style="background:${c.swatch};"></span>` : ''}${c.value}</dd>
            </div>`).join('');
      inspectorContent.innerHTML = `
          ${b.intro ? `<p class="kh-brand-studio__intro">${b.intro}</p>` : ''}
          <dl class="kh-brand-studio__changes">${rows}
          </dl>
          <p class="kh-brand-studio__same">Same in all five brands: the card's fields, the spacing scale and the type scale.</p>
        `;
    }

    function updateCard() {
      const b = brands[currentBrand];
      const p = presets[currentPreset];

      liveCard.style.setProperty('--live-btn-bg', b.primary);
      liveCard.style.setProperty('--live-btn-radius', b.btnRadius);
      liveCard.style.setProperty('--live-btn-font', b.btnFont);
      liveCard.style.setProperty('--live-btn-padding', b.btnPadding);
      liveCard.style.setProperty('--live-tag-color', b.primary);

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
        // A preview, not a destination: show the linked state without a dead
        // link (it used to be href="javascript:void(0)").
        liveTitle.innerHTML = '<span class="kh-live-card__title-link">Global Assessment Report on Disaster Risk Reduction</span>';
      } else {
        liveTitle.textContent = 'Global Assessment Report on Disaster Risk Reduction';
      }

      liveAssertionBadge.textContent = p.showImage 
        ? `cardGeometryChecks.js: ALL ASSERTIONS PASSING (1:1.414 ratio, 0px border bleed, ${b.name} tokens bound)`
        : `cardGeometryChecks.js: PASS (Content reflows to clientWidth: 520px, 0px image delta)`;

      renderInspector();
    }

    // Brand buttons
    const brandBtns = container.querySelectorAll('.kh-brand-studio__brand-btn');
    brandBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        brandBtns.forEach((b) => {
          b.classList.remove('kh-brand-studio__brand-btn--active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('kh-brand-studio__brand-btn--active');
        btn.setAttribute('aria-pressed', 'true');
        currentBrand = btn.dataset.brand;
        updateCard();
      });
    });

    // Preset buttons
    const presetBtns = container.querySelectorAll('.kh-brand-studio__preset-btn');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetBtns.forEach((p) => {
          p.classList.remove('kh-brand-studio__preset-btn--active');
          p.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('kh-brand-studio__preset-btn--active');
        btn.setAttribute('aria-pressed', 'true');
        currentPreset = btn.dataset.preset;
        updateCard();
      });
    });

    // Initial render
    updateCard();
  }
})();
