# Style Review Process

A repeatable process for extracting editorial voice and style patterns from text samples, then folding findings into the [Editorial style guide](https://allaboutken.com/style-guide/editorial/) (source: `src/site/style-guide/editorial.njk`).

Run this when you notice your writing evolving, when you have a strong sample from a different register (email, presentation, report), or periodically to keep the style guide aligned with actual practice.

---

## When to run this

- After writing something that felt distinctly "right" but doesn't match the current guide
- When a new content type or register emerges (emails, proposals, talks)
- Periodically (every 6 -- 12 months) to check for drift between the guide and actual output
- When onboarding a collaborator or AI assistant who needs to write in your voice

---

## Step 1: Collect samples

Gather 5 -- 10 representative texts. Stratify across contexts for a fuller picture:

- **Published posts** (2 -- 3 recent, 1 -- 2 you consider your best)
- **Different registers** (email, internal memo, presentation notes, documentation)
- **High-stakes writing** (where you were trying hardest to be understood)

Exclude co-authored pieces, heavily edited work, or outliers that don't represent your typical voice.

**Output**: a folder or list of source texts, each labelled with type and context.

---

## Step 2: Quantitative baseline

Run basic measurements on the sample corpus. This establishes objective facts before interpretation:

- **Sentence length**: mean, median, and range (short declaratives vs. long compound sentences)
- **Paragraph length**: typical sentence count per paragraph, by content type
- **Vocabulary richness**: rough type-token ratio, use of technical vs. plain language
- **Punctuation habits**: em dash frequency, semicolon use, parenthetical asides
- **Readability scores**: Flesch-Kincaid or similar (useful as a baseline, not a target)

For a quick pass, an LLM can compute these from pasted text. For rigour, tools like AntConc or the Stylo R package provide deeper analysis.

**Output**: a short summary of measurable style features (e.g., "average sentence length 18 words, paragraphs typically 2 -- 4 sentences, heavy em dash use, Flesch-Kincaid grade 10 -- 12").

---

## Step 3: Rhetorical pattern extraction

This is the core analytical step. For each sample, identify:

### Structural patterns
- How does the piece open? (Value statement, anecdote, provocation, scene-setting)
- How is evidence introduced? (Data, quotation, example, analogy)
- How are transitions handled? (Implicit through headers, bridge sentences, structural flow)
- How does it close? (Restatement, call to action, single distilled recommendation, callback)

### Rhetorical moves
- What persuasive strategies recur? (Diplomatic candor, preemptive fairness, anaphoric buildup, register shifts, distillation to single intervention)
- How is criticism framed? (Separating person from problem, acknowledging counterarguments)
- How is authority established? (Experience, evidence, specificity, concession)

### Voice markers
- Pronoun patterns (I/we/you)
- Register level (formal, conversational, technical, mixed)
- Characteristic constructions (sentence fragments for emphasis, rhetorical questions, lists as breathing room)
- What the voice is *not* (hedging, swagger, bureaucratic language, hype)

**Method**: Feed 3 -- 5 samples to an LLM with a structured prompt covering the dimensions above. Run the analysis on each sample independently, then compare results. Patterns that appear across multiple samples are reliable; one-offs are situational.

**Prompt template** (adapt as needed):

```
Analyze the writing style of the following text. For each dimension below, identify specific patterns with quoted examples:

1. Sentence structure: length variation, characteristic constructions, use of fragments
2. Paragraph structure: length, internal rhythm, topic sentence placement
3. Rhetorical moves: how arguments are built, how criticism is framed, how evidence is introduced
4. Vocabulary: register level, technical vs. plain, Latinate vs. Germanic, distinctive word choices
5. Punctuation and pacing: em dashes, semicolons, parentheticals, how pace is controlled
6. Opening and closing patterns
7. What this voice is NOT -- patterns it deliberately avoids

Be specific. Use quotes from the text as evidence. Flag anything that seems distinctive or unusual.
```

**Output**: a list of candidate patterns, each with evidence from the corpus.

---

## Step 4: Compare against the current style guide

Read the current style guide (`src/site/style-guide/editorial.njk`) and compare it against the patterns identified in Step 3.

Categorise each finding:

- **Already codified** -- the guide captures this. No action needed.
- **Gap** -- a real pattern the guide doesn't mention. Candidate for addition.
- **Contradiction** -- the guide says one thing, the writing does another. Decide which is right: update the guide, or flag the writing as an exception.
- **Situational** -- a pattern that only appears in one register or context. Note it but don't add it to the general guide unless it recurs.

**Output**: a list of proposed additions, updates, or corrections to the style guide.

---

## Step 5: Codify at the right altitude

For each gap or contradiction, draft a style guide entry:

- **Lead with the principle** (1 sentence)
- **Add a concrete example** from the corpus (quoted or paraphrased)
- **Include a "but not" boundary** where useful (what the pattern is not)
- **Place it in the right section** of the existing guide

The right altitude: too specific ("always use three 'It's not that' clauses") becomes a formula. Too abstract ("be persuasive") is useless. Aim for principle + one example.

**Output**: draft edits to `editorial.njk`, ready for review.

---

## Step 6: Validate

Test the updated guide by using it as context for LLM-assisted writing:

1. Generate a short piece (2 -- 3 paragraphs) on a familiar topic using the updated guide as instructions.
2. Read the output and flag what "sounds wrong" -- where the voice slips, where it feels generic, where it over-applies a rule.
3. Use those flags to sharpen the guide entries: add boundaries, qualify scope, or add counter-examples.
4. Repeat once or twice until the generated output passes a gut check.

This step is subjective by design. The goal is not machine-measurable fidelity but "does this sound like me?"

**Output**: refined style guide entries.

---

## Step 7: Update and commit

- Edit `src/site/style-guide/editorial.njk` with the validated changes.
- Update any role files in `docs/ROLE_*.md` if the changes affect their scope.
- Commit with a message that references this process (e.g., "Update editorial voice from style review -- add register shift guidance").
- Note the date and samples used, so the next review has a baseline to compare against.

---

## Checklist (quick reference)

- [ ] 5 -- 10 samples collected, stratified by type and register
- [ ] Quantitative baseline computed (sentence length, paragraph length, punctuation, readability)
- [ ] Rhetorical patterns extracted (structural, persuasive, voice markers)
- [ ] Patterns compared against current style guide (gaps, contradictions, situational)
- [ ] New entries drafted at the right altitude (principle + example + boundary)
- [ ] Validated by generating test output and flagging mismatches
- [ ] Style guide updated, role files adjusted, changes committed

---

## Why this works: methodology and research

The process above draws on three disciplines, each contributing a different strength. This section explains the rationale behind each step.

### Three traditions, one process

1. **Computational stylistics** provides the objective foundation -- measurable features that are author-specific and reproducible.
2. **Editorial tradition** provides the organisational structure -- how to move from "what do we actually do?" to "what should we do?"
3. **LLM-assisted analysis** provides the labour-saving pattern extraction -- surfacing tacit patterns that would take a skilled editor hours to articulate manually.

No single approach is sufficient on its own. Computational analysis without editorial judgment produces a list of statistics, not a style guide. Editorial judgment without computational grounding risks confirming biases about one's own writing. LLM analysis without either baseline or judgment produces confident but potentially hallucinated descriptions.

### Computational stylistics

**Why function words matter more than content words.** The foundational insight of stylometry (Mosteller & Wallace, 1964; Burrows, 2002) is that the most reliable authorial fingerprints are in the words writers don't think about: articles, prepositions, conjunctions, pronouns. These function words are used largely unconsciously, making them resistant to deliberate imitation or variation.

Burrows' Delta metric (2002) computes z-scores of the 100 -- 150 most frequent words in a corpus and measures distance between texts. It remains the standard baseline in computational authorship attribution.

**What quantitative analysis captures well:**

- **Sentence length distribution** -- not just the mean, but the variance. A writer who alternates 8-word and 25-word sentences has a different rhythm from one who consistently writes 15-word sentences, even if the averages are similar.
- **Vocabulary richness** -- type-token ratio, hapax legomena (words used only once), and Yule's K statistic measure lexical diversity.
- **Punctuation as style signal** -- em dash frequency, semicolon use, and parenthetical density are surprisingly strong authorial markers. They reflect how a writer controls pace and manages subordinate information.
- **Readability scores** -- Flesch-Kincaid, Gunning Fog, and Coleman-Liau are crude but useful as aggregate baselines. They measure complexity, which is a deliberate stylistic choice.

**What it misses.** Quantitative analysis captures *mechanics* but not *moves*. It can tell you that an author uses em dashes frequently but not that they use them specifically to pivot from a technical observation to a plain-language restatement.

**Tools:** Stylo (R package), AntConc (Laurence Anthony), JGAAP (Patrick Juola), Coh-Metrix (Graesser & McNamara). For periodic style reviews, an LLM computing basic statistics from pasted text is adequate.

### Editorial tradition

**How style guides are built.** The content strategy discipline (Halvorson, 2009; Fenton & Kiefer Lee, 2014) formalised the process:

1. **Content audit** -- catalogue and evaluate what exists. The goal is descriptive: what do we actually do, consistently?
2. **Decision-point identification** -- style guides are collections of resolved ambiguities. Every entry answers a question where reasonable people could disagree.
3. **Voice and tone separation** -- Mailchimp's contribution (Kiefer Lee, ~2012). Voice is the permanent personality (consistent across all contexts). Tone shifts by situation. Confusing the two produces either rigid formality or inconsistent personality.
4. **"We are X but not Y"** -- a workshop exercise for defining voice traits with boundaries. The boundary is as important as the trait -- it prevents overcorrection.
5. **Before-and-after examples** -- the most useful entries in any style guide show an edit in context, not just a rule in isolation.

**Why the editorial layer matters.** Computational analysis tells you what features are present. Editorial judgment tells you which features are *intentional* and worth codifying vs. which are habitual and worth examining. Not every measurable pattern should become a rule.

**Key references:** AP Stylebook (1953 --), GOV.UK Content Design Manual (Richards, 2017), The Economist Style Guide, 18F Content Guide (open source on GitHub).

### LLM-assisted analysis

**What LLMs do well:**

- **Naming patterns** -- identifying a recurring rhetorical move and giving it a label. Labels make patterns teachable and reusable.
- **Contrastive analysis** -- when given two texts, identifying what's distinctive about each. More specific than single-text analysis.
- **Structured extraction** -- when prompted with specific dimensions, producing systematic analysis rather than vague impressions.
- **Cross-sample consistency checking** -- analysing multiple texts independently to separate recurring patterns from situational ones.

**What LLMs do poorly:**

- **Generic descriptions** -- without structured prompts, LLMs default to "the writing is clear, engaging, and professional." Useless for differentiation.
- **Surface over structure** -- lexical choices and sentence patterns are captured more reliably than argumentative scaffolding or rhetorical strategy.
- **Hallucinated patterns** -- LLMs will sometimes identify patterns that aren't actually present, particularly when prompted to find a specific number. Validation against the source text is essential.
- **Style as content confusion** -- many "style transfer" systems actually transfer topic or sentiment, not fine-grained authorial style (Wegmann et al., 2022).

**Practical considerations:** Contrastive prompts outperform single-text prompts. Analyse each sample independently before synthesising. High-stakes writing reveals the most about natural voice. Validation is subjective by design -- there is no automated metric for "does this sound like me?"

### How the layers combine

| Step | Primary tradition | What it contributes |
|------|-------------------|---------------------|
| Sample collection | Editorial | Stratification by context, selection criteria |
| Quantitative baseline | Computational | Measurable features, objective facts |
| Rhetorical pattern extraction | LLM-assisted | Tacit pattern surfacing, naming, structured analysis |
| Comparison against existing guide | Editorial | Gap analysis, intentionality judgment |
| Codification | Editorial | Right altitude (principle + example + boundary) |
| Validation | LLM-assisted + Editorial | Generation test + human gut check |

### Further reading

- Burrows, J. (2002). "Delta: a Measure of Stylistic Difference and a Guide to Likely Authorship." *Literary and Linguistic Computing*, 17(3).
- Mosteller, F. & Wallace, D. (1964). *Inference and Disputed Authorship: The Federalist*. Addison-Wesley.
- Richards, S. (2017). *Content Design*. Content Design London.
- Wegmann, A. et al. (2022). "What is the 'Style' of a Writer?" *Computational Linguistics*.
- Fenton, N. & Kiefer Lee, K. (2014). *Nicely Said: Writing for the Web with Style and Purpose*. New Riders.
- Biber, D. (1988). *Variation across Speech and Writing*. Cambridge University Press.
- Halvorson, K. (2009). *Content Strategy for the Web*. New Riders.
