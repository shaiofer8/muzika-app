---
title: Onboarding fast start — one card, then the first song
status: final
created: 2026-11-22
supersedes: spec-onboarding-clarity CAP-1 (three slides + "Choose teams")
---

# Onboarding fast start

## Why
2026-11-22 numbers (GA4, 28 days): 210 new users, only 116 (55%) reached a song. Users who did reach a song stayed long (Spain 17 min, Mexico 14 min). Play: almost every uninstall is a foreign user who installed and removed on the same day.
A first-time user needed 6 taps before hearing music: 3 how-to slides → "Choose teams" → team-count dialog → an empty scoreboard with no way forward except × → the main screen, where the first song does not play on its own.

## Capabilities
- **CAP-1 One card.** The how-to is a single card: title, then the three existing headings as a short list (icon + `howto1Title` / `howto2Title` / `howto3Title`), then one primary button. No slides, no dots, no Skip.
- **CAP-2 The button plays.** The button text is `howtoOk` = "Let's play" in each language. Tapping it closes the card and starts a song right away (same path as the Next button, inside the tap so autoplay is allowed). It does not open team setup.
- **CAP-3 Teams are optional.** Team setup is reached only from the Score button (spec-team-scoring unchanged).
- **CAP-4 Measure the funnel.** GA events `onboarding_shown` (card opened) and `onboarding_play` (button tapped), next to the existing `song_started`.
- **CAP-5 Same storage key.** `muzika-howto-v2` stays, so players who already saw the how-to are not shown it again.

## Constraints
- All 15 languages get a native `howtoOk`.
- Pushing to `main` is a live deploy: work stays on branch `fast-start` until Shai approves.
- Service worker cache version is bumped so the TWA picks up the change.

## Non-goals
- A solo / hidden-answer mode.
- Renaming the "Don't show again" (hide song) button.
- Reopening the how-to later.

## Success signal
- In GA, the share of new users with `song_started` rises from 55% to at least 75% over the 7 days after release.
- `onboarding_play` / `onboarding_shown` ≥ 85%.

## Verification
- Headless Chrome at 393×852 for he, en, ar (RTL), ja, de: the card fits without scrolling, the button is on one line, one tap closes the card and a song is playing (no score dialog).
