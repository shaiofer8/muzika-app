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
  var revealed = false;   // false = שלב האזנה/ניחוש (spec-reveal-flow CAP-1), true = אחרי חשיפה
  var pending = false;    // מגן מפני לחיצות-בזק על הכפתור הראשי/שיר-אחר
  var songs = [];         // מאגר מלא של השפה הנוכחית (לא מסונן) — מגיע מ-lang.js
  var newMode = false;    // מצב "חדשים" — לא נשמר בין ביקורים, ולא מתאפס במעבר שפה
  var gameStarted = false; // game_started נורה פעם אחת בלבד לכל טעינת דף

  var els = {
    title: document.getElementById("songTitle"),
    artist: document.getElementById("songArtist"),
    year: document.getElementById("songYear"),
    frame: document.getElementById("videoFrame"),
    listeningHint: document.getElementById("listeningHint"),
    revealState: document.getElementById("revealState"),
    trackInfo: document.querySelector(".track-info"),
    primaryBtn: document.getElementById("primaryBtn"),
    primaryIcon: document.getElementById("primaryIcon"),
    primaryLabel: document.getElementById("primaryLabel"),
    skipBtn: document.getElementById("skipBtn"),
    ytLink: document.getElementById("ytLink"),
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
  function showListening() {
    els.listeningHint.hidden = false;
    els.revealState.hidden = true;
    els.ytLink.hidden = true; // אין לינק ליוטיוב לפני חשיפה — הכתובת עצמה מסגירה שם שיר+אמן
    replayPop();
  }

  function showRevealed(song) {
    els.title.textContent = song.title;
    els.artist.textContent = song.artist;
    els.year.textContent = song.year || t("unknownYear");
    els.listeningHint.hidden = true;
    els.revealState.hidden = false;
    els.ytLink.hidden = false;
    replayPop();
  }

  function showMessage(titleKey, hintKey) {
    els.title.textContent = t(titleKey);
    els.artist.textContent = t(hintKey);
    els.year.textContent = "—";
    els.listeningHint.hidden = true;
    els.revealState.hidden = false;
    els.ytLink.hidden = true;
  }

  function updatePrimaryButton() {
    if (revealed) {
      els.primaryIcon.textContent = "▶️";
      els.primaryLabel.setAttribute("data-i18n", "nextBtn");
      els.primaryLabel.textContent = t("nextBtn");
    } else {
      els.primaryIcon.textContent = "🎭";
      els.primaryLabel.setAttribute("data-i18n", "revealBtn");
      els.primaryLabel.textContent = t("revealBtn");
    }
    // "שיר אחר" (דילוג בלי חשיפה) רלוונטי רק בשלב ההאזנה — אחרי חשיפה
    // הכפתור הראשי עצמו כבר הופך ל"הבא" (Non-goals של spec-reveal-flow).
    if (els.skipBtn) els.skipBtn.hidden = revealed;
  }

  // ---------------------------------------------------------------------
  // ניגון בפועל דרך ה-Provider + preload לשיר הבא הצפוי.
  // ---------------------------------------------------------------------
  function playSong(song) {
    current = song;
    revealed = false;
    if (provider) provider.play(song, { hideMetadata: true });
    els.ytLink.href = "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(song.artist + " " + song.title);
    showListening();
    updatePrimaryButton();
    track("song_started", { language: window.MuzikaLang && window.MuzikaLang.get() });
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
    revealed = true; // מאפשר לכפתור הראשי לשמש כ"נסה שוב" גם במצב שגיאה/ריק
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
  function activePool() {
    var base = songs.filter(function (s) { return s.enabled !== false; });
    return newMode ? filterNew(base) : base;
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
      (engine ? engine.pick(pool) : pool[Math.floor(Math.random() * pool.length)]);
    if (engine) engine.commit(next);
    playSong(next);
  }

  // ---------------------------------------------------------------------
  // הכפתור הראשי: חשיפה (שלב 1) → הבא (שלב 2) → חוזר לחשיפה על השיר הבא...
  // ---------------------------------------------------------------------
  function onPrimaryClick() {
    if (pending) return;

    if (!current) { pickAndPlay(); return; } // מסך שגיאה — "הבא" מנסה שוב

    if (!revealed) {
      revealed = true;
      if (provider) provider.updateTitle(current);
      showRevealed(current);
      updatePrimaryButton();
      track("song_revealed", { language: window.MuzikaLang && window.MuzikaLang.get() });
      return;
    }

    pending = true;
    if (window.MuzikaAnalytics) window.MuzikaAnalytics.songAdvanced();
    track("next_song");
    pickAndPlay();
    window.setTimeout(function () { pending = false; }, 500);
  }

  // "שיר אחר" — דילוג על השיר הנוכחי בלי לחשוף אותו כלל (נשאר אפשרי, לא
  // חלק מהלולאה הרגילה — Non-goals של spec-reveal-flow).
  function onSkipClick() {
    if (pending || revealed) return;
    pending = true;
    if (window.MuzikaAnalytics) window.MuzikaAnalytics.songAdvanced();
    track("song_skipped");
    pickAndPlay();
    window.setTimeout(function () { pending = false; }, 500);
  }

  function updateNewButton() {
    if (!els.newBtn) return;
    els.newBtn.classList.toggle("active", newMode);
    els.newBtn.setAttribute("aria-pressed", newMode ? "true" : "false");
  }

  if (els.primaryBtn) els.primaryBtn.addEventListener("click", onPrimaryClick);
  if (els.skipBtn) els.skipBtn.addEventListener("click", onSkipClick);

  if (els.newBtn) {
    els.newBtn.addEventListener("click", function () {
      newMode = !newMode;
      updateNewButton();
      track("young_mode_used", { enabled: newMode });
      pickAndPlay();
    });
  }

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
      track("game_started");
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
