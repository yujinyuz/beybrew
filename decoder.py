"""
Android > data > jp.co.takaratomy.beyblade > files > MasterData.json
"""

import json
from datetime import datetime

# FILTER_GROUP_ID = "CRIMSONGARUDA"
FILTER_GROUP_ID = None


def extract_and_decode_master_data(input_path, output_path):
    try:
        with open(input_path, "r", encoding="utf-8") as file:
            original_data = json.load(file)

        master_data_str = original_data.get("masterData")
        if not master_data_str:
            print("No 'masterData' key found or it's empty.")
            return

        try:
            decoded_data = json.loads(master_data_str)
        except json.JSONDecodeError as e:
            print(f"Failed to decode 'masterData' string as JSON: {e}")
            return

        # with open(output_path, "w", encoding="utf-8") as outfile:
        #     json.dump(decoded_data, outfile, indent=4)

        # BeybladePartsBlade

        parts = [
            "Blade",
            "Ratchet",
            "Bit",
            "MainBlade",
            "AssistBlade",
        ]

        for part in parts:
            part_data = decoded_data["data"][f"BeybladeParts{part}"]

            if FILTER_GROUP_ID is not None:
                part_data = filter(
                    lambda x: x["group_id"] == FILTER_GROUP_ID, part_data
                )

            part_data = sorted(part_data, key=lambda x: x["collection_order"])

            not_useful_fields = [
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
            ]

            new_part_data = []
            for item in part_data:
                for field_name in not_useful_fields:
                    item.pop(field_name, None)

                # item["release_at"] = datetime.fromisoformat(
                #     item["release_at"].replace("Z", "+00:00")
                # )
                new_part_data.append(item)

            file_name = f"beydata/BeybladeParts{part}"
            if FILTER_GROUP_ID:
                file_name = (
                    f"beydata/filtered/BeybladeParts{part}_filtered_{FILTER_GROUP_ID}"
                )

            sorted_data = sorted(
                new_part_data,
                key=lambda item: datetime.fromisoformat(
                    item["release_at"].replace("Z", "+00:00")
                ),
                reverse=True,
            )

            # sorted_data = sorted(
            #     new_part_data, key=lambda item: item["collection_order"], reverse=True
            # )

            with open(f"{file_name}.json", "w") as outfile:
                json.dump(sorted_data, outfile, indent=4)

        print(f"Decoded masterData written to {output_path}")

    except FileNotFoundError:
        print(f"File not found: {input_path}")
    except json.JSONDecodeError as e:
        print(f"Error decoding original JSON file: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

    # TODO: Merge the parts
    # main blade, assist blade, ... via model_name
    # we want to be able to create a sort of graph in which we could easily determine where can get each part


# Example usage
if __name__ == "__main__":
    extract_and_decode_master_data("MasterData.json", "decoded_master_data.json")
