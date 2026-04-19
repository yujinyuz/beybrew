# Deck Profile KPI Circles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace horizontal stat bars in `DeckProfilePanel` with SVG donut-ring KPI circles showing each stat as a percentage.

**Architecture:** Drop-in component swap inside `DeckProfilePanel.jsx` — remove `StatBar`, add `StatCircle` (SVG donut), change the stats layout from a flex column to a flex row. No data or constants changes needed.

**Tech Stack:** React, inline SVG, existing `STAT_DEFS` / `STAT_LIMITS` from `src/lib/comboUtils.js`

---

### Task 1: Replace StatBar with StatCircle in DeckProfilePanel.jsx

**Files:**
- Modify: `src/components/DeckProfilePanel.jsx`

The circumference of a circle with r=17 is `2 * Math.PI * 17 ≈ 106.8`.
Fill amount: `strokeDashoffset = 106.8 * (1 - pct)` where `pct = Math.min(1, value / STAT_LIMITS[key])`.

Label abbreviations to use:
| key | abbr |
|-----|------|
| attack | ATK |
| defense | DEF |
| stamina | STA |
| xDash | XD |
| burstResistance | BR |

- [ ] **Step 1: Open the file and read it**

Open `src/components/DeckProfilePanel.jsx`. Confirm the file starts with the `StatBar` component (lines ~7–21) and that `DeckProfilePanel` renders a flex column of `<StatBar>` elements inside the stats area (lines ~143–146).

- [ ] **Step 2: Replace StatBar with StatCircle and update the stats layout**

Replace the entire file contents with the following:

```jsx
import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getDeckProfile, STAT_DEFS } from '../lib/comboUtils';

const STAT_LIMITS = Object.fromEntries(STAT_DEFS.map(d => [d.key, d.limit]));
const CIRCUMFERENCE = 2 * Math.PI * 17;

const STAT_ABBR = {
  attack: 'ATK',
  defense: 'DEF',
  stamina: 'STA',
  xDash: 'XD',
  burstResistance: 'BR',
};

function StatCircle({ statDef, value }) {
  const pct = Math.min(1, (value || 0) / STAT_LIMITS[statDef.key]);
  const offset = CIRCUMFERENCE * (1 - pct);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle
          cx="22" cy="22" r="17"
          fill="none"
          stroke={statDef.color}
          strokeWidth="4"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
        />
        <text
          x="22" y="26"
          textAnchor="middle"
          fill={statDef.color}
          fontSize="10"
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
        >
          {Math.round(pct * 100)}
        </text>
      </svg>
      <span style={{ fontSize: '8px', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {STAT_ABBR[statDef.key]}
      </span>
    </div>
  );
}

StatCircle.propTypes = {
  statDef: PropTypes.shape({ key: PropTypes.string, color: PropTypes.string }).isRequired,
  value: PropTypes.number,
};

function BladerNameField({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing) {
      cancelledRef.current = false;
      inputRef.current?.focus();
    }
  }, [editing]);

  const confirm = () => {
    if (cancelledRef.current) return;
    setEditing(false);
    onChange(draft.trim().slice(0, 32));
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        aria-label="Blader name"
        value={draft}
        maxLength={32}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirm();
          if (e.key === 'Escape') {
            cancelledRef.current = true;
            setDraft(value);
            setEditing(false);
          }
        }}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: '4px',
          color: 'var(--color-text)',
          fontSize: '11px',
          fontFamily: 'var(--font-body)',
          padding: '2px 6px',
          outline: 'none',
          width: '100px',
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit blader name"
      style={{
        color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontSize: '11px',
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: '4px',
        borderBottom: '1px dashed rgba(0,212,255,0.3)',
      }}
    >
      {value || 'your name...'}
    </span>
  );
}

BladerNameField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function DeckProfilePanel({ beyblades, bladerName, onBladerNameChange }) {
  const profile = getDeckProfile(beyblades);
  if (!profile) return null;

  return (
    <div
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid rgba(0,212,255,0.12)',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
          Deck Profile
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Blader:</span>
          <BladerNameField value={bladerName} onChange={onBladerNameChange} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{profile.emoji}</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: profile.color, letterSpacing: '1px', whiteSpace: 'nowrap', fontFamily: 'var(--font-heading)' }}>
            {profile.archetype}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '80px', lineHeight: 1.3 }}>
            {profile.flavor}
          </span>
        </div>

        <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {STAT_DEFS.map((def) => (
            <StatCircle key={def.key} statDef={def} value={profile.averageStats[def.key]} />
          ))}
        </div>
      </div>
    </div>
  );
}

DeckProfilePanel.propTypes = {
  beyblades: PropTypes.array.isRequired,
  bladerName: PropTypes.string.isRequired,
  onBladerNameChange: PropTypes.func.isRequired,
};

export default DeckProfilePanel;
```

- [ ] **Step 3: Start the dev server and verify visually**

```bash
npm run dev
```

Open the app, select at least one blade combo. The Deck Profile panel should show 5 donut rings (ATK, DEF, STA, XD, BR) instead of horizontal bars. Check:
- Rings fill clockwise from the top
- Colors match (cyan for ATK, green for DEF, yellow for STA, orange for XD, purple for BR)
- Percentage values render inside each ring
- Panel height is visually reasonable (not too tall)
- Archetype section (emoji, name, flavor, blader name) is unchanged

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/DeckProfilePanel.jsx
git commit -m "feat: replace stat bars with KPI donut circles in deck profile panel"
```
