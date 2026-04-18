# Story Export (9:16) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Instagram/Facebook Story-format (9:16, 1080×1920) download options to both the per-combo and deck export menus.

**Architecture:** Two new stateless widget components (`StoryComboWidget`, `StoryDeckWidget`) render a fixed 540×960 div; `domToPng` with `scale: 4` produces a 2160×3840 PNG (exact 2× story resolution). Both are wired into the existing split-button dropdowns in `App.jsx` alongside the existing export styles.

**Tech Stack:** React (JSX), `modern-screenshot` (`domToPng`), `downloadjs`, existing `comboUtils` helpers (`getComboStats`, `getComboName`, `STAT_DEFS`), `BEYBLADE_DB` from constants.

---

## File Map

| File | Action |
|------|--------|
| `src/components/widgets/StoryComboWidget.jsx` | Create — single combo, 9:16 hero layout |
| `src/components/widgets/StoryDeckWidget.jsx` | Create — full deck, 9:16 stacked layout |
| `src/App.jsx` | Modify — import both widgets, extend both handlers, add dropdown options |

---

### Task 1: Create StoryComboWidget

**Files:**
- Create: `src/components/widgets/StoryComboWidget.jsx`

- [ ] **Step 1: Create the file**

```jsx
import PropTypes from 'prop-types';
import { BEYBLADE_DB } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';

const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};
const ACCENT = '#00d4ff';

function StoryComboWidget({ combo }) {
  const { blade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const stats = getComboStats(combo);
  const name = getComboName(combo);
  const spinType = BEYBLADE_DB[blade]?.spinType;
  const bitType = BEYBLADE_DB[combo?.bit]?.type;

  return (
    <div style={{
      ...DOT_BG,
      background: '#080c18',
      width: '540px',
      height: '960px',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '32px 36px',
      boxSizing: 'border-box',
    }}>
      {/* Top label */}
      <div style={{ fontSize: '11px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '24px', flexShrink: 0 }}>
        BEYBREW · COMBO
      </div>

      {/* Hero image zone */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: '0 0 280px', position: 'relative' }}>
        <div style={{ position: 'absolute', width: '240px', height: '240px', borderRadius: '50%', border: '1px solid rgba(0,212,255,0.12)', boxShadow: '0 0 60px rgba(0,212,255,0.08)' }} />
        <div style={{ position: 'absolute', width: '210px', height: '210px', borderRadius: '50%', border: '1px dashed rgba(0,212,255,0.07)' }} />
        <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
          {blade && BEYBLADE_DB[blade]?.image ? (
            <img
              src={`/images/${BEYBLADE_DB[blade].image}`}
              alt={blade}
              style={{ width: '180px', height: '180px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `3px solid ${ACCENT}80`, boxShadow: `0 0 40px ${ACCENT}22` }}
            />
          ) : (
            <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: '#0f1e2e', border: `3px solid ${ACCENT}80` }} />
          )}
          {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
            <img
              src={`/images/${BEYBLADE_DB[lockChip].image}`}
              alt={lockChip}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.3),transparent)', margin: '20px 0', flexShrink: 0 }} />

      {/* Combo name */}
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '0.02em', marginBottom: '10px', flexShrink: 0 }}>
        {name || '—'}
      </div>

      {/* Type tags */}
      {(spinType || bitType) && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexShrink: 0 }}>
          {spinType && (
            <span style={{ fontSize: '10px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '6px', padding: '3px 8px', color: ACCENT, letterSpacing: '0.1em', fontWeight: 700 }}>
              {spinType.toUpperCase()} SPIN
            </span>
          )}
          {bitType && (
            <span style={{ fontSize: '10px', background: 'rgba(123,97,255,0.1)', border: '1px solid rgba(123,97,255,0.3)', borderRadius: '6px', padding: '3px 8px', color: '#7b61ff', letterSpacing: '0.1em', fontWeight: 700 }}>
              {bitType.toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* Stat bars */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px' }}>
        {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
          const value = stats[key] || 0;
          const pct = Math.min(1, value / limit);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', width: '80px', flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct * 100}%`, background: gradient, borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '13px', color, fontWeight: 700, width: '28px', textAlign: 'right' }}>{value}</span>
            </div>
          );
        })}
      </div>

      {/* Watermark */}
      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

StoryComboWidget.propTypes = { combo: PropTypes.object };

