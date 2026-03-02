#!/usr/bin/env node
/**
 * Generate blog post hero images via Together AI (FLUX.2-dev).
 *
 * Reads a .njk post file, extracts frontmatter context, suggests prompts
 * based on post type, generates multiple options in parallel, and provides
 * an interactive picker. Outputs a frontmatter snippet ready to paste.
 *
 * Usage:
 *   yarn generate-image src/site/posts/my-post.njk
 *   yarn generate-image --style blockprint src/site/posts/my-post.njk
 *   yarn generate-image --prompt "custom prompt" src/site/posts/my-post.njk
 *   yarn generate-image --count 5 src/site/posts/my-post.njk
 *
 * Setup:
 *   echo "TOGETHER_API_KEY=your-key-here" > .env
 *   Get a key at https://api.together.ai/settings/api-keys
 *
 * Zero npm dependencies — uses native fetch, readline/promises, fs/promises.
 */

import { readFile, unlink, access } from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline/promises';
import { stdin, stdout, argv, env, exit } from 'process';
import { join, basename } from 'path';
import { execSync } from 'child_process';

// --- Load .env ---
try {
  const envPath = join(import.meta.dirname, '..', '..', '.env');
  const envContent = await readFile(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!env[key]) env[key] = val;
  }
} catch {
  // .env is optional
}

// --- Load shared config ---
const CONFIG_PATH = join(import.meta.dirname, 'image-config.json');
const config = JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));

// --- ANSI helpers ---
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

// --- Prompt templates ---
// Each category has templates that take {title}, {topics}, {teaser} placeholders.
const PROMPT_TEMPLATES = {
  technical: [
    'a single bird soaring over an open landscape with nothing tethering it to the ground',
    'scattered stones finding their own arrangement on a still pond surface',
    'light passing freely through an open window into a quiet room',
    'a kite flying high with its string cut, drifting freely against clouds',
    'an open door at the end of a long corridor, bright light beyond',
    'seeds carried on wind across an open field, no fences in sight',
    'a lone sailboat on open water, no harbor or dock visible, just horizon',
    'constellations forming their own patterns across a wide dark sky',
    'paths worn into grass by footsteps, no paved road, just natural routes',
    'a river finding its way through a valley without any dams or walls',
  ],
  impact: [
    'a cracked wall with light flooding through the gap',
    'roots breaking through pavement and reaching toward open air',
    'a ladder leaning against nothing, reaching into clear sky',
    'ice breaking apart on a river as spring current pushes through',
    'a door swinging open onto a wide empty field at dawn',
    'a single flame holding steady in still air, no glass around it',
    'footprints leading away from a maze, out into open ground',
    'a bridge with no toll gate, just open passage across a gorge',
  ],
  opinion: [
    'two rivers merging without any canal or lock, just flowing together',
    'an hourglass tipped on its side, sand scattered freely',
    'a compass with no markings, needle pointing wherever it wants',
    'a blank canvas on an easel outdoors, wind moving across it',
    'an unlocked gate standing open in the middle of a wide field',
    'a weathered signpost at a crossroads with the signs removed',
    'waves meeting a shore with no seawall, just open beach',
    'a paper airplane catching a thermal, rising above rooftops',
  ],
};

// --- Parse CLI args ---
function parseArgs() {
  const args = argv.slice(2);
  const opts = { style: 'blockprint', count: 3, prompt: null, file: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--count':
        opts.count = parseInt(args[++i], 10);
        break;
      case '--prompt':
        opts.prompt = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        exit(0);
        break;
      default:
        if (args[i].startsWith('-')) {
          console.error(red(`Unknown option: ${args[i]}`));
          exit(1);
        }
        opts.file = args[i];
    }
  }

  if (!opts.file) {
    console.error(red('Error: No post file specified.'));
    console.error('');
    console.error(`Usage: yarn generate-image ${dim('<file.njk>')}`);
    console.error(`       yarn generate-image ${dim('--help')} for full usage`);
    exit(1);
  }

  return opts;
}

