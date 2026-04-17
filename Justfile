decode master_data="MasterData.json":
  python decoder.py

generate:
  python scripts/generate_parts.py

migrate:
  python scripts/migrate_overrides.py

dev:
  npm run dev