export default StoryComboWidget;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/StoryComboWidget.jsx
git commit -m "feat: add StoryComboWidget for 9:16 single combo export"
```

---

### Task 2: Wire per-combo story download in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add import at the top of App.jsx alongside the other widget imports (around line 12)**

Add this line after the existing widget imports:
```js
import StoryComboWidget from './components/widgets/StoryComboWidget';
```

- [ ] **Step 2: Extend `handleDownloadCombo` to handle the `'story'` style**

Find the `handleDownloadCombo` callback. Currently the container style is:
```js
container.style.cssText = 'position:fixed;left:-9999px;top:0;width:320px';
```

Replace the entire `handleDownloadCombo` callback with:
```js
const handleDownloadCombo = useCallback((index, style) => {
  const resolvedStyle = style ?? comboExportStyle;
  setComboExportStyle(resolvedStyle);
  setIsDownloading(true);

  const isStory = resolvedStyle === 'story';
  const container = document.createElement('div');
  container.style.cssText = isStory
    ? 'position:fixed;left:-9999px;top:0;width:540px;height:960px'
    : 'position:fixed;left:-9999px;top:0;width:320px';
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => root.render(
    resolvedStyle === 'story'
      ? <StoryComboWidget combo={beyblades[index]} />
      : resolvedStyle === 'single'
        ? <SingleComboWidget combo={beyblades[index]} />
        : <CompactImageWidget combos={[beyblades[index]]} beybladeCount={1} format={currentFormat} />
  ));
  domToPng(container, { backgroundColor: '#080c18', scale: isStory ? 4 : 3 })
    .then((dataUrl) => {
      const filename = isStory
        ? `beybrew_story_combo${index + 1}_${Date.now()}.png`
        : `beybrew_combo${index + 1}_${Date.now()}.png`;
      download(dataUrl, filename, 'image/png');
    })
    .catch(() => setDownloadError('Download failed. Try again.'))
    .finally(() => {
      root.unmount();
      container.remove();
      setIsDownloading(false);
    });
}, [comboExportStyle, beyblades, currentFormat]);
```

- [ ] **Step 3: Add `'story'` to the per-combo dropdown options**

Find the combo dropdown options array (around line 443–446):
```js
{ id: 'single',        label: 'Single Combo',       desc: 'Large image, full bars' },
{ id: 'compact-image', label: 'Compact with Image', desc: 'Small image + bars' },
```

Replace with:
```js
{ id: 'single',        label: 'Single Combo',       desc: 'Large image, full bars' },
{ id: 'compact-image', label: 'Compact with Image', desc: 'Small image + bars' },
{ id: 'story',         label: 'Story (9:16)',        desc: 'Instagram / Facebook Stories' },
```

- [ ] **Step 4: Visual verification**

Run: `npm run dev`

1. Select a blade, ratchet, and bit for combo 1
2. Click the dropdown arrow next to the per-combo download button
3. Click "Story (9:16)"
4. Open the downloaded PNG — verify:
   - Image dimensions are 2160×3840 (check in Finder → Get Info, or any image viewer)
   - Blade image appears large in the upper ~40% of the canvas
   - Combo name is large and bold below the image
   - All 5 stat bars (ATTACK, DEFENSE, STAMINA, X-DASH, BURST) are visible with correct values
   - `BEYBLADEBREW.COM` watermark at the bottom
5. Test with a CX-line blade (e.g. one with `line: 'CX'`) — verify the lock chip image overlays the center of the blade image

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire story export to per-combo download menu"
```

---

### Task 3: Create StoryDeckWidget

**Files:**
- Create: `src/components/widgets/StoryDeckWidget.jsx`

- [ ] **Step 1: Create the file**

