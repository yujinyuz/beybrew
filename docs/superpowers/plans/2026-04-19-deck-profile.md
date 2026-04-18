# Deck Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live Deck Profile panel below the combo summary that classifies the deck as one of 8 `X-` blader archetypes using weighted scoring across 5 stats, with an editable blader name saved to a compressed share URL.

**Architecture:** `getDeckProfile()` in `comboUtils.js` averages stats across filled combos, normalizes them, and scores all 8 archetypes by weighted formula — highest wins. `shareUrl.js` is updated to encode the full deck payload (including blader name) as a single `?d=` param via lz-string compression, with legacy `?beys=` fallback for old shared links. `DeckProfilePanel` is a new React component rendered in `App.jsx` between the config card and the combo cards.

**Tech Stack:** React 18, Vitest (node env, no jsdom), lz-string, existing `STAT_DEFS` from `comboUtils.js`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/lib/comboUtils.js` | Add archetype table + `getDeckProfile()` |
| Create | `src/lib/comboUtils.test.js` | Tests for `getDeckProfile` |
| Modify | `src/lib/shareUrl.js` | Add `parseShareToken()`, update `buildShareUrl()` to use lz-string |
| Create | `src/lib/shareUrl.test.js` | Tests for compression roundtrip |
| Modify | `src/hooks/useBeybladeDeck.js` | Add `bladerName` state + parse from `?d=` token |
| Create | `src/components/DeckProfilePanel.jsx` | New panel component |
| Modify | `src/App.jsx` | Render `DeckProfilePanel`, pass `bladerName` to `ShareModal` |
| Modify | `src/components/ShareModal.jsx` | Accept `bladerName` prop, pass to `buildShareUrl` |

---

## Task 1: Install lz-string

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install lz-string
```

- [ ] **Step 2: Verify it appears in package.json**

```bash
grep lz-string package.json
```

Expected: `"lz-string": "^1.x.x"` under `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lz-string for URL compression"
```

---

## Task 2: Add getDeckProfile to comboUtils.js (TDD)

**Files:**
- Modify: `src/lib/comboUtils.js`
- Create: `src/lib/comboUtils.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/comboUtils.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { getDeckProfile } from './comboUtils';

describe('getDeckProfile', () => {
  it('returns null when no combos have a blade', () => {
    expect(getDeckProfile([])).toBeNull();
    expect(getDeckProfile([{ blade: '', ratchet: '', bit: '' }])).toBeNull();
  });

  it('returns null when beyblades array is empty', () => {
    expect(getDeckProfile([])).toBeNull();
  });

  it('returns an object with archetype, emoji, flavor, color, averageStats', () => {
    const combos = [{ blade: 'Dran Sword', ratchet: '3-60', bit: 'Flat' }];
    const result = getDeckProfile(combos);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('archetype');
    expect(result).toHaveProperty('emoji');
    expect(result).toHaveProperty('flavor');
    expect(result).toHaveProperty('color');
    expect(result).toHaveProperty('averageStats');
    expect(result.averageStats).toHaveProperty('attack');
    expect(result.averageStats).toHaveProperty('defense');
    expect(result.averageStats).toHaveProperty('stamina');
    expect(result.averageStats).toHaveProperty('xDash');
    expect(result.averageStats).toHaveProperty('burstResistance');
  });

  it('archetype is one of the 8 X- types', () => {
    const VALID = ['X-Rusher','X-Berserker','X-Fortress','X-Ironwall','X-Endurance','X-Counter','X-Specialist','X-Tactician'];
    const combos = [{ blade: 'Dran Sword', ratchet: '3-60', bit: 'Flat' }];
    const result = getDeckProfile(combos);
    expect(VALID).toContain(result.archetype);
  });

  it('ignores combos without a blade when averaging', () => {
    const filled = { blade: 'Dran Sword', ratchet: '3-60', bit: 'Flat' };
    const empty = { blade: '', ratchet: '', bit: '' };
    const resultOne = getDeckProfile([filled]);
    const resultMixed = getDeckProfile([filled, empty, empty]);
    // averageStats should be the same since empties are ignored
    expect(resultMixed.averageStats).toEqual(resultOne.averageStats);
  });

  it('averageStats.attack is the mean attack across filled combos', () => {
    // Use two identical combos — mean should equal single combo stats
    const combo = { blade: 'Dran Sword', ratchet: '3-60', bit: 'Flat' };
    const single = getDeckProfile([combo]);
    const double = getDeckProfile([combo, combo]);
    expect(double.averageStats.attack).toBeCloseTo(single.averageStats.attack, 5);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- comboUtils
```

