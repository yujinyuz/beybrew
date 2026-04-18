# Embed Widgets Design

## Overview

Add embeddable widgets and flexible PNG exports to BeyBrew. Users can share their deck as an `<iframe>` on any site, and choose from multiple visual styles when downloading. The same widget components serve both embed and download, eliminating the need to maintain two separate rendering systems.

---

## Widget Types

Four widget styles, each usable as both an iframe embed and a PNG download:

| ID | Name | Shows |
|----|------|-------|
| `deck` | Deck Card | All combos, part images, stat bars |
| `single` | Single Combo | One combo, large image, full stat bars, spin/bit type |
| `compact` | Compact List | Combo names only, no images |
| `compact-image` | Compact with Image | Small image + name + condensed stat bars per combo |

**Deck-level styles** (`deck`, `compact`, `compact-image`) — show all combos in the deck.  
**Single-combo style** (`single`) — shows one combo.

---

## Embed Mode

### URL Format

When `?widget=` is present in the URL, the app renders in embed mode (no header, no controls, just the widget).

```
# Deck-level embed
?widget=deck&beynum=3&format=standard&beys=...&beys=...&beys=...

# Single combo embed
?widget=single&beys=Dran Sword,3-60F,...
```

### Detection

In `src/main.jsx`, before mounting, check `new URLSearchParams(location.search).get('widget')`. If present, render `<EmbedApp>` instead of `<App>`.

### EmbedApp

`src/EmbedApp.jsx` reads the `widget` param and the standard `beys`/`beynum`/`format` params, then renders the matching widget component. Background is `#080c18` (matches the app's dark theme).

---

## Widget Components

All widgets live in `src/components/widgets/`. They are **responsive HTML** components (not fixed-width like `ExportCard`). When used for PNG export, they are wrapped in a fixed-width container before capture: **480px** for deck-level widgets, **320px** for single-combo widgets (matching ExportCard's existing output dimensions).

- `DeckWidget.jsx` — deck-level, all combos with images and stat bars
- `SingleComboWidget.jsx` — single combo with large image, spin/bit type labels, full stat bars
- `CompactListWidget.jsx` — numbered combo names, BEYBLADEBREW.COM footer
- `CompactImageWidget.jsx` — small circular image + name + three condensed bars per combo

`ExportCard.jsx` is kept as-is (used for the existing download flow until widgets replace it — see Migration below).

---

## Share Modal

The Share button in `App.jsx` is replaced with a button that opens `<ShareModal>`.

### Tabs

**Share Link tab** — existing behavior: shows the shareable URL, Copy button copies it to clipboard.

**Embed tab:**
1. Four widget type cards (Deck Card, Single Combo, Compact List, Compact with Image) — user picks one.
2. For "Single Combo": a small dropdown to pick which combo (1–N).
3. A real live `<iframe>` preview (not a mockup) of the selected widget using the current deck's params.
4. A read-only code block with the full `<iframe>` snippet and a Copy button.

The generated iframe snippet:
```html
<iframe
  src="https://beybladebrew.netlify.app/?widget=deck&beynum=3&format=standard&beys=..."
  width="500" height="300" frameborder="0" style="border:none">
</iframe>
```

---

## Download Buttons

Both download buttons become **split buttons**: left side triggers the download immediately using the last-selected style, right side (chevron) opens a style dropdown.

The selected style is stored in component state (resets on page load — no localStorage needed).

### Download Deck (split button)

Styles offered: `deck`, `compact`, `compact-image` (deck-level only — "Single Combo" doesn't apply to a full deck download).

Default style: `deck`.

### Per-Combo Download (split button, each combo card)

Styles offered: `single`, `compact-image` (single-combo views — both show only that one combo's data).

Default style: `single`.

For PNG capture, the widget is rendered off-screen in a fixed-width wrapper (same `html-to-image` approach as `ExportCard`) and downloaded as a `.png`.

---

## New Files

| File | Purpose |
|------|---------|
| `src/EmbedApp.jsx` | Root component for embed mode |
| `src/components/ShareModal.jsx` | Share/Embed modal |
| `src/components/widgets/DeckWidget.jsx` | Deck Card widget |
| `src/components/widgets/SingleComboWidget.jsx` | Single Combo widget |
| `src/components/widgets/CompactListWidget.jsx` | Compact List widget |
| `src/components/widgets/CompactImageWidget.jsx` | Compact with Image widget |

## Modified Files

| File | Change |
|------|--------|
| `src/main.jsx` | Detect `?widget=` param, render `<EmbedApp>` |
| `src/App.jsx` | Share button → opens `<ShareModal>`; Download Deck → split button; per-combo download → split button |

---

## Migration

`ExportCard.jsx` is not deleted — it remains the fallback for the existing download path during development. Once all widget components are built and verified, `ExportCard` can be removed and replaced fully by the widget layer.
