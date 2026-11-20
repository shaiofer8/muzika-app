# בדיקת איכות שירים (spec-song-quality-audit)

1. `node audit.js he` – בודק כל שיר פעיל מול כותרת הסרטון שלו, וכותב את התוצאות ל-`work/audit-he.json`.
2. `node search.js he` – לכל שיר חשוד, מחפש ב-YouTube (דרך yt-dlp, בלי מכסה) סרטון שהכותרת שלו היא בדיוק השיר והזמר.
3. כותבים החלטות ל-`work/decisions-he.json`: החלפת סרטון, תיקון שם/זמר/שנה, או השבתה (`title_mismatch` / `duplicate`).
4. `node apply.js he` – מחיל את ההחלטות, ומוריד שנים שמאוחרות מהתאריך שבו הסרטון עלה. אחרי זה בודק את הקובץ עם `node --check`.
