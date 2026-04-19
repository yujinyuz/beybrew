# SEO: Static Parts Reference Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a static `dist/parts.html` at build time listing all 1700+ Beyblade X parts as indexable HTML, plus `sitemap.xml`, `robots.txt`, and canonical/OG URL fixes.

**Architecture:** A post-build Node script (`scripts/generate-parts-page.js`) imports `src/data/beyparts.js` directly and writes three files to `dist/`. The main `App.jsx` footer gets a plain `<a>` link to `/parts.html` so crawlers can discover it. `index.html` gets a canonical tag and corrected OG URLs.

**Tech Stack:** Node.js (built-in `fs`/`path`), ESM imports (package.json already has `"type": "module"`), Vite, React

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `scripts/generate-parts-page.js` | Create | Generates `dist/parts.html`, `dist/sitemap.xml`, `dist/robots.txt` |
| `package.json` | Modify | Append `&& node scripts/generate-parts-page.js` to build script |
| `index.html` | Modify | Add canonical tag; fix `og:url`, `twitter:*` from GitHub Pages to beybladebrew.com |
| `src/App.jsx` | Modify | Add "Browse all parts →" link in footer |
| `netlify.toml` | Modify | Add cache headers for `parts.html`, `sitemap.xml`, `robots.txt` |

---

## Task 1: Fix `index.html` canonical and OG URLs

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add canonical and fix meta URLs**

Open `index.html`. Make these changes:

After the `<meta name="theme-color" ...>` line (line 12), add:
```html
  <link rel="canonical" href="https://beybladebrew.com/" />
```

Change line 18 (`og:url`) from:
```html
  <meta property="og:url" content="https://yujinyuz.github.io/beybrew/" />
```
to:
```html
  <meta property="og:url" content="https://beybladebrew.com/" />
```

Change line 21 (`og:image`) from:
```html
  <meta property="og:image" content="https://yujinyuz.github.io/beybrew/android-chrome-512x512.png" />
```
to:
```html
  <meta property="og:image" content="https://beybladebrew.com/android-chrome-512x512.png" />
```

Change line 25 (`twitter:image`) from:
```html
  <meta name="twitter:image" content="https://yujinyuz.github.io/beybrew/android-chrome-512x512.png" />
```
to:
```html
  <meta name="twitter:image" content="https://beybladebrew.com/android-chrome-512x512.png" />
```

- [ ] **Step 2: Verify the file looks correct**

Run:
```bash
grep -n "canonical\|og:url\|og:image\|twitter:image\|github.io" index.html
```
Expected output — canonical present, no remaining `github.io` references:
```
12:  <link rel="canonical" href="https://beybladebrew.com/" />
18:  <meta property="og:url" content="https://beybladebrew.com/" />
21:  <meta property="og:image" content="https://beybladebrew.com/android-chrome-512x512.png" />
25:  <meta name="twitter:image" content="https://beybladebrew.com/android-chrome-512x512.png" />
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix: update OG/canonical URLs to beybladebrew.com"
```

---

## Task 2: Add footer link in `App.jsx`

**Files:**
- Modify: `src/App.jsx:744-780`

- [ ] **Step 1: Add the parts link to the footer**

In `src/App.jsx`, find the footer block (around line 745). It looks like:
```jsx
<footer className="mt-12 text-center space-y-1.5" style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
  <div className="mb-3 h-px mx-auto w-24" style={{ background: 'linear-gradient(90deg,transparent,var(--color-border),transparent)' }} />
  <div>
    Made with <span style={{ color: '#ff4455' }}>♥</span> in Davao, Philippines{' '}
```

Add the following `<div>` immediately after the divider `<div>` (before the "Made with" div):
```jsx
          <div>
            <a href="/parts.html" style={{ color: 'var(--color-accent)' }}>
              Browse all parts →
            </a>
          </div>
```

