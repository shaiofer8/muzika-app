# מקור: אפיון אפליקציית משחק המוזיקה — הנחיות מהמשתמש (2026-08-30)

> נשמר כטקסט מקור מלא, ללא עריכה, כפי שהתקבל מהמשתמש. הפירוק שלו לספקים
> קונקרטיים תחת `_bmad-output/specs/` נמצא ב-
> `_bmad-output/specs/GAP-ANALYSIS-2026-08-30.md`. קבצי ה-SPEC עצמם הם
> החוזה המחייב; המסמך הזה הוא context/motivation בלבד.

1. מטרת המוצר

לבנות אפליקציית משחק מוזיקה חברתית, פשוטה, מהירה וכיפית, שמיועדת לקבוצה של אנשים שנמצאים יחד פיזית.

המשחק מתנהל מטלפון אחד בלבד.

אין צורך שכל המשתתפים יורידו את האפליקציה.

המטרה העסקית היא לבנות מוצר בעל פוטנציאל גבוה להפצה אורגנית ולמקסם הכנסות לאורך זמן, תוך שמירה על חוויית משחק מעולה ועלויות תפעול נמוכות.

עיקרון מנחה: המוזיקה מפעילה את המשחק, אבל האינטראקציה בין האנשים היא המוצר.

2. Core Game Loop

האפליקציה משמיעה שיר. המשתתפים צריכים לנחש: שם השיר, שם האמן, שנת היציאה.

לאחר שהקבוצה החליטה על התשובות: Reveal — האפליקציה חושפת 🎵 שם השיר, 🎤 שם האמן, 📅 שנת היציאה.

לאחר מכן: Next Song — וחוזרים מיד לשיר הבא.

ה-Flow המרכזי: Listen → Guess → Reveal → React → Next. אסור להעמיס שלבים נוספים ללא סיבה טובה.

3. פילוסופיית המוצר

קלה להבנה תוך שניות. אין צורך ב-Login/חשבונות/Profiles/שמות משתתפים/Multiplayer בין טלפונים/Chat/Backend מורכב/AI/הזנת מידע מיותרת. המשחק צריך להתחיל מהר ככל האפשר; הטלפון צריך להפוך כמעט לבלתי מורגש במהלך המשחק.

4. קהל היעד

קהל רחב: צעירים, מבוגרים, חברים, משפחות, קבוצות עבודה, מסיבות, חופשות, מפגשים חברתיים. אין לבנות משחק נפרד לכל קבוצת גיל — ברירת המחדל היא משחק שמתאים לקהל רחב.

5. מצב צעירים

סינון הגיל היחיד הנדרש כרגע: "Young Mode / מצב צעירים" — כשמופעל, לא יוצגו שירים בני יותר מ-15 שנה (currentYear - 15, מחושב דינמית, לא מקובע בקוד).

6. מאגר השירים

לא מחפשים כמה שיותר שירים — מחפשים כמה שיותר שירים שאנשים באמת נהנים לנחש. עדיפות ללהיטים גדולים/מוכרים/אייקוניים/נוסטלגיים/עם פתיחה מזוהה. להימנע משירים נישתיים, B-sides, יותר מדי שירים של אותו אמן, מילוי מלאכותי, גרסאות Live מיותרות, קאברים. עדיפות לגרסה מקורית.

7. עיקרון קושי

"קשה" לא אומר "לא מוכר". רמות: Easy (להיט שכולם מכירים), Medium (מוכר אך דורש חשיבה), Hard (מוכר לקהל הרחב אך קשה לזהות במדויק). אין להשתמש בשירים לא מוכרים כדי לייצר קושי מלאכותי.

8. שנת היציאה

חלק מרכזי מהניחוש (יוצרת ויכוחים) — לא פרט מידע משני. אחד משלושת מרכיבי הניחוש המרכזיים.

9. מבנה נתוני השיר

חובה: id, title, artist, year, language, difficulty, popularity, enabled. מומלץ: era, lastPlayed, playCount. אם צריך מזהה ספק חיצוני: provider, providerTrackId. אין לשמור URL זמני של Stream כמזהה קבוע.

10. מנגנון בחירת השירים

לא Pure Random — בחירה אקראית אך חכמה: Variety + Recognition + Challenge + Surprise. להימנע מ: אותו אמן פעמיים ברצף, אותה שנה שוב ושוב, רצף ארוך מאותו עשור, רצף שירים קשים, רצף שירים קלים מאוד, שיר שהושמע לאחרונה, חזרתיות גבוהה בתוך Session.

11. איזון קושי

אין רצפי Hard→Hard→Hard→Hard וגם לא Easy→Easy→Easy→Easy — יש לערבב (למשל Easy→Medium→Easy→Medium→Hard→Easy→Medium).

12. מסך המשחק — מצב ניחוש

בזמן שהשיר מתנגן אסור להציג מידע שיכול לחשוף את התשובה (לא שם אמן/שיר/עטיפת אלבום מסגירה/Metadata מזהה). מסך נקי ומינימליסטי — המוזיקה היא המרכז.

13. Reveal Screen

מציג בבירור וגדול: 🎵 Song Title, 🎤 Artist, 📅 Year — רגע מספק. השיר ממשיך להתנגן אם ניתן. לאחר מכן כפתור NEXT ברור.

14. UX

