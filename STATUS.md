# STATUS — muzika-app

Single coordination file. Update before starting, on handoff, on stop, and at completion.

## Last updated
2026-10-20 (Claude Code, team lead)

## Active tasks
- None.

## Branches
| Branch | Purpose | State |
|---|---|---|
| `main` | Live site (muzika.sofrimyamim.com) and song agent pushes | Up to date with release, design and legal changes |
| `muzika/local-state-admob-appid` | Older release branch (AdMob ID, TWA cleanup) | Superseded by `main` |
| `muzika/english-name` | Android release candidate (versions 4–8) | Merged into `main` |
| `design/android-polish` | Visual changes | Merged into `main` |
| `fix/legal-compliance` | Consent, privacy policy, neutral kids label | Merged into `main` |
| `docs/team-workflow` | This file and TEAM_WORKFLOW.md | Pending merge |

## Release status (Google Play, com.muzikaparty.app)
- Production: versionCode 8 (submitted 2026-10-20, awaiting Google review).
- Internal testing: versionCode 8.
- Manual steps left in Play Console: Ads declaration, Advertising ID declaration (no), target audience (adults), Data safety form.

## File ownership
- `app/` (Android): Claude Code.
- `songs/*.js`, `tools/song-agent/`: song agent (daily 10:30). Do not edit by hand while it runs.
- `index.html`, `style.css`, `lang.js`, `i18n.js`, `score.js`: one owner at a time.

## Tests
- Android bundle: built and signed (versionCode 8). Not run on a device.
- Web: checked on live site after deploy (labels, privacy page). Not checked on a real phone.
- Song agent: last run 2026-10-19 succeeded.

## Blockers
- Routine for daily status email is disabled: the cloud routine has no access to the GitHub repo yet (`trig_01GuuvHwc5r1a1xJV93uVfTf`).
- Secrets that were printed in chat need rotation (see below).

## Secrets (variable names and paths only)
- Keystore: `android.keystore` and `.keystore-secrets.txt` at repo root (both git-ignored). Password was printed in chat on 2026-10-20 — rotate.
- Play service account: `C:/Users/shaio/service-account.json` (outside repo).
- OAuth client: `C:/Users/shaio/.muzika-oauth.json` (outside repo); its refresh token is currently invalid.

## Next step
- Owner confirms Play Console declarations; then re-check release status.
