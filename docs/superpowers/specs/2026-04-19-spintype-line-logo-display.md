# Spin Type + Line Logo Display

**Date:** 2026-04-19

## Goal

Show each combo's spin type (Right/Left Spin) and Beyblade X series line (BX/UX/CX) in the deck lineup view and all image-export widgets. Use the official line logo images (PNG) rather than text-only badges.

## Data

Three line logo images exist at `public/images/`:
- `Basic Line Logo.png` → BX line
- `Custom Line Logo.png` → CX line
- `Unique Line Logo.png` → UX line

Spin type comes from `BEYBLADE_DB[blade].spinType` (`"right"` or `"left"`).

### constants.js change

Add a `LINE_LOGO` export mapping each line key to its image filename:

```js
export const LINE_LOGO = {
  BX: 'Basic Line Logo.png',
  UX: 'Unique Line Logo.png',
  CX: 'Custom Line Logo.png',
};
```

A helper `getLineLogo(blade)` returns the image path for a given blade name (falls back to BX logo).

## Approach: Sub-label row under combo name (Approach C)

A single tight row placed directly below the combo name in every widget. It contains:

```
[line logo img 16-20px tall]  RIGHT SPIN   (or LEFT SPIN)
```

- The line logo is displayed as a small `<img>` with `height` capped to context size
- Spin text is uppercase, muted/accent colored, small font
- Row only renders when `blade` is set

### Size guidance per widget

| Widget | Logo height | Font size |
|---|---|---|
| `ComboSummaryList` | 16px | 7px |
| `DeckPreview` | 14px | 7px |
| `DeckWidget` ComboRow | 14px | 6.5px |
| `StoryDeckWidget` ComboSection | 12px | 7px |
| `CompactImageWidget` CompactComboRow | 10px | 6px |
| `CompactListWidget` | 12px | 7px |
| `SingleComboWidget` | replace text line → img + text | 6.5px |
| `StoryComboWidget` | replace spin pill → img + text tag | 10px |

For `StoryComboWidget`, the existing spin pill `{spinType.toUpperCase()} SPIN` is replaced by the logo image + text. The bit type pill stays.

For `SingleComboWidget`, the existing text line `RIGHT SPIN · ATTACK` is replaced by line logo + spin text, with bit type inline.

## Files to change

1. `src/constants.js` — add `LINE_LOGO`, `getLineLogo(blade)`
2. `src/components/ComboSummaryList.jsx`
3. `src/components/DeckPreview.jsx`
4. `src/components/widgets/DeckWidget.jsx`
5. `src/components/widgets/StoryDeckWidget.jsx`
6. `src/components/widgets/CompactImageWidget.jsx`
7. `src/components/widgets/CompactListWidget.jsx`
8. `src/components/widgets/SingleComboWidget.jsx`
9. `src/components/widgets/StoryComboWidget.jsx`

## Success criteria

- Every filled combo row/card shows the line logo + spin direction text
- Empty slots (no blade selected) show nothing in this row
- Line logo matches the blade's actual line (BX/UX/CX)
- No layout overflow or truncation introduced
