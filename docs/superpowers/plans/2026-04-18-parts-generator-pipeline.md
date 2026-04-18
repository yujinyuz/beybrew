# Parts Generator Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-edited `src/data/beyparts.js` with a generated file driven by `beydata/*.json` + a small `parts-overrides.json` that only stores fields the official data doesn't have (image, points, name).

**Architecture:** `scripts/generate_parts.py` reads five `beydata/*.json` files plus `src/data/parts-overrides.json`, deduplicates color-variant entries, promotes mode-change variants to separate named entries, then writes `src/data/beyparts.js`. A one-time `scripts/migrate_overrides.py` bootstraps `parts-overrides.json` from the current hand-edited file. Stats (attack/defense/stamina/type) always overwrite from beydata; any field present in overrides wins for that field only.

**Tech Stack:** Python 3.13 stdlib only (`json`, `re`, `pathlib`, `sys`), pytest for tests (needs `pip install pytest`).

---

## File Map

| Path | Action | Responsibility |
|---|---|---|
| `scripts/generate_parts.py` | Create | Reads beydata + overrides, writes `src/data/beyparts.js` |
| `scripts/migrate_overrides.py` | Create | One-time: extracts manual fields from current beyparts.js |
| `scripts/tests/__init__.py` | Create | Makes tests a package |
| `scripts/tests/test_generate_parts.py` | Create | Unit tests for the generator |
| `src/data/parts-overrides.json` | Create (by migration) | Manual fields: image, points, name, alias, flags |
| `src/data/beyparts.js` | Modified (generated) | Do not edit by hand after Task 6 |
| `Justfile` | Modify | Add `generate` and `migrate` recipes |

---

## Task 1: Create branch and directory structure

