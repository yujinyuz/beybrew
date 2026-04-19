decode master_data="MasterData.json":
  node scripts/extract_beydata.js {{master_data}}

generate:
  node scripts/generate_parts.js

migrate:
  python scripts/migrate_overrides.py

dev:
  npm run dev
