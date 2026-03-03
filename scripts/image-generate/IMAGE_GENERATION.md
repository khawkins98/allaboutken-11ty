# Image generation

Generate hero images for blog posts using Together AI's FLUX.2-dev model via the browser-based image generator at `/image-generator/`.

Style is Japanese blockprint -- high-contrast black ink woodcut on cream with sparse warm amber accent.

## Setup

1. Get an API key at <https://api.together.ai/settings/api-keys>
2. Open `/image-generator/` in your browser and paste the key (check "Remember in this browser" to save it in localStorage)

## Workflow

1. Write your subject prompt -- go abstract and evocative, not literal. One subject per image.
2. Adjust guidance and steps if needed (defaults: guidance 3.5, steps 20)
3. Click Generate -- three images run in parallel (~20--30s)
4. Click an image to select it, then drag the corner handles to crop
5. Enter a descriptive filename (no `.jpg`), click Save -- the browser prompts you to save to `src/site/images/blog/`
6. Copy the frontmatter snippet and paste it into your post
7. Write real `altext` and `image_meta.text` after reviewing the actual image (the snippet marks both as `[DRAFT]`)

The URL updates as you change options, so setups are bookmarkable.

## Advanced options

Click "Advanced options" to edit:

- **Style prefix** -- prepended to every prompt. The default blockprint prefix is the whole trick; edit with care.
- **Negative prompt** -- tells the model what to avoid.
- **Steps** -- ~20 is the sweet spot: good quality, fast generation. Going higher gives diminishing returns and takes noticeably longer. Below 15 quality drops off.
- **Width / Height** -- default 1280×832. Changing dimensions also changes the crop aspect ratio.

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

Describe the image as rendered, not what the prompt asked for. `altext` describes what a viewer sees -- write both fields after looking at the actual image. The generator marks `altext` as `[DRAFT]` to remind you.

The FLUX.2-dev attribution string is in `image-config.json`.

## Post-processing

The Save dialog drops a JPEG into `src/site/images/blog/`. Before committing, you may want to:

- **Crop** -- use the in-browser crop tool before saving; a tighter crop almost always looks better as a hero image.
- **Saturation and contrast** -- if the result is too flat or too hot, nudge levels in Preview or any editor.

Don't worry about resizing, format conversion, or compression. Eleventy's image plugin handles all of that at build time.

## Cost

Each image costs roughly $0.01 via Together AI (FLUX.2-dev). Three images per post is about $0.03. Check usage at <https://api.together.ai/settings/billing>.

## Config

`image-config.json` in this directory holds the canonical style prefix, negative prompt, steps, and dimensions. The browser tool has these baked in as defaults -- if you change the config file, also update `CONFIG` in `src/site/image-generator.njk`.

## Reproducibility

The generator shows seeds in the image metadata strip below each result. Note a seed and re-enter it as a fixed URL param (`?seed=...`) to regenerate the same image. Same seed + same prompt + same model = same image, but editing the style prefix will produce different results even with the same seed.
