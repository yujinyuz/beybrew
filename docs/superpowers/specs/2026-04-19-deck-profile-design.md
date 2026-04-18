# Deck Profile Feature — Design Spec

## Overview

After a user selects beyblades, a **Deck Profile panel** appears below the `ComboSummaryList`. It shows the deck's blader archetype (e.g. `X-Rusher`) derived from weighted scoring across all 5 stats, a mini bar chart of averaged stats, and an editable blader name. All state is encoded into the share URL using lz-string compression.

---

## 1. Archetypes

Eight archetypes, each with an `X-` prefix and a short flavor line:

| Archetype | Emoji | Flavor | Dominant trigger |
|---|---|---|---|
| X-Rusher | ⚡ | Built for the stadium-out | High ATK + high xDash |
| X-Berserker | 🔥 | All-in, no safety net | Very high ATK, low DEF + STA |
| X-Fortress | 🛡️ | Absorbs everything | High DEF + high burstResistance |
| X-Ironwall | 💎 | Nearly impossible to KO | Very high DEF + very high burstResistance |
| X-Endurance | ⏳ | Spins forever | STA dominant |
| X-Counter | 🔄 | Absorb and punish | High DEF + moderate ATK + moderate burst |
| X-Specialist | 💨 | Speed is the only strategy | xDash standout stat |
| X-Tactician | 🧠 | No weakness, no weakness | No stat clearly dominates |

---

## 2. Calculation — `getDeckProfile(beyblades)`

New export in `src/lib/comboUtils.js`.

### Steps

1. Filter `beyblades` to entries with at least a `blade` selected.
2. Run `getComboStats()` on each filtered combo.
3. Average each of the 5 stats across the filtered set.
4. Normalize each averaged stat against its `limit` from `STAT_DEFS` → produces 0–1 scores: `atkN`, `defN`, `staN`, `xdN`, `burstN`.
5. Score all 8 archetypes using weighted formulas:
   - **X-Rusher**: `atkN * 0.5 + xdN * 0.5`
   - **X-Berserker**: `atkN * 0.6 + (1 - defN) * 0.2 + (1 - staN) * 0.2`
   - **X-Fortress**: `defN * 0.5 + burstN * 0.5`
   - **X-Ironwall**: `defN * 0.35 + burstN * 0.65`
   - **X-Endurance**: `staN * 0.7 + defN * 0.3`
   - **X-Counter**: `defN * 0.5 + atkN * 0.3 + burstN * 0.2`
   - **X-Specialist**: `xdN * 0.8 + atkN * 0.2`
   - **X-Tactician**: `1 - stdDev([atkN, defN, staN, xdN, burstN])` (wins when distribution is flat)
6. Return the highest-scoring archetype key plus the averaged raw stats (for the bar chart).

### Return shape

```js
{
  archetype: 'X-Rusher',         // string
  averageStats: {
    attack, defense, stamina, xDash, burstResistance  // raw averaged values
  }
}
```

---

## 3. URL Encoding

Replace the existing multi-param share URL with a single `?d=` token.

### Payload shape (JSON before compression)

```json
{
  "beys": ["blade,ratchet,bit,..."],
  "format": "standard",
  "beynum": 3,
  "name": "Valt"
}
```

### Encoding

```js
import LZString from 'lz-string';
const token = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
// → ?d=<token>
```

### Decoding

```js
const raw = LZString.decompressFromEncodedURIComponent(params.get('d'));
const payload = JSON.parse(raw);
```

### Backwards compatibility

On page load, check for the legacy params (`beys`, `format`, `beynum`) first. If found, parse them as before. The `name` field defaults to `''` when absent. New shares always use `?d=`.

---

## 4. UI Component — `DeckProfilePanel`

New file: `src/components/DeckProfilePanel.jsx`

### Props

```js
{ beyblades, beybladeCount, bladerName, onBladerNameChange }
```

### Render conditions

- Returns `null` if no combo has a blade selected.

### Layout

```
┌─────────────────────────────────────────────────────┐
│ DECK PROFILE                       Blader: [Valt]   │
│─────────────────────────────────────────────────────│
│  ⚡          │  Attack   ████████░░  85%             │
│  X-Rusher   │  Defense  ███░░░░░░░  28%             │
│  Built for  │  Stamina  ███░░░░░░░  33%             │
│  stadium-out│  X-Dash   ███████░░░  78%             │
│             │  Burst    █░░░░░░░░░  15%             │
└─────────────────────────────────────────────────────┘
```

- **Header row**: `DECK PROFILE` label (left) + blader name field (right)
- **Body**: archetype icon + label + flavor text (left), vertical divider, 5 stat bars (right)
- **Colors**: archetype label color matches the dominant stat's color from `STAT_DEFS`
- **Stat bars**: same gradients as `STAT_DEFS`, normalized against each stat's `limit`
- **Styling**: matches existing surface panels — `var(--color-surface-2)` bg, `rgba(0,212,255,0.1)` border

### Blader name field (click-to-edit)

- Default state: plain styled `<span>` showing the name (or `"—"` if empty)
- On click: becomes a controlled `<input>`, focused automatically
- Confirms on `blur` or `Enter` keypress → returns to span
- Max length: 32 characters
- Triggers `onBladerNameChange(value)` on confirm

### Placement in `App.jsx`

Directly below `<ComboSummaryList />`, above the individual combo builder cards.

---

## 5. State & URL Sync

- Add `bladerName` state to `App.jsx` (string, default `''`).
- On share: include `name` in the compressed payload alongside existing deck params.
- On load: decompress `?d=` token (or fall back to legacy params), hydrate `bladerName`.
- The `DeckProfilePanel` receives `bladerName` and `onBladerNameChange` as props; `App.jsx` owns the state.

---

## 6. Files Changed

| File | Change |
|---|---|
| `src/lib/comboUtils.js` | Add `getDeckProfile()` and archetype definitions |
| `src/lib/shareUrl.js` | Replace multi-param encode/decode with lz-string `?d=` token; keep legacy read |
| `src/components/DeckProfilePanel.jsx` | New component |
| `src/App.jsx` | Add `bladerName` state, render `DeckProfilePanel`, update share/load URL logic |
| `package.json` | Add `lz-string` dependency |
