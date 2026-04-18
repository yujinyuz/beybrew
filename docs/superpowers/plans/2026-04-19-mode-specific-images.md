# Mode-Specific Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a blade with modes has per-mode images defined, the image shown in `PartSelector` updates to reflect the active mode — in both the selected-value display and the matching option row in the open dropdown.

**Architecture:** Add an optional `image` field to each object in a blade's `modes` array in `parts-overrides.json`. A local `getEffectiveImage` helper in `PartSelector.jsx` resolves the correct image from the mode index. `App.jsx` passes the existing mode state to each `PartSelector` as a new `modeIndex` prop.

**Tech Stack:** React, Vite, `react-select`, Python (`generate_parts.py`)

---

## File Map

| File | Change |
|------|--------|
| `src/data/parts-overrides.json` | Add `image` to each mode object for `LIGHTNING L-DRAGO` |
| `src/data/beyparts.js` | Regenerated (do not edit manually) |
| `src/PartSelector.jsx` | Add `getEffectiveImage` helper + `modeIndex` prop + update `formatOptionLabel` + update PropTypes |
| `src/App.jsx` | Wire `bladeMode`, `assistBladeMode`, `bitMode` into the respective `PartSelector` calls |

---

### Task 1: Add mode images to `parts-overrides.json` and regenerate

**Files:**
- Modify: `src/data/parts-overrides.json` (the `"LIGHTNING L-DRAGO"` entry)
- Regenerate: `src/data/beyparts.js`

- [ ] **Step 1: Update the `"LIGHTNING L-DRAGO"` entry in `parts-overrides.json`**

Find the `"LIGHTNING L-DRAGO"` key (around line 34). The current entry has no `modes` key. The `generate_parts.py` script auto-generates modes from the beydata, but to add images we need to define the modes array explicitly in the override (which takes precedence — see `process_entries` in `generate_parts.py`, line 147: `if len(deduped_base) > 1 and not override.get("modes")`).

Replace the current entry:

```json
"LIGHTNING L-DRAGO": {
  "name": "Lightning L-Drago",
  "image": "Lightning L-Drago 1-60F (Upper Type).jpeg",
  "_description": "A design that emphasizes upper attacks, with three upper BLADEs pointing left.",
  "_source": [
    "BX-00 LIGHTNING L-DRAGO1-60F (upper type)",
    "BX-00 LIGHTNING L-DRAGO1-60F (rapid-hit type)"
  ]
}
```

with:

```json
"LIGHTNING L-DRAGO": {
  "name": "Lightning L-Drago",
  "image": "Lightning L-Drago 1-60F (Upper Type).jpeg",
  "modes": [
    { "label": "Upper Type", "attack": 55, "defense": 25, "stamina": 20, "image": "Lightning L-Drago 1-60F (Upper Type).jpeg" },
    { "label": "Rapid-Hit Type", "attack": 50, "defense": 30, "stamina": 20, "image": "Lightning L-Drago 1-60F (Rapid-Hit Type).jpeg" }
  ],
  "_description": "A design that emphasizes upper attacks, with three upper BLADEs pointing left.",
  "_source": [
    "BX-00 LIGHTNING L-DRAGO1-60F (upper type)",
    "BX-00 LIGHTNING L-DRAGO1-60F (rapid-hit type)"
  ]
}
```

Note: The stats (`attack`, `defense`, `stamina`) are copied from the current `beyparts.js` entry for Lightning L-Drago (line 638). They must be present because this explicit `modes` array suppresses the auto-generation that would otherwise read them from beydata.

- [ ] **Step 2: Regenerate `beyparts.js`**

```bash
python scripts/generate_parts.py
```

Expected output:
```
Written: /path/to/src/data/beyparts.js
  blades: 83, assist_blades: 16, ratchets: 37, bits: 48, lock_chips: 18, over_blades: 3
```

- [ ] **Step 3: Verify the modes array in `beyparts.js` includes image fields**

Open `src/data/beyparts.js` and search for `Lightning L-Drago`. The entry should look like:

```js
{
  name: "Lightning L-Drago",
  points: 1,
  type: "attack",
  image: "Lightning L-Drago 1-60F (Upper Type).jpeg",
  modes: [{"label": "Upper Type", "attack": 55, "defense": 25, "stamina": 20, "image": "Lightning L-Drago 1-60F (Upper Type).jpeg"}, {"label": "Rapid-Hit Type", "attack": 50, "defense": 30, "stamina": 20, "image": "Lightning L-Drago 1-60F (Rapid-Hit Type).jpeg"}],
  line: "BX",
  source: [...],
  description: "...",
},
```

Confirm both mode objects have `"image"` keys.

- [ ] **Step 4: Commit**

```bash
git add src/data/parts-overrides.json src/data/beyparts.js
git commit -m "feat: add mode-specific images for Lightning L-Drago"
```

---

### Task 2: Add `getEffectiveImage` and `modeIndex` prop to `PartSelector.jsx`

**Files:**
- Modify: `src/PartSelector.jsx`

- [ ] **Step 1: Add the `getEffectiveImage` helper function**

Add this function after the `Badge` component (around line 51, before `const selectStyles`):

```js
function getEffectiveImage(partName, modeIndex = 0) {
  const db = BEYBLADE_DB[partName];
  if (!db) return null;
  if (db.modes && modeIndex > 0) return db.modes[modeIndex - 1]?.image || db.image;
  if (db.modes) return db.modes[0]?.image || db.image;
  return db.image;
}
```

