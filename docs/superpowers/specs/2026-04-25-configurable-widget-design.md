# Configurable Widget Design

**Date:** 2026-04-25
**Status:** Approved

## Overview

Replace the 7 separate widget components with 2 configurable components (`ConfigurableDeckWidget` and `ConfigurableComboWidget`) driven by a shared config object. Both image generation and embed iframes use the same components, eliminating structural duplication and giving users real control over what their exported images and embeds look like.

## Config Shape

```js
{
  aspectRatio: 'card' | 'story',   // 'card' = auto-height, 'story' = fixed 9:16 (540×960)
  showProfile: boolean,            // deck profile section (archetype, flavor, stat rings)
  showStatBars: boolean,           // stat bars on each combo row
  showPartThumbnails: boolean,     // ratchet/bit/assist strip below blade image
}
```

Defaults: `{ aspectRatio: 'card', showProfile: true, showStatBars: true, showPartThumbnails: true }`

`showProfile` is only meaningful on `ConfigurableDeckWidget` — ignored on combo widget.

## Components

### `ConfigurableDeckWidget`

Replaces: `DeckWidget`, `StoryDeckWidget`, `CompactListWidget`, `CompactImageWidget`, `AllCombosWidget`

Props: `combos`, `beybladeCount`, `format`, `bladerName`, `config`

**Container:**
- `card`: `width: 480px`, auto height
- `story`: `width: 540px`, `height: 960px`, flex column with rows stretching to fill

**Each combo row always renders:** blade image, combo name, type badges.

**Conditional per config:**
- `showPartThumbnails`: ratchet/bit/assist strip
- `showStatBars`: stat bars

**Blade image size:** auto-scales based on combo count and which sections are visible. Fewer visible sections = more vertical space per row = larger image.

**Profile section:** renders at the bottom of the deck if `showProfile` is true.

**Watermark:** always rendered (not configurable).

### `ConfigurableComboWidget`

Replaces: `SingleComboWidget`, `StoryComboWidget`

Props: `combo`, `config`

**Card mode:** horizontal layout — blade image left, name/badges/stats right.

**Story mode:** vertical hero layout — large centered blade image, concentric ring decoration, name below, stats below that.

`showStatBars` and `showPartThumbnails` apply in both modes.

**Watermark:** always rendered.

## Image Generation

The pre-generation UI (currently a dropdown menu) becomes a small config panel that opens before rendering:

```
[ Card  |  Story 9:16 ]

☑ Deck Profile
☑ Stat Bars
☑ Part Thumbnails

[ Generate Image ]
```

Combo download omits the Deck Profile toggle.

Config persists to `localStorage` key `bbx-widget-config` (single shared config for both deck and combo generation).

`handleDownloadDeck` and `handleDownloadCombo` in `App.jsx` simplify to: read config → render the appropriate configurable widget → capture PNG. The nested ternary chain selecting between 7 widgets is removed.

## Embed (ShareModal + EmbedApp)

### ShareModal embed tab

Replace the 4 preset widget-type buttons with:
- Scope toggle: **Deck** | **Single Combo**
- Aspect ratio toggle: **Card** | **Story 9:16**
- 3 checkboxes: Deck Profile / Stat Bars / Part Thumbnails
- Combo picker (visible when scope = Single Combo)
- Live preview + embed code snippet (unchanged)

Config encodes into embed URL as query params:
```
?scope=deck&ar=story&profile=1&stats=1&thumbs=1
?scope=combo&ar=card&combo=0&stats=1&thumbs=1
```

### EmbedApp

Reads `scope`, `ar`, `profile`, `stats`, `thumbs`, `combo` params and maps them to the config object. Renders `ConfigurableDeckWidget` or `ConfigurableComboWidget` accordingly.

No backwards compatibility with old widget param values (`widget=compact`, `widget=single`, etc.) — old embed URLs render with defaults.

## Files Deleted

- `src/components/widgets/DeckWidget.jsx`
- `src/components/widgets/StoryDeckWidget.jsx`
- `src/components/widgets/StoryComboWidget.jsx`
- `src/components/widgets/SingleComboWidget.jsx`
- `src/components/widgets/CompactListWidget.jsx`
- `src/components/widgets/CompactImageWidget.jsx`
- `src/components/widgets/AllCombosWidget.jsx`

## Files Added

- `src/components/widgets/ConfigurableDeckWidget.jsx`
- `src/components/widgets/ConfigurableComboWidget.jsx`

## Files Modified

- `src/App.jsx` — remove old style state/menus, add config panel UI, simplify download handlers
- `src/EmbedApp.jsx` — read new URL params, render configurable widgets
- `src/components/ShareModal.jsx` — replace widget preset picker with config controls
