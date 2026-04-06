# CV Review & Improvement Plan

**Date**: 2025-10-24
**File**: `src/site/cv.njk` (378 lines)
**URL**: https://allaboutken.com/cv/

## Executive Summary

Your CV has **excellent content and quantifiable metrics**, but the structure works against career promotion. Key issues: skills-first ordering (instead of work history), buried power metrics, and confusing section headings.

**Impact**: The current structure can signal career gaps and makes it harder for recruiters/hiring managers to quickly assess your recent achievements and current role.

---

## Current Strengths

1. **Excellent quantifiable metrics** throughout:
   - 50% reduction in load times
   - 20% quarterly savings
   - 40% year-on-year engagement increase
   - 150+ member UN Drupal Community
   - 50+ scientific properties adopted Visual Framework
   - 150,000+ user accounts managed

2. **Strong capability organization** - Skills categorized into clear areas (Platform Innovation, Communications, Leadership, etc.)

3. **Comprehensive 20+ year career progression** - From print production through to UN leadership

4. **Thought leadership demonstration** - Multiple links to published writing and blog posts

5. **Print-ready formatting** - Print-specific contact info and styling

---

## Critical Issues for Career Promotion

### 1. Skills-First Structure (Lines 84-155)

**Problem**: Current order is:
1. Introduction (lines 42-76)
2. **Skills sections** (lines 84-155):
   - Strategic Platform Innovation
   - Communications Strategy & Content Leadership
   - Global Leadership & Stakeholder Relations
   - Strategic Communications Expertise
3. **Work History** (lines 164+)

**Why this hurts**:
- Skills-first CVs typically signal career gaps or lack of recent experience
- Recruiters want to see: Who employs you NOW → What you achieved RECENTLY → Then capabilities
- Makes it harder to quickly assess current role and seniority

**Standard CV structure**:
1. Introduction/summary
2. **Work history** (chronological, current first)
3. Skills/capabilities (if needed)
4. Education

### 2. Power Metrics Buried in Bullet Lists

Your most impressive achievements are hidden:

| Metric | Current Location | Visibility |
|--------|-----------------|------------|
| 50% load time reduction | Line 95 (skills section) | Buried |
| 50% load time reduction | Line 175 (UNDRR bullets) | Buried |
| 50+ properties adoption | Line 200 (EMBL bullets) | Buried |
| 150,000+ users | Line 263 (DRS bullets) | Buried |
| 40% engagement increase | Line 178 (UNDRR bullets) | Buried |
| 20% cost savings | Line 179 (UNDRR bullets) | Buried |

**Should be**: Prominently displayed in hero/summary section with visual treatment.

### 3. Confusing Section Headings (Lines 84, 164)

- Line 84: "Professional experience" → **leads to skills categories** (not jobs)
- Line 164: "Professional work history" → **actual job roles**

**Problem**:
- Misleading navigation
- "Professional experience" universally means job history, not skills
- Could lose readers who skip ahead looking for work history

### 4. Missing Executive Summary with Key Metrics ✅ **RESOLVED (2025-10-24)**

**Updated executive summary** (lines 61-69):
> "Platform Architect & Digital Strategy Lead delivering measurable transformation for UN, science, and media organizations. Current achievements at UNDRR: 50–70% faster delivery, 20% cost savings, 40% engagement increases across 15-site Drupal ecosystem."

**Improvements made**:
- ✅ Leads with title and measurable outcomes (metrics-first approach)
- ✅ Specific metrics in first paragraph (50-70%, 20%, 40%)
- ✅ Shows on both screen AND print versions (removed screen-only wrapper)
- ✅ Three-paragraph structure: outcomes → experience/expertise → personal statement
- ✅ AI-ready positioning strengthened in paragraph 2
- ✅ Call-to-action buttons moved to screen-only section


### 6. No Visual Impact

Missing:
- Professional photo/headshot
- Organization logos (UN, EMBL, EMBL-EBI)
- Visual hierarchy for key achievements
- Scannable "at a glance" metrics


**Fix**: Limit to 2-3 most impressive pieces per role in a "Selected Writing" callout

