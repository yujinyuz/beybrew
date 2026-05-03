# Blade Integrated Ratchet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support BULLETGRIFFON (UX-19), a blade with a physically integrated ratchet that auto-fills and locks the ratchet selector, mirroring the existing "Ratchet Integrated Bit" (Turbo) pattern in reverse.

**Architecture:** The data pipeline stamps an `integratedRatchet` field on the blade entry and injects a synthetic zero-stat ratchet entry. Constants expose `BLADE_INTEGRATED_RATCHETS` / `RATCHET_TO_BLADE` maps and filter integrated ratchets out of the selectable pool. The hook auto-fills/clears the ratchet on blade change; the UI disables the ratchet selector.

**Tech Stack:** Node.js (data generator), React + Vite, Vitest (tests), react-select (dropdown)

---

### Task 1: Add BULLETGRIFFON override to parts-overrides.json

**Files:**
- Modify: `src/data/parts-overrides.json`

- [ ] **Step 1: Add the BULLETGRIFFON entry to the blades section**

Open `src/data/parts-overrides.json`. The file starts with `"blades": {`. Add BULLETGRIFFON as the first entry in the blades object (after line 2, before "METEORDRAGOON"):

```json
"BULLETGRIFFON": {
    "_integratedRatchet": "RATCHET-integrated BLADE",
    "image": "BladeBulletGriffon.png",
    "_source": [
        "UX-19 BULLETGRIFFONH"
    ],
    "_description": "A BLADE with an integrated RATCHET mechanism. During battle, it separates into a 'BULLET' and the 'MAIN UNIT'."
},
```

- [ ] **Step 2: Verify JSON is valid**

```bash
node -e "require('./src/data/parts-overrides.json'); console.log('valid')"
```

Expected output: `valid`

- [ ] **Step 3: Commit**

```bash
git add src/data/parts-overrides.json
git commit -m "data: add BULLETGRIFFON blade override with _integratedRatchet"
```

---

### Task 2: Update generate_parts.js to handle `_integratedRatchet`

**Files:**
- Modify: `scripts/generate_parts.js`

- [ ] **Step 1: Stamp `integratedRatchet` onto blade entries**

In `makeBladeEntry` (around line 183), after the `if (override.spinType)` line, add:

```js
  if (override.spinType) entry.spinType = override.spinType;
  if (override._integratedRatchet) entry.integratedRatchet = override._integratedRatchet;
  const src = toSource(override._source);
```

- [ ] **Step 2: Add `makeBladeIntegratedRatchetEntry` function**

After `makeIntegratedRatchetEntry` (around line 330), add:

```js
function makeBladeIntegratedRatchetEntry(name) {
  return {
    name, altname: '',
    attack: 0, defense: 0, stamina: 0,
  };
}
```

- [ ] **Step 3: Inject blade-integrated ratchets into the ratchets array**

Find the ratchets assembly block (around line 386):

```js
const integratedRatchets = Object.entries(overrides.ratchets)
  .filter(([, ov]) => '_integratedBit' in ov)
  .map(([name, ov]) => makeIntegratedRatchetEntry(name, ov));
const ratchets = [
  ...integratedRatchets,
  ...processEntries(beydata.ratchets, overrides.ratchets).map(e => makeRatchetEntry(e, e._override ?? {})),
];
```

Replace with:

```js
const integratedRatchets = Object.entries(overrides.ratchets)
  .filter(([, ov]) => '_integratedBit' in ov)
  .map(([name, ov]) => makeIntegratedRatchetEntry(name, ov));
const bladeIntegratedRatchets = Object.values(bladeOverrides)
  .filter(ov => ov._integratedRatchet)
  .map(ov => makeBladeIntegratedRatchetEntry(ov._integratedRatchet));
const ratchets = [
  ...integratedRatchets,
  ...bladeIntegratedRatchets,
  ...processEntries(beydata.ratchets, overrides.ratchets).map(e => makeRatchetEntry(e, e._override ?? {})),
];
```

- [ ] **Step 4: Commit**

