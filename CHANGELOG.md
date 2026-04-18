# Changelog

## Unreleased

### New Features

**Social Media Export (Download Redesign)**
- New `ExportCard` component renders a branded dark-theme PNG card for sharing
- Full deck download: BEYBREW header, all combos with blade images and stat bars, `BEYBLADEBREW.COM` footer
- Per-combo download: individual card (320px) with larger blade image, full stats, spin/bit type subtext
- Small download icon button added to each combo card header
- Download button upgraded: loading state ("Generating…"), inline error message, removed `[experimental]` label

**Assist Blade Type Images**
- Type images now shown in the assist blade selector dropdown
- Removed redundant ATK/DEF/STA/BAL text badges from assist blade entries

### Bug Fixes

- Fixed stat bar percentage calculation in export card (bars were always rendering at 100%)
- Fixed `handleDownloadCombo` not participating in `isDownloading` state (prevented race conditions)
- Removed stale `useRef` from `useCallback` dependency arrays
- Added null-guards to download handlers



### New Features

**Lock Chips (CX Line)**
- Added Lock Chip as a new part type, exclusive to CX line blades
- Phoenix and Leon lock chip images included
- Line badge displayed in the blade selector to indicate CX compatibility
- Lock chips appear in the combo summary and are included in randomization

**Randomizer**
- Added "Randomize All" button to generate a full random deck at once
- Added per-card randomize button on each combo card

**Part Type Badges**
- ATK / DEF / STA / BAL type badges now shown in part selectors for quick identification

### Bug Fixes

- Fixed deck count and Assist Blade slot not restoring correctly when loading a shared URL
- Fixed BAL badge color (now red, matching the balance type image)

### UI Improvements

- Polished stat bars, combo summary layout, and PartSelector styling
- Improved text readability throughout
- Removed top banner

### Parts Data

- Refreshed part images with canonical filenames from the Beyblade wiki
- Updated parts database with new beydata source entries
- Parts database is now generated from source data scripts (internal)
