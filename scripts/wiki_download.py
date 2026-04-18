#!/usr/bin/env python3
"""
Download a part image from a beyblade.fandom.com wiki URL.

Usage:
    python scripts/wiki_download.py <wiki-url>
    python scripts/wiki_download.py  # prompts for URL

If multiple images are on the page, lists them so you can pick.
"""

import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent.parent
IMG_DIR = ROOT / "public" / "images"
HEADERS = {"User-Agent": "Mozilla/5.0"}
API = "https://beyblade.fandom.com/api.php"


def api_get(params: dict) -> dict:
    qs = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{API}?{qs}", headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as r, open(dest, "wb") as f:
        f.write(r.read())


def clean_image_url(thumb_url: str) -> str:
    return thumb_url.split("/scale-to-width-down")[0].split("/revision/latest")[0] + "/revision/latest"


def page_title_from_url(url: str) -> str:
    path = urllib.parse.urlparse(url).path
    title = path.split("/wiki/")[-1]
    return urllib.parse.unquote(title).replace("_", " ")


def list_page_images(title: str) -> list[str]:
    data = api_get({"action": "query", "titles": title, "prop": "images", "imlimit": "50", "format": "json"})
    pages = data["query"]["pages"]
    for page in pages.values():
        return [img["title"].removeprefix("File:") for img in page.get("images", [])]
    return []


def get_image_url(filename: str) -> str | None:
    data = api_get({
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json",
    })
    for page in data["query"]["pages"].values():
        info = page.get("imageinfo", [])
        if info:
            return info[0]["url"]
    return None


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else input("Wiki URL: ").strip()
    title = page_title_from_url(url)
    print(f"Page: {title}")

    # Get main page image
    data = api_get({"action": "query", "titles": title, "prop": "pageimages", "pithumbsize": "500", "format": "json"})
    pages = data["query"]["pages"]
    main_image = None
    main_url = None
    for page in pages.values():
        main_image = page.get("pageimage")
        thumb = page.get("thumbnail", {}).get("source", "")
        if thumb:
            main_url = clean_image_url(thumb)

    # List all images on the page
    all_images = list_page_images(title)
    IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    blade_images = [i for i in all_images if Path(i).suffix.lower() in IMAGE_EXTS]

    if len(blade_images) > 1:
        print(f"\nFound {len(blade_images)} images on this page:")
        for i, name in enumerate(blade_images):
            marker = " <-- main" if name == main_image else ""
            print(f"  {i}) {name}{marker}")
        choice = input("\nEnter numbers to download (comma-separated, 'all', or Enter = main): ").strip()

        if choice.lower() == "all":
            chosen_images = blade_images
        elif choice:
            indices = [int(x.strip()) for x in choice.split(",") if x.strip().isdigit()]
            chosen_images = [blade_images[i] for i in indices if i < len(blade_images)]
        elif main_image:
            chosen_images = [(main_image, main_url)]  # type: ignore[assignment]
        else:
            print("No image found.")
            return
    elif main_image:
        chosen_images = [main_image]
    else:
        print("No image found on this page.")
        return

    # Resolve (name, url) pairs
    to_download: list[tuple[str, str]] = []
    for item in chosen_images:
        if isinstance(item, tuple):
            to_download.append(item)
        else:
            name = item
            url = main_url if name == main_image and main_url else get_image_url(name)
            if url:
                to_download.append((name, url))
            else:
                print(f"Could not resolve URL for {name}, skipping.")

    for img_name, img_url in to_download:
        dest = IMG_DIR / img_name
        if dest.exists():
            overwrite = input(f"{img_name} already exists. Overwrite? [y/N] ").strip().lower()
            if overwrite != "y":
                print(f"Skipped {img_name}.")
                continue
        print(f"Downloading {img_name} ...", end=" ", flush=True)
        download(img_url, dest)
        size_kb = dest.stat().st_size // 1024
        print(f"OK ({size_kb}KB) → public/images/{img_name}")

    if to_download:
        print("\nAdd to beyparts.js:")
        for img_name, _ in to_download:
            print(f'  image: "{img_name}"')


if __name__ == "__main__":
    main()
