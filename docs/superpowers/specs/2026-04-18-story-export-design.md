# Story Export (9:16) Design

**Date:** 2026-04-18
**Status:** Approved

## Summary

Add Instagram/Facebook Story-optimized export options (fixed 9:16 aspect ratio, 1080×1920) to both the per-combo download menu and the deck download menu.

## Decisions

- **Canvas:** Fixed 9:16 (1080×1920). Rendered at 540px wide, scale 4 → 2160px wide, then the PNG is exactly 9:16.
- **Layout style:** Hero Image — blade photo in the upper portion, combo name + type tags below it, then stat bars filling the remaining space.
- **Scope:** Story option added to both per-combo and deck download dropdowns.

## Components

### `StoryComboWidget` (`src/components/widgets/StoryComboWidget.jsx`)

Renders a single combo in 9:16 hero-image layout:

- Dark `#080c18` background with dot-grid overlay
- Top label: `BEYBREW · COMBO` (small, accent-colored)
- Hero zone (~40% of canvas height): blade image centered, large circular frame with glow ring, lock chip overlay for CX line
- Divider line
- Combo name (large, bold white), ratchet+bit on second line in accent color
- Type tags: spin direction · bit type (small badges)
- Stat bars: all 5 stats (ATTACK, DEFENSE, STAMINA, X-DASH, BURST RESISTANCE) with full labels, gradient fills, and numeric values
- Bottom watermark: `BEYBLADEBREW.COM`

### `StoryDeckWidget` (`src/components/widgets/StoryDeckWidget.jsx`)

Renders the full deck in a single 9:16 canvas, stacking combos:

- Same dark background and dot-grid
- Top header: `BEYBREW` gradient title + `BEYBLADE X DECK · {FORMAT}` subtitle
- Each combo gets an equal vertical slice of the remaining space:
  - **1–3 combos:** Full hero treatment per combo — large image (~90px), full name, all 5 stat bars
  - **4–6 combos:** Scaled down — smaller image (~60px), full name, all 5 stat bars (compact spacing)
  - **7–10 combos:** No image — combo name + 5 stat bars only (compact)
- Each combo section has a colored left-border accent (cycling: cyan, purple, orange)
- Bottom watermark: `BEYBLADEBREW.COM`

## UI Changes

### Per-combo download dropdown (`App.jsx`, `showComboStyleMenu`)

Add new option:
```js
{ id: 'story', label: 'Story (9:16)', desc: 'Instagram / Facebook Stories' }
```

### Deck download dropdown (`App.jsx`, `showDeckStyleMenu`)

Add new option:
```js
{ id: 'story', label: 'Story (9:16)', desc: 'Instagram / Facebook Stories' }
```

## Download Handlers

### `handleDownloadCombo` (existing, extended)

When `resolvedStyle === 'story'`:
- Container: `width: 540px; height: 960px` (540 × 16/9 = 960 — enforces exact 9:16)
- Render `<StoryComboWidget combo={beyblades[index]} />`
- `domToPng` with `scale: 4` → 2160×3840px (exact 2× 1080×1920 story resolution)
- Filename: `beybrew_story_combo{n}_{timestamp}.png`

### `handleDownloadDeck` (existing, extended)

When `resolvedStyle === 'story'`:
- Container: `width: 540px; height: 960px`
- Render `<StoryDeckWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />`
- `domToPng` with `scale: 4`
- Filename: `beybrew_story_deck_{timestamp}.png`

## File Changes

| File | Change |
|------|--------|
| `src/components/widgets/StoryComboWidget.jsx` | New file |
| `src/components/widgets/StoryDeckWidget.jsx` | New file |
| `src/App.jsx` | Add story option to both dropdowns; extend both download handlers |