```jsx
import PropTypes from 'prop-types';
import { BEYBLADE_DB, LIMITED_FORMAT } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';

const ACCENT_COLORS = ['#00d4ff', '#7b61ff', '#ffa040'];
const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

function ComboSection({ combo, accent, imageSize, statHeight, statGap, nameFontSize }) {
  const { blade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const stats = getComboStats(combo);
  const name = getComboName(combo);

  return (
    <div style={{
      flex: 1,
      background: `${accent}08`,
      border: `1px solid ${accent}22`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: '10px',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {imageSize > 0 && (
        <div style={{ position: 'relative', width: `${imageSize}px`, height: `${imageSize}px`, flexShrink: 0 }}>
          {blade && BEYBLADE_DB[blade]?.image ? (
            <img
              src={`/images/${BEYBLADE_DB[blade].image}`}
              alt={blade}
              style={{ width: `${imageSize}px`, height: `${imageSize}px`, borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${accent}80` }}
            />
          ) : (
            <div style={{ width: `${imageSize}px`, height: `${imageSize}px`, borderRadius: '50%', background: '#0f1e2e', border: `2px solid ${accent}80` }} />
          )}
          {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
            <img
              src={`/images/${BEYBLADE_DB[lockChip].image}`}
              alt={lockChip}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
            />
          )}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: `${nameFontSize}px`, fontWeight: 800, color: '#fff', marginBottom: `${statGap}px`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name || '—'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${Math.max(2, statGap - 2)}px` }}>
          {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
            const value = stats[key] || 0;
            const pct = Math.min(1, value / limit);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', width: '44px', flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: `${statHeight}px`, borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct * 100}%`, background: gradient, borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '8px', color, fontWeight: 700, width: '16px', textAlign: 'right' }}>{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

ComboSection.propTypes = {
  combo: PropTypes.object,
  accent: PropTypes.string.isRequired,
  imageSize: PropTypes.number.isRequired,
  statHeight: PropTypes.number.isRequired,
  statGap: PropTypes.number.isRequired,
  nameFontSize: PropTypes.number.isRequired,
};

function StoryDeckWidget({ combos, beybladeCount, format }) {
  const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';

  let imageSize, statHeight, statGap, nameFontSize;
  if (beybladeCount <= 3) {
    imageSize = 100; statHeight = 5; statGap = 8; nameFontSize = 13;
  } else if (beybladeCount <= 6) {
    imageSize = 64; statHeight = 4; statGap = 5; nameFontSize = 11;
  } else {
    imageSize = 0; statHeight = 3; statGap = 4; nameFontSize = 10;
  }

  return (
    <div style={{
      ...DOT_BG,
      background: '#080c18',
      width: '540px',
      height: '960px',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 32px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.08em', background: 'linear-gradient(90deg,#00d4ff,#7b61ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          BEYBREW
        </div>
        <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)', margin: '6px auto' }} />
        <div style={{ fontSize: '9px', color: 'rgba(0,212,255,0.7)', letterSpacing: '0.22em', fontWeight: 600 }}>
          BEYBLADE X DECK · {formatLabel}
        </div>
      </div>

      {/* Combos */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', minHeight: 0 }}>
        {Array(beybladeCount).fill(null).map((_, i) => (
          <ComboSection
            key={i}
            combo={combos[i]}
            accent={ACCENT_COLORS[i % ACCENT_COLORS.length]}
            imageSize={imageSize}
            statHeight={statHeight}
            statGap={statGap}
            nameFontSize={nameFontSize}
          />
        ))}
      </div>

      {/* Watermark */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

StoryDeckWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
};

export default StoryDeckWidget;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/StoryDeckWidget.jsx
git commit -m "feat: add StoryDeckWidget for 9:16 full deck export"
```

---

### Task 4: Wire deck story download in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add StoryDeckWidget import alongside StoryComboWidget**

Find the StoryComboWidget import added in Task 2 and add the deck import below it:
```js
import StoryComboWidget from './components/widgets/StoryComboWidget';
import StoryDeckWidget from './components/widgets/StoryDeckWidget';
```

- [ ] **Step 2: Extend `handleDownloadDeck` to handle the `'story'` style**

Find the `handleDownloadDeck` callback. Currently the container style is:
```js
container.style.cssText = 'position:fixed;left:-9999px;top:0;width:480px';
```

Replace the entire `handleDownloadDeck` callback with:
```js
const handleDownloadDeck = useCallback((style) => {
  const resolvedStyle = style ?? deckExportStyle;
  setDeckExportStyle(resolvedStyle);
  setIsDownloading(true);

  const isStory = resolvedStyle === 'story';
  const container = document.createElement('div');
  container.style.cssText = isStory
    ? 'position:fixed;left:-9999px;top:0;width:540px;height:960px'
    : 'position:fixed;left:-9999px;top:0;width:480px';
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => root.render(
    resolvedStyle === 'story'
      ? <StoryDeckWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
      : resolvedStyle === 'compact'
        ? <CompactListWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
        : resolvedStyle === 'compact-image'
          ? <CompactImageWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
          : <DeckWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
  ));
  domToPng(container, { backgroundColor: '#080c18', scale: isStory ? 4 : 3 })
    .then((dataUrl) => {
      const filename = isStory
        ? `beybrew_story_deck_${Date.now()}.png`
        : `beybrew_deck_${Date.now()}.png`;
      download(dataUrl, filename, 'image/png');
    })
    .catch(() => setDownloadError('Download failed. Try again.'))
    .finally(() => {
      root.unmount();
      container.remove();
      setIsDownloading(false);
    });
}, [deckExportStyle, beyblades, beybladeCount, currentFormat]);
```

- [ ] **Step 3: Add `'story'` to the deck dropdown options**

Find the deck dropdown options array (around line 637–640):
```js
{ id: 'deck',          label: 'Deck Card',         desc: 'All combos, images, bars' },
{ id: 'compact',       label: 'Compact List',       desc: 'Names only' },
{ id: 'compact-image', label: 'Compact with Image', desc: 'Small image + bars' },
```

Replace with:
```js
{ id: 'deck',          label: 'Deck Card',         desc: 'All combos, images, bars' },
{ id: 'compact',       label: 'Compact List',       desc: 'Names only' },
{ id: 'compact-image', label: 'Compact with Image', desc: 'Small image + bars' },
{ id: 'story',         label: 'Story (9:16)',        desc: 'Instagram / Facebook Stories' },
```

- [ ] **Step 4: Visual verification**

Run: `npm run dev` (if not already running)

**3-combo deck test:**
1. Set Beyblade count to 3, fill in all 3 combos with blades + ratchets + bits
2. Click dropdown arrow next to "Download Deck", select "Story (9:16)"
3. Open the PNG — verify:
   - 2160×3840 dimensions
   - `BEYBREW` gradient title at top, format label below
   - All 3 combos visible, each with a ~100px blade image, full name, 5 stat bars
   - Each combo has a different accent color (cyan / purple / orange cycling)

**6-combo deck test:**
1. Set count to 6, fill all combos
2. Download as Story (9:16)
3. Verify blade images are smaller (~64px) but still visible, all combos fit cleanly

**8-combo deck test:**
1. Set count to 8
2. Download as Story (9:16)
3. Verify no images shown — just combo names and stat bars, all 8 fit without overflow

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire story export to deck download menu"
```
