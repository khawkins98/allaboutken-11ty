# Data files reference

Global data files live in `src/site/_data/`. Eleventy exposes them as top-level template variables matching the filename (without extension). Templates access them as `{{ siteConfig.siteInformation.title }}` or `{% for project in garage %}`.

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
