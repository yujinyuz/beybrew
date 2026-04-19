# Format Data Separation Design

## Summary

Move `points` out of `beyparts.json` into a per-format data file. `points` is a Limited format rule, not an intrinsic part stat. The architecture should accommodate future formats with different rules (e.g., Balance/Attack/Defense composition constraints).

## Architecture

**Core principle:** `beyparts.json` contains only intrinsic part properties (attack, defense, stamina, type, image, line, spinType). Format-specific data lives in `src/data/formats/<format>.json`.

### New file: `src/data/formats/limited.json`

```json
{
  "maxPoints": 17,
  "partPoints": {
    "Dran Sword": 1,
    "Hells Scythe": 2,
    ...
  }
}
```

### Future format example: `src/data/formats/bad.json`

```json
{
  "maxBeyblades": 3,
  "requiredTypes": ["attack", "defense", "balance"]
}
```

## Data Flow

`parts-overrides.json` keeps `points` as the source of truth for overrides. `generate_parts.js` reads points from overrides, writes `beyparts.json` (without points) and `src/data/formats/limited.json` (partPoints map + preserved maxPoints).

## constants.js Changes

- Import `LimitedFormat` from `./data/formats/limited.json`
- Export `FORMAT_DATA = { limited: LimitedFormat }` for future extensibility
- Export `getPartPoints(partName)` helper reading from `FORMAT_DATA.limited.partPoints`
- Keep `DEFAULT_LIMITED_MAX_POINTS` as re-export of `FORMAT_DATA.limited.maxPoints` (backward compat)
- `BEYBLADE_DB` entries no longer have `.points`

## Call Site Changes

Replace all `BEYBLADE_DB[part]?.points` usages with `getPartPoints(part)`:
- `src/Beyblade.jsx`
- `src/PartSelector.jsx`
- `src/hooks/useBeybladeDeck.js`
- `src/randomize.js`
- `src/randomize.test.js`

## Generator Changes (`scripts/generate_parts.js`)

- Strip `points` from all `make*Entry` functions
- Collect `{ [partName]: points }` map during generation
- Write `src/data/formats/limited.json` preserving existing `maxPoints` (default 17)
