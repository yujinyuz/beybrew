// Generate src/data/beyparts.json from data/*.json + src/data/parts-overrides.json.
// Usage: node scripts/generate_parts.js

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BEYDATA_DIR = join(ROOT, 'data');
const OVERRIDES_PATH = join(ROOT, 'src', 'data', 'parts-overrides.json');
const OUTPUT_PATH = join(ROOT, 'src', 'data', 'beyparts.json');

const PLACEHOLDER_NAMES = new Set(['■', '◾️']);
const DEFAULT_BLADE_IMAGE = 'BladeUnknown.svg';

function loadBeydata() {
  const categories = {
    blades: 'BeybladePartsBlade.json',
    mainBlades: 'BeybladePartsMainBlade.json',
    assistBlades: 'BeybladePartsAssistBlade.json',
    ratchets: 'BeybladePartsRatchet.json',
    bits: 'BeybladePartsBit.json',
    lockChips: 'BeybladePartsLockChip.json',
    metalBlades: 'BeybladePartsMetalBlade.json',
    overBlades: 'BeybladePartsOverBlade.json',
  };
  const result = {};
  for (const [key, filename] of Object.entries(categories)) {
    const path = join(BEYDATA_DIR, filename);
    result[key] = existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : [];
  }
  return result;
}

function loadOverrides() {
  const empty = {
    blades: {}, mainBlades: {}, assistBlades: {},
    ratchets: {}, bits: {}, lockChips: {},
    metalBlades: {}, overBlades: {},
  };
  if (!existsSync(OVERRIDES_PATH)) return empty;
  const data = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8'));
  for (const key of Object.keys(empty)) data[key] ??= {};
  return data;
}

function statsKey(entry) {
  const s = entry.defaultStatus;
  return `${s.attack ?? 0},${s.defense ?? 0},${s.stamina ?? 0}`;
}

function isModeChange(entry) {
  return (entry.model_name ?? '').includes('_ModeChange');
}

function extractTypeLabel(enName) {
  const clean = enName.replace(/<[^>]+>/g, '').trim();
  const match = clean.match(/\(([^)]+)\)$/);
  return match ? match[1].replace(/\b\w/g, c => c.toUpperCase()) : null;
}

function overrideKey(groupId, group) {
  const en = group[0]?.en_name?.trim();
  return en || groupId;
}

function processEntries(entries, overrides) {
  const groups = new Map();
  for (const e of entries) {
    const gid = (e.group_id ?? '').trim();
    if (gid && !PLACEHOLDER_NAMES.has(gid)) {
      if (!groups.has(gid)) groups.set(gid, []);
      groups.get(gid).push(e);
    }
  }

  const result = [];
  for (const [groupId, group] of groups) {
    const okey = overrideKey(groupId, group);
    let override = overrides[okey] ?? overrides[groupId] ?? {};

    const base = group.filter(e => !isModeChange(e));
    const modeChanges = group.filter(e => isModeChange(e));

    const seenStats = new Set();
    const dedupedBase = [];
    for (const e of base) {
      const key = statsKey(e);
      if (!seenStats.has(key)) { seenStats.add(key); dedupedBase.push(e); }
    }

    // Auto-generate modes from parenthetical type labels e.g. "(Upper Type)"
    if (dedupedBase.length > 1 && !override.modes) {
      const labels = dedupedBase.map(e => extractTypeLabel(e.name?.['en-US'] ?? ''));
      if (labels.every(Boolean)) {
        override = {
          ...override,
          modes: dedupedBase.map((e, i) => ({
            label: labels[i],
            attack: e.defaultStatus.attack ?? 0,
            defense: e.defaultStatus.defense ?? 0,
            stamina: e.defaultStatus.stamina ?? 0,
          })),
        };
      }
    }

    // Auto-generate modes from show_mode_change_icon + style_name labels
    if (dedupedBase.length > 1 && !override.modes) {
      if (dedupedBase.some(e => e.show_mode_change_icon)) {
        const labels = dedupedBase.map(e => e.style_name?.['en-US']);
        if (labels.every(Boolean)) {
          override = {
            ...override,
            modes: dedupedBase.map((e, i) => ({
              label: labels[i],
              attack: e.defaultStatus.attack ?? 0,
              defense: e.defaultStatus.defense ?? 0,
              stamina: e.defaultStatus.stamina ?? 0,
            })),
          };
        }
      }
    }

    if (override.modes) {
      if (dedupedBase.length) result.push({ ...dedupedBase[0], _override: override, _is_mode_change: false });
      continue;
    }

    const baseStats = new Set(dedupedBase.map(statsKey));
    const seenMcStats = new Set();
    const dedupedMc = [];
    for (const e of modeChanges) {
      const key = statsKey(e);
      if (!seenMcStats.has(key) && !baseStats.has(key)) { seenMcStats.add(key); dedupedMc.push(e); }
    }

    if (dedupedBase.length) result.push({ ...dedupedBase[0], _override: override, _is_mode_change: false });
    for (const mc of dedupedMc) result.push({ ...mc, _override: override, _is_mode_change: true });
  }
  return result;
}

