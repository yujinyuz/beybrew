# Part Modes Design

**Date:** 2026-04-18
**Status:** Approved

## Problem

Some parts (blade, assist blade, bit) are physically reconfigurable — the player can change their orientation or assembly to alter the part's stats. Currently these are modelled as separate duplicate entries in `beyparts.js` using an `altname: "Name (Mode Change)"` hack. This is wrong because:

- One physical part appears as two distinct selectable items in the dropdown
- Standard format deduplication requires a workaround (`split('(')[0].trim()`) in `PartSelector.jsx`
- Adding new mode-capable parts requires duplicating entries rather than extending one

## Solution: `modes` array on the part object

Mode-capable parts get a `modes` array. Non-mode parts are untouched.

### Data shape

```js
{
  name: "Eclipse",
  points: 1,
  type: "balance",
  line: "CX",
  image: "MainBladeEclipse_(Upper_Mode).png",  // fallback for selector thumbnail
  modes: [
    { label: "Upper", attack: 30, defense: 20, stamina: 10 },
    { label: "Lower", attack: 20, defense: 30, stamina: 10 },
  ]
}
```

Rules:
- `points` never varies between modes — it stays on the top-level object
- Top-level `attack/defense/stamina` are removed from mode-capable parts (all stats live in `modes`)
- Top-level `image` stays as a fallback for the PartSelector thumbnail
- Each mode may optionally include an `image` override
- Any stat field may vary per mode: `attack`, `defense`, `stamina`, `xDash`, `burstResistance`, `image`
- Mode labels are custom strings defined per part (e.g. "Upper"/"Lower", "Attack"/"Defense")

### Parts with modes (current)

| Part | Category | Mode labels |
|------|----------|-------------|
| Scorpio Spear | blade | to be set in override (research actual game mode names) |
| Eclipse | mainBlade (CX) | Upper / Lower |
| Turn | assistBlade | to be set in override (research actual game mode names) |
| Dual | assistBlade | Upper / Lower |

## Pipeline

Data flows: `parts-overrides.json` → `generate_parts.py` → `beyparts.js`

### `parts-overrides.json`

Add `modes` array to each mode-capable part's override entry:

```json
"ECLIPSE": {
  "name": "Eclipse",
  "image": "MainBladeEclipse_(Upper_Mode).png",
  "points": 1,
  "modes": [
    { "label": "Upper", "attack": 30, "defense": 20, "stamina": 10 },
    { "label": "Lower", "attack": 20, "defense": 30, "stamina": 10 }
  ]
}
```

Same pattern for `SCORPIOSPEAR`, `T` (Turn), `D` (Dual).

### `generate_parts.py`

Three changes:

1. **Serializer** — Extend `_js_val` / `_js_object` to handle lists and nested dicts so the `modes` array serializes to valid JS.

2. **`make_blade_entry` / `make_assist_blade_entry`** — When override has `modes`:
   - Include the `modes` array in the output object
   - Omit top-level `attack/defense/stamina`
   - Remove the `altname: "Name (Mode Change)"` logic for these parts

3. **`process_entries`** — When a part's override has `modes`, skip emitting that group's `_ModeChange` beydata entries as separate top-level entries (their stats are captured in the override's `modes` array).

## Stats resolution helper

Add `getStats` to `constants.js`:

```js
export function getStats(partName, modeIndex = 0) {
  const part = BEYBLADE_DB[partName];
  if (!part) return {};
  if (part.modes) return { ...part, ...part.modes[modeIndex] };
  return part;
}
```

All stat reads in `Beyblade.jsx` and `ExportCard` go through `getStats`. `points` reads continue to use `BEYBLADE_DB[partName]?.points` directly since points never vary by mode.

## State & URL

### Beyblade state shape

```js
{
  blade: '', bladeMode: 0,
  assistBlade: '', assistBladeMode: 0,
  ratchet: '',
  bit: '', bitMode: 0,
  lockChip: ''
}
```

`handlePartChange` in `useBeybladeDeck.js` already handles arbitrary keys — no signature change needed. When a part slot changes (e.g. `blade`), reset its mode index to `0`.

### URL encoding

Current: `blade,ratchet,bit,assistBlade,lockChip`
New: `blade,ratchet,bit,assistBlade,lockChip,bladeMode,assistBladeMode,bitMode`

Mode indices are appended at the end and default to `0` when absent. **All existing shared URLs remain valid.**

## UI: ModeToggle component

New `src/ModeToggle.jsx` — pill-style toggle that appears below a PartSelector when `BEYBLADE_DB[partName]?.modes` exists.

```jsx
{BEYBLADE_DB[beyblades[index]?.blade]?.modes && (
  <ModeToggle
    modes={BEYBLADE_DB[beyblades[index].blade].modes}
    value={beyblades[index].bladeMode ?? 0}
    onChange={(i) => handlePartChange(index, 'bladeMode', i)}
  />
)}
```

Same pattern for `assistBlade → assistBladeMode` and `bit → bitMode`.

Visual style matches the existing Format toggle (active pill: `--color-accent-dim` highlight, inactive: muted) — no new design tokens needed.

## `Beyblade.jsx` & `ExportCard`

Receive new props `bladeMode`, `assistBladeMode`, `bitMode` (all default `0`). Replace direct `BEYBLADE_DB[part]?.stat` lookups with `getStats`:

```js
const bladeStats   = getStats(blade, bladeMode);
const assistStats  = getStats(assistBlade, assistBladeMode);
const ratchetStats = getStats(ratchet);
const bitStats     = getStats(bit, bitMode);

const attackTotal = (bladeStats.attack || 0) + (assistStats.attack || 0) + ...
```

## Cleanup

- The `altname || name` key logic in `constants.js` can stay as-is — it's harmless. What disappears is the duplicate mode-change entries in `beyparts.js`, so `BEYBLADE_DB` no longer has `"Eclipse (Mode Change)"` as a key at all.
- Remove the `split('(')[0].trim()` workaround in `PartSelector.jsx:103` used for `partsUsed` deduplication — no longer needed since mode-capable parts have a single name.
