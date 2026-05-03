decode master_data="MasterData.json":
  bun scripts/extract_beydata.js {{master_data}}

generate:
  bun scripts/generate_parts.js

migrate:
  python scripts/migrate_overrides.py

dev:
  bun run dev

download-wiki url:
  bun scripts/wiki_download.js {{url}}