### 8. No Career Snapshot Section ✅ **RESOLVED (2025-10-24)**

**Added Career Snapshot section** at lines 115-131:
- Scannable bullet list format
- Key information: current role, experience, team scope, impact metrics, technical expertise, strategic focus
- Clean CSS styling with borders and proper spacing
- Located after Impact Metrics, before Professional Experience section


---

## Recommended Improvements

### Phase 1: Structural Reorganization (High Priority)

#### 1.1 Reorder Major Sections

**New structure**:
```
1. Hero (name, title, location)
2. Executive Summary (2-3 sentences, metrics-forward)
3. Key Achievements / Impact Metrics (visual callouts)
4. Professional Experience (chronological work history)
5. Core Capabilities (current skills sections - moved down)
6. Education, Speaking & Community
```

**File changes**:
- Move lines 84-155 (skills) to AFTER work history (after line 347)
- Rename line 84 from "Professional experience" → "Core Capabilities"
- Rename line 164 from "Professional work history" → "Professional Experience"
- Add new "Impact Metrics" section after intro

#### 1.2 Create Visual Impact Metrics Section

**Insert after line 76** (after intro paragraphs):

```html
<section class="kh-impact-metrics kh-grid-stylized">
  <h2 class="kh-badge kh-badge--outline">Impact at a Glance</h2>
  <div class="kh-metrics-grid">
    <div class="kh-metric">
      <span class="kh-metric__number">50–70%</span>
      <span class="kh-metric__label">Faster delivery</span>
    </div>
    <div class="kh-metric">
      <span class="kh-metric__number">20%</span>
      <span class="kh-metric__label">Cost reduction</span>
    </div>
    <div class="kh-metric">
      <span class="kh-metric__number">+40%</span>
      <span class="kh-metric__label">Engagement increase</span>
    </div>
    <div class="kh-metric">
      <span class="kh-metric__number">15</span>
      <span class="kh-metric__label">Site ecosystem</span>
    </div>
    <div class="kh-metric">
      <span class="kh-metric__number">20+</span>
      <span class="kh-metric__label">Years experience</span>
    </div>
    <div class="kh-metric">
      <span class="kh-metric__number">5</span>
      <span class="kh-metric__label">Countries (teams)</span>
    </div>
  </div>
</section>
```

#### 1.3 Strengthen Executive Summary (Lines 60-76)

**Replace current intro paragraphs** with metrics-first approach:

```markdown
Digital strategy leader delivering measurable platform transformation for UN, science, and media organizations. Current achievements at UNDRR: 50-70% faster delivery, 20% cost savings, 40% engagement increases across 15-site Drupal ecosystem.

20+ years architecting AI-ready platforms, design systems, and leading distributed teams across Geneva, Bangkok, Bonn, New York, and Manila. Expert in bridging technical innovation with strategic communications to make the web faster, more accessible, and AI-ready.

I thrive on solving complex efficiency challenges and pioneering emerging technologies while coordinating multicultural, multilingual digital ecosystems.
```

### Phase 2: Content Refinement (Medium Priority)

#### 2.1 Clarify Title Positioning

**Choose one seniority level**:

**Option A - Director Level**:
- Page title: "Digital Strategy & Communications Director"
- Update current role in UNDRR section to emphasize director-level scope
- Add people management numbers: "Led teams of X across 5 countries"

**Option B - Senior IC/Principal**:
- Page title: "Senior Platform Architect & Digital Strategy Lead"
- Keep "Web Platform Lead" for UNDRR
- Emphasize technical depth over management scope

#### 2.2 Add Organization Logos

Create logo assets:
- `src/site/images/logos/undrr-logo.svg`
- `src/site/images/logos/embl-logo.svg`
- `src/site/images/logos/embl-ebi-logo.svg`

Add to work history sections as visual identifiers.

#### 2.3 Reduce Link Density

**Current**: Many capabilities link to blog posts throughout

**Recommended**:
- Remove inline blog post links from skills bullets
- Keep blog post links in work history "Related Writing" sections
- Add one "Featured Writing" section at the end with 5-7 top pieces

#### 2.4 Consolidate Technology Lists

