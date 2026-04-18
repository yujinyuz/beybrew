# 4-Part CX Blade Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add support for 4-part CX blades (Rage/Blitz/Fortress) where the MetalBlade is the blade, plus a new Over Blade selector inside a grouped CX Assembly section.

**Architecture:** MetalBlade entries from `BeybladePartsMetalBlade.json` join the blade list with `fourPartCX: true`; corresponding MainBlade base bodies are auto-excluded via model_name cross-reference. A new `over_blades[]` array is emitted by `generate_parts.py` and wired through constants → state → URL → UI.

**Tech Stack:** Python 3 (data pipeline), React + Vite (app), react-select (dropdowns)

---

## File Map

| File | Change |
|------|--------|
| `scripts/generate_parts.py` | Load MetalBlade/OverBlade; exclude 4-part MainBlade entries; new `make_metal_blade_entry`, `make_over_blade_entry`; emit `over_blades[]` |
| `src/data/parts-overrides.json` | Add `metalBlades` and `overBlades` override categories |
| `src/data/beyparts.js` | Regenerated output — gains MetalBlade entries in `blades[]` and new `over_blades[]` |
| `src/constants.js` | Export `OVER_BLADES`; populate `BEYBLADE_DB` |
| `src/hooks/useBeybladeDeck.js` | Add `overBlade` to state shape and `getPartsUsed`; clear on blade change |
| `src/lib/shareUrl.js` | Extend `serializeBey` with 9th field `overBlade` |
| `src/lib/comboUtils.js` | Extend `parseSharedBeys`; update `getComboStats` and `getComboName` |
| `src/App.jsx` | CX Assembly group wrapper; Over Blade selector for 4-part CX |
| `src/Beyblade.jsx` | Add `overBlade` prop; include in stats and combo name |
| `src/PartSelector.jsx` | Show `4-PART` badge for `fourPartCX` blades |
| `src/randomize.js` | Pick `overBlade` for 4-part CX combos |

---

## Task 1: Update `generate_parts.py` — load new files, exclusion, new make functions

**Files:**
- Modify: `scripts/generate_parts.py`

- [ ] **Step 1: Add MetalBlade and OverBlade to `load_beydata`**

In `load_beydata`, extend the `categories` dict:

```python
def load_beydata(beydata_dir: Path) -> dict:
    categories = {
        "blades": "BeybladePartsBlade.json",
        "mainBlades": "BeybladePartsMainBlade.json",
        "assistBlades": "BeybladePartsAssistBlade.json",
        "ratchets": "BeybladePartsRatchet.json",
        "bits": "BeybladePartsBit.json",
        "lockChips": "BeybladePartsLockChip.json",
        "metalBlades": "BeybladePartsMetalBlade.json",
        "overBlades": "BeybladePartsOverBlade.json",
    }
    result = {}
    for key, filename in categories.items():
        path = beydata_dir / filename
        if path.exists():
            with open(path, encoding="utf-8") as f:
                result[key] = json.load(f)
        else:
            result[key] = []
    return result
```

- [ ] **Step 2: Add `_four_part_model_names` helper**

Add this function below the existing `_mislabeled_blade_ids` function:

```python
def _four_part_model_names(metal_blades: list) -> set:
    """Return model_names of 4-part CX assemblies from BeybladePartsMetalBlade.
    Used to exclude corresponding MainBlade base-body entries from the blade list."""
    return {e.get("model_name", "") for e in metal_blades}
```

- [ ] **Step 3: Add `make_metal_blade_entry`**

Add after `make_blade_entry`:

```python
def make_metal_blade_entry(beydata: dict, override: dict) -> dict:
    """Build a beyparts.js blade object for a 4-part CX MetalBlade.
    These appear in the blades array with fourPartCX: true and line: CX."""
    group_id = beydata["group_id"]
    image = override.get("image") or DEFAULT_BLADE_IMAGE
    stats = beydata["defaultStatus"]
    name = _base_name(group_id, override)

    entry = {
        "name": name,
        "points": override.get("points", 1),
        "attack": override.get("attack", stats.get("attack", 0)),
        "defense": override.get("defense", stats.get("defense", 0)),
        "stamina": override.get("stamina", stats.get("stamina", 0)),
        "type": override.get("type", beydata.get("type")),
        "image": image,
        "line": "CX",
        "fourPartCX": True,
    }
    raw_source = override.get("_source")
    if raw_source:
        entry["source"] = [raw_source] if isinstance(raw_source, str) else raw_source
    desc = override.get("_description")
    if desc:
        entry["description"] = desc
    return entry
```

- [ ] **Step 4: Add `make_over_blade_entry`**

Add after `make_metal_blade_entry`:

