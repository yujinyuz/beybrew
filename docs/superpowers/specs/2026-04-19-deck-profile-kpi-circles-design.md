# Deck Profile KPI Circles

## Problem

The `DeckProfilePanel` shows deck average stats as horizontal bars. Since every combo card in the deck already shows bars, the profile panel feels redundant.

## Solution

Replace the `StatBar` component in `DeckProfilePanel.jsx` with a `StatCircle` component — an SVG donut ring with a percentage value centered inside and an abbreviated label below.

## Design

**Layout:** unchanged — archetype (emoji, name, flavor) on the left, divider, stats on the right.

**StatCircle spec:**
- 44×44px SVG donut ring
- Track ring: `rgba(255,255,255,0.07)`, stroke-width 4
- Fill arc: stat color from `STAT_DEFS`, `stroke-linecap="round"`, rotated −90° so fill starts at top
- Center text: `Math.round(pct * 100)` (0–100), stat color, 10px bold
- Label below: abbreviated name (ATK, DEF, STA, XD, BR), 8px, muted color
- Fill amount: `strokeDashoffset = circumference * (1 - pct)` where `circumference = 2π × r`

**Label abbreviations:**
| key | label |
|-----|-------|
| attack | ATK |
| defense | DEF |
| stamina | STA |
| xDash | XD |
| burstResistance | BR |

**Percentage calculation:** `pct = Math.min(1, value / STAT_LIMITS[key])` — same as current bar logic.

## Scope

- `src/components/DeckProfilePanel.jsx` only
- Remove `StatBar`, add `StatCircle`
- No changes to data, constants, or other components
