# Part Descriptions Design

## Overview

Surface the `_description` fields already stored in `parts-overrides.json` by emitting them into `beyparts.js` and displaying them as subtle muted text below the part selector when a part is selected.

## Generator Changes (`scripts/generate_parts.py`)

Each `make_*_entry()` function (`make_blade_entry`, `make_assist_blade_entry`, `make_ratchet_entry`, `make_bit_entry`, `make_lock_chip_entry`) checks `override.get("_description")`. If present and non-empty, the description is included as a `description` field in the returned dict.

Because `serialize_to_js` / `_js_object` already serializes all keys in the dict, no changes to serialization are needed.

Since `constants.js` spreads all fields from `beyparts.js` into `BEYBLADE_DB`, the description is automatically accessible via `BEYBLADE_DB[name].description` everywhere in the UI.

## UI Changes (`src/PartSelector.jsx`)

Below the `<Select>` component, conditionally render a description line:

- Condition: `value` is non-empty AND `BEYBLADE_DB[value]?.description` exists
- Style: small (11–12px) muted text, slight top margin, no border or background — plain subtle text
- No new dependencies required

Parts without a description (e.g. most ratchets) render nothing below the selector.

## Scope

- No changes to dropdown option rendering
- No tooltip library needed
- No changes to `constants.js` or other files
- `enrich_overrides_with_descriptions` already populates `_description` in `parts-overrides.json` on each generator run — no changes needed there
