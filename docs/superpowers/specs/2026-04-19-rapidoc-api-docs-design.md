# Design: RapiDoc API Docs for /api/data.json

**Date:** 2026-04-19
**Status:** Approved

## Goal

Generate a self-contained `public/api/docs.html` page that renders interactive OpenAPI documentation for the BeyBrew static data API. Personal reference only.

## Output

Single file: `public/api/docs.html`
- OpenAPI 3.0 spec embedded inline as a JS object
- RapiDoc loaded from CDN (`@rapi-doc/rapi-doc`)
- Dark theme, `render-style: read`
- No external spec file; no build step changes

## Generation Script

`scripts/generate-openapi.js` — Node.js script that:
1. Reads `public/api/data.json`
2. Infers schema from actual data (part field names, types, enums)
3. Writes `public/api/docs.html` with spec embedded

Run manually: `node scripts/generate-openapi.js`

## OpenAPI Spec Structure

**Info:**
- title: BeyBrew Parts API
- version: matches patch version from `src/constants.js`
- description: Static parts database for Beyblade X

**Servers:** `["/"]`

**Endpoint:** `GET /api/data.json`
- Response 200: object with 8 named arrays

**Collections documented:**
| Key | Count | Notes |
|-----|-------|-------|
| `blades` | ~193 | Main blades |
| `assist_blades` | ~45 | CX line only |
| `main_blades` | ~39 | Main blades variant |
| `metal_blades` | ~5 | Metal variant |
| `over_blades` | ~5 | Over variant |
| `ratchets` | ~235 | Ratchets |
| `bits` | ~239 | Bits |
| `lock_chips` | ~45 | Lock chips |

**Shared Part schema fields:**
- `id` (string)
- `en_name` (string)
- `type` (string enum: attack, defense, stamina, balance)
- `tags` (array of strings)
- `image` (string, filename)
- `deck_configurable` (boolean)
- `parts_customize_type` (string)
- `release_at` (string, ISO date)
- `collection_order` (integer)
- `defaultStatus` / `updateStatus` (object with attack, defense, stamina, height, dash, burst, weight integers)
- `name` / `catalog_title` / `description` (i18n objects with locale keys)

## Netlify

No changes. Netlify serves real files before the SPA catch-all, so `/api/docs.html` resolves directly.

## Non-Goals

- No live filtering/querying endpoints
- No auth
- No CI automation (run script manually)
