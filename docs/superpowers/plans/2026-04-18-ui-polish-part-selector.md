# UI Polish: Part Selector Brand Grouping + Badges — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Hasbro/TT brand badges, attack/defense/stamina/balance type badges, and brand-based option grouping to every part selector dropdown in the deck builder.

**Architecture:** All changes are confined to `src/PartSelector.jsx`. The flat `formattedOptions` array is replaced with a grouped structure using react-select's native group format. `formatOptionLabel` gains two inline badge spans. `formatGroupLabel` renders colored group headers.

**Tech Stack:** React 18, react-select 5, Tailwind CSS, Vite

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/PartSelector.jsx` | Modify | Grouped options, badge rendering, group header styling |

---

### Task 1: Replace flat options with brand-grouped options

**Files:**
- Modify: `src/PartSelector.jsx`

- [ ] **Step 1: Start the dev server and note current dropdown behavior**

```bash
npm run dev
```

Open http://localhost:5173, pick any Beyblade slot, open the Blade dropdown. Confirm it currently shows a flat alphabetical (or points-sorted) list with no grouping and no badges. Keep the server running.

- [ ] **Step 2: Replace the options-building logic in `PartSelector.jsx`**

Replace the entire block from `const sorted = ...` through `formattedOptions.unshift(...)` with the following:

```jsx
function buildOptionLabel(option, currentFormat) {
  let label = `${option} ${BEYBLADE_DB[option].alias ? `(${BEYBLADE_DB[option].alias})` : ''}`;
  if (currentFormat === LIMITED_FORMAT) {
    label = `${label} ${BEYBLADE_DB[option].points ?? '???'}`;
  }
  return { value: option, label };
}

function buildGroupedOptions(options, currentFormat) {
  const sorted = currentFormat === LIMITED_FORMAT
    ? [...options].sort((a, b) => (BEYBLADE_DB[a]?.points || 100) - (BEYBLADE_DB[b]?.points || 100))
    : [...options].sort();

  const hasbro = [];
  const tt = [];

  sorted.forEach((option) => {
    const item = buildOptionLabel(option, currentFormat);
    if (BEYBLADE_DB[option]?.hasbro) {
      hasbro.push(item);
    } else {
      tt.push(item);
    }
  });

  const groups = [];
  if (hasbro.length > 0) groups.push({ label: 'Hasbro', options: hasbro });
  if (tt.length > 0) groups.push({ label: 'Takara Tomy', options: tt });

  return [{ value: '', label: '---' }, ...groups];
}
```

Then inside the `PartSelector` component body, replace the old options-building + `unshift` with:

```jsx
const groupedOptions = buildGroupedOptions(options, currentFormat);
```

And replace the `defaultValue` lookup (which used `formattedOptions.find`) with a flat search across all groups:

```jsx
const allOptions = groupedOptions.flatMap((item) =>
  item.options ? item.options : [item]
);
const defaultValue = allOptions.find((i) => i.value == value);
```

- [ ] **Step 3: Update the `<Select>` props to use `groupedOptions`**

Change `options={formattedOptions}` to `options={groupedOptions}`.

The full `<Select>` tag at this point should be:

```jsx
<Select
  name={label}
  className='block w-full border-gray-300 rounded-md shadow-sm'
  onChange={(e) => onChange(e.value)}
  value={defaultValue}
  options={groupedOptions}
  isOptionDisabled={optionDisabled}
  formatOptionLabel={option => (
    <span className='flex flex-row'>
      <img className="h-6" src={`${BEYBLADE_DB[option.value]?.type ? `/images/${BEYBLADE_DB[option.value].type}.png` : ''}`} />
      &nbsp;
      <img className="h-6" src={`${BEYBLADE_DB[option.value]?.image ? `/images/${BEYBLADE_DB[option.value].image}` : ''}`} />
      &nbsp;{option.label}
    </span>
  )}
