# Blade Integrated Ratchet — Design Spec

**Date:** 2026-05-03
**Status:** Approved

## Background

BULLETGRIFFON (UX-19) is a blade with an integrated ratchet mechanism — the ratchet is physically part of the blade and cannot be swapped. This is the inverse of the existing "Ratchet Integrated Bit" (Turbo) pattern, where a ratchet contains a fixed bit.

The existing Turbo pattern:
- Ratchet "Turbo (Ratchet Integrated Bit)" has `integratedBit: "Turbo"` in beyparts.json
- Selecting the ratchet auto-fills the bit; selecting the bit auto-fills the ratchet
- `RATCHET_INTEGRATED_BITS` and `BIT_TO_RATCHET` maps in constants.js
- Integrated bits are excluded from the standalone bits pool in randomize.js

The new pattern mirrors this but: blade → locks ratchet (with UX difference: ratchet selector is disabled, not just auto-filled).

## Approved Design

### Section 1 — Data Pipeline

**`src/data/parts-overrides.json` (blades section)**
Add BULLETGRIFFON with `_integratedRatchet`:
```json
"BULLETGRIFFON": {
  "_integratedRatchet": "RATCHET-integrated BLADE",
  "image": "BladeBulletGriffon.png"
}
```

**`scripts/generate_parts.js`**
1. `makeBladeEntry`: if `override._integratedRatchet` is set, stamp `integratedRatchet` onto the blade output object.
2. Add `makeBladeIntegratedRatchetEntry(name, override)` — mirrors `makeIntegratedRatchetEntry`, returns `{ name, altname: '', attack: 0, defense: 0, stamina: 0 }`.
3. In the ratchets assembly block: collect blade overrides with `_integratedRatchet` and prepend them to the ratchets array (before the regular ratchet entries).

**`src/data/beyparts.json` (generated)**
- BULLETGRIFFON blade entry gains `integratedRatchet: "RATCHET-integrated BLADE"`.
- New ratchet entry at the top: `{ name: "RATCHET-integrated BLADE", altname: "", attack: 0, defense: 0, stamina: 0 }`.

### Section 2 — Constants (`src/constants.js`)

Add two new exports, mirroring the existing Turbo maps:

```js
export const BLADE_INTEGRATED_RATCHETS = Object.fromEntries(
  BeyParts.blades
    .filter(b => b.integratedRatchet)
    .map(b => [b.name, b.integratedRatchet])
);
export const RATCHET_TO_BLADE = Object.fromEntries(
  Object.entries(BLADE_INTEGRATED_RATCHETS).map(([b, r]) => [r, b])
);
```

The `RATCHETS` export must exclude integrated ratchets (they must not appear in the dropdown). Filter them: add `.filter(item => !RATCHET_TO_BLADE[item.name ?? item.altname ?? ...])` — or flag the entry with a sentinel during generation and filter on that flag. Both `BEYBLADE_DB` and the ratchets array in beyparts.json still contain the integrated ratchet entry so stat lookup works.

### Section 3 — Hook (`src/hooks/useBeybladeDeck.js`)

Extend `handlePartChange` in the `blade` branch:

```js
if (partType === 'blade') {
  if (!BEYBLADE_DB[value]?.fourPartCX) newBeyblades[index].overBlade = '';

  const integratedRatchet = BLADE_INTEGRATED_RATCHETS[value];
  if (integratedRatchet) {
    newBeyblades[index].ratchet = integratedRatchet;
  } else if (RATCHET_TO_BLADE[newBeyblades[index].ratchet]) {
    newBeyblades[index].ratchet = '';
  }
}
```

Symmetric with the existing `ratchet` handler for `RATCHET_INTEGRATED_BITS`.

### Section 4 — UI (`src/App.jsx` + `src/PartSelector.jsx`)

`PartSelector.jsx`: add an `isDisabled` prop and pass it to react-select's `isDisabled`. Add a visual hint on the label when disabled (e.g., a small lock icon or muted "(integrated)" text) so users understand the field is locked by the blade choice.

`App.jsx` ratchet selector:
```jsx
isDisabled={!!BLADE_INTEGRATED_RATCHETS[beyblades[index]?.blade]}
```

### Section 5 — Randomizer (`src/randomize.js`)

Switch from index-based (`ratchets[i]`) to counter-based (`ratchets[ratchetIdx++]`) to avoid consuming ratchet pool slots for blades that bring their own ratchet:

```js
let ratchetIdx = 0;
// inside loop:
const blade = blades[i] || '';
const bladeRatchet = BLADE_INTEGRATED_RATCHETS[blade];
const ratchet = bladeRatchet || ratchets[ratchetIdx++] || '';
```

`RATCHETS` already excludes integrated ratchets (they're not selectable), so the pool is clean.

## Files Changed

| File | Change |
|------|--------|
| `src/data/parts-overrides.json` | Add BULLETGRIFFON blade override with `_integratedRatchet` |
| `scripts/generate_parts.js` | Stamp `integratedRatchet` on blade; add `makeBladeIntegratedRatchetEntry`; inject into ratchets |
| `src/data/beyparts.json` | Regenerated output |
| `src/constants.js` | Add `BLADE_INTEGRATED_RATCHETS`, `RATCHET_TO_BLADE`; filter RATCHETS |
| `src/hooks/useBeybladeDeck.js` | Auto-fill + clear ratchet on blade change |
| `src/PartSelector.jsx` | Add `isDisabled` prop |
| `src/App.jsx` | Pass `isDisabled` to ratchet selector |
| `src/randomize.js` | Switch to counter-based ratchet selection |

## Non-Goals

- No UI changes to the bit selector (Turbo behavior unchanged).
- No changes to share URL encoding (ratchet name encodes as a normal string).
- Adding the BULLETGRIFFON image is handled separately via the fetch-part-images skill.
