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

const GRADIENTS = {
  attack:          'linear-gradient(90deg,#1565c0,#00d4ff)',
  defense:         'linear-gradient(90deg,#2e7d32,#00e676)',
  stamina:         'linear-gradient(90deg,#e65100,#ffcc02)',
  xDash:           'linear-gradient(90deg,#b71c1c,#ff6d00)',
  burstResistance: 'linear-gradient(90deg,#4a148c,#aa00ff)',
};

function statBar(value, stat, max = 100) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const bg = GRADIENTS[stat] ?? 'var(--accent)';
  return `<div class="stat-bar"><div class="stat-fill" style="width:${pct}%;background:${bg}"></div></div>`;
}

function partCard(part) {
  const id = slug(part.name);
  const spinLabel = part.spinType === 'left' ? 'Left' : 'Right';
  const hasSpinType = !!part.spinType;
  const hasStats = part.attack != null && (part.attack + (part.defense ?? 0) + (part.stamina ?? 0)) > 0;
  const alias = part.alias || (part.altname && part.altname !== part.name ? part.altname : null);

  return `
    <article id="${id}" class="part-card">
      <h3>${part.name}${alias ? ` <span class="alias">(${alias})</span>` : ''}</h3>
      <dl>
        ${part.type ? `<dt>Type</dt><dd>${part.type.charAt(0).toUpperCase() + part.type.slice(1)}</dd>` : ''}
        ${hasSpinType ? `<dt>Spin</dt><dd>${spinLabel}</dd>` : ''}
        ${part.line ? `<dt>Line</dt><dd>${part.line}</dd>` : ''}
        ${part.points != null ? `<dt>Points</dt><dd>${part.points}</dd>` : ''}
        ${hasStats ? `
        <dt>Attack</dt><dd>${part.attack} ${statBar(part.attack, 'attack')}</dd>
        <dt>Defense</dt><dd>${part.defense} ${statBar(part.defense, 'defense')}</dd>
        <dt>Stamina</dt><dd>${part.stamina} ${statBar(part.stamina, 'stamina')}</dd>
        ` : ''}
        ${part.xDash != null ? `<dt>X-Dash</dt><dd>${part.xDash} ${statBar(part.xDash, 'xDash')}</dd>` : ''}
        ${part.burstResistance != null ? `<dt>Burst Resistance</dt><dd>${part.burstResistance} ${statBar(part.burstResistance, 'burstResistance')}</dd>` : ''}
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
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Beyblade X Parts — BeyBrew" />
  <meta name="twitter:description" content="Complete list of Beyblade X parts with stats. Build your deck at BeyBrew." />
  <meta name="twitter:image" content="${BASE_URL}/android-chrome-512x512.png" />
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
