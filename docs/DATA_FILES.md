# Data files reference

Global data files live in `src/site/_data/`. Eleventy exposes them as top-level template variables matching the filename (without extension). Templates access them as `{{ siteConfig.siteInformation.title }}` or `{% for project in garage %}`. `siteConfig.json`, `garage.json`, and `timelineGaps.json` are maintained source; `related.json`, `semanticMap.json`, and `storyLab.json` are ignored build artifacts.

---

## `siteConfig.json`

**Template variable:** `siteConfig`

### Schema

```json
{
  "siteInformation": {
    "title": "string",
    "short_description": "string",
    "url": "string",
    "author": "string",
    "email": "string"
  }
}
```

### Fields

| Field | Type | Notes |
| --- | --- | --- |
| `siteInformation.title` | string | Site name used in `<title>` and Schema.org `WebSite.name` |
| `siteInformation.short_description` | string | Fallback `<meta name="description">` and OG description when a page has no `teaser` |
| `siteInformation.url` | string | Canonical origin (no trailing slash), e.g., `https://www.allaboutken.com` |
| `siteInformation.author` | string | Author name used in Schema.org `author`, `publisher`, and `article:author` OG tag |
| `siteInformation.email` | string | Contact email used in Atom feed metadata (`feed.njk`) |

### Template usage

`base.njk` reads `siteConfig` in several places:

```njk
{# Page <title> #}
{{ title or siteConfig.siteInformation.title }} | All about Ken Hawkins

{# Meta description fallback #}
{{ (teaser or siteConfig.siteInformation.short_description) | striptags }}

{# OG description fallback #}
{{ og_description or teaser or siteConfig.siteInformation.short_description }}

{# OG site_name #}
<meta property="og:site_name" content="All About Ken Hawkins" />

{# Canonical URL prefix #}
{{ siteConfig.siteInformation.url }}{{ page.url | url }}
```

`post.njk` uses it for Schema.org JSON-LD:

```njk
"author": { "@type": "Person", "name": {{ siteConfig.siteInformation.author | dump | safe }} },
"publisher": { "@type": "Person", "name": {{ siteConfig.siteInformation.author | dump | safe }} }
```

### When to edit

- Changing the site title or canonical domain → update `title` and `url`.
- Updating the author name → update `author` (propagates to all Schema.org output automatically).
- Updating the global site description → update `short_description`.

---

## `garage.json`

**Template variable:** `garage`

Array of project objects. Powers the `/garage/` page (`src/site/garage.njk`).

### Schema

```json
[
  {
    "name": "string",
    "path": "string",
    "repo": "string",
    "post": "string",
    "status": "string",
    "description": "string",
    "image": "string",
    "image_alt": "string"
  }
]
```

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | ✅ | Display name of the project, used as `<h2>` link text |
| `path` | string | ✅ | Root-relative URL to the project's live page (e.g., `/PDF-A-go-go/`) |
| `repo` | string | ✅ | Full URL of the GitHub (or other) source repository |
| `post` | string | ✅ | Root-relative URL to the introductory blog post (e.g., `/posts/20250811-pdf-a-go-go/`) |
| `status` | string | ✅ | Short lifecycle label displayed as a `<span class="kh-label">` badge. Common values: `stable`, `active`, `experimental` |
| `description` | string | ✅ | One- or two-sentence plain-text summary of the project |
| `image` | string | Optional | Path to a representative image, using the same convention as post `image` frontmatter: write `/blog/filename.jpg` — the template prepends `/images/` |
| `image_alt` | string | Optional | Alt text for the image. Falls back to `project.name` if absent |

### Template usage

`garage.njk` iterates the array:

```njk
{% for project in garage %}
<article class="kh-summary ...">
  <div class="kh-summary__date">
    <span class="kh-label">{{ project.status }}</span>
  </div>
  <h2 class="kh-summary__title kh-font-headline">
    <a href="{{ project.path }}">{{ project.name }}</a>
  </h2>
  {% if project.image %}
  <a href="{{ project.path }}" class="kh-summary__image">
    <img src="/images{{ project.image }}" alt="{{ project.image_alt or project.name }}">
  </a>
  {% endif %}
  <p class="kh-summary__text">{{ project.description }}</p>
  <p class="kh-cluster">
    <a href="{{ project.post }}">Read the post</a>
    <a href="{{ project.repo }}">Source on GitHub</a>
  </p>
</article>
{% endfor %}
```

> **Image path note:** The template renders `src="/images{{ project.image }}"`. Set `image` to `/blog/filename.jpg` (no `/images/` prefix) — the same convention as post frontmatter `image` values.

### Adding a new project

1. Add a new object to the end of the array in `garage.json`.
2. Provide at minimum: `name`, `path`, `repo`, `post`, `status`, `description`.
3. Add a hero image in `src/site/images/blog/` and set `image: /blog/filename.jpg`.
4. Write `image_alt` — if omitted, the project `name` is used as alt text.
5. Publish the introductory post and confirm its `permalink` matches the `post` value.

### Status label conventions

There is no enforced vocabulary; use whatever label is accurate:

| Label | When to use |
| --- | --- |
| `stable` | Mature, versioned, unlikely to have breaking changes |
| `active` | Under ongoing development |
| `experimental` | Early-stage, may change significantly |
| `archived` | No longer maintained but preserved for reference |

---

## `timelineGaps.json`

**Template variable:** `timelineGaps`

**Status:** Tracked, hand-maintained source data

