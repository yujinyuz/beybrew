# Parts Page: Image + Zoom + Included-in-Sets

**Date:** 2026-04-20  
**Scope:** `scripts/generate-parts-page.js` only — no changes to React app or beyparts.js

## Problem

`parts.html` shows stats and descriptions but omits two things already present in the app: part images and "included in sets" sourcing info. Users browsing the reference page can't see what a part looks like or where to get it.

## Design

### Image (floated right)

Each part card gets a 72×72 image block floated to the right of the title + stats. Rules:

- Only rendered when `part.image` is defined (parts without an image show no image block)
- Mode-based parts (those with a `modes` array) use `modes[0].image` as the fallback image
- White background (`#fff`) with rounded corners and a faint accent border
- On hover: slight scale-up (`transform: scale(1.05)`) + glow shadow; a `zoom` hint label appears in the bottom-right corner
- Clicking the image calls `openLb(imgFile, name)` to open the lightbox

### Lightbox (zoom)

A single `<div id="lb">` modal injected once into the `<body>`. Behavior:

- Click any part image → modal opens, showing the image at 240×240, part name below
- Click the backdrop or press `Esc` → modal closes
- Pure inline JS (`openLb` / `closeLb` functions), no external dependencies

### Included in Sets

Replicates the existing `SourcePopover` pattern from the React app:

- A small pill button labelled "X sets" (using the SVG list icon) appears below the description when `part.source` is non-empty
- Clicking the pill toggles a positioned `<div>` popover showing the full set list, one entry per line
- Click-outside closes the popover (document `mousedown` listener scoped to the open popover)
- Each popover `id` is derived from the part's slug to avoid conflicts on the page

### CSS additions (inline in `<style>`)

New rules: `.part-img-wrap`, `.part-img`, `#lb` (lightbox overlay + inner), `.src-btn`, `.src-pop`.

No changes to existing rules — additions only.

## What does NOT change

- `src/data/beyparts.js` — read-only data source
- Any React components (`PartSelector.jsx`, `Beyblade.jsx`, etc.)
- The overall page layout, header, nav, stats bars, or footer
- Parts data itself — images and source arrays already exist in beyparts.js

## Files changed

| File | Change |
|------|--------|
| `scripts/generate-parts-page.js` | Add image rendering, lightbox JS/CSS, sets popover JS/CSS |
| `public/parts.html` | Regenerated output (not hand-edited) |
