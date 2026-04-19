# SEO: Static Parts Reference Page

**Date:** 2026-04-19
**Goal:** Improve organic search ranking for Beyblade X part-level queries (e.g. "Dran Sword stats", "3-60F ratchet Beyblade X") by surfacing BeyBrew's parts database as indexable HTML.

## Problem

BeyBrew is a React SPA. Crawlers see an empty `<div id="root"></div>`. The 1700+ parts in the database live in a JS bundle — invisible to search engines. `react-select` dropdowns only render options when open, so prerendering the app shell alone does not expose part names as HTML text.

## Solution

A build-time Node script generates a fully static `dist/parts.html` from `src/data/beyparts.js`. The script runs after `vite build` as a post-build step. No new npm dependencies required.

## Architecture

### Build pipeline change

`package.json` `build` script:
```
vite build && node scripts/generate-parts-page.js
```

### Script: `scripts/generate-parts-page.js`

- Imports parts data from `src/data/beyparts.js` (works as plain `.js` since `package.json` has `"type": "module"`)
- Generates `dist/parts.html`
- Generates `dist/sitemap.xml`
- Generates `dist/robots.txt`

## Parts Page (`/parts.html`)

### Structure

```
<html>
  <head>
    title, description, canonical, OG tags
  </head>
  <body>
    header (BeyBrew branding + link back to builder)
    <main>
      <section id="blades"><h2>Blades</h2> …articles…</section>
      <section id="assist-blades"><h2>Assist Blades</h2> …</section>
      <section id="ratchets"><h2>Ratchets</h2> …</section>
      <section id="bits"><h2>Bits</h2> …</section>
    </main>
    footer
  </body>
</html>
```

### Part card

Each part rendered as:
```html
<article id="dran-sword">
  <h3>Dran Sword</h3>
  <dl>
    <dt>Type</dt><dd>Attack</dd>
    <dt>Spin</dt><dd>Right</dd>
    <dt>Attack</dt><dd>8</dd>
    <dt>Defense</dt><dd>2</dd>
    <dt>Stamina</dt><dd>3</dd>
    <dt>Points</dt><dd>4</dd>
    <dt>Line</dt><dd>Standard</dd>
  </dl>
</article>
```

Stats rendered as visible `<dl>` definition lists (not bars) — fully indexable text.

### Styling

Minimal inline CSS matching BeyBrew's dark theme (`#080c18` background, white text). No Tailwind runtime, no external CSS — self-contained file.

### Meta tags

- `<title>Beyblade X Parts — BeyBrew</title>`
- `<meta name="description" content="Complete list of Beyblade X parts — blades, ratchets, and bits — with attack, defense, and stamina stats.">`
- `<link rel="canonical" href="https://beybladebrew.com/parts.html">`
- OG tags pointing to `https://beybladebrew.com/parts.html`

## Supporting SEO Files

### `dist/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://beybladebrew.com/</loc>
    <lastmod>YYYY-MM-DD</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://beybladebrew.com/parts.html</loc>
    <lastmod>YYYY-MM-DD</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

### `dist/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://beybladebrew.com/sitemap.xml
```

## Changes to `index.html`

1. Add `<link rel="canonical" href="https://beybladebrew.com/" />`
2. Update `og:url` from old GitHub Pages URL to `https://beybladebrew.com/`
3. Update `twitter:` meta to match
4. Add a "Browse all parts →" link in the app's footer (`App.jsx`) pointing to `/parts.html` as a plain `<a href>` (not a React Router link — it's a separate static file). This makes the page crawlable via link-following from the root.

## Netlify config

Add to `netlify.toml` so the static `/parts.html` is served correctly and not caught by the SPA catch-all:

```toml
[[headers]]
  for = "/parts.html"
  [headers.values]
    Cache-Control = "public, max-age=86400"
```

The existing `/*` → `/index.html` redirect uses `status = 200` (rewrite, not redirect), which means `/parts.html` — being a real file in `dist/` — is served directly without being caught by the rewrite rule. No additional redirect config needed.

## Out of Scope

- Individual part URLs (`/parts/dran-sword`) — the anchor ID approach (`/parts.html#dran-sword`) achieves deep linking without additional routing complexity
- OG image redesign — separate task
- Structured data (JSON-LD) — low additional value given the parts page already provides indexable text