**For roles 2015+** (lines 168-223):
Group by category:
```
**Platforms & Tools**: Drupal 10/11, Azure, Copilot Studio, GitLab CI, npm, Eleventy, Fractal
**Languages**: HTML/JS/CSS, Sass, RDF/SKOS, JSON-LD
**Analytics & Optimization**: GA4, Looker Studio, Power BI, Core Web Vitals
**Methodologies**: Agile, CI/CD, Component architecture, AI integration
```

**For roles pre-2015** (lines 257+):
- Reduce to 1-2 lines or remove entirely
- Focus on transferable skills (Agile, team leadership) vs specific tools

#### 2.5 Add Download/Action Buttons

**Insert after hero** (around line 51):

```html
<p class="kh-cluster">
  <a href="/cv-ken-hawkins.pdf" class="kh-button">Download PDF</a>
  <a href="mailto:khawkins98@gmail.com" class="kh-button kh-button--secondary">Get in Touch</a>
  <a href="/work/" class="kh-button kh-button--secondary">View Case Studies</a>
</p>
```

### Phase 3: Visual Enhancements (Lower Priority)

#### 3.1 Add Professional Photo

- Create headshot asset: `src/site/images/ken-hawkins-headshot.jpg`
- Add to hero section at line ~45

#### 3.2 Create CSS for Impact Metrics

**Add to** `src/components/vf-componenet-rollup/_kh-content.scss`:

```scss
.kh-impact-metrics {
  padding: var(--kh-spacing-600) 0;
}

.kh-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--kh-spacing-400);
  margin-top: var(--kh-spacing-400);
}

.kh-metric {
  text-align: center;
  padding: var(--kh-spacing-400);
  background: var(--kh-color-yellow-light);
  border-radius: 4px;
}

.kh-metric__number {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--kh-color-text-dark);
}

.kh-metric__label {
  display: block;
  margin-top: var(--kh-spacing-200);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--kh-color-text-medium);
}
```

#### 3.3 Add Organization Logo Styling

```scss
.kh-org-logo {
  max-width: 120px;
  height: auto;
  margin-bottom: var(--kh-spacing-300);
  opacity: 0.8;
}
```

#### 3.4 Consider Adding Testimonials Section

Add 1-2 short quotes from colleagues/supervisors (if available):

```html
<section class="kh-grid-stylized">
  <h2 class="kh-badge kh-badge--outline">Recommendations</h2>
  <div class="kh-content">
    <blockquote>
      "Ken's leadership transformed our platform architecture..."
      <cite>— Colleague Name, Title at Organization</cite>
    </blockquote>
  </div>
</section>
```

---

## Implementation Checklist

### Phase 1: Structure (Est. 2-3 hours)

- [x] Move skills sections (lines 84-155) to after work history ✅ **ALREADY DONE** - Core Capabilities at line 317, after Professional Experience at line 128
- [x] Rename "Professional experience" → "Core Capabilities" ✅ **ALREADY CORRECT** - Line 317 uses "Core Capabilities"
- [x] Rename "Professional work history" → "Professional Experience" ✅ **ALREADY CORRECT** - Line 128 uses "Professional Experience"
- [x] Create Impact Metrics section (HTML) ✅ **DONE (2025-10-24)** - Lines 81-113
- [x] Rewrite executive summary (metrics-first) ✅ **DONE (2025-10-24)** - Lines 59-67
- [x] Create CSS for impact metrics ✅ **DONE (already exists in styles)**
- [ ] Test print/PDF output

### Phase 2: Content (Est. 1-2 hours)

- [x] Decide on title positioning (Director vs Lead) ✅ **DONE (2025-10-24)** - Chose "Platform Architect & Digital Strategy Lead"
- [x] Update page title and hero title consistently ✅ **DONE (2025-10-24)** - Updated across index.njk, cv.njk, footer.njk, siteConfig.json
- [x] Add Download PDF button ✅ **DONE (already exists)** - Line 71
- [ ] Create "Featured Writing" section

### Phase 3: Visual (Est. 1-2 hours, optional)