Maps an empty calendar year or consecutive year range to the short caption shown when the register timeline collapses that gap.

### Schema

```json
{
  "YYYY": "short caption",
  "YYYY-YYYY": "short caption"
}
```

Keys must match the year or inclusive year range produced by the `collapseEmptyYears` filter. Values are plain-text captions. The `_comment` key in the current file records the same maintenance guidance for editors.

### Consumers and editing guidance

- `src/site/index.njk` and the post and digesting layouts pass this object to `collapseEmptyYears`.
- `src/site/_includes/partials/pulse-strip.njk` renders the selected caption beneath the collapsed gap and in its tooltip.
- Edit this file when a known publication gap needs purposeful copy. Keep captions short.
- Deleting or omitting a matching key is safe: the timeline falls back to a plain `no posts` note.
- No generation command is required; changes are picked up by `yarn dev`, `yarn eleventy`, or `yarn build`.

---

## `related.json`

**Template variable:** `related`

**Status:** Generated and ignored; do not edit or commit

**Generate with:** `yarn related` after `yarn embeddings`, or run `yarn build`

Maps an entry's exact served URL to up to three semantically similar entries. Only neighbours with cosine similarity >= 0.55 are included, so an entry may have no key.

### Practical schema

```json
{
  "/posts/example.html": [
    {
      "url": "/posts/another-entry/",
      "title": "Another entry",
      "score": 0.63
    }
  ]
}
```

`url` and the object keys are served paths, `title` is display text from the embedding corpus, and `score` is cosine similarity rounded to two decimal places.

`src/site/_includes/partials/related-semantic.njk` looks up `related[page.url]`; `entry-foot.njk` includes that partial for entry layouts. Exact URL forms matter, including legacy `.html` permalinks. To change the algorithm, threshold, or neighbour cap, edit `scripts/compute-related.mjs` and regenerate rather than editing the JSON.

If `build/semantic-search/vectors.json` is absent, the generator exits successfully without output and templates render no related list.

---

## `semanticMap.json`

**Template variable:** `semanticMap`

**Status:** Generated and ignored; do not edit or commit

**Generate with:** `yarn semantic-map` after `yarn embeddings`, or run `yarn build`

Contains the entry-level semantic graph and deterministic two-dimensional layouts used by `src/site/stats.njk`, `src/site/stats-map-variants.njk`, semantic visualization shortcodes, and the Story Lab generator.

### Practical schema

```json
{
  "generated": "method description",
  "edgeMin": 0.6,
  "nodes": [
    {
      "url": "/posts/example.html",
      "title": "Example",
      "topic": "information architecture",
      "x": 0.5,
      "y": 0.4,
      "fx": 0.6,
      "fy": 0.3,
      "degree": 2
    }
  ],
  "order": [{ "i": 0, "topic": "information architecture" }],
  "edges": [{ "a": 0, "b": 4, "s": 0.68 }]
}
```

- `x`/`y` are normalized classical-MDS coordinates; `fx`/`fy` are deterministic force-layout coordinates. Neither axis has semantic meaning.
- `a`, `b`, and `i` are indexes into `nodes`; `s` is cosine similarity rounded to two decimals.
- `topic` is the parent portion of the first frontmatter topic, and `degree` counts retained graph connections.
- `order` groups node indexes for matrix and arc variants.

The generator needs `build/semantic-search/vectors.json` and at least three eligible `/posts/` or `/work/` entries. Missing or insufficient input is non-fatal and leaves any existing artifact untouched. Change projection or edge rules in `scripts/compute-semantic-map.mjs`, then regenerate.

---

## `storyLab.json`

**Template variable:** `storyLab`

**Status:** Generated and ignored; do not edit or commit

**Generate with:** `yarn story-lab` after `yarn semantic-map`, or run `yarn build`

Supplies the experimental `/stats/story-lab/` page in `src/site/stats-story-lab.njk`. The generator combines `semanticMap.json`, post frontmatter and source links, rendered entry HTML, and the embedding corpus into ready-to-render narrative and visualization data.

### Practical schema

The top-level object contains:

| Field | Purpose |
| --- | --- |
| `generated`, `counts`, `years` | Provenance, corpus totals, and displayed years |
| `nodes`, `allEdges` | Dated and classified entries plus enriched semantic links |
| `returnEdges`, `featuredReturns`, `practiceEdges` | Long-range, highlighted, and article-to-impact-story relationships |
| `careerBands`, `topicCareer`, `topicYears` | Career-period and topic matrices |
| `scatter`, `trails` | Similarity/time points and editorially seeded semantic trails |
| `outbound` | External-link totals, domains, suffix classes, and career breakdowns |
| `semanticIndex` | Embedding metadata and selected passage-level echoes |
| `radial` | Authored-versus-semantic graph geometry, edges, groups, and timeline |
| `topicSparks` | Rolling topic-activity series and precomputed chart geometry |

Many nested objects include SVG coordinates or paths calculated specifically for the current template. Treat the generator and `docs/CORPUS_STORY_LAB.md` as the schema source of truth; consumers should not infer new editorial meaning from layout-only fields.

`semanticMap.json` is required. If it is missing, the command exits successfully without output. `vectors.json` is optional when running this command alone: without it, the artifact is still written, but passage-based sections are empty or fall back to whole-entry map edges. A normal `yarn build` always supplies both inputs. Change career bands, narrative lenses, thresholds, or chart construction in `scripts/compute-story-lab.mjs`, then regenerate.
