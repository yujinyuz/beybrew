# Stat Delta on Part Change — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show colored +/− stat delta badges in the part dropdown (before selecting) and as a fading flash on the stat bars (after selecting).

**Architecture:** Two independent UI changes — (A) `PartSelector.jsx` computes per-part deltas inside `formatOptionLabel` using the already-available `value` + `getStats`, and (C) `Beyblade.jsx` tracks previous combo totals via a ref, triggers flash state on change, and passes delta/visibility props to `StatsBar`. No new files, no new props on PartSelector, no data changes.

**Tech Stack:** React (hooks: `useEffect`, `useRef`, `useState`), existing `getStats()` from `src/constants.js`, Tailwind CSS utility classes, inline styles matching existing patterns.

---

## File Map

| File | Change |
|------|--------|
| `src/PartSelector.jsx` | Add `getStats` to import; add `computeDropdownDeltas` helper; update `formatOptionLabel` to render delta badges |
| `src/Beyblade.jsx` | Update `StatsBar` to accept `delta`/`deltaVisible` props; add flash tracking to `Beyblade`; wire to each `StatsBar` call |

---

## Task 1: Add inline stat deltas to PartSelector dropdown

**Files:**
- Modify: `src/PartSelector.jsx`

### Context

`PartSelector` already has `value` (current part name) and `modeIndex`. It imports `BEYBLADE_DB` and `getLineLogo` from `./constants`. We need to also import `getStats`, add a delta-computation helper, and render delta badges in `formatOptionLabel` for all non-current options when a current part is selected.

The delta for a candidate = `getStats(candidateName, 0)[stat] - getStats(currentName, modeIndex)[stat]`. Candidate always uses mode 0 (no mode selected yet). Only non-zero deltas are shown.

The existing `formatOptionLabel` ends with an optional Metal Blade badge using `ml-auto`. We'll wrap that badge and the new delta badges together in a single `ml-auto` right-side container.

- [ ] **Step 1: Add `getStats` to the constants import**

In `src/PartSelector.jsx`, line 4, change:

```js
import { BEYBLADE_DB, getLineLogo } from './constants';
```

to:

```js
import { BEYBLADE_DB, getLineLogo, getStats } from './constants';
```

- [ ] **Step 2: Add `computeDropdownDeltas` helper after the `getEffectiveImage` function (after line 54)**

Insert this function between `getEffectiveImage` and `const selectStyles`:

```js
const STAT_LABELS = { attack: 'ATK', defense: 'DEF', stamina: 'STA', xDash: 'XD', burstResistance: 'BR' };

function computeDropdownDeltas(candidateName, currentName, currentModeIndex) {
  if (!currentName || !candidateName || candidateName === currentName) return [];
  const current = getStats(currentName, currentModeIndex);
  const candidate = getStats(candidateName, 0);
  return Object.entries(STAT_LABELS)
    .map(([key, label]) => ({ key, label, delta: (candidate[key] || 0) - (current[key] || 0) }))
    .filter(({ delta }) => delta !== 0);
}
```

- [ ] **Step 3: Update `formatOptionLabel` inside the `Select` to render delta badges**

Find the `formatOptionLabel` callback inside the `<Select>` (around line 219). Replace the entire callback with:

```jsx
formatOptionLabel={(option) => {
  if (!option.value) return <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', opacity: 0.6 }}>{option.label}</span>;
  const db = BEYBLADE_DB[option.value];
  const deltas = computeDropdownDeltas(option.value, value, modeIndex);
  return (
    <span className="flex flex-row items-center gap-1.5 w-full">
      {showLineBadge && <img src={`/images/${getLineLogo(option.value)}`} alt="" style={{ height: 16, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />}
      {db?.type && <img className="h-5 w-5 object-contain flex-shrink-0" src={`/images/${db.type}.png`} alt="" />}
      {(() => {
        const effectiveImage = option.value === value
          ? getEffectiveImage(option.value, modeIndex)
          : db?.image;
        return effectiveImage ? (
          <span className="flex-shrink-0 rounded overflow-hidden" style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img className="h-6 w-6 object-contain" src={`/images/${effectiveImage}`} alt="" />
          </span>
        ) : null;
      })()}
      <span style={{ fontSize: '13px' }}>{option.label}</span>
      <span className="ml-auto flex items-center gap-1 flex-shrink-0">
        {showLineBadge && db?.fourPartCX && <Badge label="Metal Blade" color="#7c3aed" />}
        {deltas.map(({ key, label: statLabel, delta }) => (
          <span
            key={key}
            style={{
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 4px',
              borderRadius: '3px',
              color: delta > 0 ? '#00e676' : '#ff4455',
              background: delta > 0 ? 'rgba(0,230,118,0.12)' : 'rgba(255,68,85,0.12)',
            }}
          >
            {statLabel} {delta > 0 ? `+${delta}` : delta}
          </span>
        ))}
      </span>
    </span>
  );
}}
```

