#!/usr/bin/env bun
// update-image-urls.mjs
// Reads img_links.txt and generates src/data/image-urls.json with a mapping
// from local filename to postimg.cc URL, including icon mappings (type/spin).
//
// Usage: bun scripts/update-image-urls.mjs
//   or:  bun run update:images

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const LINKS_FILE = join(ROOT, 'img_links.txt');
const OUTPUT_FILE = join(ROOT, 'src/data/image-urls.json');

// Parse the links file: each line is a full postimg.cc URL
function parseLinks(filePath) {
  if (!existsSync(filePath)) {
    console.error(`❌ Links file not found: ${filePath}`);
    console.error(`   Create it with one URL per line, e.g.:`);
    console.error(`   https://i.postimg.cc/XXXXX/Blade-Aero-Pegasus.webp`);
    process.exit(1);
  }

  const content = readFileSync(filePath, 'utf8').trim();
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line.startsWith('http'));
}

// Build the URL map: normalized local filename → postimg.cc URL
// Also categorize icons (type/spin) and line logos for easy lookup
function buildMap(urls) {
  const map = {};
  const typeIcons = {};
  const spinIcons = {};
  const lineLogos = {};

  const TYPE_TYPES = ['attack', 'defense', 'balance', 'stamina'];
  const SPIN_TYPES = ['left', 'right'];

  for (const url of urls) {
    const filename = url.split('/').pop();
    const name = filename.replace(/\.(webp|png|jpeg|jpg)$/i, '');

    // Store the full mapping (actual filename + normalized version for lookup)
    map[filename] = url;
    // Also store a normalized key (no hyphens/underscores/spaces, lowercase)
    // so "BladeScorpioSpear.webp" can match "Blade-Scorpio-Spear.webp"
    const normalized = name.replace(/[-_\s]/g, '').toLowerCase();
    map[normalized] = url;

    // Categorize type icons (e.g. "attack.png")
    const baseLower = name.toLowerCase();
    if (TYPE_TYPES.includes(baseLower)) {
      typeIcons[baseLower] = url;
    }
    // Categorize spin icons (e.g. "left-spin.png")
    for (const spin of SPIN_TYPES) {
      if (baseLower === `${spin}-spin`) {
        spinIcons[spin] = url;
      }
    }
    // Categorize line logos (e.g. "Basic Line Logo.png")
    if (baseLower.endsWith(' line logo')) {
      const line = baseLower.replace(' line logo', '').toUpperCase();
      // Map to the line key used in constants.js
      if (['BX', 'UX', 'CX'].includes(line)) {
        lineLogos[line] = filename; // store the original filename
      }
    }
  }

  return { map, typeIcons, spinIcons, lineLogos };
}

function main() {
  console.log('📸 Updating image URLs from img_links.txt...\n');

  const urls = parseLinks(LINKS_FILE);
  console.log(`   Found ${urls.length} URL(s) in img_links.txt`);

  const { map, typeIcons, spinIcons, lineLogos } = buildMap(urls);

  // Generate the output file
  const output = {
    // Raw URL map: local filename → postimg.cc URL
    urls: map,
    // Categorized icon maps for easy lookup
    icons: {
      type: typeIcons,
      spin: spinIcons,
    },
    // Line logo filenames (used by getLineLogo in constants.js)
    lineLogos,
    // Metadata
    _meta: {
      source: 'img_links.txt',
      generated: new Date().toISOString(),
      count: urls.length,
    },
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');

  console.log(`\n✅ Wrote ${urls.length} URL(s) to ${OUTPUT_FILE.replace(ROOT + '/', '')}`);
  console.log(`   Type icons: ${Object.keys(typeIcons).join(', ')}`);
  console.log(`   Spin icons: ${Object.keys(spinIcons).join(', ')}`);
  console.log(`   Line logos: ${Object.keys(lineLogos).join(', ')}`);
  console.log(`\n💡 To add new images:`);
  console.log(`   1. Add the postimg.cc URL to img_links.txt`);
  console.log(`   2. Run: bun run update:images`);
}

main();
