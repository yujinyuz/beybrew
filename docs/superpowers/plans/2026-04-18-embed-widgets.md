# Embed Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 embeddable widget styles usable as both live iframe embeds and PNG downloads, with a Share modal that generates `<iframe>` code and split-button download controls.

**Architecture:** Widget components are the shared rendering layer for embed mode and PNG download. An `?widget=` URL param in `main.jsx` triggers a bare `EmbedApp` instead of the full app. The Share button opens a `ShareModal` with Share Link and Embed tabs. Both download buttons become split buttons with a style dropdown.

**Tech Stack:** React 18, Vite, html-to-image, react-router-dom (already in use)

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `src/lib/comboUtils.js` | Shared: `parseSharedBeys`, `getComboStats`, `getComboName`, `STAT_DEFS` |
| `src/lib/shareUrl.js` | Build share URL and embed URL from deck state |
| `src/components/widgets/DeckWidget.jsx` | All combos with images and stat bars |
| `src/components/widgets/SingleComboWidget.jsx` | One combo, large image, full stat bars |
| `src/components/widgets/CompactListWidget.jsx` | Numbered combo names, no images |
| `src/components/widgets/CompactImageWidget.jsx` | Small circular image + name + condensed bars |
| `src/EmbedApp.jsx` | Root for embed mode — parses `?widget=` param, renders matching widget |
| `src/components/ShareModal.jsx` | Modal with Share Link and Embed tabs |

### Modified files
| File | Change |
|------|--------|
| `src/lib/comboUtils.js` | (new — see above) |
| `src/hooks/useBeybladeDeck.js` | Import `parseSharedBeys` from comboUtils; import `buildShareUrl` from shareUrl |
| `src/components/ExportCard.jsx` | Import `STAT_DEFS`, `getComboStats`, `getComboName` from comboUtils |
| `src/main.jsx` | Detect `?widget=` param, render `EmbedApp` vs `App` |
| `src/App.jsx` | Share button → `ShareModal`; Download Deck → split button; per-combo download → split button; off-screen render uses widget components |

---

## Task 1: Shared combo utilities

**Files:**
- Create: `src/lib/comboUtils.js`
- Modify: `src/hooks/useBeybladeDeck.js`
- Modify: `src/components/ExportCard.jsx`

Extract the duplicated helpers into one module so widgets can import them.

- [ ] **Step 1: Create `src/lib/comboUtils.js`**

```js
import { BEYBLADE_DB, getStats } from '../constants';

export const STAT_DEFS = [
  { key: 'attack',          label: 'ATTACK',  gradient: 'linear-gradient(90deg,#1565c0,#00d4ff)', color: '#00d4ff', limit: 2 },
  { key: 'defense',         label: 'DEFENSE', gradient: 'linear-gradient(90deg,#2e7d32,#00e676)', color: '#00e676', limit: 2 },
  { key: 'stamina',         label: 'STAMINA', gradient: 'linear-gradient(90deg,#e65100,#ffcc02)', color: '#ffcc02', limit: 2 },
  { key: 'xDash',           label: 'X-DASH',  gradient: 'linear-gradient(90deg,#b71c1c,#ff6d00)', color: '#ff6d00', limit: 1 },
  { key: 'burstResistance', label: 'BURST',   gradient: 'linear-gradient(90deg,#4a148c,#aa00ff)', color: '#aa00ff', limit: 1 },
];

export function parseSharedBeys(rawBeys) {
  return rawBeys.map((bey) => {
    const [
      blade, ratchet, bit,
      assistBlade = '', lockChip = '',
      bladeMode = '0', assistBladeMode = '0', bitMode = '0',
    ] = bey.split(',');
    return {
      blade, ratchet, bit, assistBlade, lockChip,
      bladeMode: Number(bladeMode),
      assistBladeMode: Number(assistBladeMode),
      bitMode: Number(bitMode),
    };
  });
}

export function getComboStats(combo) {
  const { blade, assistBlade, ratchet, bit, bladeMode = 0, assistBladeMode = 0, bitMode = 0 } = combo || {};
  const bladeStats   = getStats(blade, bladeMode);
  const assistStats  = getStats(assistBlade, assistBladeMode);
  const ratchetStats = getStats(ratchet);
  const bitStats     = getStats(bit, bitMode);
  return {
    attack:          (bladeStats.attack || 0) + (assistStats.attack || 0) + (ratchetStats.attack || 0) + (bitStats.attack || 0),
    defense:         (bladeStats.defense || 0) + (assistStats.defense || 0) + (ratchetStats.defense || 0) + (bitStats.defense || 0),
    stamina:         (bladeStats.stamina || 0) + (assistStats.stamina || 0) + (ratchetStats.stamina || 0) + (bitStats.stamina || 0),
    xDash:           bitStats.xDash || 0,
    burstResistance: bitStats.burstResistance || 0,
  };
}

export function getComboName(combo) {
  const { blade, assistBlade, ratchet, bit, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  return [
    isCXLine && lockChip ? lockChip : null,
    blade,
    isCXLine ? BEYBLADE_DB[assistBlade]?.alias : null,
    BEYBLADE_DB[ratchet]?.altname,
    BEYBLADE_DB[bit]?.alias,
  ].filter(Boolean).join(' ');
}
```