Expected: FAIL — `getDeckProfile is not a function`

- [ ] **Step 3: Implement getDeckProfile in comboUtils.js**

Add to the bottom of `src/lib/comboUtils.js` (after existing exports):

```js
const ARCHETYPES = [
  {
    key: 'X-Rusher',
    emoji: '⚡',
    flavor: 'Built for the stadium-out',
    color: '#ff4444',
    score: ({ atk, xd }) => atk * 0.5 + xd * 0.5,
  },
  {
    key: 'X-Berserker',
    emoji: '🔥',
    flavor: 'All-in, no safety net',
    color: '#e91e63',
    score: ({ atk, def, sta }) => atk * 0.6 + (1 - def) * 0.2 + (1 - sta) * 0.2,
  },
  {
    key: 'X-Fortress',
    emoji: '🛡️',
    flavor: 'Absorbs everything',
    color: '#1565c0',
    score: ({ def, burst }) => def * 0.5 + burst * 0.5,
  },
  {
    key: 'X-Ironwall',
    emoji: '💎',
    flavor: 'Nearly impossible to KO',
    color: '#7b1fa2',
    score: ({ def, burst }) => def * 0.35 + burst * 0.65,
  },
  {
    key: 'X-Endurance',
    emoji: '⏳',
    flavor: 'Spins forever',
    color: '#ffcc02',
    score: ({ sta, def }) => sta * 0.7 + def * 0.3,
  },
  {
    key: 'X-Counter',
    emoji: '🔄',
    flavor: 'Absorb and punish',
    color: '#00bcd4',
    score: ({ def, atk, burst }) => def * 0.5 + atk * 0.3 + burst * 0.2,
  },
  {
    key: 'X-Specialist',
    emoji: '💨',
    flavor: 'Speed is the only strategy',
    color: '#ff7043',
    score: ({ xd, atk }) => xd * 0.8 + atk * 0.2,
  },
  {
    key: 'X-Tactician',
    emoji: '🧠',
    flavor: 'No weakness, no weakness',
    color: '#78909c',
    score: ({ atk, def, sta, xd, burst }) => {
      const vals = [atk, def, sta, xd, burst];
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      return 1 - Math.sqrt(variance) / 0.5;
    },
  },
];

const STAT_LIMITS = { attack: 2, defense: 2, stamina: 2, xDash: 1, burstResistance: 1 };

export function getDeckProfile(beyblades) {
  const filled = beyblades.filter(b => b?.blade);
  if (filled.length === 0) return null;

  const totals = { attack: 0, defense: 0, stamina: 0, xDash: 0, burstResistance: 0 };
  filled.forEach(combo => {
    const s = getComboStats(combo);
    totals.attack += s.attack;
    totals.defense += s.defense;
    totals.stamina += s.stamina;
    totals.xDash += s.xDash;
    totals.burstResistance += s.burstResistance;
  });

  const n = filled.length;
  const avg = {
    attack: totals.attack / n,
    defense: totals.defense / n,
    stamina: totals.stamina / n,
    xDash: totals.xDash / n,
    burstResistance: totals.burstResistance / n,
  };

  const norm = {
    atk: avg.attack / STAT_LIMITS.attack,
    def: avg.defense / STAT_LIMITS.defense,
    sta: avg.stamina / STAT_LIMITS.stamina,
    xd: avg.xDash / STAT_LIMITS.xDash,
    burst: avg.burstResistance / STAT_LIMITS.burstResistance,
  };

  let best = ARCHETYPES[0];
  let bestScore = -Infinity;
  for (const archetype of ARCHETYPES) {
    const s = archetype.score(norm);
    if (s > bestScore) { bestScore = s; best = archetype; }
  }

  return { archetype: best.key, emoji: best.emoji, flavor: best.flavor, color: best.color, averageStats: avg };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- comboUtils
```

Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/comboUtils.js src/lib/comboUtils.test.js
git commit -m "feat: add getDeckProfile with 8 weighted archetypes"
```

---

## Task 3: Update shareUrl.js for compressed URLs (TDD)

**Files:**
- Modify: `src/lib/shareUrl.js`
- Create: `src/lib/shareUrl.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/shareUrl.test.js`:

```js
import { describe, it, expect } from 'vitest';
import LZString from 'lz-string';
import { parseShareToken } from './shareUrl';

