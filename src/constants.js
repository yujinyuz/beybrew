import BeyParts from "./data/beyparts";

export const BEYBLADE_DB = {};
export const BLADES = BeyParts.blades.map((item) => {
  BEYBLADE_DB[item.name] = { ...item };
  return item.name;
});
export const RATCHETS = BeyParts.ratchets.map((item) => {
  BEYBLADE_DB[item.name] = { ...item };
  return item.name;
});
export const BITS = BeyParts.bits.map((item) => {
  BEYBLADE_DB[item.name] = { ...item };
  return item.name;
});

export const LIMITED_FORMAT = "limited";
export const STANDARD_FORMAT = "standard";
export const DEFAULT_FORMAT = LIMITED_FORMAT;

export const DEFAULT_LIMITED_MAX_POINTS = 17;
