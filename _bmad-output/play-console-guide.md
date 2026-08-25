# מדריך: רישום "מי מזהה את השיר?" ב-Play Console

מדריך "מלא-אחריי" — כל טקסט שאתה צריך כבר כתוב כאן, מבוסס על מה שבפועל
קיים באפליקציה (אין ads, אין IAP, אין אנליטיקס, אין שרת — הכל localStorage
בלבד). הדבר היחיד שנדרש ממך זה להעתיק-להדביק וללחוץ.

**קבצים מוכנים להעלאה** (ב-`C:\Users\shaio\muzika-app\`):
- `app-release-signed.aab` — **זה מה שמעלים ל-Play Console**
- `store_icon.png` (512×512) — אייקון החנות
- `store_feature_graphic.png` (1024×500) — הבאנר הראשי
- `store-screenshots/01-home.png`, `store-screenshots/02-score.png` — צילומי מסך אמיתיים מהאפליקציה

---

## שלב 1: יצירת רשומת האפליקציה

1. היכנס ל-[Play Console](https://play.google.com/console)
2. **All apps** → **Create app**
3. מלא:
   - **App name:** `מי מזהה את השיר?`
   - **Default language:** עברית - Hebrew
   - **App or game:** Game (זה משחק מסיבה, לא "App" רגיל)
   - **Free or paid:** Free
   - סמן את שתי הצהרות המדיניות
4. **Create app**

## שלב 2: טופס Data Safety

**App content** → **Data safety** → **Start**

| שאלה | תשובה |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |

**למה "No" (בניגוד ל-sofrim-yamim):** אין כאן פרסומות, אין אנליטיקס, אין
SDK צד-שלישי שאוסף כלום. הניקוד נשמר רק ב-`localStorage` על המכשיר עצמו
ולעולם לא עוזב אותו. השיתוף ל-WhatsApp הוא ניווט רגיל ליוזמת המשתמש
(`wa.me` / `navigator.share`), לא איסוף נתונים.

### Privacy policy URL
```
https://muzika.sofrimyamim.com/privacy-policy.html
```

## שלב 3: שאר "App content"

- **App access:** All functionality available without special access
- **Ads:** **No** — האפליקציה לא מציגה פרסומות
- **Content rating:** מלא שאלון — צפוי "Everyone"/"General" (אין אלימות/תוכן בוגר; שים לב שהתוכן הוא שירים אקראיים ממאגר שבחרת, כדאי לוודא שאין מילות שיר בעייתיות בכותרות עצמן — לא רלוונטי לדירוג, רק לשקט נפשי)
- **Target audience:** קבוצת גילאים כללית (לא Google Play for Families)
- **News app:** No
- **COVID-19:** No

## שלב 4: Store listing

- **App name:** `מי מזהה את השיר?`
- **Short description** (עד 80 תווים):
  ```
  משחק מסיבה - נחשו את השיר, האמן והשנה. אתגרו את החברים!
  ```
- **Full description:**
  ```
  מי מזהה את השיר? 🎵

  משחק מסיבה פשוט וכיפי — מנגנים שיר רנדומלי מתוך מאגר של 328 שירים,
  והשחקנים מתחרים לזהות את השם, האמן והשנה.

  ✨ איך משחקים:
  • לוחצים "שיר הבא" ומקבלים שיר אקראי עם קליפ מיוטיוב
  • כל מי שמזהה ראשון — מנצח בסיבוב
  • עוקבים אחרי ניקוד לכל קבוצה, בלי מגבלה על מספר הקבוצות
  • משתפים את המשחק עם חברים ישירות מהאפליקציה

  🎉 מושלם למסיבות, ערבי משפחה, ואירועים חברתיים — פשוט פותחים ומתחילים.

  ללא פרסומות, ללא רכישות, ללא צורך בחשבון.
  ```
- **Icons/screenshots:**
  - Icon: `store_icon.png`
  - Feature graphic: `store_feature_graphic.png`
  - Phone screenshots: `store-screenshots/01-home.png`, `store-screenshots/02-score.png` (מינימום 2 — יש בדיוק 2 מוכנים; מומלץ להוסיף עוד 1-2 בעתיד)

## שלב 5: Testers (מסלול בדיקה סגורה)

1. **Testing → Closed testing** → Create track (אם עדיין אין)
2. לשונית **Testers** → הוסף את 12 המיילים (יש לך כבר רשימה מוכנה — אותה רשימה ששימשה את sofrim-yamim, אפשר להשתמש שוב אם הם מוכנים לבדוק גם את זה, או להשתמש בשירות בתשלום כמו Testers Community)
3. העלה את `app-release-signed.aab` ל-**Production → Create new release** (או ישירות ל-closed testing track, בהתאם לאיפה שתרצה להתחיל)
4. שמור והמתן 12 בודקים × 14 יום (עם engagement אמיתי, כפי שדיברנו)

## שלב 6: לאחר האישור

עדכון גרסה עתידי דורש:
```
appVersionCode: 2  (ב-twa-manifest.json ו-app/build.gradle)
```
ואז לבנות מחדש (`gradlew.bat bundleRelease`) ולהעלות `.aab` חדש — אני יכול לעשות את זה בשבילך בכל עת.

---

**הערה על ה-keystore:** נשמר מקומית ב-`android.keystore` (לא בגיטהאב, בכוונה — ר' `.keystore-secrets.txt` לסיסמה). **גבה את שני הקבצים האלה במקום בטוח** (מנהל סיסמאות) — בלעדיהם אי אפשר לפרסם עדכונים לאותה רשומת אפליקציה לעולם.
