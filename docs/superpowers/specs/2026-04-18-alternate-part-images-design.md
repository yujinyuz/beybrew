# Alternate Part Images Design

**Date:** 2026-04-18  
**Status:** Approved

## Problem

Parts like Aero Pegasus exist as color variants (e.g., Red Ver.) that are the same functional part but with a different image. The existing `modes` system can store alternate images but has no concept of a "base" default — `modeIndex=0` always merges `modes[0]`, making the original image inaccessible once any mode is defined.

## Solution

Shift `modes` to 1-indexed so that `modeIndex=0` means "use base part, no mode applied". This makes the default state always show the base image, and any entry in `modes[]` becomes an opt-in alternate.

## Changes

### `src/constants.js` — `getStats`

```js
// Before
if (part.modes) return { ...part, ...(part.modes[modeIndex] ?? part.modes[0]) };

// After
if (part.modes && modeIndex > 0) return { ...part, ...(part.modes[modeIndex - 1] ?? part.modes[0]) };
```

`modeIndex=0` falls through and returns the base part unchanged.

### `src/ModeToggle.jsx`

Prepend a hardcoded "Default" button (index 0) before rendering the `modes` array buttons. Buttons for modes render at indices 1…N. The `value`/`onChange` contract is unchanged.

### Data (`src/data/beyparts.js`)

No changes needed. Example:

```js
// Aero Pegasus — modes[0] is now index 1 (Red Ver.), index 0 = base
modes: [{ label: "Aero Pegasus Red Ver.", image: "BladeAeroPegasusRed.png" }]
```

## Adding Alternate Images to a Part

Add entries to the part's `modes` array with `label` and `image` fields. No stat fields needed for cosmetic-only variants:

```js
modes: [
  { label: "Red Ver.", image: "BladeAeroPegasusRed.png" },
  { label: "Gold Ver.", image: "BladeAeroPegasusGold.png" },
]
```

## Trade-offs / Notes

- **URL regression:** Any previously shared URL with `bladeMode=N` encoded will shift by 1 (e.g., old `bladeMode=0` for Red Ver. now maps to base). This is a cosmetic-only change — no functional data is lost.
- **Stat-changing modes** are unaffected — they still work the same way, just accessed at index 1+ instead of 0+.
- The "Default" button label in `ModeToggle` is hardcoded. It does not reflect the part's name — this is intentional to keep the component generic.
