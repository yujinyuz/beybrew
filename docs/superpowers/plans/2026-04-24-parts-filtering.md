# Parts Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-combo-card filter chips (type / line / spin) above each part dropdown to narrow the selection list.

**Architecture:** Extract the inline combo card JSX from `App.jsx` into a new `ComboCard` component that owns local filter state. `applyFilters` pre-filters the options array passed to each `PartSelector`. No changes to `PartSelector`, `constants.js`, or hooks.

**Tech Stack:** React (useState), react-select (unchanged), Tailwind + inline CSS matching existing conventions.

---

## Task 1: Extract ComboCard from App.jsx

**Files:**
- Create: `src/components/ComboCard.jsx`
- Modify: `src/App.jsx` lines 506–751 (the Beyblade cards section)

### Context

`App.jsx` renders each combo card inline inside a `.map()` at line 507. This task moves that block to its own component without changing any behaviour. Filters come in Task 2.

The combo card block needs these values from `App`:
- `index` — combo position
- `bey` — `beyblades[index]` (blade/ratchet/bit/modes/etc.)
- `partsUsed` — array of used part names
- `format` — `currentFormat` object
- `violations` — array pre-filtered to this combo (`violations.filter(v => v.comboIndex === index)`)
- `isDownloading` — bool
- `comboExportStyle` — string
- `styleMenuOpen` — `showComboStyleMenu === index`
- `onPartChange(slot, value)` — calls `handlePartChange(index, slot, value)`
- `onRandomize(formatUserValues)` — calls `handleRandomizeSingle(index, formatUserValues)`
- `onDownload(style?)` — calls `handleDownloadCombo(index, style)`
- `onToggleStyleMenu()` — calls `setShowComboStyleMenu(v => v === index ? null : index)`
- `onCloseStyleMenu()` — calls `setShowComboStyleMenu(null)`
- `formatUserValues` — object

- [ ] **Step 1: Create `src/components/ComboCard.jsx`**

