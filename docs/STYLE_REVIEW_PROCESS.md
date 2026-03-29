# Style Review Process

How to extract voice and style patterns from your own writing and apply them to the [Editorial style guide](https://allaboutken.com/style-guide/editorial/) (source: `src/site/style-guide/editorial.njk`).

Run this when your writing feels like it's drifted from the guide, when you write something in a different register that reveals patterns you hadn't noticed, or every 6 -- 12 months as a check.

---

## When to run this

- You wrote something that felt distinctly "right" but the current guide wouldn't produce it
- A new register showed up (an email, a proposal, a talk) and it surfaced voice patterns the blog posts don't
- You're onboarding a collaborator or AI assistant who needs to match the voice
- It's been a while and you want to check for drift

---

## Step 1: Collect samples

Gather 5 -- 10 texts. Spread them across contexts:

- 2 -- 3 recent published posts, plus 1 -- 2 you consider your best
- Something from a different register (email, memo, presentation notes)
- At least one piece of high-stakes writing -- where you were trying hardest to be understood

Skip co-authored pieces and anything that was heavily edited by someone else. You're looking for *your* voice, not a committee's.

---

## Step 2: Quantitative baseline

Measure the basics before you start interpreting. This keeps the analysis honest.

- Sentence length: mean, median, range. The variance matters more than the average.
- Paragraph length: typical sentence count, by content type.
- Vocabulary: rough type-token ratio, balance of technical vs. plain language.
- Punctuation habits: em dash frequency, semicolons, parenthetical asides.
- Readability: Flesch-Kincaid or similar. Useful as a baseline, not a target.

An LLM can compute these from pasted text. For more rigour, AntConc or the Stylo R package go deeper.

You're looking for something like: "average sentence length 18 words, paragraphs typically 2 -- 4 sentences, heavy em dash use, Flesch-Kincaid grade 10 -- 12."

---

## Step 3: Rhetorical pattern extraction

This is where the real work happens. For each sample, look at three layers:

**Structural patterns** -- how does the piece open? How is evidence introduced? How are transitions handled (implicit through headers, or explicit)? How does it close?

**Rhetorical moves** -- what persuasive strategies recur? How is criticism framed? How is authority established -- through credentials, or through specificity and evidence?

**Voice markers** -- pronoun patterns (I/we/you). Register level. Characteristic constructions (fragments for emphasis, rhetorical questions, lists as breathing room). And just as important: what the voice *avoids*.

Feed 3 -- 5 samples to an LLM with a structured prompt. Run each sample independently, then compare results. If a pattern shows up across multiple samples, it's real. If it only appears once, it's situational.

A prompt template that works well:

```
Analyze the writing style of the following text. For each dimension below,
identify specific patterns with quoted examples:

1. Sentence structure: length variation, characteristic constructions, fragments
2. Paragraph structure: length, internal rhythm, topic sentence placement
3. Rhetorical moves: how arguments are built, how criticism is framed, how evidence lands
4. Vocabulary: register level, technical vs. plain, distinctive word choices
5. Punctuation and pacing: em dashes, semicolons, parentheticals
6. Opening and closing patterns
7. What this voice is NOT -- patterns it deliberately avoids

Be specific. Quote the text as evidence. Flag anything distinctive.
```

---

## Step 4: Compare against the current style guide

Read `src/site/style-guide/editorial.njk` and sort each finding from Step 3:

- **Already codified** -- the guide captures this. Move on.
- **Gap** -- a real pattern the guide doesn't mention. Candidate for addition.
- **Misscoped** -- the guide mentions this, but in the wrong section or scoped too narrowly. A pattern that lives under "Arguing a position" but actually appears in every register belongs in core voice. Reclassify, don't duplicate.
- **Contradiction** -- the guide says one thing, the writing does another. Decide which is right.
- **Situational** -- only appears in one register. Note it but don't codify unless it recurs.

---

## Step 5: Codify at the right altitude

For each gap, write a style guide entry and add it to `editorial.njk` in the appropriate section. Lead with the principle (one sentence), add a concrete example from the corpus, and include a "but not" boundary where useful. For misscoped patterns, move the existing entry rather than duplicating it.

The altitude matters. "Always use three 'It's not that' clauses" is too specific -- it becomes a formula. "Be persuasive" is too abstract -- it says nothing. The sweet spot is principle + one example.

---

## Step 6: Validate

Use the updated guide as a system prompt and generate a short piece (2 -- 3 paragraphs) on a topic you know well. Read it. Flag what sounds wrong -- where the voice slips, where it feels generic, where a rule got over-applied.

Sharpen the guide entries based on what you flagged. Repeat once or twice until the output passes a gut check.

There is no metric for "does this sound like me?" The gut check is the metric.

---

## Step 7: Update and commit

A style review ripples beyond the style guide. Update each of these as needed:

- `src/site/style-guide/editorial.njk` -- the canonical style guide. This always gets updated.
- `docs/ROLE_*.md` -- if the changes affect a reviewer role's scope (e.g., the editorial style editor now enforces a new pattern).
- `CLAUDE.md` and `AGENTS.md` -- if file references, section descriptions, or editorial system pointers have changed.
- Consolidation -- if the review reveals redundant or outdated docs, delete them and update pointers rather than leaving dead references.

Commit with a message that references this process. Note the date and samples used so the next review has a baseline.

---

## Checklist

- [ ] 5 -- 10 samples collected, spread across type and register
- [ ] Quantitative baseline computed (sentence length, paragraph length, punctuation, readability)
- [ ] Rhetorical patterns extracted (structural, persuasive, voice markers)
- [ ] Patterns compared against current style guide (gaps, misscoped, contradictions, situational)
- [ ] New entries drafted at the right altitude (principle + example + boundary)
- [ ] Validated by generating test output and flagging mismatches
- [ ] Style guide updated, related docs checked (CLAUDE.md, AGENTS.md, role files), changes committed
- [ ] Process itself reviewed -- any steps need adjusting based on what this run revealed?

---

## Why this works

Before LLMs, extracting editorial style was a two-track effort. Computational stylists could measure things -- sentence length, vocabulary richness, function word frequencies -- but the tools (Stylo, AntConc, JGAAP) required technical skill, and the output was statistical, not actionable. You'd know an author favoured em dashes, but not what they were using them *for*. Meanwhile, editorial teams built style guides the manual way: read a lot of the author's work, notice patterns, argue about them in meetings, write down the decisions. This was slow, subjective, and depended on having a skilled editor with strong instincts and enough time.

LLMs changed what's practical. The close-reading work that used to require a trained editor spending hours with the corpus can now be done in minutes -- an LLM can name patterns, compare samples contrastively, and surface rhetorical moves that a statistical tool would miss entirely. But LLMs brought their own problems: generic descriptions ("the writing is clear and engaging"), hallucinated patterns, and a tendency to capture surface features while missing deeper rhetorical structure.

This process blends all three traditions. Computational tools provide the objective baseline that keeps the analysis honest. Editorial judgment decides which patterns are intentional and worth codifying. LLM-assisted analysis does the labour-intensive pattern extraction at speed. Each layer compensates for what the others miss.

**Computational stylistics** gives you numbers before you start interpreting. Stylometry research (Mosteller & Wallace, 1964; Burrows, 2002) found that the most reliable authorial fingerprints are in function words -- articles, prepositions, pronouns -- because writers use them without thinking. Sentence length distributions, vocabulary richness, punctuation density: all measurable, all author-specific. Burrows' Delta metric (z-scores of the 100 -- 150 most frequent words) is still the standard for authorship attribution.

Tools for this step: Stylo (R package, Computational Stylistics Group), AntConc (Laurence Anthony) for keyword and collocation analysis, Coh-Metrix (Graesser & McNamara) for cohesion and complexity across 100+ dimensions. For periodic reviews, an LLM computing basics from pasted text is adequate.

The catch is that counting things tells you *what* a writer does, not *why*. Heavy em dash use is a measurable fact. Using em dashes specifically to pivot from technical to plain language is a rhetorical choice that no metric will find. That's what Step 3 is for.

**Editorial tradition** is where the judgment lives. Content strategy (Halvorson, 2009; Fenton & Kiefer Lee, 2014) formalised the process of moving from "what do we actually do?" to "what should we do?":

1. Content audit -- catalogue what exists, descriptively.
2. Decision-point identification -- style guides are collections of resolved ambiguities.
3. Voice/tone separation -- voice is permanent personality; tone shifts by context (Mailchimp, Kiefer Lee ~2012).
4. "We are X but not Y" -- define traits with boundaries. The boundary prevents overcorrection.
5. Before-and-after examples -- the most useful entries show an edit in context, not a rule in isolation.

The editorial step asks a question the other two can't: is this pattern serving the writing, or is it just a habit? Not everything worth measuring is worth codifying.

**LLM-assisted analysis** does the close-reading work at speed. A skilled editor could surface the same patterns, but it would take hours. An LLM can name a recurring move ("diplomatic candor"), compare two texts contrastively, and check whether a pattern recurs across samples.

The trade-off: without structured prompts, LLMs default to "the writing is clear, engaging, and professional," which describes all competent writing and helps with nothing. They also catch surface features more reliably than deep rhetorical structure, and they will occasionally invent patterns that aren't there (Wegmann et al., 2022, found that many "style transfer" systems actually transfer topic or sentiment, not fine-grained authorial style -- the same risk applies to style *extraction*). Validate against the source text.

| Step | Tradition | What it adds |
|------|-----------|--------------|
| Sample collection | Editorial | Stratification, selection criteria |
| Quantitative baseline | Computational | Measurable features, objective facts |
| Rhetorical extraction | LLM-assisted | Pattern surfacing, naming, structured analysis |
| Comparison against guide | Editorial | Gap analysis, intentionality judgment |
| Codification | Editorial | Right altitude (principle + example + boundary) |
| Validation | LLM + Editorial | Generation test + gut check |

### First run: March 2026

The first run of this process used four samples across three registers:

- **Content-Action Model post** (2018, conceptual/framework, 1,724 words)
- **Integrating Eleventy with gulp** (2019, technical tutorial, 1,271 words)
- **Publishing since the 2000s** (2020, reflective/personal, 1,872 words)
- **Internal email on programme-implementation dynamics** (2026, high-stakes diplomatic)

The cross-sample analysis confirmed 10 patterns already in the guide and surfaced 7 new ones. Five were added to the style guide: em dashes as layering devices, colloquial restatement, distilled aphorisms, authority through specificity, and structural problem framing (elevated from opinion-only to core voice). Two were noted but not codified (conversational section headers, closings as relational posture) because the existing guidance already covered them adequately.

The re-run against the updated guide caught something the first pass missed: "structural problem framing" was already in the guide under "Arguing a position," but scoped only to opinion pieces. The cross-sample evidence showed it in every register, including the Eleventy tutorial. This led to adding the "Misscoped" category in Step 4 -- the process didn't originally have a way to flag patterns that were codified but in the wrong place.

The re-run also revealed that Step 7 was too narrow. It said "edit editorial.njk, update role files, commit" -- but the actual review also consolidated the editorial handbook, deleted archived roles, updated CLAUDE.md and AGENTS.md, and restructured file references. Step 7 now reflects this wider scope.

### How the process improves itself

Each run should leave the process itself slightly better, not just the style guide. The findings from a review can reveal:

- Missing categories in Step 4 (like "Misscoped," added after the first run)
- Steps that are too narrow or too broad (Step 7's scope expanded after the first run)
- Prompt template improvements for Step 3 (if the LLM consistently missed a pattern type, add it to the template)
- Methodology gaps (if a finding contradicts the research assumptions, update the "Why this works" section)

Note what you changed in the process and why when you commit, so future runs can trace the evolution.

### Related work and landscape

As of March 2026, no shipping product or open-source tool closes the full loop described here (sample analysis → gap detection against a living guide → codification → meta-improvement of the process). Several projects cover parts of it:

- **Every.to's AI Style Guide methodology** (Dan Shipper) -- the closest practitioner description. Five-step process ending with "use the guide for a week, notice corrections, update." Manual and not systematised, but the right instinct. [every.to/guides/ai-style-guide](https://every.to/guides/ai-style-guide)
- **Voice DNA Creator** (az9713, Claude Code skill) -- analyses 3-10 samples, outputs a structured JSON voice profile with version history and validation loop. Iteration is manual user feedback, not automated gap analysis. [github.com/az9713/ai-co-writing-claude-skills](https://github.com/az9713/ai-co-writing-claude-skills)
- **Voice Analyser MCP** (Houtini) -- MCP server with corpus collection from sitemaps, 14 statistical analysis engines, and style guide generation. Single-use extraction, no iteration. [github.com/houtini-ai/voice-analyser-mcp](https://github.com/houtini-ai/voice-analyser-mcp)
- **Spiral** (Every) -- captures voice through collaborative interviews, can scan recent posts weighted by engagement. More sophisticated capture than most tools, but produces a static profile. [writewithspiral.com](https://writewithspiral.com)

Most commercial tools (Jasper, Writer, Grammarly, Sudowrite) create voice profiles that live inside the tool. The key difference in this approach: the style guide is a public, human-readable, version-controlled document that any tool or human can use. Portability and inspectability over lock-in.

### Further reading

**Foundational stylometry:**
- Mosteller, F. & Wallace, D. (1964). [*Inference and Disputed Authorship: The Federalist*](https://link.springer.com/book/10.1007/978-1-4612-5256-6). Addison-Wesley. — The landmark study using function word frequencies to resolve disputed authorship.
- Burrows, J. (2002). ["Delta: a Measure of Stylistic Difference and a Guide to Likely Authorship."](https://doi.org/10.1093/llc/17.3.267) *Literary and Linguistic Computing*, 17(3). — Introduced the standard distance metric for computational authorship attribution.
- Biber, D. (1988). [*Variation across Speech and Writing*](https://doi.org/10.1017/CBO9780511621024). Cambridge University Press. — Multi-dimensional analysis framework for identifying register and style features.

**Content strategy and editorial process:**
- Halvorson, K. (2009). [*Content Strategy for the Web*](https://www.oreilly.com/library/view/content-strategy-for/9780135159033/). New Riders. — Formalised the content audit → style guide pipeline.
- Fenton, N. & Kiefer Lee, K. (2014). [*Nicely Said: Writing for the Web with Style and Purpose*](https://www.oreilly.com/library/view/nicely-said/9780133156836/). New Riders. — Voice/tone worksheets and the "we are X but not Y" exercise.
- Richards, S. (2017). [*Content Design*](https://contentdesign.london/shop/content-design-by-sarah-winters). Content Design London. — Evidence-based style guidance derived from user research (GOV.UK).

**LLM-era style research:**
- Wegmann, A. et al. (2022). ["What is the 'Style' of a Writer?"](https://doi.org/10.1162/coli_a_00519) *Computational Linguistics*. — Found that most "style transfer" systems transfer topic/sentiment, not authorial style. Directly relevant to why validation matters.
- PerFine (2025). "Iterative Critique-Refine Framework for Personalized Writing." [arxiv.org/html/2510.24469](https://arxiv.org/html/2510.24469) — Retriever-generator-critic loop iterating on tone, vocabulary, and structure. Closest academic work to this process, but operates per-piece rather than on a persistent guide.
- "Who Owns the Text? Design Patterns for Preserving Authorship in AI-Assisted Writing" (2026). [arxiv.org/html/2601.10236](https://arxiv.org/html/2601.10236) — Examines how AI tools can preserve rather than flatten authorial voice.
- Meta HyperAgents (2026). [ai.meta.com/research/publications/hyperagents](https://ai.meta.com/research/publications/hyperagents/) — Agents that rewrite their own modification procedures ("metacognitive self-modification"). The theoretical extreme of what the "How the process improves itself" section does pragmatically.
