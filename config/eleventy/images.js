const Path = require('path');
const { eleventyImageTransformPlugin } = require('@11ty/eleventy-img');

function registerImagePlugin(config, isDev) {
  // Transform <img>/<picture> in HTML to responsive images at build time
  config.addPlugin(eleventyImageTransformPlugin, {
    outputDir: "./build/img/",
    urlPath: "/img/",
    widths: [320, 600, 900, 1280],
    // "auto" keeps the source format as the <img> fallback: JPEG stays JPEG,
    // PNG stays PNG and an animated GIF stays a GIF. A fixed ["jpeg", "gif"]
    // tail made the fallback for every PNG a 256-colour GIF.
    formats: ["avif", "webp", "auto"],
    transformOnRequest: isDev,
    // Do not fail the entire build on a single image error (e.g., 404 remote)
    failOnError: false,
    // Preserve animation for GIF/WEBP when resizing/encoding
    sharpOptions: {
      animated: true
    },
    sharpWebpOptions: {
      animated: true
    },
    sharpGifOptions: {
      reoptimise: true
    },
    // Deterministic file names: <dir-token>-<base-name>-<width>.<format>
    filenameFormat: function filenameFormat(id, src, width, format) {
      try {
        let baseName = '';
        let dirToken = '';
        if (typeof src === 'string') {
          if (src.startsWith('http://') || src.startsWith('https://')) {
            const u = new URL(src);
            baseName = Path.basename(u.pathname) || u.hostname;
            const parts = (u.pathname || '').split('/').filter(Boolean);
            dirToken = parts.length > 1 ? parts[parts.length - 2] : '';
          } else {
            baseName = Path.basename(src);
            const parentDir = Path.basename(Path.dirname(src));
            dirToken = parentDir;
          }
        }
        baseName = String(baseName || 'image').replace(/\.[a-z0-9]+$/i, '');
        const safe = baseName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const dirSafe = String(dirToken || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const name = dirSafe ? `${dirSafe}-${safe}` : safe;
        return `${name}-${width}.${format}`;
      } catch (e) {
        return `${id}-${width}.${format}`;
      }
    },
    // The key is `imgAttributes`. It was `img` until 2026-09, which
    // eleventy-img never reads: every <img> without its own width or
    // loading attribute then failed on "Missing sizes", and failOnError:false
    // left it untransformed with no /.11ty/image/ URL for lint:links to see.
    // Heroes above the fold override `loading` with "eager".
    htmlOptions: {
      imgAttributes: {
        decoding: "async",
        loading: "lazy",
        sizes: "100vw"
      }
    }
  });
}

function registerImageTransform(config) {
  // Fix any image src paths that were rewritten to input filesystem paths.
  // Ensures URLs point to passthrough-copied /images/ in output.
  config.addTransform("fixImageSrcToAbsolute", (content, outputPath) => {
    try {
      if (typeof content !== 'string') return content;
      if (!outputPath || !outputPath.endsWith('.html')) return content;
      return content.replace(/src="(?:\.\.\/)*src\/site\/images\//g, 'src="/images/');
    } catch (e) {
      return content;
    }
  });
}

module.exports = { registerImagePlugin, registerImageTransform };
