# Story Deck Profile Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact Deck Profile strip to the bottom of the 9:16 story deck export, and fix the gap issue where combo rows over-stretched on small decks.

**Architecture:** Combo rows already use `flex: 1` and fill space correctly. The fix is purely additive — a new `DeckProfileStrip` component with `flexShrink: 0` placed below the combos section. `App.jsx` passes `profile` and `bladerName` into `StoryDeckWidget`.

**Tech Stack:** React (JSX), inline styles, SVG for stat circles, `getDeckProfile` from `comboUtils.js`

---

## File Map

- **Modify:** `src/components/widgets/StoryDeckWidget.jsx` — add `DeckProfileStrip` component + new props
- **Modify:** `src/App.jsx` lines ~168–171 — pass `profile` and `bladerName` to `StoryDeckWidget`

---

### Task 1: Add DeckProfileStrip to StoryDeckWidget

**Files:**
- Modify: `src/components/widgets/StoryDeckWidget.jsx`

No test framework exists. Verify visually using `npm run dev`.

- [ ] **Step 1: Add the `DeckProfileStrip` component**

Open `src/components/widgets/StoryDeckWidget.jsx`. After the existing imports at the top, and before `ComboSection`, add the constant and component:

```jsx
import PropTypes from 'prop-types';
import { BEYBLADE_DB, LIMITED_FORMAT, getLineColor, getLineLogo, getSpinType } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';
```

(Imports are already present — no change needed. Just add below the existing `DOT_BG` constant.)

After the `DOT_BG` constant (after line 7), insert:

```jsx
const PROFILE_CIRCUMFERENCE = 2 * Math.PI * 15;
const PROFILE_STAT_LIMITS = Object.fromEntries(STAT_DEFS.map(d => [d.key, d.limit]));

function DeckProfileStrip({ profile, bladerName }) {
  if (!profile) return null;
  return (
    <div style={{
      flexShrink: 0,
      margin: '16px 0 0',
      background: 'rgba(0,212,255,0.04)',
      border: '1px solid rgba(0,212,255,0.12)',
      borderRadius: '10px',
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>
        Deck Profile
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flexShrink: 0, textAlign: 'center', width: '72px' }}>
          <span style={{ fontSize: '26px', lineHeight: 1 }}>{profile.emoji}</span>
          <div style={{ fontSize: '11px', fontWeight: 800, color: profile.color, letterSpacing: '1px', marginTop: '3px' }}>
            {profile.archetype}
          </div>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.3, marginTop: '2px' }}>
            {profile.flavor}
          </div>
        </div>
        <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {STAT_DEFS.map((def) => {
            const value = profile.averageStats[def.key] || 0;
            const pct = Math.min(100, (value || 0) / PROFILE_STAT_LIMITS[def.key]);
            const offset = PROFILE_CIRCUMFERENCE * (1 - pct / 100);
            return (
              <div key={def.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <svg width="32" height="32" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                  <circle
                    cx="20" cy="20" r="15"
                    fill="none"
                    stroke={def.color}
                    strokeWidth="4"
                    strokeDasharray={PROFILE_CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                  />
                  <text x="20" y="24" textAnchor="middle" fill={def.color} fontSize="9" fontWeight="bold" fontFamily="system-ui,sans-serif">
                    {Math.round(pct)}
                  </text>
                </svg>
                <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {def.abbr}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {bladerName && (
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em' }}>BLADER</span>
          <span style={{ fontSize: '10px', color: 'rgba(0,212,255,0.7)', fontWeight: 600 }}>{bladerName}</span>
        </div>
      )}
    </div>
  );
}

DeckProfileStrip.propTypes = {
  profile: PropTypes.object,
  bladerName: PropTypes.string,
};
```

- [ ] **Step 2: Add props to `StoryDeckWidget` and render the strip**

Find the `StoryDeckWidget` function (currently line 101). Update the signature and return value:

```jsx
function StoryDeckWidget({ combos, beybladeCount, format, profile, bladerName }) {
```

In the return JSX, the current structure is:
```jsx
{/* Combos */}
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', minHeight: 0 }}>
  {Array(beybladeCount).fill(null).map((_, i) => (
    <ComboSection ... />
  ))}
</div>

{/* Watermark */}
<div style={{ marginTop: '16px', ... }}>
```

Insert `<DeckProfileStrip>` between the combos div and the watermark div:

```jsx
{/* Combos */}
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', minHeight: 0 }}>
  {Array(beybladeCount).fill(null).map((_, i) => (
    <ComboSection
      key={i}
      combo={combos[i]}
      accent={getLineColor(combos[i]?.blade)}
      imageSize={imageSize}
      statHeight={statHeight}
      statGap={statGap}
      nameFontSize={nameFontSize}
    />
  ))}
</div>

{/* Deck Profile strip */}
<DeckProfileStrip profile={profile} bladerName={bladerName} />

{/* Watermark */}
<div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
```

- [ ] **Step 3: Update PropTypes**

Find the existing `StoryDeckWidget.propTypes` block (currently at the bottom of the file) and add the new props:

```jsx
StoryDeckWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
  profile: PropTypes.object,
  bladerName: PropTypes.string,
};
```

- [ ] **Step 4: Verify visually**

```bash
npm run dev
```

Open the app, build a 1-combo deck and a 3-combo deck. Trigger the Story (9:16) deck download button. Check that:
- The downloaded PNG shows the deck profile strip at the bottom
- No large blank gap above the strip for small decks
- Stat circles are visible with percentage values
- Blader name row shows if a name is set, hidden if empty

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/StoryDeckWidget.jsx
git commit -m "feat: add deck profile strip to 9:16 story deck export"
```

---

### Task 2: Pass profile and bladerName from App.jsx

**Files:**
- Modify: `src/App.jsx` (~line 169)

- [ ] **Step 1: Update the StoryDeckWidget render call in handleDownloadDeck**

Find this block in `handleDownloadDeck` (~line 168):

```jsx
resolvedStyle === 'story'
  ? <StoryDeckWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
```

Replace with:

```jsx
resolvedStyle === 'story'
  ? <StoryDeckWidget
      combos={beyblades}
      beybladeCount={beybladeCount}
      format={currentFormat}
      profile={getDeckProfile(beyblades)}
      bladerName={bladerName}
    />
```

`getDeckProfile` is already imported on line 21. `bladerName` is already in scope as component state.

- [ ] **Step 2: Verify the download**

```bash
npm run dev
```

Open the app, set a blader name, build any deck, click the download button for Story (9:16) format. Confirm:
- The downloaded PNG has the deck profile strip
- The blader name appears in the strip
- For a deck with no filled combos, the strip does not appear (profile will be null → DeckProfileStrip returns null)

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: pass deck profile to story deck widget for 9:16 export"
```
