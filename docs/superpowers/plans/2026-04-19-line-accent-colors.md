# Line-Based Accent Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply per-line accent colors (BX=`#42a5f5`, UX=`#e65c00`, CX=`#c62828`) in the lineup card borders and export card accents, replacing hardcoded cyan and index-cycling colors.

**Architecture:** Move `LINE_BADGE` from `PartSelector.jsx` to `constants.js` and add a `getLineColor(blade)` helper. Both `ComboSummaryList` and `ExportCard` import the helper and use it to derive accent color from each combo's blade line.

**Tech Stack:** React, inline styles, existing `BEYBLADE_DB` lookup

---

## File Map

| File | Change |
|------|--------|
| `src/constants.js` | Add `LINE_BADGE` export and `getLineColor(blade)` helper |
| `src/PartSelector.jsx` | Remove local `LINE_BADGE`, import from `constants.js` |
| `src/components/ComboSummaryList.jsx` | Derive `lineColor` per combo, apply to `<li>` border |
| `src/components/ExportCard.jsx` | Replace hardcoded accent + `ACCENT_COLORS` with `getLineColor` |

---

### Task 1: Move LINE_BADGE to constants.js and add getLineColor helper

**Files:**
- Modify: `src/constants.js`

- [ ] **Step 1: Add LINE_BADGE and getLineColor to the end of `src/constants.js`**

```js
export const LINE_BADGE = {
  BX: { label: 'BX', color: '#42a5f5' },
  UX: { label: 'UX', color: '#e65c00' },
  CX: { label: 'CX', color: '#c62828' },
};

export function getLineColor(blade) {
  const line = BEYBLADE_DB[blade]?.line;
  return LINE_BADGE[line]?.color ?? LINE_BADGE.BX.color;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/constants.js
git commit -m "feat: export LINE_BADGE and getLineColor from constants"
```

---

### Task 2: Update PartSelector to import LINE_BADGE from constants

**Files:**
- Modify: `src/PartSelector.jsx`

- [ ] **Step 1: Update the import line at the top of `src/PartSelector.jsx`**

Replace:
```js
import { BEYBLADE_DB, LIMITED_FORMAT } from './constants';
```
With:
```js
import { BEYBLADE_DB, LIMITED_FORMAT, LINE_BADGE } from './constants';
```

- [ ] **Step 2: Remove the local LINE_BADGE constant (lines 22–26)**

Delete these lines:
```js
const LINE_BADGE = {
  BX: { label: 'BX', color: '#42a5f5' },
  UX: { label: 'UX', color: '#e65c00' },
  CX: { label: 'CX', color: '#c62828' },
};
```

- [ ] **Step 3: Verify the app still works**

Run: `npm run dev`

Open the part selector dropdown — line badges (BX/UX/CX colored labels) should still appear next to each part option, visually unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/PartSelector.jsx
git commit -m "refactor: import LINE_BADGE from constants instead of defining locally"
```

---

### Task 3: Add line-based accent borders to ComboSummaryList

**Files:**
- Modify: `src/components/ComboSummaryList.jsx`

- [ ] **Step 1: Add getLineColor import**

Replace:
```js
import { BEYBLADE_DB, getStats } from '../constants';
```
With:
```js
import { BEYBLADE_DB, getStats, getLineColor } from '../constants';
```

- [ ] **Step 2: Derive lineColor inside the `.map()` callback**

After this existing line:
```js
const comboName = getComboName(beyblades[index]);
```

Add:
```js
const lineColor = getLineColor(blade);
```

- [ ] **Step 3: Apply lineColor to the `<li>` style**

Replace the existing `<li>` style:
```js
style={{
  flex: '1 1 0',
  minWidth: 0,
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
}}
```
With:
```js
style={{
  flex: '1 1 0',
  minWidth: 0,
  background: 'var(--color-surface-2)',
  border: `1px solid ${lineColor}33`,
  borderLeft: `3px solid ${lineColor}`,
}}
```

- [ ] **Step 4: Verify visually**

With the dev server running, open the app and add combos with BX, UX, and CX blades. Each card in the lineup row should show a left accent border in the matching line color. Empty slots (no blade) default to BX cyan.

- [ ] **Step 5: Commit**

```bash
git add src/components/ComboSummaryList.jsx
git commit -m "feat: accent lineup cards with blade line color"
```

---

### Task 4: Apply line color in ExportCard

**Files:**
- Modify: `src/components/ExportCard.jsx`

- [ ] **Step 1: Update the import**

Replace:
```js
import { BEYBLADE_DB, LIMITED_FORMAT } from '../constants';
```
With:
```js
import { BEYBLADE_DB, LIMITED_FORMAT, getLineColor } from '../constants';
```

- [ ] **Step 2: Remove the ACCENT_COLORS constant**

Delete these lines near the top of the file:
```js
const ACCENT_COLORS = ['#00d4ff', '#7b61ff', '#ffa040'];
```

- [ ] **Step 3: Fix the single-combo export accent (comboIndex != null branch)**

Inside `ExportCard`, in the `comboIndex != null` block, replace:
```js
const accent = '#00d4ff';
```
With:
```js
const accent = getLineColor(blade);
```

- [ ] **Step 4: Fix the deck export accent (ComboRow usage)**

In the deck view's `.map()`, replace:
```js
<ComboRow key={i} combo={beyblades[i]} accent={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
```
With:
```js
<ComboRow key={i} combo={beyblades[i]} accent={getLineColor(beyblades[i]?.blade)} />
```

- [ ] **Step 5: Verify visually**

Open the app with combos of different lines. Export a single combo — border and image ring should match the blade's line color. Export the full deck — each row's left border should reflect its own blade's line, not a repeating cycle.

- [ ] **Step 6: Commit**

```bash
git add src/components/ExportCard.jsx
git commit -m "feat: accent export cards with blade line color"
```
