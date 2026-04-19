#!/usr/bin/env node
/**
 * Download a part image from a beyblade.fandom.com wiki URL.
 *
 * Usage:
 *   node scripts/wiki_download.js <wiki-url>
 *   node scripts/wiki_download.js  # prompts for URL
 */

import { createWriteStream, existsSync, statSync } from "fs";
import { createInterface } from "readline";
import { pipeline } from "stream/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IMG_DIR = path.join(ROOT, "public", "images");
const HEADERS = { "User-Agent": "Mozilla/5.0" };
const API = "https://beyblade.fandom.com/api.php";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const prompt = (q) => new Promise((res) => rl.question(q, res));

async function apiGet(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}?${qs}`, { headers: HEADERS });
  return res.json();
}

async function download(url, dest) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

function cleanImageUrl(thumbUrl) {
  return (
    thumbUrl.split("/scale-to-width-down")[0].split("/revision/latest")[0] +
    "/revision/latest"
  );
}

function pageTitleFromUrl(url) {
  const parsed = new URL(url);
  const title = parsed.pathname.split("/wiki/").pop();
  return decodeURIComponent(title).replace(/_/g, " ");
}

async function listPageImages(title) {
  const data = await apiGet({
    action: "query",
    titles: title,
    prop: "images",
    imlimit: "50",
    format: "json",
  });
  const pages = data.query.pages;
  for (const page of Object.values(pages)) {
    return (page.images ?? []).map((img) =>
      img.title.replace(/^File:/, "")
    );
  }
  return [];
}

async function getImageUrl(filename) {
  const data = await apiGet({
    action: "query",
    titles: `File:${filename}`,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
  });
  for (const page of Object.values(data.query.pages)) {
    const info = page.imageinfo ?? [];
    if (info.length) return info[0].url;
  }
  return null;
}

async function main() {
  const url =
    process.argv[2] ?? (await prompt("Wiki URL: ")).trim();

  const title = pageTitleFromUrl(url);
  console.log(`Page: ${title}`);

  const data = await apiGet({
    action: "query",
    titles: title,
    prop: "pageimages",
    pithumbsize: "500",
    format: "json",
  });

  const pages = data.query.pages;
  let mainImage = null;
  let mainUrl = null;
  for (const page of Object.values(pages)) {
    mainImage = page.pageimage ?? null;
    const thumb = page.thumbnail?.source ?? "";
    if (thumb) mainUrl = cleanImageUrl(thumb);
  }

  const allImages = await listPageImages(title);
  const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
  const bladeImages = allImages.filter((i) =>
    IMAGE_EXTS.has(path.extname(i).toLowerCase())
  );

  let chosenImages;
  if (bladeImages.length > 1) {
    console.log(`\nFound ${bladeImages.length} images on this page:`);
    bladeImages.forEach((name, i) => {
      const marker = name === mainImage ? " <-- main" : "";
      console.log(`  ${i}) ${name}${marker}`);
    });
    const choice = (
      await prompt(
        "\nEnter numbers to download (comma-separated, 'all', or Enter = main): "
      )
    ).trim();

    if (choice.toLowerCase() === "all") {
      chosenImages = bladeImages;
    } else if (choice) {
      const indices = choice
        .split(",")
        .map((x) => parseInt(x.trim(), 10))
        .filter((n) => !isNaN(n) && n < bladeImages.length);
      chosenImages = indices.map((i) => bladeImages[i]);
    } else if (mainImage) {
      chosenImages = [[mainImage, mainUrl]];
    } else {
      console.log("No image found.");
      rl.close();
      return;
    }
  } else if (mainImage) {
    chosenImages = [mainImage];
  } else {
    console.log("No image found on this page.");
    rl.close();
    return;
  }

  // Resolve (name, url) pairs
  const toDownload = [];
  for (const item of chosenImages) {
    if (Array.isArray(item)) {
      toDownload.push(item);
    } else {
      const name = item;
      const resolvedUrl =
        name === mainImage && mainUrl ? mainUrl : await getImageUrl(name);
      if (resolvedUrl) {
        toDownload.push([name, resolvedUrl]);
      } else {
        console.log(`Could not resolve URL for ${name}, skipping.`);
      }
    }
  }

  for (const [imgName, imgUrl] of toDownload) {
    const dest = path.join(IMG_DIR, imgName);
    if (existsSync(dest)) {
      const overwrite = (
        await prompt(`${imgName} already exists. Overwrite? [y/N] `)
      )
        .trim()
        .toLowerCase();
      if (overwrite !== "y") {
        console.log(`Skipped ${imgName}.`);
        continue;
      }
    }
    process.stdout.write(`Downloading ${imgName} ... `);
    await download(imgUrl, dest);
    const sizeKb = Math.floor(statSync(dest).size / 1024);
    console.log(`OK (${sizeKb}KB) → public/images/${imgName}`);
  }

  if (toDownload.length) {
    console.log("\nAdd to parts-overrides.json:");
    for (const [imgName] of toDownload) {
      console.log(`  "image": "${imgName}"`);
    }
  }

  rl.close();
}

main().catch((e) => {
  console.error(e.message);
  rl.close();
  process.exit(1);
});