```python
def make_over_blade_entry(beydata: dict, override: dict) -> dict:
    """Build a beyparts.js over_blade object."""
    group_id = beydata["group_id"]
    stats = beydata["defaultStatus"]
    name = _base_name(group_id, override)
    alias = override.get("alias", beydata.get("en_name", group_id))

    entry = {
        "name": name,
        "alias": alias,
        "points": override.get("points", 0),
        "attack": override.get("attack", stats.get("attack", 0)),
        "defense": override.get("defense", stats.get("defense", 0)),
        "stamina": override.get("stamina", stats.get("stamina", 0)),
        "type": override.get("type", beydata.get("type")),
    }
    raw_source = override.get("_source")
    if raw_source:
        entry["source"] = [raw_source] if isinstance(raw_source, str) else raw_source
    desc = override.get("_description")
    if desc:
        entry["description"] = desc
    return entry
```

- [ ] **Step 5: Update `load_overrides` to include new categories**

```python
def load_overrides(path: Path) -> dict:
    empty = {
        "blades": {}, "mainBlades": {}, "assistBlades": {},
        "ratchets": {}, "bits": {}, "lockChips": {},
        "metalBlades": {}, "overBlades": {},
    }
    if not path.exists():
        return empty
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    for key in empty:
        data.setdefault(key, {})
    return data
```

- [ ] **Step 6: Update `serialize_to_js` to accept and emit `over_blades`**

```python
def serialize_to_js(blades: list, assist_blades: list, ratchets: list, bits: list, lock_chips: list, over_blades: list) -> str:
    """Produce the full beyparts.js file content."""
    def fmt_array(items):
        if not items:
            return "[]"
        lines = []
        for item in items:
            lines.append(f"    {_js_object(item, indent=4)},")
        return "[\n" + "\n".join(lines) + "\n  ]"

    ratchet_lines = [TURBO_RATCHET]
    for r in ratchets:
        ratchet_lines.append(f"    {_js_object(r, indent=4)},")
    ratchets_js = "[\n" + "\n".join(ratchet_lines) + "\n  ]"

    return f"""\
// AUTO-GENERATED by scripts/generate_parts.py — do not edit manually.
// To update: edit src/data/parts-overrides.json then run:
//   python scripts/generate_parts.py

const parts = {{
  blades: {fmt_array(blades)},
  assist_blades: {fmt_array(assist_blades)},
  ratchets: {ratchets_js},
  bits: {fmt_array(bits)},
  lock_chips: {fmt_array(lock_chips)},
  over_blades: {fmt_array(over_blades)},
}};

export default parts;
"""
```

- [ ] **Step 7: Update `prompt_new_entries` to include metalBlades and overBlades**

In `prompt_new_entries`, extend the `categories` list:

```python
categories = [
    ("blades",      [e for e in beydata["blades"] if e.get("group_id") not in exclude_blade_ids], False),
    ("mainBlades",  beydata["mainBlades"],    False),
    ("assistBlades",beydata["assistBlades"],  False),
    ("ratchets",    beydata["ratchets"],      False),
    ("bits",        beydata["bits"],          False),
    ("lockChips",   beydata["lockChips"],     True),
    ("metalBlades", beydata["metalBlades"],   False),
    ("overBlades",  beydata["overBlades"],    False),
]
```

- [ ] **Step 8: Update `enrich_overrides_with_descriptions` to include new categories**

```python
category_sources = {
    "blades": beydata["blades"] + beydata["mainBlades"],
    "mainBlades": beydata["mainBlades"],
    "assistBlades": beydata["assistBlades"],
    "ratchets": beydata["ratchets"],
    "bits": beydata["bits"],
    "metalBlades": beydata["metalBlades"],
    "overBlades": beydata["overBlades"],
}
```

- [ ] **Step 9: Update `main()` to wire everything together**

Replace the blade and lock_chip sections plus the final `serialize_to_js` call in `main()`:

