# Alternate Part Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `modeIndex=0` always show the base part image, shifting `modes[]` entries to 1-indexed so alternate images are opt-in.

**Architecture:** Two small changes — `getStats` skips modes when `modeIndex=0`, and `ModeToggle` prepends a hardcoded "Default" button. No data changes required.

**Tech Stack:** React, Vite. No test framework configured — verify manually in the dev server.

---

### Task 1: Fix `getStats` to treat modeIndex=0 as base

**Files:**
- Modify: `src/constants.js:44`

- [ ] **Step 1: Update `getStats`**

Replace line 44 in `src/constants.js`:

```js
// Before
if (part.modes) return { ...part, ...(part.modes[modeIndex] ?? part.modes[0]) };

// After
if (part.modes && modeIndex > 0) return { ...part, ...(part.modes[modeIndex - 1] ?? part.modes[0]) };
```

The full function after change:

```js
export function getStats(partName, modeIndex = 0) {
  const part = BEYBLADE_DB[partName];
  if (!part) return {};
  if (part.modes && modeIndex > 0) return { ...part, ...(part.modes[modeIndex - 1] ?? part.modes[0]) };
  return part;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/constants.js
git commit -m "fix: make modeIndex=0 return base part, shift modes to 1-indexed"
```

---

### Task 2: Add "Default" button to ModeToggle

**Files:**
- Modify: `src/ModeToggle.jsx`

- [ ] **Step 1: Update `ModeToggle` to prepend a Default button**

Replace the full contents of `src/ModeToggle.jsx`:

```jsx
import PropTypes from 'prop-types';

function ModeToggle({ modes, value, onChange }) {
  const allModes = [{ label: 'Default' }, ...modes];
  return (
    <div className="flex gap-2 mb-4">
      {allModes.map((mode, i) => {
        const active = i === value;
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: active ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
              color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
              border: active
                ? '1px solid rgba(0,212,255,0.4)'
                : '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

ModeToggle.propTypes = {
  modes: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string.isRequired })).isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ModeToggle;
```

- [ ] **Step 2: Commit**

```bash
git add src/ModeToggle.jsx
git commit -m "feat: add Default button to ModeToggle for base image support"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify Aero Pegasus behavior**

1. Select **Aero Pegasus** as the blade — the combo card should show the base (blue) image.
2. The `ModeToggle` should show two buttons: **Default** (active) and **Aero Pegasus Red Ver.**
3. Click **Aero Pegasus Red Ver.** — the combo card image should switch to the red version.
4. Click **Default** — the combo card image should revert to the base image.

- [ ] **Step 3: Verify parts without modes are unaffected**

Select any part that has no `modes` field (e.g., Dran Sword). Confirm no `ModeToggle` appears and the image shows normally.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no errors.