function baseName(groupId, override) {
  if (override.name) return override.name;
  return groupId.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function toSource(raw) {
  if (!raw) return undefined;
  return Array.isArray(raw) ? raw : [raw];
}

function makeBladeEntry(beydata, override) {
  const image = override.image || DEFAULT_BLADE_IMAGE;
  const stats = beydata.defaultStatus;
  const name = baseName(beydata.group_id, override);
  const isMC = beydata._is_mode_change ?? false;
  const modes = override.modes;

  const entry = modes
    ? { name, points: override.points ?? 1, type: override.type ?? beydata.type, image, modes }
    : {
        name,
        points: override.points ?? 1,
        attack: override.attack ?? stats.attack ?? 0,
        defense: override.defense ?? stats.defense ?? 0,
        stamina: override.stamina ?? stats.stamina ?? 0,
        type: override.type ?? beydata.type,
        image,
        ...(isMC ? { altname: `${name} (Mode Change)` } : {}),
      };

  const line = override.line || beydata.series_name;
  if (line) entry.line = line;
  if (override.hasbro) entry.hasbro = true;
  if (override.spinType) entry.spinType = override.spinType;
  const src = toSource(override._source);
  if (src) entry.source = src;
  if (override._description) entry.description = override._description;
  return entry;
}

function makeRatchetEntry(beydata, override) {
  const stats = beydata.defaultStatus;
  const name = beydata.group_id;
  const entry = {
    name, altname: name,
    points: override.points ?? 1,
    attack: override.attack ?? stats.attack ?? 0,
    defense: override.defense ?? stats.defense ?? 0,
    stamina: override.stamina ?? stats.stamina ?? 0,
    type: override.type ?? null,
  };
  if (override.image) entry.image = override.image;
  const src = toSource(override._source);
  if (src) entry.source = src;
  if (override._description) entry.description = override._description;
  return entry;
}

function makeBitEntry(beydata, override) {
  const stats = beydata.defaultStatus;
  const name = baseName(beydata.group_id, override);
  const alias = override.alias ?? beydata.en_name ?? beydata.group_id;
  const modes = override.modes;

  const entry = modes
    ? {
        name, alias,
        points: override.points ?? 1,
        xDash: override.xDash ?? stats.dash ?? 0,
        burstResistance: override.burstResistance ?? stats.burst ?? 0,
        type: override.type ?? beydata.type,
        modes,
      }
    : {
        name, alias,
        points: override.points ?? 1,
        attack: override.attack ?? stats.attack ?? 0,
        defense: override.defense ?? stats.defense ?? 0,
        stamina: override.stamina ?? stats.stamina ?? 0,
        xDash: override.xDash ?? stats.dash ?? 0,
        burstResistance: override.burstResistance ?? stats.burst ?? 0,
        type: override.type ?? beydata.type,
      };
  if (override.image) entry.image = override.image;
  const src = toSource(override._source);
  if (src) entry.source = src;
  if (override._description) entry.description = override._description;
  return entry;
}

function makeAssistBladeEntry(beydata, override) {
  const image = override.image || DEFAULT_BLADE_IMAGE;
  const stats = beydata.defaultStatus;
  const name = baseName(beydata.group_id, override);
  const alias = override.alias ?? beydata.en_name ?? beydata.group_id;
  const isMC = beydata._is_mode_change ?? false;
  const modes = override.modes;

  const entry = modes
    ? { name, alias, type: override.type ?? beydata.type, points: override.points ?? 0, image, modes }
    : {
        name, alias,
        type: override.type ?? beydata.type,
        points: override.points ?? 0,
        attack: override.attack ?? stats.attack ?? 0,
        defense: override.defense ?? stats.defense ?? 0,
        stamina: override.stamina ?? stats.stamina ?? 0,
        image,
        ...(isMC ? { altname: `${name} (Mode Change)` } : {}),
      };
  const src = toSource(override._source);
  if (src) entry.source = src;
  if (override._description) entry.description = override._description;
  return entry;
}

function makeMetalBladeEntry(beydata, override) {
  const image = override.image || DEFAULT_BLADE_IMAGE;
  const stats = beydata.defaultStatus;
  const name = baseName(beydata.group_id, override);
  const entry = {
    name,
    points: override.points ?? 1,
    attack: override.attack ?? stats.attack ?? 0,
    defense: override.defense ?? stats.defense ?? 0,
    stamina: override.stamina ?? stats.stamina ?? 0,
    type: override.type ?? beydata.type,
    image, line: 'CX', fourPartCX: true,
  };
  const src = toSource(override._source);
  if (src) entry.source = src;
  if (override._description) entry.description = override._description;
  return entry;
}

function makeOverBladeEntry(beydata, override) {
  const stats = beydata.defaultStatus;
  const name = baseName(beydata.group_id, override);
  const alias = override.alias ?? beydata.en_name ?? beydata.group_id;
  const entry = {
    name, alias,
    points: override.points ?? 0,
    attack: override.attack ?? stats.attack ?? 0,
    defense: override.defense ?? stats.defense ?? 0,
    stamina: override.stamina ?? stats.stamina ?? 0,
    type: override.type ?? beydata.type,
  };
  if (override.image) entry.image = override.image;
  const src = toSource(override._source);
  if (src) entry.source = src;
  if (override._description) entry.description = override._description;
  return entry;
}

function makeLockChipEntry(beydata, override) {
  const name = baseName(beydata.group_id, override);
  const entry = { name, line: 'CX', points: override.points ?? 0, attack: 0, defense: 0, stamina: 0 };
  if (override.image) entry.image = override.image;
  const src = toSource(override._source);
  if (src) entry.source = src;
  if (override._description) entry.description = override._description;
  return entry;
}

function makeIntegratedRatchetEntry(name, override) {
  return {
    name, altname: '',
    points: override.points ?? 0,
    attack: override.attack ?? 0,
    defense: override.defense ?? 0,
    stamina: override.stamina ?? 0,
    integratedBit: override._integratedBit,
  };
}

function cxAssemblyIds(blades) {
  return new Set(blades.filter(b => b.series_name === 'CX').map(b => b.group_id ?? ''));
}

function mislabeledBladeIds(blades) {
  return new Set(blades.filter(b => b.en_name === 'BIT').map(b => b.group_id ?? ''));
}

function fourPartModelNames(metalBlades) {
  return new Set(metalBlades.map(e => e.model_name ?? ''));
}

// --- main ---

const beydata = loadBeydata();
const overrides = loadOverrides();

// Blades
const fourPartModels = fourPartModelNames(beydata.metalBlades);
const excludeBladeIds = new Set([...cxAssemblyIds(beydata.blades), ...mislabeledBladeIds(beydata.blades)]);
const allBladeEntries = [...beydata.blades, ...beydata.mainBlades].filter(
  e => !excludeBladeIds.has(e.group_id) && !fourPartModels.has(e.model_name ?? '')
);
const bladeOverrides = { ...overrides.blades, ...overrides.mainBlades };
const blades = processEntries(allBladeEntries, bladeOverrides)
  .map(e => makeBladeEntry(e, e._override ?? {}))
  .filter(Boolean);

for (const [groupId, override] of Object.entries(bladeOverrides)) {
  if (override._synthetic) {
    const synth = {
      group_id: groupId, en_name: groupId,
      type: override._type ?? 'balance',
      show_mode_change_icon: false,
      model_name: groupId,
      defaultStatus: override._stats ?? { attack: 0, defense: 0, stamina: 0 },
      _is_mode_change: false,
    };
    const obj = makeBladeEntry(synth, override);
    if (obj) blades.push(obj);
  }
}

processEntries(beydata.metalBlades, overrides.metalBlades).forEach(e => {
  const obj = makeMetalBladeEntry(e, e._override ?? {});
  if (obj) blades.push(obj);
});

// Assist blades
const assist_blades = processEntries(beydata.assistBlades, overrides.assistBlades)
  .map(e => makeAssistBladeEntry(e, e._override ?? {}))
  .filter(Boolean);

// Ratchets
const integratedRatchets = Object.entries(overrides.ratchets)
  .filter(([, ov]) => '_integratedBit' in ov)
  .map(([name, ov]) => makeIntegratedRatchetEntry(name, ov));
const ratchets = [
  ...integratedRatchets,
  ...processEntries(beydata.ratchets, overrides.ratchets).map(e => makeRatchetEntry(e, e._override ?? {})),
];

// Bits
const bits = processEntries(beydata.bits, overrides.bits)
  .map(e => makeBitEntry(e, e._override ?? {}));

// Lock chips
const lockChipEntries = beydata.lockChips
  .filter(e => !isModeChange(e))
  .map(e => (!e.group_id?.trim() && e.en_name?.trim()) ? { ...e, group_id: e.en_name } : e);
const lock_chips = processEntries(lockChipEntries, overrides.lockChips)
  .map(e => makeLockChipEntry(e, e._override ?? {}));
for (const [groupId, override] of Object.entries(overrides.lockChips)) {
  if (override._synthetic) {
    lock_chips.push(makeLockChipEntry({ group_id: groupId, model_name: groupId }, override));
  }
}

// Over blades
const over_blades = processEntries(beydata.overBlades, overrides.overBlades)
  .map(e => makeOverBladeEntry(e, e._override ?? {}));

writeFileSync(OUTPUT_PATH, JSON.stringify({ blades, assist_blades, ratchets, bits, lock_chips, over_blades }, null, 2) + '\n', 'utf-8');
console.log(`Written: ${OUTPUT_PATH}`);
console.log(`  blades: ${blades.length}, assist_blades: ${assist_blades.length}, ratchets: ${ratchets.length}, bits: ${bits.length}, lock_chips: ${lock_chips.length}, over_blades: ${over_blades.length}`);
