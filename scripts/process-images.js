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

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
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
  for (const src of files) {
    const rel = path.relative(SRC_DIR, src);
    const dest = path.join(OUT_ORIGINAL, rel);
    await ensureDir(path.dirname(dest));
    await fsp.copyFile(src, dest);
  }
}

function isRasterForCrop(file) {
  const ext = path.extname(file).toLowerCase();
  return ['.jpg', '.jpeg', '.png'].includes(ext);
}

async function createCinematicCrops(files) {
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
  }
}

(async function main() {
  try {
    const files = await walk(SRC_DIR);
    await ensureDir(OUT_ORIGINAL);
    await ensureDir(OUT_CROP);
    await copyOriginals(files);
    await createCinematicCrops(files);
    console.log('Image processing complete.');
  } catch (err) {
    console.error('Image processing failed:', err.message);
    process.exit(1);
  }
})();


