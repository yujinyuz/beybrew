"""
Generate src/data/beyparts.js from beydata/*.json + src/data/parts-overrides.json.

Usage:
    python scripts/generate_parts.py
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent.parent
BEYDATA_DIR = ROOT / "beydata"
OVERRIDES_PATH = ROOT / "src" / "data" / "parts-overrides.json"
OUTPUT_PATH = ROOT / "src" / "data" / "beyparts.js"


def load_beydata(beydata_dir: Path) -> dict:
    """Load all beydata JSON files. Returns dict keyed by category."""
    categories = {
        "blades": "BeybladePartsBlade.json",
        "mainBlades": "BeybladePartsMainBlade.json",
        "assistBlades": "BeybladePartsAssistBlade.json",
        "ratchets": "BeybladePartsRatchet.json",
        "bits": "BeybladePartsBit.json",
        "lockChips": "BeybladePartsLockChip.json",
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


def load_overrides(path: Path) -> dict:
    """Load parts-overrides.json. Returns empty dict per category if file missing."""
    empty = {"blades": {}, "mainBlades": {}, "assistBlades": {}, "ratchets": {}, "bits": {}, "lockChips": {}}
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


def _extract_description(beydata: dict) -> str | None:
    """Return cleaned en-US description from beydata entry, or None."""
    raw = beydata.get("description", {}).get("en-US", "")
    if not raw or raw.strip() in ("", "◾️", "■"):
        return None
    clean = re.sub(r"<[^>]+>", "", raw).strip()
    clean = re.sub(r"\\n|\n", " ", clean)
    clean = re.sub(r"\s{2,}", " ", clean)
    return clean or None


def _extract_type_label(en_name: str) -> str | None:
    """Return the parenthetical type label from a name, or None.

    e.g. 'BX-00 LIGHTNING L-DRAGO (upper type)' → 'Upper Type'
    """
    clean = re.sub(r"<[^>]+>", "", en_name).strip()
    match = re.search(r"\(([^)]+)\)$", clean)
    return match.group(1).title() if match else None


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

        # Auto-generate modes when all base entries have parenthetical type labels
        # e.g. "LIGHTNING L-DRAGO (upper type)" / "LIGHTNING L-DRAGO (rapid-hit type)"
        if len(deduped_base) > 1 and not override.get("modes"):
            labels = [_extract_type_label(e["name"].get("en-US", "")) for e in deduped_base]
            if all(labels):
                auto_modes = [
                    {
                        "label": lbl,
                        "attack": e["defaultStatus"].get("attack", 0),
                        "defense": e["defaultStatus"].get("defense", 0),
                        "stamina": e["defaultStatus"].get("stamina", 0),
                    }
                    for e, lbl in zip(deduped_base, labels)
                ]
                override = {**override, "modes": auto_modes}

        # If override defines modes (manually or auto-generated above), skip all
        # _ModeChange beydata entries — mode stats are fully specified.
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


def _base_name(group_id: str, override: dict) -> str:
    """Human-readable name: override > group_id title-cased as fallback."""
    if "name" in override:
        return override["name"]
    return group_id.title()


DEFAULT_BLADE_IMAGE = "BladeUnknown.svg"


def make_blade_entry(beydata: dict, override: dict) -> dict:
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
    desc = override.get("_description")
    if desc:
        entry["description"] = desc

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
        "type": override.get("type", None),
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


def make_assist_blade_entry(beydata: dict, override: dict) -> dict:
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


def make_lock_chip_entry(beydata: dict, override: dict) -> dict:
    """Build a beyparts.js lock chip object. Lock chips are CX-only identity parts with no stats."""
    group_id = beydata["group_id"]
    name = _base_name(group_id, override)
    entry = {
        "name": name,
        "line": "CX",
        "points": override.get("points", 0),
        "attack": 0,
        "defense": 0,
        "stamina": 0,
    }
    if override.get("image"):
        entry["image"] = override["image"]
    return entry


# ---------------------------------------------------------------------------
# JS serialization
# ---------------------------------------------------------------------------

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


def _js_object(obj: dict, indent: int = 4) -> str:
    """Serialize a flat dict to a JS object literal string."""
    pad = " " * indent
    lines = ["{"]
    for k, v in obj.items():
        lines.append(f"{pad}  {k}: {_js_val(v)},")
    lines.append(f"{pad}}}")
    return "\n".join(lines)


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


def serialize_to_js(blades: list, assist_blades: list, ratchets: list, bits: list, lock_chips: list) -> str:
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
}};

export default parts;
"""


