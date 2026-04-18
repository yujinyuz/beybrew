import json

"""
BeybladePartsBit
BeybladePartsBlade
    - en_name: we will use this together with group_id
             : we would probably want to display where players can get this blade
    - group_id: we will use this for the name of the blade
    - tags
    - collection_order: we will use this order_by for release
    - release_at: release date
    - series_name: to identify whether BX, UX, or CX
    - model_name: used to identify mode change
    - type: for the blade type
    - description: contains where this part can be obtained
    - defaultStatus
        rotation
        attack
        defense
        stamina
        height
        dash
        burst
        weight
    - updateStatus: sarme fields with defaultStatus but
    - show_mode_change_icon: used to deterimine if a part status changes



BeybladePartsMainBlade
BeybladePartsAssistBlade
BeybladePartsLockChip
BeybladePartsRatchet
"""


def main():
    with open("decoded_master_data.json") as f:
        json_data = json.load(f)

    data = json_data["data"]
    print(data["BeybladePartsMainBlade"])

    return data


comp = main()
