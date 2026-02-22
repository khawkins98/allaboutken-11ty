# Import and optimize a blog image

Import an image into the blog, optimize it, and set up frontmatter.

## Arguments

- `$ARGUMENTS` — expects: `<source-path> <target-post> [credit-url]`
  - `source-path`: absolute path to the source image (e.g. `~/Desktop/photo.jpg`)
  - `target-post`: the `.njk` post filename or path to add frontmatter to (e.g. `20260220-feedback-buttons-cgi-pattern`)
  - `credit-url` (optional): URL to credit the image source/tool

## Steps

1. **Inspect the source image.** Run `file` and `ls -lh` on the source path. Note format, dimensions, and file size.

2. **Choose a filename.** Use a short, descriptive kebab-case name based on the image content. Check `src/site/images/blog/` for naming conventions.

3. **Optimize the image.**
   - For JPEG: apply lossy compression with `sips -s formatOptions 50` (quality 50 works well for illustrations with flat colors; use 70 for photographs), then apply lossless optimization with `jpegtran -optimize -progressive -copy none`.
   - For PNG: try `pngquant --quality=50-70` if available, otherwise `sips`.
   - Target: noticeably smaller than source without visible artifacts. Verify by viewing the optimized file.
   - Log the size reduction (e.g. "288K → 134K").

4. **Copy to blog images.** Place the optimized file in `src/site/images/blog/`.

5. **Update post frontmatter.** Add or update these fields in the target post's YAML frontmatter:
   ```yaml
   image: /blog/<filename>
   image_meta:
     text: "<contextual caption>. Image made with <a href='<credit-url>'>ToolName</a>."
     altext: '<descriptive alt text for screen readers>'
   ```
   - `text`: Write a short caption that connects the image to the post's theme, followed by the credit. Follow the existing pattern: `"Caption sentence. Image made with <a href='https://example.com'>ToolName</a>."` If no credit URL provided, use `"Caption. Own work."` per site convention.
   - `altext`: Describe what a screen reader user needs to know — the scene, key objects, visual style. Don't say "image of" or "illustration of" at the start.

6. **Verify the build.** Run `yarn eleventy` and confirm it passes.

7. **Report.** Summarize: original size, optimized size, percentage reduction, filename, and the frontmatter added.
