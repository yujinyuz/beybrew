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

# Interactive prompt for new parts needing overrides
prompt-overrides:
  bun scripts/prompt_overrides.js

# Full pipeline: decode → prompt for overrides → generate
sync master_data="MasterData.json":
  just decode {{master_data}}
  just prompt-overrides
  just generate
