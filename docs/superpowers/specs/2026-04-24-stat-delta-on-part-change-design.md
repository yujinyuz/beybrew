# Stat Delta on Part Change

**Date:** 2026-04-24
**Status:** Approved

## Summary

When a user changes a part in any combo card, show stat deltas (how much each stat increases or decreases) in two places:
1. **Inline in the dropdown** — every option shows colored +/− badges against the currently selected part, visible before committing.
2. **Post-select flash on stat bars** — after selecting, delta badges appear next to each stat bar and fade out after ~2 seconds.

Zero-change stats are hidden in both contexts. All 5 stats are eligible: attack, defense, stamina, xDash, burstResistance.

---

## Feature A — Inline deltas in the dropdown

### What
Every option row in `PartSelector` shows color-coded delta badges for all stats that would change vs. the currently selected part. Non-zero only.

### Data flow
- `PartSelector` already receives `value` (current part name) and imports `getStats` from `constants.js`.
- No new props needed. Delta = `getStats(candidateName)[stat] - getStats(value)[stat]` for each of the 5 stats, computed inside `formatOptionLabel`.
- Only non-zero deltas surface naturally — stats a slot doesn't contribute (e.g., xDash on a blade) will be 0 on both sides and cancel out.

### Rendering
- Badges are rendered inside `formatOptionLabel` in `PartSelector`, to the right of the part name/label.
- Green badge (`#00e676` bg tint) for positive delta, red badge (`#ff4455` bg tint) for negative.
- Format: `ATK +8`, `DEF −5` (abbreviated stat name, sign, value).
- Only non-zero deltas are shown. If all deltas are zero, no badges.
- The current selection row shows no delta badges (it's the baseline).

### Edge cases
- If no part is currently selected (empty slot), no deltas are shown — there's no baseline to diff against.
- Modes (blade/bit multi-mode parts): use the active `modeIndex` for the current part's stats.

---

## Feature C — Post-select delta flash on stat bars

### What
After a new part is selected, delta badges appear next to each stat bar in `Beyblade.jsx` and fade out after ~2 seconds.

### Data flow
- `Beyblade` component tracks `prevStats` (the aggregate combo stats before the change) via a ref or prev-state pattern.
- On each render where a part prop changes, compute `delta[stat] = newTotal[stat] - prevTotal[stat]`.
- Deltas are stored in component state with a `visible: true` flag.
- A `setTimeout` (~2000ms) flips `visible` to false, triggering a CSS fade-out transition.

### Rendering
- Delta badge appears to the right of each stat value in `StatsBar`, as an additional optional prop `delta`.
- Positive: green (`#00e676`), negative: red (`#ff4455`).
- Format: `+8` or `−5` (sign + number, no label needed since it's next to the bar).
- Zero deltas are not shown.
- Badge uses `opacity` transition for fade: `opacity: 1 → 0` over 0.4s, triggered after 1.6s hold (~2s total).

### Edge cases
- Multiple parts changed at once (e.g., Turbo ratchet/bit sync): compute delta from full previous combo totals — the flash reflects the net change.
- First selection from empty slot: treat missing stats as 0, so selecting a part from empty shows the full value as a positive delta.
- Page load / URL hydration: no flash on initial hydration (skip delta flash when mounting with pre-filled state).

---

## Architecture

### Components changed
| Component | Change |
|-----------|--------|
| `PartSelector.jsx` | Add delta badge rendering in `formatOptionLabel`; no new props needed |
| `Beyblade.jsx` | Track previous combo totals via `useRef`; pass `delta` to `StatsBar` |
| `StatsBar` (in `Beyblade.jsx`) | Accept optional `delta` prop; render fading badge |
| `App.jsx` / combo card parent | Pass current part stats down to each `PartSelector` |

### Stat computation
`getStats(partName, modeIndex)` already exists in `constants.js` and returns the stat object for a single part. Use it directly in `PartSelector` to get the current and candidate part stats for delta calculation.

### No new data files required
All data needed is already in `BEYBLADE_DB` via `getStats`.

---

## Non-goals
- No hover-based live preview (Option B) — not reliably available on mobile.
- No persistent delta history (only the most recent change is shown).
- No delta shown for `points` (Limited format) — the existing points display is sufficient.
