// app.js — לוגיקת המשחק: בחירה רנדומלית, תצוגה, ניגון YouTube.
// מופעל ע"י lang.js (MuzikaApp.init עם רשימת השירים של השפה הנוכחית),
// לא רץ אוטומטית עם טעינת הסקריפט — כדי לחכות לבחירת שפה/מאגר שירים.
(function () {
  "use strict";

  var current = null;
  var pending = false;
  var songs = []; // מאגר מלא של השפה הנוכחית (לא מסונן) — מגיע מ-lang.js
  var kidsMode = false; // מצב "ילדים" (CAP-1..CAP-4 של SPEC-kids-mode) — לא נשמר בין ביקורים, ולא מתאפס במעבר שפה

  var els = {
    title: document.getElementById("songTitle"),
    artist: document.getElementById("songArtist"),
    year: document.getElementById("songYear"),
    frame: document.getElementById("videoFrame"),
    shuffle: document.getElementById("shuffleBtn"),
    ytLink: document.getElementById("ytLink"),
    trackInfo: document.querySelector(".track-info"),
    kidsBtn: document.getElementById("kidsBtn")
  };

  function t(key) {
    return (window.MuzikaLang && window.MuzikaLang.t(key)) || key;
  }

  // מפעיל מחדש את אנימציית ה-CSS "pop" בכל בחירת שיר (הסרה+הוספה כדי לאלץ reflow).
  function replayPopAnimation() {
    if (!els.trackInfo) return;
    els.trackInfo.classList.remove("pop");
    void els.trackInfo.offsetWidth;
    els.trackInfo.classList.add("pop");
  }

  function searchQuery(song) {
    return song.artist + " " + song.title;
  }

  function embedSrc(song) {
    if (song.youtubeId) {
      return "https://www.youtube.com/embed/" + encodeURIComponent(song.youtubeId) +
        "?autoplay=1&rel=0";
    }
    return "https://www.youtube.com/embed/videoseries?listType=search&list=" +
      encodeURIComponent(searchQuery(song)) + "&autoplay=1&rel=0";
  }

  function render(song, opts) {
    current = song;
    replayPopAnimation();

    if (!song) {
      var kidsEmpty = opts && opts.kidsEmpty;
      els.title.textContent = t(kidsEmpty ? "kidsNoSongs" : "noSongs");
      els.artist.textContent = t(kidsEmpty ? "kidsNoSongsHint" : "tryRefresh");
      els.year.textContent = "—";
      els.frame.innerHTML = "";
      els.ytLink.hidden = true;
      return;
    }

    els.title.textContent = song.title;
    els.artist.textContent = song.artist;
    els.year.textContent = song.year || t("unknownYear");

    // האייפריים נבנה מחדש בכל בחירה (לא רק src מוחלף) — מבטיח autoplay אמין בכל הדפדפנים.
    els.frame.innerHTML = "";
    var iframe = document.createElement("iframe");
    iframe.src = embedSrc(song);
    iframe.title = song.title + " – " + song.artist;
    iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("loading", "lazy");
    els.frame.appendChild(iframe);

    els.ytLink.hidden = false;
    els.ytLink.href = "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(searchQuery(song));
  }

  // "15 שנה אחרונות" (CAP-2 של SPEC-kids-mode) — מחושב דינמית מהשנה הנוכחית
  // בכל קריאה, לא קבוע בקוד, כדי שההגדרה תישאר נכונה גם בעתיד.
  function kidsMinYear() {
    return new Date().getFullYear() - 15;
  }

  function filterKids(list) {
    var minYear = kidsMinYear();
    return list.filter(function (s) {
      return typeof s.year === "number" && s.year >= minYear;
    });
  }

  // מאגר הבחירה הפעיל: כל השירים, או רק שירי "ילדים" (15 השנים האחרונות)
  // מתוך מאגר השפה הנוכחית, לפי מצב הכפתור.
  function activePool() {
    return kidsMode ? filterKids(songs) : songs;
  }

  function pickRandom() {
    var pool = activePool();

    // פחות מ-2 שירים בטווח בזמן שמצב "ילדים" דלוק שובר את מנגנון "לא לחזור
    // מיידית על השיר הקודם" (0 = אין מה לבחור, 1 = תמיד אותו שיר) — מוצגת
    // הודעה ברורה במקום מסך ריק/תקיעה (CAP-4).
    if (kidsMode && pool.length < 2) {
      render(null, { kidsEmpty: true });
      return;
    }
    if (pool.length === 0) {
      render(null);
      return;
    }
    if (pool.length === 1) {
      render(pool[0]);
      return;
    }
    var next;
    do {
      next = pool[Math.floor(Math.random() * pool.length)];
    } while (next === current);
    render(next);
  }

  function updateKidsButton() {
    if (!els.kidsBtn) return;
    els.kidsBtn.classList.toggle("active", kidsMode);
    els.kidsBtn.setAttribute("aria-pressed", kidsMode ? "true" : "false");
  }

  els.shuffle.addEventListener("click", function () {
    // מגן מפני לחיצות-בזק שיוצרות/הורסות כמה אייפריימים במקביל.
    if (pending) return;
    pending = true;
    pickRandom();
    window.setTimeout(function () { pending = false; }, 500);
  });

  if (els.kidsBtn) {
    els.kidsBtn.addEventListener("click", function () {
      kidsMode = !kidsMode;
      updateKidsButton();
      pickRandom();
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
    current = null;
    if (opts && opts.silent) return; // lang.js יזום render בעצמו (למשל showError)
    pickRandom();
  }

  window.MuzikaApp = {
    init: function (newSongs) { setSongs(newSongs); },
    reload: function (newSongs) { setSongs(newSongs); },
    showError: function () { render(null); }
  };
})();
