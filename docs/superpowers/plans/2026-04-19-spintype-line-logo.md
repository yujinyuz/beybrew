# Spin Type + Line Logo Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display each combo's series line logo (BX/UX/CX PNG) and spin direction below the combo name in the lineup view and all image-export widgets.

**Architecture:** Add `LINE_LOGO` map and `getLineLogo(blade)` helper to `constants.js`, then update each component to render a small `<img>` (the line logo) plus spin text in a tight row directly below the combo name. `SingleComboWidget` and `StoryComboWidget` already show spin type as text — replace those text-only elements with the logo+text treatment.

**Tech Stack:** React (JSX), inline styles, Vite dev server (`npm run dev`)

---

## File Map

| File | Change |
|---|---|
| `src/constants.js` | Add `LINE_LOGO` export + `getLineLogo(blade)` helper |
| `src/components/ComboSummaryList.jsx` | Add line logo + spin row between name and blade image |
| `src/components/DeckPreview.jsx` | Add line logo + spin row between name and stat badges |
| `src/components/widgets/DeckWidget.jsx` | Add line logo + spin row between name and StatBars |
| `src/components/widgets/StoryDeckWidget.jsx` | Add line logo + spin row between name and stat bars |
| `src/components/widgets/CompactImageWidget.jsx` | Add line logo + spin row between name and stat mini-bars |
| `src/components/widgets/CompactListWidget.jsx` | Add line logo + spin row after combo name |
| `src/components/widgets/SingleComboWidget.jsx` | Replace text sub-line with line logo + spin text + bit type |
| `src/components/widgets/StoryComboWidget.jsx` | Replace spin text pill with line logo image + spin text pill |

---

### Task 1: Add LINE_LOGO and getLineLogo to constants.js

**Files:**
- Modify: `src/constants.js`

- [ ] **Step 1: Add LINE_LOGO map and getLineLogo helper**

In `src/constants.js`, after the `getLineColor` function, add:

```js
export const LINE_LOGO = {
  BX: 'Basic Line Logo.png',
  UX: 'Unique Line Logo.png',
  CX: 'Custom Line Logo.png',
};

export function getLineLogo(blade) {
  const line = BEYBLADE_DB[blade]?.line;
  return LINE_LOGO[line] ?? LINE_LOGO.BX;
}
```

- [ ] **Step 2: Verify dev server starts clean**

```bash
npm run dev
```

Expected: server starts with no errors on console.

- [ ] **Step 3: Commit**

```bash
git add src/constants.js
git commit -m "feat: add LINE_LOGO map and getLineLogo helper"
```

---

### Task 2: Update ComboSummaryList

`ComboSummaryList` is the horizontal card lineup on the main page. Each card already has: combo name → blade image → bit icon + spin icon row. Insert the line logo + spin text row between the combo name and the blade image.

**Files:**
- Modify: `src/components/ComboSummaryList.jsx`

- [ ] **Step 1: Add getLineLogo to import**

Change the import line from:
```js
import { BEYBLADE_DB, getStats, getLineColor } from '../constants';
```
to:
```js
import { BEYBLADE_DB, getStats, getLineColor, getLineLogo } from '../constants';
```

- [ ] **Step 2: Add line logo + spin row after the combo name `<p>` tag**

The `<p>` tag that renders `comboName` is followed by the blade image `<div>`. Insert this block between them:

```jsx
{blade && (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
    <img
      src={`/images/${getLineLogo(blade)}`}
      alt={BEYBLADE_DB[blade]?.line || 'BX'}
      style={{ height: '16px', width: 'auto', objectFit: 'contain' }}
    />
    <span style={{ fontSize: '7px', color: lineColor, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {spinType.toUpperCase()} SPIN
    </span>
  </div>
)}
```

`blade`, `spinType`, and `lineColor` are all already derived earlier in the `.map()` callback.

- [ ] **Step 3: Verify visually**

Open `http://localhost:5173`, add a blade to the deck. Each filled combo card should show a small line logo + "RIGHT SPIN" (or "LEFT SPIN") between the name and the blade image circle. Empty slots show nothing there.

