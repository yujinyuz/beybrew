# Part Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace duplicate mode-change part entries with a `modes` array on the part object, and add a UI toggle so players can switch between modes on the combo card.

**Architecture:** Data flows from `parts-overrides.json` → `generate_parts.py` → `beyparts.js`. The generator is extended to emit a `modes` array instead of duplicate flat entries. In the React app, a `getStats(partName, modeIndex)` helper resolves active-mode stats, mode indices live in beyblade state, and a new `ModeToggle` component appears below mode-capable PartSelectors.

**Tech Stack:** Python 3.12, pytest (via `uv run pytest`), React, Vite (`npm run dev`), `react-select`

---

## File Map

| Action | File |
|--------|------|
| Modify | `scripts/generate_parts.py` — serializer + process_entries + make_blade_entry + make_assist_blade_entry |
| Modify | `scripts/tests/test_generate_parts.py` — new tests for modes behavior |
| Modify | `src/data/parts-overrides.json` — add `modes` arrays to 4 parts |
| Regenerate | `src/data/beyparts.js` — run `just generate` |
| Modify | `src/constants.js` — add `getStats` export |
| Modify | `src/hooks/useBeybladeDeck.js` — mode state fields, reset, URL encode/decode |
| Create | `src/ModeToggle.jsx` — new pill-toggle component |
| Modify | `src/App.jsx` — render ModeToggle after mode-capable selectors, pass mode props to Beyblade |
| Modify | `src/Beyblade.jsx` — accept mode props, use getStats |
| Modify | `src/components/ExportCard.jsx` — use getStats in getComboStats |
| Modify | `src/PartSelector.jsx` — remove (Mode Change) workaround |

---

## Task 1: Extend Python serializer for nested types

The `_js_val` function in `generate_parts.py` currently only handles flat scalars. The `modes` array is a list of dicts, so it needs to handle those too.

**Baseline:** Two pre-existing failures are expected and out of scope (`test_blade_entry_missing_image_returns_none`, `test_assist_blade_missing_image_returns_none`). 12 tests pass.

**Files:**
- Modify: `scripts/tests/test_generate_parts.py`
- Modify: `scripts/generate_parts.py`

- [ ] **Step 1: Verify baseline**

```bash
uv run pytest scripts/tests/test_generate_parts.py -v
```

Expected: 12 passed, 2 failed (the two `missing_image_returns_none` tests). If different, stop and investigate before continuing.

- [ ] **Step 2: Add failing tests for `_js_val`**

Add these tests to `scripts/tests/test_generate_parts.py`. Add `_js_val` to the import line at the top:

```python
from generate_parts import (
    process_entries, make_blade_entry, make_ratchet_entry,
    make_bit_entry, make_assist_blade_entry, _js_val,
)
```

Add after the existing `make_assist_blade_entry` tests:

```python
# --- _js_val ---

def test_js_val_serializes_list_of_dicts():
    modes = [{"label": "Upper", "attack": 30}, {"label": "Lower", "attack": 20}]
    result = _js_val(modes)
    assert '"label": "Upper"' in result
    assert '"attack": 30' in result
    assert '"label": "Lower"' in result
    assert '"attack": 20' in result


def test_js_val_serializes_nested_dict():
    result = _js_val({"label": "Upper", "attack": 30})
    assert '"label": "Upper"' in result
    assert '"attack": 30' in result


def test_js_val_existing_scalars_unchanged():
    assert _js_val(None) == "null"
    assert _js_val(True) == "true"
    assert _js_val(False) == "false"
    assert _js_val("hello") == '"hello"'
    assert _js_val(42) == "42"
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
uv run pytest scripts/tests/test_generate_parts.py::test_js_val_serializes_list_of_dicts scripts/tests/test_generate_parts.py::test_js_val_serializes_nested_dict scripts/tests/test_generate_parts.py::test_js_val_existing_scalars_unchanged -v
```

