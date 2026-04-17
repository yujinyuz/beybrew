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
            if "name" in override:
                entry["altname"] = f"{override['name']} (Mode Change)"
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
