import BeyParts from "./data/beyparts";

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

export const LIMITED_FORMAT = "limited";
export const STANDARD_FORMAT = "standard";
export const DEFAULT_FORMAT = STANDARD_FORMAT;

export const DEFAULT_LIMITED_MAX_POINTS = 17;
export const CURRENT_PATCH = "v2025.11";
