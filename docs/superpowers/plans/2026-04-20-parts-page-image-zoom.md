# Parts Page: Image + Zoom + Included-in-Sets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add part images (72×72, float right, click-to-zoom lightbox) and "included in sets" source popovers to `parts.html`.

**Architecture:** All changes live in `scripts/generate-parts-page.js`, which is the sole generator for `public/parts.html`. The lightbox is a single `<div id="lb">` modal reused by all images. Source popovers replicate the existing React `SourcePopover` pattern — a pill button that toggles a positioned dropdown on click, closes on click-outside. No React files or `beyparts.js` are touched.

**Tech Stack:** Node.js generator script, vanilla HTML/CSS/JS in the output.

---

### Task 1: Add CSS for image, lightbox, clearfix, and sets popover

**Files:**
- Modify: `scripts/generate-parts-page.js` — extend the `<style>` block in the `partsHtml` template

- [ ] **Step 1: Add new CSS rules after the `.desc` rule in the style block**

In `scripts/generate-parts-page.js`, find:

```js
    .desc { margin-top: 0.6rem; font-size: 0.75rem; color: var(--muted); line-height: 1.4; }
    footer {
```

Replace with:

```js
    .desc { margin-top: 0.6rem; font-size: 0.75rem; color: var(--muted); line-height: 1.4; }
    .part-card::after { content: ''; display: table; clear: both; }
    .part-img-wrap { float: right; margin: 0 0 8px 12px; cursor: zoom-in; position: relative; }
    .part-img { width: 72px; height: 72px; background: #fff; border-radius: 6px; border: 1px solid rgba(0,212,255,0.2); object-fit: contain; display: block; transition: transform 0.15s, box-shadow 0.15s; }
    .part-img-wrap:hover .part-img { transform: scale(1.05); box-shadow: 0 4px 20px rgba(0,212,255,0.25); }
    .zoom-hint { position: absolute; bottom: 3px; right: 3px; background: rgba(0,0,0,0.65); border-radius: 3px; padding: 1px 4px; font-size: 9px; color: #fff; opacity: 0; transition: opacity 0.15s; pointer-events: none; }
    .part-img-wrap:hover .zoom-hint { opacity: 1; }
    #lb { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    #lb.open { display: flex; }
    .lb-inner { background: #0f1629; border: 1px solid rgba(0,212,255,0.3); border-radius: 12px; padding: 24px; text-align: center; max-width: 360px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.7); position: relative; }
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
    footer {
```

- [ ] **Step 2: Regenerate to verify CSS is well-formed**

```bash
node scripts/generate-parts-page.js
```

Expected output:
```
✓ public/parts.html
✓ public/sitemap.xml
✓ public/robots.txt
```

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-parts-page.js public/parts.html
git commit -m "feat(parts): add CSS for image, lightbox, and sets popover"
```

---

### Task 2: Add lightbox HTML and inline JS

**Files:**
- Modify: `scripts/generate-parts-page.js` — add `<div id="lb">` and `<script>` before `</body>` in the template

- [ ] **Step 1: Insert lightbox HTML and JS before `</body>`**

In `scripts/generate-parts-page.js`, find:

```js
  <footer>
    <p>Generated ${buildDate} · <a href="/">BeyBrew Deck Builder</a></p>
  </footer>
</body>
</html>`;
```

Replace with:

```js
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
    function openLb(img, name) {
      var lb = document.getElementById('lb');
      lb.querySelector('.lb-img').src = '/images/' + img;
      lb.querySelector('.lb-name').textContent = name;
      lb.classList.add('open');
    }
    function closeLb() { document.getElementById('lb').classList.remove('open'); }
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeLb(); });
    function toggleSrc(id) {
      var pop = document.getElementById('src-pop-' + id);
      var isOpen = pop.classList.contains('open');
      document.querySelectorAll('.src-pop.open').forEach(function(p) { p.classList.remove('open'); });
      if (!isOpen) {
        pop.classList.add('open');
        function handleOutside(e) {
          var btn = document.getElementById('src-btn-' + id);
          if (!pop.contains(e.target) && e.target !== btn) {
            pop.classList.remove('open');
            document.removeEventListener('mousedown', handleOutside);
          }
        }
        document.addEventListener('mousedown', handleOutside);
      }
    }
  </script>
</body>
</html>`;
```

- [ ] **Step 2: Regenerate and spot-check for JS errors**

```bash
node scripts/generate-parts-page.js
```

Open `public/parts.html` directly in a browser (or `npm run dev` → `/parts.html`). Open DevTools console. Verify no errors on page load.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-parts-page.js public/parts.html
git commit -m "feat(parts): add lightbox modal and sets popover JS"
```

