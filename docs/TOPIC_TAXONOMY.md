# Topic taxonomy reconciliation

This document records the controlled vocabulary applied to `topics:` in
`src/site/posts/` frontmatter, and the reasoning behind it. Only `topics:`
was touched; `tags:` (which drives Eleventy collections) and all other
frontmatter/body content were left untouched.

## How to use this taxonomy

**Parents are controlled; children are free.** A topic may carry free-form
detail after a `>`:

```yaml
topics:
  - AI > Claude Code
  - typography > OpenType ligatures
```

Everything before `>` must be one of the topics listed below. It is the only
part that groups, counts or appears in any index. Everything after is
descriptive detail: it displays, quieter, but never forms a bucket.

This exists so specificity does not recreate the problem this taxonomy solved.
The vocabulary was consolidated from 158 ad-hoc terms of which 116 had exactly
one post. Detail that would otherwise become a singleton belongs after the `>`.

**Use `>`, not `:`.** YAML parses an unquoted `- a: b` list item as an object
rather than a string, which would give a list of mixed types that every
consumer has to type-check. Quoting avoids it but fails silently when someone
forgets.

**Series are not topics.** A multi-part series uses its own frontmatter keys:

```yaml
series: Content Action Model
series_part: 2
```

A series is ordered and a post belongs to exactly one; topics are neither. See
`docs/FRONTMATTER.md`.

**Adding a new parent topic.** Only if it will plausibly reach three posts.
Otherwise make it a child of an existing parent. If you do add one, record it
here with a definition.

---


## Before / after

- **Before:** 158 distinct topic strings across 100 posts (89 posts tagged,
  11 untagged). 116 of those strings appeared exactly once; only 23 appeared
  3+ times. (The task brief cited 154/111/24 — the small difference is
  because a handful of existing entries were a single YAML list item
  containing an internal comma, e.g. `- gulp, Eleventy, EMBL, Fractal, Visual
  Framework` or `- CAM for Web Systems, origin story`. Those count as one
  literal string in the source file, which is what I audited against.)
- **After:** 31 distinct topics across all 100 posts. **Zero singletons.**
  All 31 topics have 3 or more posts. Every post has 2–5 topics, most
  specific first.

## The controlled vocabulary (31 topics)

| Topic | Definition | Post count |
|---|---|---|
| AI | Artificial intelligence and LLMs — capabilities, limits, and their effect on work and content. | 27 |
| content strategy | Editorial voice, content models, and strategy for readers and organizations. | 21 |
| web development | General front-end/back-end web development practice and browser techniques. | 15 |
| information architecture | Organizing information and navigation for findability and change. | 14 |
| design systems | Component libraries, tokens, and systemic approaches to UI. | 12 |
| developer tools | Tools, utilities, and hardware that support developer/knowledge work. | 10 |
| software engineering | Engineering practice, code quality, career progression, technical debt. | 10 |
| career reflection | Personal and career retrospectives, site updates, "it's been a while" posts. | 9 |
| Eleventy | Eleventy-specific build/tooling posts. | 9 |
| cloud infrastructure | Hosting, cloud platforms, servers, and deployment/sysadmin infrastructure. | 8 |
| static sites | Static site generators and JAMstack architecture broadly. | 8 |
| performance | Site, app, and database performance and optimization. | 8 |
| open source | Open-source projects, licensing, and community contribution. | 8 |
| Drupal | Drupal CMS specific posts. | 8 |
| editorial workflow | Content production process, tooling, and governance (CMS, CKEditor, editorial standards). | 7 |
| UX design | User experience and interface design, navigation patterns. | 6 |
| data visualization | Visualizing data, including eye-tracking and sketchnote formats. | 6 |
| productivity | Personal and team productivity, focus, meetings, remote/VR work setups. | 6 |
| typography | Fonts and type design/rendering. | 6 |
| Visual Framework | EMBL's Visual Framework design system specifically. | 6 |
| JavaScript | JavaScript language and runtime specifics. | 6 |
| accessibility | Web accessibility (a11y). | 6 |
| context engineering | Structuring information, prompts, and workflows so AI agents produce reliable results. | 6 |
| analytics | Web analytics, measurement, and metrics. | 5 |
| content architecture | Structural/technical organization of content: schemas, headless CMS, content APIs, federation. | 5 |
| project management | Planning and running projects and teams. | 4 |
| PDF | PDF generation, viewing, and tooling. | 3 |
| CSS | CSS techniques and layout. | 3 |
| digital transformation | Organizational digital transformation and change management. | 3 |
| retro computing | Vintage/retro computing, emulation, legacy hardware. | 3 |
| search | Site search and semantic search. | 3 |

