---
id: SPEC-music-provider-abstraction
companions: [SPEC-song-shuffle, SPEC-reveal-flow, SPEC-smart-shuffle-engine]
sources: [product-vision-2026-08-30.md]
---

> **Canonical contract**, written before implementation — see `CLAUDE.md`.
> מבוסס על `product-vision-2026-08-30.md` §9, §20, §21, §24, §26.

# שכבת Music Provider — הפרדת ניגון מלוגיקת המשחק

## Why

**חזון להגשמה:** היום `app.js` בונה ישירות URL של `youtube.com/embed/...`
בתוך לוגיקת התצוגה (§20, §24 דורשים הפרדה מפורשת בין Game Engine ל-Music
Provider). ההפרדה הזו נחוצה משתי סיבות מעשיות: (א) אפשרות להחליף/להוסיף
ספק מוזיקה בעתיד בלי לשכתב את לולאת המשחק/מנוע הבחירה, ו-(ב) תשתית להאצת
מעבר בין שירים (§26 — preload) בלי לפזר לוגיקת ניגון בכמה קבצים.

## Capabilities

- **CAP-1 (ממשק Provider)**
  - **intent:** מוגדר ממשק אחיד — `play(track)`, `pause()`, `resume()`,
    `stop()`, `getPlaybackState()` — ו-`YouTubeProvider` הוא המימוש הראשון
    שלו, עוטף בדיוק את לוגיקת ה-iframe הקיימת (`embedSrc`/`render` ב-`app.js`
    היום).
  - **success:** קוד המשחק (בחירת שיר, Reveal, ניקוד) קורא רק לממשק
    Provider — אין בו יותר מחרוזת `youtube.com`/בניית URL ישירה.

- **CAP-2 (שדות סכימה לספק)**
  - **intent:** לכל שיר מתווספים שדות אופציונליים `provider` (ברירת מחדל
    `"youtube"`) ו-`providerTrackId` (ממופה כברירת מחדל מ-`youtubeId` הקיים
    כדי לא לשבור קבצי שירים קיימים).
  - **success:** קובצי `songs/*.js` הקיימים (עם `youtubeId` בלבד) ממשיכים
    לעבוד ללא שינוי — המיפוי קורה בשכבת ה-Provider, לא בקובצי הנתונים.

- **CAP-3 (Preload לשיר הבא)**
  - **intent:** כאשר לשיר הבא הידוע (למשל השיר שיוצג אחרי "הבא" הבא) יש
    `providerTrackId` ידוע, ה-Provider מכין מראש את המשאב (למשל טעינת
    iframe/thumbnail ברקע) כך שהמעבר בפועל מרגיש מיידי.
  - **success:** על שירים עם `providerTrackId` ידוע, הזמן הנתפס בין לחיצת
    "הבא" לתחילת שמע קצר יותר משמעותית מהיום (יעד איכותני: "לא מרגיש כמו
    טעינה" — אין SLA מספרי קשיח בגרסה זו בגלל מגבלות iframe של YouTube).
  - **non-goal נלווה:** אין הבטחת preload למקרה נפילה לחיפוש (`videoseries`
    search כש-`providerTrackId` חסר) — שם אין מזהה קונקרטי מראש להכין.

## Constraints

- עדיין אתר סטטי, ללא build step, ללא שרת.
- בגרסה זו `YouTubeProvider` הוא המימוש **היחיד** בפועל — אין ספק שני אמיתי
  (Spotify/Apple Music) נבנה כאן, רק התפר (seam) שמאפשר זאת בעתיד.
- ⚠️ **תלוי בהחלטה פתוחה בנושא רישוי (§20)** — ראה `spec-monetization/SPEC.md`
  להחלטה שממתינה. ה-abstraction עצמה נחוצה **בלי קשר** להחלטה הזו (שיפור
  ארכיטקטורה + ביצועים), ולכן אינה חסומה על ידה.

## Non-goals

- אין מימוש ספק ניגון שני (Spotify/Apple Music/קובץ אודיו מקומי) בגרסה זו.
- אין seek/scrub UI חדש למשתמש — `seek()` בממשק הוא הכנה לעתיד, לא נחשף
  ב-UI כרגע (עקבי עם §14 — לא מוסיפים בקרות מיותרות).
- אין הבטחת latency מספרית — YouTube iframe embed לא חושף API preload
  מובטח; המטרה היא "תחושה מהירה יותר", לא SLA טכני מדיד.

## Success signal

מחליפים את הקריאות הישירות ל-YouTube בתוך `app.js` בקריאות ל-Provider —
המשחק ממשיך לעבוד זהה למשתמש הקצה (אין רגרסיה), ובנוסף מעברי "הבא" על
שירים עם `youtubeId` ידוע מרגישים חלקים יותר מהיום.

## Assumptions

- ההפרדה הזו היא שדרוג ארכיטקטוני פנימי — לא אמורה להיות מורגשת למשתמש
  הקצה כלל מלבד שיפור ביצועים; אין שינוי חזותי/UX הנובע ישירות מה-spec הזה.
