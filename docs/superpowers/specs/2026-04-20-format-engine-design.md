# Format Engine Design

**Date:** 2026-04-20
**Status:** Approved

## Overview

Replace the hardcoded `standard` / `limited` string-based format system with an extensible, rules-array JSON format interface. Each format is a declarative JSON file. A central evaluator applies rules to produce hard blocks (part disabled in dropdowns) and soft violations (warning banner). Users can upload custom formats as JSON files.

---

## Format Schema

Every format is a JSON object with the following shape:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "minBeys": 1,
  "maxBeys": 10,
  "rules": [ ...rule objects ],
  "partPoints": { "PartName": number }
}
```

- `id` — unique identifier, used in URL param and internal lookups
- `name` — display label
- `description` — short description shown in the UI
- `minBeys` / `maxBeys` — clamps the deck count stepper
- `rules` — ordered array of constraint objects (see Rule Types)
- `partPoints` — optional; only required when a `pointBudget` rule is present

Valid `slot` values: `"blade"`, `"assistBlade"`, `"ratchet"`, `"bit"`, `"lockChip"`, `"overBlade"`

Valid `typeValue` values: `"attack"`, `"defense"`, `"balance"`, `"stamina"` — maps to the `type` field on parts in `beyparts.json`

---

## Rule Types

### Part-level (hard blocks — parts disabled in dropdowns)

| Rule | Fields | Effect |
|------|--------|--------|
| `noRepeatParts` | — | Disables any part already used in another combo |
| `banPart` | `names: string[]` | Disables specific named parts |
| `allowedParts` | `slot: string`, `names: string[]` | Disables any part in that slot not on the allowlist |
| `allowedPartTypes` | `slot: string`, `types: string[]` | Disables parts whose `type` field is not in the list |

### Deck-level (soft warnings — shown in FormatViolations)

| Rule | Fields | Effect |
|------|--------|--------|
| `pointBudget` | `default: number`, `userAdjustable?: boolean` | Warns when total points exceed budget |
| `requirePartType` | `slot: string`, `typeValue: string`, `min: number`, `max?: number` | Warns if deck has fewer than `min` (or more than `max`) parts of that type in that slot |
| `requireTypeDistribution` | `slot: string`, `types: string[]` | Shorthand: deck must contain at least one part of each listed type in the slot. Expands to multiple `requirePartType` rules internally. |
| `requireComboTypePairing` | `slot1: string`, `slot2: string` | Warns for any combo where `slot1.type !== slot2.type` |
| `requireComboWith` | `conditions: [{slot, typeValue}]` | Warns if no combo satisfies all conditions simultaneously |

---

## Built-in Formats

### Standard
```json
{
  "id": "standard",
  "name": "Standard",
  "description": "No repeating parts across the deck.",
  "minBeys": 1,
  "maxBeys": 10,
  "rules": [
    { "type": "noRepeatParts" }
  ]
}
```

### Limited
```json
{
  "id": "limited",
  "name": "Limited",
  "description": "Point budget — each part has a point value.",
  "minBeys": 1,
  "maxBeys": 10,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "pointBudget", "default": 17, "userAdjustable": true }
  ],
  "partPoints": { "PartName": number, ... }
}
```
*`partPoints` data is the existing map from `src/data/formats/limited.json`. B.A.D Limited and D.A.B Limited share the same `partPoints` map.*

### B.A.D
```json
{
  "id": "bad",
  "name": "B.A.D",
  "description": "3 beys — deck must include at least one Attack, Defense, and Balance blade AND bit (no pairing required).",
  "minBeys": 3,
  "maxBeys": 3,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "requireTypeDistribution", "slot": "blade", "types": ["attack", "defense", "balance"] },
    { "type": "requireTypeDistribution", "slot": "bit",   "types": ["attack", "defense", "balance"] }
  ]
}
```

### D.A.B
```json
{
  "id": "dab",
  "name": "D.A.B",
  "description": "3 beys — each combo must pair matching blade and bit type (Defense+Defense, Attack+Attack, Balance+Balance).",
  "minBeys": 3,
  "maxBeys": 3,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "requireTypeDistribution", "slot": "blade", "types": ["attack", "defense", "balance"] },
    { "type": "requireComboTypePairing", "slot1": "blade", "slot2": "bit" }
  ]
}
```

### B.A.D Limited
```json
{
  "id": "bad-limited",
  "name": "B.A.D Limited",
  "description": "B.A.D rules with a point budget.",
  "minBeys": 3,
  "maxBeys": 3,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "requireTypeDistribution", "slot": "blade", "types": ["attack", "defense", "balance"] },
    { "type": "requireTypeDistribution", "slot": "bit",   "types": ["attack", "defense", "balance"] },
    { "type": "pointBudget", "default": 17, "userAdjustable": true }
  ],
  "partPoints": { ... }
}
```

### D.A.B Limited
```json
{
  "id": "dab-limited",
  "name": "D.A.B Limited",
  "description": "D.A.B rules with a point budget.",
  "minBeys": 3,
  "maxBeys": 3,
  "rules": [
    { "type": "noRepeatParts" },
    { "type": "requireTypeDistribution", "slot": "blade", "types": ["attack", "defense", "balance"] },
    { "type": "requireComboTypePairing", "slot1": "blade", "slot2": "bit" },
    { "type": "pointBudget", "default": 17, "userAdjustable": true }
  ],
  "partPoints": { ... }
}
```

---

## Architecture

### New Files

**`src/lib/formatEngine.js`**
Central evaluator. Exports:
- `evaluateFormat(deck, format, userValues)` → `{ violations: [{ rule, message }] }` — soft violations
- `isPartDisabled(partName, slot, partsUsed, deck, format)` → `boolean` — hard blocks for PartSelector
- `getPointBudget(format, userValues)` → `number` — resolves effective max points

**`src/data/formats/standard.json`** — new
**`src/data/formats/limited.json`** — restructured (existing `partPoints` stays; `maxPoints` top-level field removed)
**`src/data/formats/bad.json`** — new
**`src/data/formats/dab.json`** — new
**`src/data/formats/bad-limited.json`** — new
**`src/data/formats/dab-limited.json`** — new

**`src/components/FormatViolations.jsx`** — renders soft violation warnings below config card; returns null when no violations

### Modified Files

**`src/constants.js`**
- Remove `LIMITED_FORMAT`, `STANDARD_FORMAT`, `DEFAULT_FORMAT`, `FORMAT_DATA`, `DEFAULT_LIMITED_MAX_POINTS`, `getPartPoints`
- Add `BUILT_IN_FORMATS: Format[]` (imported array of all 6 format JSONs)
- Add `getFormat(id: string): Format`
- Add `DEFAULT_FORMAT_ID = 'standard'`

**`src/hooks/useBeybladeDeck.js`**
- `currentFormat` state changes from `string` to `Format` object
- `setCurrentFormat` accepts a `Format` object
- Replace `getPartPoints` usage with `formatEngine.getPointBudget`
- Add `violations` to returned values (computed via `evaluateFormat`)
- Keep `totalPoints` for display (still computed from `partsUsed` + `format.partPoints`)

**`src/App.jsx`**
- Format selector: render one button per built-in format + "Import +" button
- Remove `maximumPointsLimited` state; replace with `formatUserValues: { pointBudget?: number }` — stores user-overridden values for `userAdjustable` rules
- Pass `formatUserValues` to `useBeybladeDeck` and `evaluateFormat`
- Render `<FormatViolations>` below config card
- `pointBudget` input rendered when active format has a `userAdjustable` pointBudget rule

**`src/PartSelector.jsx`**
- Replace current `partsUsed`/`currentFormat` prop logic with `isPartDisabled()` from formatEngine

---

## URL Sharing

`format` URL param stores format `id` (e.g. `format=dab`). Custom user-uploaded formats are session-only and not encoded in the URL — shared links fall back to Standard format.

---

## User-Uploaded Formats

"Import +" button opens a file picker (`.json` only). On load:
1. Parse JSON
2. Validate required fields: `id`, `name`, `rules`
3. Validate each rule has a known `type`
4. On error: show inline error message near the button
5. On success: add to format selector as an active custom format button (session-only)

---

## Out of Scope (Future)

- **Rule builder UI** — in-app visual editor for creating format JSON without writing code. Naturally fits as the next feature once this foundation is stable.
- **Persisted custom formats** — saving user-uploaded formats across sessions (requires localStorage or account system)
- **Format sharing via URL** — encoding format JSON in share links
