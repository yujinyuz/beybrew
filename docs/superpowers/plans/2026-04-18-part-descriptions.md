# Part Descriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emit part descriptions from `parts-overrides.json` into `beyparts.js` and display them as subtle muted text below each `PartSelector` when a part is selected.

**Architecture:** `generate_parts.py` already extracts descriptions from beydata into `_description` fields in `parts-overrides.json`. We add one line per `make_*_entry()` function to pass that through into the JS output. `constants.js` already spreads all JS fields into `BEYBLADE_DB`, so `BEYBLADE_DB[name].description` becomes available automatically. `PartSelector.jsx` reads it and renders a subtitle below the dropdown.

**Tech Stack:** Python (generate_parts.py), React + Tailwind CSS (PartSelector.jsx)

---

### Task 1: Emit `description` from `make_blade_entry`

**Files:**
- Modify: `scripts/generate_parts.py`
- Test: `scripts/tests/test_generate_parts.py`

- [ ] **Step 1: Write failing test**

Add to `scripts/tests/test_generate_parts.py`:

```python
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
uv run pytest scripts/tests/test_generate_parts.py::test_blade_entry_includes_description_when_present scripts/tests/test_generate_parts.py::test_blade_entry_omits_description_when_absent -v
```

Expected: FAIL — `AssertionError` (key not present / not equal)

- [ ] **Step 3: Implement**

In `scripts/generate_parts.py`, in `make_blade_entry`, add after the `line` block (around line 208):

```python
    desc = override.get("_description")
    if desc:
        entry["description"] = desc
```

The full tail of `make_blade_entry` becomes:

```python
    line = override.get("line") or beydata.get("series_name")
    if line:
        entry["line"] = line
    if override.get("hasbro"):
        entry["hasbro"] = True
    if override.get("spinType"):
        entry["spinType"] = override["spinType"]
    desc = override.get("_description")
    if desc:
        entry["description"] = desc

    return entry
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
uv run pytest scripts/tests/test_generate_parts.py::test_blade_entry_includes_description_when_present scripts/tests/test_generate_parts.py::test_blade_entry_omits_description_when_absent -v
```

Expected: PASS

- [ ] **Step 5: Confirm existing tests still pass**

```bash
uv run pytest scripts/tests/ -v
```

Expected: all green

- [ ] **Step 6: Commit**

```bash
git add scripts/generate_parts.py scripts/tests/test_generate_parts.py
git commit -m "feat: emit description field from make_blade_entry"
```

---

### Task 2: Emit `description` from remaining `make_*_entry` functions

**Files:**
- Modify: `scripts/generate_parts.py`
- Test: `scripts/tests/test_generate_parts.py`

- [ ] **Step 1: Write failing tests**

Add to `scripts/tests/test_generate_parts.py`:

```python
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
uv run pytest scripts/tests/test_generate_parts.py::test_assist_blade_entry_includes_description_when_present scripts/tests/test_generate_parts.py::test_ratchet_entry_includes_description_when_present scripts/tests/test_generate_parts.py::test_bit_entry_includes_description_when_present -v
```

Expected: FAIL

- [ ] **Step 3: Implement in `make_assist_blade_entry`**

In `scripts/generate_parts.py`, at the end of `make_assist_blade_entry` (before `return entry`):

```python
    desc = override.get("_description")
    if desc:
        entry["description"] = desc

    return entry
```

- [ ] **Step 4: Implement in `make_ratchet_entry`**

`make_ratchet_entry` currently returns a dict literal directly. Change it to build and return:

```python
def make_ratchet_entry(beydata: dict, override: dict) -> dict:
    """Build a beyparts.js ratchet object."""
    stats = beydata["defaultStatus"]
    name = beydata["group_id"]
    entry = {
        "name": name,
        "altname": name,
        "points": override.get("points", 1),
        "attack": override.get("attack", stats.get("attack", 0)),
        "defense": override.get("defense", stats.get("defense", 0)),
        "stamina": override.get("stamina", stats.get("stamina", 0)),
        "type": override.get("type", None),
    }
    desc = override.get("_description")
    if desc:
        entry["description"] = desc
    return entry
```

- [ ] **Step 5: Implement in `make_bit_entry`**

`make_bit_entry` also returns a dict literal directly. Change it to build and return:

```python
def make_bit_entry(beydata: dict, override: dict) -> dict:
    """Build a beyparts.js bit object."""
    stats = beydata["defaultStatus"]
    name = _base_name(beydata["group_id"], override)
    alias = override.get("alias", beydata.get("en_name", beydata["group_id"]))
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
    desc = override.get("_description")
    if desc:
        entry["description"] = desc
    return entry
```

- [ ] **Step 6: Implement in `make_lock_chip_entry`**

At the end of `make_lock_chip_entry` (before `return entry`):

```python
    desc = override.get("_description")
    if desc:
        entry["description"] = desc
    return entry
```

- [ ] **Step 7: Run all tests**

```bash
uv run pytest scripts/tests/ -v
```

Expected: all green

- [ ] **Step 8: Regenerate `beyparts.js` and verify descriptions appear**

```bash
python scripts/generate_parts.py
grep -c '"description":' src/data/beyparts.js
```

Expected: non-zero count (163 entries have `_description` in overrides)

- [ ] **Step 9: Commit**

```bash
git add scripts/generate_parts.py scripts/tests/test_generate_parts.py src/data/beyparts.js
git commit -m "feat: emit description field from all make_*_entry functions"
```

---

### Task 3: Display description below `PartSelector` on selection

**Files:**
- Modify: `src/PartSelector.jsx`

- [ ] **Step 1: Add description rendering below `<Select>`**

In `src/PartSelector.jsx`, the `PartSelector` function currently returns:

```jsx
  return (
    <div className="mb-4">
      <label ...>{label}</label>
      <Select ... />
    </div>
  );
```

Change it to:

```jsx
  const description = value ? BEYBLADE_DB[value]?.description : null;

  return (
    <div className="mb-4">
      <label
        className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}
      >
        {label}
      </label>
      <Select
        name={label}
        styles={selectStyles}
        onChange={(e) => onChange(e.value)}
        value={defaultValue}
        options={flatOptions}
        isOptionDisabled={isOptionDisabled}
        formatOptionLabel={(option) => {
          if (!option.value) return <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', opacity: 0.6 }}>{option.label}</span>;
          const db = BEYBLADE_DB[option.value];
          const lineBadge = showLineBadge ? LINE_BADGE[db?.line || 'BX'] : null;
          return (
            <span className="flex flex-row items-center gap-1.5">
              {lineBadge && <Badge label={lineBadge.label} color={lineBadge.color} />}
              {db?.type && <img className="h-5 w-5 object-contain flex-shrink-0" src={`/images/${db.type}.png`} alt="" />}
              {db?.image && (
                <span className="flex-shrink-0 rounded overflow-hidden" style={{ background: '#fff', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img className="h-6 w-6 object-contain" src={`/images/${db.image}`} alt="" />
                </span>
              )}
              <span style={{ fontSize: '13px' }}>{option.label}</span>
            </span>
          );
        }}
      />
      {description && (
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.5', marginTop: '4px', padding: '0 2px' }}>
          {description}
        </p>
      )}
    </div>
  );
```

- [ ] **Step 2: Start dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:5173`. Select any blade (e.g. "Aero Pegasus") — a small muted description line should appear below the dropdown. Select "— Select —" — it should disappear. Select a ratchet — no description line should appear (most ratchets have no description).

- [ ] **Step 3: Commit**

```bash
git add src/PartSelector.jsx
git commit -m "feat: show part description below selector on selection"
```
