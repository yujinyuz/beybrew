#!/usr/bin/env node
/**
 * Interactive prompt for new parts that need overrides.
 * Compares decoded beydata against parts-overrides.json and asks
 * for missing entries one by one.
 *
 * Usage:
 *   node scripts/prompt_overrides.js
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BEYDATA_DIR = join(ROOT, "data");
const OVERRIDES_PATH = join(ROOT, "src", "data", "parts-overrides.json");

const PLACEHOLDER_NAMES = new Set(["■", "◾️"]);
const DEFAULT_BLADE_IMAGE = "BladeUnknown.svg";

const CATEGORIES = {
  blades: "BeybladePartsBlade.json",
  mainBlades: "BeybladePartsMainBlade.json",
  assistBlades: "BeybladePartsAssistBlade.json",
  ratchets: "BeybladePartsRatchet.json",
  bits: "BeybladePartsBit.json",
  lockChips: "BeybladePartsLockChip.json",
  metalBlades: "BeybladePartsMetalBlade.json",
  overBlades: "BeybladePartsOverBlade.json",
};

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

function loadOverrides() {
  const empty = {
    blades: {}, mainBlades: {}, assistBlades: {},
    ratchets: {}, bits: {}, lockChips: {},
    metalBlades: {}, overBlades: {},
  };
  if (!existsSync(OVERRIDES_PATH)) return empty;
  const data = JSON.parse(readFileSync(OVERRIDES_PATH, "utf-8"));
  for (const key of Object.keys(empty)) data[key] ??= {};
  return data;
}

function loadBeydata() {
  const result = {};
  for (const [key, filename] of Object.entries(CATEGORIES)) {
    const path = join(BEYDATA_DIR, filename);
    result[key] = existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : [];
  }
  return result;
}

function cleanText(raw) {
  return (raw ?? "")
    .replace(/<ruby=[^>]*>(.*?)<\/ruby>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatGroupId(id) {
  // Simple heuristic: insert spaces before capitals for ALLCAPS
  if (/^[A-Z][A-Z0-9]+$/.test(id)) {
    return id.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2").replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  return id;
}

function isModeChange(entry) {
  return (entry.model_name ?? "").includes("_ModeChange");
}

function isPlaceholderName(name) {
  if (!name) return true;
  const clean = name.replace(/<[^>]+>/g, "").trim();
  return PLACEHOLDER_NAMES.has(clean) || clean === "";
}

function shouldSkipEntry(entry) {
  // Skip non-deck-configurable parts (bit sets, promos, etc.)
  if (entry.deck_configurable === false) return true;
  // Skip mislabeled blade entries (en_name is BIT but it's a blade)
  if (entry.en_name === "BIT") return true;
  // Skip entries with placeholder names
  if (isPlaceholderName(entry.en_name)) return true;
  if (isPlaceholderName(entry.name?.["en-US"])) return true;
  return false;
}

function getMissingGroups(category, entries, overrides) {
  const groups = new Map();
  for (const entry of entries) {
    const gid = (entry.group_id ?? "").trim();
    if (!gid || PLACEHOLDER_NAMES.has(gid)) continue;
    if (isModeChange(entry)) continue; // mode changes handled with parent
    if (shouldSkipEntry(entry)) continue;
    if (!groups.has(gid)) groups.set(gid, entry);
  }

  const missing = [];
  for (const [gid, entry] of groups) {
    // Use en_name as primary key (matches generate_parts.js + existing overrides)
    const ename = (entry.en_name ?? "").trim();
    if (overrides[ename] || overrides[gid]) continue;
    missing.push({ gid, entry });
  }
  return missing;
}

function showPartInfo(cat, gid, entry) {
  console.log("\n" + "─".repeat(60));
  console.log(`  Category: ${cat}`);
  console.log(`  Group ID: ${gid}`);
  console.log(`  EN Name:  ${entry.en_name ?? "(none)"}`);
  console.log(`  Type:     ${entry.type ?? "(none)"}`);
  console.log(`  Model:    ${entry.model_name ?? "(none)"}`);
  const stats = entry.defaultStatus;
  if (stats) {
    const s = [];
    if (stats.attack != null) s.push(`ATK ${stats.attack}`);
    if (stats.defense != null) s.push(`DEF ${stats.defense}`);
    if (stats.stamina != null) s.push(`STA ${stats.stamina}`);
    if (stats.dash != null) s.push(`DASH ${stats.dash}`);
    if (stats.burst != null) s.push(`BURST ${stats.burst}`);
    console.log(`  Stats:    ${s.join(" / ")}`);
  }
  const desc = cleanText(entry.description?.["en-US"] ?? "");
  if (desc) console.log(`  Desc:     ${desc.slice(0, 120)}${desc.length > 120 ? "..." : ""}`);
  console.log("─".repeat(60));
}

async function promptForPart(cat, gid, entry) {
  showPartInfo(cat, gid, entry);

  const defaultName = formatGroupId(gid);
  let name = await ask(`  Display name [${defaultName}]: `);
  name = name.trim() || defaultName;

  const defaultImage = cat === "blades" || cat === "mainBlades" || cat === "assistBlades" || cat === "metalBlades"
    ? DEFAULT_BLADE_IMAGE
    : "";
  let image = await ask(`  Image filename [${defaultImage}]: `);
  image = image.trim() || defaultImage;

  const defaultPoints = "1";
  let points = await ask(`  Points [${defaultPoints}]: `);
  points = points.trim() || defaultPoints;

  const obj = { name };
  if (image && image !== DEFAULT_BLADE_IMAGE) obj.image = image;
  if (points !== "1") obj.points = Number(points);

  // Optional fields
  console.log("  Optional fields (press Enter to skip):");

  const spinType = await ask(`    spinType (right/left) []: `);
  if (spinType.trim()) obj.spinType = spinType.trim();

  const alias = await ask(`    alias []: `);
  if (alias.trim()) obj.alias = alias.trim();

  const line = await ask(`    line (BX/UX/CX) []: `);
  if (line.trim()) obj.line = line.trim();

  const overrideType = await ask(`    type override []: `);
  if (overrideType.trim()) obj.type = overrideType.trim();

  const desc = await ask(`    description override []: `);
  if (desc.trim()) obj._description = desc.trim();

  return obj;
}

async function main() {
  const beydata = loadBeydata();
  const overrides = loadOverrides();

  let totalNew = 0;
  const toAdd = {};

  for (const cat of Object.keys(CATEGORIES)) {
    const missing = getMissingGroups(cat, beydata[cat], overrides[cat]);
    if (missing.length === 0) continue;
    toAdd[cat] = missing;
    totalNew += missing.length;
  }

  if (totalNew === 0) {
    console.log("✅ All parts already have overrides. Nothing to do.");
    rl.close();
    return;
  }

  console.log(`\n🔍 Found ${totalNew} new part(s) needing overrides.\n`);

  for (const [cat, missing] of Object.entries(toAdd)) {
    console.log(`\n📦 ${cat}: ${missing.length} new part(s)`);
    for (const { gid, entry } of missing) {
      const override = await promptForPart(cat, gid, entry);
      overrides[cat][gid] = override;
      console.log(`  ✅ Added override for ${gid}\n`);
    }
  }

  writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2) + "\n", "utf-8");
  console.log(`\n💾 Saved: ${OVERRIDES_PATH}`);
  console.log("   Run: just generate  (or: node scripts/generate_parts.js)");
  rl.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