Expected: 3 tests FAIL with `ImportError` (can't import `_js_val`) or `TypeError`.

- [ ] **Step 4: Extend `_js_val` in `generate_parts.py`**

In `scripts/generate_parts.py`, replace the `_js_val` function (lines 241–251) with:

```python
def _js_val(v) -> str:
    """Serialize a Python value to a JS literal. Lists and dicts use JSON encoding."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return json.dumps(v)
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (list, dict)):
        return json.dumps(v)
    raise TypeError(f"Cannot serialize {type(v)}: {v!r}")
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
uv run pytest scripts/tests/test_generate_parts.py -v
```

Expected: 15 passed, 2 failed (same pre-existing failures). The 3 new tests must pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate_parts.py scripts/tests/test_generate_parts.py
git commit -m "feat(scripts): extend _js_val to serialize lists and dicts"
```

---

## Task 2: Update `process_entries` to skip mode-change entries when override has `modes`

When a part's override specifies `modes`, the `_ModeChange` beydata entries are redundant — their stats are captured in the override. `process_entries` should skip them.

**Files:**
- Modify: `scripts/tests/test_generate_parts.py`
- Modify: `scripts/generate_parts.py`

- [ ] **Step 1: Add failing test**

Add after the existing `test_mode_change_entry_gets_altname` test in `scripts/tests/test_generate_parts.py`:

```python
def test_process_entries_skips_mode_change_when_override_has_modes():
    """When override has a modes array, _ModeChange beydata entries are not emitted."""
    entries = [
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
         "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30}},
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z_ModeChange",
         "defaultStatus": {"attack": 55, "defense": 25, "stamina": 30}},
    ]
    overrides = {
        "SCORPIOSPEAR": {
            "name": "Scorpio Spear", "image": "ScorpioSpear.webp", "points": 2,
            "modes": [
                {"label": "Defense", "attack": 25, "defense": 55, "stamina": 30},
                {"label": "Attack", "attack": 55, "defense": 25, "stamina": 30},
            ],
        }
    }
    result = process_entries(entries, overrides)
    assert len(result) == 1
    assert not result[0].get("_is_mode_change")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest scripts/tests/test_generate_parts.py::test_process_entries_skips_mode_change_when_override_has_modes -v
```

Expected: FAIL — result has length 2.

- [ ] **Step 3: Update `process_entries` in `generate_parts.py`**

In `scripts/generate_parts.py`, replace the `process_entries` function (lines 62–114) with:

```python
def process_entries(entries: list, overrides: dict) -> list:
    """
    Group by group_id, deduplicate color variants (identical stats),
    keep mode-change variants as separate entries unless the override
    already defines a modes array (in which case mode-change beydata
    entries are skipped — their stats live in the override).
    Returns list of dicts with beydata entry + resolved override merged in.
    """
    groups = defaultdict(list)
    for e in entries:
        if e.get("group_id", "").strip():
            groups[e["group_id"]].append(e)

    result = []
    for group_id, group in groups.items():
        override = overrides.get(group_id, {})

        # Separate mode-change from base entries
        base = [e for e in group if not _is_mode_change(e)]
        mode_changes = [e for e in group if _is_mode_change(e)]

        # Deduplicate base entries by stats — keep first occurrence
        seen_stats = set()
        deduped_base = []
        for e in base:
            key = _stats_key(e)
            if key not in seen_stats:
                seen_stats.add(key)
                deduped_base.append(e)

        # If override defines modes, skip all _ModeChange beydata entries.
        # Mode stats are fully specified in override["modes"].
        if override.get("modes"):
            if deduped_base:
                entry = dict(deduped_base[0])
                entry["_override"] = override
                entry["_is_mode_change"] = False
                result.append(entry)
            continue

        # Deduplicate mode-change entries by stats; skip if same stats as base
        base_stats = {_stats_key(e) for e in deduped_base}
        seen_mc_stats = set()
        deduped_mc = []
        for e in mode_changes:
            key = _stats_key(e)
            if key not in seen_mc_stats and key not in base_stats:
                seen_mc_stats.add(key)
                deduped_mc.append(e)

        # First base entry is the primary entry
        if deduped_base:
            entry = dict(deduped_base[0])
            entry["_override"] = override
            entry["_is_mode_change"] = False
            result.append(entry)

        # Mode-change entries
        for mc in deduped_mc:
            entry = dict(mc)
            entry["_override"] = override
            entry["_is_mode_change"] = True
            result.append(entry)

    return result
```

- [ ] **Step 4: Run all tests**

```bash
uv run pytest scripts/tests/test_generate_parts.py -v
```

Expected: 16 passed, 2 failed (same pre-existing failures).

- [ ] **Step 5: Commit**

```bash
git add scripts/generate_parts.py scripts/tests/test_generate_parts.py
git commit -m "feat(scripts): skip mode-change beydata entries when override has modes array"
```

---

## Task 3: Update `make_blade_entry` and `make_assist_blade_entry` for modes

When override has `modes`, the entry should include the `modes` array and omit top-level `attack/defense/stamina`. No `altname` is added.

**Files:**
- Modify: `scripts/tests/test_generate_parts.py`
- Modify: `scripts/generate_parts.py`

- [ ] **Step 1: Add failing tests**

Add to `scripts/tests/test_generate_parts.py`:

```python
# --- make_blade_entry with modes ---