```bash
git add scripts/generate_parts.js
git commit -m "feat(generator): support _integratedRatchet on blade overrides"
```

---

### Task 3: Regenerate beyparts.json

**Files:**
- Modify: `src/data/beyparts.json` (generated)

- [ ] **Step 1: Run the generator**

```bash
node scripts/generate_parts.js
```

Expected output (numbers will differ but "RATCHET-integrated BLADE" must appear):
```
Written: src/data/beyparts.json
  blades: NNN, assist_blades: NNN, ratchets: NNN, bits: NNN, lock_chips: NNN, over_blades: NNN
Written: src/data/formats/limited.json (NNN parts)
```

- [ ] **Step 2: Verify BULLETGRIFFON blade has integratedRatchet**

```bash
node -e "
const d = require('./src/data/beyparts.json');
const bg = d.blades.find(b => b.name === 'Bulletgriffon');
console.log(JSON.stringify(bg, null, 2));
"
```

Expected: An object with `"integratedRatchet": "RATCHET-integrated BLADE"`.

- [ ] **Step 3: Verify integrated ratchet entry exists in ratchets**

```bash
node -e "
const d = require('./src/data/beyparts.json');
const r = d.ratchets.find(r => r.name === 'RATCHET-integrated BLADE');
console.log(JSON.stringify(r, null, 2));
"
```

Expected:
```json
{
  "name": "RATCHET-integrated BLADE",
  "altname": "",
  "attack": 0,
  "defense": 0,
  "stamina": 0
}
```

- [ ] **Step 4: Commit**

```bash
git add src/data/beyparts.json src/data/formats/limited.json
git commit -m "data: regenerate beyparts.json with BULLETGRIFFON integrated ratchet"
```

---

### Task 4: Write failing tests for constants maps

**Files:**
- Modify: `src/randomize.test.js`

- [ ] **Step 1: Add failing tests for BLADE_INTEGRATED_RATCHETS and RATCHETS filtering**

In `src/randomize.test.js`, add a new import at the top:

```js
import { describe, it, expect } from 'vitest'
import { BEYBLADE_DB, ASSIST_BLADES, LOCK_CHIPS, getFormat, RATCHET_INTEGRATED_BITS, BLADE_INTEGRATED_RATCHETS, RATCHET_TO_BLADE, RATCHETS } from './constants'
```

Then add a new describe block at the end of the file:

```js
describe('blade integrated ratchets', () => {
  it('BLADE_INTEGRATED_RATCHETS maps Bulletgriffon to its integrated ratchet', () => {
    expect(BLADE_INTEGRATED_RATCHETS['Bulletgriffon']).toBe('RATCHET-integrated BLADE')
  })

  it('RATCHET_TO_BLADE maps the integrated ratchet back to Bulletgriffon', () => {
    expect(RATCHET_TO_BLADE['RATCHET-integrated BLADE']).toBe('Bulletgriffon')
  })

  it('RATCHETS does not include integrated ratchets', () => {
    const integratedRatchetNames = Object.values(BLADE_INTEGRATED_RATCHETS)
    integratedRatchetNames.forEach(name => {
      expect(RATCHETS).not.toContain(name)
    })
  })

  it('BEYBLADE_DB contains the integrated ratchet for stat lookup', () => {
    expect(BEYBLADE_DB['RATCHET-integrated BLADE']).toBeDefined()
    expect(BEYBLADE_DB['RATCHET-integrated BLADE'].attack).toBe(0)
  })

  it('blade integrated ratchets always pair with their integrated ratchet during randomization', () => {
    const standardFormat = getFormat('standard')
    for (let i = 0; i < 50; i++) {
      const result = randomizeBeyblades(3, standardFormat, {})
      result.forEach(combo => {
        const pairedRatchet = BLADE_INTEGRATED_RATCHETS[combo.blade]
        if (pairedRatchet) {
          expect(combo.ratchet).toBe(pairedRatchet)
        }
      })
    }
  })

  it('integrated ratchet does not appear in combos that use a different blade', () => {
    const standardFormat = getFormat('standard')
    const integratedRatchetNames = new Set(Object.values(BLADE_INTEGRATED_RATCHETS))
    for (let i = 0; i < 50; i++) {
      const result = randomizeBeyblades(3, standardFormat, {})
      result.forEach(combo => {
        if (!BLADE_INTEGRATED_RATCHETS[combo.blade]) {
          expect(integratedRatchetNames.has(combo.ratchet)).toBe(false)
        }
      })
    }
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun run test
```

