# Corpus story lab

Working notes for `/stats/story-lab/`. This is an experimental gallery, not a
proposal to publish every view.

## The useful reframing

The semantic graph is not interesting merely because posts connect to posts.
The stronger questions are personal and temporal:

- Which ideas came back after years away?
- Which concerns survived a change in role or organization?
- When did an idea move from a technical tactic to an organizational argument?
- Where does an article explain the same work that an impact story evidences?
- Which apparent clusters are merely several recent pieces about the same work?
- What disappeared from the public archive, and what returned?

The model proposes resemblance. Claims such as “this matured,” “this changed my
mind” or “this organization influenced the theme” require close reading and an
editorial annotation.

## Views implemented in the lab

### 1. Ideas that came back

A chronological arc diagram. Unlike the original topic-ordered Option D, the
horizontal axis now means time. It shows non-companion semantic pairs separated
by at least three years, with career chapters beneath as context.

Best raw material:

- 2017 → 2026: corporate design through information architecture → content
  architecture as a delivery problem.
- 2018 → 2026: a speculative web font for data → Datatype from the inside out.
- 2017 → 2025: another site rebuild → pure Eleventy v3.
- 2018 → 2026: Content-Action Model → digital transformation for complex
  organizations.

### 2. Biographies of a few ideas

Curated small multiples. Each row is a named trajectory rather than an
algorithmic component: content as infrastructure, a typeface for data, the
personal publishing stack, and reusable systems becoming organizational
systems.

This is the most promising form for a finished story because annotations can
say *how* an idea changed. Embeddings can only say that texts resemble one
another.

### 3. From argument to evidence

Two chronological lanes: writing and work. Connections join articles to impact
stories. The story is not that the model independently found a connection;
these are often two deliberate accounts of the same project. The interesting
difference is genre: one makes an argument and the other supplies outcomes.

### 4. Themes read against career chapters

A topic-by-chapter matrix with two complementary measures. Fill strength is the
raw post count on a shared square-root scale, so a larger count always looks
stronger. The printed percentage is the topic's share of explicitly tagged
entries in that chapter, retaining the relative prominence of a topic during a
shorter or quieter career chapter.

This should never be described as employer/theme correlation. Career and time
are confounded, and only a small minority of posts has explicit organization
metadata.

### 5. When themes became active

A topic-by-year score. Each topic row uses its own peak, so this is for reading
shape (burst, persistence, disappearance and return), not comparing magnitude
between topics.

### 6. Is this really a long-term network?

A diagnostic scatterplot: elapsed years on x, semantic similarity on y. It
makes the recency skew visible. The handful of marks at the right are stronger
story candidates than the dense contemporary cluster at the left.

### 7. The web behind the writing

An outbound-host ranking and a URL-suffix-by-career matrix. Hosts are ranked by
the number of distinct entries that mention them, with raw hyperlink counts
shown alongside. This prevents one code-heavy post from overwhelming the view.
The career matrix counts one appearance of a host per entry, then prints both
the count and its share of that chapter's host mentions.

This is a map of published references, not influence or trust. It includes
citations, tools, source buttons and image credits. Suffix families such as
`.com` and `.org` describe addresses, not institutional status.

### 8. Passages the map averaged away

The corpus map already derives from the semantic-search index, but it averages
all chunks into one vector per entry before finding neighbours. This view goes
back to the chunk layer and surfaces long-range passage pairs where the passage
score is substantially stronger than the whole-entry score and the pair did not
become one of the 66 displayed map edges.

The first chunk is excluded because it carries entry-header metadata. Every
remaining embedding still includes the entry title, so “passage-weighted echo”
is more accurate than “sentence match.” Snippets are candidates for close
reading, not evidence that one text caused or developed into another.

### 9. Topic families and two kinds of connection

