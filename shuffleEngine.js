// shuffleEngine.js — מנוע בחירה חכם (spec-smart-shuffle-engine): לא Pure
// Random, אלא Variety + Recognition + Challenge + Surprise. מוסיף לגבי
// המנגנון הקודם (שמנע רק חזרה מיידית) הימנעות רכה מ: אותו אמן ברצף, אותה
// שנה ברצף, רצף עשור אחד, ורצף רמת-קושי אחת — עם נפילה חינה (graceful
// degradation, CAP-6) כשמאגר הבחירה קטן מדי בשביל לקיים את כל האילוצים.
//
// CAP-5 (ללא חזרה בתוך Session): בניגוד לגרסה קודמת שרק הורידה עדיפות
// לשירים ששמעו, כאן זה חסימה קשה — שיר לעולם לא חוזר כל עוד יש שיר אחר
// במאגר שלא נוגן ב-Session הנוכחי. רק כששמעו את כל המאגר (מחזור מלא)
// המחזור מתחיל מחדש — ראה pick() למטה.
//
// עצמאי לגמרי מ-app.js/musicProvider.js — מקבל pool (מערך שירים) בכל
// pick() ומחזיר שיר אחד; app.js אחראי על commit() בפועל אחרי שהבחירה
// אושרה (כדי לתמוך ב"הצצה" לשיר הבא לצורך preload בלי לקבוע אותו).
(function () {
  "use strict";

  var RECENT_ARTIST_LOOKBACK = 2; // כמה בחירות אחרונות בודקים למניעת אותו אמן
  var RECENT_YEAR_LOOKBACK = 2;   // כנ"ל לגבי אותה שנה בדיוק
  var STREAK_LEN_DECADE = 3;      // רצף מקסימלי מותר מאותו עשור לפני שמחייבים גיוון
  var STREAK_LEN_DIFFICULTY = 3;  // כנ"ל לגבי רמת קושי זהה

  function difficultyOf(song) {
    return song.difficulty || "medium"; // שיר בלי תיוג נחשב ניטרלי (Assumptions)
  }

  function decadeOf(song) {
    if (typeof song.era === "number") return song.era;
    if (typeof song.year === "number") return Math.floor(song.year / 10) * 10;
    return null;
  }

  function tailAllSame(list, keyFn) {
    if (!list.length) return false;
    var key = keyFn(list[0]);
    if (key === null || key === undefined) return false;
    for (var i = 1; i < list.length; i++) {
      if (keyFn(list[i]) !== key) return false;
    }
    return true;
  }

  // בודק אם song מפר אחד מהחוקים הפעילים ב-rules ביחס להיסטוריה האחרונה.
  // (CAP-1 — "לא לחזור על השיר הרגעי" — לא נבדק כאן: הוא מובטח כבר ע"י
  // pick() דרך רשימת "השירים שלא נוגנו עדיין", כי השיר הרגעי תמיד כבר
  // committed ולכן כבר "נוגן".)
  function violatesRules(song, history, rules) {
    if (rules.artist) {
      var recentArtists = history.slice(-RECENT_ARTIST_LOOKBACK);
      for (var i = 0; i < recentArtists.length; i++) {
        if (recentArtists[i].artist === song.artist) return true;
      }
    }

    if (rules.year) {
      var recentYears = history.slice(-RECENT_YEAR_LOOKBACK);
      for (var j = 0; j < recentYears.length; j++) {
        if (recentYears[j].year === song.year) return true;
      }
    }

    if (rules.decade) {
      var decadeStreak = history.slice(-(STREAK_LEN_DECADE - 1));
      if (decadeStreak.length === STREAK_LEN_DECADE - 1 &&
        tailAllSame(decadeStreak, decadeOf) && decadeOf(song) === decadeOf(decadeStreak[0])) {
        return true;
      }
    }

    if (rules.difficulty) {
      var diffStreak = history.slice(-(STREAK_LEN_DIFFICULTY - 1));
      if (diffStreak.length === STREAK_LEN_DIFFICULTY - 1 &&
        tailAllSame(diffStreak, difficultyOf) && difficultyOf(song) === difficultyOf(diffStreak[0])) {
        return true;
      }
    }

    return false;
  }

  // CAP-6: סדר עדיפות ויתור כשהמאגר לא מאפשר לקיים הכל — קודם מוותרים על
  // קושי, אחר כך עשור, אחר כך שנה, לבסוף אמן; "לא לחזור על השיר הרגעי"
  // (CAP-1) לעולם לא מוותרים עליו כל עוד יש חלופה.
  var RULE_SETS = [
    { artist: true, year: true, decade: true, difficulty: true },
    { artist: true, year: true, decade: true, difficulty: false },
    { artist: true, year: true, decade: false, difficulty: false },
    { artist: true, year: false, decade: false, difficulty: false },
    {}
  ];

  function create() {
    var history = []; // כל השירים שאושרו בפועל (commit) מתחילת ה-Session, מהישן לחדש — לצורך אילוצי הגיוון הרך בלבד
    var played = new Set(); // אילו שירים מהמחזור הנוכחי כבר נוגנו — זו החסימה הקשה של CAP-5

    function pick(pool) {
      if (!pool || !pool.length) return null;

      var unplayed = pool.filter(function (song) { return !played.has(song); });

      // כל שירי המאגר הנוכחי כבר נוגנו במחזור הזה — מחזור מלא הסתיים.
      // מתחילים מחזור חדש (איפוס played), אבל עדיין לא מרשים לחזור מיידית
      // על השיר שרץ הרגע (CAP-1 נשאר בתוקף גם בגבול בין מחזורים).
      if (!unplayed.length) {
        played = new Set();
        var last = history.length ? history[history.length - 1] : null;
        unplayed = pool.filter(function (song) { return song !== last; });
        if (!unplayed.length) unplayed = pool.slice(); // מאגר של שיר בודד — אין חלופה
      }

      if (unplayed.length === 1) return unplayed[0];

      for (var r = 0; r < RULE_SETS.length; r++) {
        var candidates = unplayed.filter(function (song) {
          return !violatesRules(song, history, RULE_SETS[r]);
        });
        if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
      }

      // גיבוי אחרון (לא אמור להגיע לכאן כי RULE_SETS[last] = {} תמיד מספק
      // תוצאה) — בחירה רנדומלית מתוך מה שלא נוגן.
      return unplayed[Math.floor(Math.random() * unplayed.length)];
    }

    return {
      // הצצה בלבד — לא נרשם בהיסטוריה עד commit(). משמש גם לבחירה בפועל
      // (app.js קורא pick() ואז commit() על מה שבאמת הופעל) וגם ל-preload
      // (app.js קורא pick() על ה"שיר הבא" הצפוי בלי להתחייב אליו עדיין).
      pick: pick,
      commit: function (song) {
        if (!song) return;
        history.push(song);
        played.add(song);
      },
      reset: function () {
        history = [];
        played = new Set();
      }
    };
  }

  window.MuzikaShuffleEngine = { create: create };
})();