## Old → new mapping (all 158 original strings)

Where a post carried several old topics, I reassigned that post's whole
`topics:` block holistically rather than doing a 1:1 string swap — so the
"primary new topic" below is the closest semantic match for that string;
the post it appeared on may have picked up other new topics too, based on
what the post is actually about. Full per-post detail is in the git diff.

| Old topic | Count | → New (primary) |
|---|---|---|
| AI | 23 | AI |
| web development | 11 | web development |
| design systems | 8 | design systems |
| content strategy | 8 | content strategy |
| open source | 7 | open source |
| information architecture | 6 | information architecture |
| Drupal | 6 | Drupal |
| accessibility | 6 | accessibility |
| software engineering | 6 | software engineering |
| static sites | 5 | static sites |
| eleventy | 5 | Eleventy |
| context engineering | 5 | context engineering |
| productivity | 5 | productivity |
| visual framework | 4 | Visual Framework |
| typography | 4 | typography |
| analytics | 4 | analytics |
| pdf | 3 | PDF |
| JavaScript | 3 | JavaScript |
| project management | 3 | project management |
| search | 3 | search |
| tools | 3 | developer tools |
| content architecture | 3 | content architecture |
| developer tools | 3 | developer tools |
| gulp, Eleventy, EMBL, Fractal, Visual Framework | 2 | Eleventy + Visual Framework (split; EMBL/Fractal dropped as employer/vendor names, not reader-browsable subjects) |
| static sites, blogging | 2 | static sites (blogging dropped, absorbed by content strategy where relevant) |
| content operations | 2 | editorial workflow |
| life | 2 | career reflection |
| performance optimization | 2 | performance |
| variable fonts | 2 | typography (dropped as standalone, absorbed by typography) |
| performance | 2 | performance |
| css | 2 | CSS |
| data visualization | 2 | data visualization |
| code review | 2 | software engineering |
| policy | 2 | dropped, absorbed by content strategy / editorial workflow |
| SVG | 2 | dropped, absorbed by typography / accessibility (too thin for its own bucket) |
| web metrics | 2 | analytics |
| URL design | 2 | dropped, absorbed by web development |
| digital transformation | 2 | digital transformation |
| retro computing | 2 | retro computing |
| machine learning | 2 | dropped, absorbed by AI |
| comprehension debt | 2 | dropped, absorbed by AI / software engineering |
| browser tools | 2 | developer tools |
| CAM for Web Systems, origin story | 1 | content strategy + information architecture |
| CAM for Web Systems, introducing | 1 | content strategy + information architecture |
| CAM for Web Systems, UX | 1 | content strategy + UX design + information architecture |
| Panini | 1 | static sites |
| Life Sciences, data, fonts, UX | 1 | typography + data visualization |
| CAM for Web Systems, ontology | 1 | content strategy + information architecture |
| reusability | 1 | dropped, absorbed by design systems / performance |
| outreach | 1 | dropped, absorbed by Visual Framework / career reflection |
| gulp, Eleventy, EMBL | 1 | Eleventy + static sites |
| career, reflection | 1 | career reflection |
| component systems | 1 | dropped, absorbed by web development / JavaScript |
| navigation | 1 | dropped, absorbed by information architecture / UX design |
| navigation design | 1 | dropped, absorbed by UX design / information architecture |
| user experience | 1 | UX design |
| platform | 1 | dropped, absorbed by content architecture |
| content federation | 1 | dropped, absorbed by content architecture |
| headless CMS | 1 | dropped, absorbed by content architecture |
| platform independence | 1 | dropped, absorbed by content architecture |
| content APIs | 1 | dropped, absorbed by content architecture |
| legos | 1 | dropped, absorbed by career reflection |
| drupal | 1 | Drupal |
| return of the mac-k | 1 | dropped, absorbed by career reflection |
| Azure | 1 | dropped, absorbed by cloud infrastructure |
| database performance | 1 | dropped, absorbed by performance |
| cloud migration | 1 | dropped, absorbed by cloud infrastructure |
| drupal, azure, mysql, metrics, performance | 1 | Drupal + cloud infrastructure + performance |
| build pipeline | 1 | dropped, absorbed by Eleventy / static sites |
| images | 1 | dropped, absorbed by performance |
| data | 1 | dropped, absorbed by AI / content strategy |
| knowledge management | 1 | dropped, absorbed by content strategy |
| publishing | 1 | dropped, absorbed by content strategy |
| web | 1 | dropped, absorbed by content strategy |
| CKEditor | 1 | dropped, absorbed by editorial workflow |
| editorial tooling | 1 | editorial workflow |
| content workflows | 1 | editorial workflow |
| workflow | 1 | dropped, absorbed by project management |
| ux | 1 | dropped, absorbed by CSS/typography (see "unsure" note below) |
| technical writing | 1 | dropped, absorbed by context engineering |
| documentation | 1 | dropped, absorbed by context engineering |
| agents | 1 | dropped, absorbed by context engineering |
| management | 1 | dropped, absorbed by software engineering |
| deep work | 1 | dropped, absorbed by productivity |
| html | 1 | dropped, absorbed by web development |
| forms | 1 | dropped, absorbed by accessibility |
| database tuning | 1 | dropped, absorbed by performance |
| caching strategies | 1 | dropped, absorbed by performance |
| editorial workflow | 1 | editorial workflow |
| efficiency optimization | 1 | dropped, absorbed by editorial workflow |
| CMS optimization | 1 | dropped, absorbed by editorial workflow |
| component libraries | 1 | dropped, absorbed by Visual Framework / design systems |
| pattern libraries | 1 | dropped, absorbed by design systems |
| cross-platform design | 1 | dropped, absorbed by Visual Framework / design systems |
| content design | 1 | dropped, absorbed by content strategy |
| interactive storytelling | 1 | dropped, absorbed by data visualization |
| web performance | 1 | dropped, absorbed by performance |
| meta | 1 | dropped, absorbed by career reflection |
| portfolio | 1 | dropped, absorbed by career reflection |
| CSS | 1 | CSS |
| Web Performance | 1 | dropped, absorbed by performance |
| Accessibility | 1 | accessibility |
| Microsoft | 1 | dropped, absorbed by developer tools |
| leadership | 1 | dropped, absorbed by project management |
| visual communication | 1 | dropped, absorbed by data visualization |
| Claude | 1 | dropped, absorbed by AI |
| editorial systems | 1 | dropped, absorbed by editorial workflow |
| state management | 1 | dropped, absorbed by JavaScript / web development |
| VR | 1 | dropped, absorbed by productivity |
| Quest 3 | 1 | dropped, absorbed by developer tools |
| remote work | 1 | dropped, absorbed by productivity |
| organizational change | 1 | dropped, absorbed by digital transformation |
| business analysis | 1 | dropped, absorbed by project management |
| requirements | 1 | dropped, absorbed by project management |
| UI design | 1 | dropped, absorbed by UX design |
| Cloudflare Workers | 1 | dropped, absorbed by cloud infrastructure |
| retro web | 1 | retro computing |
| product management | 1 | dropped, absorbed by project management |
| velocity | 1 | dropped, absorbed by project management |
| design | 1 | dropped, absorbed by developer tools |
| structured content | 1 | dropped, absorbed by content architecture |
| content modeling | 1 | dropped, absorbed by content architecture |
| governance | 1 | dropped, absorbed by software engineering |
| technical debt | 1 | dropped, absorbed by software engineering |
| career development | 1 | dropped, absorbed by software engineering |
| human-in-the-loop | 1 | dropped, absorbed by context engineering |
| component design | 1 | dropped, absorbed by content architecture / design systems |
| skeleton loading | 1 | dropped, absorbed by content architecture / design systems |
| CMS | 1 | dropped, absorbed by Drupal / open source |
| WordPress | 1 | dropped, absorbed by open source (context: Drupal comparison) |
| web architecture | 1 | dropped, absorbed by cloud infrastructure |
| Cloudflare | 1 | dropped, absorbed by cloud infrastructure |
| AI tools | 1 | dropped, absorbed by AI |
| Claude Code | 1 | dropped, absorbed by AI |
| GitHub Copilot | 1 | dropped, absorbed by AI |
| AI / MCP | 1 | dropped, absorbed by AI |
| knowledge work | 1 | dropped, absorbed by software engineering |
| editorial standards | 1 | dropped, absorbed by editorial workflow |
| content governance | 1 | dropped, absorbed by editorial workflow |
| font subsetting | 1 | dropped, absorbed by typography |
| UX research | 1 | UX design |
| eye tracking | 1 | dropped, absorbed by data visualization |
| design tools | 1 | dropped, absorbed by developer tools |
| disaster risk | 1 | dropped, absorbed by digital transformation (see "unsure" note below) |
| digital infrastructure | 1 | dropped, absorbed by cloud infrastructure |
| resilience | 1 | dropped, absorbed by digital transformation |
| vercel | 1 | dropped, absorbed by cloud infrastructure |
| GitHub Pages | 1 | dropped, absorbed by static sites |
| OpenType ligatures | 1 | dropped, absorbed by typography |
| editorial-standards | 1 | dropped, absorbed by editorial workflow |
| evidence-based-practice | 1 | dropped, absorbed by content strategy |
| iterative-improvement | 1 | dropped, absorbed by content strategy |
| workflow-automation | 1 | dropped, absorbed by editorial workflow |
| misinformation | 1 | dropped, absorbed by AI (see "unsure" note below) |
| information integrity | 1 | dropped, absorbed by AI / search |
| emulation | 1 | retro computing |
| Apple Silicon | 1 | dropped, absorbed by retro computing |
| side projects | 1 | dropped, absorbed by career reflection |