# ---------------------------------------------------------------------------
# Blade filtering
# ---------------------------------------------------------------------------

def _cx_assembly_ids(blades: list) -> set:
    """
    Return group_ids of full CX blade assemblies from BeybladePartsBlade.
    These are excluded because the individual main blade components (BeybladePartsMainBlade)
    are used instead — each assembly is just a lock chip + main blade combination.
    """
    return {b.get("group_id", "") for b in blades if b.get("series_name") == "CX"}


def _mislabeled_blade_ids(blades: list) -> set:
    """
    Return group_ids of BeybladePartsBlade entries that are not real blades.
    'BIT' entries are standalone Bit Set bundle products (BX-00 ビットセット)
    that end up in the blade category in the source data.
    """
    return {b.get("group_id", "") for b in blades if b.get("en_name") == "BIT"}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    beydata = load_beydata(BEYDATA_DIR)
    overrides = load_overrides(OVERRIDES_PATH)

    # --- blades (BeybladePartsBlade + BeybladePartsMainBlade) ---
    exclude_blade_ids = (
        _cx_assembly_ids(beydata["blades"])
        | _mislabeled_blade_ids(beydata["blades"])
    )
    all_blade_entries = [
        e for e in beydata["blades"] + beydata["mainBlades"]
        if e.get("group_id") not in exclude_blade_ids
    ]
    blade_overrides = {**overrides["blades"], **overrides["mainBlades"]}
    processed_blades = process_entries(all_blade_entries, blade_overrides)
    blades = []
    for entry in processed_blades:
        obj = make_blade_entry(entry, entry.get("_override", {}))
        if obj:
            blades.append(obj)

    # Synthetic entries (legacy/Hasbro parts with no beydata source)
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
    # Lock chips don't have mode-change variants — filter them out before processing.
    # Most lock chips have empty group_id; use en_name as the key instead.
    non_mc_lock_chips = []
    for e in beydata["lockChips"]:
        if "_ModeChange" in e.get("model_name", ""):
            continue
        if not e.get("group_id", "").strip() and e.get("en_name", "").strip():
            e = {**e, "group_id": e["en_name"]}
        non_mc_lock_chips.append(e)
    processed_lock_chips = process_entries(non_mc_lock_chips, overrides["lockChips"])
    lock_chips = [make_lock_chip_entry(e, e.get("_override", {})) for e in processed_lock_chips]

    # Synthetic lock chips (no beydata source file available)
    for group_id, override in overrides["lockChips"].items():
        if override.get("_synthetic"):
            synthetic_beydata = {"group_id": group_id, "model_name": group_id}
            lock_chips.append(make_lock_chip_entry(synthetic_beydata, override))

    js_content = serialize_to_js(blades, assist_blades, ratchets, bits, lock_chips)
    OUTPUT_PATH.write_text(js_content, encoding="utf-8")
    print(f"Written: {OUTPUT_PATH}")
    print(f"  blades: {len(blades)}, assist_blades: {len(assist_blades)}, ratchets: {len(ratchets)}, bits: {len(bits)}, lock_chips: {len(lock_chips)}")

    enrich_overrides_with_descriptions(beydata, overrides, OVERRIDES_PATH)


def enrich_overrides_with_descriptions(beydata: dict, overrides: dict, path: Path) -> None:
    """Write _description fields into parts-overrides.json for existing blade entries
    that have an en-US description in beydata. Only adds — never removes."""
    category_sources = {
        "blades": beydata["blades"] + beydata["mainBlades"],
        "mainBlades": beydata["mainBlades"],
        "assistBlades": beydata["assistBlades"],
        "ratchets": beydata["ratchets"],
        "bits": beydata["bits"],
    }

    raw = json.loads(path.read_text(encoding="utf-8"))
    changed = False
    for category, sources in category_sources.items():
        desc_map: dict[str, str] = {}
        for entry in sources:
            gid = entry.get("group_id", "").strip()
            if gid and gid not in desc_map:
                desc = _extract_description(entry)
                if desc:
                    desc_map[gid] = desc

        for group_id, override in raw.get(category, {}).items():
            desc = desc_map.get(group_id)
            if desc and override.get("_description") != desc:
                override["_description"] = desc
                changed = True

    if changed:
        path.write_text(json.dumps(raw, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Updated: {path} (added _description fields)")


if __name__ == "__main__":
    main()
