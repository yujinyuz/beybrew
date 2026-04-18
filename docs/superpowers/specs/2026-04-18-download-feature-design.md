# Download Feature Redesign

**Date:** 2026-04-18  
**Goal:** Replace the experimental, unreliable PNG export with a polished, social-media-ready download that produces a clean branded image.

---

## Problem with Current Implementation

- `html-to-image` captures a DOM clone but CSS custom properties (`var(--color-accent)`) don't resolve in the clone — output can look broken
- Hidden element shown/hidden via direct DOM style mutation (`beyComboParentRef.current.style = ...`) instead of React state
- `useCallback` missing `theme` in deps — background color can be stale
- `window.alert` for errors — bad UX
- No loading state while generating PNG
- Captures `ComboSummaryList` (compact card grid) — not visually interesting for social sharing
- Button labeled `[experimental]` — lacks confidence

---

## Design

### New `src/components/ExportCard.jsx`

Pure presentational component using `forwardRef`.

**Key constraint:** All styles are hardcoded inline values — no CSS custom properties. This is mandatory for reliable `html-to-image` capture.

**Props:**
```js
{ beyblades, beybladeCount, format, comboIndex }
```
- `comboIndex === null` → renders full deck (all combos stacked vertically)
- `comboIndex === number` → renders single combo (larger image, more prominent layout)

**Full deck layout (480px fixed width):**
- Dark background `#080c18` with subtle dot grid
- Header: `BEYBREW` gradient title + thin divider + format badge (`BEYBLADE X DECK · STANDARD`)
- Each combo as a row: circular blade image (52px) + combo name (bold) + 5 stat bars (ATK, DEF, STA, X-DASH, BURST) with values
- Each combo row has a cycling left-border accent: `['#00d4ff', '#7b61ff', '#ffa040']`, repeating
- Footer: `BEYBLADEBREW.COM` centered between divider lines

**Single combo layout (320px fixed width):**
- Same dark background + dot grid
- Top label: `BEYBREW · COMBO`
- Larger blade image (68px) + combo name + spin type/bit type subtext
- All 5 stat bars, slightly taller (4px)
- Footer: `BEYBLADEBREW.COM`

---

### `src/App.jsx` Changes

**Remove:**
- `beyComboRef`, `beyComboParentRef`
- Hidden `<div>` clone of `ComboSummaryList`
- Old `handleDownloadButton`

**Add:**
- `exportRef = useRef(null)` — points to the off-screen `ExportCard`
- `exportComboIndex` state (`null | number`) — controls which combo ExportCard renders
- `isDownloading` boolean state — controls loading UI on the deck Download button
- `downloadError` state (`null | string`) — inline error message, auto-cleared after 4s

**Off-screen rendering:**
```jsx
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
ExportCard is always in the DOM, always up-to-date. No show/hide needed.

**`handleDownloadDeck()`:**
```js
setIsDownloading(true);
toPng(exportRef.current, { cacheBust: true, backgroundColor: '#080c18' })
  .then(dataUrl => { const a = document.createElement('a'); a.download = `beybrew_deck_${Date.now()}.png`; a.href = dataUrl; a.click(); })
  .catch(err => setDownloadError(err.message))
  .finally(() => setIsDownloading(false));
```

**`handleDownloadCombo(index)`:**
```js
flushSync(() => setExportComboIndex(index));
// ExportCard has synchronously re-rendered with the right combo
toPng(exportRef.current, { cacheBust: true, backgroundColor: '#080c18' })
  .then(dataUrl => { const a = document.createElement('a'); a.download = `beybrew_combo${index + 1}_${Date.now()}.png`; a.href = dataUrl; a.click(); })
  .catch(err => setDownloadError(err.message))
  .finally(() => setExportComboIndex(null));
```

**Download button (action bar):** Styled to match Share/Randomize buttons (remove the muted grey style and `[experimental]` label). Shows "Generating…" text while `isDownloading` is true.

**Per-combo download button:** Small icon button in each combo card header, next to the existing Randomize button. Calls `handleDownloadCombo(index)`.

**Error handling:** Small inline error message below the Download button (auto-clears after 4 seconds). No `window.alert`.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/ExportCard.jsx` | New — export image component |
| `src/App.jsx` | Replace download logic, add per-combo buttons, add ExportCard off-screen |

## Files Unchanged

- `src/Beyblade.jsx` — stat display component, not touched
- `src/components/ComboSummaryList.jsx` — still used in the live UI summary section
- `src/data/beyparts.js`, `src/constants.js` — no changes needed
