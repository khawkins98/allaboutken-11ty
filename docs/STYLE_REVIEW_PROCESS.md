# Style Review Process

How to extract voice and style patterns from your own writing, then fold findings into the [Editorial style guide](https://allaboutken.com/style-guide/editorial/) (source: `src/site/style-guide/editorial.njk`).

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
- **Contradiction** -- the guide says one thing, the writing does another. Decide which is right.
- **Situational** -- only appears in one register. Note it but don't codify unless it recurs.

---

## Step 5: Codify at the right altitude

For each gap, draft a style guide entry. Lead with the principle (one sentence), add a concrete example from the corpus, and include a "but not" boundary where useful.

The altitude matters. "Always use three 'It's not that' clauses" is too specific -- it becomes a formula. "Be persuasive" is too abstract -- it says nothing. The sweet spot is principle + one example.

---

## Step 6: Validate

Use the updated guide as a system prompt and generate a short piece (2 -- 3 paragraphs) on a topic you know well. Read it. Flag what sounds wrong -- where the voice slips, where it feels generic, where a rule got over-applied.

Sharpen the guide entries based on what you flagged. Repeat once or twice until the output passes a gut check.

There is no metric for "does this sound like me?" The gut check is the metric.

---

## Step 7: Update and commit

Edit `editorial.njk` with the validated changes. Update any role files in `docs/ROLE_*.md` if relevant. Commit with a message that references this process. Note the date and samples used so the next review has a baseline.

---

## Checklist

- [ ] 5 -- 10 samples collected, spread across type and register
- [ ] Quantitative baseline computed (sentence length, paragraph length, punctuation, readability)
- [ ] Rhetorical patterns extracted (structural, persuasive, voice markers)
- [ ] Patterns compared against current style guide (gaps, contradictions, situational)
- [ ] New entries drafted at the right altitude (principle + example + boundary)
- [ ] Validated by generating test output and flagging mismatches
- [ ] Style guide updated, changes committed

---

## Why this works

The process draws on three disciplines.

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

### Further reading

- Burrows, J. (2002). "Delta: a Measure of Stylistic Difference and a Guide to Likely Authorship." *Literary and Linguistic Computing*, 17(3).
- Mosteller, F. & Wallace, D. (1964). *Inference and Disputed Authorship: The Federalist*. Addison-Wesley.
- Richards, S. (2017). *Content Design*. Content Design London.
- Wegmann, A. et al. (2022). "What is the 'Style' of a Writer?" *Computational Linguistics*.
- Fenton, N. & Kiefer Lee, K. (2014). *Nicely Said: Writing for the Web with Style and Purpose*. New Riders.
- Biber, D. (1988). *Variation across Speech and Writing*. Cambridge University Press.
- Halvorson, K. (2009). *Content Strategy for the Web*. New Riders.
