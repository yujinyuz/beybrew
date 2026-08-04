# AGENTS.md

This file provides guidance to coding agents when working in this repository.

## Project

**BeyBrew** — a client-side Beyblade X deck builder. Users select blade/ratchet/bit combos, view aggregated stats, share decks via URL, and export combos as PNG.

## Commands

```bash
bun dev            # Start Vite dev server
bun run build      # Production build to /dist
bun run preview    # Preview production build
bun run lint       # ESLint check
bun run lint:fix   # Auto-fix ESLint violations
bun run deploy     # Build + deploy to GitHub Pages
```

No test framework is configured.

## Architecture

### State (App.jsx)

All state lives in `App.jsx`:
- `beyblades` — array of `{ blade, assistBlade, ratchet, bit }` objects
- `beybladeCount` — deck size (1–10)
- `currentFormat` — `"standard"` | `"limited"`
- `partsUsed` — Set of part names used across the deck (Standard format: no repeats)
- `totalPoints` — sum of all combo points (Limited format)

URL query params (`beys`, `format`, `beynum`) hydrate state on mount and are updated on share.

### Data

`src/data/beyparts.json` is the sole data source — 1700+ lines defining all parts (blades, assist blades, ratchets, bits) with stats: `attack`, `defense`, `stamina`, `xDash`, `burstResistance`, `points`, `type`, `image`, `spinType`, `line`.

`src/constants.js` exports `BEYBLADE_DB` (aggregates all part categories) and format/patch constants.

### Key Behaviors

- **CX line**: blades with `line: "CX"` unlock an extra "Assist Blade" slot in `Beyblade.jsx`
- **Turbo special case**: selecting the "Turbo (Ratchet Integrated Bit)" syncs ratchet/bit fields automatically
- **Limited format**: parts are sorted by points; already-used parts are disabled; total points displayed
- **Download**: `html-to-image` converts a combo `div` to PNG — marked experimental, has iOS issues
- **Sharing**: copies URL with encoded query params to clipboard

### Component Map

| File | Role |
|------|------|
| `src/App.jsx` | Layout, state, handlers, URL sync |
| `src/Beyblade.jsx` | Single combo card — stat bars, part display, download |
| `src/PartSelector.jsx` | Reusable `react-select` dropdown for any part type |
| `src/data/beyparts.json` | Parts database |
| `src/constants.js` | DB aggregation, format labels, patch version |

### Adding Parts (New Release)

1. Drop updated `MasterData.json` into repo root
2. Run `just sync` — this decodes the data, interactively prompts for any new parts needing names/images/points, and regenerates `beyparts.json`
3. Add part images to `public/images/` (or use `fetch_part_images.js` for wiki-sourced images)
4. Run `just generate` if you only need to regenerate after manual override edits

### Releasing
- bump version

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
