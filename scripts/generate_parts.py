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
BEYDATA_DIR = ROOT / "data"
OVERRIDES_PATH = ROOT / "src" / "data" / "parts-overrides.json"
OUTPUT_PATH = ROOT / "src" / "data" / "beyparts.js"

# Takara-Tomy uses ■ (and its emoji variant) as a placeholder for unreleased parts.
PLACEHOLDER_NAMES: frozenset[str] = frozenset({"■", "◾️"})


def load_beydata(beydata_dir: Path) -> dict:
    """Load all beydata JSON files. Returns dict keyed by category."""
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


def load_overrides(path: Path) -> dict:
    """Load parts-overrides.json. Returns empty dict per category if file missing."""
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


def _split_source_desc(text: str) -> tuple[str | None, str | None]:
    """Split 'Included in X. Y.' or 'Found in [the] X. Y.' into (source, description).

    Returns (None, text) when no recognized prefix is found.
    """
    match = re.match(r"^(?:Included in|Found in(?:\s+the)?)\s+(.+?)\.\s+(.+)$", text, re.DOTALL)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None, text or None


def _extract_type_label(en_name: str) -> str | None:
    """Return the parenthetical type label from a name, or None.

    e.g. 'BX-00 LIGHTNING L-DRAGO (upper type)' → 'Upper Type'
    """
    clean = re.sub(r"<[^>]+>", "", en_name).strip()
    match = re.search(r"\(([^)]+)\)$", clean)
    return match.group(1).title() if match else None


def _override_key(group_id: str, group: list) -> str:
    """Return the key used to look up overrides — en_name of first entry, falling back to group_id."""
    if group:
        en = group[0].get("en_name", "").strip()
        if en:
            return en
    return group_id


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
        gid = e.get("group_id", "").strip()
        if gid and gid not in PLACEHOLDER_NAMES:
            groups[gid].append(e)

    result = []
    for group_id, group in groups.items():
        okey = _override_key(group_id, group)
        override = overrides.get(okey, overrides.get(group_id, {}))

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

        # Auto-generate modes when multiple base entries have show_mode_change_icon
        # and style_name labels — e.g. Operate (Defense Mode / Attack Mode)
        if len(deduped_base) > 1 and not override.get("modes"):
            if any(e.get("show_mode_change_icon") for e in deduped_base):
                labels = [e.get("style_name", {}).get("en-US") for e in deduped_base]
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
    raw_source = override.get("_source")
    if raw_source:
        entry["source"] = [raw_source] if isinstance(raw_source, str) else raw_source
    desc = override.get("_description")
    if desc:
        entry["description"] = desc

    return entry


def make_ratchet_entry(beydata: dict, override: dict) -> dict:
    """Build a beyparts.js ratchet object."""
    stats = beydata["defaultStatus"]
    name = beydata["group_id"]  # ratchet names are already human-readable (e.g. "0-60")
    entry = {
        "name": name,
        "altname": name,
        "points": override.get("points", 1),
        "attack": override.get("attack", stats.get("attack", 0)),
        "defense": override.get("defense", stats.get("defense", 0)),
        "stamina": override.get("stamina", stats.get("stamina", 0)),
        "type": override.get("type", None),
    }
    if override.get("image"):
        entry["image"] = override["image"]
    raw_source = override.get("_source")
    if raw_source:
        entry["source"] = [raw_source] if isinstance(raw_source, str) else raw_source
    desc = override.get("_description")
    if desc:
        entry["description"] = desc
    return entry


