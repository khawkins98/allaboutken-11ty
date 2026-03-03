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

### `yarn generate-image <file.njk>` -- post-aware workflow (interactive)

Reads a post's frontmatter, classifies the post type, and suggests prompts. Generates images in parallel (~30s for 3 vs ~90s one at a time), opens them in Preview, and waits for you to pick one. After you pick, it copies a ready-to-paste frontmatter snippet to your clipboard and offers to delete the unchosen images.

This script requires interactive terminal input (it prompts you to pick an image and confirm deletion). It cannot be run non-interactively by a script or AI assistant -- use the bash script below for that.

```bash
yarn generate-image src/site/posts/20260302-semantic-search-browser-embeddings.njk
yarn generate-image --prompt "custom prompt" src/site/posts/my-post.njk
yarn generate-image --count 5 src/site/posts/my-post.njk
```

Options:
- `--count N` -- number of options to generate (default: 3)
- `--prompt "..."` -- skip auto-generation, use this prompt directly

### `./scripts/image-generate/generate-image.sh` -- quick one-offs (non-interactive)

For when you already know the prompt and just want an image. Runs without interaction (as long as `TOGETHER_API_KEY` is set in `.env`), so it works from scripts and AI assistants too.

Outputs the file path and a one-line `image:` hint. You will need to add `image_meta.text` and `image_meta.altext` to your frontmatter yourself -- see [Image credits](#image-credits) below for the format and attribution string.

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
3. Pick an image -- the script copies a frontmatter snippet to your clipboard and offers to delete unchosen images (defaults to yes, press `n` to keep them)
4. Post-process if needed (crop, adjust saturation -- see below)
5. Rename the file from `generated-*.jpg` to something descriptive
6. Update the `image:` line in your frontmatter to match the new filename -- the clipboard snippet still has the old timestamp name
7. Write real `altext` and `image_meta.text` (replace the `[DRAFT]` placeholders after looking at the actual image)
8. Move on to technical review

## Post-processing

The generated image opens in Preview. Before committing it, you'll usually want to touch it up:

- **Crop** -- the default 1280x832 frame often has dead space. Crop in on the strongest part of the composition. A tighter crop almost always looks better as a hero image.
- **Saturation and contrast** -- the blockprint style occasionally renders too flat or too hot. Nudge saturation or levels if needed.
- **Any editor works** -- Preview's Adjust Color tool is fine for quick fixes. Photoshop, Pixelmator, whatever you have.

Don't worry about manual optimization (resizing, format conversion, compression). Eleventy's image plugin handles all of that at build time -- it generates responsive AVIF/WebP/JPEG variants at 320/600/900/1280px widths automatically.

### Rename the file

The scripts save images as `generated-<timestamp>.jpg`. Rename to something descriptive before committing:

```bash
mv src/site/images/blog/generated-1709312400-2.jpg src/site/images/blog/pagefind-paths-through-grass.jpg
```

The clipboard snippet the script copied still references the old timestamp filename. After renaming, update the `image:` value in your frontmatter to match the new name. A mismatch here produces broken images that only show up in production (the build adds `/images/` to the path automatically, so you won't catch it in the source).

## Cost

Each image costs roughly $0.01 via Together AI (FLUX.2-dev). Three images per post is about $0.03. Check usage at <https://api.together.ai/settings/billing>.

## Config

Both tools read from `image-config.json` in this directory. Style prefix, negative prompt, steps, dimensions, and attribution are all there.

## Reproducibility

The bash script prints the seed used for each generation. Pass `--seed N` to get the same image again. The Node script shows seeds too. Same seed + same prompt + same model = same image, but changing the style prefix in the config will produce different results even with the same seed.