- [ ] **Step 4: Commit**

```bash
git add src/components/ComboSummaryList.jsx
git commit -m "feat: show line logo and spin type in lineup cards"
```

---

### Task 3: Update DeckPreview

`DeckPreview` renders each combo as a horizontal row: blade image | name + stat number badges. Add the line logo + spin row between the name and the stat badges.

**Files:**
- Modify: `src/components/DeckPreview.jsx`

- [ ] **Step 1: Add getLineLogo to import**

```js
import { BEYBLADE_DB, getStats, getLineColor, getLineLogo } from '../constants';
```

- [ ] **Step 2: Extract blade and spinType inside ComboRow**

`ComboRow` receives `combo` and `accent`. At the top of the component body, after the existing destructuring, add:

```js
const spinType = BEYBLADE_DB[blade]?.spinType;
```

`blade` is already available from `const { blade, overBlade, lockChip } = combo || {};`.

- [ ] **Step 3: Insert line logo + spin row inside the name/stats column**

The column `<div>` currently contains a `<p>` (name) then a `<div>` (stat badges). Insert between them:

```jsx
{blade && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <img
      src={`/images/${getLineLogo(blade)}`}
      alt={BEYBLADE_DB[blade]?.line || 'BX'}
      style={{ height: '14px', width: 'auto', objectFit: 'contain' }}
    />
    <span style={{ fontSize: '7px', color: accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {spinType?.toUpperCase()} SPIN
    </span>
  </div>
)}
```

- [ ] **Step 4: Verify visually**

In the main app, the deck preview section (below the combo cards) should show the line logo + spin text in each row.

- [ ] **Step 5: Commit**

```bash
git add src/components/DeckPreview.jsx
git commit -m "feat: show line logo and spin type in DeckPreview rows"
```

---

### Task 4: Update DeckWidget

`DeckWidget` is used in the export panel. `ComboRow` shows blade image | name + StatBars. Add the line logo + spin row between the name and StatBars.

**Files:**
- Modify: `src/components/widgets/DeckWidget.jsx`

- [ ] **Step 1: Add getLineLogo to import**

```js
import { BEYBLADE_DB, LIMITED_FORMAT, getLineColor, getLineLogo } from '../../constants';
```

- [ ] **Step 2: Extract spinType inside ComboRow**

`ComboRow` already destructures `{ blade, overBlade, lockChip }` from `combo`. Add:

```js
const spinType = BEYBLADE_DB[blade]?.spinType;
```

- [ ] **Step 3: Insert line logo + spin row in the name/stats column**

The column `<div>` currently has a name `<div>` then `<StatBars>`. Change the name div's `marginBottom` from `'5px'` to `'3px'` and insert between name and StatBars:

```jsx
{blade && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
    <img
      src={`/images/${getLineLogo(blade)}`}
      alt={BEYBLADE_DB[blade]?.line || 'BX'}
      style={{ height: '14px', width: 'auto', objectFit: 'contain' }}
    />
    <span style={{ fontSize: '6.5px', color: accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {spinType?.toUpperCase()} SPIN
    </span>
  </div>
)}
```

- [ ] **Step 4: Verify visually**

