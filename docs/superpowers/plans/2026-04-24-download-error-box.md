# Download Error Box Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a download fails, show a small persistent box with a copy-pasteable error message (JS error + export style + browser UA) so users can share it with a developer.

**Architecture:** All changes are in `src/App.jsx`. A small `DownloadErrorBox` component is defined inline (above the `App` function), both catch blocks are updated to capture the real error with context, the 4-second auto-clear effect is removed, and the existing `<span>` is replaced with `<DownloadErrorBox>`.

**Tech Stack:** React, inline styles (matching existing `--color-*` CSS variables), `navigator.clipboard`

---

### Task 1: Add DownloadErrorBox component

**Files:**
- Modify: `src/App.jsx` — add component above the `App` function (around line 56, after the `surface`/`surfaceBox` constants)

- [ ] **Step 1: Insert the DownloadErrorBox component**

Find this line in `src/App.jsx` (around line 56):
```js
const surface = { background: 'var(--color-surface)', border: '1px solid var(--color-border)' };
```

Insert the following **above** that line:

```jsx
function DownloadErrorBox({ error, onDismiss }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(error).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <div style={{ border: '1px solid #ff4455', borderRadius: '8px', padding: '8px', marginTop: '8px', background: 'var(--color-surface)' }}>
      <textarea
        readOnly
        value={error}
        rows={3}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: '11px', background: 'transparent', color: '#ff4455', border: 'none', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
        <button
          onClick={handleCopy}
          style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

```

- [ ] **Step 2: Verify the file parses**

```bash
npm run lint
```

Expected: no new errors related to `DownloadErrorBox`.

---

### Task 2: Update catch blocks to capture real error

**Files:**
- Modify: `src/App.jsx` — both `.catch()` calls in `handleDownloadDeck` and `handleDownloadCombo`

- [ ] **Step 1: Update handleDownloadDeck catch block**

Find (around line 209):
```js
      .catch(() => setDownloadError('Download failed. Try again.'))
```

Replace with:
```js
      .catch((e) => setDownloadError(`Error: ${e?.message ?? String(e)}\nStyle: ${resolvedStyle} | ${navigator.userAgent}`))
```

- [ ] **Step 2: Update handleDownloadCombo catch block**

Find (around line 242):
```js
      .catch(() => setDownloadError('Download failed. Try again.'))
```

Replace with:
```js
      .catch((e) => setDownloadError(`Error: ${e?.message ?? String(e)}\nStyle: ${resolvedStyle} | ${navigator.userAgent}`))
```

- [ ] **Step 3: Clear previous error at the start of each handler**

In `handleDownloadDeck`, find (around line 174):
```js
    setIsDownloading(true);
```
Add `setDownloadError(null);` on the line immediately before it:
```js
    setDownloadError(null);
    setIsDownloading(true);
```

In `handleDownloadCombo`, find the equivalent `setIsDownloading(true);` (around line 221) and do the same:
```js
    setDownloadError(null);
    setIsDownloading(true);
```

- [ ] **Step 4: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

---

### Task 3: Remove auto-clear and replace the error span

**Files:**
- Modify: `src/App.jsx` — remove the timeout effect, replace `<span>` with `<DownloadErrorBox>`

- [ ] **Step 1: Remove the auto-clear useEffect**

Find and delete this block (around lines 157–161):
```js
  useEffect(() => {
    if (!downloadError) return;
    const t = setTimeout(() => setDownloadError(null), 4000);
    return () => clearTimeout(t);
  }, [downloadError]);
```

- [ ] **Step 2: Replace the error span with DownloadErrorBox**

Find (around line 765):
```jsx
            {downloadError && <span className="text-xs" style={{ color: '#ff4455' }}>{downloadError}</span>}
```

Replace with:
```jsx
            {downloadError && <DownloadErrorBox error={downloadError} onDismiss={() => setDownloadError(null)} />}
```

- [ ] **Step 3: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

---

### Task 4: Manual verification and commit

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Trigger a download failure**

Open the app. Open DevTools → Network tab → right-click a part image request → "Block request URL". Then click a Download button. The error box should appear with a red border containing:
- Line 1: `Error: <actual JS error message>`
- Line 2: `Style: <style-slug> | <browser UA string>`

- [ ] **Step 3: Test Copy button**

Click **Copy** — it should briefly show "Copied!". Paste into a text editor to confirm the full detail string was copied.

- [ ] **Step 4: Test dismiss**

Click **×** — the box should disappear.

- [ ] **Step 5: Test retry clears error**

With the error box showing, click Download again. The box should disappear immediately (cleared by `setDownloadError(null)` at the top of the handler) while the new download attempt runs.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat(ux): show copy-pasteable error box on download failure"
```
