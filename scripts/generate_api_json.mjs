import { writeFileSync, readFileSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const beydataDir = resolve(__dirname, "../beydata");

const overridesPath = resolve(__dirname, "../src/data/parts-overrides.json");
const overrides = JSON.parse(readFileSync(overridesPath, "utf8"));

// Map api.json category keys to parts-overrides.json category keys
const overridesCategoryMap = {
  blades: "blades",
  main_blades: "mainBlades",
  assist_blades: "assistBlades",
  ratchets: "ratchets",
  bits: "bits",
  lock_chips: "lockChips",
  metal_blades: "metalBlades",
  over_blades: "overBlades",
};

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

// Strip test/command entries
for (const key of Object.keys(beydata)) {
  beydata[key] = beydata[key].filter(b => !b.id?.includes("CMD-888888"));
}

// CX blades belong in main_blades — remove from blades
beydata.blades = beydata.blades?.filter(b => !b.tags?.includes("cx")) ?? [];

// 4-part CX parts (with a metal blade) don't belong in main_blades
const metalBladeModels = new Set(beydata.metal_blades?.map(b => b.model_name) ?? []);
beydata.main_blades = beydata.main_blades?.filter(b => !metalBladeModels.has(b.model_name)) ?? [];

// Inject image field from parts-overrides.json
for (const [apiKey, overrideKey] of Object.entries(overridesCategoryMap)) {
  const categoryOverrides = overrides[overrideKey] ?? {};
  beydata[apiKey] = (beydata[apiKey] ?? []).map(entry => {
    const image = categoryOverrides[entry.en_name]?.image ?? null;
    return image ? { ...entry, image } : entry;
  });
}

const beydataTotal = Object.values(beydata).reduce((s, a) => s + a.length, 0);

writeFileSync(resolve(__dirname, "../public/api/data.json"), JSON.stringify(beydata));
writeFileSync(resolve(__dirname, "../public/api/data.pretty.json"), JSON.stringify(beydata, null, 2));

console.log(`Written api/data.json and api/data.pretty.json (${beydataTotal} items across ${Object.keys(beydata).length} categories)`);
