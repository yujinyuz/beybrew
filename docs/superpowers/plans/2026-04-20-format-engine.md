# Format Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded `standard`/`limited` string formats with an extensible, rules-array JSON format engine supporting 6 built-in formats and user-uploaded custom formats.

**Architecture:** Each format is a JSON file with a `rules` array of typed constraint objects. A central `formatEngine.js` evaluates rules into hard blocks (`isPartDisabled`) and soft violations (`evaluateFormat`). All existing format logic is replaced by this engine.

**Tech Stack:** React 18, Vite, no test framework (manual verification via dev server).

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/data/formats/part-points.json` | Shared part→points map (extracted from current limited.json) |
| Create | `src/data/formats/standard.json` | Standard format definition |
| Create | `src/data/formats/limited.json` | Limited format definition (replaces current) |
| Create | `src/data/formats/bad.json` | B.A.D format |
| Create | `src/data/formats/dab.json` | D.A.B format |
| Create | `src/data/formats/bad-limited.json` | B.A.D Limited format |
| Create | `src/data/formats/dab-limited.json` | D.A.B Limited format |
| Create | `src/lib/formatEngine.js` | Rule evaluator — `evaluateFormat`, `isPartDisabled`, `getPointBudget`, `getPartPoints` |
| Create | `src/components/FormatViolations.jsx` | Soft violation warning banner |
| Modify | `src/constants.js` | Replace string constants with format registry |
| Modify | `src/randomize.js` | Use format object instead of format string |
| Modify | `src/PartSelector.jsx` | Use `isPartDisabled` from engine; add `slot` prop |
| Modify | `src/hooks/useBeybladeDeck.js` | `currentFormat` as object; add `violations`, `formatUserValues` |
| Modify | `src/App.jsx` | New format selector UI; wire violations; custom format upload |

---

## Task 1: Extract Part Points Data

**Files:**
- Create: `src/data/formats/part-points.json`

The current `src/data/formats/limited.json` contains a large `partPoints` object at top level. Extract it into its own file. All point-budget formats share this data via `formatEngine.js`.

- [ ] **Step 1: Create part-points.json**

Read current `src/data/formats/limited.json`. Copy ONLY the `partPoints` value (the object keyed by part names) into a new file:

`src/data/formats/part-points.json` — the file should be the partPoints object directly, e.g.:
```json
{
  "Storm Spriggan": 1,
  "Dran Sword": 2,
  ...
}
```
Copy the entire `partPoints` value from the existing `limited.json`.

- [ ] **Step 2: Verify JSON is valid**
```bash
node -e "console.log(Object.keys(require('./src/data/formats/part-points.json')).length + ' parts')"
```
Expected: prints a number like `170 parts`

- [ ] **Step 3: Commit**
```bash
git add src/data/formats/part-points.json
git commit -m "chore(data): extract part points into shared file"
```

---

## Task 2: Create Format JSON Files

**Files:**
- Create: `src/data/formats/standard.json`
- Create: `src/data/formats/limited.json` (replace existing)
- Create: `src/data/formats/bad.json`
- Create: `src/data/formats/dab.json`
- Create: `src/data/formats/bad-limited.json`
- Create: `src/data/formats/dab-limited.json`

- [ ] **Step 1: Create standard.json**

`src/data/formats/standard.json`:
```json
{
  "id": "standard",
  "name": "Standard",
  "description": "No repeating parts across the deck.",
  "minBeys": 1,
  "maxBeys": 10,
  "rules": [
    { "type": "noRepeatParts" }
  ]
}
```

- [ ] **Step 2: Replace limited.json**

`src/data/formats/limited.json` (remove the old `maxPoints` top-level field and the `partPoints` map — they are no longer needed here):
```json
{
  "id": "limited",
  "name": "Limited",
  "description": "Point budget — each part has a point value.",
  "minBeys": 1,
  "maxBeys": 10,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "pointBudget", "default": 17, "userAdjustable": true }
  ]
}
```

- [ ] **Step 3: Create bad.json**

`src/data/formats/bad.json`:
```json
{
  "id": "bad",
  "name": "B.A.D",
  "description": "3 beys — deck must include at least one Attack, Defense, and Balance blade AND bit (no pairing required).",
  "minBeys": 3,
  "maxBeys": 3,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "requireTypeDistribution", "slot": "blade", "types": ["attack", "defense", "balance"] },
    { "type": "requireTypeDistribution", "slot": "bit",   "types": ["attack", "defense", "balance"] }
  ]
}
```

- [ ] **Step 4: Create dab.json**

`src/data/formats/dab.json`:
```json
{
  "id": "dab",
  "name": "D.A.B",
  "description": "3 beys — each combo must pair matching blade and bit type (Defense+Defense, Attack+Attack, Balance+Balance).",
  "minBeys": 3,
  "maxBeys": 3,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "requireTypeDistribution", "slot": "blade", "types": ["attack", "defense", "balance"] },
    { "type": "requireComboTypePairing", "slot1": "blade", "slot2": "bit" }
  ]
}
```

- [ ] **Step 5: Create bad-limited.json**

`src/data/formats/bad-limited.json`:
```json
{
  "id": "bad-limited",
  "name": "B.A.D Limited",
  "description": "B.A.D rules with a point budget.",
  "minBeys": 3,
  "maxBeys": 3,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "requireTypeDistribution", "slot": "blade", "types": ["attack", "defense", "balance"] },
    { "type": "requireTypeDistribution", "slot": "bit",   "types": ["attack", "defense", "balance"] },
    { "type": "pointBudget", "default": 17, "userAdjustable": true }
  ]
}
```

- [ ] **Step 6: Create dab-limited.json**

`src/data/formats/dab-limited.json`:
```json
{
  "id": "dab-limited",
  "name": "D.A.B Limited",
  "description": "D.A.B rules with a point budget.",
  "minBeys": 3,
  "maxBeys": 3,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "requireTypeDistribution", "slot": "blade", "types": ["attack", "defense", "balance"] },
    { "type": "requireComboTypePairing", "slot1": "blade", "slot2": "bit" },
    { "type": "pointBudget", "default": 17, "userAdjustable": true }
  ]
}
```

- [ ] **Step 7: Verify all JSON files parse**
```bash
node -e "
['standard','limited','bad','dab','bad-limited','dab-limited'].forEach(id => {
  const f = require('./src/data/formats/' + id + '.json');
  console.log(f.id, '— rules:', f.rules.length);
});
"
```
Expected output (one line per format):
```
standard — rules: 1
limited — rules: 2
bad — rules: 3
dab — rules: 3
bad-limited — rules: 4
dab-limited — rules: 4
```

- [ ] **Step 8: Commit**
```bash
git add src/data/formats/
git commit -m "feat(data): add format JSON files for standard, limited, BAD, DAB variants"
```

---

## Task 3: Create formatEngine.js

**Files:**
- Create: `src/lib/formatEngine.js`

The engine imports `BEYBLADE_DB` from constants and `DEFAULT_PART_POINTS` from part-points.json. It does NOT import the format registry (that would be circular).

- [ ] **Step 1: Create src/lib/formatEngine.js**

```js
import { BEYBLADE_DB } from '../constants';
import DEFAULT_PART_POINTS from '../data/formats/part-points.json';

