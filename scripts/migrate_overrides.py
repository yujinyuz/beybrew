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