Open the Export panel in the app. The "Deck" export widget should show line logo + spin text under each combo name.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/DeckWidget.jsx
git commit -m "feat: show line logo and spin type in DeckWidget rows"
```

---

### Task 5: Update StoryDeckWidget

`StoryDeckWidget` is the 9:16 story-format deck export. `ComboSection` shows blade image | name + stat bars. Add line logo + spin row between name and stat bars.

**Files:**
- Modify: `src/components/widgets/StoryDeckWidget.jsx`

- [ ] **Step 1: Add getLineLogo to import**

```js
import { BEYBLADE_DB, LIMITED_FORMAT, getLineColor, getLineLogo } from '../../constants';
```

- [ ] **Step 2: Extract spinType inside ComboSection**

`ComboSection` already destructures `{ blade, overBlade, lockChip }` from `combo`. Add:

```js
const spinType = BEYBLADE_DB[blade]?.spinType;
```

- [ ] **Step 3: Add getLineLogo to ComboSection props — not needed, blade is in scope. Insert row between name div and stat bars div**

Inside the `<div style={{ flex: 1, minWidth: 0 }}>` column, after the name `<div>` and before the stat bars `<div>`, insert:

```jsx
{blade && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: `${Math.max(2, statGap - 2)}px` }}>
    <img
      src={`/images/${getLineLogo(blade)}`}
      alt={BEYBLADE_DB[blade]?.line || 'BX'}
      style={{ height: '12px', width: 'auto', objectFit: 'contain' }}
    />
    <span style={{ fontSize: '7px', color: accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {spinType?.toUpperCase()} SPIN
    </span>
  </div>
)}
```

Also reduce the name div's `marginBottom` from `${statGap}px` to `'2px'` so there's no double gap.

- [ ] **Step 4: Verify visually**

In the Export panel, select the Story Deck format. Each combo row should have line logo + spin text under the name.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/StoryDeckWidget.jsx
git commit -m "feat: show line logo and spin type in StoryDeckWidget rows"
```

---

### Task 6: Update CompactImageWidget

`CompactImageWidget` has a very compact row: 26px blade image | name (9px) + mini stat bars (2px). Space is tight — use a 10px logo height.

**Files:**
- Modify: `src/components/widgets/CompactImageWidget.jsx`

- [ ] **Step 1: Add getLineLogo to import**

```js
import { BEYBLADE_DB, LIMITED_FORMAT, getLineColor, getLineLogo } from '../../constants';
```

- [ ] **Step 2: Extract spinType inside CompactComboRow**

`CompactComboRow` already destructures `{ blade, overBlade, lockChip }` from `combo`. Add:

```js
const spinType = BEYBLADE_DB[blade]?.spinType;
```

- [ ] **Step 3: Insert line logo + spin row between name div and stat bars div**

Inside the `<div style={{ flex: 1, minWidth: 0 }}>`, after the name `<div>` and before the stat bars `<div>`:

```jsx
{blade && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
    <img
      src={`/images/${getLineLogo(blade)}`}
      alt={BEYBLADE_DB[blade]?.line || 'BX'}
      style={{ height: '10px', width: 'auto', objectFit: 'contain' }}
    />
    <span style={{ fontSize: '6px', color: accent, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {spinType?.toUpperCase()} SPIN
    </span>
  </div>
)}
```

Also reduce the name div's `marginBottom` from `'3px'` to `'1px'`.

- [ ] **Step 4: Verify visually**