Two radial diagrams share topic-family angles and a common radial scale. Angle
is one of eleven editorially assigned topic families. Radius is panel-specific
cross-family reach: an entry with more cross-family connections is pulled
towards the centre, while an entry with none remains at the outer edge. The
shared count scale makes authored and semantic hub status comparable even
though a node can occupy a different radius in each panel. The radius uses a
square-root scale so the authored panel's low counts do not collapse against
the outer ring. Publication time is
kept in the synchronized posts-by-year sparkline below. Curves bundle through
an inner anchor for each topic family. One panel draws links authored in the writing. The other replaces the
production map's whole-entry average, 0.60 floor and three-neighbour cap with
non-header passage-pair matches at 0.45. A line is retained when at least one
passage on each side finds a match. Line weight reflects the smaller count of
distinct supported passages on either side; the tooltip also reports the raw
passage-pair count, which is more sensitive to entry length. This produces 536
entry pairs: 400 have multiple passage-pair matches, 261 have multiple distinct
supporting passages on each side, and 97 have at least four on each side. Only
12 of the 100 entries remain isolated at this exploratory floor.

This comparison is more revealing than overlaying both relationship types. Of
138 authored entry pairs and 536 passage-supported semantic pairs, 100 occur in
both. Sixty-five authored pairs cross a topic-family boundary, compared with
352 passage-supported pairs. The provisional story is that Ken explicitly links arguments across
domains more often than the embedding model does; the model is more likely to
group repeated vocabulary within a domain. Gold paths highlight connections
touching the AI family so its movement into content, evidence and software work
can be inspected directly.