Expected: Tests in `blade integrated ratchets` describe block fail with errors like `BLADE_INTEGRATED_RATCHETS is not exported` or `Cannot read properties of undefined`.

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/randomize.test.js
git commit -m "test: add failing tests for blade integrated ratchet constants and randomizer"
```

---

### Task 5: Implement constants.js changes

**Files:**
- Modify: `src/constants.js`

- [ ] **Step 1: Add BLADE_INTEGRATED_RATCHETS and RATCHET_TO_BLADE, filter RATCHETS**

The current `constants.js` has this structure (lines 24–33):
```js
export const RATCHETS = BeyParts.ratchets.map((item) => {
  let itemName = item?.altname || item.name;
  BEYBLADE_DB[itemName] = { ...item };
  return itemName;
});
export const BITS = BeyParts.bits.map((item) => {
```

Replace just the RATCHETS block with:

```js
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
```

- [ ] **Step 2: Run tests**

```bash
bun run test
```

Expected: All `blade integrated ratchets` tests pass except the randomizer tests (those need Task 7).

- [ ] **Step 3: Commit**

```bash
git add src/constants.js
git commit -m "feat(constants): add BLADE_INTEGRATED_RATCHETS and RATCHET_TO_BLADE maps, filter integrated ratchets from RATCHETS"
```

---

### Task 6: Update useBeybladeDeck.js

**Files:**
- Modify: `src/hooks/useBeybladeDeck.js`

- [ ] **Step 1: Import new maps**

At the top of `src/hooks/useBeybladeDeck.js`, the import from `'../constants'` currently reads:

```js
import { BEYBLADE_DB, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET, getFormat, DEFAULT_FORMAT_ID } from '../constants';
```

Change to:

```js
import { BEYBLADE_DB, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET, BLADE_INTEGRATED_RATCHETS, RATCHET_TO_BLADE, getFormat, DEFAULT_FORMAT_ID } from '../constants';
```

- [ ] **Step 2: Add blade-change handling in handlePartChange**

Find the blade handling block in `handlePartChange` (around line 87):

```js
    if (partType === 'blade' && !BEYBLADE_DB[value]?.fourPartCX) {
      newBeyblades[index].overBlade = '';
    }
```

Replace with:

```js
    if (partType === 'blade') {
      if (!BEYBLADE_DB[value]?.fourPartCX) {
        newBeyblades[index].overBlade = '';
      }
      const integratedRatchet = BLADE_INTEGRATED_RATCHETS[value];
      if (integratedRatchet) {
        newBeyblades[index].ratchet = integratedRatchet;
      } else if (RATCHET_TO_BLADE[newBeyblades[index].ratchet]) {
        newBeyblades[index].ratchet = '';
      }
    }
```

- [ ] **Step 3: Run tests (tests don't cover hook logic directly, but existing tests should still pass)**

```bash
bun run test
```

Expected: All previously passing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useBeybladeDeck.js
git commit -m "feat(hook): auto-fill and clear ratchet when selecting blade with integrated ratchet"
```

---

### Task 7: Update randomize.js

**Files:**
- Modify: `src/randomize.js`

- [ ] **Step 1: Import BLADE_INTEGRATED_RATCHETS**

At the top of `src/randomize.js`, the import currently reads:

```js
import { BLADES, ASSIST_BLADES, RATCHETS, BITS, LOCK_CHIPS, OVER_BLADES, BEYBLADE_DB, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET } from './constants';
```

Change to:

```js
import { BLADES, ASSIST_BLADES, RATCHETS, BITS, LOCK_CHIPS, OVER_BLADES, BEYBLADE_DB, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET, BLADE_INTEGRATED_RATCHETS } from './constants';
```

- [ ] **Step 2: Switch to counter-based ratchet selection in buildCombos**

Find the `buildCombos` function. Currently the ratchets pool uses index-based selection (`ratchets[i]`) and `bitIdx` is used as a counter. The relevant section (around lines 52–86) looks like:

```js
  const ratchets = shuffle(RATCHETS.filter(r => {
    if (!allowed(r, 'ratchet', used, format)) return false;
    const paired = RATCHET_INTEGRATED_BITS[r];
    return !paired || allowed(paired, 'bit', used, format);
  }));
  const bits = shuffle(BITS.filter(b => !BIT_TO_RATCHET[b] && allowed(b, 'bit', used, format)));
  ...
  let bitIdx = 0;
  let assistIdx = 0;
  let overBladeIdx = 0;

  for (let i = 0; i < count; i++) {
    const blade = blades[i] || '';
    const ratchet = ratchets[i] || '';
    const integratedBit = RATCHET_INTEGRATED_BITS[ratchet];
    const bit = integratedBit || bits[bitIdx++] || '';
```

Replace with (add `ratchetIdx` counter and blade-integrated ratchet check):

```js
  const ratchets = shuffle(RATCHETS.filter(r => {
    if (!allowed(r, 'ratchet', used, format)) return false;
    const paired = RATCHET_INTEGRATED_BITS[r];
    return !paired || allowed(paired, 'bit', used, format);
  }));
  const bits = shuffle(BITS.filter(b => !BIT_TO_RATCHET[b] && allowed(b, 'bit', used, format)));
  ...
  let bitIdx = 0;
  let ratchetIdx = 0;
  let assistIdx = 0;
  let overBladeIdx = 0;

  for (let i = 0; i < count; i++) {
    const blade = blades[i] || '';
    const bladeRatchet = BLADE_INTEGRATED_RATCHETS[blade];
    const ratchet = bladeRatchet || ratchets[ratchetIdx++] || '';
    const integratedBit = RATCHET_INTEGRATED_BITS[ratchet];
    const bit = integratedBit || bits[bitIdx++] || '';
```

- [ ] **Step 3: Run all tests**

```bash
bun run test
```

Expected: All tests pass, including the new `blade integrated ratchets` describe block.

- [ ] **Step 4: Commit**

```bash
git add src/randomize.js
git commit -m "feat(randomize): use counter-based ratchet selection to support blade integrated ratchets"
```

---

### Task 8: Add `isDisabled` prop to PartSelector

**Files:**
- Modify: `src/PartSelector.jsx`

- [ ] **Step 1: Accept and pass through `isDisabled`**

Find the `PartSelector` function signature (line 204):

```js
function PartSelector({ label, options, value, onChange, slot, partsUsed, format, showLineBadge = false, modeIndex = 0 }) {
```

Change to:

```js
function PartSelector({ label, options, value, onChange, slot, partsUsed, format, showLineBadge = false, modeIndex = 0, isDisabled = false }) {
```

- [ ] **Step 2: Pass `isDisabled` to the label and Select**

Find the label element (line 216):

```js
      <label
        className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}
      >
        {label}
      </label>
```

Change to:

```js
      <label
        className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}
      >
        {label}{isDisabled && <span style={{ marginLeft: '6px', fontSize: '9px', opacity: 0.6, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(integrated)</span>}
      </label>
```

Find the `<Select` component (line 222):

```js
      <Select
        key={`${value || ''}-${modeIndex}`}
        name={label}
        styles={selectStyles}
        onChange={(e) => onChange(e.value)}
        value={defaultValue}
        options={flatOptions}
        isOptionDisabled={isOptionDisabled}
```

Change to:

```js
      <Select
        key={`${value || ''}-${modeIndex}`}
        name={label}
        styles={selectStyles}
        onChange={(e) => onChange(e.value)}
        value={defaultValue}
        options={flatOptions}
        isOptionDisabled={isOptionDisabled}
        isDisabled={isDisabled}
```

- [ ] **Step 3: Update PropTypes**

Find the PropTypes declaration (line 294):

```js
PartSelector.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  slot: PropTypes.string.isRequired,
  partsUsed: PropTypes.arrayOf(PropTypes.string).isRequired,
  format: PropTypes.object.isRequired,
  showLineBadge: PropTypes.bool,
  modeIndex: PropTypes.number,
};
```

Change to:

```js
PartSelector.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  slot: PropTypes.string.isRequired,
  partsUsed: PropTypes.arrayOf(PropTypes.string).isRequired,
  format: PropTypes.object.isRequired,
  showLineBadge: PropTypes.bool,
  modeIndex: PropTypes.number,
  isDisabled: PropTypes.bool,
};
```

- [ ] **Step 4: Commit**

```bash
git add src/PartSelector.jsx
git commit -m "feat(ui): add isDisabled prop to PartSelector"
```

---

### Task 9: Wire up disabled ratchet in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Import BLADE_INTEGRATED_RATCHETS**

Find the constants import in `src/App.jsx` (around line 21):

```js
import {
  BLADES,
  ASSIST_BLADES,
  OVER_BLADES,
  RATCHETS,
  BITS,
  LOCK_CHIPS,
  BUILT_IN_FORMATS,
  BEYBLADE_DB,
  CURRENT_PATCH,
  getLineColor,
} from './constants';
```

Change to:

```js
import {
  BLADES,
  ASSIST_BLADES,
  OVER_BLADES,
  RATCHETS,
  BITS,
  LOCK_CHIPS,
  BUILT_IN_FORMATS,
  BEYBLADE_DB,
  BLADE_INTEGRATED_RATCHETS,
  CURRENT_PATCH,
  getLineColor,
} from './constants';
```

- [ ] **Step 2: Pass `isDisabled` to the ratchet PartSelector**

Find the ratchet PartSelector in the combo loop (around line 929):

```jsx
                <PartSelector
                  label="Ratchet"
                  options={RATCHETS}
                  value={beyblades[index]?.ratchet}
                  onChange={(value) => handlePartChange(index, 'ratchet', value)}
                  partsUsed={partsUsed}
                  slot="ratchet"
                  format={currentFormat}
                />
```

Change to:

```jsx
                <PartSelector
                  label="Ratchet"
                  options={RATCHETS}
                  value={beyblades[index]?.ratchet}
                  onChange={(value) => handlePartChange(index, 'ratchet', value)}
                  partsUsed={partsUsed}
                  slot="ratchet"
                  format={currentFormat}
                  isDisabled={!!BLADE_INTEGRATED_RATCHETS[beyblades[index]?.blade]}
                />
```

- [ ] **Step 3: Run lint**

```bash
bun run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat(ui): disable ratchet selector when blade has integrated ratchet"
```

---

### Task 10: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
bun dev
```

- [ ] **Step 2: Verify BULLETGRIFFON behavior**

1. Select BULLETGRIFFON as the blade for a combo.
2. Confirm the Ratchet dropdown shows `(integrated)` label hint and is disabled.
3. Confirm the ratchet value shows "RATCHET-integrated BLADE".
4. Change the blade to something else — confirm the ratchet field clears.
5. Select a normal ratchet, then change the blade to BULLETGRIFFON — confirm ratchet is replaced with the integrated value.

- [ ] **Step 3: Verify randomizer**

1. Click Randomize multiple times.
2. Confirm that if BULLETGRIFFON appears in any combo slot, its ratchet is "RATCHET-integrated BLADE".
3. Confirm "RATCHET-integrated BLADE" does not appear in combos that don't use BULLETGRIFFON.

- [ ] **Step 4: Verify Turbo still works**

1. Select "Turbo (Ratchet Integrated Bit)" as ratchet — bit should auto-fill as "Turbo".
2. Select "Turbo" as bit — ratchet should auto-fill.
3. Confirm neither behavior is broken by the new blade integrated ratchet logic.

- [ ] **Step 5: Run final test suite**

```bash
bun run test
```

Expected: All tests pass.
