import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from generate_parts import (
    process_entries, make_blade_entry, make_ratchet_entry,
    make_bit_entry, make_assist_blade_entry, _js_val,
)


# --- process_entries ---

def test_deduplicates_identical_stats():
    """Color variants (same group_id, identical stats) collapse to one entry."""
    entries = [
        {"group_id": "DRANBUSTER", "en_name": "DRANBUSTER", "type": "attack",
         "show_mode_change_icon": False, "model_name": "BX_DranBuster1-60A",
         "defaultStatus": {"attack": 70, "defense": 20, "stamina": 10}},
        {"group_id": "DRANBUSTER", "en_name": "DRANBUSTER", "type": "attack",
         "show_mode_change_icon": False, "model_name": "BX_DranBuster1-60A_blue",
         "defaultStatus": {"attack": 70, "defense": 20, "stamina": 10}},
    ]
    result = process_entries(entries, overrides={})
    assert len(result) == 1


def test_keeps_mode_change_variants():
    """Different stats + show_mode_change_icon → two separate entries."""
    entries = [
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
         "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30}},
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z_ModeChange",
         "defaultStatus": {"attack": 55, "defense": 25, "stamina": 30}},
    ]
    result = process_entries(entries, overrides={})
    assert len(result) == 2


def test_mode_change_entry_gets_altname():
    """The _ModeChange variant produces an entry with altname set by make_blade_entry."""
    entries = [
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
         "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30}},
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z_ModeChange",
         "defaultStatus": {"attack": 55, "defense": 25, "stamina": 30}},
    ]
    overrides = {"SCORPIOSPEAR": {"name": "Scorpio Spear", "image": "ScorpioSpear.webp", "points": 2}}
    processed = process_entries(entries, overrides=overrides)
    mc_entry = next(e for e in processed if e.get("_is_mode_change"))
    result = make_blade_entry(mc_entry, mc_entry.get("_override", {}))
    assert result["altname"] == "Scorpio Spear (Mode Change)"


def test_process_entries_skips_mode_change_when_override_has_modes():
    """When override has a modes array, _ModeChange beydata entries are not emitted."""
    entries = [
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
         "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30}},
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z_ModeChange",
         "defaultStatus": {"attack": 55, "defense": 25, "stamina": 30}},
    ]
    overrides = {
        "SCORPIOSPEAR": {
            "name": "Scorpio Spear", "image": "ScorpioSpear.webp", "points": 2,
            "modes": [
                {"label": "Defense", "attack": 25, "defense": 55, "stamina": 30},
                {"label": "Attack", "attack": 55, "defense": 25, "stamina": 30},
            ],
        }
    }
    result = process_entries(entries, overrides)
    assert len(result) == 1
    assert not result[0].get("_is_mode_change")


# --- make_blade_entry ---

def test_blade_entry_auto_derives_stats():
    """attack/defense/stamina/type come from defaultStatus and type fields."""
    beydata = {"group_id": "DRANBUSTER", "en_name": "DRANBUSTER", "type": "attack",
               "show_mode_change_icon": False, "model_name": "BX_DranBuster1-60A",
               "defaultStatus": {"attack": 70, "defense": 20, "stamina": 10}}
    override = {"name": "Dran Buster", "points": 3, "image": "Dran_Buster_1-60A.webp"}
    entry = make_blade_entry(beydata, override)
    assert entry["attack"] == 70
    assert entry["defense"] == 20
    assert entry["stamina"] == 10
    assert entry["type"] == "attack"


def test_blade_entry_points_default_to_one():
    """Points defaults to 1 when not in overrides."""
    beydata = {"group_id": "WOLFHUNT", "en_name": "WOLFHUNTF", "type": "stamina",
               "show_mode_change_icon": False, "model_name": "CX10_WolfHuntF0-60DB",
               "defaultStatus": {"attack": 25, "defense": 30, "stamina": 55}}
    override = {"name": "Wolf Hunt", "image": "WolfHunt_0-60DB.webp"}
    entry = make_blade_entry(beydata, override)
    assert entry["points"] == 1


