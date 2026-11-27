---
title: Make it obvious that this is a social game for two teams (app + Google Play)
status: final
created: 2026-11-23
companions: [spec-onboarding-fast-start, spec-team-scoring, spec-main-screen-fit]
---

# Two-team game, clear at first glance

## Why
2026-11-23 Shai: "I think people open it and don't understand what it is: a social game with two teams. Make that clear in the app and on Google Play."
Play shows installs ≈ uninstalls every day (12 / 12 over 12–18.11). The onboarding card talks about "one phone" and "the host", and the main screen shows a song player with no sign of teams. The teams only appear after tapping "🏆 Score", which most new users never do. The store listing leads with "one phone, one host", and teams come only in the middle.

## Capabilities
- **CAP-1 Team bar on the main screen.** Between the video and the Next button there is a bar with the two default teams: `Team 1 · 0 [+1]  VS  [+1] 0 · Team 2`.
  - Tapping "+1" adds a point to that team right away (same state as the score popup, `muzika-score-state-v1`). Scoring is marked as configured.
  - Tapping a team name or score opens the score popup (rename, minus, reset).
  - With 3 teams the bar shows three chips without "VS". With 4 or more it shows a single "🏆 N teams · score" button that opens the popup.
  - The bar is always visible, before any setup: the default state is two teams.
- **CAP-2 Onboarding says "two teams".** Card title: "Party game for two teams". The three lines:
  1. 👥 Split into two teams
  2. 🎧 One host plays a song, and only they look at the screen
  3. 🏆 The first team to recognize it gets a point
  The button stays "Let's play!" and starts a song (spec-onboarding-fast-start).
- **CAP-3 Header kicker.** The small line above the title says "Party game for two teams", in all 15 languages. It shows only on tall screens (over 900 px, spec-main-screen-fit); on phones the team bar carries the message.
- **CAP-4 Google Play.** In all 16 listings, the short description and the first line of the full description open with "social game for two teams". The title keeps its main keyword and adds "teams" where it fits in 30 characters. The rest of the full description does not change. Publishing to Play happens only after Shai approves the texts.
- **CAP-6 Store screenshots (added 2026-11-27, Shai chose it after weak install numbers).** 4 new phone screenshots for all 16 Play listings, all taken from the live app: (1) main screen with the team bar mid-game, caption = the kicker "Party game for two teams"; (2) the onboarding card, caption = "The host plays a song, only they see the screen"; (3) main screen with another song and a higher score, caption = "The first team to name it gets a point"; (4) the score popup, caption = "No sign-up, start now". Captions reuse the app strings (i18n) so store and app say the same thing. Upload only after Shai approves the Hebrew set.
- **CAP-5 Analytics.** GA event `team_point` with `{source: "bar" | "popup", teams: n}`, so we can see whether people score from the bar.

## Constraints
- spec-main-screen-fit stays true: no scrolling on the main screen from 360×640 to 412×915, in 15 languages. The bar is one line of at most about 48 px; the video absorbs the space.
- Team names from the popup (custom names) appear in the bar. Long names are cut with an ellipsis.
- Pushing to `main` is a live deploy; it happens only after Shai says "תעלה".

## Non-goals
- Removing the score popup or the "🏆 Score" button.
- Changing the game flow (Next, reveal, hide song).
- New store screenshots (a separate step once the bar is approved).

## Success signal
- In GA, within 7 days of release: at least 30% of sessions with a song have a `team_point` event.
- The share of Play uninstalls out of installs goes down in the week after release.

## Assumptions
- Most groups play with two teams; more teams are still supported through the popup.