function printHelp() {
  console.log(`
${bold('generate-image')} — Generate hero images for blog posts via Together AI

${bold('USAGE')}
  yarn generate-image ${dim('[options]')} ${cyan('<file.njk>')}

${bold('OPTIONS')}
  --count ${dim('N')}       Number of options to generate (default: 3)
  --prompt ${dim('"..."')}  Skip auto-generation, use this prompt directly
  --help, -h     Show this help

${bold('EXAMPLES')}
  yarn generate-image src/site/posts/20260302-semantic-search.njk
  yarn generate-image --prompt "magnifying glass over dots" src/site/posts/my-post.njk
  yarn generate-image --count 5 src/site/posts/my-post.njk

${bold('SETUP')}
  echo "TOGETHER_API_KEY=your-key" > .env
  Get a key at https://api.together.ai/settings/api-keys
`);
}

// --- Frontmatter parser ---
// Minimal line-by-line YAML parser for Eleventy frontmatter.
// Handles strings, arrays (- item), and one level of nested objects.
function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') return {};

  const endIdx = lines.indexOf('---', 1);
  if (endIdx === -1) return {};

  const yamlLines = lines.slice(1, endIdx);
  const result = {};
  let currentKey = null;
  let currentArray = null;
  let nestedKey = null;
  let nestedObj = null;

  for (const line of yamlLines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;

    // Nested object property (2+ spaces indent, key: value)
    if (indent >= 2 && nestedKey) {
      const nestedMatch = line.trim().match(/^(\w+)\s*:\s*(.*)$/);
      if (nestedMatch) {
        let val = nestedMatch[2].trim();
        // Strip quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        nestedObj[nestedMatch[1]] = val;
        continue;
      }
    }

    // Array item (  - value)
    if (indent >= 2 && currentArray !== null) {
      const itemMatch = line.trim().match(/^-\s+(.+)$/);
      if (itemMatch) {
        let val = itemMatch[1].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        currentArray.push(val);
        continue;
      }
    }

    // Top-level key: value
    const topMatch = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (topMatch) {
      // Finish any pending nested object
      if (nestedKey) {
        result[nestedKey] = nestedObj;
        nestedKey = null;
        nestedObj = null;
      }
      // Finish any pending array
      if (currentKey && currentArray !== null) {
        result[currentKey] = currentArray;
        currentArray = null;
      }

      const key = topMatch[1];
      let val = topMatch[2].trim();

      if (!val) {
        // Could be start of nested object or array — peek ahead
        currentKey = key;
        currentArray = null;
        nestedKey = null;
        nestedObj = null;

        // Look at next non-empty line to determine type
        const nextLine = yamlLines[yamlLines.indexOf(line) + 1];
        if (nextLine && nextLine.trim().startsWith('-')) {
          currentArray = [];
          result[key] = currentArray;
        } else if (nextLine && nextLine.match(/^\s{2,}\w+\s*:/)) {
          nestedKey = key;
          nestedObj = {};
        }
        continue;
      }

      // Strip quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
      currentKey = key;
      currentArray = null;
      nestedKey = null;
      nestedObj = null;
    }
  }

  // Finish any pending structures
  if (nestedKey) result[nestedKey] = nestedObj;
  if (currentKey && currentArray !== null && !result[currentKey]) {
    result[currentKey] = currentArray;
  }

  return result;
}

// --- Post type classification ---
function classifyPost(frontmatter) {
  const topics = (frontmatter.topics || []).map((t) => t.toLowerCase());
  const tags = (frontmatter.tags || []).map((t) => t.toLowerCase());
  const title = (frontmatter.title || '').toLowerCase();
  const all = [...topics, ...tags, title];

  const impactKeywords = ['impact', 'transformation', 'governance', 'delivery', 'strategy', 'leadership', 'change'];
  const opinionKeywords = ['opinion', 'analysis', 'reflection', 'perspective', 'debate', 'argument', 'critique'];

  if (impactKeywords.some((k) => all.some((a) => a.includes(k)))) return 'impact';
  if (opinionKeywords.some((k) => all.some((a) => a.includes(k)))) return 'opinion';
  return 'technical';
}

