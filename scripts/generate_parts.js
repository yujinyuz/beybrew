// Generate src/data/beyparts.json and src/data/formats/limited.json from data/*.json + src/data/parts-overrides.json.
// Usage: node scripts/generate_parts.js

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BEYDATA_DIR = join(ROOT, 'data');
const OVERRIDES_PATH = join(ROOT, 'src', 'data', 'parts-overrides.json');
const OUTPUT_PATH = join(ROOT, 'src', 'data', 'beyparts.json');
const LIMITED_FORMAT_PATH = join(ROOT, 'src', 'data', 'formats', 'limited.json');
const PART_POINTS_PATH = join(ROOT, 'src', 'data', 'formats', 'part-points.json');

const partPoints = {};

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

function makeStub(category, groupId) {
  const stub = {};
  if (category === 'ratchets') {
    stub.name = groupId;
  } else {
    stub.name = baseName(groupId, {});
  }
  if (['blades', 'mainBlades', 'assistBlades', 'metalBlades'].includes(category)) {
    stub.image = DEFAULT_BLADE_IMAGE;
  }
  return stub;
}

function processEntries(entries, overrides, { category, outMissing } = {}) {
  const groups = new Map();
  for (const raw of entries) {
    const e = addAutoSource(raw);
    const gid = (e.group_id ?? '').trim();
    if (gid && !PLACEHOLDER_NAMES.has(gid)) {
      if (!groups.has(gid)) groups.set(gid, []);
      groups.get(gid).push(e);
    }
  }

  const result = [];
  for (const [groupId, group] of groups) {
    const okey = overrideKey(groupId, group);
    const rawOverride = overrides[okey] ?? overrides[groupId];
    let override = rawOverride ?? {};
    if (category && outMissing && !rawOverride) {
      const key = okey || groupId;
      outMissing[key] = makeStub(category, groupId);
    }
    const autoSource = mergeSources(group);

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

    const sourceFields = autoSource.length ? { _source: autoSource } : {};

    if (override.modes) {
      if (dedupedBase.length) result.push({ ...dedupedBase[0], ...sourceFields, _override: override, _is_mode_change: false });
      continue;
    }

    const baseStats = new Set(dedupedBase.map(statsKey));
    const seenMcStats = new Set();
    const dedupedMc = [];
    for (const e of modeChanges) {
      const key = statsKey(e);
      if (!seenMcStats.has(key) && !baseStats.has(key)) { seenMcStats.add(key); dedupedMc.push(e); }
    }

    if (dedupedBase.length) result.push({ ...dedupedBase[0], ...sourceFields, _override: override, _is_mode_change: false });
    for (const mc of dedupedMc) result.push({ ...mc, ...sourceFields, _override: override, _is_mode_change: true });
  }
  return result;
}

