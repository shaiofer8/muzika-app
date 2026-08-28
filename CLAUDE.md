# muzika-app — Process Rule (BMad, spec-first)

This project follows the **BMad methodology**. This rule applies in every session/conversation that works in this repo, on any device (terminal, VS Code, Remote Control from phone/web) — it is a project-level rule, not tied to a specific chat.

## Mandatory: spec before implementation

Before implementing **any** new feature, capability, or non-trivial change — regardless of how the request is phrased ("add X", "find/generate Y and update Z", "make it do W") — first write or update a spec under `_bmad-output/specs/` following the existing BMad format (see `_bmad-output/specs/spec-song-shuffle/SPEC.md` for the template: Why / Capabilities / Constraints / Non-goals / Success signal / Assumptions).

Do not skip straight to code because the request sounds like a build instruction rather than an explicit "let's spec this." A request to build **is** a request to spec first, unless the user explicitly says to skip it for this one change.

## Why this rule exists

On 2026-08-28, a multi-language feature (15-language picker, per-language ~500-song packs, i18n) was implemented directly in code across several commits with no corresponding spec, capability entry, or `.memlog.md` update. The existing `SPEC.md` and constraints (e.g. Play Store publishing, team scoring) also drifted out of sync with the shipped app the same way. This file exists so that doesn't happen silently again — BMad tooling being present in `_bmad/` does not by itself prevent un-specced code; only actually following the process each time does.

## When picking up existing drift

If you find shipped code with no matching spec (check `_bmad-output/specs/` and `.memlog.md` against `git log`), flag it to the user and offer to write a retroactive companion spec before continuing new work on that area.
