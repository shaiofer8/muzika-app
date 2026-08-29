# מיפוי אפיון מאוחד → Specs (2026-08-30)

מסמך ניווט — לא SPEC בפני עצמו. מטרתו: לכל אחד מ-30 הסעיפים ב-
`_bmad-output/sources/product-vision-2026-08-30.md`, מה כבר קיים באפליקציה,
מה נוצר עכשיו כ-spec חדש, ומה עדיין פתוח/ממתין להחלטה.

| # | נושא | מצב | Spec |
|---|---|---|---|
| 1 | מטרת המוצר / קהל | ✅ תואם כבר | (context, לא feature) |
| 2 | Core Loop: Listen→Guess→Reveal→Next | ✅ **מומש** (2026-08-30) | `spec-reveal-flow` |
| 3 | פשטות/ללא login/backend | ✅ תואם כבר | — |
| 4 | קהל רחב, לא לפי גיל | ✅ תואם כבר | — |
| 5 | מצב צעירים (15 שנה, דינמי) | ✅ **כבר קיים** בשם "חדשים" | `spec-kids-mode` (קיים) |
| 6-7 | איכות מאגר / קושי ≠ אלמוניות | 📄 תקן מדיניות (לא קוד) | `song-curation-standards.md` |
| 8 | שנה כמרכיב ניחוש מרכזי | ✅ מומש — מוצג רק אחרי Reveal | `spec-reveal-flow` |
| 9 | סכימת נתוני שיר (difficulty/popularity/enabled/era/provider) | ✅ **מומש** — שדות אופציונליים נתמכים בקוד; backfill לתוכן עצמו לא כלול (ראה למטה) | `spec-smart-shuffle-engine`, `spec-music-provider-abstraction` |
| 10-11 | מנוע בחירה חכם + איזון קושי | ✅ **מומש** (`shuffleEngine.js`) | `spec-smart-shuffle-engine` |
| 12-13 | מסך האזנה נקי + Reveal Screen | ✅ **מומש** | `spec-reveal-flow` |
| 14 | UX מהיר, בלי הוספת שלבים מיותרים | ✅ עקרון מנחה לכל ה-specs החדשים | — |
| 15 | טלפון אחד למספר אנשים | ✅ תואם כבר (זו הארכיטקטורה הקיימת) | — |
| 16 | ויראליות דרך רגע המשחק עצמו | ✅ נתמך ע"י `spec-reveal-flow` (רגע החשיפה) | `spec-reveal-flow` |
| 17-18 | מונטיזציה + Premium Packs | ✅ **הוחלט** — אין פרסומות בשלב א׳ (לא מומש בכוונה), בעתיד רק בתוך פופאפ ניקוד | `spec-monetization` |
| 19 | מאגר עברית ~500 | ✅ **עבר את היעד** — 1,058 בפועל | `song-curation-standards.md` (טבלת מצב) |
| 20 | זכויות מוזיקה + MusicProvider abstraction | ✅ **הוחלט + מומש** — abstraction ב-`musicProvider.js`, החלטת רישוי סגורה | `spec-music-provider-abstraction`, `spec-monetization` |
| 21 | Offline/Backend מינימלי | ✅ תואם כבר (הכל סטטי/client) | — |
| 22-23 | Analytics + KPI מרכזי | ⚠️ **חלקי** — אירועים נשלחים (`analytics.js`), אבל אין SDK אמיתי מחובר (דורש פרויקט Firebase מהמשתמש) | `spec-analytics` |
| 24 | ארכיטקטורה מודולרית | ✅ **מומש** — Provider מופרד לגמרי מקוד המשחק | `spec-music-provider-abstraction` |
| 25 | Cross-platform (Android+iOS) | ⚠️ פתוח — יש כרגע Android (TWA) בלבד; לא בטיפול בסבב הזה | לא כלול (ראה "לא בטיפול" למטה) |
| 26 | Performance / Preload | ✅ **מומש** (best-effort: preconnect + prefetch thumbnail) | `spec-music-provider-abstraction` (CAP-3) |
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

## מימוש (2026-08-30)

לפי בקשת המשתמש ("תממש הכל מלבד כמות שירים") מומשו בקוד:
`spec-reveal-flow`, `spec-smart-shuffle-engine`, `spec-music-provider-abstraction`,
ותשתית `spec-analytics` (ראה סייג SDK למטה). קבצים חדשים: `musicProvider.js`,
`shuffleEngine.js`, `analytics.js`; `app.js`/`index.html`/`style.css`/`i18n.js`
(15 שפות) עודכנו; `service-worker.js` עודכן ל-v4 עם הקבצים החדשים.
`spec-monetization` **לא** מומש בקוד בכוונה — הוחלט על "אין פרסומות בשלב א׳".
`spec-team-scoring` כבר היה מומש (רטרואקטיבי, אין שינוי קוד).

**סייג לגבי Analytics:** `analytics.js` שולח את כל אירועי §22 דרך נקודת
חיבור יחידה (`track()`), אבל בלי SDK אמיתי מחובר בפועל (Firebase או דומה)
— זה דורש פרויקט/חשבון אמיתי שרק שי יכול ליצור. עד אז האירועים לא יוצאים
לשום מקום (no-op שקט, אפשר לראות אותם ב-console עם `window.MUZIKA_DEBUG_ANALYTICS = true`).

**סייג לגבי backfill תוכן:** שדות `difficulty`/`popularity`/`era` נתמכים
במלואם במנוע (`shuffleEngine.js`), אבל אף שיר קיים לא תויג בפועל — המנוע
מתפקד עם ברירת מחדל ניטרלית ("medium") עד שיתבצע תיוג, בהתאם ל-Non-goals
של `spec-smart-shuffle-engine` ולבקשת המשתמש שלא לגעת בכמות/תוכן השירים
בסבב הזה.

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
5. `spec-monetization` — הוחלט: אין פרסומות בשלב א׳; שלב ב׳ (פרסומות
   בפופאפ ניקוד בלבד) נבנה רק כשיתבקש מפורשות, אחרי 1-4.

זו המלצת סדר, לא באישור סופי — לחכות לאישור המשתמש לפני מעבר משלב אפיון
לשלב מימוש בפועל, בהתאם לכלל ה-spec-first ב-`CLAUDE.md`.