// --- Prompt generation ---
function generatePrompts(frontmatter, postType, count) {
  const templates = PROMPT_TEMPLATES[postType];
  const topics = (frontmatter.topics || []).join(', ') || 'the subject';
  const title = frontmatter.title || '';
  const teaser = frontmatter.teaser || '';

  // Shuffle and pick `count` templates
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, templates.length));

  return selected.map((template) =>
    template.replace(/\{topics\}/g, topics).replace(/\{title\}/g, title).replace(/\{teaser\}/g, teaser)
  );
}

// --- Together AI image generation ---
async function generateImage(prompt, style, seed) {
  const styleConfig = config.styles[style];
  const fullPrompt = `${styleConfig.prefix} ${prompt}`;

  const payload = {
    model: config.model,
    prompt: fullPrompt,
    width: config.defaults.width,
    height: config.defaults.height,
    steps: styleConfig.steps,
    response_format: 'url',
    output_format: 'jpeg',
  };

  if (seed !== undefined) payload.seed = seed;
  if (styleConfig.negativePrompt) payload.negative_prompt = styleConfig.negativePrompt;

  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }

  if (!data.data || !data.data[0]?.url) {
    throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
  }

  return {
    url: data.data[0].url,
    seed: data.data[0].seed ?? data.seed ?? null,
  };
}

async function downloadImage(url, outPath) {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const { writeFile } = await import('fs/promises');
  await writeFile(outPath, buffer);
}

// --- Progress tracker for parallel generation ---
function progressTracker(total) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIdx = 0;
  let done = 0;
  let failed = 0;
  const results = [];

  const interval = setInterval(() => {
    const f = frames[frameIdx++ % frames.length];
    const pending = total - done - failed;
    stdout.write(`\r  ${f} ${pending} generating, ${done} done${failed ? `, ${failed} failed` : ''}...\x1b[K`);
  }, 80);

  return {
    complete(label) {
      done++;
      results.push({ ok: true, label });
    },
    fail(label) {
      failed++;
      results.push({ ok: false, label });
    },
    finish() {
      clearInterval(interval);
      stdout.write('\r\x1b[K');
      for (const r of results) {
        if (r.ok) {
          console.log(`  ${green('✓')} ${r.label}`);
        } else {
          console.log(`  ${red('✗')} ${r.label}`);
        }
      }
    },
  };
}