This mirrors `getStats` in `constants.js`: mode 0 maps to `modes[0]`, mode N maps to `modes[N-1]`.

- [ ] **Step 2: Add `modeIndex` to `PartSelector`'s function signature**

Change the function signature from:

```js
function PartSelector({ label, options, value, onChange, partsUsed, currentFormat, showLineBadge = false }) {
```

to:

```js
function PartSelector({ label, options, value, onChange, partsUsed, currentFormat, showLineBadge = false, modeIndex = 0 }) {
```

- [ ] **Step 3: Update `formatOptionLabel` to use `getEffectiveImage` for the selected option**

Inside `formatOptionLabel`, find the line that computes the image:

```jsx
{db?.image && (
  <span className="flex-shrink-0 rounded overflow-hidden" style={{ background: '#fff', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <img className="h-6 w-6 object-contain" src={`/images/${db.image}`} alt="" />
  </span>
)}
```

Replace it with:

```jsx
{(() => {
  const effectiveImage = option.value === value
    ? getEffectiveImage(option.value, modeIndex)
    : db?.image;
  return effectiveImage ? (
    <span className="flex-shrink-0 rounded overflow-hidden" style={{ background: '#fff', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <img className="h-6 w-6 object-contain" src={`/images/${effectiveImage}`} alt="" />
    </span>
  ) : null;
})()}
```

- [ ] **Step 4: Update PropTypes**

Find the `PartSelector.propTypes` block at the bottom of the file and add `modeIndex`:

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

- [ ] **Step 5: Commit**

```bash
git add src/PartSelector.jsx
git commit -m "feat: add modeIndex prop and getEffectiveImage to PartSelector"
```

---

### Task 3: Wire `modeIndex` into `App.jsx` selectors

**Files:**
- Modify: `src/App.jsx` (~lines 489–580)

- [ ] **Step 1: Wire `bladeMode` into the Blade `PartSelector`**

Find the Blade `PartSelector` (around line 489):

```jsx
<PartSelector
  label="Blade"
  options={BLADES}
  value={beyblades[index]?.blade}
  onChange={(value) => handlePartChange(index, 'blade', value)}
  partsUsed={partsUsed}
  currentFormat={currentFormat}
  showLineBadge
/>
```

Add `modeIndex`:

```jsx
<PartSelector
  label="Blade"
  options={BLADES}
  value={beyblades[index]?.blade}
  onChange={(value) => handlePartChange(index, 'blade', value)}
  partsUsed={partsUsed}
  currentFormat={currentFormat}
  showLineBadge
  modeIndex={beyblades[index]?.bladeMode ?? 0}
/>
```

- [ ] **Step 2: Wire `assistBladeMode` into the Assist Blade `PartSelector`**

Find the Assist Blade `PartSelector` (around line 541):

```jsx
<PartSelector
  label="Assist Blade"
  options={ASSIST_BLADES}
  value={beyblades[index]?.assistBlade}
  onChange={(value) => handlePartChange(index, 'assistBlade', value)}
  partsUsed={partsUsed}
  currentFormat={currentFormat}
/>
```

Add `modeIndex`:

```jsx
<PartSelector
  label="Assist Blade"
  options={ASSIST_BLADES}
  value={beyblades[index]?.assistBlade}
  onChange={(value) => handlePartChange(index, 'assistBlade', value)}
  partsUsed={partsUsed}
  currentFormat={currentFormat}
  modeIndex={beyblades[index]?.assistBladeMode ?? 0}
/>
```

- [ ] **Step 3: Wire `bitMode` into the Bit `PartSelector`**

Find the Bit `PartSelector` (around line 566):

```jsx
<PartSelector
  label="Bit"
  options={BITS}
  value={beyblades[index]?.bit}
  onChange={(value) => handlePartChange(index, 'bit', value)}
  partsUsed={partsUsed}
  currentFormat={currentFormat}
/>
```

Add `modeIndex`:

```jsx
<PartSelector
  label="Bit"
  options={BITS}
  value={beyblades[index]?.bit}
  onChange={(value) => handlePartChange(index, 'bit', value)}
  partsUsed={partsUsed}
  currentFormat={currentFormat}
  modeIndex={beyblades[index]?.bitMode ?? 0}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire modeIndex into blade/assist-blade/bit PartSelector"
```

---

### Task 4: Manual verification

**Files:** None — dev server only

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the URL shown in the terminal (default: `http://localhost:5173`).

- [ ] **Step 2: Test Lightning L-Drago mode image switching**

1. Add a combo and select **Lightning L-Drago** as the Blade.
2. Confirm the ModeToggle shows three buttons: **Default**, **Upper Type**, **Rapid-Hit Type**.
3. With **Default** active: the image in the Blade selector control should show the Upper Type image.
4. Click **Rapid-Hit Type**: the image in the Blade selector control should change to the Rapid-Hit Type image.
5. Open the Blade dropdown: the Lightning L-Drago option row should show the Rapid-Hit Type image (it is the currently-selected blade with mode active).
6. Switch back to **Upper Type**: the image should revert to the Upper Type image in both the control and the open dropdown.

- [ ] **Step 3: Confirm other blades are unaffected**

Select any blade without modes (e.g. Dran Sword). Confirm its image displays normally and the behavior is unchanged.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no errors.