- [ ] **Step 4: Verify in dev server**

```bash
npm run dev
```

Open a combo card, click any part dropdown (e.g., Bit). Confirm:
- Each option row shows colored ATK/DEF/STA/XD/BR badges on the right side for stats that differ from the current part.
- The currently selected part row shows no delta badges.
- If no part is selected yet (empty slot), no badges appear on any row.
- Metal Blade badge still appears correctly for CX blades.

- [ ] **Step 5: Commit**

```bash
git add src/PartSelector.jsx
git commit -m "feat(ux): show stat deltas inline in part selector dropdown"
```

---

## Task 2: Add `delta` and `deltaVisible` props to `StatsBar`

**Files:**
- Modify: `src/Beyblade.jsx` (the `StatsBar` function only, lines 5–41)

### Context

`StatsBar` currently renders a label, numeric value, and animated bar. We need to add an optional fading delta badge next to the numeric value. The badge is controlled by two new props: `delta` (number) and `deltaVisible` (boolean, controls opacity for the fade-out transition).

- [ ] **Step 1: Update `StatsBar` to accept and render delta badge**

Replace the entire `StatsBar` function (lines 5–41 in `src/Beyblade.jsx`) with:

```jsx
function StatsBar({ label, amount, gradient, glowColor, limit = 1, delta, deltaVisible }) {
  const pct = Math.min(100, (amount || 0) / limit);
  const [width, setWidth] = useState('0%');

  useEffect(() => {
    setWidth('0%');
    const t = setTimeout(() => setWidth(`${pct}%`), 40);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.12em' }}
        >
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {delta !== undefined && delta !== 0 && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: delta > 0 ? '#00e676' : '#ff4455',
                opacity: deltaVisible ? 1 : 0,
                transition: 'opacity 0.4s ease',
                minWidth: '28px',
                textAlign: 'right',
              }}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
            {amount || 0}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-stat-track)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width,
            background: gradient,
            boxShadow: `0 0 6px ${glowColor}`,
            transition: 'width 0.75s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `StatsBar.propTypes` to include new props**

Replace the existing `StatsBar.propTypes` block (lines 43–49) with:

```js
StatsBar.propTypes = {
  label: PropTypes.string.isRequired,
  amount: PropTypes.number,
  gradient: PropTypes.string.isRequired,
  glowColor: PropTypes.string.isRequired,
  limit: PropTypes.number,
  delta: PropTypes.number,
  deltaVisible: PropTypes.bool,
};
```

- [ ] **Step 3: Verify `StatsBar` renders without errors**

```bash
npm run dev
```

The combo cards should look identical to before — no delta badges yet (they're only rendered when `delta` prop is non-zero, which nothing passes yet).

- [ ] **Step 4: Commit**

```bash
git add src/Beyblade.jsx
git commit -m "feat(ux): add delta flash prop support to StatsBar"
```

---

## Task 3: Track previous totals in `Beyblade` and trigger flash

**Files:**
- Modify: `src/Beyblade.jsx` (the `Beyblade` function, starting at line 51)

### Context

The `Beyblade` component computes `attackTotal`, `defenseTotal`, `staminaTotal`, `xDashTotal`, and `burstResistanceTotal` from its props. We need to:
1. Track these totals from the previous render using `useRef`.
2. Skip the flash on the initial render (page load / URL hydration).
3. On change, compute the delta for each stat, store in state as `{ deltas: {attack: N, ...}, visible: true }`.
4. After 1600ms, flip `visible` to false — the 0.4s CSS transition on the badge handles the visual fade.
5. Pass `delta` and `deltaVisible` into each `StatsBar` call.

The `useRef` import is not currently in `Beyblade.jsx` — add it.

- [ ] **Step 1: Add `useRef` to the React import**

In `src/Beyblade.jsx`, line 1, change:

```js
import { useEffect, useState } from 'react';
```

to:

```js
import { useEffect, useRef, useState } from 'react';
```

- [ ] **Step 2: Add flash state and tracking refs inside the `Beyblade` function**

After the five `getStats(...)` calls (after line 56 in the original), add:

```js
const prevTotalsRef = useRef(null);
const isMounted = useRef(false);
const [flashState, setFlashState] = useState({ deltas: {}, visible: false });
```

- [ ] **Step 3: Add `useEffect` to detect stat changes and trigger flash**

After the `burstResistanceTotal` computation (after the five total variables), add:

```js
useEffect(() => {
  const current = {
    attack: attackTotal,
    defense: defenseTotal,
    stamina: staminaTotal,
    xDash: xDashTotal,
    burstResistance: burstResistanceTotal,
  };

  if (!isMounted.current) {
    isMounted.current = true;
    prevTotalsRef.current = current;
    return;
  }

  const prev = prevTotalsRef.current || {};
  const deltas = {};
  for (const [stat, val] of Object.entries(current)) {
    const d = val - (prev[stat] || 0);
    if (d !== 0) deltas[stat] = d;
  }
  prevTotalsRef.current = current;

  if (Object.keys(deltas).length === 0) return;

  setFlashState({ deltas, visible: true });
  const t = setTimeout(() => setFlashState(s => ({ ...s, visible: false })), 1600);
  return () => clearTimeout(t);
}, [attackTotal, defenseTotal, staminaTotal, xDashTotal, burstResistanceTotal]);
```

- [ ] **Step 4: Wire `flashState` into each `StatsBar` call**

The five `StatsBar` calls in the `Beyblade` return are currently (lines 109–113):

```jsx
<StatsBar label="Attack"           amount={attackTotal}          gradient="linear-gradient(90deg,#1565c0,#00d4ff)" glowColor="rgba(0,212,255,0.35)"   limit={2} />
<StatsBar label="Defense"          amount={defenseTotal}         gradient="linear-gradient(90deg,#2e7d32,#00e676)" glowColor="rgba(0,230,118,0.3)"    limit={2} />
<StatsBar label="Stamina"          amount={staminaTotal}         gradient="linear-gradient(90deg,#e65100,#ffcc02)" glowColor="rgba(255,180,0,0.3)"    limit={2} />
<StatsBar label="Xtreme Dash"      amount={xDashTotal}           gradient="linear-gradient(90deg,#b71c1c,#ff6d00)" glowColor="rgba(255,109,0,0.35)"   />
<StatsBar label="Burst Resistance" amount={burstResistanceTotal} gradient="linear-gradient(90deg,#4a148c,#aa00ff)" glowColor="rgba(170,0,255,0.3)"   />
```

Replace them with:

```jsx
<StatsBar label="Attack"           amount={attackTotal}          gradient="linear-gradient(90deg,#1565c0,#00d4ff)" glowColor="rgba(0,212,255,0.35)"   limit={2} delta={flashState.deltas.attack}          deltaVisible={flashState.visible} />
<StatsBar label="Defense"          amount={defenseTotal}         gradient="linear-gradient(90deg,#2e7d32,#00e676)" glowColor="rgba(0,230,118,0.3)"    limit={2} delta={flashState.deltas.defense}         deltaVisible={flashState.visible} />
<StatsBar label="Stamina"          amount={staminaTotal}         gradient="linear-gradient(90deg,#e65100,#ffcc02)" glowColor="rgba(255,180,0,0.3)"    limit={2} delta={flashState.deltas.stamina}         deltaVisible={flashState.visible} />
<StatsBar label="Xtreme Dash"      amount={xDashTotal}           gradient="linear-gradient(90deg,#b71c1c,#ff6d00)" glowColor="rgba(255,109,0,0.35)"            delta={flashState.deltas.xDash}            deltaVisible={flashState.visible} />
<StatsBar label="Burst Resistance" amount={burstResistanceTotal} gradient="linear-gradient(90deg,#4a148c,#aa00ff)" glowColor="rgba(170,0,255,0.3)"            delta={flashState.deltas.burstResistance}  deltaVisible={flashState.visible} />
```

- [ ] **Step 5: Verify full feature in dev server**

```bash
npm run dev
```

Test the following:

1. **Dropdown deltas (Feature A):** Open any part dropdown with a part already selected. Every option row should show colored ATK/DEF/STA badges. Non-changing stats should not show a badge. The current part row should have no badges.

2. **Post-select flash (Feature C):** Select a different part. The stat bars should update, and delta badges (+N in green, −N in red) should appear next to each changed stat value, then fade out after ~2 seconds.

3. **First load — no flash:** Reload the page with a URL that has parts pre-selected (e.g., use Share to copy a URL first). The stat bars should appear without any delta flash on load.

4. **Turbo sync (multi-part change):** If your Beyblade DB has a Turbo ratchet-integrated bit (selecting it auto-syncs both ratchet and bit), select it and verify the flash shows the net combined delta.

5. **Empty slot — no dropdown deltas:** Clear a part selector and open the dropdown. No delta badges should appear since there's no baseline.

- [ ] **Step 6: Commit**

```bash
git add src/Beyblade.jsx
git commit -m "feat(ux): flash stat deltas on combo card after part change"
```