// --- Main ---
async function main() {
  const opts = parseArgs();

  // Check API key
  if (!env.TOGETHER_API_KEY) {
    console.error(red('No TOGETHER_API_KEY found.'));
    console.error('');
    console.error(`To save permanently:  echo "TOGETHER_API_KEY=your-key" > .env`);
    console.error(`To get a new key:     https://api.together.ai/settings/api-keys`);
    console.error('');

    const rl = createInterface({ input: stdin, output: stdout });
    const key = await rl.question('Or paste a key now (one-time): ');
    rl.close();

    if (!key.trim()) {
      console.error(red('Error: No key provided.'));
      exit(1);
    }
    env.TOGETHER_API_KEY = key.trim();
  }

  // Read the post
  let content;
  try {
    content = await readFile(opts.file, 'utf-8');
  } catch {
    console.error(red(`Cannot read: ${opts.file}`));
    exit(1);
  }

  const frontmatter = parseFrontmatter(content);
  const postType = classifyPost(frontmatter);

  console.log('');
  console.log(bold(`Reading: "${frontmatter.title || basename(opts.file)}"`));
  if (frontmatter.topics) {
    console.log(`Topics:  ${cyan(frontmatter.topics.join(', '))}`);
  }
  console.log(`Type:    ${postType}`);
  console.log('');

  // Generate or use provided prompts
  let prompts;
  if (opts.prompt) {
    prompts = [opts.prompt];
    opts.count = 1;
    console.log(`Using custom prompt: ${dim(opts.prompt)}`);
  } else {
    prompts = generatePrompts(frontmatter, postType, opts.count);
    console.log(bold(`Generating ${prompts.length} options...`));
    console.log('');
    prompts.forEach((p, i) => {
      console.log(`  ${bold(String(i + 1))}. "${dim(p)}"`);
    });
  }
  console.log('');

  // Generate images in parallel
  const results = [];
  const progress = progressTracker(prompts.length);
  const genPromises = prompts.map(async (prompt, i) => {
    try {
      const result = await generateImage(prompt, opts.style);
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const outFile = `src/site/images/blog/generated-${timestamp}-${i + 1}.jpg`;
      await downloadImage(result.url, outFile);
      const seedInfo = result.seed ? ` ${dim(`(seed: ${result.seed})`)}` : '';
      progress.complete(`[${i + 1}] done${seedInfo}`);
      results[i] = { prompt, file: outFile, seed: result.seed };
    } catch (err) {
      progress.fail(`[${i + 1}] failed: ${err.message}`);
      results[i] = null;
    }
  });

  await Promise.all(genPromises);
  progress.finish();
  console.log('');

  const validResults = results.filter(Boolean);
  if (validResults.length === 0) {
    console.error(red('All generations failed.'));
    exit(1);
  }

  // Open in Preview (macOS)
  try {
    const files = validResults.map((r) => `"${r.file}"`).join(' ');
    execSync(`open ${files}`, { stdio: 'ignore' });
    console.log(dim('Opening in Preview...'));
    console.log('');
  } catch {
    // Not macOS or open not available
  }

  // Interactive picker
  const rl = createInterface({ input: stdin, output: stdout });

  let chosen = null;
  while (!chosen) {
    const validIndices = results.map((r, i) => (r ? i + 1 : null)).filter(Boolean);
    const answer = await rl.question(
      `Pick an image [${validIndices.join('/')}], ${dim('[r]egenerate')}, ${dim('[s]kip')}: `
    );

    if (answer.toLowerCase() === 's') {
      console.log(dim('Skipped.'));
      rl.close();
      exit(0);
    }

    if (answer.toLowerCase() === 'r') {
      console.log(yellow('Regeneration not yet implemented — rerun the script.'));
      continue;
    }

    const pick = parseInt(answer, 10);
    if (pick >= 1 && pick <= results.length && results[pick - 1]) {
      chosen = results[pick - 1];
    } else {
      console.log(red(`Invalid choice. Pick ${validIndices.join(', ')}, r, or s.`));
    }
  }

  // Output frontmatter snippet
  const fileBasename = basename(chosen.file);
  const imagePath = `/blog/${fileBasename}`;

  console.log('');
  console.log(bold('Frontmatter:'));
  console.log(cyan(`  image: ${imagePath}`));
  console.log(cyan(`  image_meta:`));
  console.log(cyan(`    text: "${capitalize(chosen.prompt)}. ${config.attribution}"`));
  console.log(cyan(`    altext: "[DRAFT — describe the actual image after reviewing]"`));
  console.log('');
  console.log(dim('  Rewrite text after reviewing — describe the scene, not the prompt.'));
  console.log('');

  // Copy to clipboard (macOS)
  try {
    const snippet = [
      `image: ${imagePath}`,
      `image_meta:`,
      `  text: "${capitalize(chosen.prompt)}. ${config.attribution}"`,
      `  altext: "[DRAFT — describe the actual image after reviewing]"`,
    ].join('\n');
    execSync('pbcopy', { input: snippet, stdio: ['pipe', 'ignore', 'ignore'] });
    console.log(dim('Copied to clipboard.'));
  } catch {
    // pbcopy not available
  }

  // Cleanup unchosen images
  const unchosen = validResults.filter((r) => r !== chosen);
  if (unchosen.length > 0) {
    console.log('');
    const cleanup = await rl.question(`Delete ${unchosen.length} unchosen image(s)? [Y/n]: `);
    if (!cleanup || cleanup.toLowerCase() === 'y') {
      for (const r of unchosen) {
        try {
          await unlink(r.file);
          console.log(dim(`  Deleted ${r.file}`));
        } catch {
          // ignore
        }
      }
    }
  }

  rl.close();
  console.log('');
  console.log(green('Done.'));
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

main().catch((err) => {
  console.error(red(`Error: ${err.message}`));
  exit(1);
});
