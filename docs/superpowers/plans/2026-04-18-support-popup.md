# Support Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-show a "Support BeyBrew" modal on first visit, on new patch, or after 7 days since last dismissal.

**Architecture:** A new `SupportPopup` component reads `CURRENT_PATCH` from `constants.js` and handles its own localStorage writes on dismiss. `App.jsx` checks `shouldShowSupportPopup()` on mount and controls visibility via a single boolean state.

**Tech Stack:** React, localStorage, existing CSS variable tokens (`--color-*`), Tailwind utility classes.

---

> **Note:** No test framework is configured. Skip test steps; use manual verification instead.

> **Note:** URLs below are derived from the existing footer link (`buymeacoffee.com/yujinyuz`). Verify your Ko-fi, PayPal, and GitHub Sponsors usernames match before deploying.

---

### Task 1: Create `SupportPopup.jsx`

**Files:**
- Create: `src/components/SupportPopup.jsx`

- [ ] **Step 1: Create the file with helper functions and component**

Create `src/components/SupportPopup.jsx` with this exact content:

```jsx
import { CURRENT_PATCH } from '../constants';

const STORAGE_KEY = 'bbx-support-popup';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function shouldShowSupportPopup() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return true;
  try {
    const { lastSeen, seenPatch } = JSON.parse(raw);
    if (seenPatch !== CURRENT_PATCH) return true;
    if (Date.now() - lastSeen >= SEVEN_DAYS_MS) return true;
    return false;
  } catch {
    return true;
  }
}

function dismissSupportPopup() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastSeen: Date.now(), seenPatch: CURRENT_PATCH }));
}

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export default function SupportPopup({ onClose }) {
  function handleClose() {
    dismissSupportPopup();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'var(--color-modal-bg)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="rounded-xl shadow-xl max-w-md w-full p-6 relative"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 transition-colors"
          style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-5">
          <h2
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}
          >
            SUPPORT BEYBREW
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            I build this on my free time — any support means a lot! 🙏
          </p>
        </div>

        {/* GCash — QR always visible */}
        <div className="rounded-lg p-4 mb-3" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💙</span>
            <div>
              <div className="font-semibold text-sm">GCash</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Scan to donate</div>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="/images/gcash-qr.jpg"
              alt="GCash QR Code"
              className="max-w-[180px] w-full rounded-lg"
              style={{ border: '1px solid var(--color-border)' }}
            />
          </div>
        </div>

        {/* Ko-fi */}
        <a
          href="https://ko-fi.com/yujinyuz"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-3 rounded-lg p-3 mb-2 transition-colors"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'inherit', textDecoration: 'none' }}
        >
          <span className="text-xl">☕</span>
          <div className="flex-1">
            <div className="font-semibold text-sm">Ko-fi</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>ko-fi.com/yujinyuz</div>
          </div>
          <ExternalLinkIcon />
        </a>

        {/* PayPal */}
        <a
          href="https://paypal.me/yujinyuz"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-3 rounded-lg p-3 mb-2 transition-colors"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'inherit', textDecoration: 'none' }}
        >
          <span className="text-xl">💳</span>
          <div className="flex-1">
            <div className="font-semibold text-sm">PayPal</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>paypal.me/yujinyuz</div>
          </div>
          <ExternalLinkIcon />
        </a>

        {/* GitHub Sponsors */}
        <a
          href="https://github.com/sponsors/yujinyuz"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-3 rounded-lg p-3 mb-4 transition-colors"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'inherit', textDecoration: 'none' }}
        >
          <span className="text-xl">🐙</span>
          <div className="flex-1">
            <div className="font-semibold text-sm">GitHub Sponsors</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>github.com/sponsors/yujinyuz</div>
          </div>
          <ExternalLinkIcon />
        </a>

        <div className="text-center">
          <button
            onClick={handleClose}
            style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '12px', padding: '5px 18px', borderRadius: '20px', cursor: 'pointer' }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SupportPopup.jsx
git commit -m "feat: add SupportPopup component with localStorage trigger logic"
```

---

### Task 2: Wire `SupportPopup` into `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the import at the top of `App.jsx`**

Find the existing imports block (around line 1–8). Add after the `ExportCard` import:

```jsx
import SupportPopup, { shouldShowSupportPopup } from './components/SupportPopup';
```

- [ ] **Step 2: Add state and mount effect**

Find the existing state declarations (around line 103–105):

```jsx
const [maximumPointsLimited, setMaximumPointsLimited] = useState(DEFAULT_LIMITED_MAX_POINTS);
const [showDonateModal, setShowDonateModal] = useState(false);
const [theme, setTheme] = useState(() => localStorage.getItem('bbx-theme') || 'dark');
```

Add the support popup state and mount effect immediately after:

```jsx
const [showSupportPopup, setShowSupportPopup] = useState(false);

useEffect(() => {
  if (shouldShowSupportPopup()) {
    setShowSupportPopup(true);
  }
}, []);
```

- [ ] **Step 3: Render the component**

Find the existing donate modal block (around line 579):

```jsx
{/* ── Donate Modal ── */}
{showDonateModal && (
```

Add the support popup render directly before it:

```jsx
{/* ── Support Popup (auto-shown) ── */}
{showSupportPopup && (
  <SupportPopup onClose={() => setShowSupportPopup(false)} />
)}

{/* ── Donate Modal ── */}
{showDonateModal && (
```

- [ ] **Step 4: Manual verification**

Run `npm run dev`, open http://localhost:5173 in a browser.

Expected on first visit:
- Support popup appears immediately over the page
- GCash QR code is visible
- Ko-fi, PayPal, GitHub Sponsors rows are present with external link icons
- Clicking "Maybe later", ✕, or backdrop closes the popup
- After closing, refreshing the page does NOT show the popup again

Expected after dismissal:
- Open DevTools → Application → Local Storage → check `bbx-support-popup`
- Value should be `{"lastSeen":<timestamp>,"seenPatch":"v2025.11"}`

Expected version trigger:
- In DevTools, manually edit the stored `seenPatch` to `"v2024.01"`, then refresh
- Popup should reappear

Expected 7-day trigger:
- In DevTools, set `lastSeen` to `Date.now() - 8 * 24 * 60 * 60 * 1000`, refresh
- Popup should reappear

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire SupportPopup into App with mount-time trigger check"
```