function getPartsFromDeck(deck) {
  const parts = new Set();
  deck.forEach(bey => {
    if (bey.blade) parts.add(bey.blade);
    if (bey.ratchet) parts.add(bey.ratchet);
    if (bey.bit) parts.add(bey.bit);
    if (bey.assistBlade) parts.add(bey.assistBlade);
    if (bey.lockChip) parts.add(bey.lockChip);
    if (bey.overBlade) parts.add(bey.overBlade);
  });
  return [...parts];
}

export function getPartPoints(partName, format) {
  const points = format?.partPoints ?? DEFAULT_PART_POINTS;
  return points[partName] ?? 0;
}

export function getPointBudget(format, userValues = {}) {
  const rule = format?.rules?.find(r => r.type === 'pointBudget');
  if (!rule) return 0;
  return userValues.pointBudget ?? rule.default ?? 0;
}

export function evaluateFormat(deck, format, userValues = {}) {
  if (!format?.rules) return { violations: [] };
  const violations = [];
  const activeDeck = deck.filter(bey => bey.blade || bey.ratchet || bey.bit);

  for (const rule of format.rules) {
    switch (rule.type) {
      case 'pointBudget': {
        const budget = getPointBudget(format, userValues);
        const parts = getPartsFromDeck(activeDeck);
        const total = parts.reduce((sum, part) => sum + getPartPoints(part, format), 0);
        if (total > budget) {
          violations.push({ rule: 'pointBudget', message: `Points over limit: ${total}/${budget}` });
        }
        break;
      }
      case 'requirePartType': {
        const { slot, typeValue, min, max } = rule;
        const count = activeDeck.filter(bey => {
          const partName = bey[slot];
          return partName && BEYBLADE_DB[partName]?.type === typeValue;
        }).length;
        if (min !== undefined && count < min) {
          violations.push({ rule: 'requirePartType', message: `Need at least ${min} ${typeValue} ${slot}(s) — have ${count}` });
        }
        if (max !== undefined && count > max) {
          violations.push({ rule: 'requirePartType', message: `At most ${max} ${typeValue} ${slot}(s) allowed — have ${count}` });
        }
        break;
      }
      case 'requireTypeDistribution': {
        const { slot, types } = rule;
        for (const typeValue of types) {
          const count = activeDeck.filter(bey => {
            const partName = bey[slot];
            return partName && BEYBLADE_DB[partName]?.type === typeValue;
          }).length;
          if (count < 1) {
            violations.push({ rule: 'requireTypeDistribution', message: `Need at least 1 ${typeValue} ${slot}` });
          }
        }
        break;
      }
      case 'requireComboTypePairing': {
        const { slot1, slot2 } = rule;
        activeDeck.forEach((bey, i) => {
          const part1 = bey[slot1];
          const part2 = bey[slot2];
          if (!part1 || !part2) return;
          const type1 = BEYBLADE_DB[part1]?.type;
          const type2 = BEYBLADE_DB[part2]?.type;
          if (type1 && type2 && type1 !== type2) {
            violations.push({
              rule: 'requireComboTypePairing',
              message: `Combo ${i + 1}: ${slot1} type (${type1}) doesn't match ${slot2} type (${type2})`,
            });
          }
        });
        break;
      }
      case 'requireComboWith': {
        const { conditions } = rule;
        const satisfied = activeDeck.some(bey =>
          conditions.every(({ slot, typeValue }) => {
            const partName = bey[slot];
            return partName && BEYBLADE_DB[partName]?.type === typeValue;
          })
        );
        if (!satisfied) {
          const desc = conditions.map(c => `${c.typeValue} ${c.slot}`).join(' + ');
          violations.push({ rule: 'requireComboWith', message: `Deck needs at least one combo with ${desc}` });
        }
        break;
      }
    }
  }

  return { violations };
}