The layout adapts the coordinate grammar from Brian Moore's
[Radial Family Trees in Tableau](https://domoorewithdata.com/2023/04/03/radial-family-trees-in-tableau/):
distance from centre plus position around the circle. It does not borrow the
genealogical claim. These are topic bundles and connection counts, not ancestors
and descendants.

### 10. When subjects entered the archive

A stack of vertically offset topic sparklines, ordered by each recurring
primary topic's first appearance. Each line is a trailing six-month publication
count. The line is normalized to that topic's own peak so a two-entry subject
can still reveal whether its appearances were adjacent or years apart; the
actual entry total is printed at the right to prevent that normalization from
being mistaken for volume. Topics with only one entry are omitted.

The chart asks about the shape of a subject's presence in the public archive:
arrival, burst, persistence, silence and return. It cannot show how much work
occurred outside the published corpus, and heights must never be compared
between rows. Exact publication months are marked on each line so the smoothed
six-month trace does not pretend there were posts in the intervening months.

The layering adapts Kevin Marks's
[The Joy of Sparks](https://kevinmarks.com/joyofsparks.html), which turned daily
IRC activity into offset, filled sparklines. The lab borrows the small-multiple
terrain grammar, not the original palette or dataset.

## Other concepts worth trying later

### How the idea changed

Curated then/now pairs with one sentence for what remained and one for what
changed. The data-font pair is particularly strong because the later object is
an inversion of the earlier proposal, not just a repetition.

### The silence and the return

Treat the 2022–24 public-writing gap as part of the story, followed by the
2025–26 return. Wording must distinguish silence in the archive from absence of
work or thought.

### Where the taxonomy leaks

Keep Option C as a diagnostic. Diagonal blocks show agreement between the
controlled vocabulary and semantic model; off-diagonal cells show productive
crossings such as content architecture ↔ context engineering. This is more of
an instrument than a public narrative.

### What the model cannot connect

Show connected and isolated entries over time. “Isolated” must be labelled as
“no displayed edge at this threshold,” not unique, unrelated or unimportant.

### Archive strata

Align cadence, content type, primary topics, semantic returns and career context
as separate rows on one shared chronological spine. This could become the best
overview if the individual layers remain legible.

### Writing fingerprints

One compact glyph per entry or year, encoding length, genre and topic breadth.
This asks how the *shape of the writing* changed rather than what links to what.

### The words beneath the arc

Select an echo and show the actual passages or phrases that caused the model to
place the texts together. This would reconnect the abstract score to Ken's
voice and make false positives easier to spot.

## What the audit found

- 100 mapped entries and 66 displayed edges.
- 67 entries are dated 2025–26; there are no mapped entries in 2022–24.
- 50 of 66 displayed edges are less than one year apart.
- Only nine displayed edges span at least three years.
- 48 of 66 displayed pairs are already linked directly in the rendered
  article. This is more complete than the earlier source-text scan, which found
  44 and missed links produced from Markdown or template fields.
- The top-three-per-node rule suppresses 12 additional pairs above the 0.6
  threshold. It is a graph-layout optimization, not a storytelling rule.
- Career chapters inferred from date contain 6 DRS, 12 EMBL-EBI, 15 EMBL and 67
  UNDRR-era entries. Only ten entries carry explicit `org` frontmatter.
- 94 of 100 entries contain at least one external article link: 778 links to
  290 exact hosts, or 455 distinct entry-host mentions.
- The latest full-build semantic index contains 968 chunks across 155 pages;
  772 chunks belong to the 100 writing entries used by the corpus map.

The most honest summary is: the graph surfaces both connections already made
deliberately and echoes that were not directly linked.

## Topic-join bug uncovered during the experiment

The committed `semanticMap.json` previously marked 33 entries as `unfiled` even
though all 100 current source entries have topics. Legacy `.html` URLs and
custom `/work/` permalinks did not match source filenames. The uncommitted lab
changes repair the join by stripping `.html` and falling back to title. This
also makes the existing topic matrix and topic-ordered arc materially more
truthful.

## Research precedents

- Martin Wattenberg's [The Shape of Song](https://www.bewitched.com/song.html):
  arcs encode recurrence along a sequence, not generic relationship. This is
  the clearest precedent for the chronological “ideas that came back” view.
- Havre, Hetzler and Nowell's
  [ThemeRiver](https://www.pnnl.gov/publications/themeriver-visualizing-thematic-changes-document-collections):
  theme strength over time, read alongside external events. Career chapters
  can play the contextual role, provided no causal claim is made.
- Virginia Tech's
  [ThemeDelta](https://sanghani.cs.vt.edu/research/publications/2017/themedelta-dynamic-segmentations-temporal-topic-models.html):
  topics splitting and merging. Interesting for a curated family tree of ideas,
  but embeddings alone cannot justify lineage.
- Lev Manovich's [On Broadway](https://manovich.net/index.php/art/on-broadway):
  multiple layers aligned to one spine. The archive-strata concept borrows this
  grammar rather than its visual styling.
- Fernanda Viégas and Martin Wattenberg's
  [History Flow](https://research.ibm.com/publications/studying-cooperation-and-conflict-between-authors-with-history-flow-visualizations):
  continuity, disappearance and reappearance across time.
- [The Bohemian Bookshelf](https://sheelaghcarpendale.ca/Research/BohemianBookshelf):
  multiple coordinated visual access points into one corpus. It supports
  keeping a gallery of experiments rather than choosing one universal view.
- Giorgia Lupi and Stefanie Posavec's [Dear Data](https://www.dear-data.com/theproject):
  a personal documentary stance, with subjectivity and uncertainty visible.
- Stefanie Posavec's
  [Writing Without Words](https://www.stefanieposavec.com/archive/writing-without-words):
  the writing-fingerprint direction and the idea that visualization can be a
  close reading of emotionally significant material.
- The Pudding's
  [guide to visual storytelling](https://pudding.cool/process/how-to-make-dope-shit-part-3/):
  exploration is not itself a story. A finished version should open with one
  strong pair, reveal the broader pattern, and then allow exploration.
- Wattenberg's [notes on text visualization](https://www.bewitched.com/text-vis.html):
  bring fine-grained words and phrases forward instead of relying only on
  aggregation.
- Brian Moore's
  [Radial Family Trees in Tableau](https://domoorewithdata.com/2023/04/03/radial-family-trees-in-tableau/):
  separate radial distance and angular position, then bundle relationship
  lines through group-level structure. The lab maps those inputs to time and
  editorial topic family rather than generation and lineage.
- Kevin Marks's [The Joy of Sparks](https://kevinmarks.com/joyofsparks.html):
  vertically offset, filled activity sparklines turn many small time series
  into a shared terrain. The lab uses the same grammar for topic activity over
  publication time.

Borrow the abstract grammar and interaction patterns, not a precedent's palette,
typography, composition or copy. Link the inspirations in any eventual method
note.

## Running the experiment

```bash
node scripts/compute-story-lab.mjs
yarn sass
yarn eleventy
```

Then open `/stats/story-lab/`. The page is `noindex` and excluded from
collections. None of the experimental changes should be committed until a
direction is chosen.