- [ ] **Step 2: Update `src/hooks/useBeybladeDeck.js` — replace local `parseSharedBeys` with the import**

Remove the local `parseSharedBeys` function definition (lines 6–19) and add the import at the top:

```js
import { parseSharedBeys } from '../lib/comboUtils';
```

The rest of the file is unchanged.

- [ ] **Step 3: Update `src/components/ExportCard.jsx` — import from comboUtils instead of defining locally**

Replace the three local definitions (`STAT_DEFS`, `getComboStats`, `getComboName`) with an import. Add to the top of the file:

```js
import { STAT_DEFS, getComboStats, getComboName } from '../lib/comboUtils';
```

Remove the local `const STAT_DEFS = [...]`, `function getComboStats(...)`, and `function getComboName(...)` blocks. The rest of ExportCard is unchanged.

- [ ] **Step 4: Run the dev server and verify the app still works**

```bash
npm run dev
```

Open http://localhost:5173. Build a deck, confirm stat bars still render and combo names still show. No visual change expected.

- [ ] **Step 5: Commit**

```bash
git add src/lib/comboUtils.js src/hooks/useBeybladeDeck.js src/components/ExportCard.jsx
git commit -m "refactor: extract parseSharedBeys, getComboStats, getComboName, STAT_DEFS to comboUtils"
```

---

## Task 2: Share URL builder

**Files:**
- Create: `src/lib/shareUrl.js`
- Modify: `src/hooks/useBeybladeDeck.js`

- [ ] **Step 1: Create `src/lib/shareUrl.js`**

```js
function serializeBey(bey) {
  return `${bey.blade},${bey.ratchet},${bey.bit},${bey.assistBlade || ''},${bey.lockChip || ''},${bey.bladeMode || 0},${bey.assistBladeMode || 0},${bey.bitMode || 0}`;
}

export function buildShareUrl(beyblades, beybladeCount, format) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('beynum', beybladeCount);
  url.searchParams.set('format', format);
  beyblades.forEach((bey) => url.searchParams.append('beys', serializeBey(bey)));
  return url.toString();
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

- [ ] **Step 2: Update `src/hooks/useBeybladeDeck.js` — use `buildShareUrl`**

Add import:
```js
import { buildShareUrl } from '../lib/shareUrl';
```

Replace the `handleShareButton` function body:
```js
const handleShareButton = () => {
  const url = buildShareUrl(beyblades, beybladeCount, currentFormat);
  navigator.clipboard
    .writeText(url)
    .then(() => window.alert('Successfully copied to clipboard!'))
    .catch((err) => console.error('Failed to copy URL:', err));
};
```

- [ ] **Step 3: Verify share still works**

Run `npm run dev`. Build a deck, click Share, confirm clipboard alert still appears.

- [ ] **Step 4: Commit**

```bash
git add src/lib/shareUrl.js src/hooks/useBeybladeDeck.js
git commit -m "refactor: extract share URL builder to shareUrl.js"
```

---

## Task 3: DeckWidget

**Files:**
- Create: `src/components/widgets/DeckWidget.jsx`

Responsive deck card showing all combos with images and stat bars. Dark background (`#080c18`), BEYBREW header, accent-colored combo rows.

- [ ] **Step 1: Create `src/components/widgets/DeckWidget.jsx`**

