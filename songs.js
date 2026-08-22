// songs.js — מאגר השירים של האתר.
//
// זהו קובץ נתונים לדוגמה (placeholder) בלבד — כ-14 שירים לבדיקה מבנית.
// כשתקבל את הרשימה המלאה (כ-500 שירים) בטקסט מודבק, היא תוחלף לכאן באותה סכימה.
//
// סכימה לכל שיר:
//   title      — שם השיר (חובה)
//   artist     — שם האומן/הלהקה (חובה)
//   year       — שנת יציאה (חובה, מספר)
//   youtubeId  — מזהה סרטון YouTube מדויק (אופציונלי). קיים → מנגן בדיוק אותו סרטון.
//                חסר/ריק ("") → האתר נופל לחיפוש אוטומטי לפי "אומן שם-שיר".

window.SONGS = [
  { title: "אין לי ארץ אחרת", artist: "קורין אלאל", year: 1986, youtubeId: "" },
  { title: "סע לאט", artist: "שלמה ארצי", year: 1980, youtubeId: "" },
  { title: "שיר לשלום", artist: "להקת הנח\"ל", year: 1969, youtubeId: "" },
  { title: "אמא אדמה", artist: "אריק איינשטיין", year: 1977, youtubeId: "" },
  { title: "היא לא יודעת", artist: "עברי לידר", year: 2004, youtubeId: "" },
  { title: "ירח", artist: "משינה", year: 1993, youtubeId: "" },
  { title: "Space Oddity", artist: "David Bowie", year: 1969, youtubeId: "" },
  { title: "Redemption Song", artist: "Bob Marley", year: 1980, youtubeId: "" },
  { title: "Dreams", artist: "Fleetwood Mac", year: 1977, youtubeId: "" },
  { title: "Wish You Were Here", artist: "Pink Floyd", year: 1975, youtubeId: "" },
  { title: "Ho Hey", artist: "The Lumineers", year: 2012, youtubeId: "" },
  { title: "Skinny Love", artist: "Bon Iver", year: 2007, youtubeId: "" },
  { title: "Harvest Moon", artist: "Neil Young", year: 1992, youtubeId: "" },
  // דוגמה עם youtubeId מדויק — ממחישה את מנגנון ההתאמה המדויקת (CAP-5) כשהעמודה קיימת.
  { title: "Never Gonna Give You Up", artist: "Rick Astley", year: 1987, youtubeId: "dQw4w9WgXcQ" }
];