```python
def main():
    beydata = load_beydata(BEYDATA_DIR)
    overrides = load_overrides(OVERRIDES_PATH)

    prompt_new_entries(beydata, OVERRIDES_PATH)
    enrich_overrides_with_descriptions(beydata, overrides, OVERRIDES_PATH)
    overrides = load_overrides(OVERRIDES_PATH)

    # --- blades (BeybladePartsBlade + BeybladePartsMainBlade, excluding 4-part CX base bodies) ---
    four_part_models = _four_part_model_names(beydata["metalBlades"])
    exclude_blade_ids = (
        _cx_assembly_ids(beydata["blades"])
        | _mislabeled_blade_ids(beydata["blades"])
    )
    all_blade_entries = [
        e for e in beydata["blades"] + beydata["mainBlades"]
        if e.get("group_id") not in exclude_blade_ids
        and e.get("model_name", "") not in four_part_models
    ]
    blade_overrides = {**overrides["blades"], **overrides["mainBlades"]}
    processed_blades = process_entries(all_blade_entries, blade_overrides)
    blades = []
    for entry in processed_blades:
        obj = make_blade_entry(entry, entry.get("_override", {}))
        if obj:
            blades.append(obj)

    # Synthetic blade entries
    for group_id, override in blade_overrides.items():
        if override.get("_synthetic"):
            synthetic_beydata = {
                "group_id": group_id,
                "en_name": group_id,
                "type": override.get("_type", "balance"),
                "show_mode_change_icon": False,
                "model_name": group_id,
                "defaultStatus": override.get("_stats", {"attack": 0, "defense": 0, "stamina": 0}),
                "_override": override,
                "_is_mode_change": False,
            }
            obj = make_blade_entry(synthetic_beydata, override)
            if obj:
                blades.append(obj)

    # MetalBlade entries — join blades array as 4-part CX blades
    metal_blade_overrides = overrides.get("metalBlades", {})
    processed_metal = process_entries(beydata["metalBlades"], metal_blade_overrides)
    for entry in processed_metal:
        obj = make_metal_blade_entry(entry, entry.get("_override", {}))
        if obj:
            blades.append(obj)

    # --- assist blades ---
    processed_assist = process_entries(beydata["assistBlades"], overrides["assistBlades"])
    assist_blades = []
    for entry in processed_assist:
        obj = make_assist_blade_entry(entry, entry.get("_override", {}))
        if obj:
            assist_blades.append(obj)

    # --- ratchets ---
    processed_ratchets = process_entries(beydata["ratchets"], overrides["ratchets"])
    ratchets = [make_ratchet_entry(e, e.get("_override", {})) for e in processed_ratchets]

    # --- bits ---
    processed_bits = process_entries(beydata["bits"], overrides["bits"])
    bits = [make_bit_entry(e, e.get("_override", {})) for e in processed_bits]

    # --- lock chips ---
    non_mc_lock_chips = []
    for e in beydata["lockChips"]:
        if "_ModeChange" in e.get("model_name", ""):
            continue
        if not e.get("group_id", "").strip() and e.get("en_name", "").strip():
            e = {**e, "group_id": e["en_name"]}
        non_mc_lock_chips.append(e)
    processed_lock_chips = process_entries(non_mc_lock_chips, overrides["lockChips"])
    lock_chips = [make_lock_chip_entry(e, e.get("_override", {})) for e in processed_lock_chips]

    for group_id, override in overrides["lockChips"].items():
        if override.get("_synthetic"):
            synthetic_beydata = {"group_id": group_id, "model_name": group_id}
            lock_chips.append(make_lock_chip_entry(synthetic_beydata, override))

    # --- over blades ---
    over_blade_overrides = overrides.get("overBlades", {})
    processed_over = process_entries(beydata["overBlades"], over_blade_overrides)
    over_blades = [make_over_blade_entry(e, e.get("_override", {})) for e in processed_over]

    js_content = serialize_to_js(blades, assist_blades, ratchets, bits, lock_chips, over_blades)
    OUTPUT_PATH.write_text(js_content, encoding="utf-8")
    print(f"Written: {OUTPUT_PATH}")
    print(f"  blades: {len(blades)}, assist_blades: {len(assist_blades)}, ratchets: {len(ratchets)}, bits: {len(bits)}, lock_chips: {len(lock_chips)}, over_blades: {len(over_blades)}")
```