def test_blade_entry_override_wins_for_stats():
    """An override stat value takes precedence over beydata."""
    beydata = {"group_id": "WOLFHUNT", "en_name": "WOLFHUNTF", "type": "stamina",
               "show_mode_change_icon": False, "model_name": "CX10_WolfHuntF0-60DB",
               "defaultStatus": {"attack": 25, "defense": 30, "stamina": 55}}
    override = {"name": "Wolf Hunt", "image": "WolfHunt_0-60DB.webp", "attack": 99}
    entry = make_blade_entry(beydata, override)
    assert entry["attack"] == 99


def test_blade_entry_uses_default_image_when_missing():
    beydata = {"type": "attack", "_is_mode_change": False, "group_id": "TESTBLADE",
               "defaultStatus": {"attack": 0, "defense": 0, "stamina": 0}}
    override = {"name": "TestBlade", "points": 1}
    result = make_blade_entry(beydata, override)
    assert result is not None
    assert result["image"] == "BladeUnknown.svg"


def test_blade_entry_hasbro_flag():
    """hasbro flag from overrides is included in entry."""
    beydata = {"group_id": "WYVERNHOVER", "en_name": "WYVERNHOVER", "type": "defense",
               "show_mode_change_icon": False, "model_name": "Hover_Wyvern",
               "defaultStatus": {"attack": 13, "defense": 60, "stamina": 27}}
    override = {"name": "Wyvern Hover", "points": 3, "image": "Hover_Wyvern_Takara.webp", "hasbro": True}
    entry = make_blade_entry(beydata, override)
    assert entry.get("hasbro") is True


def test_blade_entry_spintype_flag():
    """spinType from overrides is included in entry."""
    beydata = {"group_id": "COBALTDRAGOON", "en_name": "COBALTDRAGOON", "type": "attack",
               "show_mode_change_icon": False, "model_name": "BX_CobaltDragoon2-60C",
               "defaultStatus": {"attack": 60, "defense": 15, "stamina": 25}}
    override = {"name": "Cobalt Dragoon", "points": 3, "image": "Cobalt_Dragoon_2-60C.webp", "spinType": "left"}
    entry = make_blade_entry(beydata, override)
    assert entry.get("spinType") == "left"


def test_blade_entry_with_modes_preserves_optional_fields():
    """line, hasbro, and spinType are appended after the modes branch."""
    beydata = {"group_id": "TESTBLADE", "en_name": "TESTBLADE", "type": "attack",
               "_is_mode_change": False,
               "defaultStatus": {"attack": 30, "defense": 20, "stamina": 10}}
    override = {
        "name": "TestBlade",
        "points": 1,
        "image": "TestBlade.png",
        "line": "CX",
        "spinType": "right",
        "hasbro": True,
        "modes": [{"label": "Upper", "attack": 30, "defense": 20, "stamina": 10}],
    }
    result = make_blade_entry(beydata, override)
    assert result["line"] == "CX"
    assert result.get("spinType") == "right"
    assert result.get("hasbro") is True


# --- make_ratchet_entry ---

def test_ratchet_entry_stats_from_beydata():
    """Ratchet attack/defense/stamina from defaultStatus."""
    beydata = {"group_id": "0-60", "en_name": "0-60", "type": None,
               "model_name": "CX10_WolfHuntF0-60DB",
               "defaultStatus": {"attack": 3, "defense": 14, "stamina": 13}}
    override = {"points": 1}
    entry = make_ratchet_entry(beydata, override)
    assert entry["name"] == "0-60"
    assert entry["altname"] == "0-60"
    assert entry["attack"] == 3
    assert entry["defense"] == 14
    assert entry["stamina"] == 13
    assert entry["points"] == 1