```jsx
import PropTypes from 'prop-types';
import PartSelector from '../PartSelector';
import ModeToggle from '../ModeToggle';
import Beyblade from '../Beyblade';
import {
  BEYBLADE_DB,
  BLADES,
  ASSIST_BLADES,
  OVER_BLADES,
  RATCHETS,
  BITS,
  LOCK_CHIPS,
  getLineColor,
} from '../constants';

function IconRandomize() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
    </svg>
  );
}

function ComboCard({
  index,
  bey,
  partsUsed,
  format,
  violations,
  isDownloading,
  comboExportStyle,
  styleMenuOpen,
  onPartChange,
  onRandomize,
  onDownload,
  onToggleStyleMenu,
  onCloseStyleMenu,
  formatUserValues,
}) {
  return (
    <div
      className="beyblade-card rounded-xl p-5"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${violations.length > 0 ? 'var(--color-danger)' : getLineColor(bey?.blade)}`,
        borderRadius: '12px',
        boxShadow: 'var(--shadow-card)',
        animationDelay: `${index * 60}ms`,
      }}
    >
      {violations.map((v, vi) => (
        <div
          key={vi}
          className="flex items-center gap-1.5 text-xs rounded px-2 py-1 mb-3"
          style={{
            background: 'var(--color-danger-dim)',
            border: '1px solid var(--color-danger-dim)',
            color: 'var(--color-danger)',
            fontWeight: 600,
          }}
        >
          <span style={{ flexShrink: 0 }}>⚠</span>
          {v.message}
        </div>
      ))}

      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ fontFamily: 'var(--font-heading)', color: getLineColor(bey?.blade) }}
        >
          <span
            className="w-5 h-5 rounded flex items-center justify-center text-xs"
            style={{ background: `${getLineColor(bey?.blade)}22`, border: `1px solid ${getLineColor(bey?.blade)}44` }}
          >
            {index + 1}
          </span>
          Beyblade
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRandomize(formatUserValues)}
            title="Randomize this beyblade"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110"
            style={{
              background: 'var(--color-accent-dim)',
              border: '1px solid rgba(0,212,255,0.25)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <IconRandomize />
            Randomize
          </button>
          <div style={{ position: 'relative', display: 'inline-flex' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onDownload()}
              disabled={isDownloading}
              title="Download this combo"
              aria-label={`Download combo ${index + 1}`}
              className="flex items-center justify-center w-7 h-7 transition-all hover:brightness-110"
              style={{
                background: 'var(--color-accent-dim)',
                border: '1px solid rgba(0,212,255,0.25)',
                borderRight: 'none',
                borderRadius: '6px 0 0 6px',
                color: 'var(--color-accent)',
                opacity: isDownloading ? 0.4 : 1,
                cursor: isDownloading ? 'not-allowed' : 'pointer',
              }}
            >
              <IconDownload />
            </button>
            <button
              onClick={onToggleStyleMenu}
              disabled={isDownloading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', height: '28px',
                background: 'var(--color-accent-dim)',
                border: '1px solid rgba(0,212,255,0.25)',
                borderLeft: '1px solid rgba(0,212,255,0.15)',
                borderRadius: '0 6px 6px 0',
                color: 'var(--color-accent)',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                opacity: isDownloading ? 0.4 : 1,
              }}
              aria-label="Choose combo export style"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={styleMenuOpen ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
              </svg>
            </button>
            {styleMenuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: '8px', minWidth: '180px', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 20,
              }}>
                {[
                  { id: 'single',        label: 'Single Combo',       desc: 'Large image, full bars' },
                  { id: 'compact-image', label: 'Compact with Image', desc: 'Small image + bars' },
                  { id: 'story',         label: 'Story (9:16)',        desc: 'Instagram / Facebook Stories' },
                ].map(({ id, label, desc }) => (
                  <button key={id}
                    onClick={() => { onCloseStyleMenu(); onDownload(id); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '9px 14px', textAlign: 'left',
                      background: comboExportStyle === id ? 'var(--color-accent-dim)' : 'transparent',
                      borderLeft: comboExportStyle === id ? '2px solid var(--color-accent)' : '2px solid transparent',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: comboExportStyle === id ? 'var(--color-accent)' : 'var(--color-text)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <PartSelector
        label="Blade"
        options={BLADES}
        value={bey?.blade}
        onChange={(value) => onPartChange('blade', value)}
        partsUsed={partsUsed}
        slot="blade"
        format={format}
        showLineBadge
        modeIndex={bey?.bladeMode ?? 0}
      />
      {BEYBLADE_DB[bey?.blade]?.modes && (
        <ModeToggle
          modes={BEYBLADE_DB[bey.blade].modes}
          value={bey?.bladeMode ?? 0}
          onChange={(i) => onPartChange('bladeMode', i)}
        />
      )}
      {BEYBLADE_DB[bey?.blade]?.line === 'CX' && (
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '10px 10px 2px',
            marginBottom: '8px',
            background: 'var(--color-accent-dim)',
          }}
        >
          <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--color-accent)', marginBottom: '8px', fontWeight: 700 }}>
            — CX Assembly —
          </div>
          <PartSelector
            label="Lock Chip"
            options={LOCK_CHIPS}
            value={bey?.lockChip}
            onChange={(value) => onPartChange('lockChip', value)}
            partsUsed={partsUsed}
            slot="lockChip"
            format={format}
          />
          {BEYBLADE_DB[bey?.blade]?.fourPartCX && (
            <PartSelector
              label="Over Blade"
              options={OVER_BLADES}
              value={bey?.overBlade}
              onChange={(value) => onPartChange('overBlade', value)}
              partsUsed={partsUsed}
              slot="overBlade"
              format={format}
            />
          )}
          <PartSelector
            label="Assist Blade"
            options={ASSIST_BLADES}
            value={bey?.assistBlade}
            onChange={(value) => onPartChange('assistBlade', value)}
            partsUsed={partsUsed}
            slot="assistBlade"
            format={format}
            modeIndex={bey?.assistBladeMode ?? 0}
          />
          {BEYBLADE_DB[bey?.assistBlade]?.modes && (
            <ModeToggle
              modes={BEYBLADE_DB[bey.assistBlade].modes}
              value={bey?.assistBladeMode ?? 0}
              onChange={(i) => onPartChange('assistBladeMode', i)}
            />
          )}
        </div>
      )}
      <PartSelector
        label="Ratchet"
        options={RATCHETS}
        value={bey?.ratchet}
        onChange={(value) => onPartChange('ratchet', value)}
        partsUsed={partsUsed}
        slot="ratchet"
        format={format}
      />
      <PartSelector
        label="Bit"
        options={BITS}
        value={bey?.bit}
        onChange={(value) => onPartChange('bit', value)}
        partsUsed={partsUsed}
        slot="bit"
        format={format}
        modeIndex={bey?.bitMode ?? 0}
      />
      {BEYBLADE_DB[bey?.bit]?.modes && (
        <ModeToggle
          modes={BEYBLADE_DB[bey.bit].modes}
          value={bey?.bitMode ?? 0}
          onChange={(i) => onPartChange('bitMode', i)}
        />
      )}
      <Beyblade
        blade={bey?.blade}
        assistBlade={bey?.assistBlade}
        lockChip={bey?.lockChip}
        overBlade={bey?.overBlade}
        ratchet={bey?.ratchet}
        bit={bey?.bit}
        format={format}
        bladeMode={bey?.bladeMode ?? 0}
        assistBladeMode={bey?.assistBladeMode ?? 0}
        bitMode={bey?.bitMode ?? 0}
      />
    </div>
  );
}

ComboCard.propTypes = {
  index: PropTypes.number.isRequired,
  bey: PropTypes.object,
  partsUsed: PropTypes.arrayOf(PropTypes.string).isRequired,
  format: PropTypes.object.isRequired,
  violations: PropTypes.arrayOf(PropTypes.object).isRequired,
  isDownloading: PropTypes.bool.isRequired,
  comboExportStyle: PropTypes.string.isRequired,
  styleMenuOpen: PropTypes.bool.isRequired,
  onPartChange: PropTypes.func.isRequired,
  onRandomize: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  onToggleStyleMenu: PropTypes.func.isRequired,
  onCloseStyleMenu: PropTypes.func.isRequired,
  formatUserValues: PropTypes.object.isRequired,
};

export default ComboCard;
```

- [ ] **Step 2: Update App.jsx — add import and replace combo card map content**

At the top of `src/App.jsx`, add:
```js
import ComboCard from './components/ComboCard';
```

Remove from the existing constants import block the items that are now only used inside ComboCard:
```js
// Before:
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

// After:
import {
  BUILT_IN_FORMATS,
  CURRENT_PATCH,
} from './constants';
```

Replace the entire `{/* ── Beyblade Cards ── */}` section (lines 505–752 in the original) with:

```jsx
{/* ── Beyblade Cards ── */}
<div className="space-y-4">
  {Array(beybladeCount)
    .fill(null)
    .map((_, index) => (
      <ComboCard
        key={index}
        index={index}
        bey={beyblades[index]}
        partsUsed={partsUsed}
        format={currentFormat}
        violations={violations.filter(v => v.comboIndex === index)}
        isDownloading={isDownloading}
        comboExportStyle={comboExportStyle}
        styleMenuOpen={showComboStyleMenu === index}
        onPartChange={(slot, value) => handlePartChange(index, slot, value)}
        onRandomize={(fmtValues) => handleRandomizeSingle(index, fmtValues)}
        onDownload={(style) => handleDownloadCombo(index, style)}
        onToggleStyleMenu={() => setShowComboStyleMenu((v) => v === index ? null : index)}
        onCloseStyleMenu={() => setShowComboStyleMenu(null)}
        formatUserValues={formatUserValues}
      />
    ))}
</div>
```

- [ ] **Step 3: Verify the refactor in browser**

Run: `npm run dev`

Open http://localhost:5173. Check:
- All combo cards render correctly
- Selecting parts works (blade, ratchet, bit)
- CX line shows the CX Assembly section
- Mode toggles work
- Randomize per-combo works
- Download per-combo works
- Stats bars update when parts change

- [ ] **Step 4: Commit**

```bash
git add src/components/ComboCard.jsx src/App.jsx
git commit -m "refactor: extract ComboCard component from App.jsx"
```

---

## Task 2: Add filter state, helpers, and UI to ComboCard

**Files:**
- Modify: `src/components/ComboCard.jsx`

### Context

This task adds the actual filtering. No other files change.

**Filter dimensions:**
- Blade: `type` (attack/defense/stamina/balance), `line` (BX/UX/CX), `spin` (right/left)
- Ratchet: `type` only
- Bit: `type` only

The `spinType` field on blades is `"right"` or `"left"` (string). The `type` field is `"attack"`, `"defense"`, `"stamina"`, or `"balance"`. The `line` field is `"BX"`, `"UX"`, or `"CX"`.

Ratchets have `type` but no `line` or `spinType`. Bits have `type` but no `line` or `spinType`.

- [ ] **Step 1: Add `useState` to the react import in ComboCard.jsx**

Change the first line of `src/components/ComboCard.jsx` from:
```js
import PropTypes from 'prop-types';
```
to:
```js
import { useState } from 'react';
import PropTypes from 'prop-types';
```

- [ ] **Step 3: Add filter constants and helpers at the top of ComboCard.jsx (before the IconRandomize function)**

Insert after the import block:

```js
// ── Filter chip data ──────────────────────────────────────────────────────────

const TYPE_CHIPS = [
  { key: 'attack',  label: 'Attack',  color: '#f44336' },
  { key: 'defense', label: 'Defense', color: '#42a5f5' },
  { key: 'stamina', label: 'Stamina', color: '#4caf50' },
  { key: 'balance', label: 'Balance', color: '#9c27b0' },
];

const LINE_CHIPS = [
  { key: 'BX', label: 'BX', color: '#42a5f5' },
  { key: 'UX', label: 'UX', color: '#e65c00' },
  { key: 'CX', label: 'CX', color: '#c62828' },
];

const SPIN_CHIPS = [
  { key: 'right', label: '↻ R', color: 'var(--color-accent)' },
  { key: 'left',  label: '↺ L', color: 'var(--color-accent)' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyFilters(names, { type = null, line = null, spin = null } = {}) {
  if (!type && !line && !spin) return names;
  const result = names.filter(name => {
    const db = BEYBLADE_DB[name];
    if (!db) return true;
    if (type && db.type !== type) return false;
    if (line && db.line !== line) return false;
    if (spin && db.spinType !== spin) return false;
    return true;
  });
  return result.length > 0 ? result : names;
}
```

- [ ] **Step 4: Add the FilterChips component (before ComboCard function)**

```jsx
function FilterChips({ chips, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
      {chips.map(({ key, label, color }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(active ? null : key)}
            style={{
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              fontFamily: 'inherit',
              border: `1px solid ${color}`,
              background: active ? color : 'transparent',
              color: active ? '#fff' : color,
              transition: 'all 0.15s',
              lineHeight: '1.6',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

FilterChips.propTypes = {
  chips: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  })).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
```

- [ ] **Step 5: Add filter state inside the ComboCard function body**

At the top of the `ComboCard` function body (before the `return`), add:

```js
const [bladeFilters,   setBladeFilters]   = useState({ type: null, line: null, spin: null });
const [ratchetFilters, setRatchetFilters] = useState({ type: null });
const [bitFilters,     setBitFilters]     = useState({ type: null });

const filteredBlades   = applyFilters(BLADES,   bladeFilters);
const filteredRatchets = applyFilters(RATCHETS,  { type: ratchetFilters.type });
const filteredBits     = applyFilters(BITS,      { type: bitFilters.type });
```

- [ ] **Step 6: Add filter chips above each PartSelector and wire filtered options**

**Blade slot** — replace the existing `<PartSelector label="Blade" ...>` with:

```jsx
{/* Blade filter chips */}
<div style={{ marginBottom: '2px' }}>
  <FilterChips chips={TYPE_CHIPS} value={bladeFilters.type} onChange={(v) => setBladeFilters(f => ({ ...f, type: v }))} />
  <FilterChips chips={LINE_CHIPS} value={bladeFilters.line} onChange={(v) => setBladeFilters(f => ({ ...f, line: v }))} />
  <FilterChips chips={SPIN_CHIPS} value={bladeFilters.spin} onChange={(v) => setBladeFilters(f => ({ ...f, spin: v }))} />
</div>
<PartSelector
  label="Blade"
  options={filteredBlades}
  value={bey?.blade}
  onChange={(value) => onPartChange('blade', value)}
  partsUsed={partsUsed}
  slot="blade"
  format={format}
  showLineBadge
  modeIndex={bey?.bladeMode ?? 0}
/>
```

**Ratchet slot** — replace the existing `<PartSelector label="Ratchet" ...>` with:

```jsx
{/* Ratchet filter chips */}
<FilterChips chips={TYPE_CHIPS} value={ratchetFilters.type} onChange={(v) => setRatchetFilters(f => ({ ...f, type: v }))} />
<PartSelector
  label="Ratchet"
  options={filteredRatchets}
  value={bey?.ratchet}
  onChange={(value) => onPartChange('ratchet', value)}
  partsUsed={partsUsed}
  slot="ratchet"
  format={format}
/>
```

**Bit slot** — replace the existing `<PartSelector label="Bit" ...>` with:

```jsx
{/* Bit filter chips */}
<FilterChips chips={TYPE_CHIPS} value={bitFilters.type} onChange={(v) => setBitFilters(f => ({ ...f, type: v }))} />
<PartSelector
  label="Bit"
  options={filteredBits}
  value={bey?.bit}
  onChange={(value) => onPartChange('bit', value)}
  partsUsed={partsUsed}
  slot="bit"
  format={format}
  modeIndex={bey?.bitMode ?? 0}
/>
```

- [ ] **Step 7: Verify in browser**

Run: `npm run dev`

Open http://localhost:5173. Test:

1. **Type filter (blade):** Click "Attack" chip → dropdown narrows to attack blades only. Click "Attack" again → all blades return.
2. **Line filter (blade):** Click "UX" chip → only UX blades show. Combine with Type: click "Attack" + "UX" → only attack UX blades.
3. **Spin filter (blade):** Click "↺ L" → only left-spin blades. Confirm count visibly reduces.
4. **Graceful fallback:** Set filters that produce zero results (e.g., CX + stamina if no such parts exist) → all options still show (no empty dropdown).
5. **Current value preserved:** Select a blade, then apply a filter that excludes it → the selected blade still shows as the current value in the dropdown.
6. **Ratchet type filter:** Click "Defense" on ratchet slot → only defense ratchets shown.
7. **Bit type filter:** Click "Attack" on bit slot → only attack bits shown.
8. **Multi-combo independence:** Combo 1 filtered to attack, combo 2 shows all → each card is independent.
9. **Stats still update** when selecting parts with filters active.
10. **CX Assembly** still appears when a CX blade is selected.

- [ ] **Step 8: Commit**

```bash
git add src/components/ComboCard.jsx
git commit -m "feat: add per-combo part filtering by type, line, and spin"
```
