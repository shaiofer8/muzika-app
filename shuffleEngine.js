// shuffleEngine.js — מנוע בחירה חכם (spec-smart-shuffle-engine): לא Pure
// Random, אלא Variety + Recognition + Challenge + Surprise. מוסיף לגבי
// המנגנון הקודם (שמנע רק חזרה מיידית) הימנעות רכה מ: אותו אמן ברצף, אותה
// שנה ברצף, רצף עשור אחד, ורצף רמת-קושי אחת — עם נפילה חינה (graceful
// degradation, CAP-6) כשמאגר הבחירה קטן מדי בשביל לקיים את כל האילוצים.
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
    var history = []; // שירים שאושרו בפועל (commit), מהישן לחדש
    var counts = [];  // [{ song, count }] — playCount בזיכרון בלבד, לפי Session (CAP-5)

    function countOf(song) {
      for (var i = 0; i < counts.length; i++) {
        if (counts[i].song === song) return counts[i].count;
      }
      return 0;
    }

    function bumpCount(song) {
      for (var i = 0; i < counts.length; i++) {
        if (counts[i].song === song) { counts[i].count += 1; return; }
      }
      counts.push({ song: song, count: 1 });
    }

    // בין כמה מועמדים שווי-זכאות, מעדיף את אלו עם הכי מעט השמעות בסשן
    // הנוכחי (CAP-5) — לא חוסם שיר שכבר נוגן, רק מוריד לו עדיפות.
    function pickLeastPlayed(candidates) {
      var minCount = Infinity;
      for (var i = 0; i < candidates.length; i++) {
        var c = countOf(candidates[i]);
        if (c < minCount) minCount = c;
      }
      var pool = candidates.filter(function (s) { return countOf(s) === minCount; });
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function pick(pool) {
      if (!pool || !pool.length) return null;
      if (pool.length === 1) return pool[0];

      var last = history.length ? history[history.length - 1] : null;

      for (var r = 0; r < RULE_SETS.length; r++) {
        var candidates = pool.filter(function (song) {
          if (song === last) return false; // CAP-1: לעולם לא חוזר על השיר הרגעי
          return !violatesRules(song, history, RULE_SETS[r]);
        });
        if (candidates.length) return pickLeastPlayed(candidates);
      }

      // גיבוי אחרון (לא אמור להגיע לכאן כי RULE_SETS[last] = {} תמיד מספק
      // תוצאה כשיש יותר משיר אחד בפול) — פשוט נמנע מהשיר הרגעי אם אפשר.
      var fallback = pool.filter(function (s) { return s !== last; });
      return (fallback.length ? fallback : pool)[Math.floor(Math.random() * (fallback.length || pool.length))];
    }

    return {
      // הצצה בלבד — לא נרשם בהיסטוריה עד commit(). משמש גם לבחירה בפועל
      // (app.js קורא pick() ואז commit() על מה שבאמת הופעל) וגם ל-preload
      // (app.js קורא pick() על ה"שיר הבא" הצפוי בלי להתחייב אליו עדיין).
      pick: pick,
      commit: function (song) {
        if (!song) return;
        history.push(song);
        bumpCount(song);
      },
      reset: function () {
        history = [];
        counts = [];
      }
    };
  }

  window.MuzikaShuffleEngine = { create: create };
})();
