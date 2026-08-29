# מיפוי אפיון מאוחד → Specs (2026-08-30)

מסמך ניווט — לא SPEC בפני עצמו. מטרתו: לכל אחד מ-30 הסעיפים ב-
`_bmad-output/sources/product-vision-2026-08-30.md`, מה כבר קיים באפליקציה,
מה נוצר עכשיו כ-spec חדש, ומה עדיין פתוח/ממתין להחלטה.

| # | נושא | מצב | Spec |
|---|---|---|---|
| 1 | מטרת המוצר / קהל | ✅ תואם כבר | (context, לא feature) |
| 2 | Core Loop: Listen→Guess→Reveal→Next | 🆕 **שינוי התנהגות** — היום תשובות גלויות תמיד | `spec-reveal-flow` |
| 3 | פשטות/ללא login/backend | ✅ תואם כבר | — |
| 4 | קהל רחב, לא לפי גיל | ✅ תואם כבר | — |
| 5 | מצב צעירים (15 שנה, דינמי) | ✅ **כבר קיים** בשם "חדשים" | `spec-kids-mode` (קיים) |
| 6-7 | איכות מאגר / קושי ≠ אלמוניות | 📄 תקן מדיניות (לא קוד) | `song-curation-standards.md` |
| 8 | שנה כמרכיב ניחוש מרכזי | ✅ תואם כבר (מוצג היום, יוסתר עד Reveal) | `spec-reveal-flow` |
| 9 | סכימת נתוני שיר (difficulty/popularity/enabled/era/provider) | 🆕 שדות חדשים | `spec-smart-shuffle-engine`, `spec-music-provider-abstraction` |
| 10-11 | מנוע בחירה חכם + איזון קושי | 🆕 חדש (היום: רק "לא לחזור מיידית") | `spec-smart-shuffle-engine` |
| 12-13 | מסך האזנה נקי + Reveal Screen | 🆕 חדש | `spec-reveal-flow` |
| 14 | UX מהיר, בלי הוספת שלבים מיותרים | ✅ עקרון מנחה לכל ה-specs החדשים | — |
| 15 | טלפון אחד למספר אנשים | ✅ תואם כבר (זו הארכיטקטורה הקיימת) | — |
| 16 | ויראליות דרך רגע המשחק עצמו | ✅ נתמך ע"י `spec-reveal-flow` (רגע החשיפה) | `spec-reveal-flow` |
| 17-18 | מונטיזציה + Premium Packs | 🆕 **חסום חלקית** — דורש החלטת רישוי | `spec-monetization` (DRAFT) |
| 19 | מאגר עברית ~500 | ✅ **עבר את היעד** — 1,058 בפועל | `song-curation-standards.md` (טבלת מצב) |
| 20 | זכויות מוזיקה + MusicProvider abstraction | 🆕 קריטי — סעיף שיוצר את ההחלטה הפתוחה | `spec-music-provider-abstraction`, `spec-monetization` |
| 21 | Offline/Backend מינימלי | ✅ תואם כבר (הכל סטטי/client) | — |
| 22-23 | Analytics + KPI מרכזי | 🆕 חדש — **היום: 0 מדידה** | `spec-analytics` |
| 24 | ארכיטקטורה מודולרית | ⚠️ חלקי — Provider מעורב היום בקוד המשחק | `spec-music-provider-abstraction` |
| 25 | Cross-platform (Android+iOS) | ⚠️ פתוח — יש כרגע Android (TWA) בלבד; לא בטיפול בסבב הזה | לא כלול (ראה "לא בטיפול" למטה) |
| 26 | Performance / Preload | 🆕 חדש | `spec-music-provider-abstraction` (CAP-3) |
| 27 | Design Direction (Premium/לא Casino) | ⚠️ החלטת עיצוב ויזואלי — לא כלול כ-spec פונקציונלי, ראה הערה למטה | — |
| 28-29 | עקרון פיתוח + סדר עדיפויות | ✅ עקרון מנחה לתעדוף (ראה "סדר בנייה מוצע" למטה) | — |
| 30 | קו מנחה עליון | ✅ עקרון-על, לא spec בפני עצמו | — |

## דברים שהתגלו כ"סחף" (drift) תוך כדי המיפוי — לא היו חלק מהבקשה החדשה

- **ניקוד קבוצות בתוך האפליקציה** (`score.js`) כבר קיים ופעיל בפרודקשן,
  אבל נבנה בלי spec (כמו שקרה קודם עם ריבוי-שפות) וגם **סותר** Non-goal
  קיים ב-`spec-song-shuffle`. תוקן עכשיו רטרואקטיבית: `spec-team-scoring`.
- מאגר עברית כבר עבר את היעד המקורי של §19 (1,058 מול ~500) — לא בעיה,
  רק לתעד כדי שלא ייווצר בלבול מול המספר שמופיע במסמך המקור.
- 9 מתוך 15 שפות רחוקות מהיעד של ~500 שיר (הכי נמוך: 74-94) — פער ידוע
  מתועד כבר ב-`spec-multi-language`, הוזכר כאן שוב כי §6/§19 של האפיון
  החדש מתייחסים לאיכות מאגר.

## מה לא נכלל בסבב הזה (מכוון, לא שכחה)

- **§25 Cross-platform (iOS):** יש כבר Android native app (TWA, קבצי
  keystore/aab/apk ב-repo) — הרחבה ל-iOS היא פרויקט נפרד משמעותי (Xcode/
  App Store/חתימה) ולא נובעת ישירות מהאפיון הזה; לא נכתב לו spec כרגע.
  לציין אם רוצים להעלות אותו כיוזמה נפרדת.
- **§27 Design Direction:** "Premium/Modern/Musical/Social/Energetic/Clean,
  לא ילדותי, לא Casino" הוא כיוון ויזואלי (עיצוב גרפי/CSS), לא Capability
  הניתן לבדיקה כ-spec BMad רגיל. מומלץ לטפל בזה כפריט עיצוב נפרד (למשל
  מוק-אפ/דוגמאות ויזואליות) כשמתחילים לממש את `spec-reveal-flow` בפועל,
  לא כ-spec טקסטואלי בפני עצמו.
- **backfill בפועל של `difficulty`/`popularity`** לכל ~4,700 השירים
  הקיימים על פני 15 שפות — עבודת תוכן נפרדת וגדולה, מחוץ להיקף כתיבת
  ה-specs הזו (המנוע ב-`spec-smart-shuffle-engine` מתפקד גם בלי זה, ראה
  Non-goals שם).

## סדר בנייה מוצע (לפי §28-29 של המקור — Fun/Songs/Ease/Flow לפני Virality/Revenue/Architecture)

1. `spec-reveal-flow` — הכי גדול על Fun+Flow, הכי קרוב ל"קסם" שהמסמך מתאר.
2. `spec-smart-shuffle-engine` — Fun, לא תלוי בהחלטות פתוחות.
3. `spec-analytics` — זול, לא-תלוי בהחלטת רישוי, עונה אם הליבה עובדת
   לפני שמשקיעים במונטיזציה.
4. `spec-music-provider-abstraction` — הכנה ארכיטקטונית + ביצועים, לא
   תלוי בהחלטת הרישוי (רק ה-monetization בפועל תלוי בה).
5. `spec-monetization` — **רק אחרי** שההחלטה הפתוחה נסגרת.

זו המלצת סדר, לא באישור סופי — לחכות לאישור המשתמש לפני מעבר משלב אפיון
לשלב מימוש בפועל, בהתאם לכלל ה-spec-first ב-`CLAUDE.md`.
