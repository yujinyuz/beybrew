import BeyParts from "./data/beyparts.json";
import LimitedFormat from "./data/formats/limited.json";

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

export const RATCHETS = BeyParts.ratchets.map((item) => {
  let itemName = item?.altname || item.name;
  BEYBLADE_DB[itemName] = { ...item };
  return itemName;
});
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

export const LIMITED_FORMAT = "limited";
export const STANDARD_FORMAT = "standard";
export const DEFAULT_FORMAT = STANDARD_FORMAT;

export const FORMAT_DATA = { limited: LimitedFormat };
export const DEFAULT_LIMITED_MAX_POINTS = FORMAT_DATA.limited.maxPoints;

export function getPartPoints(partName) {
  return FORMAT_DATA.limited.partPoints[partName] ?? 0;
}
export const CURRENT_PATCH = "v2025.11";

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