## The 11 posts that had no `topics:` — what I assigned

All 11 were older posts (2013–2017) with no topics block at all. I read
each in full (not just filename) before assigning:

| Post | Assigned topics |
|---|---|
| `20130321-postfix-spam.njk` | cloud infrastructure, web development |
| `20130612-ubuntu-ips-ec2-multiple.njk` | cloud infrastructure, web development |
| `20131208-content-model-better-journalism.njk` | content strategy, information architecture |
| `20140407-ux-success-double-conversion.njk` | UX design, analytics |
| `20150128-lyra-installation.njk` | data visualization, developer tools |
| `20170723-corporate-design-through-ia.njk` | information architecture, design systems |
| `20170725-site-update.njk` | career reflection, static sites |
| `20170913-fluid-information-architecture.njk` | information architecture, content strategy |
| `20171002-euroia-2017-takeaways.njk` | information architecture, career reflection |
| `20171027-video-conferencing-tips-dos-donts.njk` | productivity, career reflection |
| `20171112-ibm-plex-font-and-fira.njk` | typography, design systems |

## Flagged for Ken — judgment calls I'm least sure about

1. **`20260506-digesting-when-digital-systems-fail.njk`** (disaster risk /
   digital infrastructure / resilience) — this UNDRR "digesting" post is
   about disaster-risk-reduction framing of digital infrastructure failure.
   It doesn't fit any bucket well; I filed it under `digital transformation`
   + `cloud infrastructure`, but neither really captures "disaster risk /
   resilience" as a subject. If this becomes a recurring theme in your UNDRR
   work, it may be worth its own topic later. Left it under-fit rather than
   invent a singleton.