# --- make_bit_entry ---

def test_bit_entry_alias_from_en_name():
    """Bit alias comes from en_name when not overridden."""
    beydata = {"group_id": "FB", "en_name": "FB", "type": "stamina",
               "model_name": "BX01_SharkEdge4-50UF",
               "defaultStatus": {"attack": 10, "defense": 25, "stamina": 60, "dash": 5, "burst": 30}}
    entry = make_bit_entry(beydata, override={})
    assert entry["alias"] == "FB"


def test_bit_entry_xdash_and_burst_resistance():
    """xDash comes from dash, burstResistance from burst in defaultStatus."""
    beydata = {"group_id": "A", "en_name": "A", "type": "attack",
               "model_name": "BX01_SharkEdge4-50UF",
               "defaultStatus": {"attack": 40, "defense": 10, "stamina": 10, "dash": 40, "burst": 80}}
    entry = make_bit_entry(beydata, override={"name": "Accel", "points": 1})
    assert entry["xDash"] == 40
    assert entry["burstResistance"] == 80


# --- make_assist_blade_entry ---

def test_assist_blade_uses_default_image_when_missing():
    beydata = {"type": "balance", "_is_mode_change": False, "group_id": "TESTASSIST",
               "en_name": "TA", "defaultStatus": {"attack": 0, "defense": 0, "stamina": 0}}
    override = {"name": "TestAssist", "alias": "TA", "points": 0}
    result = make_assist_blade_entry(beydata, override)
    assert result is not None
    assert result["image"] == "BladeUnknown.svg"


def test_assist_blade_alias_from_override():
    """Assist blade alias comes from override."""
    beydata = {"group_id": "SLASH", "en_name": "S", "type": "attack",
               "model_name": "AssistBladeSlash",
               "defaultStatus": {"attack": 20, "defense": 10, "stamina": 10}}
    override = {"name": "Slash", "alias": "S", "image": "AssistBladeSlash.webp"}
    entry = make_assist_blade_entry(beydata, override)
    assert entry["alias"] == "S"
    assert entry["image"] == "AssistBladeSlash.webp"


# --- _js_val ---

def test_js_val_serializes_list_of_dicts():
    modes = [{"label": "Upper", "attack": 30}, {"label": "Lower", "attack": 20}]
    result = _js_val(modes)
    assert '"label": "Upper"' in result
    assert '"attack": 30' in result
    assert '"label": "Lower"' in result
    assert '"attack": 20' in result


def test_js_val_serializes_nested_dict():
    result = _js_val({"label": "Upper", "attack": 30})
    assert '"label": "Upper"' in result
    assert '"attack": 30' in result


def test_js_val_existing_scalars_unchanged():
    assert _js_val(None) == "null"
    assert _js_val(True) == "true"
    assert _js_val(False) == "false"
    assert _js_val("hello") == '"hello"'
    assert _js_val(42) == "42"


# --- make_blade_entry with modes ---

def test_blade_entry_with_modes_includes_modes_array():
    beydata = {
        "group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
        "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
        "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30},
        "_is_mode_change": False,
    }
    override = {
        "name": "Scorpio Spear", "image": "ScorpioSpear.webp", "points": 2,
        "modes": [
            {"label": "Defense", "attack": 25, "defense": 55, "stamina": 30},
            {"label": "Attack", "attack": 55, "defense": 25, "stamina": 30},
        ],
    }
    entry = make_blade_entry(beydata, override)
    assert "modes" in entry
    assert len(entry["modes"]) == 2
    assert entry["modes"][0]["label"] == "Defense"
    assert entry["modes"][1]["label"] == "Attack"


