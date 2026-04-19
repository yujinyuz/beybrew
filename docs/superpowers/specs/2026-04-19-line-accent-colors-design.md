# Line-Based Accent Colors — Design Spec

**Date:** 2026-04-19

## Goal

Apply per-line accent colors (BX/UX/CX) throughout the lineup and export views, replacing the current hardcoded cyan and cycling index-based accents.

## Color Map

`LINE_BADGE` already exists in `PartSelector.jsx` with the correct line branding colors:

| Line | Color | Hex |
|------|-------|-----|
| BX | Blue | `#42a5f5` |
| UX | Orange | `#e65c00` |
| CX | Red | `#c62828` |

Default fallback: BX (`#42a5f5`) for any combo with no blade selected.

## Changes

### 1. Move `LINE_BADGE` to `constants.js`

Remove from `PartSelector.jsx`, export from `constants.js`. Add a `getLineColor(blade)` helper:

```js
export function getLineColor(blade) {
  const line = BEYBLADE_DB[blade]?.line;
  return LINE_BADGE[line]?.color ?? LINE_BADGE.BX.color;
}
```

`PartSelector.jsx` imports `LINE_BADGE` from `constants.js` (no behavior change).

### 2. `ComboSummaryList` — lineup accent

Each `<li>` card gains a colored left border and matching border color derived from the combo's blade line:

```
border: `1px solid ${lineColor}33`
borderLeft: `3px solid ${lineColor}`
```

Matches the existing `ComboRow` treatment in `ExportCard`.

### 3. `ExportCard` — export accent

**Single combo view** (`comboIndex != null`): replace hardcoded `accent = '#00d4ff'` with `getLineColor(blade)`.

**Deck view**: replace `ACCENT_COLORS[i % ACCENT_COLORS.length]` with `getLineColor(beyblades[i]?.blade)` for each `ComboRow`. Remove the `ACCENT_COLORS` constant.

## Out of Scope

- No changes to stat bar colors (those are semantic: attack/defense/stamina).
- No changes to the deck-level header gradient in ExportCard.
- No light-mode variants — line colors stay the same in both themes.
