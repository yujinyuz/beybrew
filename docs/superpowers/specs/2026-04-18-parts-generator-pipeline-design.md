# Parts Generator Pipeline

**Date:** 2026-04-18
**Status:** Approved

## Problem

Adding new Beyblade parts to `src/data/beyparts.js` is fully manual — every field (name, attack, defense, stamina, type, line, image, points) has to be typed by hand. The official app's `MasterData.json` already contains attack/defense/stamina/type/series for every part. Only two fields genuinely need manual input: `image` (downloaded from the website) and `points` (tournament cost, not in official data; defaults to 1).

## Solution

A two-file pipeline:

```
beydata/*.json  (official stats — auto-updated from MasterData.json via decoder.py)
      +
src/data/parts-overrides.json  (manual: image, points, name overrides, special flags)
      ↓
scripts/generate_parts.py
      ↓
src/data/beyparts.js  (GENERATED — do not edit by hand)
```

`src/data/beyparts.js` becomes a generated file. All manual edits move to `parts-overrides.json`.

## Data Mapping

### Auto-derived from `beydata`
| beyparts.js field | beydata source |
|---|---|
| `attack` / `defense` / `stamina` | `defaultStatus.attack/defense/stamina` |
| `type` | `type` |
| `alias` (bits/assist blades) | `en_name` |
| mode-change `altname` | detected via `show_mode_change_icon` + `_ModeChange` in `model_name`; generates `"Name (Mode Change)"` |

### Manual-only (in `parts-overrides.json`)
| field | notes |
|---|---|
| `image` | Required for blades/assist blades. Missing = entry skipped with a warning. |
| `points` | Optional. Defaults to 1. |
| `name` | Optional. If absent, script does best-effort word-split on `group_id`. |
| `hasbro` | Optional boolean flag. |
| `spinType` | Optional. `"left"` for left-spin blades. |
| stat overrides | Optional. Any of `attack/defense/stamina` can be locked in overrides to override beydata. |

### Variant deduplication
- Group entries by `group_id`
- Entries with identical `defaultStatus` stats (color variants, repacks): deduplicated — one entry kept
- Mode change entries (same `group_id`, different stats, `show_mode_change_icon: true`): kept as separate entries

## `parts-overrides.json` Schema

```json
{
  "blades": {
    "DRANBUSTER": {
      "name": "Dran Buster",
      "points": 3,
      "image": "Dran_Buster_1-60A.webp"
    },
    "COBALTDRAGOON": {
      "name": "Cobalt Dragoon",
      "points": 3,
      "image": "Cobalt_Dragoon_2-60C.webp",
      "spinType": "left"
    }
  },
  "mainBlades": {
    "MIGHT": { "name": "Might", "points": 1, "image": "MainBladeMight.webp" }
  },
  "assistBlades": {
    "SLASH": { "name": "Slash", "alias": "S", "image": "AssistBladeSlash.webp" }
  },
  "ratchets": {
    "5-60": { "points": 3 }
  },
  "bits": {
    "FB": { "name": "Free Ball", "points": 4 }
  }
}
```

## Scripts

### `scripts/migrate_overrides.py` (one-time)
Reads the current `src/data/beyparts.js` (by parsing the beydata JSONs and diffing against what's in the file) and writes the initial `src/data/parts-overrides.json`. This bootstraps the overrides file from existing manual data so nothing is lost.

Since beyparts.js is JS not JSON, the migration uses the `beydata/*.json` files as the source of truth for stats, and extracts the non-derivable fields (`name`, `image`, `points`, `alias`, `hasbro`, `spinType`) by cross-referencing `group_id`.

### `scripts/generate_parts.py`
1. Loads all five `beydata/*.json` files
2. Loads `src/data/parts-overrides.json`
3. For each part category (blades, mainBlades, assistBlades, ratchets, bits):
   - Groups entries by `group_id`
   - Deduplicates color/repack variants (identical stats)
   - Identifies mode-change variants (different stats + mode-change signal)
   - Merges override fields (override wins over auto-derived for any field present)
   - Defaults: `points = 1`
   - Warns to stderr for blades/assist blades missing an `image` in overrides (skips them)
4. Assembles final `parts` object matching the current `beyparts.js` export shape
5. Writes `src/data/beyparts.js`

## Stat Update Behavior

Stats are auto-overwritten from `beydata` on every run — if Takara updates stats in the app, they flow through automatically. To lock a stat, add it to `parts-overrides.json` explicitly; overrides always win.

## Workflow for a New Release

1. Get updated `MasterData.json` from the app → `python decoder.py`
2. Download the part image(s)
3. Add one entry to `src/data/parts-overrides.json`:
   ```json
   "NEWBLADE": { "image": "NewBlade_3-70X.webp" }
   ```
   Optionally add `"points": 2` if not 1.
4. `python scripts/generate_parts.py`

## Files Changed

| File | Action |
|---|---|
| `src/data/parts-overrides.json` | **New** — manual override data |
| `scripts/migrate_overrides.py` | **New** — one-time migration |
| `scripts/generate_parts.py` | **New** — generator |
| `src/data/beyparts.js` | **Modified** — becomes generated output |
| `scripts/README.md` | **New** — usage docs |
