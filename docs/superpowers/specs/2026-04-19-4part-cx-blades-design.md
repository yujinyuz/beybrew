# 4-Part CX Blade Support

**Date:** 2026-04-19
**Status:** Approved

## Background

The CX product line introduced a new 4-part blade assembly for certain sets (CX-13 BahamutBlitz, CX-14 KnightFortress, CX-15 RagnaRage, CX-16 BahamutBlitz, BXC-19 BahamutBlitz). These differ from standard 3-part CX blades:

- **3-part CX**: MainBlade + AssistBlade + LockChip
- **4-part CX**: MetalBlade + OverBlade + AssistBlade + LockChip

The product name encodes the two identity parts: "RagnaRage" = LockChip (Ragna) + MetalBlade (Rage). The MetalBlade is what players call "the blade."

## Part Taxonomy

| Part | Data Source | Examples |
|------|-------------|---------|
| MetalBlade (= blade for 4-part CX) | `BeybladePartsMetalBlade.json` | RAGE, BLITZ, FORTRESS |
| OverBlade | `BeybladePartsOverBlade.json` | B (Break), G (Guard), F (Flow) |
| AssistBlade | `BeybladePartsAssistBlade.json` | E (Erase), K (Knuckle), etc. |
| LockChip | `BeybladePartsLockChip.json` | RAGNA, BAHAMUT, KNIGHT |

OverBlade and AssistBlade are freely interchangeable across any 4-part CX combo. Both follow the Standard format no-repeat rule.

## Compatibility Detection

A blade is a 4-part CX blade if and only if its `model_name` appears in `BeybladePartsMetalBlade.json`. This is computed automatically in `generate_parts.py` — no manual flags in `parts-overrides.json`.

The corresponding MainBlade base-body entries (FRAGE, BBLITZ, GFORTRESS) are excluded from the blade selector using the same cross-reference: if a MainBlade entry's `model_name` appears in the MetalBlade file, it is excluded.

## Data Pipeline (`generate_parts.py`)

1. Load `BeybladePartsOverBlade.json` and `BeybladePartsMetalBlade.json`.
2. Build `four_part_model_names`: set of all model_names in MetalBlade data.
3. When building the blades list, exclude MainBlade entries whose `model_name ∈ four_part_model_names`.
4. Process MetalBlade entries through a new `make_metal_blade_entry()` function; each entry gets `fourPartCX: true` and `line: "CX"` baked in.
5. Process OverBlade entries through a new `make_over_blade_entry()` function; emit as a new `over_blades[]` array in `beyparts.js`.
6. `prompt_new_entries()` and `enrich_overrides_with_descriptions()` are extended to cover `metalBlades` and `overBlades` override categories.

`beyparts.js` gains:
- MetalBlade entries in `blades[]` (alongside existing blades)
- New `over_blades[]` array

## `parts-overrides.json`

Add two new top-level categories: `metalBlades` and `overBlades`.

MetalBlade overrides (name + image per entry):
- `RAGE` → name: "Rage"
- `BLITZ` → name: "Blitz"
- `FORTRESS` → name: "Fortress"

OverBlade overrides (alias is the letter code, full name in parentheses):
- `B` → name: "B (Break)"
- `G` → name: "G (Guard)"
- `F` → name: "F (Flow)"

## `constants.js`

Export `OVER_BLADES` from `BeyParts.over_blades`. Add entries to `BEYBLADE_DB`.

## State (`useBeybladeDeck.js`)

Add `overBlade` field to combo state object. Default: `''`.

`getPartsUsed` tracks `overBlade` (Standard format no-repeat).

Initial state shape:
```js
{ blade, bladeMode, assistBlade, assistBladeMode, lockChip, overBlade, ratchet, bit, bitMode }
```

## URL Serialization

Extend with one trailing field. Old 8-field URLs remain valid (field 9 defaults to `''`).

```
blade,ratchet,bit,assistBlade,lockChip,bladeMode,assistBladeMode,bitMode,overBlade
```

Both `serializeBey()` in `shareUrl.js` and `parseSharedBeys()` in `comboUtils.js` are updated.

## UI (`App.jsx`)

All CX blades show a grouped **CX Assembly** section. The Over Blade selector is shown only when `BEYBLADE_DB[blade]?.fourPartCX` is true.

**3-part CX Assembly order:** Lock Chip → Assist Blade

**4-part CX Assembly order:** Lock Chip → Over Blade → Assist Blade

The blade selector shows a `4-PART` badge for `fourPartCX` blades (alongside the existing `CX` line badge).

## Stats + Combo Name (`Beyblade.jsx`, `comboUtils.js`)

OverBlade stats (attack/defense/stamina) are included in combo totals.

Combo name format:
- 3-part CX: `{lockChip} {blade} {assistBlade.alias} {ratchet.altname} {bit.alias}`
- 4-part CX: `{lockChip} {blade} {overBlade.alias} {assistBlade.alias} {ratchet.altname} {bit.alias}`

The OverBlade alias is its letter code (B, G, F). The AssistBlade alias is its letter code (E, K, etc.).

## Randomizer (`randomize.js`)

When a 4-part CX blade is chosen, pick `overBlade` from available (unused) `OVER_BLADES`. Tracked in `usedParts` for Standard format.

## Out of Scope

- OverBlade mode-change variants (none exist in current data)
- Export widget updates (widgets display existing combo state; OverBlade will appear in combo name automatically)
- Points for OverBlade in Limited format (OverBlade has no `points` field in the source data; treat as 0)
