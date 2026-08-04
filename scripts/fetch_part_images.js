#!/usr/bin/env node
/**
 * Download Beyblade X part images from beyblade.fandom.com.
 * Skips images that already exist unless --force is given.
 * Updates src/data/parts-overrides.json with new filenames.
 *
 * Usage:
 *   node scripts/fetch_part_images.js           # download missing only
 *   node scripts/fetch_part_images.js --force   # re-download all, delete old
 *   node scripts/fetch_part_images.js --dry-run # preview changes
 */

import { createWriteStream, existsSync, readdirSync, readFileSync, renameSync, rmSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { pipeline } from "stream/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IMG_DIR = path.join(ROOT, "public", "images");
const OVERRIDES_PATH = path.join(ROOT, "src", "data", "parts-overrides.json");

const PRESERVE = new Set([
  "attack.png", "balance.png", "defense.png", "stamina.png",
  "gcash-qr.jpg", "left-spin.png", "right-spin.png",
  "BladeUnknown.svg", "RatchetBitOperate.webp",
]);

const HEADERS = { "User-Agent": "Mozilla/5.0" };
const API = "https://beyblade.fandom.com/api.php";

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// eslint-disable-next-line no-unused-vars
async function apiGet(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}?${qs}`, { headers: HEADERS });
  return res.json();
}

function isWebP(filePath) {
  try {
    const buf = readFileSync(filePath);
    return buf.length >= 12 && buf.toString('ascii', 8, 12) === 'WEBP';
  } catch {
    return false;
  }
}

async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await pipeline(res.body, createWriteStream(destPath));
    // Wiki sometimes serves WebP with wrong extension; fix it
    if ((destPath.endsWith('.png') || destPath.endsWith('.jpeg') || destPath.endsWith('.jpg')) && isWebP(destPath)) {
      const webpPath = destPath.replace(/\.(png|jpeg|jpg)$/, '.webp');
      renameSync(destPath, webpPath);
      return webpPath;
    }
    return destPath;
  } catch (e) {
    console.log(`    ERROR downloading ${url}: ${e.message}`);
    return false;
  }
}

function cleanImageUrl(thumbUrl) {
  return (
    thumbUrl.split("/scale-to-width-down")[0].split("/revision/latest")[0] +
    "/revision/latest"
  );
}

function wikiTitlesForOverrides(overrides) {
  const tasks = [];

  const bladeSpecial = {
    "LIGHTNING L-DRAGO": "Blade_-_Lightning_L-Drago_(Upper_Type)",
    "L-DRAGO": "Blade_-_Lightning_L-Drago_(Upper_Type)",
    "CROCOCRUNCH": "Blade_-_Bite_Croc",
    "BEARSCRATCH": "BearScratch_5-60F",
    "MAMMOTHTUSK": "Blade_-_Tusk_Mammoth",
    "YELL KONG": "Blade_-_Yell_Kong",
    "PHOENIXFLARE": "Main_Blade_-_Flare",
    "PTERASWING": "Blade_-_Talon_Ptera",
    "SHINOBIKNIFE": "Blade_-_Knife_Shinobi",
    "SHARKGILL": "Blade_-_Gill_Shark",
    "GOATTACKLE": "Blade_-_Tackle_Goat",
    "SAMURAISTEEL": "Steel_Samurai_4-80T",
    "WYVERNHOVER": "Blade_-_Hover_Wyvern",
    "ROCKLEONE": "Blade_-_Rock_Leone",
    "TYRANNOROAR": "Blade_-_Roar_Tyranno",
    "STORMSPRIGGAN": "Blade_-_StormSpriggan",
    "GLORYVALKYRIE": "Ratchet-Integrated_Blade_-_GloryValkyrie",
    "BULLETGRIFFON": "Ratchet-Integrated_Blade_-_BulletGriffon",
  };

  const mainBladeSpecial = {
    "RIGGLE": "Main_Blade_-_Wriggle",
    "ANTLERS": "BucksAntlers_B2-60D",
  };

  for (const [key, entry] of Object.entries(overrides.blades ?? {})) {
    const img = entry.image ?? "";
    if (!img) continue;
    const wikiTitle =
      bladeSpecial[key] ??
      "Blade_-_" + (entry.name ?? key).replace(/\s+/g, "");
    tasks.push(["blades", key, wikiTitle]);
  }

  for (const [key, entry] of Object.entries(overrides.mainBlades ?? {})) {
    const img = entry.image ?? "";
    if (!img) continue;
    const name = entry.name ?? key.replace(/\b\w/g, (c) => c.toUpperCase());
    const wikiTitle = mainBladeSpecial[key] ?? `Main_Blade_-_${name}`;
    tasks.push(["mainBlades", key, wikiTitle]);
  }

  for (const [key, entry] of Object.entries(overrides.metalBlades ?? {})) {
    const img = entry.image ?? "";
    if (!img) continue;
    const name = entry.name ?? key.replace(/\b\w/g, (c) => c.toUpperCase());
    tasks.push(["metalBlades", key, `Metal_Blade_-_${name}`]);
  }

  const assistBladeSpecial = {
    "G": "Assist_Blade_-_Gravity",
  };

  for (const [key, entry] of Object.entries(overrides.assistBlades ?? {})) {
    const img = entry.image ?? "";
    if (!img) continue;
    const name = entry.name ?? key;
    const wikiTitle = assistBladeSpecial[key] ?? `Assist_Blade_-_${name}`;
    tasks.push(["assistBlades", key, wikiTitle]);
  }

  const lockChipSpecial = {
    "BUCKS": "Lock_Chip_-_Stag",
  };

  for (const [key, entry] of Object.entries(overrides.lockChips ?? {})) {
    const img = entry.image ?? "";
    if (!img) continue;
    const name = entry.name ?? key.replace(/\b\w/g, (c) => c.toUpperCase());
    const wikiTitle = lockChipSpecial[key] ?? `Lock_Chip_-_${name}`;
    tasks.push(["lockChips", key, wikiTitle]);
  }

  const bitSpecial = {};

  for (const [key, entry] of Object.entries(overrides.bits ?? {})) {
    const img = entry.image ?? "";
    if (!img) continue;
    const name = (entry.name ?? key).replace(/\s+/g, "_");
    const wikiTitle = bitSpecial[key] ?? `Bit_-_${name}`;
    tasks.push(["bits", key, wikiTitle]);
  }

  return tasks;
}

async function batchQueryImages(titles) {
  const results = {};
  const batchSize = 50;
  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize);
    const joined = batch
      .map((t) => encodeURIComponent(t).replace(/%20/g, "_"))
      .join("%7C");
    const url = `${API}?action=query&titles=${joined}&prop=pageimages&pithumbsize=500&format=json`;
    const res = await fetch(url, { headers: HEADERS });
    const data = await res.json();

    for (const [, page] of Object.entries(data.query.pages)) {
      const titleKey = page.title.replace(/ /g, "_");
      const pageimage = page.pageimage ?? null;
      const thumbUrl = page.thumbnail?.source ?? "";
      if (pageimage && thumbUrl) {
        results[titleKey] = { pageimage, url: cleanImageUrl(thumbUrl) };
      } else {
        results[titleKey] = { pageimage: null, url: null };
      }
    }
    await sleep(200);
  }
  return results;
}

async function main() {
  const overrides = JSON.parse(await readFile(OVERRIDES_PATH, "utf-8"));

  const tasks = wikiTitlesForOverrides(overrides);
  console.log(`Found ${tasks.length} parts with images to update`);

  const allTitles = tasks.map(([, , t]) => t);
  console.log(`Querying wiki API for ${allTitles.length} page titles...`);
  const imageData = await batchQueryImages(allTitles);

  const missing = tasks.filter(
    ([, , title]) => !imageData[title]?.pageimage
  );
  if (missing.length) {
    console.log(`\n${missing.length} parts had no wiki image:`);
    for (const [cat, key, title] of missing) {
      console.log(`  [${cat}] ${key} -> ${title}`);
    }
  }

  let plan = [];
  for (const [cat, key, wikiTitle] of tasks) {
    const info = imageData[wikiTitle] ?? {};
    if (!info.pageimage) continue;
    plan.push([cat, key, wikiTitle, info.url, info.pageimage]);
  }

  console.log(`\nWill download ${plan.length} images`);

  if (!FORCE) {
    const skipped = plan.filter(([, , , , fn]) =>
      existsSync(path.join(IMG_DIR, fn))
    );
    plan = plan.filter(
      ([, , , , fn]) => !existsSync(path.join(IMG_DIR, fn))
    );
    if (skipped.length) {
      console.log(
        `Skipping ${skipped.length} already-downloaded images (use --force to re-download)`
      );
    }
  }

  if (DRY_RUN) {
    console.log("\n--- DRY RUN ---");
    for (const [cat, key, , , newFilename] of plan) {
      const oldFilename = overrides[cat]?.[key]?.image ?? "";
      const status =
        oldFilename === newFilename ? "(new)" : `${JSON.stringify(oldFilename)} ->`;
      console.log(`  [${cat}] ${key}: ${status} ${JSON.stringify(newFilename)}`);
    }
    return;
  }

  if (FORCE) {
    const newFilenames = new Set(plan.map(([, , , , fn]) => fn));
    const toDelete = readdirSync(IMG_DIR).filter(
      (f) => !PRESERVE.has(f) && !newFilenames.has(f)
    );
    console.log(`\nDeleting ${toDelete.length} old images...`);
    for (const fname of toDelete.sort()) {
      const fpath = path.join(IMG_DIR, fname);
      if (existsSync(fpath)) {
        rmSync(fpath);
        console.log(`  deleted: ${fname}`);
      }
    }
  }

  console.log(`\nDownloading ${plan.length} images...`);
  const updatedOverrides = JSON.parse(JSON.stringify(overrides));

  for (const [cat, key, , url, newFilename] of plan) {
    const dest = path.join(IMG_DIR, newFilename);
    process.stdout.write(`  [${cat}] ${key}: ${newFilename} ... `);
    const result = await downloadImage(url, dest);
    const ok = result !== false;
    const actualFilename = ok ? path.basename(result) : newFilename;
    console.log(ok ? "OK" : "FAILED");
    if (ok) updatedOverrides[cat][key].image = actualFilename;
    await sleep(100);
  }

  await writeFile(
    OVERRIDES_PATH,
    JSON.stringify(updatedOverrides, null, 2) + "\n",
    "utf-8"
  );
  console.log(`\nUpdated: ${OVERRIDES_PATH}`);
  console.log("Run: node scripts/generate_parts.js  to regenerate beyparts.js");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
