# Spec: macemu-jit intro blog post

## What this is

An introductory journal entry for allaboutken.com about Ken's Apple Silicon SheepShaver project (macemu-jit). Not an announcement, not a press release -- a "here's what I've been up to" post that frames recent tinkering and signals more to come.

## Audience

People who follow Ken's blog: curious what he's up to, some interest in classic Mac and retro computing, interested in Ken as a technical person. Not emulation experts. Not a developer audience specifically.

## Tone

Personal, reflective, lightly self-deprecating about scope creep. Honest about AI collaboration (matches README voice). Journal entry, not a product launch.

## Structure

### Opening
Short. One or two sentences. "I have a long history with classic Mac OS [link to 2020 post]. Lately I've been tinkering with it more than usual." No preamble.

### The recent threads
A brief tour of connected projects -- each one a sentence or two, not a full explanation:
- **classic-vibe-mac** (github.com/khawkins98/classic-vibe-mac): running 68k Mac code in a browser via WebAssembly Basilisk II
- **scriptoscope** (github.com/khawkins98/scriptoscope): Mac OS-style window manager and Kaleidoscope theme engine for the web
- **PDF-A-go-slim** (link to post): browser utility with Mac OS 8 floating palette UI
- **macsurf** (github.com/mplsllc/macsurf): the QML app he wanted to actually run

The point isn't to explain each -- it's to show they're all pulling in the same direction.

### Where it landed
Macsurf was slow. SheepShaver seemed like the answer. No Apple Silicon build existed. One thing led to another. Result: a working ARM64 JIT build of SheepShaver that boots Mac OS 8.6/9 to the Finder desktop on M-series Macs. Not distributed yet, but it works.

Acknowledge AI collaboration briefly and honestly -- same tone as the README ("a genuine partnership, not just prompting and hoping").

### What's next
Brief, not overselling:
- Mac OS 9.2 requires New World ROM support -- that's the active work
- A native macOS launcher (Silicon Sheep) is in development
- More posts to come

### Close
One or two sentences. This is a journal entry, not an announcement. Here's the repo, here's where things stand.

## Title options (decide at draft time)

- "Down the stack"
- "Running it for real"
- "One thing led to another"
- "A quarter century later" (echoes README: "After waiting a quarter of a century...")

## Key links to include

- 2020 post "Publishing since the 2000s" (anchor for "long history with classic Mac OS")
- github.com/khawkins98/classic-vibe-mac
- github.com/khawkins98/scriptoscope
- PDF-A-go-slim post (/posts/20260216-introducing-pdf-a-go-slim/)
- github.com/mplsllc/macsurf
- github.com/khawkins98/macemu-jit (the repo itself)

## What to avoid

- Opening with the 2020 post -- reference it, don't lead with it
- Technical deep dives (JIT internals, Machine Layer, milestone language)
- Press release language ("I'm excited to announce...")
- Overselling what's done or what's coming
- Em dashes -- use commas, semicolons, colons instead

## Length

400-600 words. Intro post, not a deep dive.

## Source material

- `/Users/khawkins/Documents/git/macemu-jit/README.md` -- "Why does this exist?" section is strong raw material, especially the voice
- `/Users/khawkins/Documents/git/allaboutken-11ty/src/site/posts/20200208-its-been-20-years.njk` -- the anchor post
- `/Users/khawkins/Documents/git/allaboutken-11ty/src/site/posts/20260216-90s-desktop-paradigm-browser-utilities.njk` -- tone reference
