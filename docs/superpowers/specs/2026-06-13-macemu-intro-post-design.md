# Spec: macemu-jit intro blog post

## What this is

An introductory journal entry for allaboutken.com about Ken's Apple Silicon SheepShaver project
(macemu-jit). Not an announcement, not a press release: a "here's what I've been up to" post that
frames recent tinkering and signals more to come. Narrative/opinion mode -- follows the scene-setting
exception to the "open with value" rule.

## Audience

People who follow Ken's blog: curious what he's up to, some interest in classic Mac and retro
computing, interested in Ken as a technical person. Not emulation experts.

## Tone

Personal, reflective, lightly self-deprecating about scope creep. Honest about AI collaboration
(matches the README voice: "a genuine partnership, not just prompting and hoping"). Journal entry,
not a product launch. Specificity over generality -- concrete tools, names, and details carry more
weight than assertions of experience.

**Voice to avoid**: promotional ("excited to announce"), academic hedging, tech swagger, soulless
documentation that states what without why.

## Length

800-1,000 words. Short end of the blog post range -- this is an intro, not a deep dive. Since it
will exceed 700 words, it needs a tl;dr block near the top.

## Structure

### Opening (1-2 paragraphs, narrative mode)

Not "I have a long history with classic Mac OS" -- too generic. Open with a specific scene or
detail that puts the reader in the moment. Options:

- The inciting incident: wanting to run macsurf, hitting the performance wall, realizing SheepShaver
  had no Apple Silicon build
- The absurdity of scope: "I wanted to run one app. I ended up writing a JIT compiler."
- A concrete detail from the era that grounds the reader (see: "You were always one bad PostScript
  ad placement away from a system lock" from the 2020 post -- that kind of specificity)

The opening should land on the through-line: "I've been approaching this from a few angles at once,
and they've all led to the same place." Link the 2020 post here as a quiet anchor ("a long history
with classic Mac OS"), not as the subject of the opening.

### tl;dr block

Required. Short, scannable, 3-4 bullets. What exists now, what's coming, where to find it. Example
shape:

> **tl;dr**
>
> - [Project arc in one sentence]
> - SheepShaver now boots Mac OS 8.6/9 to the Finder desktop on M-series Macs with a native
>   AArch64 JIT. Not distributed yet, but it works.
> - Active work: Mac OS 9.2 support requires New World ROM -- that's the current frontier.
> - Repo: github.com/khawkins98/macemu-jit

### The recent threads (1 H2 section, or woven into narrative)

A brief tour of connected projects -- each one a sentence or two, not a full explanation. The point
is to show they're all pulling in the same direction, not to catalog each project.

Projects to include:
- **classic-vibe-mac** (github.com/khawkins98/classic-vibe-mac): C source in, 68k Mac binary out,
  running in System 7.5.5 in the browser via WebAssembly Basilisk II
- **scriptoscope** (github.com/khawkins98/scriptoscope): Mac OS-style window manager and
  Kaleidoscope theme engine for the web
- **PDF-A-go-slim** (/posts/20260216-introducing-pdf-a-go-slim/ and /posts/20260216-90s-desktop-paradigm-browser-utilities/):
  browser utility with Mac OS 8 floating palette UI
- **macsurf** (github.com/mplsllc/macsurf): the QML app he wanted to actually run natively

These don't need their own H2 -- they can be woven into a narrative paragraph or a short list,
depending on what flows better in the draft.

### Where it landed (1 H2 section)

The chain: macsurf was slow → SheepShaver seemed like the answer → no Apple Silicon build existed →
one thing led to another. Result: a working ARM64 JIT build that boots Mac OS 8.6/9 to the Finder
on M-series Macs. Not distributed yet.

Acknowledge AI collaboration here, briefly and honestly. One or two sentences. Match the README
voice. Cross-link to /posts/20260420-let-ai-worry-about-the-code/ as a natural reference.

Do not oversell. This is a working build, not a polished product. The honesty is the point.

### What's next (1 H2 section, brief)

- Mac OS 9.2 requires New World ROM support -- that's the active work (Machine Layer)
- Silicon Sheep: a native macOS launcher in development
- More posts to come as this progresses

Keep this short. "More to come" should feel like a promise, not a press release.

### Closing (2-3 sentences)

Restate the through-line, invite feedback, link to the repo. Match the warmth of the AI post close:
"If you are already running coding agents against real projects... I would like to hear what you
have automated and what surprised you." Something like: "If you've been down a similar rabbit hole,
or you want to poke at the code, the repo is at [link]. I'd like to hear from you."

## Rhythm and specificity notes

- Vary sentence length. Short declarative sentences for punchy moments; longer for explanation.
- Fragments for emphasis -- once every 2-3 paragraphs at most.
- Specificity over credentials: name the tools, the versions, the concrete details. "Mac OS ROM 1.1
  boots Mac OS 8.6 to the Finder" beats "I got it working."
- After a denser paragraph, introduce a list or break before continuing.
- No three sentences of the same length in a row.
- Em dashes: 1-2 maximum for the whole post. Default to commas, semicolons, colons, periods.

## Frontmatter template

```yaml
---
title: '[to decide at draft -- see title options]'
layout: layouts/post.njk
teaser: '[one sentence, ≤ 25 words, persuasive -- sell the value, not the topic]'
image: '/blog/[filename].jpg'
image_meta:
  text: '[caption or context]'
  credit: 'Own work.'
  altext: '[screen reader alt text]'
date: 2026-06-[DD]
tags:
  - posts
topics:
  - retro computing
  - emulation
  - Apple Silicon
  - side projects
kens_status: draft
---
```

## Title options

- "Down the stack"
- "One thing led to another"
- "Running it for real"
- "A quarter century later" (echoes README: "After waiting a quarter of a century...")

The title should be concise, sentence case, no trailing punctuation.

## Key links

- 2020 post: /posts/20200208-its-been-20-years.html ("a long history with classic Mac OS")
- classic-vibe-mac: https://github.com/khawkins98/classic-vibe-mac
- scriptoscope: https://github.com/khawkins98/scriptoscope
- PDF-a-go-slim intro: /posts/20260216-introducing-pdf-a-go-slim/
- PDF-a-go-slim paradigm post: /posts/20260216-90s-desktop-paradigm-browser-utilities/
- macsurf: https://github.com/mplsllc/macsurf
- macemu-jit repo: https://github.com/khawkins98/macemu-jit
- AI collaboration cross-link: /posts/20260420-let-ai-worry-about-the-code/

## What to avoid

- Opening with the 2020 post -- reference it, don't lead with it
- Technical deep dives: JIT internals, Machine Layer milestones, nanokernel, MMIO bus
- Press release language ("I'm excited to announce", "revolutionary")
- Overselling: what's done is working but unpublished; what's next is active work
- Em dashes beyond 1-2 for the full post
- Three sentences of similar length in a row

## Source material

- `/Users/khawkins/Documents/git/macemu-jit/README.md` -- "Why does this exist?" is strong raw
  material; mine it for voice and specific details
- 2020 post voice: "You were always one bad PostScript ad placement away from a system lock" --
  this level of specificity is the target
- AI post close: "Drop me a note; I am collecting examples for a follow-up" -- this is the warmth
  level for the closing