In the Export panel, select the Compact Image format. Each row should show the tiny line logo + spin text.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/CompactImageWidget.jsx
git commit -m "feat: show line logo and spin type in CompactImageWidget rows"
```

---

### Task 7: Update CompactListWidget

`CompactListWidget` shows only a number + combo name per row. Add line logo + spin text after the name.

**Files:**
- Modify: `src/components/widgets/CompactListWidget.jsx`

- [ ] **Step 1: Add BEYBLADE_DB and getLineLogo to import**

```js
import { BEYBLADE_DB, LIMITED_FORMAT, getLineColor, getLineLogo } from '../../constants';
```

- [ ] **Step 2: Extract blade and spinType inside the .map() callback**

Inside the `.map()` callback that already extracts `name` and `accent`, add:

```js
const blade = combos[i]?.blade;
const spinType = BEYBLADE_DB[blade]?.spinType;
```

- [ ] **Step 3: Replace the current row div with a two-line column layout**

The current row is:
```jsx
<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <span style={{ fontSize: '9px', color: accent, width: '14px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>{name || '—'}</span>
</div>
```

Replace with:
```jsx
<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <span style={{ fontSize: '9px', color: accent, width: '14px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>{name || '—'}</span>
    {blade && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <img
          src={`/images/${getLineLogo(blade)}`}
          alt={BEYBLADE_DB[blade]?.line || 'BX'}
          style={{ height: '12px', width: 'auto', objectFit: 'contain' }}
        />
        <span style={{ fontSize: '7px', color: accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {spinType?.toUpperCase()} SPIN
        </span>
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 4: Verify visually**

In the Export panel, select the Compact List format. Each row should show name then line logo + spin text beneath it.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/CompactListWidget.jsx
git commit -m "feat: show line logo and spin type in CompactListWidget rows"
```

---

### Task 8: Update SingleComboWidget

`SingleComboWidget` already shows `spinType` and `bitType` as a single text line: `"RIGHT SPIN · ATTACK"`. Replace the spin text portion with line logo + spin text, keeping bit type inline.

**Files:**
- Modify: `src/components/widgets/SingleComboWidget.jsx`

- [ ] **Step 1: Add getLineLogo to import**

```js
import { BEYBLADE_DB, getLineColor, getLineLogo } from '../../constants';
```

- [ ] **Step 2: Replace the text sub-line with logo + spin + bit type**

The current sub-line block is:
```jsx
{(spinType || bitType) && (
  <div style={{ fontSize: '6.5px', color: 'rgba(0,212,255,0.5)', marginTop: '4px', letterSpacing: '0.1em' }}>
    {[spinType && `${spinType.toUpperCase()} SPIN`, bitType && bitType.toUpperCase()].filter(Boolean).join(' · ')}
  </div>
)}
```

Replace with:
```jsx
{(spinType || bitType) && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
    {spinType && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <img
          src={`/images/${getLineLogo(blade)}`}
          alt={BEYBLADE_DB[blade]?.line || 'BX'}
          style={{ height: '16px', width: 'auto', objectFit: 'contain' }}
        />
        <span style={{ fontSize: '6.5px', color: ACCENT, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {spinType.toUpperCase()} SPIN
        </span>
      </div>
    )}
    {bitType && (
      <span style={{ fontSize: '6.5px', color: 'rgba(0,212,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {bitType.toUpperCase()}
      </span>
    )}
  </div>
)}
```

`blade` and `ACCENT` are both already defined at the top of `SingleComboWidget`.

- [ ] **Step 3: Verify visually**

In the Export panel, select the Single Combo format. The area under the combo name should show the line logo + "RIGHT SPIN" alongside the bit type label.

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/SingleComboWidget.jsx
git commit -m "feat: replace spin text with line logo in SingleComboWidget"
```

---

### Task 9: Update StoryComboWidget

`StoryComboWidget` shows spin type as a styled pill tag `{spinType.toUpperCase()} SPIN`. Replace it with a pill containing the line logo image + spin text. The bit type pill is unchanged.

**Files:**
- Modify: `src/components/widgets/StoryComboWidget.jsx`

- [ ] **Step 1: Add getLineLogo to import**

```js
import { BEYBLADE_DB, getLineColor, getLineLogo } from '../../constants';
```

- [ ] **Step 2: Replace the spin pill with logo + text pill**

The current spin pill block inside the type tags section is:
```jsx
{spinType && (
  <span style={{ fontSize: '10px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '6px', padding: '3px 8px', color: ACCENT, letterSpacing: '0.1em', fontWeight: 700 }}>
    {spinType.toUpperCase()} SPIN
  </span>
)}
```

Replace with:
```jsx
{spinType && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,212,255,0.1)', border: `1px solid ${ACCENT}4d`, borderRadius: '6px', padding: '3px 8px' }}>
    <img
      src={`/images/${getLineLogo(blade)}`}
      alt={BEYBLADE_DB[blade]?.line || 'BX'}
      style={{ height: '20px', width: 'auto', objectFit: 'contain' }}
    />
    <span style={{ fontSize: '10px', color: ACCENT, letterSpacing: '0.1em', fontWeight: 700 }}>
      {spinType.toUpperCase()} SPIN
    </span>
  </div>
)}
```

`blade` and `ACCENT` are already defined at the top of `StoryComboWidget`.

- [ ] **Step 3: Verify visually**

In the Export panel, select the Story Combo format. The spin type pill should now show the line logo image alongside the spin text. The bit type pill below it should be unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/StoryComboWidget.jsx
git commit -m "feat: replace spin pill with line logo in StoryComboWidget"
```
