import json


def main():
    bits = set()
    with open("beydata/BeybladePartsBit.json") as f:
        json_data = json.load(f)

    for item in json_data:
        bits.add(item["group_id"])

    print((bits))


comp = main()
