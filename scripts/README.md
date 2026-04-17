# Scripts

## Workflow for a New Beyblade Release

1. Get the updated `MasterData.json` from the official app
2. Run the decoder to update `beydata/`:
   ```
   just decode
   ```
3. Download the part image(s) and save them to the images directory
4. Add an entry to `src/data/parts-overrides.json`:
   ```json
   "blades": {
     "NEWBLADE": {
       "name": "New Blade",
       "image": "NewBlade_3-70X.webp"
     }
   }
   ```
   - `name` is the human-readable display name
   - `image` is the filename
   - `points` defaults to 1 — add it only if the tournament cost differs
5. Regenerate `beyparts.js`:
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
`beyparts.js`. Do not run it again — it will refuse if the file already exists.

## Scripts

- `generate_parts.py` — merge beydata + overrides → `src/data/beyparts.js`
- `migrate_overrides.py` — one-time bootstrapper (already run)