def test_blade_entry_with_modes_omits_top_level_stats():
    beydata = {
        "group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
        "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
        "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30},
        "_is_mode_change": False,
    }
    override = {
        "name": "Scorpio Spear", "image": "ScorpioSpear.webp", "points": 2,
        "modes": [
            {"label": "Defense", "attack": 25, "defense": 55, "stamina": 30},
            {"label": "Attack", "attack": 55, "defense": 25, "stamina": 30},
        ],
    }
    entry = make_blade_entry(beydata, override)
    assert "attack" not in entry
    assert "defense" not in entry
    assert "stamina" not in entry
    assert "altname" not in entry


# --- make_assist_blade_entry with modes ---

def test_assist_blade_entry_with_modes():
    beydata = {
        "group_id": "D", "en_name": "D", "type": "balance",
        "model_name": "AssistBladeDual_UpperMode",
        "defaultStatus": {"attack": 17, "defense": 13, "stamina": 10},
        "_is_mode_change": False,
    }
    override = {
        "name": "Dual", "image": "AssistBladeDual_(Upper_Mode).png", "alias": "D",
        "modes": [
            {"label": "Upper", "attack": 17, "defense": 13, "stamina": 10},
            {"label": "Lower", "attack": 13, "defense": 17, "stamina": 10},
        ],
    }
    entry = make_assist_blade_entry(beydata, override)
    assert "modes" in entry
    assert len(entry["modes"]) == 2
    assert "attack" not in entry
    assert "defense" not in entry
    assert "stamina" not in entry
    assert "altname" not in entry


def test_blade_entry_includes_description_when_present():
    beydata = {"group_id": "DRANBUSTER", "en_name": "DRANBUSTER", "type": "attack",
               "show_mode_change_icon": False, "model_name": "BX_DranBuster1-60A",
               "defaultStatus": {"attack": 70, "defense": 20, "stamina": 10}}
    override = {"name": "Dran Buster", "points": 3, "image": "DranBuster.png",
                "_description": "Designed specifically for upper attacks."}
    entry = make_blade_entry(beydata, override)
    assert entry["description"] == "Designed specifically for upper attacks."


def test_blade_entry_omits_description_when_absent():
    beydata = {"group_id": "DRANBUSTER", "en_name": "DRANBUSTER", "type": "attack",
               "show_mode_change_icon": False, "model_name": "BX_DranBuster1-60A",
               "defaultStatus": {"attack": 70, "defense": 20, "stamina": 10}}
    override = {"name": "Dran Buster", "points": 3, "image": "DranBuster.png"}
    entry = make_blade_entry(beydata, override)
    assert "description" not in entry


def test_assist_blade_entry_includes_description_when_present():
    beydata = {"group_id": "SLASH", "en_name": "S", "type": "attack",
               "model_name": "AssistBladeSlash",
               "defaultStatus": {"attack": 20, "defense": 10, "stamina": 10}}
    override = {"name": "Slash", "alias": "S", "image": "AssistBladeSlash.webp",
                "_description": "Designed to slash opponents."}
    entry = make_assist_blade_entry(beydata, override)
    assert entry["description"] == "Designed to slash opponents."


def test_ratchet_entry_includes_description_when_present():
    beydata = {"group_id": "3-70", "en_name": "3-70", "type": None,
               "model_name": "Ratchet3-70",
               "defaultStatus": {"attack": 5, "defense": 10, "stamina": 15}}
    override = {"points": 1, "_description": "Sets BEY height to 70mm with three blades."}
    entry = make_ratchet_entry(beydata, override)
    assert entry["description"] == "Sets BEY height to 70mm with three blades."


def test_bit_entry_includes_description_when_present():
    beydata = {"group_id": "F", "en_name": "F", "type": "stamina",
               "model_name": "BitF",
               "defaultStatus": {"attack": 10, "defense": 20, "stamina": 60, "dash": 5, "burst": 30}}
    override = {"name": "Flat", "points": 1, "_description": "Flat tip for aggressive movement."}
    entry = make_bit_entry(beydata, override)
    assert entry["description"] == "Flat tip for aggressive movement."
