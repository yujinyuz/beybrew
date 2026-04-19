# BeyBrew

A client-side **Beyblade X** deck builder. Build and share combos, compare stats, and export your deck as a PNG.

**Live app:** https://beybladebrew.com

---

## Screenshots

![Deck Builder](docs/screenshots/deck-builder.png)
*Build your deck by selecting blade, ratchet, and bit for each combo*

![Limited Format](docs/screenshots/limited-format.png)
*Limited format — parts sorted by points, duplicates disabled, total tracked*

---

## Features

- **Standard & Limited formats** — Standard enforces no duplicate parts; Limited tracks total points per deck
- **CX line support** — CX blades unlock an extra Assist Blade + Lock Chip slot
- **Stat bars** — Aggregated Attack, Defense, Stamina, and Burst Resistance per combo
- **Randomizer** — Randomize the full deck or individual combos
- **Share via URL** — Deck state is encoded in the URL; paste to share
- **PNG export** — Download individual combo cards or the full deck as a branded image
- **Turbo auto-sync** — Selecting Turbo (Ratchet Integrated Bit) syncs ratchet/bit automatically

---

## Tech Stack

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [react-select](https://react-select.com/) for part dropdowns
- [modern-screenshot](https://github.com/qq15725/modern-screenshot) for PNG export

---

## Development

```bash
npm install
npm run dev        # Start dev server at localhost:5173
npm run build      # Production build → /dist
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix ESLint violations
npm run deploy     # Build + deploy to GitHub Pages
```

---

## Adding Parts

1. Add the part entry to the appropriate array in `src/data/beyparts.js` — follow the existing object shape for that part type.
2. Place the part image in `public/images/`.
3. Run `npm run dev` to verify it appears correctly in the selector.
