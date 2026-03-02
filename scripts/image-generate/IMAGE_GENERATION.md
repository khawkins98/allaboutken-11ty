# Image generation

Generate hero images for blog posts using Together AI's FLUX.2-dev model. Two tools: a bash script for quick one-offs, and a Node script that reads post context and suggests prompts.

Style is Japanese blockprint -- high-contrast black ink woodcut on cream with sparse warm amber accent.

## Setup

1. Get an API key at <https://api.together.ai/settings/api-keys>
2. Save it to `.env` in the project root:

```bash
echo "TOGETHER_API_KEY=your-key-here" > .env
```

`.env` is gitignored, so your key stays local.

## Two tools

### `yarn generate-image <file.njk>` -- post-aware workflow

Reads a post's frontmatter, classifies the post type, and suggests prompts. Generates images in parallel (~30s for 3 vs ~90s one at a time), opens them in Preview, and waits for you to pick one. Copies a frontmatter snippet to clipboard.

```bash
yarn generate-image src/site/posts/20260302-semantic-search-browser-embeddings.njk
yarn generate-image --prompt "custom prompt" src/site/posts/my-post.njk
yarn generate-image --count 5 src/site/posts/my-post.njk
```

Options:
- `--count N` -- number of options to generate (default: 3)
- `--prompt "..."` -- skip auto-generation, use this prompt directly

### `./scripts/image-generate/generate-image.sh` -- quick one-offs

For when you already know the prompt and just want an image.

```bash
./scripts/image-generate/generate-image.sh "a magnifying glass over scattered dots"
./scripts/image-generate/generate-image.sh --seed 42 "rerun with same seed"
```

Options:
- `--seed N` -- reproducibility seed
- `--width N` -- image width (default: 1280)
- `--height N` -- image height (default: 832)
- `--help` -- full usage

## Writing prompts

Go abstract and evocative, not literal. "A lone sailboat on open water, no harbor or dock visible" is a better image for a search post than "a search results page." Think about the feeling of the post, not its subject matter.

One subject per image. The blockprint style does the visual heavy lifting -- the prompt just needs a clear composition. Birds, kites, sailboats, paths, rivers, and seeds work well. Screens and interfaces don't.

FLUX.2-dev can't render text. The style prefix already includes "no text, no words." Don't try to work around this. Don't prompt for named people or brands either.

### Prompts that worked

For a post about site search without external services:
- "a lone sailboat on open water, no harbor or dock visible, just horizon"
- "a kite flying high with its string cut, drifting freely against clouds"
- "paths worn into grass by footsteps, no paved road, just natural routes"

For a post about governance transformation:
- "a cracked wall with light flooding through the gap"
- "roots breaking through pavement and reaching toward open air"
- "footprints leading away from a maze, out into open ground"

## Image credits

Credits render as a `<figcaption>` beneath the hero image. `image_meta.text` is output with `| safe`, so inline HTML works.

### AI-generated image

Scene description (written after seeing the result, not the prompt verbatim) + period + FLUX.2-dev link:

```yaml
image_meta:
  text: "Glowing points in a dark field -- vectors finding each other by meaning, not by name. Image made with <a href='https://huggingface.co/black-forest-labs/FLUX.2-dev'>FLUX.2-dev</a>."
  altext: 'Woodcut-style print of glowing amber and white orbs scattered across a dark background with rough white hatching marks'
```

### Ken's own photo

Description + "Own work.":

```yaml
image_meta:
  text: "At Bangkok's OneSiam Skywalk — multiple pathways converging in a complex urban transit hub. Own work."
  altext: "Escalators and elevated walkways at Bangkok's OneSiam Skywalk — multiple pathways converging in a complex urban transit hub"
```

### Screenshot or own creation

Same as own photo. Description + "Own work."

### Writing credits

Describe the image as rendered, not what the prompt asked for. `altext` describes what a viewer sees -- write both fields after looking at the actual image. The script marks `altext` as `[DRAFT]` to remind you.

The FLUX.2-dev attribution string is in `image-config.json` so both scripts stay consistent.

## Where this fits

Image generation happens during Stage 1 (Drafting) in the [publishing workflow](../../docs/PUBLISHING_WORKFLOW.md):

1. Write the post content and frontmatter
2. Run `yarn generate-image src/site/posts/my-post.njk`
3. Pick an image, paste the frontmatter snippet
4. Write real alt text (replace the `[DRAFT]` placeholder)
5. Move on to technical review

## Config

Both tools read from `image-config.json` in this directory. Style prefix, negative prompt, steps, dimensions, and attribution are all there.

## Reproducibility

The bash script prints the seed used for each generation. Pass `--seed N` to get the same image again. The Node script shows seeds too. Same seed + same prompt + same model = same image, but changing the style prefix in the config will produce different results even with the same seed.