```jsx
import PropTypes from 'prop-types';
import { BEYBLADE_DB, LIMITED_FORMAT } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';

const ACCENT_COLORS = ['#00d4ff', '#7b61ff', '#ffa040'];
const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

function StatBars({ stats }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
        const value = stats[key] || 0;
        const pct = Math.min(100, (value / limit) * 100);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', width: '48px', flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '20px', textAlign: 'right' }}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function ComboRow({ combo, accent }) {
  const { blade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}33`, borderLeft: `3px solid ${accent}`, borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
        {blade && BEYBLADE_DB[blade]?.image && (
          <img src={`/images/${BEYBLADE_DB[blade].image}`} alt={blade}
            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${accent}80` }}
          />
        )}
        {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
          <img src={`/images/${BEYBLADE_DB[lockChip].image}`} alt={lockChip}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#fff', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getComboName(combo) || '—'}
        </div>
        <StatBars stats={getComboStats(combo)} />
      </div>
    </div>
  );
}

function DeckWidget({ combos, beybladeCount, format }) {
  const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';
  return (
    <div style={{ ...DOT_BG, background: '#080c18', borderRadius: '12px', padding: '20px', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.08em', background: 'linear-gradient(90deg,#00d4ff,#7b61ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>BEYBREW</div>
        <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)', margin: '4px auto' }} />
        <div style={{ fontSize: '7px', color: 'rgba(0,212,255,0.7)', letterSpacing: '0.22em', fontWeight: 600 }}>BEYBLADE X DECK · {formatLabel}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array(beybladeCount).fill(null).map((_, i) => (
          <ComboRow key={i} combo={combos[i]} accent={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
        ))}
      </div>
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

DeckWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
};

export default DeckWidget;
```

- [ ] **Step 2: Smoke-test by importing in App.jsx temporarily**

In `src/App.jsx`, temporarily add near the top:
```js
import DeckWidget from './components/widgets/DeckWidget';
```
And below the header temporarily:
```jsx
<DeckWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
```

Run `npm run dev`, confirm the widget renders with the correct deck data, images load, stat bars fill correctly.

- [ ] **Step 3: Remove the temporary import and JSX from App.jsx**

Revert the two lines added in Step 2.

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/DeckWidget.jsx
git commit -m "feat: add DeckWidget component"
```

---

## Task 4: SingleComboWidget

**Files:**
- Create: `src/components/widgets/SingleComboWidget.jsx`

- [ ] **Step 1: Create `src/components/widgets/SingleComboWidget.jsx`**

```jsx
import PropTypes from 'prop-types';
import { BEYBLADE_DB } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';

const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};
const ACCENT = '#00d4ff';

function SingleComboWidget({ combo }) {
  const { blade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const stats = getComboStats(combo);
  const name = getComboName(combo);
  const spinType = BEYBLADE_DB[blade]?.spinType;
  const bitType = BEYBLADE_DB[combo?.bit]?.type;

  return (
    <div style={{ ...DOT_BG, background: '#080c18', borderRadius: '14px', border: `1px solid ${ACCENT}33`, borderLeft: `3px solid ${ACCENT}`, padding: '18px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <div style={{ fontSize: '6.5px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '12px' }}>BEYBREW · COMBO</div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
          {blade && BEYBLADE_DB[blade]?.image && (
            <img src={`/images/${BEYBLADE_DB[blade].image}`} alt={blade}
              style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${ACCENT}80` }}
            />
          )}
          {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
            <img src={`/images/${BEYBLADE_DB[lockChip].image}`} alt={lockChip}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
            />
          )}
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '0.02em' }}>{name || '—'}</div>
          {(spinType || bitType) && (
            <div style={{ fontSize: '6.5px', color: 'rgba(0,212,255,0.5)', marginTop: '4px', letterSpacing: '0.1em' }}>
              {[spinType && `${spinType.toUpperCase()} SPIN`, bitType && bitType.toUpperCase()].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
          const value = stats[key] || 0;
          const pct = Math.min(100, (value / limit) * 100);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', width: '48px', flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '20px', textAlign: 'right' }}>{value}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

SingleComboWidget.propTypes = { combo: PropTypes.object };

export default SingleComboWidget;
```

- [ ] **Step 2: Smoke-test by temporarily adding to App.jsx**

```jsx
import SingleComboWidget from './components/widgets/SingleComboWidget';
// ...
<SingleComboWidget combo={beyblades[0]} />
```

Run `npm run dev`. Select a blade with an image, confirm image, name, spin type, and stat bars render.

- [ ] **Step 3: Remove the temporary code from App.jsx**

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/SingleComboWidget.jsx
git commit -m "feat: add SingleComboWidget component"
```

---

## Task 5: CompactListWidget

**Files:**
- Create: `src/components/widgets/CompactListWidget.jsx`

- [ ] **Step 1: Create `src/components/widgets/CompactListWidget.jsx`**

```jsx
import PropTypes from 'prop-types';
import { LIMITED_FORMAT } from '../../constants';
import { getComboName } from '../../lib/comboUtils';

const ACCENT_COLORS = ['#00d4ff', '#7b61ff', '#ffa040'];

function CompactListWidget({ combos, beybladeCount, format }) {
  const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';
  return (
    <div style={{ background: '#080c18', borderRadius: '12px', padding: '14px 16px', fontFamily: 'system-ui,-apple-system,sans-serif', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '6.5px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.22em', fontWeight: 700, marginBottom: '10px' }}>BEYBREW · {formatLabel}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {Array(beybladeCount).fill(null).map((_, i) => {
          const name = getComboName(combos[i]);
          const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', color: accent, width: '14px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>{name || '—'}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

CompactListWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
};

export default CompactListWidget;
```

- [ ] **Step 2: Smoke-test, commit**

Temporary import + render in App.jsx, verify names show. Remove temp code.

```bash
git add src/components/widgets/CompactListWidget.jsx
git commit -m "feat: add CompactListWidget component"
```

---

## Task 6: CompactImageWidget

**Files:**
- Create: `src/components/widgets/CompactImageWidget.jsx`

Shows all combos passed via `combos` prop. For single-combo use (per-combo download), caller passes a one-element array.

- [ ] **Step 1: Create `src/components/widgets/CompactImageWidget.jsx`**

```jsx
import PropTypes from 'prop-types';
import { BEYBLADE_DB, LIMITED_FORMAT } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';

const ACCENT_COLORS = ['#00d4ff', '#7b61ff', '#ffa040'];
const MAIN_STATS = STAT_DEFS.slice(0, 3); // attack, defense, stamina

function CompactComboRow({ combo, accent }) {
  const { blade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const stats = getComboStats(combo);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '26px', height: '26px', flexShrink: 0 }}>
        {blade && BEYBLADE_DB[blade]?.image && (
          <img src={`/images/${BEYBLADE_DB[blade].image}`} alt={blade}
            style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `1px solid ${accent}66` }}
          />
        )}
        {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
          <img src={`/images/${BEYBLADE_DB[lockChip].image}`} alt={lockChip}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '9px', color: '#fff', fontWeight: 800, marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getComboName(combo) || '—'}
        </div>
        <div style={{ display: 'flex', gap: '2px', height: '2px' }}>
          {MAIN_STATS.map(({ key, gradient, limit }) => {
            const val = stats[key] || 0;
            const flex = Math.max(1, Math.round((val / limit) * 100));
            return <div key={key} style={{ flex, background: gradient, borderRadius: '1px' }} />;
          })}
          <div style={{ flex: 100 - MAIN_STATS.reduce((sum, { key, limit }) => sum + Math.round(((stats[key] || 0) / limit) * 100), 0), background: 'rgba(255,255,255,0.07)', borderRadius: '1px' }} />
        </div>
      </div>
    </div>
  );
}

function CompactImageWidget({ combos, beybladeCount, format }) {
  const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';
  return (
    <div style={{ background: '#080c18', borderRadius: '12px', padding: '14px 16px', fontFamily: 'system-ui,-apple-system,sans-serif', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '6.5px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.22em', fontWeight: 700, marginBottom: '10px' }}>BEYBREW · {formatLabel}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array(beybladeCount).fill(null).map((_, i) => (
          <CompactComboRow key={i} combo={combos[i]} accent={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
        ))}
      </div>
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

CompactImageWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
};

export default CompactImageWidget;
```

- [ ] **Step 2: Smoke-test, commit**

Temporary import + render in App.jsx, verify images and bars show. Remove temp code.

```bash
git add src/components/widgets/CompactImageWidget.jsx
git commit -m "feat: add CompactImageWidget component"
```

---

## Task 7: EmbedApp and main.jsx

**Files:**
- Create: `src/EmbedApp.jsx`
- Modify: `src/main.jsx`

`EmbedApp` reads URL params and renders the matching widget. `main.jsx` decides which root to mount.

- [ ] **Step 1: Create `src/EmbedApp.jsx`**

```jsx
import DeckWidget from './components/widgets/DeckWidget';
import SingleComboWidget from './components/widgets/SingleComboWidget';
import CompactListWidget from './components/widgets/CompactListWidget';
import CompactImageWidget from './components/widgets/CompactImageWidget';
import { parseSharedBeys } from './lib/comboUtils';

function EmbedApp() {
  const params = new URLSearchParams(window.location.search);
  const widgetType = params.get('widget');
  const format = params.get('format') || 'standard';
  const beynum = Math.max(1, Number(params.get('beynum')) || 1);
  const rawBeys = params.getAll('beys');
  const combos = parseSharedBeys(rawBeys);

  const style = { margin: 0, padding: 0, background: 'transparent' };

  if (widgetType === 'single') {
    return <div style={style}><SingleComboWidget combo={combos[0]} /></div>;
  }
  if (widgetType === 'compact') {
    return <div style={style}><CompactListWidget combos={combos} beybladeCount={beynum} format={format} /></div>;
  }
  if (widgetType === 'compact-image') {
    return <div style={style}><CompactImageWidget combos={combos} beybladeCount={beynum} format={format} /></div>;
  }
  return <div style={style}><DeckWidget combos={combos} beybladeCount={beynum} format={format} /></div>;
}

export default EmbedApp;
```

- [ ] **Step 2: Update `src/main.jsx`**

Replace the entire file:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const widgetType = new URLSearchParams(window.location.search).get('widget');

async function mount() {
  if (widgetType) {
    const { default: EmbedApp } = await import('./EmbedApp.jsx');
    createRoot(document.getElementById('root')).render(
      <StrictMode><EmbedApp /></StrictMode>
    );
  } else {
    const { default: App } = await import('./App.jsx');
    const { createBrowserRouter, RouterProvider } = await import('react-router-dom');
    const router = createBrowserRouter([{ path: '/', element: <App /> }]);
    createRoot(document.getElementById('root')).render(
      <StrictMode><RouterProvider router={router} /></StrictMode>
    );
  }
}

mount();
```

- [ ] **Step 3: Test embed mode**

Run `npm run dev`. Navigate to:

```
http://localhost:5173/?widget=deck&beynum=2&format=standard&beys=Dran%20Sword,3-60F,Flat&beys=Hells%20Scythe,4-80B,Bound
```

Confirm: no header, no controls, just the DeckWidget. Also test `?widget=compact`, `?widget=compact-image`, `?widget=single`.

- [ ] **Step 4: Confirm normal app still works**

Navigate to `http://localhost:5173` (no params). Confirm the full app loads normally.

- [ ] **Step 5: Commit**

```bash
git add src/EmbedApp.jsx src/main.jsx
git commit -m "feat: add embed mode via ?widget= URL param"
```

---

## Task 8: ShareModal

**Files:**
- Create: `src/components/ShareModal.jsx`

Modal with two tabs: Share Link and Embed. The Embed tab shows a widget type picker, combo picker (for `single`), live iframe preview, and copyable `<iframe>` code.

- [ ] **Step 1: Create `src/components/ShareModal.jsx`**

```jsx
import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { buildShareUrl, buildEmbedUrl } from '../lib/shareUrl';

const WIDGET_OPTIONS = [
  { id: 'deck',          label: 'Deck Card',         desc: 'All combos, images, stat bars' },
  { id: 'single',        label: 'Single Combo',      desc: 'One combo, large image' },
  { id: 'compact',       label: 'Compact List',      desc: 'Names only, minimal' },
  { id: 'compact-image', label: 'Compact with Image', desc: 'Small image + condensed bars' },
];

const surfaceStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '16px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
};

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
        cursor: 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em',
        background: copied ? 'rgba(0,230,118,0.15)' : 'var(--color-accent-dim)',
        border: copied ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(0,212,255,0.4)',
        color: copied ? '#00e676' : 'var(--color-accent)',
        transition: 'all 0.2s',
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

function ShareModal({ beyblades, beybladeCount, currentFormat, onClose }) {
  const [activeTab, setActiveTab] = useState('share');
  const [widgetType, setWidgetType] = useState('deck');
  const [comboIndex, setComboIndex] = useState(0);

  const shareUrl = buildShareUrl(beyblades, beybladeCount, currentFormat);
  const embedUrl = buildEmbedUrl(beyblades, beybladeCount, currentFormat, widgetType, comboIndex);
  const iframeSnippet = `<iframe\n  src="${embedUrl}"\n  width="500" height="300"\n  frameborder="0" style="border:none">\n</iframe>`;

  const tabStyle = (tab) => ({
    flex: 1, padding: '10px', fontSize: '12px', fontWeight: 700,
    letterSpacing: '0.08em', fontFamily: 'var(--font-heading)',
    cursor: 'pointer', border: 'none', borderRadius: '8px',
    background: activeTab === tab ? 'var(--color-accent-dim)' : 'transparent',
    color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-muted)',
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div style={{ ...surfaceStyle, width: '100%', maxWidth: '520px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>SHARE DECK</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface-2)', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
          <button style={tabStyle('share')} onClick={() => setActiveTab('share')}>SHARE LINK</button>
          <button style={tabStyle('embed')} onClick={() => setActiveTab('embed')}>EMBED</button>
        </div>

        {activeTab === 'share' && (
          <div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Share this link to let others view your deck.</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                readOnly value={shareUrl}
                style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', fontSize: '11px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              />
              <CopyButton text={shareUrl} />
            </div>
          </div>
        )}

        {activeTab === 'embed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Widget type picker */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '8px', fontWeight: 700 }}>WIDGET STYLE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {WIDGET_OPTIONS.map(({ id, label, desc }) => {
                  const active = widgetType === id;
                  return (
                    <button key={id} onClick={() => setWidgetType(id)}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                        background: active ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
                        border: active ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: active ? 'var(--color-accent)' : 'var(--color-text)' }}>{label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Combo picker (single only) */}
            {widgetType === 'single' && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>COMBO</div>
                <select
                  value={comboIndex}
                  onChange={(e) => setComboIndex(Number(e.target.value))}
                  style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '12px', cursor: 'pointer' }}
                >
                  {Array(beybladeCount).fill(null).map((_, i) => (
                    <option key={i} value={i}>Combo {i + 1}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Live preview */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>PREVIEW</div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', background: '#080c18' }}>
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  style={{ width: '100%', height: '280px', border: 'none', display: 'block' }}
                  title="Widget preview"
                />
              </div>
            </div>

            {/* Code snippet */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', fontWeight: 700 }}>EMBED CODE</div>
                <CopyButton text={iframeSnippet} label="Copy Code" />
              </div>
              <pre style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 12px', fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'monospace', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {iframeSnippet}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ShareModal.propTypes = {
  beyblades: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  currentFormat: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ShareModal;
```

- [ ] **Step 2: Smoke-test by rendering the modal in App.jsx temporarily**

Add to `App.jsx`:
```jsx
import ShareModal from './components/ShareModal';
// Inside the return, anywhere visible:
<ShareModal
  beyblades={beyblades}
  beybladeCount={beybladeCount}
  currentFormat={currentFormat}
  onClose={() => {}}
/>
```

Run `npm run dev`. Confirm both tabs render. Switch between widget types. Confirm the live iframe preview updates (it will be a real iframe loading the embed mode). Remove the temporary code after checking.

- [ ] **Step 3: Remove temp code, commit**

```bash
git add src/components/ShareModal.jsx
git commit -m "feat: add ShareModal with Share Link and Embed tabs"
```

---

## Task 9: Wire App.jsx

**Files:**
- Modify: `src/App.jsx`

Three changes in one file:
1. Share button → opens `ShareModal`
2. Download Deck → split button with style dropdown (styles: `deck`, `compact`, `compact-image`)
3. Per-combo download → split button with style dropdown (styles: `single`, `compact-image`)
4. Off-screen render area uses widget components instead of `ExportCard`

- [ ] **Step 1: Add imports at the top of `src/App.jsx`**

Add after the existing imports:
```jsx
import ShareModal from './components/ShareModal';
import DeckWidget from './components/widgets/DeckWidget';
import SingleComboWidget from './components/widgets/SingleComboWidget';
import CompactListWidget from './components/widgets/CompactListWidget';
import CompactImageWidget from './components/widgets/CompactImageWidget';
```

- [ ] **Step 2: Add new state variables inside `App()`**

Add after the existing state declarations:
```jsx
const [showShareModal, setShowShareModal] = useState(false);
const [deckExportStyle, setDeckExportStyle] = useState('deck');
const [showDeckStyleMenu, setShowDeckStyleMenu] = useState(false);
const [comboExportStyle, setComboExportStyle] = useState('single');
const [showComboStyleMenu, setShowComboStyleMenu] = useState(null); // index or null
```

- [ ] **Step 3: Add a click-outside handler to close dropdowns**

Add inside `App()` after the state declarations:
```jsx
useEffect(() => {
  if (!showDeckStyleMenu && showComboStyleMenu === null) return;
  const close = () => { setShowDeckStyleMenu(false); setShowComboStyleMenu(null); };
  window.addEventListener('click', close);
  return () => window.removeEventListener('click', close);
}, [showDeckStyleMenu, showComboStyleMenu]);
```

- [ ] **Step 4: Update `handleDownloadDeck` to accept a style param**

Replace the existing `handleDownloadDeck`:
```jsx
const handleDownloadDeck = useCallback((style = deckExportStyle) => {
  if (!exportRef.current) return;
  setIsDownloading(true);
  toPng(exportRef.current, { cacheBust: true, backgroundColor: '#080c18' })
    .then((dataUrl) => {
      const a = document.createElement('a');
      a.download = `beybrew_deck_${Date.now()}.png`;
      a.href = dataUrl;
      a.click();
    })
    .catch(() => setDownloadError('Download failed. Try again.'))
    .finally(() => setIsDownloading(false));
}, [deckExportStyle]);
```

- [ ] **Step 5: Update `handleDownloadCombo` to accept a style param**

Replace the existing `handleDownloadCombo`:
```jsx
const handleDownloadCombo = useCallback((index, style = comboExportStyle) => {
  flushSync(() => {
    setExportComboIndex(index);
    setComboExportStyle(style);
    setIsDownloading(true);
  });
  if (!exportRef.current) {
    setExportComboIndex(null);
    setIsDownloading(false);
    return;
  }
  toPng(exportRef.current, { cacheBust: true, backgroundColor: '#080c18' })
    .then((dataUrl) => {
      const a = document.createElement('a');
      a.download = `beybrew_combo${index + 1}_${Date.now()}.png`;
      a.href = dataUrl;
      a.click();
    })
    .catch(() => setDownloadError('Download failed. Try again.'))
    .finally(() => {
      setExportComboIndex(null);
      setIsDownloading(false);
    });
}, [comboExportStyle]);
```

- [ ] **Step 6: Replace the off-screen export area**

Find the existing off-screen div (the one with `position: 'fixed', left: '-9999px'`). Replace it entirely:

```jsx
{/* Off-screen export target */}
<div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
  <div ref={exportRef} style={{ width: exportComboIndex !== null ? '320px' : '480px' }}>
    {exportComboIndex !== null ? (
      comboExportStyle === 'single'
        ? <SingleComboWidget combo={beyblades[exportComboIndex]} />
        : <CompactImageWidget combos={[beyblades[exportComboIndex]]} beybladeCount={1} format={currentFormat} />
    ) : (
      deckExportStyle === 'compact'
        ? <CompactListWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
        : deckExportStyle === 'compact-image'
          ? <CompactImageWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
          : <DeckWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
    )}
  </div>
</div>
```

- [ ] **Step 7: Replace the Share button**

Find the Share button JSX and replace it:
```jsx
<button
  onClick={() => setShowShareModal(true)}
  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
  style={{
    background: 'var(--color-accent-dim)',
    border: '1px solid rgba(0,212,255,0.4)',
    color: 'var(--color-accent)',
    fontFamily: 'var(--font-heading)',
  }}
>
  <IconShare />
  Share
</button>
```

- [ ] **Step 8: Replace the Download Deck button with a split button**

Find the existing Download Deck button wrapper div (the one with `display: 'flex', flexDirection: 'column'`). Replace it:

```jsx
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
  <div style={{ position: 'relative', display: 'inline-flex', borderRadius: '8px', overflow: 'visible' }} onClick={(e) => e.stopPropagation()}>
    <button
      onClick={() => handleDownloadDeck()}
      disabled={isDownloading}
      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
      style={{
        background: 'var(--color-accent-dim)',
        border: '1px solid rgba(0,212,255,0.4)',
        borderRight: 'none',
        borderRadius: '8px 0 0 8px',
        color: 'var(--color-accent)',
        fontFamily: 'var(--font-heading)',
        opacity: isDownloading ? 0.6 : 1,
        cursor: isDownloading ? 'not-allowed' : 'pointer',
      }}
    >
      <IconDownload />
      {isDownloading ? 'Generating…' : 'Download Deck'}
    </button>
    <button
      onClick={() => setShowDeckStyleMenu((v) => !v)}
      disabled={isDownloading}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 10px',
        background: 'var(--color-accent-dim)',
        border: '1px solid rgba(0,212,255,0.4)',
        borderLeft: '1px solid rgba(0,212,255,0.2)',
        borderRadius: '0 8px 8px 0',
        color: 'var(--color-accent)',
        cursor: isDownloading ? 'not-allowed' : 'pointer',
        opacity: isDownloading ? 0.6 : 1,
      }}
      aria-label="Choose download style"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d={showDeckStyleMenu ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
      </svg>
    </button>
    {showDeckStyleMenu && (
      <div style={{
        position: 'absolute', top: 'calc(100% + 4px)', left: 0,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '8px', minWidth: '200px', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 20,
      }}>
        {[
          { id: 'deck',          label: 'Deck Card',          desc: 'All combos, images, bars' },
          { id: 'compact',       label: 'Compact List',        desc: 'Names only' },
          { id: 'compact-image', label: 'Compact with Image',  desc: 'Small image + bars' },
        ].map(({ id, label, desc }) => (
          <button key={id}
            onClick={() => { setDeckExportStyle(id); setShowDeckStyleMenu(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '9px 14px', textAlign: 'left',
              background: deckExportStyle === id ? 'var(--color-accent-dim)' : 'transparent',
              borderLeft: deckExportStyle === id ? '2px solid var(--color-accent)' : '2px solid transparent',
              border: 'none', cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: deckExportStyle === id ? 'var(--color-accent)' : 'var(--color-text)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{label}</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{desc}</div>
            </div>
            {deckExportStyle === id && (
              <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
            )}
          </button>
        ))}
      </div>
    )}
  </div>
  {downloadError && <span className="text-xs" style={{ color: '#ff4455' }}>{downloadError}</span>}
</div>
```

- [ ] **Step 9: Replace the per-combo download button with a split button**

In the combo card header (inside the `Array(beybladeCount).fill(null).map(...)` block), find the download icon button and replace it with a split button. Replace the existing per-combo download `<button>` (the one with `IconDownload`):

```jsx
<div style={{ position: 'relative', display: 'inline-flex' }} onClick={(e) => e.stopPropagation()}>
  <button
    onClick={() => handleDownloadCombo(index)}
    disabled={exportComboIndex !== null || isDownloading}
    title="Download this combo"
    aria-label={`Download combo ${index + 1}`}
    className="flex items-center justify-center w-7 h-7 transition-all hover:brightness-110"
    style={{
      background: 'var(--color-accent-dim)',
      border: '1px solid rgba(0,212,255,0.25)',
      borderRight: 'none',
      borderRadius: '6px 0 0 6px',
      color: exportComboIndex === index ? 'rgba(0,212,255,0.4)' : 'var(--color-accent)',
      opacity: (exportComboIndex !== null || isDownloading) && exportComboIndex !== index ? 0.4 : 1,
      cursor: (exportComboIndex !== null || isDownloading) ? 'not-allowed' : 'pointer',
    }}
  >
    <IconDownload />
  </button>
  <button
    onClick={() => setShowComboStyleMenu((v) => v === index ? null : index)}
    disabled={exportComboIndex !== null || isDownloading}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 4px', height: '28px',
      background: 'var(--color-accent-dim)',
      border: '1px solid rgba(0,212,255,0.25)',
      borderLeft: '1px solid rgba(0,212,255,0.15)',
      borderRadius: '0 6px 6px 0',
      color: 'var(--color-accent)',
      cursor: (exportComboIndex !== null || isDownloading) ? 'not-allowed' : 'pointer',
      opacity: (exportComboIndex !== null || isDownloading) ? 0.4 : 1,
    }}
    aria-label="Choose combo export style"
  >
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d={showComboStyleMenu === index ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
    </svg>
  </button>
  {showComboStyleMenu === index && (
    <div style={{
      position: 'absolute', top: 'calc(100% + 4px)', right: 0,
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '8px', minWidth: '180px', overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 20,
    }}>
      {[
        { id: 'single',        label: 'Single Combo',       desc: 'Large image, full bars' },
        { id: 'compact-image', label: 'Compact with Image', desc: 'Small image + bars' },
      ].map(({ id, label, desc }) => (
        <button key={id}
          onClick={() => { setShowComboStyleMenu(null); handleDownloadCombo(index, id); }}
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
```

- [ ] **Step 10: Add the ShareModal to the App return**

After the SupportPopup block (before the closing `</div>`), add:
```jsx
{showShareModal && (
  <ShareModal
    beyblades={beyblades}
    beybladeCount={beybladeCount}
    currentFormat={currentFormat}
    onClose={() => setShowShareModal(false)}
  />
)}
```

- [ ] **Step 11: Full end-to-end test**

Run `npm run dev`. Test each of the following:

1. Click Share → modal opens with Share Link tab → copy URL works
2. Click Embed tab → pick Deck Card → live iframe preview shows deck → copy code button works
3. Pick Single Combo in embed tab → combo picker appears → iframe preview updates
4. Close modal with backdrop click and with ×
5. Click Download Deck → downloads PNG with default `deck` style
6. Click chevron → style menu opens → select Compact List → click Download Deck → downloads compact list PNG
7. Click chevron on a combo card → menu opens → select Single Combo → downloads single combo PNG
8. Navigate to `http://localhost:5173/?widget=compact&beynum=2&beys=Dran Sword,3-60F,Flat&beys=Hells Scythe,4-80B,Bound` → only compact widget renders

- [ ] **Step 12: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire ShareModal, split-button downloads, widget-based off-screen render"
```

---

## Task 10: Lint and cleanup

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Fix any reported errors. Common issues to expect: unused imports if ExportCard import lingers in App.jsx.

- [ ] **Step 2: Remove ExportCard import from App.jsx if unused**

Check whether `ExportCard` is still imported in `App.jsx`. If yes and unused, remove the import line.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: lint fixes and cleanup after embed widgets feature"
```