export function isPartDisabled(partName, slot, partsUsed, format) {
  if (!format?.rules || !partName) return false;
  for (const rule of format.rules) {
    switch (rule.type) {
      case 'noRepeatParts':
        if (partsUsed.includes(partName)) return true;
        break;
      case 'banPart':
        if (rule.names?.includes(partName)) return true;
        break;
      case 'allowedParts':
        if (rule.slot === slot && !rule.names?.includes(partName)) return true;
        break;
      case 'allowedPartTypes':
        if (rule.slot === slot) {
          const partType = BEYBLADE_DB[partName]?.type;
          if (partType && !rule.types?.includes(partType)) return true;
        }
        break;
    }
  }
  return false;
}
```

- [ ] **Step 2: Verify no import errors**
```bash
npm run build 2>&1 | head -20
```
Expected: build succeeds or only pre-existing errors (formatEngine itself is not yet imported anywhere).

- [ ] **Step 3: Commit**
```bash
git add src/lib/formatEngine.js
git commit -m "feat(engine): add format rule evaluator"
```

---

## Task 4: Update constants.js

**Files:**
- Modify: `src/constants.js`

Remove the old format string constants (`LIMITED_FORMAT`, `STANDARD_FORMAT`, `DEFAULT_FORMAT`, `FORMAT_DATA`, `DEFAULT_LIMITED_MAX_POINTS`, `getPartPoints`). Add `BUILT_IN_FORMATS`, `getFormat`, `DEFAULT_FORMAT_ID`.

- [ ] **Step 1: Replace the format-related section in constants.js**

Remove these lines from `src/constants.js`:
```js
import LimitedFormat from "./data/formats/limited.json";
// ...
export const LIMITED_FORMAT = "limited";
export const STANDARD_FORMAT = "standard";
export const DEFAULT_FORMAT = STANDARD_FORMAT;
export const FORMAT_DATA = { limited: LimitedFormat };
export const DEFAULT_LIMITED_MAX_POINTS = FORMAT_DATA.limited.maxPoints;
export function getPartPoints(partName) {
  return FORMAT_DATA.limited.partPoints[partName] ?? 0;
}
export const CURRENT_PATCH = "v2025.11";
```

Replace with:
```js
import StandardFormat from "./data/formats/standard.json";
import LimitedFormat from "./data/formats/limited.json";
import BadFormat from "./data/formats/bad.json";
import DabFormat from "./data/formats/dab.json";
import BadLimitedFormat from "./data/formats/bad-limited.json";
import DabLimitedFormat from "./data/formats/dab-limited.json";

export const BUILT_IN_FORMATS = [
  StandardFormat,
  LimitedFormat,
  BadFormat,
  DabFormat,
  BadLimitedFormat,
  DabLimitedFormat,
];

export const DEFAULT_FORMAT_ID = 'standard';

export function getFormat(id) {
  return BUILT_IN_FORMATS.find(f => f.id === id) ?? StandardFormat;
}

export const CURRENT_PATCH = "v2025.11";
```

- [ ] **Step 2: Attempt build to find all broken imports**
```bash
npm run build 2>&1 | grep "error"
```
There will be errors in files that import `LIMITED_FORMAT`, `STANDARD_FORMAT`, `FORMAT_DATA`, `DEFAULT_LIMITED_MAX_POINTS`, `getPartPoints` from constants. Note which files are broken — they will be fixed in subsequent tasks.

- [ ] **Step 3: Commit**
```bash
git add src/constants.js
git commit -m "feat(constants): replace format string constants with format registry"
```

---

## Task 5: Update randomize.js

**Files:**
- Modify: `src/randomize.js`

Replace `format !== LIMITED_FORMAT` string checks with format object checks. Replace `getPartPoints` import with formatEngine's version.

- [ ] **Step 1: Replace the full file content**

`src/randomize.js`:
```js
import { BLADES, ASSIST_BLADES, RATCHETS, BITS, LOCK_CHIPS, OVER_BLADES, BEYBLADE_DB, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET } from './constants';
import { getPartPoints, getPointBudget } from './lib/formatEngine';

const EXCLUSIVE_LOCK_CHIPS = new Set(['Valkyrie', 'Emperor']);

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function calcPoints(combos, format) {
  const seen = new Set();
  let total = 0;
  combos.forEach(({ blade, assistBlade, overBlade, ratchet, bit }) => {
    for (const part of [blade, assistBlade, overBlade, ratchet, bit]) {
      if (part && !seen.has(part)) {
        seen.add(part);
        total += getPartPoints(part, format);
      }
    }
  });
  return total;
}

function pickLockChip(usedExclusiveLockChips) {
  const available = LOCK_CHIPS.filter(lc => !EXCLUSIVE_LOCK_CHIPS.has(lc) || !usedExclusiveLockChips.has(lc));
  if (!available.length) return '';
  const picked = available[Math.floor(Math.random() * available.length)];
  if (EXCLUSIVE_LOCK_CHIPS.has(picked)) usedExclusiveLockChips.add(picked);
  return picked;
}

function buildCombos(count, usedParts = new Set(), usedExclusiveLockChips = new Set()) {
  const availableBlades = shuffle(BLADES.filter(b => !usedParts.has(b)));
  const availableRatchets = shuffle(
    RATCHETS.filter(r => {
      const pairedBit = RATCHET_INTEGRATED_BITS[r];
      if (pairedBit) return !usedParts.has(r) && !usedParts.has(pairedBit);
      return !usedParts.has(r);
    })
  );
  const availableBits = shuffle(BITS.filter(b => !BIT_TO_RATCHET[b] && !usedParts.has(b)));
  const availableAssistBlades = shuffle(ASSIST_BLADES.filter(a => !usedParts.has(a)));
  const availableOverBlades = shuffle(OVER_BLADES.filter(o => !usedParts.has(o)));

  const combos = [];
  let bitIdx = 0;
  let assistIdx = 0;
  let overBladeIdx = 0;

  for (let i = 0; i < count; i++) {
    const blade = availableBlades[i] || '';
    const ratchet = availableRatchets[i] || '';
    let bit;

    const integratedBit = RATCHET_INTEGRATED_BITS[ratchet];
    if (integratedBit) {
      bit = integratedBit;
    } else {
      bit = availableBits[bitIdx++] || '';
    }

    const isCX = BEYBLADE_DB[blade]?.line === 'CX';
    const isFourPart = BEYBLADE_DB[blade]?.fourPartCX;
    const assistBlade = isCX ? (availableAssistBlades[assistIdx++] || '') : '';
    const lockChip = isCX ? pickLockChip(usedExclusiveLockChips) : '';
    const overBlade = isFourPart ? (availableOverBlades[overBladeIdx++] || '') : '';

    combos.push({ blade, assistBlade, lockChip, overBlade, ratchet, bit });
  }

  return combos;
}

function hasPointBudget(format) {
  return format?.rules?.some(r => r.type === 'pointBudget') ?? false;
}

