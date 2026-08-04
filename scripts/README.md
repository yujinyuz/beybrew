# Scripts

## Workflow for a New Beyblade Release

### Quick (one-command)

```
just sync
```

This runs the full pipeline: decode → prompt for overrides → generate.

### Step by step

1. Get the updated `MasterData.json` from the official app
2. Run the decoder to update `beydata/`:
   ```
   just decode
   ```
3. Run the interactive prompt for new parts:
   ```
   just prompt-overrides
   ```
   This shows each new part (type, stats, description) and asks for:
   - **Display name** — the human-readable name (e.g. `Dran Strike`)
   - **Image filename** — the image file in `public/images/`
   - **Points** — tournament point cost (default: 1)
   - Optional: `spinType`, `alias`, `line`, `type`, `description`
4. Regenerate `beyparts.json`:
   ```
   just generate
   ```

## Overriding Stats

To pin a stat value (e.g. if official data is wrong):
```json
"WOLFHUNT": {
  "name": "Wolf Hunt",
  "image": "WolfHunt_0-60DB.webp",
  "attack": 30
}
```
The pinned `attack` will persist across regenerations even if beydata changes.

## Migration (one-time)

`migrate_overrides.py` bootstrapped `parts-overrides.json` from the hand-edited
`beyparts.json`. Do not run it again — it will refuse if the file already exists.

## Scripts

- `generate_parts.js` — merge beydata + overrides → `src/data/beyparts.json`
- `migrate_overrides.py` — one-time bootstrapper (already run)