describe('parseShareToken', () => {
  it('returns null for invalid input', () => {
    expect(parseShareToken('not-valid-base64!!!!')).toBeNull();
    expect(parseShareToken('')).toBeNull();
  });

  it('roundtrips a full payload', () => {
    const payload = {
      beys: ['DranSword,3-60,Flat,,,,0,0,0'],
      beynum: 1,
      format: 'standard',
      name: 'Valt',
    };
    const token = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
    expect(parseShareToken(token)).toEqual(payload);
  });

  it('handles empty name', () => {
    const payload = { beys: [], beynum: 3, format: 'limited', name: '' };
    const token = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
    const result = parseShareToken(token);
    expect(result.name).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- shareUrl
```

Expected: FAIL — `parseShareToken is not a function`

- [ ] **Step 3: Update shareUrl.js**

Replace the entire contents of `src/lib/shareUrl.js` with:

```js
import LZString from 'lz-string';

function serializeBey(bey) {
  return `${bey.blade},${bey.ratchet},${bey.bit},${bey.assistBlade || ''},${bey.lockChip || ''},${bey.bladeMode || 0},${bey.assistBladeMode || 0},${bey.bitMode || 0},${bey.overBlade || ''}`;
}

export function buildShareUrl(beyblades, beybladeCount, format, bladerName = '') {
  const payload = {
    beys: beyblades.map(serializeBey),
    beynum: beybladeCount,
    format,
    name: bladerName,
  };
  const token = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('d', token);
  return url.toString();
}

export function parseShareToken(token) {
  try {
    const raw = LZString.decompressFromEncodedURIComponent(token);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function buildEmbedUrl(beyblades, beybladeCount, format, widgetType, comboIndex = 0) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('widget', widgetType);
  url.searchParams.set('format', format);
  if (widgetType === 'single') {
    const bey = beyblades[comboIndex];
    if (bey) url.searchParams.append('beys', serializeBey(bey));
  } else {
    url.searchParams.set('beynum', beybladeCount);
    beyblades.forEach((bey) => url.searchParams.append('beys', serializeBey(bey)));
  }
  return url.toString();
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- shareUrl
```

Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/shareUrl.js src/lib/shareUrl.test.js
git commit -m "feat: compress share URL into single ?d= token via lz-string"
```

---

## Task 4: Add bladerName to useBeybladeDeck

**Files:**
- Modify: `src/hooks/useBeybladeDeck.js`

- [ ] **Step 1: Update the hook**

Replace the `useBeybladeDeck` function in `src/hooks/useBeybladeDeck.js`. Change the import at the top to include `parseShareToken`:

```js
import { parseSharedBeys } from '../lib/comboUtils';
import { buildShareUrl, parseShareToken } from '../lib/shareUrl';
```

Update the state declarations and the `useEffect` that parses the URL on mount. Find this block:

```js
const [beybladeCount, setBeybladeCount] = useState(Number(searchParams.get('beynum')) || 3);
const [currentFormat, setCurrentFormat] = useState(searchParams.get('format') || 'standard');
const [beyblades, setBeyblades] = useState([]);
```

Replace with:

```js
const [beybladeCount, setBeybladeCount] = useState(Number(searchParams.get('beynum')) || 3);
const [currentFormat, setCurrentFormat] = useState(searchParams.get('format') || 'standard');
const [beyblades, setBeyblades] = useState([]);
const [bladerName, setBladerName] = useState('');
```

Then find the `useEffect` that reads shared URL params on mount:

```js
useEffect(() => {
  const shared = searchParams.getAll('beys');
  setSearchParams(new URLSearchParams());
  if (shared.length > 0) {
    setBeyblades(parseSharedBeys(shared));
  }
// Intentionally runs once on mount to load shared URL state then clean the URL
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

Replace with:

```js
useEffect(() => {
  const token = searchParams.get('d');
  const legacyBeys = searchParams.getAll('beys');
  setSearchParams(new URLSearchParams());

  if (token) {
    const payload = parseShareToken(token);
    if (payload) {
      if (payload.beys?.length > 0) setBeyblades(parseSharedBeys(payload.beys));
      if (payload.beynum) setBeybladeCount(Number(payload.beynum));
      if (payload.format) setCurrentFormat(payload.format);
      if (payload.name) setBladerName(payload.name);
    }
  } else if (legacyBeys.length > 0) {
    setBeyblades(parseSharedBeys(legacyBeys));
  }
// Intentionally runs once on mount to load shared URL state then clean the URL
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

Add `bladerName` and `setBladerName` to the return object:

```js
return {
  beybladeCount,
  setBeybladeCount,
  currentFormat,
  setCurrentFormat,
  beyblades,
  partsUsed,
  totalPoints,
  handlePartChange,
  handleShareButton,
  handleRandomizeAll,
  handleRandomizeSingle,
  bladerName,
  setBladerName,
};
```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBeybladeDeck.js
git commit -m "feat: add bladerName state and parse from compressed share URL"
```

---

## Task 5: Create DeckProfilePanel component

**Files:**
- Create: `src/components/DeckProfilePanel.jsx`

- [ ] **Step 1: Create the component**

Create `src/components/DeckProfilePanel.jsx`:

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { getDeckProfile, STAT_DEFS } from '../lib/comboUtils';

const STAT_LIMITS = { attack: 2, defense: 2, stamina: 2, xDash: 1, burstResistance: 1 };

function StatBar({ statDef, value }) {
  const pct = Math.min(100, ((value || 0) / STAT_LIMITS[statDef.key]) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', letterSpacing: '1px', textTransform: 'uppercase', width: '44px', flexShrink: 0 }}>
        {statDef.label}
      </span>
      <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: statDef.gradient, borderRadius: '3px' }} />
      </div>
      <span style={{ fontSize: '9px', color: statDef.color, width: '30px', textAlign: 'right' }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function BladerNameField({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const confirm = () => {
    setEditing(false);
    onChange(draft.trim().slice(0, 32));
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        maxLength={32}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {STAT_DEFS.map((def) => (
            <StatBar key={def.key} statDef={def} value={profile.averageStats[def.key]} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DeckProfilePanel;
```

- [ ] **Step 2: Verify the file was created**

```bash
ls src/components/DeckProfilePanel.jsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DeckProfilePanel.jsx
git commit -m "feat: add DeckProfilePanel component with archetype label and stat bars"
```

---

## Task 6: Wire DeckProfilePanel into App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add DeckProfilePanel import**

Find this block near the top of `src/App.jsx`:

```js
import ComboSummaryList from './components/ComboSummaryList';
```

Add the import after it:

```js
import DeckProfilePanel from './components/DeckProfilePanel';
```

- [ ] **Step 2: Destructure bladerName from the hook**

Find this destructure in `App.jsx`:

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
} = useBeybladeDeck();
```

Replace with:

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

- [ ] **Step 3: Render DeckProfilePanel**

Find this comment in `App.jsx`:

```jsx
{/* ── Beyblade Cards ── */}
```

Immediately before it, insert:

```jsx
<DeckProfilePanel
  beyblades={beyblades}
  bladerName={bladerName}
  onBladerNameChange={setBladerName}
/>
```

- [ ] **Step 4: Start dev server and verify the panel renders**

```bash
npm run dev
```

Open the app, select a blade on any combo — the Deck Profile panel should appear below the config card with an archetype label and stat bars. Editing the blader name field should work: click to edit, Enter/blur to confirm.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: render DeckProfilePanel in App"
```

---

## Task 7: Update ShareModal to pass bladerName

**Files:**
- Modify: `src/components/ShareModal.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Update ShareModal to accept bladerName**

In `src/components/ShareModal.jsx`, find the component signature:

```js
function ShareModal({ beyblades, beybladeCount, currentFormat, onClose }) {
```

Replace with:

```js
function ShareModal({ beyblades, beybladeCount, currentFormat, bladerName, onClose }) {
```

Find the shareUrl line:

```js
const shareUrl = buildShareUrl(beyblades, beybladeCount, currentFormat);
```

Replace with:

```js
const shareUrl = buildShareUrl(beyblades, beybladeCount, currentFormat, bladerName);
```

Find the PropTypes block at the bottom:

```js
ShareModal.propTypes = {
  beyblades: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  currentFormat: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
```

Replace with:

```js
ShareModal.propTypes = {
  beyblades: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  currentFormat: PropTypes.string.isRequired,
  bladerName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
```

- [ ] **Step 2: Pass bladerName from App.jsx to ShareModal**

In `src/App.jsx`, find the ShareModal render (look for `onClose={() => setShowShareModal(false)}`). It will look like:

```jsx
<ShareModal
  beyblades={beyblades}
  beybladeCount={beybladeCount}
  currentFormat={currentFormat}
  onClose={() => setShowShareModal(false)}
/>
```

Replace with:

```jsx
<ShareModal
  beyblades={beyblades}
  beybladeCount={beybladeCount}
  currentFormat={currentFormat}
  bladerName={bladerName}
  onClose={() => setShowShareModal(false)}
/>
```

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 4: Verify share URL in browser**

In the dev server, build a deck, enter a blader name, open Share. The URL in the share modal should be a single `?d=...` token. Copy it, open in a new tab — the deck should load with the blader name restored.

Also verify that an old-format URL (with `?beys=...&format=...&beynum=...`) still loads correctly (legacy fallback).

- [ ] **Step 5: Commit**

```bash
git add src/components/ShareModal.jsx src/App.jsx
git commit -m "feat: include bladerName in compressed share URL"
```

---

## Task 8: Final QA pass

- [ ] **Step 1: Run the full test suite one final time**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors (fix any if present, commit with `fix: lint`)

- [ ] **Step 3: Test edge cases in the browser**

With the dev server running (`npm run dev`), verify:

1. **Empty deck** — no combos selected → Deck Profile panel is hidden
2. **Partial deck** — 1 of 3 combos has parts → panel appears, averages only the filled combo
3. **All combos filled** — panel shows and updates live as parts are changed
4. **Blader name** — click to edit, Enter confirms, Escape cancels, blur confirms
5. **Share URL** — shared URL uses `?d=` token; loading it restores deck + blader name
6. **Legacy URL** — a URL with `?beys=...&format=...&beynum=...` still loads (no blader name)
7. **Different archetypes** — build a stamina-heavy deck, verify archetype changes to X-Endurance

- [ ] **Step 4: Final commit**

```bash
git add -p  # stage any lint fixes
# Only if there are unstaged changes; otherwise skip
git commit -m "fix: final lint and QA adjustments"
```
