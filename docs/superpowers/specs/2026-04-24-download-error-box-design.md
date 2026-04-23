# Download Error Box

**Date:** 2026-04-24
**Status:** Approved

## Problem

When a download fails, the app shows a generic "Download failed. Try again." message that auto-clears after 4 seconds. Developers have no way to know what actually went wrong from a user report.

## Goal

Show a small, copy-pasteable error box when a download fails so a user can paste the details to a developer for debugging.

## Design

### Error capture

Both `handleDownloadDeck` and `handleDownloadCombo` currently swallow the error:

```js
.catch(() => setDownloadError('Download failed. Try again.'))
```

Change to capture the error and build a detail string:

```js
.catch((e) => {
  const ua = navigator.userAgent;
  const detail = `Error: ${e?.message ?? String(e)}\nStyle: ${resolvedStyle} | ${ua}`;
  setDownloadError(detail);
})
```

### State

`downloadError` remains a `string | null`. No type change needed — it just holds richer content now.

### Auto-clear

Remove the 4-second `setTimeout` that clears `downloadError`. The box stays visible until the user dismisses it or triggers another download attempt (which resets state at the top of the handler).

### UI

Replace the current inline `<span>` at line 765 with a `<DownloadErrorBox>` component (inline in App.jsx, not a separate file):

```
┌─────────────────────────────────────────┐
│ Error: Failed to fetch                  │
│ Style: deck-profile | Mozilla/5.0 ...   │
│                              [Copy] [×] │
└─────────────────────────────────────────┘
```

- Readonly `<textarea>` — 3 rows, monospace, full width, same red border accent as existing error color `#ff4455`
- **Copy** button — copies `downloadError` to clipboard, briefly shows "Copied!" (1.5s), then reverts
- **×** button — calls `setDownloadError(null)`
- Styled to match the existing app surface/border variables

### Out of scope

- No stack trace (minified in prod, not useful to end users)
- No server-side error reporting
- No changes to the iOS share path (errors there surface separately)