- [ ] Source organization logos (UNDRR, EMBL, EMBL-EBI)
- [ ] Add logos to work history sections
- [ ] Professional headshot (if available)
- [ ] Add headshot to hero
- [ ] Consider testimonials section
- [ ] Generate PDF version

---

## Recent Updates (2025-10-24)

### Completed: Role Positioning Consistency
- ✅ Unified positioning as **"Platform Architect & Digital Strategy Lead"** across all pages
- ✅ Homepage teaser and H2 updated with consistent language
- ✅ CV title, print header, and intro paragraphs aligned
- ✅ Footer updated with personality ("online problem solver") while maintaining professional positioning
- ✅ Site config meta description strengthened with AI-readiness emphasis
- ✅ Executive summary now leads with metrics and outcomes
- ✅ Impact metrics section already implemented and visible

### Key Language Decisions
- **Primary title**: "Platform Architect & Digital Strategy Lead" (consistent everywhere)
- **AI emphasis**: Strengthened throughout - "making the web faster, more accessible, and AI-ready"
- **Personality**: "online problem solver" preserved in footer for approachability
- **Years**: Changed from "20 years" to "20+" for forward-looking positioning

### Structure Verification (2025-10-24)
✅ **CV structure is ALREADY optimal:**
1. Lines 1-79: Intro + CTAs
2. Lines 81-113: **Impact at a Glance** (metrics grid)
3. Lines 115-131: **Career Snapshot** (scannable summary) ✅ NEW
4. Lines 145+: **Professional Experience** (work history - 9 roles chronological)
5. Lines 335+: **Core Capabilities** (4 skill categories)
6. Lines 405+: Education, speaking & community

The CV does NOT have the "skills-first" problem identified in the original plan. Work history comes before capabilities, which is the standard and preferred structure.

### Career Snapshot Added (2025-10-24)
✅ **Created scannable Career Snapshot section** including:
- Current role at UNDRR (UN) managing 15-site ecosystem
- 20+ years across UN, EMBL, media organizations
- Distributed team leadership across 5 countries
- Platform impact metrics (50-70% improvements, 20% savings, 40% engagement)
- Technical expertise (Drupal, Azure, design systems, AI-ready architecture)
- Strategic focus areas
- CSS styling: clean list format with borders, proper spacing (lines 330-355 of _kh-content.scss)

### Case Study Integration (2025-10-24)
✅ **Integrated 11 case studies contextually throughout CV:**
- **UNDRR role** (7 links): Platform transformation, GAR2025 campaign, Azure optimization, editorial efficiency, governance/delivery, operations reliability, vendor tech debt
- **EMBL roles** (3 links): Visual Framework design system, footer/directory, dynamic content architecture
- **DRS role** (1 link): Scaled Drupal with 150k+ users
- **Approach**: Linked actual achievement text rather than adding "[case study]" labels
- **Benefit**: Provides evidence and deeper context for key accomplishments without cluttering the CV

---

## Success Metrics

After implementation, the CV should:

1. **Pass the 6-second test**: Key metrics and current role visible in first scroll
2. **Clear seniority positioning**: Consistent Director or Senior IC framing
3. **Scannable structure**: Work history → Capabilities → Education (standard order)
4. **Visual impact**: Metrics displayed prominently, not buried in bullets
5. **ATS-friendly**: Standard headings, key skills appear in multiple places
6. **Print-ready**: PDF export maintains formatting and impact

---

## Questions to Resolve

1. **Title positioning**: Director-level or Senior IC/Principal roles?
2. **Photo**: Do you have/want a professional headshot?
3. **Logos**: Can we source UN/EMBL logos for use?
4. **Testimonials**: Any recommendations you'd like to feature?
5. **PDF generation**: Do you have a current PDF export process, or need to create one?

---

## Next Steps

**Recommended approach**:

1. **Start with Phase 1 structural changes** - highest impact
2. **Review and iterate** on new structure
3. **Then tackle Phase 2 content refinement**
4. **Phase 3 visual enhancements** as time permits

**Alternative**: If you prefer, I can implement all phases at once as a comprehensive CV overhaul.

What would you like to tackle first?