- [ ] **Step 2: Verify the footer renders**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser. Scroll to the footer. Confirm "Browse all parts →" link appears. Click it — it 404s in dev (file doesn't exist yet), which is expected.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add parts reference link to footer"
```

---

## Task 3: Add netlify.toml cache headers

**Files:**
- Modify: `netlify.toml`

- [ ] **Step 1: Add cache headers for static SEO files**

Open `netlify.toml` and append:
```toml
[[headers]]
  for = "/parts.html"
  [headers.values]
    Cache-Control = "public, max-age=86400"

[[headers]]
  for = "/sitemap.xml"
  [headers.values]
    Cache-Control = "public, max-age=86400"

[[headers]]
  for = "/robots.txt"
  [headers.values]
    Cache-Control = "public, max-age=86400"
```

- [ ] **Step 2: Commit**

```bash
git add netlify.toml
git commit -m "chore: add cache headers for parts.html, sitemap, robots"
```

---

## Task 4: Write the parts page generator script

**Files:**
- Create: `scripts/generate-parts-page.js`

- [ ] **Step 1: Create the script**

Create `scripts/generate-parts-page.js` with this content:

```js
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import BeyParts from '../src/data/beyparts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const buildDate = new Date().toISOString().slice(0, 10);
const BASE_URL = 'https://beybladebrew.com';

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function statBar(value, max = 100) {
  const pct = Math.round((value / max) * 100);
  return `<div class="stat-bar"><div class="stat-fill" style="width:${pct}%"></div></div>`;
}

function partCard(part) {
  const id = slug(part.name);
  const spinLabel = part.spinType === 'left' ? 'Left' : 'Right';
  const hasSpinType = !!part.spinType;
  const hasStats = part.attack != null;

  return `
    <article id="${id}" class="part-card">
      <h3>${part.name}${part.alias ? ` <span class="alias">(${part.alias})</span>` : ''}</h3>
      <dl>
        ${part.type ? `<dt>Type</dt><dd>${part.type.charAt(0).toUpperCase() + part.type.slice(1)}</dd>` : ''}
        ${hasSpinType ? `<dt>Spin</dt><dd>${spinLabel}</dd>` : ''}
        ${part.line ? `<dt>Line</dt><dd>${part.line}</dd>` : ''}
        ${part.points != null ? `<dt>Points</dt><dd>${part.points}</dd>` : ''}
        ${hasStats ? `
        <dt>Attack</dt><dd>${part.attack} ${statBar(part.attack)}</dd>
        <dt>Defense</dt><dd>${part.defense} ${statBar(part.defense)}</dd>
        <dt>Stamina</dt><dd>${part.stamina} ${statBar(part.stamina)}</dd>
        ` : ''}
        ${part.xDash != null ? `<dt>X-Dash</dt><dd>${part.xDash} ${statBar(part.xDash)}</dd>` : ''}
        ${part.burstResistance != null ? `<dt>Burst Resistance</dt><dd>${part.burstResistance} ${statBar(part.burstResistance)}</dd>` : ''}
      </dl>
      ${part.description ? `<p class="desc">${part.description}</p>` : ''}
    </article>`;
}

function section(id, title, parts) {
  const filtered = parts.filter(p => p.name && p.name.trim() && !(p.integratedBit));
  if (!filtered.length) return '';
  return `
  <section id="${id}">
    <h2>${title}</h2>
    <div class="part-grid">
      ${filtered.map(partCard).join('')}
    </div>
  </section>`;
}

const partsHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Beyblade X Parts — BeyBrew</title>
  <meta name="description" content="Complete list of Beyblade X parts — blades, ratchets, and bits — with attack, defense, and stamina stats. Build your deck at BeyBrew." />
  <link rel="canonical" href="${BASE_URL}/parts.html" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${BASE_URL}/parts.html" />
  <meta property="og:title" content="Beyblade X Parts — BeyBrew" />
  <meta property="og:description" content="Complete list of Beyblade X parts with stats. Build your deck at BeyBrew." />
  <meta property="og:image" content="${BASE_URL}/android-chrome-512x512.png" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #080c18;
      --surface: #0f1629;
      --border: #1e2d4a;
      --accent: #00d4ff;
      --text: #e2e8f0;
      --muted: #64748b;
      --attack: #ff6b35;
      --defense: #4ecdc4;
      --stamina: #45b7d1;
    }
    body { background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; line-height: 1.5; padding: 0 1rem 4rem; }
    header { max-width: 900px; margin: 0 auto; padding: 2rem 0 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    header h1 { font-size: 1.5rem; color: var(--accent); letter-spacing: 0.05em; }
    header a { color: var(--accent); text-decoration: none; font-size: 0.9rem; }
    header a:hover { text-decoration: underline; }
    nav { max-width: 900px; margin: 1.5rem auto 0; display: flex; gap: 1rem; flex-wrap: wrap; }
    nav a { color: var(--muted); text-decoration: none; font-size: 0.85rem; padding: 0.3rem 0.75rem; border: 1px solid var(--border); border-radius: 999px; }
    nav a:hover { color: var(--accent); border-color: var(--accent); }
    main { max-width: 900px; margin: 0 auto; }
    section { margin-top: 3rem; }
    section h2 { font-size: 1.25rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.25rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
    .part-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .part-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; }
    .part-card h3 { font-size: 0.95rem; color: var(--text); margin-bottom: 0.6rem; }
    .alias { color: var(--muted); font-weight: normal; font-size: 0.85em; }
    dl { display: grid; grid-template-columns: auto 1fr; gap: 0.2rem 0.75rem; font-size: 0.8rem; }
    dt { color: var(--muted); }
    dd { color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
    .stat-bar { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
    .stat-fill { height: 100%; background: var(--accent); border-radius: 2px; }
    .desc { margin-top: 0.6rem; font-size: 0.75rem; color: var(--muted); line-height: 1.4; }
    footer { max-width: 900px; margin: 4rem auto 0; text-align: center; color: var(--muted); font-size: 0.8rem; border-top: 1px solid var(--border); padding-top: 1.5rem; }
    footer a { color: var(--accent); text-decoration: none; }
  </style>
</head>
<body>
  <header>
    <h1>BeyBrew — Parts Directory</h1>
    <a href="/">← Back to Deck Builder</a>
  </header>
  <nav>
    <a href="#blades">Blades</a>
    <a href="#assist-blades">Assist Blades</a>
    <a href="#over-blades">Over Blades</a>
    <a href="#ratchets">Ratchets</a>
    <a href="#bits">Bits</a>
    <a href="#lock-chips">Lock Chips</a>
  </nav>
  <main>
    ${section('blades', 'Blades', BeyParts.blades)}
    ${section('assist-blades', 'Assist Blades', BeyParts.assist_blades)}
    ${section('over-blades', 'Over Blades', BeyParts.over_blades)}
    ${section('ratchets', 'Ratchets', BeyParts.ratchets)}
    ${section('bits', 'Bits', BeyParts.bits)}
    ${section('lock-chips', 'Lock Chips', BeyParts.lock_chips)}
  </main>
  <footer>
    <p>Generated ${buildDate} · <a href="/">BeyBrew Deck Builder</a></p>
  </footer>
</body>
</html>`;

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${buildDate}</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/parts.html</loc>
    <lastmod>${buildDate}</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>`;

const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml`;

mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, 'parts.html'), partsHtml, 'utf8');
writeFileSync(join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
writeFileSync(join(distDir, 'robots.txt'), robotsTxt, 'utf8');

console.log('✓ dist/parts.html');
console.log('✓ dist/sitemap.xml');
console.log('✓ dist/robots.txt');
```

- [ ] **Step 2: Commit**

```bash
git add scripts/generate-parts-page.js
git commit -m "feat: add build-time parts reference page generator"
```

---

## Task 5: Wire the script into the build

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update the build script**

In `package.json`, change:
```json
"build": "vite build",
```
to:
```json
"build": "vite build && node scripts/generate-parts-page.js",
```

- [ ] **Step 2: Run a full build and verify**

```bash
npm run build
```

Expected output includes:
```
✓ dist/parts.html
✓ dist/sitemap.xml
✓ dist/robots.txt
```

Then verify the files exist:
```bash
ls -lh dist/parts.html dist/sitemap.xml dist/robots.txt
```
Expected: all three files present, `parts.html` should be at least 500KB.

- [ ] **Step 3: Spot-check parts.html**

```bash
grep -c "<article" dist/parts.html
```
Expected: a number above 100 (there are 100+ blades alone).

```bash
grep "Dran Sword\|3-60F\|Vortex" dist/parts.html | head -5
```
Expected: lines containing those part names as visible text.

- [ ] **Step 4: Preview the parts page locally**

```bash
npm run preview
```

Open `http://localhost:4173/parts.html` in a browser. Verify:
- Dark theme matches the main app
- Blades, Ratchets, Bits sections all present
- Part stats visible as text and bars
- "← Back to Deck Builder" link works

Stop the preview server.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "feat: wire generate-parts-page.js into build pipeline"
```

---

## Task 6: Verify sitemap and robots

- [ ] **Step 1: Check sitemap content**

```bash
cat dist/sitemap.xml
```
Expected:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://beybladebrew.com/</loc>
    <lastmod>2026-04-19</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://beybladebrew.com/parts.html</loc>
    <lastmod>2026-04-19</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

- [ ] **Step 2: Check robots.txt content**

```bash
cat dist/robots.txt
```
Expected:
```
User-agent: *
Allow: /
Sitemap: https://beybladebrew.com/sitemap.xml
```

- [ ] **Step 3: Check canonical in index.html**

```bash
grep "canonical" dist/index.html
```
Expected:
```
<link rel="canonical" href="https://beybladebrew.com/" />
```
(Vite copies `index.html` to `dist/index.html` during build, so the canonical tag should be there.)

- [ ] **Step 4: Final commit if anything was missed**

If all checks pass, no additional commit needed. If adjustments were made, commit with:
```bash
git add -p
git commit -m "fix: seo output corrections"
```
