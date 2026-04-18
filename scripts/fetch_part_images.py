#!/usr/bin/env python3
"""
Download Beyblade X part images from beyblade.fandom.com.
Skips images that already exist unless --force is given.
Updates src/data/parts-overrides.json with new filenames.

Usage:
    python scripts/fetch_part_images.py           # download missing only
    python scripts/fetch_part_images.py --force   # re-download all, delete old
    python scripts/fetch_part_images.py --dry-run # preview changes
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent.parent
IMG_DIR = ROOT / "public" / "images"
OVERRIDES_PATH = ROOT / "src" / "data" / "parts-overrides.json"

# Never delete these
PRESERVE = {
    "attack.png", "balance.png", "defense.png", "stamina.png",
    "gcash-qr.jpg", "left-spin.png", "right-spin.png",
    "BladeUnknown.svg", "RatchetBitOperate.webp",
}

HEADERS = {"User-Agent": "Mozilla/5.0"}
API = "https://beyblade.fandom.com/api.php"
WIKI_STATIC = "https://static.wikia.nocookie.net"

DRY_RUN = "--dry-run" in sys.argv
FORCE = "--force" in sys.argv


def wiki_titles_for_overrides(overrides: dict) -> list[tuple]:
    """
    Build list of (category, key, wiki_page_title) for all parts with images.
    Returns only parts that have non-BladeUnknown images currently.
    """
    tasks = []

    # --- Blades ---
    blade_special = {
        "L-DRAGO": "Blade_-_Lightning_L-Drago_(Upper_Type)",
        "CROC CRUNCH": "Blade_-_Bite_Croc",
        "BEARSCRATCH": "BearScratch_5-60F",
        "SAMURAI SABER": "Blade_-_SamuraiSaber",
        "TUSK MAMMOTH": "Blade_-_Tusk_Mammoth",
        "YELL KONG": "Blade_-_Yell_Kong",
        # Wiki uses reversed/different names for these parts
        "PTERASWING": "Blade_-_Talon_Ptera",
        "SHINOBIKNIFE": "Blade_-_Knife_Shinobi",
        "SHARKGILL": "Blade_-_Gill_Shark",
        "GOATTACKLE": "Blade_-_Tackle_Goat",
        "SAMURAISTEEL": "Steel_Samurai_4-80T",
        "WYVERNHOVER": "Blade_-_Hover_Wyvern",
        "ROCKLEONE": "Blade_-_Rock_Leone",
        "TYRANNOROAR": "Blade_-_Roar_Tyranno",
    }
    for key, entry in overrides.get("blades", {}).items():
        img = entry.get("image", "")
        if not img or img == "BladeUnknown.svg":
            continue
        if key in blade_special:
            wiki_title = blade_special[key]
        else:
            name = entry.get("name", key)
            wiki_title = "Blade_-_" + name.replace(" ", "")
        tasks.append(("blades", key, wiki_title))

    # --- Main Blades ---
    for key, entry in overrides.get("mainBlades", {}).items():
        img = entry.get("image", "")
        if not img or img == "BladeUnknown.svg":
            continue
        name = entry.get("name", key.title())
        wiki_title = "Main_Blade_-_" + name
        tasks.append(("mainBlades", key, wiki_title))

    # --- Assist Blades ---
    for key, entry in overrides.get("assistBlades", {}).items():
        img = entry.get("image", "")
        if not img or img == "BladeUnknown.svg":
            continue
        name = entry.get("name", key)
        wiki_title = "Assist_Blade_-_" + name
        tasks.append(("assistBlades", key, wiki_title))

    # --- Lock Chips ---
    for key, entry in overrides.get("lockChips", {}).items():
        img = entry.get("image", "")
        if not img or img == "BladeUnknown.svg":
            continue
        name = entry.get("name", key.title())
        wiki_title = "Lock_Chip_-_" + name
        tasks.append(("lockChips", key, wiki_title))

    return tasks


def batch_query_images(titles: list[str]) -> dict[str, dict]:
    """Query wiki API for page images in batches of 50. Returns {title: {pageimage, url}}."""
    results = {}
    batch_size = 50
    for i in range(0, len(titles), batch_size):
        batch = titles[i : i + batch_size]
        joined = "%7C".join(urllib.parse.quote(t, safe="_()-") for t in batch)
        url = f"{API}?action=query&titles={joined}&prop=pageimages&pithumbsize=500&format=json"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req) as r:
            data = json.load(r)

        redirects = {v: k for k, v in data.get("query", {}).get("redirects", {}).items() if isinstance(k, str)}
        normalized = {v: k for v, k in [(n.get("to"), n.get("from")) for n in data.get("query", {}).get("normalized", [])]}

        for _pid, page in data["query"]["pages"].items():
            title = page["title"]
            # MediaWiki normalizes underscores to spaces; store with underscores to match request titles
            title_key = title.replace(" ", "_")
            pageimage = page.get("pageimage")
            thumb_url = page.get("thumbnail", {}).get("source", "")
            if pageimage and thumb_url:
                clean_url = thumb_url.split("/scale-to-width-down")[0].split("/revision/latest")[0] + "/revision/latest"
                results[title_key] = {"pageimage": pageimage, "url": clean_url}
            else:
                results[title_key] = {"pageimage": None, "url": None}
        time.sleep(0.2)
    return results


def download_image(url: str, dest_path: Path) -> bool:
    """Download image from url to dest_path. Returns True on success."""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req) as r, open(dest_path, "wb") as f:
            f.write(r.read())
        return True
    except Exception as e:
        print(f"    ERROR downloading {url}: {e}")
        return False


def ext_from_filename(filename: str) -> str:
    return Path(filename).suffix.lower()


def main():
    with open(OVERRIDES_PATH, encoding="utf-8") as f:
        overrides = json.load(f)

    tasks = wiki_titles_for_overrides(overrides)
    print(f"Found {len(tasks)} parts with images to update")

    # Query wiki for all titles
    all_titles = [t for _, _, t in tasks]
    print(f"Querying wiki API for {len(all_titles)} page titles...")
    image_data = batch_query_images(all_titles)

    # Report which titles had no image
    missing = [(cat, key, title) for cat, key, title in tasks if not image_data.get(title, {}).get("pageimage")]
    if missing:
        print(f"\n{len(missing)} parts had no wiki image:")
        for cat, key, title in missing:
            print(f"  [{cat}] {key} -> {title}")

    # Build download plan: (category, key, wiki_pageimage, download_url, new_filename)
    plan = []
    for cat, key, wiki_title in tasks:
        info = image_data.get(wiki_title, {})
        if not info.get("pageimage"):
            continue
        pageimage = info["pageimage"]
        url = info["url"]
        ext = ext_from_filename(pageimage)
        # Use wiki's canonical filename (pageimage field)
        new_filename = pageimage
        plan.append((cat, key, wiki_title, url, new_filename))

    print(f"\nWill download {len(plan)} images")

    # Filter plan: skip already-downloaded images unless --force
    if not FORCE:
        skipped = [(cat, key, wt, url, fn) for cat, key, wt, url, fn in plan if (IMG_DIR / fn).exists()]
        plan = [(cat, key, wt, url, fn) for cat, key, wt, url, fn in plan if not (IMG_DIR / fn).exists()]
        if skipped:
            print(f"Skipping {len(skipped)} already-downloaded images (use --force to re-download)")

    if DRY_RUN:
        print("\n--- DRY RUN ---")
        for cat, key, wiki_title, url, new_filename in plan:
            old_filename = overrides[cat][key].get("image", "")
            status = "(new)" if old_filename == new_filename else f"{old_filename!r} ->"
            print(f"  [{cat}] {key}: {status} {new_filename!r}")
        return

    # --force: delete old part images before downloading fresh ones
    if FORCE:
        new_filenames = {item[4] for item in plan}
        images_to_delete = [
            fname for fname in os.listdir(IMG_DIR)
            if fname not in PRESERVE and fname not in new_filenames
        ]
        print(f"\nDeleting {len(images_to_delete)} old images...")
        for fname in sorted(images_to_delete):
            fpath = IMG_DIR / fname
            if fpath.exists():
                os.remove(fpath)
                print(f"  deleted: {fname}")

    # Download images and update overrides
    print(f"\nDownloading {len(plan)} images...")
    updated_overrides = json.loads(json.dumps(overrides))  # deep copy

    for cat, key, wiki_title, url, new_filename in plan:
        dest = IMG_DIR / new_filename
        print(f"  [{cat}] {key}: {new_filename}", end=" ... ", flush=True)
        if download_image(url, dest):
            print("OK")
            updated_overrides[cat][key]["image"] = new_filename
        else:
            print("FAILED")
        time.sleep(0.1)

    # Save updated overrides
    with open(OVERRIDES_PATH, "w", encoding="utf-8") as f:
        json.dump(updated_overrides, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\nUpdated: {OVERRIDES_PATH}")
    print("Run: python scripts/generate_parts.py  to regenerate beyparts.js")


if __name__ == "__main__":
    main()
