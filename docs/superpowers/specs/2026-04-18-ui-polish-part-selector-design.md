# UI Polish: Part Selector Brand Grouping + Badges

**Date:** 2026-04-18
**Status:** Approved

## Summary

Add brand badges (HAS/TT), type badges (ATK/DEF/STA/BAL), and brand-based option grouping to the part selector dropdown. Only `PartSelector.jsx` changes — no data migration, no new files.

## Goals

- Make it immediately clear whether a part is from a Hasbro or Takara Tomy release
- Show the part's type (attack/defense/stamina/balance) inline in the dropdown
- Group options by brand so players can quickly find parts from a specific release line

## Out of Scope

- Changes to `beyparts.js` data (the existing `hasbro: true` flag is sufficient)
- Brand indicators on the combo summary cards or individual combo panels
- Tournament support features (separate spec)

## Design

### Option Grouping

Options are split into two react-select groups using the `hasbro` flag from `BEYBLADE_DB`:

```
[
  { value: '', label: '---' },           // top-level, outside groups
  {
    label: 'Hasbro',
    options: [ ...parts where hasbro === true ]
  },
  {
    label: 'Takara Tomy',
    options: [ ...parts where hasbro !== true ]
  }
]
```

The empty `---` option is passed as a top-level option (not inside any group) so it always appears first regardless of group order.

Sort order within each group follows existing behavior: Limited format sorts by points ascending; Standard format sorts alphabetically.

Disabled state (already-used parts) applies within groups as before.

### Badge Rendering

`formatOptionLabel` is updated to prepend two badges before the existing image + label content:

| Badge | Value | Color |
|-------|-------|-------|
| HAS   | `hasbro === true` | Red `#e63946` |
| TT    | `hasbro !== true` | Blue `#3b5bdb` |
| ATK   | `type === 'attack'` | Blue `#2196F3` |
| DEF   | `type === 'defense'` | Green `#4CAF50` |
| STA   | `type === 'stamina'` | Orange `#FF9800` |
| BAL   | `type === 'balance'` | Purple `#9C27B0` |

Type badge is omitted if the part has no `type` field (e.g. ratchets, which are typed by count/height rather than role).

### Group Header Styling

- Hasbro group header: red tint background `#fff5f5`, red label text
- Takara Tomy group header: blue tint background `#f0f4ff`, blue label text
- Styled via react-select's `groupHeadingStyles` / `styles` prop or a `formatGroupLabel` render function

## Files Changed

- `src/PartSelector.jsx` — all changes are here:
  1. Replace flat `formattedOptions` array with grouped structure
  2. Update `formatOptionLabel` to prepend HAS/TT + type badges
  3. Add `formatGroupLabel` or `styles.groupHeading` for colored group headers

## Behavior Unchanged

- Disabled options (parts already used in another slot) still render as disabled within their group
- Limited format points label still appended to option label text
- Search/filter still works across all groups (react-select handles this natively)
- The `---` empty/clear option still appears at the top
