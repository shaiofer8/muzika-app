---
title: Main screen and score popup always fit the screen; clear "remove song" button
status: final
created: 2026-11-22
companions: [SPEC-device-fit, SPEC-team-scoring]
---

# Main screen and score popup fit the screen

## Why
2026-11-22 measurements (Playwright, local build) showed that SPEC-device-fit only held on mid-size phones:
- 360×640: the main screen was 863 px tall, 35% more than the screen. The Next button was below the fold, and a long title pushed it down another 100 px.
- The score popup needed scrolling from 5 teams on.
Shai also found the "Don't show again" button unclear: it does not say that it removes only the current song.

## Capabilities
- **CAP-1 Video absorbs the difference.** The page is a full-height column (`100dvh`). Header, song info, Next and the secondary buttons keep their natural size; the video frame takes the space that is left, down to a minimum of about 100 px. Small screens get a smaller video, never a scroll.
- **CAP-2 Long titles stay bounded.** Title at most 2 lines and artist at most 1 line (ellipsis). The font size follows the screen height.
- **CAP-3 Optional pieces drop out on short screens.** The equalizer icon is hidden below 760 px of height; the "if playback doesn't start" hint is hidden below 700 px.
- **CAP-4 Compact score rows.** Each team is one line: name, −, score, +. The three popup actions sit in one row. Up to 12 teams fit at 360×640 without scrolling inside the popup.
- **CAP-5 Clear remove button.** The hide-song button reads "🚫 Remove this song" (native in all 15 languages). Behavior is unchanged: this song stops appearing on this device.

## Constraints
- CSS only for layout, no `zoom` / `transform` (SPEC-device-fit CAP-3).
- Text in buttons and song info stays ≥ 14 px; buttons stay ≥ 36 px tall.
- Pushing to `main` is a live deploy; it happens only after Shai approves.

## Non-goals
- Landscape layout.
- Moving the native ad banner.

## Success signal / Verification
Playwright on 360×640, 375×667, 360×740, 360×780, 390×844, 393×852, 412×915 in he, en, de, ar:
- main screen with a normal and a very long title: `scrollHeight <= innerHeight` and `scrollWidth <= innerWidth`;
- score popup with 2, 4, 6 and 12 teams: the popup is fully inside the screen and does not scroll inside.
