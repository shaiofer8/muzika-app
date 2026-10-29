// app.js — לולאת המשחק: Listen → Guess → Reveal → Next (spec-reveal-flow),
// בחירה חכמה של השיר הבא דרך shuffleEngine.js (spec-smart-shuffle-engine),
// וניגון דרך שכבת ה-Provider ב-musicProvider.js (spec-music-provider-abstraction)
// — אין כאן יותר שום בנייה ישירה של URL של youtube.com.
// מופעל ע"י lang.js (MuzikaApp.init עם רשימת השירים של השפה הנוכחית),
// לא רץ אוטומטית עם טעינת הסקריפט — כדי לחכות לבחירת שפה/מאגר שירים.
(function () {
  "use strict";

  var provider = window.MuzikaMusicProvider && window.MuzikaMusicProvider.create();
  var engine = window.MuzikaShuffleEngine && window.MuzikaShuffleEngine.create();

  var current = null;     // השיר שמנוגן כרגע (null גם במסך שגיאה/ריק)
  var pendingNext = null; // "הצצה" לשיר הבא, מחושבת מראש לצורך preload — לא committed עדיין
  var pending = false;    // מגן מפני לחיצות-בזק על הכפתור הראשי/שיר-אחר
  var songs = [];         // מאגר מלא של השפה הנוכחית (לא מסונן) — מגיע מ-lang.js
  var newMode = false;    // מצב "חדשים" — לא נשמר בין ביקורים, ולא מתאפס במעבר שפה
  var gameStarted = false; // game_started נורה פעם אחת בלבד לכל טעינת דף

  var els = {
    title: document.getElementById("songTitle"),
    artist: document.getElementById("songArtist"),
    year: document.getElementById("songYear"),
    frame: document.getElementById("videoFrame"),
    revealState: document.getElementById("revealState"),
    trackInfo: document.querySelector(".track-info"),
    primaryBtn: document.getElementById("primaryBtn"),
    primaryIcon: document.getElementById("primaryIcon"),
    primaryLabel: document.getElementById("primaryLabel"),
    ytLink: document.getElementById("ytLink"),
    hideSongBtn: document.getElementById("hideSongBtn"),
    newBtn: document.getElementById("newBtn")
  };

  if (provider && els.frame) provider.mount(els.frame);

  function t(key) {
    return (window.MuzikaLang && window.MuzikaLang.t(key)) || key;
  }

  function track(name, params) {
    if (window.MuzikaAnalytics) window.MuzikaAnalytics.track(name, params);
  }

  // מפעיל מחדש את אנימציית ה-CSS "pop" (הסרה+הוספה כדי לאלץ reflow) — הן
  // במעבר לשיר חדש והן ברגע החשיפה עצמו.
  function replayPop() {
    if (!els.trackInfo) return;
    els.trackInfo.classList.remove("pop");
    void els.trackInfo.offsetWidth;
    els.trackInfo.classList.add("pop");
  }

  // ---------------------------------------------------------------------
  // שלושת מצבי התצוגה: האזנה (לפני חשיפה) / חשיפה / הודעת שגיאה-ריק.
  // ---------------------------------------------------------------------
  function showRevealed(song) {
    els.title.textContent = song.title;
    els.artist.textContent = song.artist;
    els.year.textContent = song.year || t("unknownYear");
    els.revealState.hidden = false;
    els.ytLink.hidden = false;
    if (els.hideSongBtn) els.hideSongBtn.hidden = false;
    replayPop();
  }

  function showMessage(titleKey, hintKey) {
    els.title.textContent = t(titleKey);
    els.artist.textContent = t(hintKey);
    els.year.textContent = "—";
    els.revealState.hidden = false;
    els.ytLink.hidden = true;
    if (els.hideSongBtn) els.hideSongBtn.hidden = true;
  }

  function updatePrimaryButton() {
    els.primaryIcon.textContent = "▶️";
    els.primaryLabel.setAttribute("data-i18n", "nextBtn");
    els.primaryLabel.textContent = t("nextBtn");
  }

  // ---------------------------------------------------------------------
  // ניגון בפועל דרך ה-Provider + preload לשיר הבא הצפוי.
  // ---------------------------------------------------------------------
  window.addEventListener("muzika:playing", function () {
    track("song_started", { language: window.MuzikaLang && window.MuzikaLang.get() });
  });

  function playSong(song) {
    current = song;
    rememberPlayed(song);
    if (provider) provider.play(song);
    els.ytLink.href = "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(song.artist + " " + song.title);
    showRevealed(song);
    updatePrimaryButton();
    preloadNext();
  }

  // מציץ לשיר הבא הצפוי בלי לקבוע אותו סופית (commit קורה רק כשבאמת
  // עוברים אליו, ב-pickAndPlay) — כדי ש-provider.preload() יספיק לחמם
  // רשת/thumbnail מראש (spec-music-provider-abstraction CAP-3).
  function preloadNext() {
    pendingNext = engine ? engine.pick(activePool()) : null;
    if (pendingNext && provider) provider.preload(pendingNext);
  }

  function clearDisplay(opts) {
    current = null;
    pendingNext = null;
    if (provider) provider.stop();
    var newEmpty = opts && opts.newEmpty;
    showMessage(newEmpty ? "newNoSongs" : "noSongs", newEmpty ? "newNoSongsHint" : "tryRefresh");
    updatePrimaryButton();
  }

  // "15 שנה אחרונות" (spec-kids-mode) — מחושב דינמית מהשנה הנוכחית בכל
  // קריאה, לא קבוע בקוד.
  function newMinYear() {
    return new Date().getFullYear() - 15;
  }

  function filterNew(list) {
    var minYear = newMinYear();
    return list.filter(function (s) {
      return typeof s.year === "number" && s.year >= minYear;
    });
  }

  // מאגר הבחירה הפעיל: כל השירים, או רק שירים "חדשים" מתוך מאגר השפה
  // הנוכחית, לפי מצב הכפתור. שדה s.enabled === false (spec-smart-shuffle-engine
  // §9) מוציא שיר מהבחירה בלי למחוק אותו מהקובץ.
  // Decade filter: null = all songs, otherwise the first year of the chosen decade.
  var decadeStart = null;
  var decadeSelect = document.getElementById("decadeSelect");
  if (decadeSelect) {
    decadeSelect.addEventListener("change", function () {
      decadeStart = decadeSelect.value === "all" ? null : Number(decadeSelect.value);
      current = null;
      pendingNext = null;
      pickAndPlay();
    });
  }

  // Last 30 songs played, kept across visits (per device). Used to avoid repeats.
  var RECENT_KEY = "muzika-recent-v1";
  var RECENT_MAX = 30;
  var RECENT_MIN_POOL = 5; // if avoiding recent songs leaves fewer than this, ignore the list
  function songKey(s) { return s.artist + "|" + s.title; }
  function loadRecent() {
    try { var raw = localStorage.getItem(RECENT_KEY); var arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
  }
  function rememberPlayed(s) {
    try {
      var arr = loadRecent().filter(function (k) { return k !== songKey(s); });
      arr.push(songKey(s));
      localStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(-RECENT_MAX)));
    } catch (e) { /* storage unavailable: just skip the memory */ }
  }

  // Songs the user chose "never show again" (per device).
  var HIDDEN_KEY = "muzika-hidden-v1";
  function loadHidden() {
    try { var raw = localStorage.getItem(HIDDEN_KEY); var arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
  }
  function hideCurrent() {
    if (!current) return;
    try {
      var arr = loadHidden();
      if (arr.indexOf(songKey(current)) === -1) arr.push(songKey(current));
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(arr));
    } catch (e) { /* storage unavailable: the song simply comes back */ }
    pendingNext = null;
    pickAndPlay();
  }
  if (els.hideSongBtn) els.hideSongBtn.addEventListener("click", hideCurrent);

  function activePool() {
    var hiddenList = loadHidden();
    var base = songs.filter(function (s) { return s.enabled !== false && hiddenList.indexOf(songKey(s)) === -1; });
    if (decadeStart !== null) {
      base = base.filter(function (s) { return typeof s.year === "number" && s.year >= decadeStart && s.year < decadeStart + 10; });
    }
    var pool = newMode ? filterNew(base) : base;
    var recent = loadRecent();
    var fresh = pool.filter(function (s) { return recent.indexOf(songKey(s)) === -1; });
    return fresh.length >= RECENT_MIN_POOL ? fresh : pool;
  }

  function pickAndPlay() {
    var pool = activePool();

    // פחות מ-2 שירים בטווח בזמן שמצב "חדשים" דלוק שובר את מנגנון "לא לחזור
    // מיידית על השיר הקודם" — מוצגת הודעה ברורה במקום מסך ריק/תקיעה.
    if (newMode && pool.length < 2) {
      clearDisplay({ newEmpty: true });
      return;
    }
    if (!pool.length) {
      clearDisplay();
      return;
    }

    var next = (pendingNext && pool.indexOf(pendingNext) !== -1) ?
      pendingNext :
      (engine ? engine.pick(pool) : pool[Math.floor((window.MuzikaRandom ? window.MuzikaRandom() : Math.random()) * pool.length)]);
    if (engine) engine.commit(next);
    playSong(next);
  }

  // ---------------------------------------------------------------------
  // הכפתור הראשי: חשיפה (שלב 1) → הבא (שלב 2) → חוזר לחשיפה על השיר הבא...
  // ---------------------------------------------------------------------
  function onPrimaryClick() {
    if (pending) return;

    if (!current) { pickAndPlay(); return; } // מסך שגיאה — "הבא" מנסה שוב

    pending = true;
    if (window.MuzikaAnalytics) window.MuzikaAnalytics.songAdvanced();
    track("next_song");
    pickAndPlay();
    window.setTimeout(function () { pending = false; }, 500);
  }

  function updateNewButton() {
    if (!els.newBtn) return;
    els.newBtn.classList.toggle("active", newMode);
    els.newBtn.setAttribute("aria-pressed", newMode ? "true" : "false");
  }

  if (els.primaryBtn) els.primaryBtn.addEventListener("click", onPrimaryClick);

  // "איך משחקים": שלושה מסכים, מוצג פעם אחת בכל מכשיר (try/catch, כי localStorage עלול להיות חסום).
  (function () {
    var howto = document.getElementById("howto");
    var next = document.getElementById("howtoNext");
    var skip = document.getElementById("howtoSkip");
    if (!howto || !next || !skip) return;
    var KEY = "muzika-howto-v1";
    var seen = false;
    try { seen = !!localStorage.getItem(KEY); } catch (e) {}
    if (seen) return;
    var slides = howto.querySelectorAll(".howto-slide");
    var dots = howto.querySelectorAll(".howto-dots span");
    var idx = 0;
    function t(key, fallback) { return window.MuzikaLang ? window.MuzikaLang.t(key) : fallback; }
    function show(i) {
      idx = i;
      for (var k = 0; k < slides.length; k++) { slides[k].hidden = k !== i; }
      for (var d = 0; d < dots.length; d++) { dots[d].className = d === i ? "on" : ""; }
      next.textContent = i === slides.length - 1 ? t("howtoOk", "הבנתי") : t("howtoNext", "הבא");
    }
    function close() {
      howto.hidden = true;
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
    }
    howto.hidden = false;
    show(0);
    next.addEventListener("click", function () { if (idx < slides.length - 1) show(idx + 1); else close(); });
    skip.addEventListener("click", close);
  })();

  if (els.newBtn) {
    els.newBtn.addEventListener("click", function () {
      newMode = !newMode;
      updateNewButton();
      track("kids_mode_used", { enabled: newMode });
      pickAndPlay();
    });
  }

  // זיהוי שגיאת YouTube "סרטון לא זמין להטמעה" (קוד 150/101/100) — קפיצה
  // אוטומטית לשיר הבא בלי שהמשתמש יצטרך ללחוץ כלום.
  window.addEventListener("muzika:videoUnavailable", function () {
    if (!current) return;
    track("video_unavailable", { youtubeId: current.youtubeId || "" });
    pickAndPlay();
  });

  // ---------------------------------------------------------------------
  // API ל-lang.js: קריאה עם מאגר שירים חדש (טעינה ראשונה או החלפת שפה).
  // ---------------------------------------------------------------------
  function setSongs(newSongs, opts) {
    songs = Array.isArray(newSongs) ? newSongs.filter(function (s) {
      return s && typeof s.title === "string" && s.title.trim() &&
        typeof s.artist === "string" && s.artist.trim();
    }) : [];
    if (engine) engine.reset(); // מאגר חדש (למשל שפה אחרת) = היסטוריית המנוע לא רלוונטית יותר
    current = null;
    pendingNext = null;
    if (!gameStarted) {
      gameStarted = true;
      track("game_session_started");
    }
    if (opts && opts.silent) return; // lang.js יזום showError בעצמו
    pickAndPlay();
  }

  window.MuzikaApp = {
    init: function (newSongs) { setSongs(newSongs); },
    reload: function (newSongs) { setSongs(newSongs); },
    showError: function () { clearDisplay(); }
  };
})();
