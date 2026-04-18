# Download Feature Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the experimental PNG export with a polished, social-media-ready download featuring a branded dark-theme card with blade images and stat bars, plus per-combo download buttons on each card.

**Architecture:** A new `ExportCard` component renders the export image using hardcoded inline styles (no CSS custom properties — required for reliable `html-to-image` capture). It lives off-screen in the DOM at all times, controlled by `exportComboIndex` state in `App.jsx`. Deck download captures it directly; per-combo download uses `flushSync` to synchronously update `exportComboIndex` before capture.

**Tech Stack:** React 18, html-to-image (`toPng`), react-dom (`flushSync`)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/ExportCard.jsx` | Create | Export image component — full deck and single combo modes, all inline styles |
| `src/App.jsx` | Modify | Download handlers, ExportCard integration, per-combo buttons, error state |

---

### Task 1: Create ExportCard component

**Files:**
- Create: `src/components/ExportCard.jsx`

- [ ] **Step 1: Create `src/components/ExportCard.jsx` with the full implementation**

```jsx
import React, { forwardRef } from 'react';
import { BEYBLADE_DB, LIMITED_FORMAT } from '../constants';

const ACCENT_COLORS = ['#00d4ff', '#7b61ff', '#ffa040'];

const STAT_DEFS = [
  { key: 'attack',          label: 'ATTACK',  gradient: 'linear-gradient(90deg,#1565c0,#00d4ff)', color: '#00d4ff', limit: 2 },
  { key: 'defense',         label: 'DEFENSE', gradient: 'linear-gradient(90deg,#2e7d32,#00e676)', color: '#00e676', limit: 2 },
  { key: 'stamina',         label: 'STAMINA', gradient: 'linear-gradient(90deg,#e65100,#ffcc02)', color: '#ffcc02', limit: 2 },
  { key: 'xDash',           label: 'X-DASH',  gradient: 'linear-gradient(90deg,#b71c1c,#ff6d00)', color: '#ff6d00', limit: 1 },
  { key: 'burstResistance', label: 'BURST',   gradient: 'linear-gradient(90deg,#4a148c,#aa00ff)', color: '#aa00ff', limit: 1 },
];

const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

function getComboStats(combo) {
  const { blade, assistBlade, ratchet, bit } = combo || {};
  return {
    attack:          (BEYBLADE_DB[blade]?.attack          || 0) + (BEYBLADE_DB[assistBlade]?.attack          || 0) + (BEYBLADE_DB[ratchet]?.attack          || 0) + (BEYBLADE_DB[bit]?.attack          || 0),
    defense:         (BEYBLADE_DB[blade]?.defense         || 0) + (BEYBLADE_DB[assistBlade]?.defense         || 0) + (BEYBLADE_DB[ratchet]?.defense         || 0) + (BEYBLADE_DB[bit]?.defense         || 0),
    stamina:         (BEYBLADE_DB[blade]?.stamina         || 0) + (BEYBLADE_DB[assistBlade]?.stamina         || 0) + (BEYBLADE_DB[ratchet]?.stamina         || 0) + (BEYBLADE_DB[bit]?.stamina         || 0),
    xDash:           BEYBLADE_DB[bit]?.xDash           || 0,
    burstResistance: BEYBLADE_DB[bit]?.burstResistance || 0,
  };
}

function getComboName(combo) {
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

function StatBars({ stats, barHeight = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
        const value = stats[key] || 0;
        const pct = Math.min(100, (value / limit) * 100);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', width: '50px', flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: `${barHeight}px`, borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '24px', textAlign: 'right' }}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function Footer() {
  return (
    <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
      <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
    </div>
  );
}

function ComboRow({ combo, accent }) {
  const { blade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const stats = getComboStats(combo);
  const name = getComboName(combo);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent}33`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: '10px',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    }}>
      <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
        {blade && BEYBLADE_DB[blade]?.image && (
          <img
            src={`/images/${BEYBLADE_DB[blade].image}`}
            alt={blade}
            style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${accent}80` }}
          />
        )}
        {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
          <img
            src={`/images/${BEYBLADE_DB[lockChip].image}`}
            alt={lockChip}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#fff', marginBottom: '6px', letterSpacing: '0.03em' }}>{name || '—'}</div>
        <StatBars stats={stats} barHeight={3} />
      </div>
    </div>
  );
}