def make_bit_entry(beydata: dict, override: dict) -> dict:
    """Build a beyparts.js bit object."""
    stats = beydata["defaultStatus"]
    name = _base_name(beydata["group_id"], override)
    alias = override.get("alias", beydata.get("en_name", beydata["group_id"]))
    modes = override.get("modes")
    if modes:
        entry = {
            "name": name,
            "alias": alias,
            "points": override.get("points", 1),
            "xDash": override.get("xDash", stats.get("dash", 0)),
            "burstResistance": override.get("burstResistance", stats.get("burst", 0)),
            "type": override.get("type", beydata.get("type")),
            "modes": modes,
        }
    else:
        entry = {
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
    if override.get("image"):
        entry["image"] = override["image"]
    raw_source = override.get("_source")
    if raw_source:
        entry["source"] = [raw_source] if isinstance(raw_source, str) else raw_source
    desc = override.get("_description")
    if desc:
        entry["description"] = desc
    return entry


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

    raw_source = override.get("_source")
    if raw_source:
        entry["source"] = [raw_source] if isinstance(raw_source, str) else raw_source
    desc = override.get("_description")
    if desc:
        entry["description"] = desc

    return entry


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
    if override.get("image"):
        entry["image"] = override["image"]
    raw_source = override.get("_source")
    if raw_source:
        entry["source"] = [raw_source] if isinstance(raw_source, str) else raw_source
    desc = override.get("_description")
    if desc:
        entry["description"] = desc
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
    raw_source = override.get("_source")
    if raw_source:
        entry["source"] = [raw_source] if isinstance(raw_source, str) else raw_source
    desc = override.get("_description")
    if desc:
        entry["description"] = desc
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


def make_integrated_ratchet_entry(name: str, override: dict) -> dict:
    """Build a beyparts.js ratchet entry for a ratchet-integrated bit."""
    return {
        "name": name,
        "altname": "",
        "points": override.get("points", 0),
        "attack": override.get("attack", 0),
        "defense": override.get("defense", 0),
        "stamina": override.get("stamina", 0),
        "integratedBit": override["_integratedBit"],
    }


def serialize_to_js(blades: list, assist_blades: list, ratchets: list, bits: list, lock_chips: list, over_blades: list) -> str:
    """Produce the full beyparts.js file content."""
    def fmt_array(items):
        if not items:
            return "[]"
        lines = []
        for item in items:
            lines.append(f"    {_js_object(item, indent=4)},")
        return "[\n" + "\n".join(lines) + "\n  ]"

    ratchets_js = fmt_array(ratchets)

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


def _four_part_model_names(metal_blades: list) -> set:
    """Return model_names of 4-part CX assemblies from BeybladePartsMetalBlade.
    Used to exclude corresponding MainBlade base-body entries from the blade list."""
    # MetalBlade and MainBlade entries for the same 4-part assembly share the same
    # model_name (e.g. "CX15_RagnaRageFE4-55Y"). Use this to exclude the MainBlade
    # base-body entries when building the blade list.
    return {e.get("model_name", "") for e in metal_blades}


# ---------------------------------------------------------------------------
# Interactive prompting for new entries
# ---------------------------------------------------------------------------

def prompt_new_entries(beydata: dict, path: Path) -> None:
    """Find beydata entries not yet in parts-overrides.json and interactively prompt to add them."""
    if not sys.stdin.isatty():
        return

    raw = json.loads(path.read_text(encoding="utf-8"))
    changed = False

    exclude_blade_ids = (
        _cx_assembly_ids(beydata["blades"])
        | _mislabeled_blade_ids(beydata["blades"])
    )

    categories = [
        ("blades",      [e for e in beydata["blades"] if e.get("group_id") not in exclude_blade_ids], False),
        ("mainBlades",  beydata["mainBlades"],   False),
        ("assistBlades",beydata["assistBlades"], False),
        ("ratchets",    beydata["ratchets"],     False),
        ("bits",        beydata["bits"],         False),
        ("lockChips",   beydata["lockChips"],    True),
        ("metalBlades", beydata["metalBlades"],  False),
        ("overBlades",  beydata["overBlades"],   False),
    ]

    try:
        for override_key, entries, use_en_name_fallback in categories:
            existing = raw.get(override_key, {})

            seen: set[str] = set()
            new_items: list[tuple[str, dict]] = []
            for entry in entries:
                if "_ModeChange" in entry.get("model_name", ""):
                    continue
                gid = entry.get("group_id", "").strip()
                if use_en_name_fallback and not gid:
                    gid = entry.get("en_name", "").strip()
                if not gid or gid in seen or gid in PLACEHOLDER_NAMES:
                    continue
                seen.add(gid)
                # Use en_name as the override key (more reliable than group_id)
                en = entry.get("en_name", "").strip()
                entry_key = en if en else gid
                if entry_key not in existing and gid not in existing:
                    new_items.append((entry_key, entry))

            if not new_items:
                continue

            print(f"\n{'='*60}")
            print(f"Category: {override_key} — {len(new_items)} new item(s)")
            print(f"{'='*60}")

            quit_all = False
            for gid, entry in new_items:
                en_name = entry.get("en_name", gid)
                desc_full = _extract_description(entry)
                src, desc = _split_source_desc(desc_full) if desc_full else (None, None)

                print(f"\n  group_id : {gid}")
                print(f"  en_name  : {en_name}")
                print(f"  source   : {src or '(none in beydata)'}")
                if desc:
                    print(f"  desc     : {desc[:100]}{'...' if len(desc) > 100 else ''}")
                else:
                    print(f"  desc     : (none in beydata)")

                while True:
                    ans = input("  Add to overrides? [y/N/q(uit)] ").strip().lower()
                    if ans in ("y", "yes"):
                        default_name = en_name.title()
                        name_input = input(f"  Name [{default_name}]: ").strip()
                        name = name_input if name_input else default_name
                        new_entry: dict = {"name": name}
                        if src:
                            new_entry["_source"] = [src]
                        if desc:
                            new_entry["_description"] = desc
                        raw.setdefault(override_key, {})[gid] = new_entry
                        changed = True
                        print(f"  Added.")
                        break
                    elif ans in ("q", "quit"):
                        quit_all = True
                        break
                    else:
                        print(f"  Skipped.")
                        break

                if quit_all:
                    break

            if quit_all:
                break

    except KeyboardInterrupt:
        print()

    if changed:
        path.write_text(json.dumps(raw, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\nSaved new entries to {path}")
    else:
        print("\nNo new entries added.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

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
    metal_blade_overrides = overrides["metalBlades"]
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
    integrated_ratchets = [
        make_integrated_ratchet_entry(name, ov)
        for name, ov in overrides["ratchets"].items()
        if "_integratedBit" in ov
    ]
    processed_ratchets = process_entries(beydata["ratchets"], overrides["ratchets"])
    ratchets = integrated_ratchets + [make_ratchet_entry(e, e.get("_override", {})) for e in processed_ratchets]

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
    over_blade_overrides = overrides["overBlades"]
    processed_over = process_entries(beydata["overBlades"], over_blade_overrides)
    over_blades = [make_over_blade_entry(e, e.get("_override", {})) for e in processed_over]

    js_content = serialize_to_js(blades, assist_blades, ratchets, bits, lock_chips, over_blades)
    OUTPUT_PATH.write_text(js_content, encoding="utf-8")
    print(f"Written: {OUTPUT_PATH}")
    print(f"  blades: {len(blades)}, assist_blades: {len(assist_blades)}, ratchets: {len(ratchets)}, bits: {len(bits)}, lock_chips: {len(lock_chips)}, over_blades: {len(over_blades)}")


def enrich_overrides_with_descriptions(beydata: dict, overrides: dict, path: Path) -> None:
    """Write _source and _description fields into parts-overrides.json for existing entries
    that have an en-US description in beydata. Splits 'Included in X. Y.' into separate
    _source / _description fields. Only adds or updates — never removes."""
    category_sources = {
        "blades": beydata["blades"] + beydata["mainBlades"],
        "mainBlades": beydata["mainBlades"],
        "assistBlades": beydata["assistBlades"],
        "ratchets": beydata["ratchets"],
        "bits": beydata["bits"],
        "metalBlades": beydata["metalBlades"],
        "overBlades": beydata["overBlades"],
    }

    raw = json.loads(path.read_text(encoding="utf-8"))
    changed = False
    for category, sources in category_sources.items():
        # Collect all sources and the first clean description per override key (en_name preferred)
        all_sources: dict[str, list[str]] = {}
        first_desc: dict[str, str] = {}
        for entry in sources:
            gid = entry.get("group_id", "").strip()
            if not gid:
                continue
            en = entry.get("en_name", "").strip()
            gid = en if en else gid
            full = _extract_description(entry)
            if not full:
                continue
            src, desc = _split_source_desc(full)
            if src:
                bucket = all_sources.setdefault(gid, [])
                if src not in bucket:
                    bucket.append(src)
            if gid not in first_desc:
                first_desc[gid] = desc or full

        for group_id, override in raw.get(category, {}).items():
            new_srcs = all_sources.get(group_id, [])
            if new_srcs:
                existing = override.get("_source", [])
                if isinstance(existing, str):
                    existing = [existing]
                merged = existing + [s for s in new_srcs if s not in existing]
                if merged != existing or not isinstance(override.get("_source"), list):
                    override["_source"] = merged
                    changed = True
            clean_desc = first_desc.get(group_id)
            if clean_desc and override.get("_description") != clean_desc:
                override["_description"] = clean_desc
                changed = True

    if changed:
        path.write_text(json.dumps(raw, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Updated: {path} (split _source / _description fields)")


if __name__ == "__main__":
    main()
