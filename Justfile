decode master_data="MasterData.json":
  node scripts/extract_beydata.js {{master_data}}

generate:
  python scripts/generate_parts.py

migrate:
  python scripts/migrate_overrides.py

dev:
  npm run dev
