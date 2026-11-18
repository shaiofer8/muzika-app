# Decade filter never leads to an empty game

## Why
Several language packs have no playable songs in some decades (2026-11-18: de has none from the '90s; fr and pt none from the '80s or '90s). Picking such a decade showed "No songs found for this language", which reads like the whole language is broken.

## Capabilities
- CAP-1: The decade menu shows only decades with at least 2 enabled songs in the current language pack. Recomputed whenever the song pack changes (first load or language switch).
- CAP-2: If the selected decade disappears after a language switch, the filter resets to "All".
- CAP-3: The onboarding "Skip" button never breaks mid-word; on very narrow screens (320px) the final button moves to its own line instead of overflowing.

## Constraints
- No change to song files or to the song agent.
- Works without localStorage.

## Non-goals
- Filling the missing decades with songs (a separate library task).

## Success signal
Local Chrome check, 15 languages × 320px and 360px: every visible decade plays a song, onboarding buttons fit with no overflow.

## Assumptions
- 2 songs is the minimum for a playable decade (same threshold as "Recent" mode).
