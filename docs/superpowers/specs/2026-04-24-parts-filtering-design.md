# Parts Filtering Design

**Date**: 2026-04-24
**Status**: Approved

## Problem

The part dropdown lists (blades, ratchets, bits) are large and hard to navigate. Users want to narrow them down before picking — e.g., show only attack-type blades, or only UX-line parts.

## Scope

Per-combo-card filter chips that pre-filter each part dropdown. Does not replace the existing react-select text search; complements it.

## What Gets Filtered

| Slot | Filter dimensions |
|------|-------------------|
| Blade | type (attack / defense / stamina / balance) + line (BX / UX / CX) + spin (right / left) |
| Ratchet | type only |
| Bit | type only |

Ratchets and bits have `type` in the data but not `line` or `spinType`, so only type filtering applies to them.

## Architecture

The part selectors currently render inline inside `App.jsx`'s `.map()` loop. Implementing per-combo filter state requires extracting that block into its own component.

### New component: `ComboCard.jsx`

Extract the combo card JSX from `App.jsx` into `src/components/ComboCard.jsx`. This component owns:
- Local filter state (3 `useState` calls — one per filterable slot)
- The `applyFilters` helper
- The `FilterChips` UI component
- All existing part selector, mode toggle, and stats display JSX

`App.jsx` replaces the inline map content with `<ComboCard ... />`, passing down deck state and handlers as props.

### State

Filter state lives locally in `ComboCard.jsx`:

```js
const [bladeFilters,   setBladeFilters]   = useState({ type: null, line: null, spin: null });
const [ratchetFilters, setRatchetFilters] = useState({ type: null });
const [bitFilters,     setBitFilters]     = useState({ type: null });
```

`null` = no filter active (show all). Each `ComboCard` instance has independent filter state.

### Filtering Logic

A `applyFilters(names, { type, line, spin })` helper defined inside `ComboCard.jsx`:

- Takes an array of part name strings and a filter spec
- Looks up each name in `BEYBLADE_DB`
- Returns the subset matching all non-null filter values
- **Graceful fallback**: if the filtered result is empty, returns the full unfiltered list (no empty dropdown)

The filtered array is passed as `options` to the relevant `PartSelector`. No changes to `PartSelector.jsx`.

### Currently Selected Value

Applying a filter never clears the current selected value. If the selected part doesn't match the active filter it remains shown as the current value — the filter only affects what appears in the dropdown list.

## Filter Chip UI

Compact pill buttons rendered between the slot label and dropdown for each filterable slot.

### Visual Style

- **Inactive**: ghost style — border only, muted text
- **Active**: filled background + white text
- Clicking an active chip deselects it (toggles back to "all")
- No "All" chip needed — deselecting the active chip restores all

### Type Chips (blade, ratchet, bit)

Small colored pills:

| Type | Color |
|------|-------|
| Attack | red (`#f44336`) |
| Defense | blue (`#42a5f5`) |
| Stamina | green (`#4caf50`) |
| Balance | purple (`#9c27b0`) |

### Line Chips (blade only)

| Line | Color |
|------|-------|
| BX | `#42a5f5` |
| UX | `#e65c00` |
| CX | `#c62828` |

Colors match `LINE_BADGE` in `constants.js`.

### Spin Chips (blade only)

Two chips: **R** and **L**, each with a small rotation arrow icon (SVG). Filter value is `"right"` or `"left"` to match `BEYBLADE_DB[name].spinType`.

### Layout

Each filter group is a `flex flex-row flex-wrap gap-1` row. All filter rows for a slot stack vertically, separated by a small gap, above that slot's `PartSelector`.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ComboCard.jsx` | New file — extracted combo card + filter state, `applyFilters`, `FilterChips` |
| `src/App.jsx` | Replace inline combo card map content with `<ComboCard>` |
| `src/Beyblade.jsx`, `src/PartSelector.jsx`, `src/constants.js`, hooks | Unchanged |

## Out of Scope

- Persisting filters in URL or localStorage
- Global filters shared across combo cards
- Stat-range sliders (attack > X)
- Filtering for assist blade / lock chip slots
