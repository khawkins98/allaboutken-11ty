# Publishing Workflow

A clear, lightweight path from idea to published post. This document defines when each staff role is involved, who owns each stage, and the entry/exit criteria for handoffs. It complements the Editorial Handbook & Style Guide.

## Roles (from this repo)

- Managing Editor (ME)
- Junior Editorial Assistant (AI) (JEA)
- Technical Reviewer (TR)
- Fact Checker (FC)
- Editorial Style Editor (ESE)
- Accessibility Reviewer (AR)
- SEO & Discoverability Editor (SEO)
- Plagiarism Checker (PC)
- Fallacy Finder (FF)
- Ghostwriter (GW)

Terminology: “Owner” drives the step to completion. “Approvers” must sign off before moving forward. “Contributors” assist as needed.

## Stage 0 — Pitch & Planning

- Owner: ME
- Approvers: —
- Contributors: Author, SEO (advice on search intent), JEA (brief scaffolding)
- Triggers: New idea, campaign slot, or update to an existing post
- Entry criteria: Clear working title, audience, and purpose
- Exit criteria: 1–2 paragraph brief with scope, target reader, intended artifacts (code, images), and a target date; issue/PR created and added to the editorial calendar

Activities

- ME creates/assigns the brief and target publication window
- SEO optionally suggests search intent, internal links to target, and provisional slug
- JEA adds a skeleton post file with front matter stub per the Handbook

## Stage 1 — Drafting

- Owner: Author (supported by JEA)
- Approvers: ME (for scope fit)
- Contributors: TR (early clarifications), SEO (headline/slugs sanity), ESE (early structure nudge), GW (outline/flow)
- Entry criteria: Approved brief and slot in calendar
- Exit criteria: Cohesive draft in `.njk` with front matter populated; images identified/added with provisional alt text and attribution; basic local build passes

Activities

- JEA applies Handbook structure: headings, bullets, fenced code, tl;dr when appropriate
- Author writes content; TR may flag technical gaps early
- GW shapes outline, lede, section order, transitions; converts dense prose to scannable bullets/steps; preserves author voice
- ME verifies draft meets scope and is ready for technical review

## Stage 2 — Technical Review

- Owner: TR
- Approvers: ME
- Contributors: Author, JEA
- Entry criteria: Draft compiles locally; commands/code included; reproduction steps present if relevant
- Exit criteria: Technical comments addressed; commands/code verified; risks/limitations noted; local build still green

Activities

- TR reviews correctness, reproducibility, performance/security notes as relevant
- Author/JEA apply fixes; TR rechecks critical items

Concurrency note: Fact Check (Stage 3) may begin once sections stabilize.

## Stage 3 — Fact Check

- Owner: FC
- Approvers: ME
- Contributors: Author, JEA, FF
- Entry criteria: Stable draft sections; references/links present
- Exit criteria: Facts, dates, names, numbers verified; citations added/updated; all external links validated

Activities

- FC cross‑validates claims with primary sources; repairs/adds citations and links
- Broken/ambiguous claims are flagged and resolved with Author/ME
- FF flags logical fallacies, overreach, false dichotomies, and unsupported causal claims; suggests scope qualifiers or citations

## Stage 4 — Plagiarism Check

- Owner: PC
- Approvers: ME
- Contributors: FC (citations), ESE (quotations styling)
- Entry criteria: Content largely stable (post fact/tech edits)
- Exit criteria: Similarity risks resolved; quotations traced and cited; paraphrasing within fair use

Activities

- PC runs similarity checks and documents any required rewrites/citations
- ME approves resolution notes in the PR

## Stage 5 — Editorial Style Edit

- Owner: ESE
- Approvers: ME
- Contributors: JEA, FF, GW
- Entry criteria: Technical and factual edits applied; content structure mostly fixed
- Exit criteria: Voice/tone aligned to Handbook; headings/title/teaser normalized; code fences and captions standardized; front matter clean

Activities

- ESE tunes clarity, scannability, consistency; JEA applies systemic fixes
- FF reviews for logical coherence and unjustified inferences, proposing minimal, voice‑preserving edits (e.g., hedges, scope qualifiers)
- GW strengthens narrative through‑line, headings, and transitions; trims redundancy; polishes lede and tl;dr
- ME confirms title/teaser are final or flags SEO for final pass

## Stage 6 — Accessibility Review

- Owner: AR
- Approvers: ME
- Contributors: JEA, ESE
- Entry criteria: Images and media in place; headings finalized; links stable
- Exit criteria: Alt text accurate; captions/transcripts present; heading hierarchy valid; contrast/focus/ARIA concerns resolved

Activities

- AR reviews templates and content against accessibility checklist
- Issues are addressed by JEA/ESE before final sign‑off

## Stage 7 — SEO & Discoverability

- Owner: SEO
- Approvers: ME
- Contributors: ESE, JEA
- Entry criteria: Title/teaser nearly final; internal links identified; sitemap participation confirmed
- Exit criteria: Optimized title/teaser/slug; internal link targets set; canonical and sitemap correct; search intent alignment verified

Activities

- SEO refines discoverability without harming clarity
- JEA updates front matter and internal links accordingly

## Stage 8 — Final Managing Editor Gate

- Owner: ME
- Approvers: —
- Contributors: JEA (PR hygiene), All as needed
- Entry criteria: All prior stages marked complete in PR notes
- Exit criteria: “Go” to publish; scheduled date set; PR is merge‑ready

Final gate checklist (ME)

- Front matter complete: `title`, `teaser`, `image`, `image_meta.text`, `image_meta.altext`, `date`, `layout`, optional `tags`/`topics`/`permalink`
- Links validated (internal/externals), canonical and sitemap updated
- Accessibility verified; images have alt text and attribution
- Style/formatting matches Handbook; no trailing whitespace; headings consistent
- Technical and factual reviews approved; plagiarism check recorded
- Build passes locally; search index generation and images processing OK

---

## Parallelization & Fast‑Paths

- TR and FC can operate in parallel after the draft stabilizes; coordinate in PR
- ESE and AR should follow tech/fact stabilization to avoid churn
- SEO may advise during planning and returns at the end to finalize metadata
- Typos/small fixes: ME may fast‑path with ESE/JEA only; log what was skipped
- FF can run alongside Fact Check and Style Edit once the draft stabilizes; coordinate notes in the PR
- GW can collaborate during Drafting and again at Style Edit; coordinate with JEA/ESE to avoid churn

## Artifacts & PR Hygiene

- One PR per post; keep noisy refactors separate
- PR description includes: brief, status checklist, and who has signed off
- Use concise commit messages; link to sources for facts and code references
- Record non‑obvious decisions briefly in the PR for future reuse

## Status Checklist (copy into PR)

- [ ] Stage 0 Pitch & Planning — ME
- [ ] Stage 1 Drafting — Author/JEA
- [ ] Stage 2 Technical Review — TR
- [ ] Stage 3 Fact Check — FC
- [ ] Stage 4 Plagiarism Check — PC
- [ ] Stage 5 Editorial Style Edit — ESE
- [ ] Stage 6 Accessibility Review — AR
- [ ] Stage 7 SEO & Discoverability — SEO
- [ ] Stage 8 Final Managing Editor Gate — ME
- [ ] Stage 9 Publish & Post‑Publish QA — ME

Notes

- Follow the Editorial Handbook for voice/formatting specifics and code/templating tips
- If a stage is intentionally skipped, note why in the PR before ME sign‑off