2. **`20260615-digesting-reddit-ai-poisoning.njk`** (misinformation /
   information integrity) — similarly thin; filed under `AI` + `search` +
   `content strategy`. "Misinformation" as a subject may deserve its own
   topic if you write more in that vein.
3. **`gulp, Eleventy, EMBL, Fractal, Visual Framework`** and similar
   comma-joined single-string entries — these were literally one YAML list
   item each in the source (not a real list), which I treated as shorthand
   for multiple concepts and split accordingly per post. Worth checking my
   split reads matched your intent, e.g.
   `20191112-extendeing-fractal-components-eleventy-static-sites.njk` got
   `Eleventy, design systems, static sites` — I read "Fractal" and "Visual
   Framework" as covered by `design systems`, not worth a separate mention.
4. **`ux` (lowercase, singleton, on `20250927-the-best-css-unit-might-be-a-combination.njk`)**
   — I mapped this post to `CSS, typography`, effectively dropping the UX
   angle. Rereading the post, the "ux" tag was likely about consistent
   sizing feel rather than UX design proper, so I don't think `UX design`
   was warranted, but flagging since I dropped a topic rather than remapped it.
5. **`career reflection` bucket** — I merged fairly different things here:
   pure life-update posts (`its-been-20-years`, `something-new-2022`,
   `its-been-too-long`), a conference-takeaways post, and the
   introduce-the-Work-section meta post. All are "about the author/site"
   rather than a technical subject, but they're a fairly loose family. If
   you'd rather split "conference/community notes" out from "personal life
   updates," I can do that as a follow-up (it would currently be a 2–3 post
   split, both viable sizes under the "handful of 2s is fine" guidance).
