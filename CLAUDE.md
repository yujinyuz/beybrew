# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**BeyBrew** — a client-side Beyblade X deck builder. Users select blade/ratchet/bit combos, view aggregated stats, share decks via URL, and export combos as PNG.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build to /dist
npm run preview    # Preview production build
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix ESLint violations
npm run deploy     # Build + deploy to GitHub Pages
```

No test framework is configured.

## Architecture

### State (App.jsx)

All state lives in `App.jsx`:
- `beyblades` — array of `{ blade, assistBlade, ratchet, bit }` objects
- `beybladeCount` — deck size (1–10)
- `currentFormat` — `"standard"` | `"limited"`
- `partsUsed` — Set of part names used across the deck (Standard format: no repeats)
- `totalPoints` — sum of all combo points (Limited format)

URL query params (`beys`, `format`, `beynum`) hydrate state on mount and are updated on share.

### Data

`src/data/beyparts.js` is the sole data source — 1700+ lines defining all parts (blades, assist blades, ratchets, bits) with stats: `attack`, `defense`, `stamina`, `xDash`, `burstResistance`, `points`, `type`, `image`, `spinType`, `line`.

`src/constants.js` exports `BEYBLADE_DB` (aggregates all part categories) and format/patch constants.

### Key Behaviors

- **CX line**: blades with `line: "CX"` unlock an extra "Assist Blade" slot in `Beyblade.jsx`
- **Turbo special case**: selecting the "Turbo (Ratchet Integrated Bit)" syncs ratchet/bit fields automatically
- **Limited format**: parts are sorted by points; already-used parts are disabled; total points displayed
- **Download**: `html-to-image` converts a combo `div` to PNG — marked experimental, has iOS issues
- **Sharing**: copies URL with encoded query params to clipboard

### Component Map

| File | Role |
|------|------|
| `src/App.jsx` | Layout, state, handlers, URL sync |
| `src/Beyblade.jsx` | Single combo card — stat bars, part display, download |
| `src/PartSelector.jsx` | Reusable `react-select` dropdown for any part type |
| `src/data/beyparts.js` | Parts database |
| `src/constants.js` | DB aggregation, format labels, patch version |

### Adding Parts

Add entries to the appropriate array in `src/data/beyparts.js` and place the part image in `public/images/`. Follow existing object shape for the part type.


### Releasing
- bump version
