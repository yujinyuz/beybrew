# Support Popup Design

## Overview

Auto-show a "Support BeyBrew" modal on first visit, when a new patch is deployed, or after 7 days since last dismissal. Replaces the manual donate button flow with a proactive, non-intrusive popup.

## Layout

Vertical list modal, centered on screen with backdrop blur. Contains:

1. **Header** — "SUPPORT BEYBREW" title + short thank-you message
2. **GCash row** — emoji + label + inline QR code (`/images/gcash-qr.jpg`) always visible, no click needed
3. **Ko-fi row** — link opens in new tab
4. **PayPal row** — link opens in new tab
5. **GitHub Sponsors row** — link opens in new tab
6. **"Maybe later" button** — dismisses and records timestamp

Rows 3–5 each show an external link arrow icon. Styling follows the existing donate modal (dark surface, accent border, `var(--color-*)` tokens).

## Trigger Logic

Popup shows when **any** of these is true:

- `localStorage` has no `support_popup` record (first visit)
- Stored `seenPatch` ≠ current `CURRENT_PATCH` (new patch deployed)
- Stored `lastSeen` timestamp is 7+ days ago

On dismiss ("Maybe later" or backdrop click or ✕), write to localStorage:
```json
{ "lastSeen": <unix ms>, "seenPatch": "<CURRENT_PATCH value>" }
```

## Component

Extract into `src/components/SupportPopup.jsx`. Accepts no props — reads `CURRENT_PATCH` from `constants.js` directly. `App.jsx` manages `showSupportPopup` state, initializes it on mount via a `shouldShowSupportPopup()` helper in the component file.

## Data

Support links to configure (fill in actual URLs during implementation):

| Platform | URL |
|---|---|
| Ko-fi | `https://ko-fi.com/YOUR_USERNAME` |
| PayPal | `https://paypal.me/YOUR_USERNAME` |
| GitHub Sponsors | `https://github.com/sponsors/YOUR_USERNAME` |

GCash uses the existing `/images/gcash-qr.jpg`.

## What Changes

- `src/components/SupportPopup.jsx` — new component
- `src/App.jsx` — mount-time check, `showSupportPopup` state, render `<SupportPopup>`
- Existing "Donate via GCash" button remains unchanged

## Out of Scope

- Removing or replacing the existing donate button
- Analytics/tracking of popup interactions
- A/B testing cadence