export function randomizeBeyblades(count, format, userValues = {}, maxAttempts = 20) {
  if (!hasPointBudget(format)) {
    return buildCombos(count);
  }

  const maxPoints = getPointBudget(format, userValues);
  let best = null;
  let bestTotal = Infinity;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const combos = buildCombos(count);
    const total = calcPoints(combos, format);
    if (total <= maxPoints) return combos;
    if (total < bestTotal) {
      bestTotal = total;
      best = combos;
    }
  }

  return best;
}

export function randomizeSingleBeyblade(index, currentBeyblades, format, userValues = {}, maxAttempts = 20) {
  const usedParts = new Set();
  const usedExclusiveLockChips = new Set();
  currentBeyblades.forEach((bey, i) => {
    if (i === index) return;
    if (bey.blade) usedParts.add(bey.blade);
    if (bey.assistBlade) usedParts.add(bey.assistBlade);
    if (bey.overBlade) usedParts.add(bey.overBlade);
    if (bey.ratchet) usedParts.add(bey.ratchet);
    if (bey.bit) usedParts.add(bey.bit);
    if (bey.lockChip && EXCLUSIVE_LOCK_CHIPS.has(bey.lockChip)) usedExclusiveLockChips.add(bey.lockChip);
  });

  if (!hasPointBudget(format)) {
    return buildCombos(1, usedParts, usedExclusiveLockChips)[0];
  }

  const maxPoints = getPointBudget(format, userValues);
  const otherPoints = [...usedParts].reduce((sum, part) => sum + getPartPoints(part, format), 0);
  const budget = maxPoints - otherPoints;

  let best = null;
  let bestTotal = Infinity;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const combo = buildCombos(1, usedParts, usedExclusiveLockChips)[0];
    const comboPoints = calcPoints([combo], format);
    if (comboPoints <= budget) return combo;
    if (comboPoints < bestTotal) {
      bestTotal = comboPoints;
      best = combo;
    }
  }

  return best;
}
```

- [ ] **Step 2: Verify build**
```bash
npm run build 2>&1 | grep "randomize"
```
Expected: no errors related to randomize.js.

- [ ] **Step 3: Commit**
```bash
git add src/randomize.js
git commit -m "feat(randomize): use format object and formatEngine for point calculations"
```

---

## Task 6: Update PartSelector.jsx

**Files:**
- Modify: `src/PartSelector.jsx`

Replace `partsUsed`/`currentFormat` props with `partsUsed`/`format`/`slot`. Use `isPartDisabled` from formatEngine. Use `getPartPoints` from formatEngine for points display.

- [ ] **Step 1: Replace the top of PartSelector.jsx**

Change the import line from:
```js
import { BEYBLADE_DB, LIMITED_FORMAT, LINE_BADGE, getPartPoints } from './constants';
```
To:
```js
import { BEYBLADE_DB, LINE_BADGE } from './constants';
import { isPartDisabled, getPartPoints } from './lib/formatEngine';
```

- [ ] **Step 2: Update buildOptionLabel and buildFlatOptions**

Replace:
```js
function buildOptionLabel(option, currentFormat) {
  let label = `${option}${BEYBLADE_DB[option]?.alias ? ` (${BEYBLADE_DB[option].alias})` : ''}`;
  if (currentFormat === LIMITED_FORMAT) {
    label = `${label} — ${getPartPoints(option)}pts`;
  }
  return { value: option, label };
}

function buildFlatOptions(options, currentFormat) {
  const sorted =
    currentFormat === LIMITED_FORMAT
      ? [...options].sort((a, b) => (getPartPoints(a) || 100) - (getPartPoints(b) || 100))
      : [...options].sort();
  return [{ value: '', label: '— Select —' }, ...sorted.map((o) => buildOptionLabel(o, currentFormat))];
}
```

With:
```js
function buildOptionLabel(option, format) {
  const hasPoints = format?.rules?.some(r => r.type === 'pointBudget');
  let label = `${option}${BEYBLADE_DB[option]?.alias ? ` (${BEYBLADE_DB[option].alias})` : ''}`;
  if (hasPoints) {
    label = `${label} — ${getPartPoints(option, format)}pts`;
  }
  return { value: option, label };
}

function buildFlatOptions(options, format) {
  const hasPoints = format?.rules?.some(r => r.type === 'pointBudget');
  const sorted = hasPoints
    ? [...options].sort((a, b) => (getPartPoints(a, format) || 100) - (getPartPoints(b, format) || 100))
    : [...options].sort();
  return [{ value: '', label: '— Select —' }, ...sorted.map((o) => buildOptionLabel(o, format))];
}
```

- [ ] **Step 3: Update the PartSelector component signature and isOptionDisabled**

Replace:
```js
function PartSelector({ label, options, value, onChange, partsUsed, currentFormat, showLineBadge = false, modeIndex = 0 }) {
  const flatOptions = buildFlatOptions(options, currentFormat);
  const defaultValue = flatOptions.find((i) => i.value === value);
  const description = value ? BEYBLADE_DB[value]?.description : null;
  const source = value ? BEYBLADE_DB[value]?.source : null;

  const isOptionDisabled = (option) => {
    return partsUsed.includes(option.value);
  };
```

With:
```js
function PartSelector({ label, options, value, onChange, slot, partsUsed, format, showLineBadge = false, modeIndex = 0 }) {
  const flatOptions = buildFlatOptions(options, format);
  const defaultValue = flatOptions.find((i) => i.value === value);
  const description = value ? BEYBLADE_DB[value]?.description : null;
  const source = value ? BEYBLADE_DB[value]?.source : null;

  const isOptionDisabled = (option) => {
    return isPartDisabled(option.value, slot, partsUsed, format);
  };
```

- [ ] **Step 4: Update PropTypes**

Replace:
```js
PartSelector.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  partsUsed: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentFormat: PropTypes.string.isRequired,
  showLineBadge: PropTypes.bool,
  modeIndex: PropTypes.number,
};
```

With:
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

- [ ] **Step 5: Commit**
```bash
git add src/PartSelector.jsx
git commit -m "feat(PartSelector): use formatEngine isPartDisabled, add slot prop"
```

---

## Task 7: Update useBeybladeDeck.js

**Files:**
- Modify: `src/hooks/useBeybladeDeck.js`

Change `currentFormat` from string to format object. Add `violations` and `formatUserValues` state. Update URL sync to use `currentFormat.id`.

- [ ] **Step 1: Replace the full file**

`src/hooks/useBeybladeDeck.js`:
```js
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BEYBLADE_DB, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET, getFormat, DEFAULT_FORMAT_ID } from '../constants';
import { randomizeBeyblades, randomizeSingleBeyblade } from '../randomize';
import { parseSharedBeys } from '../lib/comboUtils';
import { buildShareUrl, buildShareToken, parseShareToken } from '../lib/shareUrl';
import { evaluateFormat, getPartPoints } from '../lib/formatEngine';