---

### Task 3: Render part image in partCard()

**Files:**
- Modify: `scripts/generate-parts-page.js` — update `partCard()` to compute `effectiveImage` and render the float-right image block

- [ ] **Step 1: Add `effectiveImage` and `safeName` to the top of `partCard()`**

Find the opening of `partCard()`:

```js
function partCard(part) {
  const resolved = part.modes ? { ...part, ...part.modes[0] } : part;
  const id = slug(part.name);
  const spinLabel = part.spinType === 'left' ? 'Left' : 'Right';
  const hasSpinType = !!part.spinType;
  const hasStats = resolved.attack != null && (resolved.attack + (resolved.defense ?? 0) + (resolved.stamina ?? 0)) > 0;
  const alias = part.alias || (part.altname && part.altname !== part.name ? part.altname : null);
```

Replace with:

```js
function partCard(part) {
  const resolved = part.modes ? { ...part, ...part.modes[0] } : part;
  const id = slug(part.name);
  const spinLabel = part.spinType === 'left' ? 'Left' : 'Right';
  const hasSpinType = !!part.spinType;
  const hasStats = resolved.attack != null && (resolved.attack + (resolved.defense ?? 0) + (resolved.stamina ?? 0)) > 0;
  const alias = part.alias || (part.altname && part.altname !== part.name ? part.altname : null);
  const effectiveImage = part.modes ? (part.modes[0]?.image || part.image) : part.image;
  const safeName = (part.name || '').replace(/"/g, '&quot;');
```

- [ ] **Step 2: Add the image block to the article in `partCard()`**

Find the return statement's opening lines:

```js
  return `
    <article id="${id}" class="part-card">
      <h3>${part.name}${alias ? ` <span class="alias">(${alias})</span>` : ''}</h3>
```

Replace with:

```js
  return `
    <article id="${id}" class="part-card">
      ${effectiveImage ? `<div class="part-img-wrap" data-img="${effectiveImage}" data-name="${safeName}" onclick="openLb(this.dataset.img,this.dataset.name)" title="Click to zoom"><img class="part-img" src="/images/${effectiveImage}" alt="${safeName}" loading="lazy"><span class="zoom-hint">zoom</span></div>` : ''}
      <h3>${part.name}${alias ? ` <span class="alias">(${alias})</span>` : ''}</h3>
```

- [ ] **Step 3: Regenerate and verify images render**

```bash
node scripts/generate-parts-page.js
```

Open `public/parts.html` in a browser. Verify:
- Part cards with `image` defined show a 72×72 thumbnail floated right of the title and stats
- Hovering a thumbnail shows scale-up and "zoom" hint label
- Clicking a thumbnail opens the lightbox showing the image at 240×240 with the part name
- Pressing `Esc` closes the lightbox
- Clicking the backdrop (outside the modal box) closes the lightbox
- Parts without an `image` field (e.g. some lock chips) show no image block — no broken img tags

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-parts-page.js public/parts.html
git commit -m "feat(parts): render part images with click-to-zoom lightbox"
```

---

### Task 4: Render "included in sets" popover in partCard()

**Files:**
- Modify: `scripts/generate-parts-page.js` — add source popover block after the description in `partCard()`

- [ ] **Step 1: Add sets popover block at the end of the article in `partCard()`**

Find the closing lines of the return template in `partCard()`:

```js
      ${part.description ? `<p class="desc">${part.description}</p>` : ''}
    </article>`;
```

Replace with:

```js
      ${part.description ? `<p class="desc">${part.description}</p>` : ''}
      ${(part.source?.length ?? 0) > 0 ? `<div style="position:relative;display:inline-block"><button class="src-btn" id="src-btn-${id}" onclick="toggleSrc('${id}')"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 7h6M5 10h4"/></svg> ${part.source.length} ${part.source.length === 1 ? 'set' : 'sets'}</button><div class="src-pop" id="src-pop-${id}"><div class="src-pop-title">Included in these sets</div>${part.source.map(s => `<div class="src-pop-item">${s}</div>`).join('')}</div></div>` : ''}
    </article>`;
```

- [ ] **Step 2: Regenerate and verify sets popovers render**

```bash
node scripts/generate-parts-page.js
```

Open `public/parts.html` in a browser. Verify:
- Parts with `source` data show a pill button (e.g. "11 sets") below the description
- Clicking the pill opens a popover listing all set names (e.g. "BX-22 DRANSWORD3-60F", etc.)
- Clicking anywhere outside the popover closes it
- Clicking the pill again while open closes it
- Parts with no `source` array (or empty array) show no pill button

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-parts-page.js public/parts.html
git commit -m "feat(parts): add included-in-sets popover to part cards"
```
