import parts from "../src/data/beyparts.js";
import { writeFileSync, readFileSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const beydataDir = resolve(__dirname, "../beydata");

// Aggregate beydata/BeybladeParts*.json into a single object keyed by category
const categoryMap = {
  BeybladePartsBlade: "blades",
  BeybladePartsAssistBlade: "assist_blades",
  BeybladePartsMainBlade: "main_blades",
  BeybladePartsRatchet: "ratchets",
  BeybladePartsBit: "bits",
  BeybladePartsLockChip: "lock_chips",
  BeybladePartsOverBlade: "over_blades",
  BeybladePartsMetalBlade: "metal_blades",
};

const beydata = {};
const bladeFilePath = resolve(beydataDir, "BeybladePartsBlade.json");

for (const file of readdirSync(beydataDir).filter(f => f.endsWith(".json"))) {
  const filePath = resolve(beydataDir, file);
  const key = basename(file, ".json");
  const category = categoryMap[key] ?? key;
  let entries = JSON.parse(readFileSync(filePath, "utf8"));

  if (key === "BeybladePartsBlade") {
    const before = entries.length;
    entries = entries.filter(b => !b.tags?.includes("cx"));
    writeFileSync(filePath, JSON.stringify(entries, null, 2));
    console.log(`Cleaned BeybladePartsBlade.json: removed ${before - entries.length} CX entries`);
  }

  beydata[category] = entries;
}

// CX blades belong in main_blades — remove from blades
beydata.blades = beydata.blades?.filter(b => !b.tags?.includes("cx")) ?? [];

// 4-part CX parts (with a metal blade) don't belong in main_blades
const metalBladeModels = new Set(beydata.metal_blades?.map(b => b.model_name) ?? []);
beydata.main_blades = beydata.main_blades?.filter(b => !metalBladeModels.has(b.model_name)) ?? [];

writeFileSync(
  resolve(__dirname, "../public/api.json"),
  JSON.stringify(beydata, null, 2)
);

const beydataTotal = Object.values(beydata).reduce((s, a) => s + a.length, 0);
console.log(`Written api.json (${beydataTotal} items across ${Object.keys(beydata).length} categories)`);
