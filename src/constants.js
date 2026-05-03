import BeyParts from "./data/beyparts.json";
import StandardFormat from "./data/formats/standard.json";
import LimitedFormat from "./data/formats/limited.json";
import BadFormat from "./data/formats/bad.json";
import DabFormat from "./data/formats/dab.json";
import BadLimitedFormat from "./data/formats/bad-limited.json";
import DabLimitedFormat from "./data/formats/dab-limited.json";
import AllAttackFormat from "./data/formats/all-attack.json";

export const BEYBLADE_DB = {};
export const BLADES = BeyParts.blades.map((item) => {
  let itemName = item?.altname || item.name;

  BEYBLADE_DB[itemName] = { ...item };
  return itemName;
});

export const ASSIST_BLADES = BeyParts.assist_blades.map((item) => {
  let itemName = item?.altname || item.name;
  BEYBLADE_DB[itemName] = { ...item };
  return itemName;
});

export const BLADE_INTEGRATED_RATCHETS = Object.fromEntries(
  BeyParts.blades
    .filter(b => b.integratedRatchet)
    .map(b => [(b?.altname || b.name), b.integratedRatchet])
);
export const RATCHET_TO_BLADE = Object.fromEntries(
  Object.entries(BLADE_INTEGRATED_RATCHETS).map(([b, r]) => [r, b])
);

export const RATCHETS = BeyParts.ratchets
  .map((item) => {
    let itemName = item?.altname || item.name;
    BEYBLADE_DB[itemName] = { ...item };
    return itemName;
  })
  .filter(name => !RATCHET_TO_BLADE[name]);
export const BITS = BeyParts.bits.map((item) => {
  let itemName = item?.altname || item.name;
  BEYBLADE_DB[itemName] = { ...item };
  return itemName;
});

export const LOCK_CHIPS = BeyParts.lock_chips.map((item) => {
  let itemName = item?.altname || item.name;
  BEYBLADE_DB[itemName] = { ...item };
  return itemName;
});

export const OVER_BLADES = BeyParts.over_blades.map((item) => {
  let itemName = item?.altname || item.name;
  BEYBLADE_DB[itemName] = { ...item };
  return itemName;
});

export const RATCHET_INTEGRATED_BITS = Object.fromEntries(
  BeyParts.ratchets
    .filter(r => r.integratedBit)
    .map(r => [r.name, r.integratedBit])
);
export const BIT_TO_RATCHET = Object.fromEntries(
  Object.entries(RATCHET_INTEGRATED_BITS).map(([r, b]) => [b, r])
);

export const BUILT_IN_FORMATS = [
  StandardFormat,
  LimitedFormat,
  BadFormat,
  DabFormat,
  BadLimitedFormat,
  DabLimitedFormat,
  AllAttackFormat,
];

export const DEFAULT_FORMAT_ID = 'standard';

export function getFormat(id) {
  return BUILT_IN_FORMATS.find(f => f.id === id) ?? StandardFormat;
}

export const CURRENT_PATCH = "v2025.11";

export function getPartImage(partName, modeIndex = 0) {
  return getStats(partName, modeIndex)?.image ?? null;
}

export function getStats(partName, modeIndex = 0) {
  const part = BEYBLADE_DB[partName];
  if (!part) return {};
  if (part.modes) {
    const modeData = part.modes[modeIndex] ?? part.modes[0];
    return { ...part, ...modeData };
  }
  return part;
}

export const LINE_BADGE = {
  BX: { label: 'BX', color: '#42a5f5' },
  UX: { label: 'UX', color: '#e65c00' },
  CX: { label: 'CX', color: '#c62828' },
};

export function getLineColor(blade) {
  const line = BEYBLADE_DB[blade]?.line;
  return LINE_BADGE[line]?.color ?? LINE_BADGE.BX.color;
}

export const LINE_LOGO = {
  BX: 'Basic Line Logo.png',
  UX: 'Unique Line Logo.png',
  CX: 'Custom Line Logo.png',
};

export function getLineLogo(blade) {
  const line = BEYBLADE_DB[blade]?.line;
  return LINE_LOGO[line] ?? LINE_LOGO.BX;
}

export function getSpinType(blade) {
  return BEYBLADE_DB[blade]?.spinType ?? 'right';
}
