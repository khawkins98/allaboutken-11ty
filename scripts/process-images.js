#!/usr/bin/env node
// Replicate the old Gulp image processing using sharp
// - Copy originals: src/site/images/**/* -> build/images/original/**/*
// - Create cinematic crops (900x600, quality 60) for jpg/jpeg/png -> build/images/crop-cinema/**/*

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.resolve(__dirname, '..', 'src', 'site', 'images');
const OUT_DIR = path.resolve(__dirname, '..', 'build', 'images');
const OUT_ORIGINAL = path.join(OUT_DIR, 'original');
const OUT_CROP = path.join(OUT_DIR, 'crop-cinema');
const VERBOSE = process.argv.includes('--verbose') || process.env.VERBOSE === '1';

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function cleanDir(dir) {
  // Remove a directory and all contents if it exists
  try {
    await fsp.rm(dir, { recursive: true, force: true });
  } catch (_) {
    // ignore
  }
}

async function walk(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    else if (entry.isFile()) return [full];
    return [];
  }));
  return files.flat();
}

async function copyOriginals(files) {
  let copied = 0;
  for (const src of files) {
    const rel = path.relative(SRC_DIR, src);
    const dest = path.join(OUT_ORIGINAL, rel);
    await ensureDir(path.dirname(dest));
    await fsp.copyFile(src, dest);
    copied++;
    if (VERBOSE) console.log(`[images] copied original: ${rel}`);
  }
  return copied;
}

function isRasterForCrop(file) {
  const ext = path.extname(file).toLowerCase();
  return ['.jpg', '.jpeg', '.png'].includes(ext);
}

async function createCinematicCrops(files) {
  let cropped = 0;
  for (const src of files) {
    if (!isRasterForCrop(src)) continue;
    const rel = path.relative(SRC_DIR, src);
    const dest = path.join(OUT_CROP, rel);
    await ensureDir(path.dirname(dest));
    const ext = path.extname(src).toLowerCase();
    const pipeline = sharp(src).resize(900, 600, { fit: 'cover', position: 'centre' });
    if (ext === '.jpg' || ext === '.jpeg') {
      await pipeline.jpeg({ quality: 60 }).toFile(dest.replace(/\.(jpg|jpeg)$/i, '.jpg'));
    } else if (ext === '.png') {
      await pipeline.png({ quality: 60 }).toFile(dest);
    }
    cropped++;
    if (VERBOSE) console.log(`[images] cropped 900x600: ${rel}`);
  }
  return cropped;
}

(async function main() {
  try {
    const start = Date.now();
    console.log(`[images] start processing`);
    console.log(`[images] source:   ${SRC_DIR}`);
    console.log(`[images] output:   ${OUT_DIR}`);
    const files = await walk(SRC_DIR);
    console.log(`[images] scanned:  ${files.length} files`);
    // Clean outputs before regenerating
    await cleanDir(OUT_ORIGINAL);
    await cleanDir(OUT_CROP);
    await ensureDir(OUT_ORIGINAL);
    await ensureDir(OUT_CROP);
    const originals = await copyOriginals(files);
    const cropped = await createCinematicCrops(files);
    const ms = Date.now() - start;
    console.log(`[images] done: ${originals} originals, ${cropped} crops (${ms} ms)`);
  } catch (err) {
    console.error('Image processing failed:', err.message);
    process.exit(1);
  }
})();