**Files:**
- Create: `scripts/tests/__init__.py`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b feat/parts-generator
```

Expected: `Switched to a new branch 'feat/parts-generator'`

- [ ] **Step 2: Create the scripts/tests directory**

```bash
mkdir -p scripts/tests
touch scripts/tests/__init__.py
```

- [ ] **Step 3: Commit the skeleton**

```bash
git add scripts/tests/__init__.py
git commit -m "chore: scaffold scripts/tests directory for parts generator"
```

---

## Task 2: Install pytest

- [ ] **Step 1: Install pytest**

```bash
pip install pytest
```

Expected output ends with: `Successfully installed pytest-...`

- [ ] **Step 2: Verify**

```bash
python3 -m pytest --version
```

Expected: `pytest 8.x.x`

---

## Task 3: Write tests for `process_entries` (deduplication + mode-change logic)

This is the core logic of the generator. TDD it first.

**Files:**
- Create: `scripts/tests/test_generate_parts.py`

- [ ] **Step 1: Write the failing tests**

Create `scripts/tests/test_generate_parts.py`:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from generate_parts import process_entries, make_blade_entry, make_ratchet_entry, make_bit_entry, make_assist_blade_entry


# --- process_entries ---

def test_deduplicates_identical_stats():
    """Color variants (same group_id, identical stats) collapse to one entry."""
    entries = [
        {"group_id": "DRANBUSTER", "en_name": "DRANBUSTER", "type": "attack",
         "show_mode_change_icon": False, "model_name": "BX_DranBuster1-60A",
         "defaultStatus": {"attack": 70, "defense": 20, "stamina": 10}},
        {"group_id": "DRANBUSTER", "en_name": "DRANBUSTER", "type": "attack",
         "show_mode_change_icon": False, "model_name": "BX_DranBuster1-60A_blue",
         "defaultStatus": {"attack": 70, "defense": 20, "stamina": 10}},
    ]
    result = process_entries(entries, overrides={})
    assert len(result) == 1


def test_keeps_mode_change_variants():
    """Different stats + show_mode_change_icon → two separate entries."""
    entries = [
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
         "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30}},
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z_ModeChange",
         "defaultStatus": {"attack": 55, "defense": 25, "stamina": 30}},
    ]
    result = process_entries(entries, overrides={})
    assert len(result) == 2


def test_mode_change_entry_gets_altname():
    """The _ModeChange variant gets altname set to 'Name (Mode Change)'."""
    entries = [
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
         "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30}},
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z_ModeChange",
         "defaultStatus": {"attack": 55, "defense": 25, "stamina": 30}},
    ]
    overrides = {"SCORPIOSPEAR": {"name": "Scorpio Spear", "image": "ScorpioSpear.webp", "points": 2}}
    result = process_entries(entries, overrides=overrides)
    names = [e.get("altname") for e in result]
    assert "Scorpio Spear (Mode Change)" in names


# --- make_blade_entry ---

def test_blade_entry_auto_derives_stats():
    """attack/defense/stamina/type come from defaultStatus and type fields."""
    beydata = {"group_id": "DRANBUSTER", "en_name": "DRANBUSTER", "type": "attack",
               "show_mode_change_icon": False, "model_name": "BX_DranBuster1-60A",
               "defaultStatus": {"attack": 70, "defense": 20, "stamina": 10}}
    override = {"name": "Dran Buster", "points": 3, "image": "Dran_Buster_1-60A.webp"}
    entry = make_blade_entry(beydata, override)
    assert entry["attack"] == 70
    assert entry["defense"] == 20
    assert entry["stamina"] == 10
    assert entry["type"] == "attack"


def test_blade_entry_points_default_to_one():
    """Points defaults to 1 when not in overrides."""
    beydata = {"group_id": "WOLFHUNT", "en_name": "WOLFHUNTF", "type": "stamina",
               "show_mode_change_icon": False, "model_name": "CX10_WolfHuntF0-60DB",
               "defaultStatus": {"attack": 25, "defense": 30, "stamina": 55}}
    override = {"name": "Wolf Hunt", "image": "WolfHunt_0-60DB.webp"}
    entry = make_blade_entry(beydata, override)
    assert entry["points"] == 1


def test_blade_entry_override_wins_for_stats():
    """An override stat value takes precedence over beydata."""
    beydata = {"group_id": "WOLFHUNT", "en_name": "WOLFHUNTF", "type": "stamina",
               "show_mode_change_icon": False, "model_name": "CX10_WolfHuntF0-60DB",
               "defaultStatus": {"attack": 25, "defense": 30, "stamina": 55}}
    override = {"name": "Wolf Hunt", "image": "WolfHunt_0-60DB.webp", "attack": 99}
    entry = make_blade_entry(beydata, override)
    assert entry["attack"] == 99


def test_blade_entry_missing_image_returns_none(capsys):
    """Blade with no image in overrides returns None and prints a warning."""
    beydata = {"group_id": "WOLFHUNT", "en_name": "WOLFHUNTF", "type": "stamina",
               "show_mode_change_icon": False, "model_name": "CX10_WolfHuntF0-60DB",
               "defaultStatus": {"attack": 25, "defense": 30, "stamina": 55}}
    result = make_blade_entry(beydata, override={})
    captured = capsys.readouterr()
    assert result is None
    assert "WOLFHUNT" in captured.err


def test_blade_entry_hasbro_flag():
    """hasbro flag from overrides is included in entry."""
    beydata = {"group_id": "WYVERNHOVER", "en_name": "WYVERNHOVER", "type": "defense",
               "show_mode_change_icon": False, "model_name": "Hover_Wyvern",
               "defaultStatus": {"attack": 13, "defense": 60, "stamina": 27}}
    override = {"name": "Wyvern Hover", "points": 3, "image": "Hover_Wyvern_Takara.webp", "hasbro": True}
    entry = make_blade_entry(beydata, override)
    assert entry.get("hasbro") is True


def test_blade_entry_spintype_flag():
    """spinType from overrides is included in entry."""
    beydata = {"group_id": "COBALTDRAGOON", "en_name": "COBALTDRAGOON", "type": "attack",
               "show_mode_change_icon": False, "model_name": "BX_CobaltDragoon2-60C",
               "defaultStatus": {"attack": 60, "defense": 15, "stamina": 25}}
    override = {"name": "Cobalt Dragoon", "points": 3, "image": "Cobalt_Dragoon_2-60C.webp", "spinType": "left"}
    entry = make_blade_entry(beydata, override)
    assert entry.get("spinType") == "left"


# --- make_ratchet_entry ---

def test_ratchet_entry_stats_from_beydata():
    """Ratchet attack/defense/stamina from defaultStatus."""
    beydata = {"group_id": "0-60", "en_name": "0-60", "type": None,
               "model_name": "CX10_WolfHuntF0-60DB",
               "defaultStatus": {"attack": 3, "defense": 14, "stamina": 13}}
    override = {"points": 1}
    entry = make_ratchet_entry(beydata, override)
    assert entry["name"] == "0-60"
    assert entry["altname"] == "0-60"
    assert entry["attack"] == 3
    assert entry["defense"] == 14
    assert entry["stamina"] == 13
    assert entry["points"] == 1


# --- make_bit_entry ---

def test_bit_entry_alias_from_en_name():
    """Bit alias comes from en_name when not overridden."""
    beydata = {"group_id": "FB", "en_name": "FB", "type": "stamina",
               "model_name": "BX01_SharkEdge4-50UF",
               "defaultStatus": {"attack": 10, "defense": 25, "stamina": 60, "dash": 5, "burst": 30}}
    entry = make_bit_entry(beydata, override={})
    assert entry["alias"] == "FB"


def test_bit_entry_xdash_and_burst_resistance():
    """xDash comes from dash, burstResistance from burst in defaultStatus."""
    beydata = {"group_id": "A", "en_name": "A", "type": "attack",
               "model_name": "BX01_SharkEdge4-50UF",
               "defaultStatus": {"attack": 40, "defense": 10, "stamina": 10, "dash": 40, "burst": 80}}
    entry = make_bit_entry(beydata, override={"name": "Accel", "points": 1})
    assert entry["xDash"] == 40
    assert entry["burstResistance"] == 80


# --- make_assist_blade_entry ---

def test_assist_blade_missing_image_returns_none(capsys):
    """Assist blade without image returns None and prints a warning."""
    beydata = {"group_id": "SLASH", "en_name": "S", "type": "attack",
               "model_name": "AssistBladeSlash",
               "defaultStatus": {"attack": 20, "defense": 10, "stamina": 10}}
    result = make_assist_blade_entry(beydata, override={})
    captured = capsys.readouterr()
    assert result is None
    assert "SLASH" in captured.err


def test_assist_blade_alias_from_override():
    """Assist blade alias comes from override."""
    beydata = {"group_id": "SLASH", "en_name": "S", "type": "attack",
               "model_name": "AssistBladeSlash",
               "defaultStatus": {"attack": 20, "defense": 10, "stamina": 10}}
    override = {"name": "Slash", "alias": "S", "image": "AssistBladeSlash.webp"}
    entry = make_assist_blade_entry(beydata, override)
    assert entry["alias"] == "S"
    assert entry["image"] == "AssistBladeSlash.webp"
```