כל פעולה מהירה. הימנע מ-Dialogs מיותרים/Confirmations/Menus עמוקים/מסכי מעבר/אנימציות ארוכות/פעולות שדורשות טלפון מכל משתתף. עיקרון: Listen→Guess→Reveal→Next. Feature שלא משפר את השרשרת הזו לא נכנס ל-V1.

15. שימוש בטלפון אחד

עיקרון מוצר: אדם אחד מפעיל משחק ל-4-10 אנשים → מנגנון ההפצה האורגני המרכזי. אין לדרוש התקנה מכל משתתף.

16. ויראליות

רגעי המשחק עצמם ניתנים לשיתוף — האינטראקציה בין האנשים היא הפרסומת. אין צורך ב-Video Mode מורכב ב-V1.

17. מונטיזציה

מקסימום הכנסה לאורך זמן בלי להרוס את ה-Game Flow. אסור פרסומת באמצע שיר (לא Song→Ad→Song→Ad). Banner באזור שלא מפריע ולא צמוד לכפתורי פעולה. Interstitial רק בנקודות מעבר טבעיות (למשל סיום Round). Rewarded Ads יכולים לפתוח זמנית Packs/תוכן נוסף.

18. Premium / Packs

עתידי: Israeli, International, Current Hits, 80s, 90s, 2000s, Rock, Pop, Israeli Classics, Party Hits — בלי לפרק את המשחק לעשרות חבילות קטנות שפוגעות בגרסה החינמית. Free חייב להיות משחק מצוין בפני עצמו. Free creates addiction/virality, Premium monetizes.

19. מאגר ישראלי

יעד ~500 שירים (בפועל כבר הורחב הרבה מעבר לזה — ראה gap analysis). קו מנחה: להיטים ישראליים מוכרים ואהובים, לא "אנציקלופדיה". יעד ~15 שירים איכותיים לשנה 2000-2026 (ככל שיש מספיק שעומדים ברף), יתרה מ-1960-2000. איכות קודמת לעמידה מלאכותית במכסה.

20. זכויות מוזיקה וספק מוזיקה

קריטי: אין להניח שקיום שיר ב-Spotify/Apple Music/YouTube מאפשר השמעה חופשית בתוך משחק מסחרי. לפני Streaming: לוודא תנאי שימוש, API restrictions, Playback restrictions, Commercial use, Music licensing, Preview limitations, Attribution requirements. אין לעקוף מגבלות ספק. לבנות שכבת מוזיקה כ-abstraction (MusicProvider: play/pause/resume/stop/seek/getPlaybackState) כדי שניתן יהיה להחליף Provider בעתיד. לוגיקת המשחק לא תלויה ישירות בספק מוזיקה מסוים.

21. Offline / Backend

אין Backend מורכב ללא צורך. Metadata/לוגיקה מקומיים ככל האפשר. אם Streaming דורש אינטרנט — רק שכבת המוזיקה תלויה בחיבור. בעתיד אפשר Remote Config/Analytics/Content Updates, אבל לא מערכת משתמשים רק בשביל זה.

22. Analytics

למדוד לפחות: game_started, song_started, song_revealed, song_skipped, next_song, session_finished, songs_per_session, session_duration, young_mode_used, pack_selected, ad_impression, rewarded_ad_completed, purchase. אין צורך בזיהוי אישי לצורך מדדי המשחק הבסיסיים.

23. KPI מרכזי

Songs per Session. 15-30 שירים + "יאללה עוד אחד" = הליבה עובדת. בהמשך: D1/D7/D30 retention, Sessions per user, Revenue per install, Ad revenue per session, Purchase conversion, Organic installs, Store rating.

24. ארכיטקטורה

מודולרי: UI, Game Engine, Song Selection Engine, Song Database, Music Provider, Monetization, Analytics, Settings — הפרדה מלאה. אין לערבב לוגיקת ספק בתוך Game Engine. Song Selection Engine ניתן לשינוי בלי לשכתב UI.

25. Cross-platform

ארכיטקטורה לא תלויה ב-Android בלבד אם אין צורך טכני — מטרה עסקית: Android + iOS מאותו בסיס ככל האפשר.

26. Performance

מעבר בין שירים מיידי. Preload/Prepare לשיר הבא כשהספק מאפשר. אין להמתין 3-5 שניות בכל מעבר. Latency בין Next לתחילת השיר הבא = KPI טכני חשוב.

27. Design Direction

Premium, Modern, Musical, Social, Energetic, Clean. לא ילדותי, לא Casino, לא עמוס אורות/Coins/Badges. אנימציות מוסיפות אנרגיה, לא מפריעות.

28. עקרון פיתוח

לפני Feature חדש: האם הוא משפר Fun / Retention / Virality / Revenue? אם לא — לא נוסף. Revenue לעולם לא על חשבון פגיעה משמעותית ב-Fun/Retention.

29. סדר עדיפויות

1. Game must be fun. 2. Songs must be excellent. 3. Game must be extremely easy to use. 4. Session must flow without interruptions. 5. Users should naturally expose other people to the game. 6. Monetization should sit around the experience, not destroy it. 7. Architecture should remain simple and inexpensive to operate.

30. קו מנחה עליון

אל תהפוך את האפליקציה למערכת מורכבת. הקסם: מפעילים שיר → מנסים לזהות → מתווכחים → חושפים → צוחקים → עוד שיר. המטרה: "יאללה, עוד שיר" ולא "איזו אפליקציה מתוחכמת". כל החלטת Product/UX/Code/Monetization צריכה לשרת את הרגע הזה.
