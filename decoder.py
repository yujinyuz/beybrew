"""
Decodes MasterData.json and writes per-category JSON files to beydata/.

Source file on device:
  Android/data/jp.co.takaratomy.beyblade/files/MasterData.json
"""

import json
import sys
from datetime import datetime
from pathlib import Path

PARTS = ["Blade", "Ratchet", "Bit", "MainBlade", "AssistBlade"]

STRIP_FIELDS = {
    "collection_visible",
    "deck_configurable",
    "dummy_parts",
    "parts_customize_type",
    "first_reward_id",
    "next_reward_id",
    "ruby",
    "yomi",
    "model_blade_y_offset",
    "model_ratchet_angle_offset",
    "description_rotation_left",
    "style_name",
    "invalid",
    "package_id",
}

FILTER_GROUP_ID = None


def decode(input_path: str, filter_group_id: str | None = None) -> None:
    with open(input_path, encoding="utf-8") as f:
        master_data_str = json.load(f).get("masterData")

    if not master_data_str:
        print("masterData key missing or empty", file=sys.stderr)
        return

    data = json.loads(master_data_str)["data"]

    for part in PARTS:
        items = data[f"BeybladeParts{part}"]

        if filter_group_id:
            items = [x for x in items if x["group_id"] == filter_group_id]

        items = [{k: v for k, v in item.items() if k not in STRIP_FIELDS} for item in items]

        items.sort(
            key=lambda item: datetime.fromisoformat(item["release_at"].replace("Z", "+00:00")),
            reverse=True,
        )

        if filter_group_id:
            out_path = Path("beydata/filtered") / f"BeybladeParts{part}_filtered_{filter_group_id}.json"
            out_path.parent.mkdir(parents=True, exist_ok=True)
        else:
            out_path = Path("beydata") / f"BeybladeParts{part}.json"

        with open(out_path, "w") as f:
            json.dump(items, f, indent=4)

        print(f"Written: {out_path} ({len(items)} items)")


if __name__ == "__main__":
    decode("MasterData.json", filter_group_id=FILTER_GROUP_ID)
