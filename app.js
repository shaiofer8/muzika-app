// app.js — לוגיקת המשחק: בחירה רנדומלית, תצוגה, ניגון YouTube.
// מופעל ע"י lang.js (MuzikaApp.init עם רשימת השירים של השפה הנוכחית),
// לא רץ אוטומטית עם טעינת הסקריפט — כדי לחכות לבחירת שפה/מאגר שירים.
(function () {
  "use strict";

  var current = null;
  var pending = false;
  var songs = [];

  var els = {
    title: document.getElementById("songTitle"),
    artist: document.getElementById("songArtist"),
    year: document.getElementById("songYear"),
    frame: document.getElementById("videoFrame"),
    shuffle: document.getElementById("shuffleBtn"),
    ytLink: document.getElementById("ytLink"),
    trackInfo: document.querySelector(".track-info")
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

  function render(song) {
    current = song;
    replayPopAnimation();

    if (!song) {
      els.title.textContent = t("noSongs");
      els.artist.textContent = t("tryRefresh");
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

  function pickRandom() {
    if (songs.length === 0) {
      render(null);
      return;
    }
    if (songs.length === 1) {
      render(songs[0]);
      return;
    }
    var next;
    do {
      next = songs[Math.floor(Math.random() * songs.length)];
    } while (next === current);
    render(next);
  }

  els.shuffle.addEventListener("click", function () {
    // מגן מפני לחיצות-בזק שיוצרות/הורסות כמה אייפריימים במקביל.
    if (pending) return;
    pending = true;
    pickRandom();
    window.setTimeout(function () { pending = false; }, 500);
  });

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