def test_blade_entry_with_modes_includes_modes_array():
    beydata = {
        "group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
        "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
        "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30},
        "_is_mode_change": False,
    }
    override = {
        "name": "Scorpio Spear", "image": "ScorpioSpear.webp", "points": 2,
        "modes": [
            {"label": "Defense", "attack": 25, "defense": 55, "stamina": 30},
            {"label": "Attack", "attack": 55, "defense": 25, "stamina": 30},
        ],
    }
    entry = make_blade_entry(beydata, override)
    assert "modes" in entry
    assert len(entry["modes"]) == 2
    assert entry["modes"][0]["label"] == "Defense"
    assert entry["modes"][1]["label"] == "Attack"


def test_blade_entry_with_modes_omits_top_level_stats():
    beydata = {
        "group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
        "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
        "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30},
        "_is_mode_change": False,
    }
    override = {
        "name": "Scorpio Spear", "image": "ScorpioSpear.webp", "points": 2,
        "modes": [
            {"label": "Defense", "attack": 25, "defense": 55, "stamina": 30},
            {"label": "Attack", "attack": 55, "defense": 25, "stamina": 30},
        ],
    }
    entry = make_blade_entry(beydata, override)
    assert "attack" not in entry
    assert "defense" not in entry
    assert "stamina" not in entry
    assert "altname" not in entry


# --- make_assist_blade_entry with modes ---

def test_assist_blade_entry_with_modes():
    beydata = {
        "group_id": "D", "en_name": "D", "type": "balance",
        "model_name": "AssistBladeDual_UpperMode",
        "defaultStatus": {"attack": 17, "defense": 13, "stamina": 10},
        "_is_mode_change": False,
    }
    override = {
        "name": "Dual", "image": "AssistBladeDual_(Upper_Mode).png", "alias": "D",
        "modes": [
            {"label": "Upper", "attack": 17, "defense": 13, "stamina": 10},
            {"label": "Lower", "attack": 13, "defense": 17, "stamina": 10},
        ],
    }
    entry = make_assist_blade_entry(beydata, override)
    assert "modes" in entry
    assert len(entry["modes"]) == 2
    assert "attack" not in entry
    assert "defense" not in entry
    assert "stamina" not in entry
    assert "altname" not in entry
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
uv run pytest scripts/tests/test_generate_parts.py::test_blade_entry_with_modes_includes_modes_array scripts/tests/test_generate_parts.py::test_blade_entry_with_modes_omits_top_level_stats scripts/tests/test_generate_parts.py::test_assist_blade_entry_with_modes -v
```

Expected: 3 tests FAIL.

- [ ] **Step 3: Update `make_blade_entry` in `generate_parts.py`**

Replace the `make_blade_entry` function (lines 127–157):

```python
def make_blade_entry(beydata: dict, override: dict) -> dict | None:
    """Build a beyparts.js blade object. Falls back to DEFAULT_BLADE_IMAGE if no image in override."""
    group_id = beydata["group_id"]
    image = override.get("image") or DEFAULT_BLADE_IMAGE

    stats = beydata["defaultStatus"]
    name = _base_name(group_id, override)
    is_mode_change = beydata.get("_is_mode_change", False)
    modes = override.get("modes")

    if modes:
        entry = {
            "name": name,
            "points": override.get("points", 1),
            "type": override.get("type", beydata.get("type")),
            "image": image,
            "modes": modes,
        }
    else:
        entry = {
            "name": name,
            "points": override.get("points", 1),
            "attack": override.get("attack", stats.get("attack", 0)),
            "defense": override.get("defense", stats.get("defense", 0)),
            "stamina": override.get("stamina", stats.get("stamina", 0)),
            "type": override.get("type", beydata.get("type")),
            "image": image,
        }
        if is_mode_change:
            entry["altname"] = f"{name} (Mode Change)"

    line = override.get("line") or beydata.get("series_name")
    if line:
        entry["line"] = line
    if override.get("hasbro"):
        entry["hasbro"] = True
    if override.get("spinType"):
        entry["spinType"] = override["spinType"]

    return entry
