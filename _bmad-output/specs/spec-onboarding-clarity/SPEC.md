---
title: Onboarding clarity + language follows the device
status: final
created: 2026-11-18
---

# Onboarding clarity + language follows the device

## Problem
1. First-run "How to play" does not say this is a group game run by one host on one phone. It also tells players to tap "Reveal", a button that no longer exists (the answer is shown as soon as the song plays, see spec-reveal-flow).
2. Players with a non-Hebrew device can still see Hebrew. Before 2026-11-15 the first visit auto-saved "he" as the chosen language, so every early install is stuck on Hebrew.
3. In several languages the how-to text names buttons that differ from the real button labels (ru, de, tr, zh, hi, ja, ko, vi, pt, ar). The Chinese how-to is in Traditional characters while the UI is Simplified.

## Capabilities
- **CAP-1 Host model in onboarding.** Three slides, each with icon, short heading and one-to-three sentence body:
  1. One phone, one host; everyone else splits into teams and guesses.
  2. Host taps Next, the song plays; the answer is on the screen, so only the host looks; first to name it calls it out.
  3. Host gives the point in Score, taps Next; tip: connect a speaker.
  Final button reads "Choose teams", because closing opens team setup.
- **CAP-2 Labels match the UI.** Every button named in the how-to uses the exact `nextBtn` / `scoreBtn` string of that language.
- **CAP-3 Native copy in all 15 languages.** Written for natives, informal register matching the rest of that language's UI, reviewed by native-language reviewers. Chinese is Simplified, matching the UI.
- **CAP-4 Show once more.** Onboarding storage key moves to `muzika-howto-v2`, so every device sees the new version once.
- **CAP-5 Kicker says "party game for groups"** instead of "shared screen", which contradicted the host model.
- **CAP-6 Language follows the device.**
  - The default is the first supported language in `navigator.languages` (falling back to `navigator.language`); `iw` maps to `he`; unsupported → English.
  - Only an explicit choice in the language menu is saved (`muzika-lang-v3`).
  - Legacy `muzika-lang-v2`: a non-Hebrew value was a real choice and is kept. A value of `he` was usually the old automatic default; it is kept only when the device time zone is `Asia/Jerusalem`, otherwise the device language wins.

## Out of scope
- A "hidden answer" solo mode.
- A button to reopen the how-to later.

## Verification
- Headless browser at 390×844 for he, en, ar (RTL), ja: slides render, no overflow, final button reads "Choose teams" equivalent, closing opens team setup.
- Language matrix: device en + legacy v2 "he" outside Israel → en; same inside Israel → he; legacy "fr" → fr; device "iw-IL" → he; device "nl" → en; explicit choice persists across reload.
- Every how-to string that quotes a button contains that language's `nextBtn` and `scoreBtn`.