function baseName(groupId, override) {
  if (override.name) return override.name;
  return groupId.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function toSource(raw) {
  if (!raw) return undefined;
  const source = Array.isArray(raw) ? raw : [raw];
  return source.length ? source : undefined;
}

function cleanText(raw) {
  return (raw ?? '')
    .replace(/<ruby=[^>]*>(.*?)<\/ruby>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function descriptionFromEntry(entry) {
  const text = (entry.description?.['en-US'] ?? '')
    .replace(/<ruby=[^>]*>(.*?)<\/ruby>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
  if (!text) return null;
  // Strip "Included in <source>.\n" or "Found in <source>.\n" prefix
  const stripped = text.replace(/^(?:Found|Included) in(?: the)?\s+[^.\n]+\.\s*\\n\s*/i, '').trim();
  const clean = stripped.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
  return clean || null;
}

function normalizeSource(raw) {
  let source = cleanText(raw);
  if (!source) return '';

  source = source
    .replace(/^Included in\s+/i, '')
    .replace(/^Found in(?: the)?\s+/i, '')
    .replace(/^[.\s]+/, '')
    .trim();

  if (!source || PLACEHOLDER_NAMES.has(source)) return '';

  const noisePatterns = [
    /^(?:The|A|An|This|During|When|By|With|Designed|Sets?|Uses?|Parts?)\b/i,
    /\s+A part set\b/i,
    /\s+Parts? (?:that )?set\b/i,
    /\s+Sets? (?:the )?BEY\b/i,
    /\s+Uses?\b/i,
    /\s+Designed\b/i,
    /\s+Sharply[- ]angled\b/i,
    /\s+The (?:RATCHET|BIT|BLADE|spherical|tip|pointed|flat|low|area|design|axis)\b/i,
    /\s+An? (?:part|pointed|BIT|design|obtuse|blunt|protrusion|small|finely|narrow|large|structure|low|dual|locking|streamlined|heavyweight|BLUNT)\b/i,
    /\s+During\b/i,
    /\s+When\b/i,
    /\s+By\b/i,
    /\s+With\b/i,
    /\s+This\b/i,
    /\s+Kicks?\b/i,
    /\s+Combines?\b/i,
    /\s+Gears?\b/i,
  ];

  for (const pattern of noisePatterns) {
    const match = source.match(pattern);
    if (match?.index === 0) return '';
    if (match?.index > 0) {
      source = source.slice(0, match.index);
      break;
    }
  }

  return source.replace(/\s+\.$/, '').trim();
}

function sourceFromDescription(entry) {
  const description = cleanText(entry.description?.['en-US']);
  const match = description.match(/\b(?:Found|Included) in(?: the)?\s+(.+?)(?:\.|\s+A\b|\s+An\b|\s+The\b|$)/i);
  return normalizeSource(match?.[1]);
}

function sourceFromEntry(entry) {
  return sourceFromDescription(entry)
    || normalizeSource(entry.catalog_title?.['en-US'])
    || normalizeSource(entry.model_name);
}

function addAutoSource(entry) {
  const source = sourceFromEntry(entry);
  return source ? { ...entry, _source: [source] } : entry;
}

function mergeSources(entries) {
  return [...new Set(
    entries
      .flatMap(e => toSource(e._source) ?? [])
      .map(normalizeSource)
      .filter(Boolean)
  )];
}

function entrySources(beydata, override) {
  const source = mergeSources([{ _source: override._source }, { _source: beydata._source }]);
  return source.length ? source : undefined;
}

function makeBladeEntry(beydata, override) {
  const image = override.image || DEFAULT_BLADE_IMAGE;
  const stats = beydata.defaultStatus;
  const name = baseName(beydata.group_id, override);
  const isMC = beydata._is_mode_change ?? false;
  const modes = override.modes;
  const pts = override.points ?? 1;

  const entry = modes
    ? { name, type: override.type ?? beydata.type, image, modes }
    : {
        name,
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
  if (override._integratedRatchet) entry.integratedRatchet = override._integratedRatchet;
  const src = entrySources(beydata, override);
  if (src) entry.source = src;
  const desc = override._description ?? descriptionFromEntry(beydata);
  if (desc) entry.description = desc;
  partPoints[entry.altname ?? name] = pts;
  return entry;
}

function makeRatchetEntry(beydata, override) {
  const stats = beydata.defaultStatus;
  const name = beydata.group_id;
  const pts = override.points ?? 1;
  const entry = {
    name, altname: name,
    attack: override.attack ?? stats.attack ?? 0,
    defense: override.defense ?? stats.defense ?? 0,
    stamina: override.stamina ?? stats.stamina ?? 0,
    type: override.type ?? null,
  };
  if (override.image) entry.image = override.image;
  const src = entrySources(beydata, override);
  if (src) entry.source = src;
  const desc = override._description ?? descriptionFromEntry(beydata);
  if (desc) entry.description = desc;
  partPoints[name] = pts;
  return entry;
}

function makeBitEntry(beydata, override) {
  const stats = beydata.defaultStatus;
  const name = baseName(beydata.group_id, override);
  const alias = override.alias ?? beydata.en_name ?? beydata.group_id;
  const modes = override.modes;
  const pts = override.points ?? 1;

  const entry = modes
    ? {
        name, alias,
        xDash: override.xDash ?? stats.dash ?? 0,
        burstResistance: override.burstResistance ?? stats.burst ?? 0,
        type: override.type ?? beydata.type,
        modes,
      }
    : {
        name, alias,
        attack: override.attack ?? stats.attack ?? 0,
        defense: override.defense ?? stats.defense ?? 0,
        stamina: override.stamina ?? stats.stamina ?? 0,
        xDash: override.xDash ?? stats.dash ?? 0,
        burstResistance: override.burstResistance ?? stats.burst ?? 0,
        type: override.type ?? beydata.type,
      };
  if (override.image) entry.image = override.image;
  const src = entrySources(beydata, override);
  if (src) entry.source = src;
  const desc = override._description ?? descriptionFromEntry(beydata);
  if (desc) entry.description = desc;
  partPoints[name] = pts;
  return entry;
}

function makeAssistBladeEntry(beydata, override) {
  const image = override.image || DEFAULT_BLADE_IMAGE;
  const stats = beydata.defaultStatus;
  const name = baseName(beydata.group_id, override);
  const alias = override.alias ?? beydata.en_name ?? beydata.group_id;
  const isMC = beydata._is_mode_change ?? false;
  const modes = override.modes;
  const pts = override.points ?? 0;

  const entry = modes
    ? { name, alias, type: override.type ?? beydata.type, image, modes }
    : {
        name, alias,
        type: override.type ?? beydata.type,
        attack: override.attack ?? stats.attack ?? 0,
        defense: override.defense ?? stats.defense ?? 0,
        stamina: override.stamina ?? stats.stamina ?? 0,
        image,
        ...(isMC ? { altname: `${name} (Mode Change)` } : {}),
      };
  const src = entrySources(beydata, override);
  if (src) entry.source = src;
  const desc = override._description ?? descriptionFromEntry(beydata);
  if (desc) entry.description = desc;
  partPoints[name] = pts;
  return entry;
}

function makeMetalBladeEntry(beydata, override) {
  const image = override.image || DEFAULT_BLADE_IMAGE;
  const stats = beydata.defaultStatus;
  const name = baseName(beydata.group_id, override);
  const pts = override.points ?? 1;
  const entry = {
    name,
    attack: override.attack ?? stats.attack ?? 0,
    defense: override.defense ?? stats.defense ?? 0,
    stamina: override.stamina ?? stats.stamina ?? 0,
    type: override.type ?? beydata.type,
    image, line: 'CX', fourPartCX: true,
  };
  const src = entrySources(beydata, override);
  if (src) entry.source = src;
  const desc = override._description ?? descriptionFromEntry(beydata);
  if (desc) entry.description = desc;
  partPoints[name] = pts;
  return entry;
}

function makeOverBladeEntry(beydata, override) {
  const stats = beydata.defaultStatus;
  const name = baseName(beydata.group_id, override);
  const alias = override.alias ?? beydata.en_name ?? beydata.group_id;
  const pts = override.points ?? 0;
  const entry = {
    name, alias,
    attack: override.attack ?? stats.attack ?? 0,
    defense: override.defense ?? stats.defense ?? 0,
    stamina: override.stamina ?? stats.stamina ?? 0,
    type: override.type ?? beydata.type,
  };
  if (override.image) entry.image = override.image;
  const src = entrySources(beydata, override);
  if (src) entry.source = src;
  const desc = override._description ?? descriptionFromEntry(beydata);
  if (desc) entry.description = desc;
  partPoints[name] = pts;
  return entry;
}

function makeLockChipEntry(beydata, override) {
  const name = baseName(beydata.group_id, override);
  const pts = override.points ?? 0;
  const entry = { name, line: 'CX', attack: 0, defense: 0, stamina: 0 };
  if (override.image) entry.image = override.image;
  const src = entrySources(beydata, override);
  if (src) entry.source = src;
  const desc = override._description ?? descriptionFromEntry(beydata);
  if (desc) entry.description = desc;
  partPoints[name] = pts;
  return entry;
}

function makeIntegratedRatchetEntry(name, override) {
  const pts = override.points ?? 0;
  partPoints[name] = pts;
  const entry = {
    name, altname: '',
    attack: override.attack ?? 0,
    defense: override.defense ?? 0,
    stamina: override.stamina ?? 0,
    integratedBit: override._integratedBit,
  };
  if (override.image) entry.image = override.image;
  return entry;
}

function makeBladeIntegratedRatchetEntry(name, override) {
  partPoints[name] = 0;
  const entry = {
    name, altname: '',
    attack: 0, defense: 0, stamina: 0,
  };
  if (override._integratedRatchetImage || override.image) {
    entry.image = override._integratedRatchetImage ?? override.image;
  }
  return entry;
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

const missingStubs = {
  blades: {}, mainBlades: {}, assistBlades: {},
  ratchets: {}, bits: {}, lockChips: {},
  metalBlades: {}, overBlades: {},
};

// Blades
const fourPartModels = fourPartModelNames(beydata.metalBlades);
const excludeBladeIds = new Set([...cxAssemblyIds(beydata.blades), ...mislabeledBladeIds(beydata.blades)]);
const bladeEntries = beydata.blades.filter(
  e => !excludeBladeIds.has(e.group_id) && !fourPartModels.has(e.model_name ?? '')
);
const mainBladeEntries = beydata.mainBlades.filter(
  e => !excludeBladeIds.has(e.group_id) && !fourPartModels.has(e.model_name ?? '')
);
const bladeOverrides = { ...overrides.blades, ...overrides.mainBlades };
const processedBlades = processEntries(bladeEntries, bladeOverrides, { category: 'blades', outMissing: missingStubs.blades });
const processedMainBlades = processEntries(mainBladeEntries, bladeOverrides, { category: 'mainBlades', outMissing: missingStubs.mainBlades });
const blades = [...processedBlades, ...processedMainBlades]
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

processEntries(beydata.metalBlades, overrides.metalBlades, { category: 'metalBlades', outMissing: missingStubs.metalBlades }).forEach(e => {
  const obj = makeMetalBladeEntry(e, e._override ?? {});
  if (obj) blades.push(obj);
});

// Assist blades
const assist_blades = processEntries(beydata.assistBlades, overrides.assistBlades, { category: 'assistBlades', outMissing: missingStubs.assistBlades })
  .map(e => makeAssistBladeEntry(e, e._override ?? {}))
  .filter(Boolean);

// Ratchets
const integratedRatchets = Object.entries(overrides.ratchets)
  .filter(([, ov]) => '_integratedBit' in ov)
  .map(([name, ov]) => makeIntegratedRatchetEntry(name, ov));
const bladeIntegratedRatchets = Object.values(bladeOverrides)
  .filter(ov => ov._integratedRatchet)
  .map(ov => makeBladeIntegratedRatchetEntry(ov._integratedRatchet, ov));
const ratchets = [
  ...integratedRatchets,
  ...bladeIntegratedRatchets,
  ...processEntries(beydata.ratchets, overrides.ratchets, { category: 'ratchets', outMissing: missingStubs.ratchets }).map(e => makeRatchetEntry(e, e._override ?? {})),
];

// Bits
const bits = processEntries(beydata.bits, overrides.bits, { category: 'bits', outMissing: missingStubs.bits })
  .map(e => makeBitEntry(e, e._override ?? {}));

// Lock chips
const lockChipEntries = beydata.lockChips
  .filter(e => !isModeChange(e))
  .map(e => (!e.group_id?.trim() && e.en_name?.trim()) ? { ...e, group_id: e.en_name } : e);
const lock_chips = processEntries(lockChipEntries, overrides.lockChips, { category: 'lockChips', outMissing: missingStubs.lockChips })
  .map(e => makeLockChipEntry(e, e._override ?? {}));
for (const [groupId, override] of Object.entries(overrides.lockChips)) {
  if (override._synthetic) {
    lock_chips.push(makeLockChipEntry({ group_id: groupId, model_name: groupId }, override));
  }
}

// Over blades
const over_blades = processEntries(beydata.overBlades, overrides.overBlades, { category: 'overBlades', outMissing: missingStubs.overBlades })
  .map(e => makeOverBladeEntry(e, e._override ?? {}));

writeFileSync(OUTPUT_PATH, JSON.stringify({ blades, assist_blades, ratchets, bits, lock_chips, over_blades }, null, 2) + '\n', 'utf-8');
console.log(`Written: ${OUTPUT_PATH}`);
console.log(`  blades: ${blades.length}, assist_blades: ${assist_blades.length}, ratchets: ${ratchets.length}, bits: ${bits.length}, lock_chips: ${lock_chips.length}, over_blades: ${over_blades.length}`);

// Write missing stubs back to parts-overrides.json
let overridesChanged = false;
for (const [category, stubs] of Object.entries(missingStubs)) {
  if (Object.keys(stubs).length > 0) {
    overridesChanged = true;
    const existing = overrides[category] ?? {};
    const merged = {};
    for (const key of Object.keys(existing)) merged[key] = existing[key];
    for (const key of Object.keys(stubs)) merged[key] = stubs[key];
    overrides[category] = merged;
  }
}

if (overridesChanged) {
  writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 4) + '\n', 'utf-8');
  const totalNew = Object.values(missingStubs).reduce((sum, s) => sum + Object.keys(s).length, 0);
  console.log(`Updated: ${OVERRIDES_PATH} (+${totalNew} new stub(s))`);
}

mkdirSync(dirname(LIMITED_FORMAT_PATH), { recursive: true });
const existingLimitedFormat = existsSync(LIMITED_FORMAT_PATH)
  ? JSON.parse(readFileSync(LIMITED_FORMAT_PATH, 'utf-8'))
  : {};
const limitedFormat = existingLimitedFormat.id
  ? existingLimitedFormat
  : {
      id: 'limited',
      name: 'Limited',
      description: 'Point budget - each part has a point value.',
      minBeys: 1,
      maxBeys: 10,
      rules: [
        { type: 'noRepeatParts' },
        { type: 'pointBudget', default: existingLimitedFormat.maxPoints ?? 17, userAdjustable: true },
      ],
    };
delete limitedFormat.maxPoints;
delete limitedFormat.partPoints;
writeFileSync(LIMITED_FORMAT_PATH, JSON.stringify(limitedFormat, null, 2) + '\n', 'utf-8');
writeFileSync(PART_POINTS_PATH, JSON.stringify(partPoints, null, 2) + '\n', 'utf-8');
console.log(`Written: ${LIMITED_FORMAT_PATH}`);
console.log(`Written: ${PART_POINTS_PATH} (${Object.keys(partPoints).length} parts)`);
