#!/usr/bin/env node
/**
 * Decodes MasterData.json and writes per-category JSON files to beydata/.
 *
 * Source file on device:
 *   Android/data/jp.co.takaratomy.beyblade/files/MasterData.json
 *
 * Usage:
 *   node extract_beydata.js [MasterData.json] [filterGroupId]
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

const PARTS = [
  "Blade",
  "Ratchet",
  "Bit",
  "MainBlade",
  "AssistBlade",
  "LockChip",
  "OverBlade",
  "MetalBlade",
];

const STRIP_FIELDS = new Set([
  "collection_visible",
  // "deck_configurable",
  "dummy_parts",
  // "parts_customize_type",
  "first_reward_id",
  "next_reward_id",
  "ruby",
  "yomi",
  "model_blade_y_offset",
  "model_ratchet_angle_offset",
  "description_rotation_left",
  // "style_name",
  "invalid",
  "package_id",
]);

const inputPath = process.argv[2] ?? "MasterData.json";
const filterGroupId = process.argv[3] ?? null;

function decode(inputPath, filterGroupId = null) {
  const masterDataStr = JSON.parse(readFileSync(inputPath, "utf-8")).masterData;

  if (!masterDataStr) {
    console.error("masterData key missing or empty");
    process.exit(1);
  }

  const data = JSON.parse(masterDataStr).data;
  const metalBladeModels = new Set(
    data["BeybladePartsMetalBlade"].map((x) => x.model_name),
  );

  for (const part of PARTS) {
    let items = data[`BeybladeParts${part}`];

    if (part === "Blade") {
      items = items.filter((x) => !(x.tags ?? []).includes("cx"));
    }

    items = items.filter((x) => !(x.id ?? "").includes("CMD-888888"));

    if (part === "MainBlade") {
      items = items.filter((x) => !metalBladeModels.has(x.model_name));
    }

    if (filterGroupId) {
      items = items.filter((x) => x.group_id === filterGroupId);
    }

    items = items.map((item) =>
      Object.fromEntries(
        Object.entries(item).filter(([k]) => !STRIP_FIELDS.has(k)),
      ),
    );

    items.sort(
      (a, b) =>
        new Date(b.release_at).getTime() - new Date(a.release_at).getTime(),
    );

    let outPath;
    if (filterGroupId) {
      outPath = path.join(
        "beydata",
        "filtered",
        `BeybladeParts${part}_filtered_${filterGroupId}.json`,
      );
      mkdirSync(path.dirname(outPath), { recursive: true });
    } else {
      outPath = path.join("beydata", `BeybladeParts${part}.json`);
    }

    writeFileSync(outPath, JSON.stringify(items, null, 4));
    console.log(`Written: ${outPath} (${items.length} items)`);
  }
}

decode(inputPath, filterGroupId);