- [ ] **Step 2: Run tests to confirm they all fail (ImportError is expected)**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer
python3 -m pytest scripts/tests/test_generate_parts.py -v 2>&1 | head -30
```

Expected: `ImportError: cannot import name 'process_entries' from 'generate_parts'` or `ModuleNotFoundError`

- [ ] **Step 3: Commit the tests**

```bash
git add scripts/tests/test_generate_parts.py scripts/tests/__init__.py
git commit -m "test: add failing tests for parts generator core functions"
```

---

## Task 4: Implement `generate_parts.py`

**Files:**
- Create: `scripts/generate_parts.py`

- [ ] **Step 1: Create `scripts/generate_parts.py`**

```python
"""
Generate src/data/beyparts.js from beydata/*.json + src/data/parts-overrides.json.

Usage:
    python scripts/generate_parts.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
BEYDATA_DIR = ROOT / "beydata"
OVERRIDES_PATH = ROOT / "src" / "data" / "parts-overrides.json"
OUTPUT_PATH = ROOT / "src" / "data" / "beyparts.js"


def load_beydata(beydata_dir: Path) -> dict:
    """Load all five beydata JSON files. Returns dict keyed by category."""
    categories = {
        "blades": "BeybladePartsBlade.json",
        "mainBlades": "BeybladePartsMainBlade.json",
        "assistBlades": "BeybladePartsAssistBlade.json",
        "ratchets": "BeybladePartsRatchet.json",
        "bits": "BeybladePartsBit.json",
    }
    result = {}
    for key, filename in categories.items():
        path = beydata_dir / filename
        with open(path, encoding="utf-8") as f:
            result[key] = json.load(f)
    return result


def load_overrides(path: Path) -> dict:
    """Load parts-overrides.json. Returns empty dict per category if file missing."""
    empty = {"blades": {}, "mainBlades": {}, "assistBlades": {}, "ratchets": {}, "bits": {}}
    if not path.exists():
        return empty
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    for key in empty:
        data.setdefault(key, {})
    return data


def _stats_key(entry: dict) -> tuple:
    """Tuple of (attack, defense, stamina) for deduplication comparison."""
    s = entry["defaultStatus"]
    return (s.get("attack", 0), s.get("defense", 0), s.get("stamina", 0))


def _is_mode_change(entry: dict) -> bool:
    return "_ModeChange" in entry.get("model_name", "")


def process_entries(entries: list, overrides: dict) -> list:
    """
    Group by group_id, deduplicate color variants (identical stats),
    keep mode-change variants as separate entries.
    Returns list of dicts with beydata entry + resolved override merged in.
    """
    from collections import defaultdict
    groups = defaultdict(list)
    for e in entries:
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

        # Deduplicate mode-change entries by stats
        seen_mc_stats = set()
        deduped_mc = []
        for e in mode_changes:
            key = _stats_key(e)
            if key not in seen_mc_stats:
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


def _base_name(group_id: str, override: dict) -> str:
    """Human-readable name: override > group_id title-cased as fallback."""
    if "name" in override:
        return override["name"]
    return group_id.title()


def make_blade_entry(beydata: dict, override: dict) -> dict | None:
    """
    Build a beyparts.js blade object.
    Returns None (and warns to stderr) if image is missing from override.
    """
    group_id = beydata["group_id"]
    image = override.get("image")
    if not image:
        print(f"WARNING: no image for blade '{group_id}' — skipping", file=sys.stderr)
        return None

    stats = beydata["defaultStatus"]
    name = _base_name(group_id, override)
    is_mode_change = beydata.get("_is_mode_change", False)

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

    if override.get("hasbro"):
        entry["hasbro"] = True
    if override.get("spinType"):
        entry["spinType"] = override["spinType"]

    return entry


def make_ratchet_entry(beydata: dict, override: dict) -> dict:
    """Build a beyparts.js ratchet object."""
    stats = beydata["defaultStatus"]
    name = beydata["group_id"]  # ratchet names are already human-readable (e.g. "0-60")
    return {
        "name": name,
        "altname": name,
        "points": override.get("points", 1),
        "attack": override.get("attack", stats.get("attack", 0)),
        "defense": override.get("defense", stats.get("defense", 0)),
        "stamina": override.get("stamina", stats.get("stamina", 0)),
        "type": None,
    }


def make_bit_entry(beydata: dict, override: dict) -> dict:
    """Build a beyparts.js bit object."""
    stats = beydata["defaultStatus"]
    name = _base_name(beydata["group_id"], override)
    alias = override.get("alias", beydata.get("en_name", beydata["group_id"]))
    return {
        "name": name,
        "alias": alias,
        "points": override.get("points", 1),
        "attack": override.get("attack", stats.get("attack", 0)),
        "defense": override.get("defense", stats.get("defense", 0)),
        "stamina": override.get("stamina", stats.get("stamina", 0)),
        "xDash": override.get("xDash", stats.get("dash", 0)),
        "burstResistance": override.get("burstResistance", stats.get("burst", 0)),
        "type": override.get("type", beydata.get("type")),
    }


def make_assist_blade_entry(beydata: dict, override: dict) -> dict | None:
    """
    Build a beyparts.js assist blade object.
    Returns None (and warns to stderr) if image is missing from override.
    """
    group_id = beydata["group_id"]
    image = override.get("image")
    if not image:
        print(f"WARNING: no image for assist blade '{group_id}' — skipping", file=sys.stderr)
        return None

    stats = beydata["defaultStatus"]
    name = _base_name(group_id, override)
    alias = override.get("alias", beydata.get("en_name", group_id))
    is_mode_change = beydata.get("_is_mode_change", False)

    entry = {
        "name": name,
        "alias": alias,
        "points": override.get("points", 0),
        "attack": override.get("attack", stats.get("attack", 0)),
        "defense": override.get("defense", stats.get("defense", 0)),
        "stamina": override.get("stamina", stats.get("stamina", 0)),
        "image": image,
    }

    if is_mode_change:
        entry["altname"] = f"{name} (Mode Change)"

    return entry


# ---------------------------------------------------------------------------
# JS serialization
# ---------------------------------------------------------------------------

def _js_val(v) -> str:
    """Serialize a Python scalar to JS literal."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return json.dumps(v)
    if isinstance(v, (int, float)):
        return str(v)
    raise TypeError(f"Cannot serialize {type(v)}: {v!r}")


