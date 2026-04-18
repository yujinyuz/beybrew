# PWA Conversion Design

**Date:** 2026-04-19
**Status:** Approved

## Overview

Convert BeyBrew from a standard web app to a Progressive Web App (PWA) with full offline support and home screen installability. The app is entirely client-side (all part data in the JS bundle, all images in `public/images/`), making it well-suited for full precaching.

## Goals

- Offline support: app works with no internet connection after first visit
- Installability: "Add to Home Screen" prompt with polished install UX
- Cache everything upfront on first load (no on-demand caching)
- Best practices: maskable icons, correct theme color, dismiss memory, skipWaiting

## What's Already in Place

- `public/site.webmanifest` with `display: standalone`, name, and two icon sizes
- Apple touch icon + favicons linked in `index.html`
- No service worker currently

## Architecture

### 1. Build config — `vite-plugin-pwa`

Add `vite-plugin-pwa` as a dev dependency. Configure it in `vite.config.js`:

- `registerType: 'autoUpdate'` — automatically calls `skipWaiting` when a new SW is waiting, combined with `skipWaiting: true` in workbox config ensures the new SW takes control on next reload
- `manifest: false` — keep existing `public/site.webmanifest`, don't generate a duplicate
- `workbox.globPatterns: ['**/*.{js,css,html,png,svg,jpeg,webp,jpg,ico,webmanifest}']` — precache all static assets including images
- `workbox.skipWaiting: true` — newly installed SW takes control immediately
- `runtimeCaching` for Google Fonts (two entries: `fonts.googleapis.com` and `fonts.gstatic.com`) using `CacheFirst` with 1-year TTL and `cacheableResponse: { statuses: [0, 200] }` (the `0` handles opaque responses from cross-origin font requests)

### 2. Manifest updates — `public/site.webmanifest`

- Add `"purpose": "maskable any"` to both icon entries so Android uses adaptive icons correctly
- Change `"theme_color"` from `"#ffffff"` to `"#080c18"` (matches app dark background)
- Change `"background_color"` from `"#ffffff"` to `"#080c18"` (splash screen color)
- Add `"start_url": "/"` and `"scope": "/"` explicitly

### 3. Install prompt — `src/hooks/useInstallPrompt.js`

A hook that:
- Listens for `beforeinstallprompt`, stores the event in a ref
- Returns `{ isInstallable, install, dismiss }`
- `install()` calls `event.prompt()`, awaits `userChoice`, clears state on acceptance
- `dismiss()` sets `localStorage.setItem('pwa-install-dismissed', '1')` and clears state
- On mount, checks `localStorage` — if already dismissed, `isInstallable` stays false

### 4. Install banner — `src/components/InstallBanner.jsx`

A small conditionally-rendered component placed near the top of `App.jsx`:
- Only renders when `isInstallable` is true
- Shows a brief "Install BeyBrew" message with an install button and a dismiss (×) button
- Styled to match the app's dark theme
- Does not re-appear after dismissal

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `vite-plugin-pwa` to devDependencies |
| `vite.config.js` | Add `VitePWA` plugin with Workbox config |
| `public/site.webmanifest` | Maskable icons, dark theme color, start_url/scope |
| `src/hooks/useInstallPrompt.js` | New hook |
| `src/components/InstallBanner.jsx` | New component |
| `src/App.jsx` | Add `<InstallBanner />` near top |

## Out of Scope

- Update notification UI ("New version available" toast) — can be added later
- Background sync or push notifications — not relevant for a deck builder
- Generating new maskable icon artwork — use existing icons with `"purpose": "maskable any"` declaration