const ExportCard = forwardRef(function ExportCard({ beyblades, beybladeCount, format, comboIndex }, ref) {
  const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';

  if (comboIndex != null) {
    const combo = beyblades[comboIndex] || {};
    const { blade, lockChip } = combo;
    const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
    const stats = getComboStats(combo);
    const name = getComboName(combo);
    const spinType = BEYBLADE_DB[blade]?.spinType;
    const bitType = BEYBLADE_DB[combo.bit]?.type;
    const accent = '#00d4ff';

    return (
      <div ref={ref} style={{ ...DOT_BG, background: '#080c18', width: '320px', borderRadius: '16px', border: `1px solid ${accent}33`, borderLeft: `3px solid ${accent}`, padding: '20px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
        <div style={{ fontSize: '7px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '14px' }}>BEYBREW · COMBO</div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ position: 'relative', width: '68px', height: '68px', flexShrink: 0 }}>
            {blade && BEYBLADE_DB[blade]?.image && (
              <img
                src={`/images/${BEYBLADE_DB[blade].image}`}
                alt={blade}
                style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${accent}80` }}
              />
            )}
            {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
              <img
                src={`/images/${BEYBLADE_DB[lockChip].image}`}
                alt={lockChip}
                style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
              />
            )}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '0.02em' }}>{name || '—'}</div>
            {(spinType || bitType) && (
              <div style={{ fontSize: '7px', color: 'rgba(0,212,255,0.5)', marginTop: '4px', letterSpacing: '0.1em' }}>
                {[spinType && `${spinType.toUpperCase()} SPIN`, bitType && bitType.toUpperCase()].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        </div>
        <StatBars stats={stats} barHeight={4} />
        <Footer />
      </div>
    );
  }

  return (
    <div ref={ref} style={{ ...DOT_BG, background: '#080c18', width: '480px', borderRadius: '16px', padding: '24px', fontFamily: 'system-ui,-apple-system,sans-serif', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '120px', background: 'radial-gradient(ellipse,rgba(0,212,255,0.12),transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.08em', background: 'linear-gradient(90deg,#00d4ff,#7b61ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BEYBREW</div>
        <div style={{ width: '80px', height: '1px', background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)', margin: '6px auto' }} />
        <div style={{ fontSize: '8px', color: 'rgba(0,212,255,0.7)', letterSpacing: '0.25em', fontWeight: 600 }}>BEYBLADE X DECK · {formatLabel}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array(beybladeCount).fill(null).map((_, i) => (
          <ComboRow key={i} combo={beyblades[i]} accent={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
        ))}
      </div>
      <Footer />
    </div>
  );
});

export default ExportCard;
```

- [ ] **Step 2: Start dev server and verify no errors**

Run: `npm run dev`

Open browser. The component isn't used yet — confirm no console errors from the new file (syntax, import, etc.).

- [ ] **Step 3: Commit**

```bash
git add src/components/ExportCard.jsx
git commit -m "feat: add ExportCard component for social media export"
```

---

### Task 2: Replace deck download in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add `flushSync` import and `ExportCard` import**

At the top of `src/App.jsx`, change:
```js
import React, { useCallback, useEffect, useRef, useState } from 'react';
```
To:
```js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
```

After the existing `import ComboSummaryList` line, add:
```js
import ExportCard from './components/ExportCard';
```

- [ ] **Step 2: Remove old download refs**

Remove these two lines (currently around line 109–110):
```js
const beyComboRef = useRef(null);
const beyComboParentRef = useRef(null);
```

- [ ] **Step 3: Remove `handleDownloadButton`**

Remove the entire useCallback (currently around lines 112–130):
```js
const handleDownloadButton = useCallback(() => {
  if (!beyComboRef.current || !beyComboParentRef.current) return;
  beyComboParentRef.current.style = 'display: block';
  const bgColor = theme === 'light' ? '#eef2fc' : '#080c18';
  toPng(beyComboRef.current, { cacheBust: true, backgroundColor: bgColor })
    .then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `beybrew_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    })
    .catch((err) => {
      window.alert(`Error: ${err}`);
      console.log(err);
    })
    .finally(() => {
      beyComboParentRef.current.style = 'display: none';
    });
}, [beyComboRef]);
```

- [ ] **Step 4: Add new state, refs, and handlers**

After `const [theme, setTheme] = useState(...)`, add:
```js
const exportRef = useRef(null);
const [exportComboIndex, setExportComboIndex] = useState(null);
const [isDownloading, setIsDownloading] = useState(false);
const [downloadError, setDownloadError] = useState(null);
```

After the existing `useEffect` for theme, add the auto-clear effect and the two download handlers:
```js
useEffect(() => {
  if (!downloadError) return;
  const t = setTimeout(() => setDownloadError(null), 4000);
  return () => clearTimeout(t);
}, [downloadError]);

const handleDownloadDeck = useCallback(() => {
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
}, [exportRef]);

const handleDownloadCombo = useCallback((index) => {
  flushSync(() => setExportComboIndex(index));
  toPng(exportRef.current, { cacheBust: true, backgroundColor: '#080c18' })
    .then((dataUrl) => {
      const a = document.createElement('a');
      a.download = `beybrew_combo${index + 1}_${Date.now()}.png`;
      a.href = dataUrl;
      a.click();
    })
    .catch(() => setDownloadError('Download failed. Try again.'))
    .finally(() => setExportComboIndex(null));
}, [exportRef]);
```

- [ ] **Step 5: Replace the hidden clone with off-screen ExportCard**

Find and remove this block near the bottom of the JSX:
```jsx
{/* Hidden clone for PNG download */}
<div className="w-max hidden" ref={beyComboParentRef}>
  <ComboSummaryList ref={beyComboRef} beyblades={beyblades} beybladeCount={beybladeCount} />
</div>
```

Replace it with:
```jsx
{/* Off-screen export target */}
<div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
  <ExportCard
    ref={exportRef}
    beyblades={beyblades}
    beybladeCount={beybladeCount}
    format={currentFormat}
    comboIndex={exportComboIndex}
  />
</div>
```

- [ ] **Step 6: Update the Download button**

Find the Download button in the action bar (the one with `onClick={handleDownloadButton}`). Replace the entire button element with:
```jsx
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
  <button
    onClick={handleDownloadDeck}
    disabled={isDownloading}
    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
    style={{
      background: 'var(--color-accent-dim)',
      border: '1px solid rgba(0,212,255,0.4)',
      color: 'var(--color-accent)',
      fontFamily: 'var(--font-heading)',
      opacity: isDownloading ? 0.6 : 1,
      cursor: isDownloading ? 'not-allowed' : 'pointer',
    }}
  >
    <IconDownload />
    {isDownloading ? 'Generating…' : 'Download Deck'}
  </button>
  {downloadError && (
    <span className="text-xs" style={{ color: '#ff4455' }}>{downloadError}</span>
  )}
</div>
```

- [ ] **Step 7: Verify deck download works**

Run: `npm run dev`
1. Select a blade, ratchet, and bit for at least one combo
2. Click "Download Deck"
3. Confirm the button shows "Generating…" briefly, then a PNG file downloads
4. Open the PNG — should show the BEYBREW branded card with blade image, stat bars, dark background, BEYBLADEBREW.COM footer
5. Confirm no `window.alert` appears on success or failure

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx
git commit -m "feat: replace experimental download with ExportCard-based deck export"
```

---

### Task 3: Add per-combo download buttons

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the download icon button to each combo card header**

Find the combo card header div (the `flex items-center justify-between mb-4` div inside the `.map`). It currently contains the `<h2>` and the Randomize button side by side. Wrap the Randomize button in a flex container and add a download icon button beside it:

Replace:
```jsx
<div className="flex items-center justify-between mb-4">
  <h2
    className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
    style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}
  >
    <span
      className="w-5 h-5 rounded flex items-center justify-center text-xs"
      style={{ background: 'var(--color-accent-dim)', border: '1px solid rgba(0,212,255,0.25)' }}
    >
      {index + 1}
    </span>
    Beyblade
  </h2>
  <button
    onClick={() => handleRandomizeSingle(index, maximumPointsLimited)}
    title="Randomize this beyblade"
    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110"
    style={{
      background: 'var(--color-accent-dim)',
      border: '1px solid rgba(0,212,255,0.25)',
      color: 'var(--color-accent)',
      fontFamily: 'var(--font-heading)',
    }}
  >
    <IconRandomize small />
    Randomize
  </button>
</div>
```

With:
```jsx
<div className="flex items-center justify-between mb-4">
  <h2
    className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
    style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}
  >
    <span
      className="w-5 h-5 rounded flex items-center justify-center text-xs"
      style={{ background: 'var(--color-accent-dim)', border: '1px solid rgba(0,212,255,0.25)' }}
    >
      {index + 1}
    </span>
    Beyblade
  </h2>
  <div className="flex items-center gap-2">
    <button
      onClick={() => handleRandomizeSingle(index, maximumPointsLimited)}
      title="Randomize this beyblade"
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110"
      style={{
        background: 'var(--color-accent-dim)',
        border: '1px solid rgba(0,212,255,0.25)',
        color: 'var(--color-accent)',
        fontFamily: 'var(--font-heading)',
      }}
    >
      <IconRandomize small />
      Randomize
    </button>
    <button
      onClick={() => handleDownloadCombo(index)}
      disabled={exportComboIndex !== null}
      title="Download this combo"
      className="flex items-center justify-center w-7 h-7 rounded transition-all hover:brightness-110"
      style={{
        background: 'var(--color-accent-dim)',
        border: '1px solid rgba(0,212,255,0.25)',
        color: exportComboIndex === index ? 'rgba(0,212,255,0.4)' : 'var(--color-accent)',
        opacity: exportComboIndex !== null && exportComboIndex !== index ? 0.4 : 1,
        cursor: exportComboIndex !== null ? 'not-allowed' : 'pointer',
      }}
    >
      <IconDownload />
    </button>
  </div>
</div>
```

- [ ] **Step 2: Verify per-combo download works**

Run: `npm run dev`
1. Select a blade, ratchet, and bit for combo #1
2. Click the small download icon on combo card #1
3. Confirm a PNG downloads with that single combo — BEYBREW · COMBO label at top, larger blade image, full stats, BEYBLADEBREW.COM footer
4. While downloading, confirm the other combo download icons are dimmed/disabled
5. Confirm the button returns to normal after download completes

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add per-combo download button to each beyblade card"
```
