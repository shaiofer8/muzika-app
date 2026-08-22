// app.js — לוגיקת המשחק: בחירה רנדומלית, תצוגה, ניגון YouTube.
(function () {
  "use strict";

  var rawSongs = Array.isArray(window.SONGS) ? window.SONGS : [];
  // מתעלם משורות פגומות (חסר שם שיר/אומן) כדי שרשומה שגויה ברשימה המודבקת לא תפיל את כל האתר.
  var songs = rawSongs.filter(function (s) {
    return s && typeof s.title === "string" && s.title.trim() &&
      typeof s.artist === "string" && s.artist.trim();
  });
  var current = null;
  var pending = false;

  var els = {
    title: document.getElementById("songTitle"),
    artist: document.getElementById("songArtist"),
    year: document.getElementById("songYear"),
    frame: document.getElementById("videoFrame"),
    shuffle: document.getElementById("shuffleBtn"),
    ytLink: document.getElementById("ytLink"),
    count: document.getElementById("songCount"),
    trackInfo: document.querySelector(".track-info")
  };

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
      els.title.textContent = "אין שירים תקינים במאגר";
      els.artist.textContent = "בדקו את songs.js";
      els.year.textContent = "—";
      els.frame.innerHTML = "";
      els.ytLink.hidden = true;
      return;
    }

    els.title.textContent = song.title;
    els.artist.textContent = song.artist;
    els.year.textContent = song.year || "שנה לא ידועה";

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

  els.count.textContent = songs.length + " שירים במאגר";
  pickRandom();
})();
