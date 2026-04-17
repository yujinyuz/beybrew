import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from generate_parts import process_entries, make_blade_entry, make_ratchet_entry, make_bit_entry, make_assist_blade_entry


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
    """The _ModeChange variant gets altname set to 'Name (Mode Change)'."""
    entries = [
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z",
         "defaultStatus": {"attack": 25, "defense": 55, "stamina": 30}},
        {"group_id": "SCORPIOSPEAR", "en_name": "SCORPIOSPEAR", "type": "balance",
         "show_mode_change_icon": True, "model_name": "UX14_ScorpioSpear0-70Z_ModeChange",
         "defaultStatus": {"attack": 55, "defense": 25, "stamina": 30}},
    ]
    overrides = {"SCORPIOSPEAR": {"name": "Scorpio Spear", "image": "ScorpioSpear.webp", "points": 2}}
    result = process_entries(entries, overrides=overrides)
    names = [e.get("altname") for e in result]
    assert "Scorpio Spear (Mode Change)" in names


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


def test_blade_entry_missing_image_returns_none(capsys):
    """Blade with no image in overrides returns None and prints a warning."""
    beydata = {"group_id": "WOLFHUNT", "en_name": "WOLFHUNTF", "type": "stamina",
               "show_mode_change_icon": False, "model_name": "CX10_WolfHuntF0-60DB",
               "defaultStatus": {"attack": 25, "defense": 30, "stamina": 55}}
    result = make_blade_entry(beydata, override={})
    captured = capsys.readouterr()
    assert result is None
    assert "WOLFHUNT" in captured.err


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

def test_assist_blade_missing_image_returns_none(capsys):
    """Assist blade without image returns None and prints a warning."""
    beydata = {"group_id": "SLASH", "en_name": "S", "type": "attack",
               "model_name": "AssistBladeSlash",
               "defaultStatus": {"attack": 20, "defense": 10, "stamina": 10}}
    result = make_assist_blade_entry(beydata, override={})
    captured = capsys.readouterr()
    assert result is None
    assert "SLASH" in captured.err


def test_assist_blade_alias_from_override():
    """Assist blade alias comes from override."""
    beydata = {"group_id": "SLASH", "en_name": "S", "type": "attack",
               "model_name": "AssistBladeSlash",
               "defaultStatus": {"attack": 20, "defense": 10, "stamina": 10}}
    override = {"name": "Slash", "alias": "S", "image": "AssistBladeSlash.webp"}
    entry = make_assist_blade_entry(beydata, override)
    assert entry["alias"] == "S"
    assert entry["image"] == "AssistBladeSlash.webp"