- [ ] **Step 10: Verify the script runs without errors (don't regenerate yet — overrides not updated)**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer
python scripts/generate_parts.py --help 2>/dev/null; python -c "import scripts.generate_parts" 2>&1 || python scripts/generate_parts.py 2>&1 | head -5
```

Expected: no Python syntax errors. It may prompt for new entries or show warnings about missing overrides — that's fine at this stage.

- [ ] **Step 11: Commit**

```bash
git add scripts/generate_parts.py
git commit -m "feat: extend generate_parts.py for 4-part CX MetalBlade and OverBlade support"
```

---

## Task 2: Add overrides for MetalBlade and OverBlade entries

**Files:**
- Modify: `src/data/parts-overrides.json`
- Regenerate: `src/data/beyparts.js`

- [ ] **Step 1: Add `metalBlades` and `overBlades` to `parts-overrides.json`**

Open `src/data/parts-overrides.json`. Add two new top-level keys. Place them after `"lockChips"`:

```json
"metalBlades": {
    "RAGE": { "name": "Rage" },
    "BLITZ": { "name": "Blitz" },
    "FORTRESS": { "name": "Fortress" }
},
"overBlades": {
    "B": { "name": "B (Break)" },
    "G": { "name": "G (Guard)" },
    "F": { "name": "F (Flow)" }
}
```

Note: `alias` for OverBlade entries is not needed in overrides — it defaults to `en_name` ("B", "G", "F") which is correct.

- [ ] **Step 2: Regenerate `beyparts.js`**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer
python scripts/generate_parts.py
```

Expected output (numbers may vary):
```
Written: src/data/beyparts.js
  blades: N, assist_blades: N, ratchets: N, bits: N, lock_chips: N, over_blades: 3
```

Confirm `over_blades: 3` appears and there are no errors.

- [ ] **Step 3: Spot-check `beyparts.js`**

```bash
grep -A 8 "fourPartCX" src/data/beyparts.js | head -30
grep -A 5 "over_blades" src/data/beyparts.js | head -20
```

Expected: 3 blade entries with `fourPartCX: true, line: "CX"` (Rage, Blitz, Fortress). Expected: `over_blades` array with 3 entries (B/Break, G/Guard, F/Flow).

- [ ] **Step 4: Confirm FRAGE/BBLITZ/GFORTRESS are excluded**

```bash
grep -E "FRAGE|BBLITZ|GFORTRESS" src/data/beyparts.js
```

Expected: no output (these base-body entries are excluded).

- [ ] **Step 5: Commit**

```bash
git add src/data/parts-overrides.json src/data/beyparts.js
git commit -m "feat: add MetalBlade and OverBlade overrides; regenerate beyparts.js with 4-part CX blades"
```

---

## Task 3: Export `OVER_BLADES` from `constants.js`

**Files:**
- Modify: `src/constants.js`

- [ ] **Step 1: Add OVER_BLADES export**

In `src/constants.js`, add after the `LOCK_CHIPS` export:

```js
export const OVER_BLADES = BeyParts.over_blades.map((item) => {
  const itemName = item.name;
  BEYBLADE_DB[itemName] = { ...item };
  return itemName;
});
```

- [ ] **Step 2: Verify the app builds without errors**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer
npm run build 2>&1 | tail -10
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/constants.js
git commit -m "feat: export OVER_BLADES from constants"
```

---

## Task 4: Add `overBlade` to combo state

**Files:**
- Modify: `src/hooks/useBeybladeDeck.js`

- [ ] **Step 1: Update `getPartsUsed` to track `overBlade`**

```js
function getPartsUsed(beys) {
  const parts = new Set();
  beys.forEach((bey) => {
    parts.add(bey.blade);
    parts.add(bey.ratchet);
    parts.add(bey.bit);
    if (bey.assistBlade) parts.add(bey.assistBlade);
    if (bey.lockChip) parts.add(bey.lockChip);
    if (bey.overBlade) parts.add(bey.overBlade);
  });
  return parts;
}
```

- [ ] **Step 2: Add `overBlade` to the empty combo template and clear it on blade change**

In `handlePartChange`, update the empty combo template and add clearing logic:

```js
const handlePartChange = (index, partType, value) => {
  const newBeyblades = [...beyblades];

  for (let i = 0; i < beybladeCount; i++) {
    if (!newBeyblades[i]) {
      newBeyblades[i] = {
        blade: '', bladeMode: 0,
        assistBlade: '', assistBladeMode: 0,
        lockChip: '', overBlade: '',
        ratchet: '', bit: '', bitMode: 0,
      };
    }
  }

  newBeyblades[index][partType] = value;

  const modeResets = { blade: 'bladeMode', assistBlade: 'assistBladeMode', bit: 'bitMode' };
  if (modeResets[partType] !== undefined) {
    newBeyblades[index][modeResets[partType]] = 0;
  }

  // Clear overBlade when switching to a blade that is not 4-part CX
  if (partType === 'blade' && !BEYBLADE_DB[value]?.fourPartCX) {
    newBeyblades[index].overBlade = '';
  }

  if (partType === 'ratchet') {
    if (value.includes('Turbo (Ratchet Integrated Bit)')) {
      newBeyblades[index].bit = 'Turbo';
    } else if (newBeyblades[index].bit === 'Turbo') {
      newBeyblades[index].bit = '';
    }
  }

  if (partType === 'bit') {
    if (value === 'Turbo') {
      newBeyblades[index].ratchet = 'Turbo (Ratchet Integrated Bit)';
    } else if (newBeyblades[index].ratchet === 'Turbo (Ratchet Integrated Bit)') {
      newBeyblades[index].ratchet = '';
    }
  }

  setBeyblades(newBeyblades);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBeybladeDeck.js
git commit -m "feat: add overBlade to combo state and getPartsUsed"
```

---

## Task 5: Extend URL serialization

**Files:**
- Modify: `src/lib/shareUrl.js`
- Modify: `src/lib/comboUtils.js`

- [ ] **Step 1: Update `serializeBey` in `shareUrl.js`**

```js
function serializeBey(bey) {
  return `${bey.blade},${bey.ratchet},${bey.bit},${bey.assistBlade || ''},${bey.lockChip || ''},${bey.bladeMode || 0},${bey.assistBladeMode || 0},${bey.bitMode || 0},${bey.overBlade || ''}`;
}
```

- [ ] **Step 2: Update `parseSharedBeys` in `comboUtils.js`**

```js
export function parseSharedBeys(rawBeys) {
  return rawBeys.map((bey) => {
    const [
      blade, ratchet, bit,
      assistBlade = '', lockChip = '',
      bladeMode = '0', assistBladeMode = '0', bitMode = '0',
      overBlade = '',
    ] = bey.split(',');
    return {
      blade, ratchet, bit, assistBlade, lockChip, overBlade,
      bladeMode: Number(bladeMode),
      assistBladeMode: Number(assistBladeMode),
      bitMode: Number(bitMode),
    };
  });
}
```

- [ ] **Step 3: Update `getComboStats` in `comboUtils.js`**

```js
export function getComboStats(combo) {
  const { blade, assistBlade, overBlade, ratchet, bit, bladeMode = 0, assistBladeMode = 0, bitMode = 0 } = combo || {};
  const bladeStats     = getStats(blade, bladeMode);
  const assistStats    = getStats(assistBlade, assistBladeMode);
  const overBladeStats = getStats(overBlade);
  const ratchetStats   = getStats(ratchet);
  const bitStats       = getStats(bit, bitMode);
  return {
    attack:          (bladeStats.attack || 0) + (assistStats.attack || 0) + (overBladeStats.attack || 0) + (ratchetStats.attack || 0) + (bitStats.attack || 0),
    defense:         (bladeStats.defense || 0) + (assistStats.defense || 0) + (overBladeStats.defense || 0) + (ratchetStats.defense || 0) + (bitStats.defense || 0),
    stamina:         (bladeStats.stamina || 0) + (assistStats.stamina || 0) + (overBladeStats.stamina || 0) + (ratchetStats.stamina || 0) + (bitStats.stamina || 0),
    xDash:           bitStats.xDash || 0,
    burstResistance: bitStats.burstResistance || 0,
  };
}
```

- [ ] **Step 4: Update `getComboName` in `comboUtils.js`**

```js
export function getComboName(combo) {
  const { blade, assistBlade, overBlade, ratchet, bit, lockChip } = combo || {};
  const isCXLine  = BEYBLADE_DB[blade]?.line === 'CX';
  const isFourPart = BEYBLADE_DB[blade]?.fourPartCX;
  return [
    isCXLine && lockChip ? lockChip : null,
    blade,
    isCXLine && isFourPart ? (BEYBLADE_DB[overBlade]?.alias || null) : null,
    isCXLine ? BEYBLADE_DB[assistBlade]?.alias : null,
    BEYBLADE_DB[ratchet]?.altname,
    BEYBLADE_DB[bit]?.alias,
  ].filter(Boolean).join(' ');
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/shareUrl.js src/lib/comboUtils.js
git commit -m "feat: extend URL serialization and combo utilities with overBlade"
```

---

## Task 6: Update `App.jsx` — CX Assembly group and Over Blade selector

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add `OVER_BLADES` to the import from `./constants`**

Find the existing import block and add `OVER_BLADES`:

```js
import {
  BLADES,
  ASSIST_BLADES,
  RATCHETS,
  BITS,
  LOCK_CHIPS,
  OVER_BLADES,
  LIMITED_FORMAT,
  STANDARD_FORMAT,
  DEFAULT_LIMITED_MAX_POINTS,
  BEYBLADE_DB,
  DEFAULT_FORMAT,
  CURRENT_PATCH,
} from './constants';
```

- [ ] **Step 2: Replace the two inline CX selectors with a grouped CX Assembly section**

Find and replace this block (lines ~488–530 in App.jsx — the LockChip and AssistBlade selectors with their CX guards):

```jsx
{BEYBLADE_DB[beyblades[index]?.blade]?.line === 'CX' && (
  <PartSelector
    label="Lock Chip"
    options={LOCK_CHIPS}
    value={beyblades[index]?.lockChip}
    onChange={(value) => handlePartChange(index, 'lockChip', value)}
    partsUsed={partsUsed}
    currentFormat={currentFormat}
  />
)}
{BEYBLADE_DB[beyblades[index]?.blade]?.line === 'CX' && (
  <PartSelector
    label="Assist Blade"
    options={ASSIST_BLADES}
    value={beyblades[index]?.assistBlade}
    onChange={(value) => handlePartChange(index, 'assistBlade', value)}
    partsUsed={partsUsed}
    currentFormat={currentFormat}
  />
)}
{BEYBLADE_DB[beyblades[index]?.assistBlade]?.modes && (
  <ModeToggle
    modes={BEYBLADE_DB[beyblades[index].assistBlade].modes}
    value={beyblades[index]?.assistBladeMode ?? 0}
    onChange={(i) => handlePartChange(index, 'assistBladeMode', i)}
  />
)}
```

Replace with:

```jsx
{BEYBLADE_DB[beyblades[index]?.blade]?.line === 'CX' && (
  <div
    style={{
      border: '1px solid rgba(0,212,255,0.25)',
      borderRadius: '8px',
      padding: '10px 10px 2px',
      marginBottom: '8px',
      background: 'rgba(0,212,255,0.05)',
    }}
  >
    <div
      style={{
        fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.15em',
        color: 'var(--color-accent)', marginBottom: '8px', fontWeight: 700,
      }}
    >
      — CX Assembly —
    </div>
    <PartSelector
      label="Lock Chip"
      options={LOCK_CHIPS}
      value={beyblades[index]?.lockChip}
      onChange={(value) => handlePartChange(index, 'lockChip', value)}
      partsUsed={partsUsed}
      currentFormat={currentFormat}
    />
    {BEYBLADE_DB[beyblades[index]?.blade]?.fourPartCX && (
      <PartSelector
        label="Over Blade"
        options={OVER_BLADES}
        value={beyblades[index]?.overBlade}
        onChange={(value) => handlePartChange(index, 'overBlade', value)}
        partsUsed={partsUsed}
        currentFormat={currentFormat}
      />
    )}
    <PartSelector
      label="Assist Blade"
      options={ASSIST_BLADES}
      value={beyblades[index]?.assistBlade}
      onChange={(value) => handlePartChange(index, 'assistBlade', value)}
      partsUsed={partsUsed}
      currentFormat={currentFormat}
    />
    {BEYBLADE_DB[beyblades[index]?.assistBlade]?.modes && (
      <ModeToggle
        modes={BEYBLADE_DB[beyblades[index].assistBlade].modes}
        value={beyblades[index]?.assistBladeMode ?? 0}
        onChange={(i) => handlePartChange(index, 'assistBladeMode', i)}
      />
    )}
  </div>
)}
```

- [ ] **Step 3: Pass `overBlade` to the `Beyblade` component**

Find the `<Beyblade` render call and add the `overBlade` prop:

```jsx
<Beyblade
  blade={beyblades[index]?.blade}
  assistBlade={beyblades[index]?.assistBlade}
  lockChip={beyblades[index]?.lockChip}
  overBlade={beyblades[index]?.overBlade}
  ratchet={beyblades[index]?.ratchet}
  bit={beyblades[index]?.bit}
  format={currentFormat}
  bladeMode={beyblades[index]?.bladeMode ?? 0}
  assistBladeMode={beyblades[index]?.assistBladeMode ?? 0}
  bitMode={beyblades[index]?.bitMode ?? 0}
/>
```

- [ ] **Step 4: Start dev server and verify CX Assembly group appears**

```bash
npm run dev
```

Open http://localhost:5173, select a 3-part CX blade (e.g. DranBrave). Confirm:
- "— CX Assembly —" group appears with Lock Chip + Assist Blade inside it
- No Over Blade selector for 3-part CX blades

Then select Rage/Blitz/Fortress in the blade dropdown. Confirm:
- Over Blade selector appears inside the CX Assembly group between Lock Chip and Assist Blade

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: group CX parts in CX Assembly section; add Over Blade selector for 4-part CX"
```

---

## Task 7: Update `Beyblade.jsx` — overBlade stats and combo name

**Files:**
- Modify: `src/Beyblade.jsx`

- [ ] **Step 1: Add `overBlade` prop and its stats**

In `Beyblade.jsx`, update the function signature and stats calculation:

```jsx
function Beyblade({ blade, assistBlade, lockChip, overBlade, ratchet, bit, format, bladeMode = 0, assistBladeMode = 0, bitMode = 0 }) {
  const bladeStats     = getStats(blade, bladeMode);
  const assistStats    = getStats(assistBlade, assistBladeMode);
  const overBladeStats = getStats(overBlade);
  const ratchetStats   = getStats(ratchet);
  const bitStats       = getStats(bit, bitMode);

  const comboPoints =
    (BEYBLADE_DB[blade]?.points || 0) +
    (BEYBLADE_DB[ratchet]?.points || 0) +
    (BEYBLADE_DB[bit]?.points || 0);

  const attackTotal =
    (bladeStats.attack || 0) + (assistStats.attack || 0) +
    (overBladeStats.attack || 0) + (ratchetStats.attack || 0) + (bitStats.attack || 0);

  const defenseTotal =
    (bladeStats.defense || 0) + (assistStats.defense || 0) +
    (overBladeStats.defense || 0) + (ratchetStats.defense || 0) + (bitStats.defense || 0);

  const staminaTotal =
    (bladeStats.stamina || 0) + (assistStats.stamina || 0) +
    (overBladeStats.stamina || 0) + (ratchetStats.stamina || 0) + (bitStats.stamina || 0);

  const xDashTotal = bitStats.xDash || 0;
  const burstResistanceTotal = bitStats.burstResistance || 0;

  const isCXLine   = BEYBLADE_DB[blade]?.line === 'CX';
  const isFourPart = BEYBLADE_DB[blade]?.fourPartCX;
  const comboName = [
    isCXLine && lockChip ? lockChip : null,
    blade || '—',
    isCXLine && isFourPart ? (BEYBLADE_DB[overBlade]?.alias || null) : null,
    isCXLine ? (BEYBLADE_DB[assistBlade]?.alias || '') : '',
    BEYBLADE_DB[ratchet]?.altname || '',
    BEYBLADE_DB[bit]?.alias || '—',
  ]
    .filter(Boolean)
    .join(' ');
```

- [ ] **Step 2: Add `overBlade` to PropTypes**

```jsx
Beyblade.propTypes = {
  blade: PropTypes.string,
  assistBlade: PropTypes.string,
  lockChip: PropTypes.string,
  overBlade: PropTypes.string,
  ratchet: PropTypes.string,
  bit: PropTypes.string,
  format: PropTypes.string,
  bladeMode: PropTypes.number,
  assistBladeMode: PropTypes.number,
  bitMode: PropTypes.number,
};
```

- [ ] **Step 3: Verify in browser**

With the dev server running, select Rage as blade and pick Lock Chip, Over Blade, and Assist Blade. Confirm:
- The COMBO name shows e.g. `RAGNA Rage F E 4-55 Yellow`
- Attack/Defense/Stamina bars reflect the OverBlade stats being added

- [ ] **Step 4: Commit**

```bash
git add src/Beyblade.jsx
git commit -m "feat: include overBlade stats and alias in combo display"
```

---

## Task 8: Add `4-PART` badge in `PartSelector.jsx`

**Files:**
- Modify: `src/PartSelector.jsx`

- [ ] **Step 1: Add a `4-PART` badge in `formatOptionLabel`**

In `PartSelector.jsx`, inside the `formatOptionLabel` callback, add the badge after the line badge:

```jsx
formatOptionLabel={(option) => {
  if (!option.value) return <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', opacity: 0.6 }}>{option.label}</span>;
  const db = BEYBLADE_DB[option.value];
  const lineBadge = showLineBadge ? LINE_BADGE[db?.line || 'BX'] : null;
  return (
    <span className="flex flex-row items-center gap-1.5">
      {lineBadge && <Badge label={lineBadge.label} color={lineBadge.color} />}
      {showLineBadge && db?.fourPartCX && <Badge label="4-PART" color="#7c3aed" />}
      {db?.type && <img className="h-5 w-5 object-contain flex-shrink-0" src={`/images/${db.type}.png`} alt="" />}
      {db?.image && (
        <span className="flex-shrink-0 rounded overflow-hidden" style={{ background: '#fff', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <img className="h-6 w-6 object-contain" src={`/images/${db.image}`} alt="" />
        </span>
      )}
      <span style={{ fontSize: '13px' }}>{option.label}</span>
    </span>
  );
}}
```

- [ ] **Step 2: Verify in browser**

In the blade dropdown, confirm Rage/Blitz/Fortress show a purple `4-PART` badge alongside the red `CX` badge. Other blades should be unaffected.

- [ ] **Step 3: Commit**

```bash
git add src/PartSelector.jsx
git commit -m "feat: show 4-PART badge for fourPartCX blades in selector"
```

---

## Task 9: Update `randomize.js` — pick `overBlade` for 4-part CX

**Files:**
- Modify: `src/randomize.js`

- [ ] **Step 1: Import `OVER_BLADES`**

```js
import { BLADES, ASSIST_BLADES, RATCHETS, BITS, LOCK_CHIPS, OVER_BLADES, BEYBLADE_DB, LIMITED_FORMAT } from './constants'
```

- [ ] **Step 2: Update `calcPoints` to include `overBlade`**

```js
function calcPoints(combos) {
  const seen = new Set()
  let total = 0
  combos.forEach(({ blade, assistBlade, overBlade, ratchet, bit }) => {
    for (const part of [blade, assistBlade, overBlade, ratchet, bit]) {
      if (part && !seen.has(part)) {
        seen.add(part)
        total += BEYBLADE_DB[part]?.points || 0
      }
    }
  })
  return total
}
```

- [ ] **Step 3: Update `buildCombos` to pick `overBlade`**

```js
function buildCombos(count, usedParts = new Set(), usedExclusiveLockChips = new Set()) {
  const turboPairUsed = usedParts.has('Turbo') || usedParts.has('Turbo (Ratchet Integrated Bit)')

  const availableBlades    = shuffle(BLADES.filter(b => !usedParts.has(b)))
  const availableRatchets  = shuffle(
    RATCHETS.filter(r => {
      if (r === 'Turbo (Ratchet Integrated Bit)') return !turboPairUsed
      return !usedParts.has(r)
    })
  )
  const availableBits       = shuffle(BITS.filter(b => b !== 'Turbo' && !usedParts.has(b)))
  const availableAssistBlades = shuffle(ASSIST_BLADES.filter(a => !usedParts.has(a)))
  const availableOverBlades   = shuffle(OVER_BLADES.filter(o => !usedParts.has(o)))

  const combos = []
  let bitIdx       = 0
  let assistIdx    = 0
  let overBladeIdx = 0

  for (let i = 0; i < count; i++) {
    const blade   = availableBlades[i] || ''
    const ratchet = availableRatchets[i] || ''
    let bit

    if (ratchet === 'Turbo (Ratchet Integrated Bit)') {
      bit = 'Turbo'
    } else {
      bit = availableBits[bitIdx++] || ''
    }

    const isCX       = BEYBLADE_DB[blade]?.line === 'CX'
    const isFourPart = BEYBLADE_DB[blade]?.fourPartCX
    const assistBlade = isCX ? (availableAssistBlades[assistIdx++] || '') : ''
    const lockChip    = isCX ? pickLockChip(usedExclusiveLockChips) : ''
    const overBlade   = isFourPart ? (availableOverBlades[overBladeIdx++] || '') : ''

    combos.push({ blade, assistBlade, lockChip, overBlade, ratchet, bit })
  }

  return combos
}
```

- [ ] **Step 4: Update `randomizeSingleBeyblade` to track `overBlade` in `usedParts`**

Replace the entire `randomizeSingleBeyblade` function:

```js
export function randomizeSingleBeyblade(index, currentBeyblades, format, maxPoints, maxAttempts = 20) {
  const usedParts = new Set()
  const usedExclusiveLockChips = new Set()
  currentBeyblades.forEach((bey, i) => {
    if (i === index) return
    if (bey.blade)       usedParts.add(bey.blade)
    if (bey.assistBlade) usedParts.add(bey.assistBlade)
    if (bey.overBlade)   usedParts.add(bey.overBlade)
    if (bey.ratchet)     usedParts.add(bey.ratchet)
    if (bey.bit)         usedParts.add(bey.bit)
    if (bey.lockChip && EXCLUSIVE_LOCK_CHIPS.has(bey.lockChip)) usedExclusiveLockChips.add(bey.lockChip)
  })

  if (format !== LIMITED_FORMAT) {
    return buildCombos(1, usedParts, usedExclusiveLockChips)[0]
  }

  const otherPoints = [...usedParts].reduce((sum, part) => sum + (BEYBLADE_DB[part]?.points || 0), 0)
  const budget = maxPoints - otherPoints

  let best = null
  let bestTotal = Infinity

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const combo = buildCombos(1, usedParts, usedExclusiveLockChips)[0]
    const comboPoints = calcPoints([combo])
    if (comboPoints <= budget) return combo
    if (comboPoints < bestTotal) {
      bestTotal = comboPoints
      best = combo
    }
  }

  return best
}
```

- [ ] **Step 5: Verify randomize in browser**

Click "Randomize All". If a 4-part CX blade (Rage/Blitz/Fortress) is picked, confirm it has an Over Blade assigned. Click several times to see variation.

- [ ] **Step 6: Commit**

```bash
git add src/randomize.js
git commit -m "feat: randomize Over Blade for 4-part CX combos"
```

---

## Task 10: Final end-to-end verification

- [ ] **Step 1: Full build check**

```bash
npm run build 2>&1 | tail -15
```

Expected: no errors.

- [ ] **Step 2: Lint check**

```bash
npm run lint 2>&1 | tail -20
```

Fix any reported issues before continuing.

- [ ] **Step 3: Manual browser smoke test**

```bash
npm run dev
```

Verify all of the following:

1. **3-part CX blade** (e.g. DranBrave): CX Assembly group shows Lock Chip + Assist Blade only. No Over Blade row.
2. **4-part CX blade** (Rage/Blitz/Fortress): CX Assembly group shows Lock Chip + Over Blade + Assist Blade. `4-PART` badge visible in blade dropdown.
3. **Combo name** with Rage + RAGNA lock chip + F over blade + E assist blade: shows `RAGNA Rage F E …`
4. **Stats**: Over Blade attack/defense/stamina reflected in totals (Rage overBlade adds atk=10, def=10, sta=20).
5. **Standard format**: selecting same Over Blade in two combos disables it in the second (no-repeat rule).
6. **Randomize All**: 4-part CX blades get Over Blade assigned.
7. **Share URL**: round-trip — share a combo with Rage + Over Blade, reload the URL, selections are restored.
8. **Non-CX blade**: no CX Assembly section shown at all.

- [ ] **Step 4: Final commit if any lint fixes were made**

```bash
git add -p  # stage only lint fix changes
git commit -m "fix: address lint warnings from 4-part CX implementation"
```