function getPartsUsed(beys) {
  const parts = new Set();
  beys.forEach((bey) => {
    parts.add(bey.blade);
    parts.add(bey.ratchet);
    parts.add(bey.bit);
    if (bey.assistBlade) parts.add(bey.assistBlade);
    if (bey.lockChip) parts.add(bey.lockChip);
    if (bey.overBlade) parts.add(bey.overBlade);
  });
  return parts;
}

export function useBeybladeDeck() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [beybladeCount, setBeybladeCount] = useState(Number(searchParams.get('beynum')) || 3);
  const [currentFormat, setCurrentFormat] = useState(() => getFormat(searchParams.get('format') || DEFAULT_FORMAT_ID));
  const [beyblades, setBeyblades] = useState([]);
  const [bladerName, setBladerName] = useState('');
  const [formatUserValues, setFormatUserValues] = useState({});

  useEffect(() => {
    setFormatUserValues({});
  }, [currentFormat]);

  useEffect(() => {
    const token = searchParams.get('d');
    const legacyBeys = searchParams.getAll('beys');

    if (token) {
      const payload = parseShareToken(token);
      if (payload) {
        if (payload.beys?.length > 0) setBeyblades(parseSharedBeys(payload.beys));
        if (payload.beynum) setBeybladeCount(Number(payload.beynum));
        if (payload.format) setCurrentFormat(getFormat(payload.format));
        if (payload.name) setBladerName(payload.name);
      }
    } else if (legacyBeys.length > 0) {
      setBeyblades(parseSharedBeys(legacyBeys));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasDeck = beyblades.some((b) => b.blade || b.ratchet || b.bit);
    if (!hasDeck) {
      setSearchParams(new URLSearchParams(), { replace: true });
      return;
    }
    const token = buildShareToken(beyblades, beybladeCount, currentFormat.id, bladerName);
    setSearchParams({ d: token }, { replace: true });
  }, [beyblades, beybladeCount, currentFormat, bladerName]); // eslint-disable-line react-hooks/exhaustive-deps

  const partsUsed = useMemo(() => [...getPartsUsed(beyblades)], [beyblades]);

  const totalPoints = useMemo(() => {
    let points = 0;
    getPartsUsed(beyblades).forEach((part) => {
      points += getPartPoints(part, currentFormat);
    });
    return points;
  }, [beyblades, currentFormat]);

  const violations = useMemo(() => {
    return evaluateFormat(beyblades, currentFormat, formatUserValues).violations;
  }, [beyblades, currentFormat, formatUserValues]);

  const handlePartChange = (index, partType, value) => {
    const newBeyblades = [...beyblades];

    for (let i = 0; i < beybladeCount; i++) {
      if (!newBeyblades[i]) {
        newBeyblades[i] = { blade: '', bladeMode: 0, assistBlade: '', assistBladeMode: 0, lockChip: '', overBlade: '', ratchet: '', bit: '', bitMode: 0 };
      }
    }

    newBeyblades[index][partType] = value;

    if (partType === 'blade' && !BEYBLADE_DB[value]?.fourPartCX) {
      newBeyblades[index].overBlade = '';
    }

    const modeResets = { blade: 'bladeMode', assistBlade: 'assistBladeMode', bit: 'bitMode' };
    if (modeResets[partType] !== undefined) {
      newBeyblades[index][modeResets[partType]] = 0;
    }

    if (partType === 'ratchet') {
      const pairedBit = RATCHET_INTEGRATED_BITS[value];
      if (pairedBit) {
        newBeyblades[index].bit = pairedBit;
      } else if (BIT_TO_RATCHET[newBeyblades[index].bit]) {
        newBeyblades[index].bit = '';
      }
    }

    if (partType === 'bit') {
      const pairedRatchet = BIT_TO_RATCHET[value];
      if (pairedRatchet) {
        newBeyblades[index].ratchet = pairedRatchet;
      } else if (RATCHET_INTEGRATED_BITS[newBeyblades[index].ratchet]) {
        newBeyblades[index].ratchet = '';
      }
    }

    setBeyblades(newBeyblades);
  };

  const handleShareButton = () => {
    const url = buildShareUrl(beyblades, beybladeCount, currentFormat.id, bladerName);
    navigator.clipboard
      .writeText(url)
      .then(() => window.alert('Successfully copied to clipboard!'))
      .catch((err) => console.error('Failed to copy URL:', err));
  };

  const handleRandomizeAll = (userValues) => {
    setBeyblades(randomizeBeyblades(beybladeCount, currentFormat, userValues));
  };

  const handleRandomizeSingle = (index, userValues) => {
    const newBeyblades = [...beyblades];
    for (let i = 0; i < beybladeCount; i++) {
      if (!newBeyblades[i]) newBeyblades[i] = { blade: '', bladeMode: 0, assistBlade: '', assistBladeMode: 0, lockChip: '', overBlade: '', ratchet: '', bit: '', bitMode: 0 };
    }
    newBeyblades[index] = randomizeSingleBeyblade(index, newBeyblades, currentFormat, userValues);
    setBeyblades(newBeyblades);
  };

  return {
    beybladeCount,
    setBeybladeCount,
    currentFormat,
    setCurrentFormat,
    beyblades,
    partsUsed,
    totalPoints,
    violations,
    formatUserValues,
    setFormatUserValues,
    handlePartChange,
    handleShareButton,
    handleRandomizeAll,
    handleRandomizeSingle,
    bladerName,
    setBladerName,
  };
}
```

- [ ] **Step 2: Verify build**
```bash
npm run build 2>&1 | grep -v "^$" | head -30
```
Expected: errors only in App.jsx (not yet updated). No errors in useBeybladeDeck.js itself.

- [ ] **Step 3: Commit**
```bash
git add src/hooks/useBeybladeDeck.js
git commit -m "feat(hook): use format object, add violations and formatUserValues"
```

---

## Task 8: Create FormatViolations.jsx

**Files:**
- Create: `src/components/FormatViolations.jsx`

A display-only component that renders a list of soft violation warnings. Returns null when violations array is empty.

- [ ] **Step 1: Create src/components/FormatViolations.jsx**

```jsx
import PropTypes from 'prop-types';