```

- [ ] **Step 4: Update `make_assist_blade_entry` in `generate_parts.py`**

Replace the `make_assist_blade_entry` function (lines 193–217):

```python
def make_assist_blade_entry(beydata: dict, override: dict) -> dict | None:
    """Build a beyparts.js assist blade object. Falls back to DEFAULT_BLADE_IMAGE if no image in override."""
    group_id = beydata["group_id"]
    image = override.get("image") or DEFAULT_BLADE_IMAGE

    stats = beydata["defaultStatus"]
    name = _base_name(group_id, override)
    alias = override.get("alias", beydata.get("en_name", group_id))
    is_mode_change = beydata.get("_is_mode_change", False)
    modes = override.get("modes")

    if modes:
        entry = {
            "name": name,
            "alias": alias,
            "type": override.get("type", beydata.get("type")),
            "points": override.get("points", 0),
            "image": image,
            "modes": modes,
        }
    else:
        entry = {
            "name": name,
            "alias": alias,
            "type": override.get("type", beydata.get("type")),
            "points": override.get("points", 0),
            "attack": override.get("attack", stats.get("attack", 0)),
            "defense": override.get("defense", stats.get("defense", 0)),
            "stamina": override.get("stamina", stats.get("stamina", 0)),
            "image": image,
        }
        if is_mode_change:
            entry["altname"] = f"{name} (Mode Change)"

    return entry
```

- [ ] **Step 5: Run all tests**

```bash
uv run pytest scripts/tests/test_generate_parts.py -v
```

Expected: 19 passed, 2 failed (same pre-existing failures).

- [ ] **Step 6: Commit**

```bash
git add scripts/generate_parts.py scripts/tests/test_generate_parts.py
git commit -m "feat(scripts): emit modes array in blade/assist-blade entries when override defines modes"
```

---

## Task 4: Add modes to `parts-overrides.json` and regenerate `beyparts.js`

**Files:**
- Modify: `src/data/parts-overrides.json`
- Regenerate: `src/data/beyparts.js`

- [ ] **Step 1: Update `SCORPIOSPEAR` in `src/data/parts-overrides.json`**

Find the `"SCORPIOSPEAR"` entry (around line 78) and replace it with:

```json
"SCORPIOSPEAR": {
  "name": "Scorpio Spear",
  "image": "BladeScorpioSpear.png",
  "points": 2,
  "modes": [
    { "label": "Defense", "attack": 25, "defense": 55, "stamina": 30 },
    { "label": "Attack", "attack": 55, "defense": 25, "stamina": 30 }
  ]
},
```

- [ ] **Step 2: Update `ECLIPSE` in `src/data/parts-overrides.json`**

Find the `"ECLIPSE"` entry in the `"mainBlades"` section (around line 388) and replace it:

```json
"ECLIPSE": {
  "name": "Eclipse",
  "image": "MainBladeEclipse_(Upper_Mode).png",
  "points": 1,
  "modes": [
    { "label": "Upper", "attack": 30, "defense": 20, "stamina": 10 },
    { "label": "Lower", "attack": 20, "defense": 30, "stamina": 10 }
  ]
},
```

- [ ] **Step 3: Update `T` (Turn) in `src/data/parts-overrides.json`**

Find the `"T"` entry in the `"assistBlades"` section (around line 462) and replace it:

```json
"T": {
  "name": "Turn",
  "image": "AssistBladeTurn.png",
  "points": 0,
  "alias": "T",
  "modes": [
    { "label": "Mode 1", "attack": 15, "defense": 10, "stamina": 15 },
    { "label": "Mode 2", "attack": 10, "defense": 10, "stamina": 20 }
  ]
},
```

> Note: "Mode 1" / "Mode 2" are placeholder labels. Research the actual game terminology for Turn's mode names and update before shipping.

- [ ] **Step 4: Update `D` (Dual) in `src/data/parts-overrides.json`**

Find the `"D"` entry in the `"assistBlades"` section (around line 498) and replace it:

```json
"D": {
  "name": "Dual",
  "image": "AssistBladeDual_(Upper_Mode).png",
  "alias": "D",
  "modes": [
    { "label": "Upper", "attack": 17, "defense": 13, "stamina": 10 },
    { "label": "Lower", "attack": 13, "defense": 17, "stamina": 10 }
  ]
},
```

- [ ] **Step 5: Regenerate `beyparts.js`**

```bash
just generate
```

Expected output:
```
Written: src/data/beyparts.js
  blades: ..., assist_blades: ..., ratchets: ..., bits: ..., lock_chips: ...
