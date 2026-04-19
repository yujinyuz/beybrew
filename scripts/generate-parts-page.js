import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import BeyParts from '../src/data/beyparts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, '..', 'public');
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
  const resolved = part.modes ? { ...part, ...part.modes[0] } : part;
  const id = slug(part.name);
  const spinLabel = part.spinType === 'left' ? 'Left' : 'Right';
  const hasSpinType = !!part.spinType;
  const hasStats = resolved.attack != null && (resolved.attack + (resolved.defense ?? 0) + (resolved.stamina ?? 0)) > 0;
  const alias = part.alias || (part.altname && part.altname !== part.name ? part.altname : null);
  const effectiveImage = resolved.image || null;
  const safeName = (part.name || '').replace(/"/g, '&quot;');

  return `
    <article id="${id}" class="part-card">
      ${effectiveImage ? `<div class="part-img-wrap" data-img="${effectiveImage}" data-name="${safeName}" onclick="openLb(this.dataset.img,this.dataset.name)" title="Click to zoom"><img class="part-img" src="/images/${effectiveImage}" alt="${safeName}" loading="lazy"><span class="zoom-hint">zoom</span></div>` : ''}
      <h3>${part.name}${alias ? ` <span class="alias">(${alias})</span>` : ''}</h3>
      <dl>
        ${resolved.type ? `<dt>Type</dt><dd>${resolved.type.charAt(0).toUpperCase() + resolved.type.slice(1)}</dd>` : ''}
        ${hasSpinType ? `<dt>Spin</dt><dd>${spinLabel}</dd>` : ''}
        ${resolved.line ? `<dt>Line</dt><dd>${resolved.line}</dd>` : ''}
        ${hasStats ? `
        <dt>Attack</dt><dd>${resolved.attack} ${statBar(resolved.attack, 'attack')}</dd>
        <dt>Defense</dt><dd>${resolved.defense} ${statBar(resolved.defense, 'defense')}</dd>
        <dt>Stamina</dt><dd>${resolved.stamina} ${statBar(resolved.stamina, 'stamina')}</dd>
        ` : ''}
        ${resolved.xDash != null ? `<dt>X-Dash</dt><dd>${resolved.xDash} ${statBar(resolved.xDash, 'xDash')}</dd>` : ''}
        ${resolved.burstResistance != null ? `<dt>Burst Resistance</dt><dd>${resolved.burstResistance} ${statBar(resolved.burstResistance, 'burstResistance')}</dd>` : ''}
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
    .part-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; position: relative; }
    .part-card h3 { font-size: 0.95rem; color: var(--text); margin-bottom: 0.6rem; }
    .alias { color: var(--muted); font-weight: normal; font-size: 0.85em; }
    dl { display: grid; grid-template-columns: auto 1fr; gap: 0.2rem 0.75rem; font-size: 0.8rem; }
    dt { color: var(--muted); }
    dd { color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
    .stat-bar { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
    .stat-fill { height: 100%; background: var(--accent); border-radius: 2px; }
    .desc { margin-top: 0.6rem; font-size: 0.75rem; color: var(--muted); line-height: 1.4; }
    .part-card::after { content: ''; display: table; clear: both; }
    .part-img-wrap { float: right; margin: 0 0 8px 12px; cursor: zoom-in; position: relative; }
    .part-img { width: 72px; height: 72px; background: #fff; border-radius: 6px; border: 1px solid rgba(0,212,255,0.2); object-fit: contain; display: block; transition: transform 0.15s, box-shadow 0.15s; }
    .part-img-wrap:hover .part-img { transform: scale(1.05); box-shadow: 0 4px 20px rgba(0,212,255,0.25); }
    .zoom-hint { position: absolute; bottom: 3px; right: 3px; background: rgba(0,0,0,0.65); border-radius: 3px; padding: 1px 4px; font-size: 9px; color: #fff; opacity: 0; transition: opacity 0.15s; pointer-events: none; }
    .part-img-wrap:hover .zoom-hint { opacity: 1; }
    #lb { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    #lb.open { display: flex; }
    .lb-inner { background: var(--surface); border: 1px solid rgba(0,212,255,0.3); border-radius: 12px; padding: 24px; text-align: center; max-width: 360px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.7); position: relative; }
    .lb-img { width: 240px; height: 240px; object-fit: contain; background: #fff; border-radius: 8px; display: block; margin: 0 auto 12px; }
    .lb-name { font-size: 1rem; font-weight: 600; color: var(--text); }
    .lb-close { position: absolute; top: 10px; right: 12px; background: none; border: none; color: var(--muted); font-size: 1.2rem; cursor: pointer; line-height: 1; padding: 2px 6px; }
    .lb-close:hover { color: var(--text); }
    .src-btn { display: inline-flex; align-items: center; gap: 4px; background: rgba(0,212,255,0.08); border: 1px solid var(--border); border-radius: 20px; padding: 2px 9px 2px 6px; font-size: 11px; font-weight: 600; color: var(--accent); cursor: pointer; font-family: inherit; margin-top: 6px; transition: background 0.15s; }
    .src-btn:hover { background: rgba(0,212,255,0.15); }
    .src-pop { display: none; position: absolute; top: calc(100% + 6px); left: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; min-width: 260px; max-width: 320px; box-shadow: 0 12px 40px rgba(0,0,0,0.5); z-index: 100; font-size: 11px; line-height: 1.7; }
    .src-pop.open { display: block; }
    .src-pop-title { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; font-weight: 700; }
    .src-pop-item { color: var(--text); font-weight: 600; padding: 2px 0; }
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
  <div id="lb" onclick="if(event.target===this)closeLb()">
    <div class="lb-inner">
      <button class="lb-close" onclick="closeLb()">&#x2715;</button>
      <img class="lb-img" src="" alt="">
      <div class="lb-name"></div>
    </div>
  </div>
  <script>
    var _lb = document.getElementById('lb');
    var _lbImg = _lb.querySelector('.lb-img');
    var _lbName = _lb.querySelector('.lb-name');
    function openLb(img, name) {
      _lbImg.src = '/images/' + img;
      _lbImg.alt = name;
      _lbName.textContent = name;
      _lb.classList.add('open');
    }
    function closeLb() { _lb.classList.remove('open'); }
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeLb(); });
    var _outsideHandler = null;
    function clearOutsideHandler() {
      if (_outsideHandler) {
        document.removeEventListener('mousedown', _outsideHandler);
        _outsideHandler = null;
      }
    }
    function toggleSrc(id) {
      var pop = document.getElementById('src-pop-' + id);
      var isOpen = pop.classList.contains('open');
      document.querySelectorAll('.src-pop.open').forEach(function(p) { p.classList.remove('open'); });
      clearOutsideHandler();
      if (!isOpen) {
        pop.classList.add('open');
        _outsideHandler = function(e) {
          var btn = document.getElementById('src-btn-' + id);
          if (!pop.contains(e.target) && e.target !== btn) {
            pop.classList.remove('open');
            clearOutsideHandler();
          }
        };
        document.addEventListener('mousedown', _outsideHandler);
      }
    }
  </script>
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

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'parts.html'), partsHtml, 'utf8');
writeFileSync(join(outputDir, 'sitemap.xml'), sitemapXml, 'utf8');
writeFileSync(join(outputDir, 'robots.txt'), robotsTxt, 'utf8');

console.log('✓ public/parts.html');
console.log('✓ public/sitemap.xml');
console.log('✓ public/robots.txt');