function FormatViolations({ violations }) {
  if (!violations?.length) return null;

  return (
    <div
      className="rounded-lg px-4 py-3 mb-4"
      style={{
        background: 'rgba(255, 68, 85, 0.08)',
        border: '1px solid rgba(255, 68, 85, 0.3)',
      }}
    >
      <div
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: '#ff4455', letterSpacing: '0.15em' }}
      >
        Format Violations
      </div>
      <ul className="space-y-1">
        {violations.map((v, i) => (
          <li
            key={i}
            className="text-xs flex items-start gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span style={{ color: '#ff4455', flexShrink: 0 }}>✕</span>
            {v.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

FormatViolations.propTypes = {
  violations: PropTypes.arrayOf(
    PropTypes.shape({
      rule: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default FormatViolations;
```

- [ ] **Step 2: Commit**
```bash
git add src/components/FormatViolations.jsx
git commit -m "feat(ui): add FormatViolations component"
```

---

## Task 9: Update App.jsx

**Files:**
- Modify: `src/App.jsx`

This is the largest change. Update to:
1. Use `currentFormat` (object) from hook instead of string constants
2. Replace format toggle buttons with multi-format selector + Import + button
3. Replace `maximumPointsLimited` with `formatUserValues` from hook
4. Add `FormatViolations` below config card
5. Add `slot` prop to all `PartSelector` calls
6. Pass `format` (object) instead of `currentFormat` (string) to PartSelector
7. Handle custom JSON format upload

- [ ] **Step 1: Update imports at top of App.jsx**

Remove from the import block:
```js
import {
  BLADES,
  ASSIST_BLADES,
  OVER_BLADES,
  RATCHETS,
  BITS,
  LOCK_CHIPS,
  LIMITED_FORMAT,
  STANDARD_FORMAT,
  DEFAULT_LIMITED_MAX_POINTS,
  BEYBLADE_DB,
  CURRENT_PATCH,
  getLineColor,
} from './constants';
```

Replace with:
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
import FormatViolations from './components/FormatViolations';
```

- [ ] **Step 2: Update destructure from useBeybladeDeck**

Replace:
```js
const {
  beybladeCount,
  setBeybladeCount,
  currentFormat,
  setCurrentFormat,
  beyblades,
  partsUsed,
  totalPoints,
  handlePartChange,
  handleRandomizeAll,
  handleRandomizeSingle,
  bladerName,
  setBladerName,
} = useBeybladeDeck();
```

With:
```js
const {
  beybladeCount,
  setBeybladeCount,
  currentFormat,
  setCurrentFormat,
  beyblades,
  partsUsed,
  totalPoints,
  violations,
  formatUserValues,
  setFormatUserValues,
  handlePartChange,
  handleRandomizeAll,
  handleRandomizeSingle,
  bladerName,
  setBladerName,
} = useBeybladeDeck();
```

- [ ] **Step 3: Add custom format state and upload handler**

After the `useBeybladeDeck` destructure, add:
```js
const [customFormats, setCustomFormats] = useState([]);
const [formatImportError, setFormatImportError] = useState(null);

const handleImportFormat = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!parsed.id || !parsed.name || !Array.isArray(parsed.rules)) {
        setFormatImportError('Invalid format: must have id, name, and rules array.');
        return;
      }
      const unknownRule = parsed.rules.find(r => ![
        'noRepeatParts','banPart','allowedParts','allowedPartTypes',
        'pointBudget','requirePartType','requireTypeDistribution',
        'requireComboTypePairing','requireComboWith',
      ].includes(r.type));
      if (unknownRule) {
        setFormatImportError(`Unknown rule type: "${unknownRule.type}"`);
        return;
      }
      setCustomFormats(prev => [...prev.filter(f => f.id !== parsed.id), parsed]);
      setCurrentFormat(parsed);
      setFormatImportError(null);
    } catch {
      setFormatImportError('Could not parse JSON file.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
};
```

- [ ] **Step 4: Replace the LimitedFormatPoints component usage and maximumPointsLimited state**

Remove the `const [maximumPointsLimited, setMaximumPointsLimited] = useState(DEFAULT_LIMITED_MAX_POINTS);` line.

The `LimitedFormatPoints` component at top of file:
Replace:
```js
function LimitedFormatPoints({ format, totalPoints, maximumPointsLimited }) {
  if (format !== LIMITED_FORMAT) return null;
  const over = totalPoints > maximumPointsLimited;
  return (
    <div ...>
      ...
      {totalPoints}/{maximumPointsLimited}
      ...
    </div>
  );
}
```

With:
```js
function LimitedFormatPoints({ format, totalPoints, maxPoints }) {
  const hasPointBudget = format?.rules?.some(r => r.type === 'pointBudget');
  if (!hasPointBudget) return null;
  const over = totalPoints > maxPoints;
  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-center gap-3 py-2 px-4 mb-5 rounded-lg"
      style={{ background: 'var(--color-overlay)', backdropFilter: 'blur(10px)', border: '1px solid var(--color-border)' }}
    >
      <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
        Points
      </span>
      <span
        className="text-xl font-bold"
        style={{
          fontFamily: 'var(--font-heading)',
          color: over ? '#ff4455' : 'var(--color-accent)',
          textShadow: over ? '0 0 12px rgba(255,68,85,0.5)' : '0 0 12px rgba(0,212,255,0.4)',
        }}
      >
        {totalPoints}/{maxPoints}
      </span>
      {over && (
        <span className="text-xs font-semibold" style={{ color: '#ff4455' }}>
          OVER LIMIT
        </span>
      )}
    </div>
  );
}
```

Update PropTypes / usage at the call site:
```jsx
<LimitedFormatPoints
  format={currentFormat}
  totalPoints={totalPoints}
  maxPoints={formatUserValues.pointBudget ?? currentFormat.rules?.find(r => r.type === 'pointBudget')?.default ?? 0}
/>
```

- [ ] **Step 5: Replace the format toggle section**

Find and replace the format toggle `<div>` (the section with `Standard`/`Limited` buttons and `Maximum Points Allowed` input) with:

```jsx
{/* Format selector */}
<div>
  <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
    Format
  </label>
  <div className="flex flex-wrap gap-2 mb-2">
    {[...BUILT_IN_FORMATS, ...customFormats].map((fmt) => {
      const active = currentFormat.id === fmt.id;
      return (
        <button
          key={fmt.id}
          onClick={() => setCurrentFormat(fmt)}
          className="py-2 px-3 rounded-lg text-sm font-semibold text-left transition-all"
          style={{
            background: active ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
            color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
            border: active ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--color-border)',
            boxShadow: active ? '0 0 14px rgba(0,212,255,0.08)' : 'none',
          }}
          title={fmt.description}
        >
          {fmt.name}
        </button>
      );
    })}
    <label
      className="py-2 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer"
      style={{
        background: 'var(--color-surface-2)',
        color: 'var(--color-accent)',
        border: '1px solid rgba(0,212,255,0.25)',
      }}
      title="Import a custom format JSON file"
    >
      Import +
      <input type="file" accept=".json" className="hidden" onChange={handleImportFormat} />
    </label>
  </div>
  {formatImportError && (
    <p className="text-xs mt-1" style={{ color: '#ff4455' }}>{formatImportError}</p>
  )}
  {currentFormat.description && (
    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>{currentFormat.description}</p>
  )}
</div>

{/* Max points input (userAdjustable pointBudget rule) */}
{currentFormat.rules?.some(r => r.type === 'pointBudget' && r.userAdjustable) && (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
      Maximum Points Allowed
    </label>
    <input
      type="number"
      min="1"
      value={formatUserValues.pointBudget ?? currentFormat.rules.find(r => r.type === 'pointBudget').default}
      onChange={(e) => setFormatUserValues(v => ({ ...v, pointBudget: Number(e.target.value) }))}
      className="w-20 px-3 py-2 rounded-lg text-center text-lg font-bold focus:outline-none"
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid rgba(255,140,0,0.3)',
        color: 'var(--color-accent-2)',
        fontFamily: 'var(--font-heading)',
      }}
    />
  </div>
)}
```

- [ ] **Step 6: Add FormatViolations below the config card**

After the closing `</div>` of the config card (`{/* ── Config Card ── */}`), add:
```jsx
<FormatViolations violations={violations} />
```

- [ ] **Step 7: Update the CURRENT_PATCH display condition**

Replace:
```jsx
{currentFormat === LIMITED_FORMAT && (
  <div className="text-xs font-bold tracking-widest mt-2" ...>
    {CURRENT_PATCH}
  </div>
)}
```

With:
```jsx
{currentFormat.rules?.some(r => r.type === 'pointBudget') && (
  <div className="text-xs font-bold tracking-widest mt-2" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-body)', letterSpacing: '0.2em' }}>
    {CURRENT_PATCH}
  </div>
)}
```

- [ ] **Step 8: Add slot prop to all PartSelector calls and change currentFormat → format**

Find every `<PartSelector` in App.jsx and:
1. Replace `currentFormat={currentFormat}` with `format={currentFormat}`
2. Add a `slot` prop matching the part type

The complete list of PartSelector calls and their new props:

```jsx
{/* Blade */}
<PartSelector
  label="Blade"
  slot="blade"
  options={BLADES}
  value={beyblades[index]?.blade}
  onChange={(value) => handlePartChange(index, 'blade', value)}
  partsUsed={partsUsed}
  format={currentFormat}
  showLineBadge
  modeIndex={beyblades[index]?.bladeMode ?? 0}
/>

{/* Lock Chip */}
<PartSelector
  label="Lock Chip"
  slot="lockChip"
  options={LOCK_CHIPS}
  value={beyblades[index]?.lockChip}
  onChange={(value) => handlePartChange(index, 'lockChip', value)}
  partsUsed={partsUsed}
  format={currentFormat}
/>

{/* Over Blade */}
<PartSelector
  label="Over Blade"
  slot="overBlade"
  options={OVER_BLADES}
  value={beyblades[index]?.overBlade}
  onChange={(value) => handlePartChange(index, 'overBlade', value)}
  partsUsed={partsUsed}
  format={currentFormat}
/>

{/* Assist Blade */}
<PartSelector
  label="Assist Blade"
  slot="assistBlade"
  options={ASSIST_BLADES}
  value={beyblades[index]?.assistBlade}
  onChange={(value) => handlePartChange(index, 'assistBlade', value)}
  partsUsed={partsUsed}
  format={currentFormat}
  modeIndex={beyblades[index]?.assistBladeMode ?? 0}
/>

{/* Ratchet */}
<PartSelector
  label="Ratchet"
  slot="ratchet"
  options={RATCHETS}
  value={beyblades[index]?.ratchet}
  onChange={(value) => handlePartChange(index, 'ratchet', value)}
  partsUsed={partsUsed}
  format={currentFormat}
/>

{/* Bit */}
<PartSelector
  label="Bit"
  slot="bit"
  options={BITS}
  value={beyblades[index]?.bit}
  onChange={(value) => handlePartChange(index, 'bit', value)}
  partsUsed={partsUsed}
  format={currentFormat}
  modeIndex={beyblades[index]?.bitMode ?? 0}
/>
```

- [ ] **Step 9: Update randomize call sites in App.jsx**

Replace:
```js
onClick={() => handleRandomizeSingle(index, maximumPointsLimited)}
```
With:
```js
onClick={() => handleRandomizeSingle(index, formatUserValues)}
```

Replace:
```js
flushSync(() => handleRandomizeAll(maximumPointsLimited));
```
With:
```js
flushSync(() => handleRandomizeAll(formatUserValues));
```

- [ ] **Step 10: No widget changes needed in App.jsx**

Widgets receive `format={currentFormat}` — after this task, that passes the format object. Widget file fixes are in Task 9b below.

- [ ] **Step 11: Build and verify**
```bash
npm run build 2>&1
```
Expected: build succeeds with no errors.

- [ ] **Step 12: Commit**
```bash
git add src/App.jsx
git commit -m "feat(App): new format selector with built-ins, import support, and violation display"
```

---

## Task 9b: Update Widget Components

**Files:**
- Modify: `src/components/widgets/CompactListWidget.jsx`
- Modify: `src/components/widgets/DeckWidget.jsx`
- Modify: `src/components/widgets/StoryDeckWidget.jsx`
- Modify: `src/components/widgets/CompactImageWidget.jsx`
- Modify: `src/components/ExportCard.jsx`

All five files import `LIMITED_FORMAT` and do `format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD'`. Since `format` is now an object, replace with `format?.name?.toUpperCase()`.

- [ ] **Step 1: Fix CompactListWidget.jsx**

In `src/components/widgets/CompactListWidget.jsx`:
- Remove `LIMITED_FORMAT` from the import line
- Replace `const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';` with:
```js
const formatLabel = format?.name?.toUpperCase() ?? 'STANDARD';
```

- [ ] **Step 2: Fix DeckWidget.jsx**

In `src/components/widgets/DeckWidget.jsx`:
- Remove `LIMITED_FORMAT` from the import line
- Replace `const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';` with:
```js
const formatLabel = format?.name?.toUpperCase() ?? 'STANDARD';
```

- [ ] **Step 3: Fix StoryDeckWidget.jsx**

In `src/components/widgets/StoryDeckWidget.jsx`:
- Remove `LIMITED_FORMAT` from the import line
- Replace `const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';` with:
```js
const formatLabel = format?.name?.toUpperCase() ?? 'STANDARD';
```

- [ ] **Step 4: Fix CompactImageWidget.jsx**

In `src/components/widgets/CompactImageWidget.jsx`:
- Remove `LIMITED_FORMAT` from the import line
- Replace `const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';` with:
```js
const formatLabel = format?.name?.toUpperCase() ?? 'STANDARD';
```

- [ ] **Step 5: Fix ExportCard.jsx**

In `src/components/ExportCard.jsx`:
- Remove `LIMITED_FORMAT` from the import line
- Replace `const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';` with:
```js
const formatLabel = format?.name?.toUpperCase() ?? 'STANDARD';
```

- [ ] **Step 6: Build to confirm no remaining LIMITED_FORMAT references**
```bash
npm run build 2>&1 && grep -r "LIMITED_FORMAT" src/ || echo "No remaining references"
```
Expected: build succeeds, no remaining `LIMITED_FORMAT` references.

- [ ] **Step 7: Commit**
```bash
git add src/components/widgets/ src/components/ExportCard.jsx
git commit -m "feat(widgets): use format object name instead of LIMITED_FORMAT string check"
```

---

## Task 10: Run Dev Server and Verify

- [ ] **Step 1: Start dev server**
```bash
npm run dev
```
Open the URL shown (usually `http://localhost:5173`).

- [ ] **Step 2: Verify Standard format**
- Select "Standard" format button — active state shows
- Build a 3-bey deck, pick a blade for combo 1
- Verify same blade is disabled in combo 2's blade dropdown
- Description shows: "No repeating parts across the deck."

- [ ] **Step 3: Verify Limited format**
- Select "Limited" format button
- Verify parts are sorted by point cost in dropdowns
- Verify point cost shown next to each part name (e.g., "Dran Sword — 2pts")
- Verify `{totalPoints}/{maxPoints}` banner appears at top
- Change Max Points Allowed input — verify banner updates
- Add parts that exceed the limit — verify OVER LIMIT indicator

- [ ] **Step 4: Verify B.A.D format**
- Select "B.A.D" — deck count auto-clamps to 3
- Build deck with all attack blades
- Verify violations appear: "Need at least 1 defense blade", "Need at least 1 balance blade"
- Add one defense and one balance blade — violations clear for blades
- Add all attack bits — verify bit distribution violations appear
- Description shows B.A.D description

- [ ] **Step 5: Verify D.A.B format**
- Select "D.A.B"
- Build combo 1 with attack blade + defense bit
- Verify violation: "Combo 1: blade type (attack) doesn't match bit type (defense)"
- Switch bit to attack type — violation clears

- [ ] **Step 6: Verify B.A.D Limited and D.A.B Limited**
- Both behave as their base formats PLUS show point budget
- Max Points Allowed input appears

- [ ] **Step 7: Verify custom format upload**
- Create a test file `test-format.json`:
```json
{
  "id": "test",
  "name": "Test",
  "description": "Only attack blades allowed.",
  "minBeys": 1,
  "maxBeys": 5,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "allowedPartTypes", "slot": "blade", "types": ["attack"] }
  ]
}
```
- Click "Import +" and select the file
- "Test" button should appear as active in format selector
- Select a defense blade — it should be disabled in the dropdown
- Select an attack blade — works fine

- [ ] **Step 8: Verify URL sharing fallback**
- Build a deck in D.A.B format
- Click Share, copy the URL
- Open the URL in a new tab
- Verify deck loads in D.A.B format (format id is preserved in the token)
- In a fresh session, manually change the URL `format` part of the `d` token to `"custom"` — verify it falls back to Standard

- [ ] **Step 9: Verify invalid format upload**
- Try uploading a JSON file missing the `rules` field
- Verify error message appears near the Import button

- [ ] **Step 10: Final commit**
```bash
git add -p  # stage any remaining changes
git commit -m "feat: extensible format engine with built-in and custom formats"
```