```

- [ ] **Step 6: Verify generated output**

Check that `src/data/beyparts.js` has no more duplicate entries for these parts:

```bash
grep -c '"Scorpio Spear"' src/data/beyparts.js
grep -c '"Eclipse"' src/data/beyparts.js
grep -c '"Turn"' src/data/beyparts.js
grep -c '"Dual"' src/data/beyparts.js
```

Expected: each returns `1` (was `2` before).

Also verify the `modes` array appears in the output:

```bash
grep -A 5 '"modes"' src/data/beyparts.js | head -20
```

Expected: lines like `"modes": [{"label": "Upper", ...}]`.

- [ ] **Step 7: Commit**

```bash
git add src/data/parts-overrides.json src/data/beyparts.js
git commit -m "feat(data): replace duplicate mode-change entries with modes arrays for Eclipse, Scorpio Spear, Turn, Dual"
```

---

## Task 5: Add `getStats` helper to `constants.js`

**Files:**
- Modify: `src/constants.js`

- [ ] **Step 1: Add `getStats` export to `src/constants.js`**

Append after the existing exports (after line 39):

```js
export function getStats(partName, modeIndex = 0) {
  const part = BEYBLADE_DB[partName];
  if (!part) return {};
  if (part.modes) return { ...part, ...part.modes[modeIndex] };
  return part;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/constants.js
git commit -m "feat: add getStats helper for mode-aware stat resolution"
```

---

## Task 6: Update `useBeybladeDeck.js` for mode state, reset, and URL

**Files:**
- Modify: `src/hooks/useBeybladeDeck.js`

- [ ] **Step 1: Update `parseSharedBeys` to decode mode indices**

In `src/hooks/useBeybladeDeck.js`, replace `parseSharedBeys` (lines 6–10):

```js
function parseSharedBeys(rawBeys) {
  return rawBeys.map((bey) => {
    const [
      blade, ratchet, bit,
      assistBlade = '', lockChip = '',
      bladeMode = '0', assistBladeMode = '0', bitMode = '0',
    ] = bey.split(',');
    return {
      blade, ratchet, bit, assistBlade, lockChip,
      bladeMode: Number(bladeMode),
      assistBladeMode: Number(assistBladeMode),
      bitMode: Number(bitMode),
    };
  });
}
```

- [ ] **Step 2: Update the default beyblade shape in `handlePartChange`**

In `src/hooks/useBeybladeDeck.js`, replace the default shape inside `handlePartChange` (line 57):

```js
newBeyblades[i] = { blade: '', bladeMode: 0, assistBlade: '', assistBladeMode: 0, lockChip: '', ratchet: '', bit: '', bitMode: 0 };
```

- [ ] **Step 3: Reset mode when a part changes**

In `src/hooks/useBeybladeDeck.js`, after `newBeyblades[index][partType] = value;` (line 60), add:

```js
const modeResets = { blade: 'bladeMode', assistBlade: 'assistBladeMode', bit: 'bitMode' };
if (modeResets[partType] !== undefined) {
  newBeyblades[index][modeResets[partType]] = 0;
}
```

- [ ] **Step 4: Update `handleShareButton` to include mode indices in URL**

In `src/hooks/useBeybladeDeck.js`, replace the `url.searchParams.append` line inside `handleShareButton` (line 86):

```js
beyblades.forEach((bey) => {
  url.searchParams.append(
    'beys',
    `${bey.blade},${bey.ratchet},${bey.bit},${bey.assistBlade || ''},${bey.lockChip || ''},${bey.bladeMode || 0},${bey.assistBladeMode || 0},${bey.bitMode || 0}`
  );
});
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useBeybladeDeck.js
git commit -m "feat: add mode state fields, reset on part change, encode modes in share URL"
```

---

## Task 7: Create `ModeToggle.jsx`

**Files:**
- Create: `src/ModeToggle.jsx`

- [ ] **Step 1: Create `src/ModeToggle.jsx`**

```jsx
import PropTypes from 'prop-types';

function ModeToggle({ modes, value, onChange }) {
  return (
    <div className="flex gap-2 mb-4">
      {modes.map((mode, i) => {
        const active = i === value;
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: active ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
              color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
              border: active
                ? '1px solid rgba(0,212,255,0.4)'
                : '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

ModeToggle.propTypes = {
  modes: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string.isRequired })).isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ModeToggle;
```

- [ ] **Step 2: Commit**

```bash
git add src/ModeToggle.jsx
git commit -m "feat: add ModeToggle pill-button component"
```

---

## Task 8: Wire `ModeToggle` in `App.jsx` and pass mode props to `Beyblade`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add `ModeToggle` import to `src/App.jsx`**

Add to the imports block (after the `PartSelector` import):

```js
import ModeToggle from './ModeToggle';
```

`App.jsx` does not need to import `getStats` — it only uses `BEYBLADE_DB` to check for `modes` before rendering `ModeToggle`.

- [ ] **Step 2: Add ModeToggle after Blade PartSelector**

In `src/App.jsx`, after the Blade `<PartSelector>` block (around line 384), add:

```jsx
{BEYBLADE_DB[beyblades[index]?.blade]?.modes && (
  <ModeToggle
    modes={BEYBLADE_DB[beyblades[index].blade].modes}
    value={beyblades[index]?.bladeMode ?? 0}
    onChange={(i) => handlePartChange(index, 'bladeMode', i)}
  />
)}
```

- [ ] **Step 3: Add ModeToggle after Assist Blade PartSelector**

After the Assist Blade `<PartSelector>` block (around line 403), add:

```jsx
{BEYBLADE_DB[beyblades[index]?.assistBlade]?.modes && (
  <ModeToggle
    modes={BEYBLADE_DB[beyblades[index].assistBlade].modes}
    value={beyblades[index]?.assistBladeMode ?? 0}
    onChange={(i) => handlePartChange(index, 'assistBladeMode', i)}
  />
)}
```

- [ ] **Step 4: Add ModeToggle after Bit PartSelector**

After the Bit `<PartSelector>` block (around line 420), add:

```jsx
{BEYBLADE_DB[beyblades[index]?.bit]?.modes && (
  <ModeToggle
    modes={BEYBLADE_DB[beyblades[index].bit].modes}
    value={beyblades[index]?.bitMode ?? 0}
    onChange={(i) => handlePartChange(index, 'bitMode', i)}
  />
)}
```

- [ ] **Step 5: Pass mode props to `<Beyblade>`**

In `src/App.jsx`, update the `<Beyblade>` component call (around line 421) to include mode props:

```jsx
<Beyblade
  blade={beyblades[index]?.blade}
  assistBlade={beyblades[index]?.assistBlade}
  lockChip={beyblades[index]?.lockChip}
  ratchet={beyblades[index]?.ratchet}
  bit={beyblades[index]?.bit}
  format={currentFormat}
  bladeMode={beyblades[index]?.bladeMode ?? 0}
  assistBladeMode={beyblades[index]?.assistBladeMode ?? 0}
  bitMode={beyblades[index]?.bitMode ?? 0}
/>
```

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire ModeToggle into combo cards and pass mode props to Beyblade"
```

---

## Task 9: Update `Beyblade.jsx` to use `getStats`

**Files:**
- Modify: `src/Beyblade.jsx`

- [ ] **Step 1: Add `getStats` to imports**

In `src/Beyblade.jsx`, update line 1:

```js
import { BEYBLADE_DB, LIMITED_FORMAT, getStats } from './constants';
```

- [ ] **Step 2: Replace direct stat lookups with `getStats`**

In `src/Beyblade.jsx`, replace the function signature and stat computation block (lines 42–67):

```js
function Beyblade({ blade, assistBlade, lockChip, ratchet, bit, format, bladeMode = 0, assistBladeMode = 0, bitMode = 0 }) {
  const bladeStats   = getStats(blade, bladeMode);
  const assistStats  = getStats(assistBlade, assistBladeMode);
  const ratchetStats = getStats(ratchet);
  const bitStats     = getStats(bit, bitMode);

  const comboPoints =
    (BEYBLADE_DB[blade]?.points || 0) +
    (BEYBLADE_DB[ratchet]?.points || 0) +
    (BEYBLADE_DB[bit]?.points || 0);

  const attackTotal =
    (bladeStats.attack || 0) +
    (assistStats.attack || 0) +
    (ratchetStats.attack || 0) +
    (bitStats.attack || 0);

  const defenseTotal =
    (bladeStats.defense || 0) +
    (assistStats.defense || 0) +
    (ratchetStats.defense || 0) +
    (bitStats.defense || 0);

  const staminaTotal =
    (bladeStats.stamina || 0) +
    (assistStats.stamina || 0) +
    (ratchetStats.stamina || 0) +
    (bitStats.stamina || 0);

  const xDashTotal = bitStats.xDash || 0;
  const burstResistanceTotal = bitStats.burstResistance || 0;
```

- [ ] **Step 3: Commit**

```bash
git add src/Beyblade.jsx
git commit -m "feat: use getStats for mode-aware stat computation in Beyblade"
```

---

## Task 10: Update `ExportCard.jsx` to use `getStats`

**Files:**
- Modify: `src/components/ExportCard.jsx`

- [ ] **Step 1: Add `getStats` to imports**

In `src/components/ExportCard.jsx`, update line 1:

```js
import { BEYBLADE_DB, LIMITED_FORMAT, getStats } from '../constants';
```

- [ ] **Step 2: Update `getComboStats` to use `getStats`**

In `src/components/ExportCard.jsx`, replace `getComboStats` (lines 19–28):

```js
function getComboStats(combo) {
  const { blade, assistBlade, ratchet, bit, bladeMode = 0, assistBladeMode = 0, bitMode = 0 } = combo || {};
  const bladeStats   = getStats(blade, bladeMode);
  const assistStats  = getStats(assistBlade, assistBladeMode);
  const ratchetStats = getStats(ratchet);
  const bitStats     = getStats(bit, bitMode);
  return {
    attack:          (bladeStats.attack          || 0) + (assistStats.attack          || 0) + (ratchetStats.attack          || 0) + (bitStats.attack          || 0),
    defense:         (bladeStats.defense         || 0) + (assistStats.defense         || 0) + (ratchetStats.defense         || 0) + (bitStats.defense         || 0),
    stamina:         (bladeStats.stamina         || 0) + (assistStats.stamina         || 0) + (ratchetStats.stamina         || 0) + (bitStats.stamina         || 0),
    xDash:           bitStats.xDash           || 0,
    burstResistance: bitStats.burstResistance || 0,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ExportCard.jsx
git commit -m "feat: use getStats in ExportCard so downloaded images reflect active mode stats"
```

---

## Task 11: Remove workarounds and verify manually

**Files:**
- Modify: `src/PartSelector.jsx`

- [ ] **Step 1: Remove the `(Mode Change)` deduplication workaround in `PartSelector.jsx`**

In `src/PartSelector.jsx`, replace the `isOptionDisabled` function (lines 102–105):

```js
const isOptionDisabled = (option) => {
  return partsUsed.includes(option.value);
};
```

The old code stripped `(...)` suffixes from part names before checking `partsUsed`. That workaround is no longer needed since mode-capable parts have a single canonical name.

- [ ] **Step 2: Commit**

```bash
git add src/PartSelector.jsx
git commit -m "cleanup: remove Mode Change suffix workaround from PartSelector"
```

- [ ] **Step 3: Start dev server and verify manually**

```bash
npm run dev
```

Open the app in a browser. Check the following:

1. **Mode toggle appears:** Select `Eclipse` as a blade on a CX combo card → a two-button toggle labeled "Upper" / "Lower" appears below the Blade selector.
2. **Stats update:** Toggle between Upper and Lower — the Attack/Defense bars should change (Upper: Attack 30, Defense 20; Lower: Attack 20, Defense 30).
3. **Assist blade toggle:** Select `Dual` as assist blade → "Upper" / "Lower" toggle appears. Stats change on toggle.
4. **Scorpio Spear:** Select Scorpio Spear as blade → "Defense" / "Attack" toggle appears.
5. **Normal parts:** Select `Dran Sword` — no toggle appears.
6. **Mode resets on part change:** With Eclipse in Upper mode, change to a different blade → if you switch back to Eclipse, it resets to Upper (mode 0).
7. **Share URL:** Select Eclipse, toggle to Lower, click Share. Paste URL in a new tab — Eclipse should restore to Lower mode.
8. **Old URLs still work:** Open the app with a URL that has no mode params (`?beys=Eclipse,...`) — Eclipse loads in Upper mode (default 0).
9. **Export:** With an Eclipse combo in Lower mode, download the combo card PNG — stat bars should reflect Lower mode stats (Defense > Attack).

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Final commit if any lint fixes were needed**

```bash
git add -p
git commit -m "fix: address lint warnings"
```