def _js_object(obj: dict, indent: int = 4) -> str:
    """Serialize a flat dict to a JS object literal string."""
    pad = " " * indent
    lines = ["{"]
    for k, v in obj.items():
        lines.append(f"{pad}  {k}: {_js_val(v)},")
    lines.append(f"{pad}}}")
    return "\n".join(lines)


def _js_array(items: list, indent: int = 4) -> str:
    """Serialize a list of dicts to a JS array literal."""
    if not items:
        return "[]"
    pad = " " * indent
    parts = [f"{pad}{_js_object(item, indent)},\n" for item in items]
    return "[\n" + "".join(parts) + "  ]"


TURBO_RATCHET = """\
    {
      name: "Turbo (Ratchet Integrated Bit)",
      altname: "",
      points: 0,
      attack: 0,
      defense: 0,
      stamina: 0,
      onSelect: function (setPartsUsed) {},
    },"""


def serialize_to_js(blades: list, assist_blades: list, ratchets: list, bits: list) -> str:
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
}};

export default parts;
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    beydata = load_beydata(BEYDATA_DIR)
    overrides = load_overrides(OVERRIDES_PATH)

    # --- blades (BeybladePartsBlade + BeybladePartsMainBlade) ---
    all_blade_entries = beydata["blades"] + beydata["mainBlades"]
    blade_overrides = {**overrides["blades"], **overrides["mainBlades"]}
    processed_blades = process_entries(all_blade_entries, blade_overrides)
    blades = []
    for entry in processed_blades:
        obj = make_blade_entry(entry, entry.get("_override", {}))
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

    js_content = serialize_to_js(blades, assist_blades, ratchets, bits)
    OUTPUT_PATH.write_text(js_content, encoding="utf-8")
    print(f"Written: {OUTPUT_PATH}")
    print(f"  blades: {len(blades)}, assist_blades: {len(assist_blades)}, ratchets: {len(ratchets)}, bits: {len(bits)}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer
python3 -m pytest scripts/tests/test_generate_parts.py -v
```

Expected: all tests pass. Fix any failures before continuing.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate_parts.py
git commit -m "feat: add generate_parts.py with TDD-verified core logic"
```

---

## Task 5: Write and run `migrate_overrides.py`

This runs once to extract the current hand-authored fields from `beyparts.js` and write `src/data/parts-overrides.json`.

**Files:**
- Create: `scripts/migrate_overrides.py`

- [ ] **Step 1: Create `scripts/migrate_overrides.py`**

```python
"""
One-time migration: read the current src/data/beyparts.js and extract manual
fields (name, image, points, alias, hasbro, spinType) into src/data/parts-overrides.json.

Run from the project root:
    python scripts/migrate_overrides.py
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
BEYPARTS_PATH = ROOT / "src" / "data" / "beyparts.js"
BEYDATA_DIR = ROOT / "beydata"
OVERRIDES_PATH = ROOT / "src" / "data" / "parts-overrides.json"


def _strip_comments(text: str) -> str:
    return re.sub(r"//[^\n]*", "", text)


def parse_js_objects(js_text: str) -> list[dict]:
    """
    Parse the flat JS object literals inside beyparts.js arrays.
    Handles string, number, bool, and null values. Skips function values.
    """
    text = _strip_comments(js_text)
    objects = []
    for match in re.finditer(r"\{([^{}]*)\}", text, re.DOTALL):
        inner = match.group(1)
        obj = {}
        # Strings
        for m in re.finditer(r'(\w+)\s*:\s*"([^"]*)"', inner):
            obj[m.group(1)] = m.group(2)
        # Numbers (don't overwrite strings already captured)
        for m in re.finditer(r"(\w+)\s*:\s*(-?\d+(?:\.\d+)?)", inner):
            if m.group(1) not in obj:
                v = m.group(2)
                obj[m.group(1)] = float(v) if "." in v else int(v)
        # Booleans / null
        for m in re.finditer(r"(\w+)\s*:\s*(true|false|null)\b", inner):
            if m.group(1) not in obj:
                obj[m.group(1)] = {"true": True, "false": False, "null": None}[m.group(2)]
        if "name" in obj:
            objects.append(obj)
    return objects


def normalize(s: str) -> str:
    """Remove non-alphanumeric chars and lowercase for fuzzy name matching."""
    return re.sub(r"[^a-z0-9]", "", s.lower())


def load_beydata_group_ids(beydata_dir: Path) -> dict:
    """
    Returns dict mapping normalize(group_id) -> group_id for all part categories.
    Keys: 'blades', 'mainBlades', 'assistBlades', 'ratchets', 'bits'.
    """
    categories = {
        "blades": "BeybladePartsBlade.json",
        "mainBlades": "BeybladePartsMainBlade.json",
        "assistBlades": "BeybladePartsAssistBlade.json",
        "ratchets": "BeybladePartsRatchet.json",
        "bits": "BeybladePartsBit.json",
    }
    result = {}
    for key, fname in categories.items():
        with open(beydata_dir / fname, encoding="utf-8") as f:
            data = json.load(f)
        seen = {}
        for entry in data:
            gid = entry["group_id"]
            seen[normalize(gid)] = gid
        result[key] = seen
    return result


def build_overrides(js_objects: list[dict], beydata_group_ids: dict) -> dict:
    """
    Match each JS object to a beydata group_id by normalised name.
    Extracts: name, image, points, alias, altname, hasbro, spinType.
    """
    overrides = {"blades": {}, "mainBlades": {}, "assistBlades": {}, "ratchets": {}, "bits": {}}

    # Build a combined lookup: normalize(name) -> (category, group_id)
    lookup = {}
    for category, mapping in beydata_group_ids.items():
        for norm_gid, gid in mapping.items():
            # Don't let later categories overwrite earlier ones for the same norm key
            if norm_gid not in lookup:
                lookup[norm_gid] = (category, gid)

    unmatched = []
    for obj in js_objects:
        name = obj.get("name", "")
        key = normalize(name)
        match = lookup.get(key)
        if not match:
            unmatched.append(name)
            continue

        category, group_id = match
        override = {}
        override["name"] = name
        if "image" in obj:
            override["image"] = obj["image"]
        if "points" in obj:
            override["points"] = obj["points"]
        if "alias" in obj:
            override["alias"] = obj["alias"]
        if obj.get("hasbro"):
            override["hasbro"] = True
        if obj.get("spinType"):
            override["spinType"] = obj["spinType"]

        # For mode-change entries (altname set), store altname so we can recognise them
        # (the generator recreates altnames automatically — we just need the base name)
        # Don't overwrite if a base entry already set the name for this group_id
        existing = overrides[category].get(group_id, {})
        if not existing or "_mode_change" not in existing:
            overrides[category][group_id] = override

    if unmatched:
        print(f"WARNING: {len(unmatched)} JS entries had no beydata match:", file=sys.stderr)
        for n in unmatched:
            print(f"  - {n!r}", file=sys.stderr)

    return overrides


def main():
    if OVERRIDES_PATH.exists():
        print(f"ERROR: {OVERRIDES_PATH} already exists. Delete it first to re-run migration.", file=sys.stderr)
        sys.exit(1)

    js_text = BEYPARTS_PATH.read_text(encoding="utf-8")
    js_objects = parse_js_objects(js_text)
    print(f"Parsed {len(js_objects)} objects from beyparts.js")

    beydata_group_ids = load_beydata_group_ids(BEYDATA_DIR)
    overrides = build_overrides(js_objects, beydata_group_ids)

    total = sum(len(v) for v in overrides.values())
    print(f"Matched {total} entries to beydata group_ids")

    with open(OVERRIDES_PATH, "w", encoding="utf-8") as f:
        json.dump(overrides, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Written: {OVERRIDES_PATH}")
    for cat, entries in overrides.items():
        print(f"  {cat}: {len(entries)} entries")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the migration**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer
python3 scripts/migrate_overrides.py
```

Expected output:
```
Parsed N objects from beyparts.js
Matched N entries to beydata group_ids
Written: src/data/parts-overrides.json
  blades: N entries
  ...
```

If there are `WARNING: ... no beydata match` lines, note those part names — they're Hasbro-only or legacy parts not in beydata. They will need to be handled separately (see Task 7).

- [ ] **Step 3: Spot-check the output**

```bash
python3 -c "
import json
d = json.load(open('src/data/parts-overrides.json'))
# Check a known blade
print('DRANBUSTER:', d['blades'].get('DRANBUSTER'))
print('5-60 ratchet:', d['ratchets'].get('5-60'))
print('FB bit:', d['bits'].get('FB'))
print('SLASH assist:', d['assistBlades'].get('SLASH'))
"
```

Expected: each entry shows name, image, and points matching the current beyparts.js values.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate_overrides.py src/data/parts-overrides.json
git commit -m "feat: add migrate_overrides.py and initial parts-overrides.json"
```

---

## Task 6: Run the generator and verify output

- [ ] **Step 1: Run the generator**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer
python3 scripts/generate_parts.py
```

Expected: no errors, prints counts for blades/assist_blades/ratchets/bits. Warnings for any blades missing images are expected if the migration had unmatched entries — check them.

- [ ] **Step 2: Verify the app still builds**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes with no errors. If there are import errors, the generated JS has a syntax problem — check the `serialize_to_js` output for malformed entries.

- [ ] **Step 3: Run the dev server and do a smoke test**

```bash
npm run dev
```

Open the app in a browser. Verify:
- Blade selector populates with parts
- Ratchet and bit selectors work
- Selecting a combo shows correct stats
- No console errors

- [ ] **Step 4: Commit the generated beyparts.js**

```bash
git add src/data/beyparts.js
git commit -m "feat: beyparts.js is now generated by scripts/generate_parts.py"
```

---

## Task 7: Handle unmatched (Hasbro/legacy) parts

After Task 5 you may have parts from beyparts.js that had no beydata match (e.g. Hasbro-only blades). These need to be added to `parts-overrides.json` under a special `"synthetic"` category and handled by the generator.

- [ ] **Step 1: Check which parts are missing from generated beyparts.js**

```bash
python3 -c "
import json, re

# Load generated output
with open('src/data/beyparts.js') as f:
    generated = f.read()

gen_names = set(re.findall(r'name: \"([^\"]+)\"', generated))

# Load original (backed up as beyparts.js.bak if you made one, or check git)
import subprocess
original = subprocess.check_output(['git', 'show', 'HEAD~1:src/data/beyparts.js']).decode()
orig_names = set(re.findall(r'name: \"([^\"]+)\"', original))

missing = orig_names - gen_names
print('Parts in original but not in generated:')
for n in sorted(missing):
    print(' ', n)
"
```

- [ ] **Step 2: For each missing part, add it to the appropriate section of `parts-overrides.json`**

Open `src/data/parts-overrides.json`. For each missing blade, add an entry under `"blades"` using a synthetic key. Example for a Hasbro-only part:

```json
"blades": {
  "WYVERNHOVER": {
    "name": "Wyvern Hover",
    "points": 3,
    "image": "Hover_Wyvern_Takara.webp",
    "hasbro": true,
    "_synthetic": true,
    "_stats": { "attack": 13, "defense": 60, "stamina": 27 },
    "_type": "defense"
  }
}
```

The `_synthetic: true` flag tells the generator this entry has no beydata source — it should use `_stats` directly.

- [ ] **Step 3: Update `generate_parts.py` to handle synthetic entries**

In `main()` in `generate_parts.py`, after building `processed_blades`, add:

```python
# Synthetic entries (Hasbro/legacy parts with no beydata source)
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
```

- [ ] **Step 4: Re-run the generator and verify missing parts are back**

```bash
python3 scripts/generate_parts.py
python3 -c "
import re
with open('src/data/beyparts.js') as f:
    content = f.read()
names = re.findall(r'name: \"([^\"]+)\"', content)
print('Wyvern Hover' in names, 'Bear Scratch' in names)
"
```

Expected: `True True` (or whatever Hasbro parts were missing)

- [ ] **Step 5: Rebuild and smoke test**

```bash
npm run build 2>&1 | tail -5
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate_parts.py src/data/parts-overrides.json src/data/beyparts.js
git commit -m "feat: handle synthetic (Hasbro/legacy) parts in generator"
```

---

## Task 8: Update Justfile and add scripts README

**Files:**
- Modify: `Justfile`
- Create: `scripts/README.md`

- [ ] **Step 1: Update Justfile**

Edit `Justfile` to add two new recipes:

```just
decode master_data="MasterData.json":
  python decoder.py

generate:
  python scripts/generate_parts.py

migrate:
  python scripts/migrate_overrides.py

dev:
  npm run dev
```

- [ ] **Step 2: Create `scripts/README.md`**

```markdown
# Scripts

## Workflow for a New Beyblade Release

1. Get the updated `MasterData.json` from the official app
2. Run the decoder to update `beydata/`:
   ```
   just decode
   ```
3. Download the part image(s) and put them in `public/images/` (or wherever images live)
4. Add an entry to `src/data/parts-overrides.json`:
   ```json
   "blades": {
     "NEWBLADE": {
       "name": "New Blade",
       "image": "NewBlade_3-70X.webp"
     }
   }
   ```
   - `name` is the human-readable display name
   - `image` is the filename
   - `points` defaults to 1 — add it only if the tournament cost differs
5. Regenerate `beyparts.js`:
   ```
   just generate
   ```

## Overriding Stats

To pin a stat value (e.g. if official data is wrong):
```json
"WOLFHUNT": {
  "name": "Wolf Hunt",
  "image": "WolfHunt_0-60DB.webp",
  "attack": 30
}
```
The pinned `attack` will persist across regenerations even if beydata changes.

## Migration (one-time)

`migrate_overrides.py` bootstrapped `parts-overrides.json` from the hand-edited
`beyparts.js`. Do not run it again — it will refuse if the file already exists.

## Scripts

- `generate_parts.py` — merge beydata + overrides → `src/data/beyparts.js`
- `migrate_overrides.py` — one-time bootstrapper (already run)
```

- [ ] **Step 3: Commit**

```bash
git add Justfile scripts/README.md
git commit -m "docs: add generate/migrate Justfile recipes and scripts README"
```

---

## Task 9: Final verification and PR

- [ ] **Step 1: Run all tests**

```bash
python3 -m pytest scripts/tests/ -v
```

Expected: all tests pass.

- [ ] **Step 2: Verify full build pipeline end-to-end**

```bash
python3 scripts/generate_parts.py && npm run build 2>&1 | tail -10
```

Expected: generator prints counts, build succeeds with no errors.

- [ ] **Step 3: Check git log**

```bash
git log main..HEAD --oneline
```

Expected: 6–9 commits on the feature branch, all scoped to this feature.

- [ ] **Step 4: Open a PR**

```bash
git push -u origin feat/parts-generator
gh pr create \
  --title "feat: parts generator pipeline (beydata + overrides → beyparts.js)" \
  --body "Replaces hand-edited beyparts.js with a generated file. Adding a new part now only requires adding image + optional points to parts-overrides.json and running \`just generate\`."
```
