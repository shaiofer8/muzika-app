---
id: SPEC-analytics
companions: [SPEC-song-shuffle, SPEC-reveal-flow, SPEC-kids-mode]
sources: [product-vision-2026-08-30.md]
---

> **Canonical contract**, written before implementation — see `CLAUDE.md`.
> מבוסס על `product-vision-2026-08-30.md` §22-23. **בלתי-תלוי** בהחלטת
> המונטיזציה הפתוחה ב-`spec-monetization/SPEC.md` — מומלץ לבנות ראשון כי הוא
> מודד אם ה-KPI המרכזי (Songs per Session) כבר עובד, בלי הסיכון
> התפעולי/משפטי של פרסומות.

# Analytics — מדידת שימוש בסיסית

## Why

**חזון להגשמה:** היום אין שום מדידה (מוצהר במפורש כ-"No" ב-Data Safety של
Play Console) — אי אפשר לדעת אם הליבה (Fun) עובדת בפועל בלי למדוד
Songs-per-Session (§23, ה-KPI המרכזי של כל הפרויקט). המטרה: להוסיף מדידה
מינימלית, אנונימית, שעונה על "האם חבורה ממשיכה לשיר ה-15 או עוצרת אחרי 3?"

## Capabilities

- **CAP-1**
  - **intent:** האפליקציה שולחת את אירועי הליבה מ-§22:
    `game_started`, `song_started`, `song_revealed`, `song_skipped`,
    `next_song`, `session_finished`, `young_mode_used`, `pack_selected`
    (מוכן לעתיד עם `spec-monetization`), `ad_impression`,
    `rewarded_ad_completed`, `purchase` (שני האחרונים no-op עד שתהיה
    מונטיזציה בפועל).
  - **success:** כל אירוע נורה בדיוק פעם אחת בנקודת הגורם המתאימה לו
    (למשל `song_revealed` רק בלחיצה על "חשיפה" מ-`spec-reveal-flow`, לא
    בכל בחירת שיר).

- **CAP-2**
  - **intent:** נגזרים ומדווחים גם `songs_per_session` (ספירת `next_song`
    בתוך סשן) ו-`session_duration` (זמן בין `game_started` ל-
    `session_finished`/עזיבת העמוד) בלי צורך במחשוב שרת.
  - **success:** בסוף סשן (סגירת/רענון טאב, best-effort) נשלח אירוע יחיד
    עם שני הערכים הנגזרים.

- **CAP-3 (פרטיות)**
  - **intent:** לא נאסף/נשלח מזהה אישי מזהה (שם/אימייל/מיקום מדויק) — רק
    מזהה אנונימי שה-SDK עצמו מייצר (למשל App Instance ID של Firebase).
  - **success:** אין שדה PII באף אירוע; תואם המשך הצהרת Data Safety
    "No" לאיסוף מידע מזהה (גם אחרי ההוספה, רק המדיניות סביב פרסומות
    תשתנה אם/כש-`spec-monetization` יופעל).

## Constraints

- הוספת SDK אנליטיקס (למשל Firebase Analytics — הבחירה הסבירה/חינמית
  לסטאק הזה) **דורשת עדכון הצהרת Data Safety ב-Play Console** (כרגע
  מוצהר "No" איסוף — ראה `_bmad-output/play-console-guide.md`). זה עדכון
  מנהלי בקונסולה, לא רק קוד.
- עדיין אתר סטטי מבחינת תוכן/לוגיקה — ה-SDK עצמו הוא הוספת script חיצוני
  בלבד, לא backend חדש.

## Non-goals

- אין דשבורד/BI מותאם אישית בגרסה זו — משתמשים בממשק ה-SDK הנבחר (למשל
  Firebase Console) כפי שהוא.
- אין A/B testing infrastructure.
- אין מדידת retention (D1/D7/D30) בגרסה זו — תלוי בזיהוי משתמש חוזר בין
  ביקורים שלא קיים היום; ייתכן שיידרש בעתיד install ID קבוע (`localStorage`)
  כתשתית נוספת, לא כלול כאן.

## Success signal

אחרי שבוע של שימוש אמיתי, אפשר לפתוח דוח ולראות את ההתפלגות בפועל של
Songs-per-Session על פני כל הסשנים — ולדעת אם רוב החבורות מגיעות ל-15-30
שיר (הליבה עובדת) או עוצרות מוקדם (יש בעיה לתקן לפני שמשקיעים במונטיזציה).

## Assumptions

- Firebase Analytics (חינמי, ללא build step מורכב, נטען כ-script תג) הוא
  ברירת המחדל הסבירה — ניתן להחליט אחרת אם יש העדפה אחרת, אך זו לא הוצגה
  כפתוחה לוויכוח מהותי כרגע.
- "אנונימי" כאן = ללא PII, לא בהכרח ללא שום מזהה מכשיר — App Instance ID
  סטנדרטי של ה-SDK מקובל ועדיין עומד בהצהרת "No PII" הקיימת.