6. **`Visual Framework` vs `design systems`** — for VF-specific posts I kept
   both where the post is genuinely about VF as a specific product (not just
   "a design system"), e.g. `20191118-first-page-with-the-visual-framework.njk`.
   Some borderline posts (e.g. `20180912-faster-scientific-websites-through-reusability.njk`)
   got both `design systems` and `Visual Framework` plus `performance` — 3
   topics that slightly overlap in meaning; happy to trim if that reads as
   redundant.

## Deliberately left alone

- Casing conventions were preserved as they existed: `Drupal`, `Eleventy`,
  `AI`, `Visual Framework`, `PDF`, `CSS`, `JavaScript` are capitalized
  (proper nouns / initialisms); everything else stays lowercase
  (`web development`, `content strategy`, etc.), matching what was already
  dominant in the corpus.
- Employer/vendor names that showed up embedded in old topic strings —
  `EMBL`, `Fractal`, `UNDRR`, `Microsoft` — were not turned into topics.
  They're not something a reader browses by; they're context, and in most
  cases already implicit in the post's other topics (e.g. `Visual
  Framework`, `Drupal`).
- Did not rename already-clear, well-populated topics purely for tidiness:
  `AI`, `Drupal`, `Eleventy`, `accessibility`, `open source`,
  `software engineering`, `content strategy`, `information architecture`,
  and `design systems` all kept their existing name and casing.
- Did not touch `tags:`, titles, dates, teasers, images, `image_meta`,
  `kens_status`, `permalink`, body content, or anything outside the
  `topics:` block, per the safety rules.