/>
```

- [ ] **Step 4: Verify grouping in the browser**

Open the Blade dropdown. You should see:
- `---` at the top
- A "Hasbro" group header with Hasbro blades listed under it
- A "Takara Tomy" group header with TT blades listed under it
- Labels still show alias and (in Limited format) points
- Selecting a part still works, selected value is reflected in the combo stats below
- Already-used parts in other slots are disabled within their group

- [ ] **Step 5: Commit**

```bash
git add src/PartSelector.jsx
git commit -m "feat: group part selector options by brand (Hasbro / Takara Tomy)"
```

---

### Task 2: Add brand and type badges to option labels

**Files:**
- Modify: `src/PartSelector.jsx`

- [ ] **Step 1: Add the badge helper above the `PartSelector` function**

Insert this constant map and helper directly above the `function PartSelector(` line:

```jsx
const TYPE_BADGE = {
  attack:  { label: 'ATK', color: '#2196F3' },
  defense: { label: 'DEF', color: '#4CAF50' },
  stamina: { label: 'STA', color: '#FF9800' },
  balance: { label: 'BAL', color: '#9C27B0' },
};

function Badge({ label, color }) {
  return (
    <span style={{
      background: color,
      color: 'white',
      fontSize: '9px',
      fontWeight: 700,
      padding: '1px 5px',
      borderRadius: '3px',
      flexShrink: 0,
      lineHeight: '1.4',
    }}>
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Replace `formatOptionLabel` with the badge-aware version**

Replace the existing `formatOptionLabel` prop value with:

```jsx
formatOptionLabel={option => {
  if (!option.value) return <span>{option.label}</span>;
  const db = BEYBLADE_DB[option.value];
  const brandLabel = db?.hasbro ? 'HAS' : 'TT';
  const brandColor = db?.hasbro ? '#e63946' : '#3b5bdb';
  const typeBadge = db?.type ? TYPE_BADGE[db.type] : null;
  return (
    <span className='flex flex-row items-center gap-1'>
      <Badge label={brandLabel} color={brandColor} />
      {typeBadge && <Badge label={typeBadge.label} color={typeBadge.color} />}
      <img className="h-6" src={db?.type ? `/images/${db.type}.png` : ''} alt="" />
      <img className="h-6" src={db?.image ? `/images/${db.image}` : ''} alt="" />
      <span>{option.label}</span>
    </span>
  );
}}
```

- [ ] **Step 3: Verify badges in the browser**

Open any part dropdown. Each option (except `---`) should show:
- A red **HAS** badge for Hasbro parts, or a blue **TT** badge for Takara Tomy parts
- A colored type badge (**ATK** / **DEF** / **STA** / **BAL**) when the part has a `type` field
- Ratchets have no type badge (they have no `type` field in the data)
- The `---` empty option renders as plain text with no badges

Check Bit and Ratchet dropdowns too — bits have types, ratchets don't, confirm accordingly.

- [ ] **Step 4: Commit**

```bash
git add src/PartSelector.jsx
git commit -m "feat: add HAS/TT brand badges and ATK/DEF/STA/BAL type badges to part selector"
```

---

### Task 3: Style group headers with brand colors

**Files:**
- Modify: `src/PartSelector.jsx`

- [ ] **Step 1: Add `formatGroupLabel` prop to `<Select>`**

Add this prop to the `<Select>` component:

```jsx
formatGroupLabel={group => (
  <div style={{
    background: group.label === 'Hasbro' ? '#fff5f5' : '#f0f4ff',
    color: group.label === 'Hasbro' ? '#e63946' : '#3b5bdb',
    fontWeight: 700,
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '4px 0',
  }}>
    {group.label}
  </div>
)}
```

- [ ] **Step 2: Verify group header colors in the browser**

Open a Blade dropdown. The "Hasbro" group header should appear with a red tint background and red text. The "Takara Tomy" header should appear with a blue tint background and blue text.

- [ ] **Step 3: Run the linter**

```bash
npm run lint
```

Expected: no errors. If you see unused variable warnings for anything removed, clean them up and re-run.

- [ ] **Step 4: Run the production build to confirm no compile errors**

```bash
npm run build
```

Expected output ends with something like:
```
✓ built in Xs
```
No errors or warnings about missing exports.

- [ ] **Step 5: Final visual check — all four part types**

In the dev server, build a full Beyblade combo (pick a CX blade so Assist Blade appears). Verify all four selectors (Blade, Assist Blade, Ratchet, Bit) show:
- Correct grouping (Hasbro / TT)
- Correct brand badge on each option
- Type badges on Blades, Assist Blades, and Bits (not on Ratchets)
- Group headers with brand colors
- Search works: type a partial name in the dropdown search field and confirm matching options appear from both groups
- No visual regressions in the rest of the UI (stats bars, combo summary, share button)

- [ ] **Step 6: Commit**

```bash
git add src/PartSelector.jsx
git commit -m "feat: style part selector group headers with brand colors"
```
