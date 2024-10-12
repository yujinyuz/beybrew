import BeyParts from "./data/beyparts";

export const POINTS_MAP = {};
export const BEYBLADE_DB = {};
export const BLADES = BeyParts.blades.map((item) => {
  POINTS_MAP[item.name] = item.points;
  BEYBLADE_DB[item.name] = { ...item };
  return item.name;
});
export const RATCHETS = BeyParts.ratchets.map((item) => {
  POINTS_MAP[item.name] = item.points;
  BEYBLADE_DB[item.name] = { ...item };
  return item.name;
});
export const BITS = BeyParts.bits.map((item) => {
  POINTS_MAP[item.name] = item.points;
  BEYBLADE_DB[item.name] = { ...item };
  return item.name;
});

export const LIMITED_FORMAT = "limited";
export const STANDARD_FORMAT = "standard";

export const DEFAULT_LIMITED_MAX_POINTS = 17;
