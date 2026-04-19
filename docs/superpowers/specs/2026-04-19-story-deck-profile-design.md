# 9:16 Story Deck Download — Deck Profile & Gap Fix

**Date:** 2026-04-19

## Problem

The 9:16 (Story) deck export (`StoryDeckWidget`) has large gaps when a deck has few combos (1–3), because combo rows used `flex: 1` within a fixed 960px canvas with no other content to share the space.

## Solution

1. Keep combo rows flexible (`flex: 1` each, filling the combos wrapper)
2. Add a compact **Deck Profile strip** at the bottom with `flex-shrink: 0` (natural height, never grows)

This eliminates the gap at all deck sizes: small decks have spacious combo rows, large decks are compact, and the profile is always present as a thin strip.

## Layout Structure (StoryDeckWidget)

```
┌─────────────────────────┐
│ Header (flex-shrink:0)  │  BEYBREW + format label
├─────────────────────────┤
│                         │
│  Combos (flex:1)        │  combo rows each flex:1, share space evenly
│                         │
├─────────────────────────┤
│ Deck Profile (shrink:0) │  archetype + stat circles + blader name
├─────────────────────────┤
│ Watermark (shrink:0)    │
└─────────────────────────┘
```

## Deck Profile Strip Contents

- Archetype emoji + name + flavor text (left side)
- Vertical divider
- 5 stat circles (ATK, DEF, STA, X-D, BST) with percentage fill (right side)
- Blader name row below (only shown if `bladerName` is non-empty)

## Files Changed

### `src/components/widgets/StoryDeckWidget.jsx`

- Add `profile` and `bladerName` props
- Add `DeckProfileStrip` component (self-contained in file)
- Combos wrapper: keep `flex: 1`, combo rows: keep `flex: 1`
- Add `DeckProfileStrip` below combos with `flexShrink: 0`
- If `profile` is null (no filled combos), skip rendering the strip

### `src/App.jsx`

- In `handleDownloadDeck`, pass `profile={getDeckProfile(beyblades)}` and `bladerName={bladerName}` to `StoryDeckWidget`

## Props

```js
StoryDeckWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
  profile: PropTypes.object,    // from getDeckProfile() — null if no combos filled
  bladerName: PropTypes.string, // optional, omit blader row if empty
};
```

## Out of Scope

- `StoryComboWidget` (single combo 9:16) — already handles space well with hero image
- Other export styles (compact, deck-profile card, etc.)
