// musicProvider.js — שכבת Music Provider (spec-music-provider-abstraction).
// מפרידה בין לוגיקת המשחק (app.js) לפרטי הספק (YouTube embed) מאחורי ממשק
// אחיד: mount/play/updateTitle/stop/preload/getPlaybackState. app.js לא
// בונה יותר URL של youtube.com בעצמו — קורא רק לממשק הזה.
//
// מימוש יחיד בגרסה זו: YouTubeProvider, שעוטף בדיוק את לוגיקת ה-iframe
// שהייתה קודם בתוך app.js. ספק שני (Spotify/Apple Music/קובץ מקומי) לא
// נבנה כאן — רק התפר שמאפשר זאת בעתיד בלי לשכתב את app.js.
(function () {
  "use strict";

  // שדות provider/providerTrackId הם ה-API העתידי (SPEC-smart-shuffle-engine
  // §9); עד שלמאגרי השירים יתווספו, נופלים חזרה ל-youtubeId הקיים בכל
  // רשומה כדי לא לשבור אף קובץ songs/*.js קיים.
  function trackId(song) {
    return song.providerTrackId || song.youtubeId || "";
  }

  function searchQuery(song) {
    return song.artist + " " + song.title;
  }

  function embedSrc(song) {
    var id = trackId(song);
    if (id) {
      // enablejsapi=1 מאפשר תקשורת postMessage עם YouTube IFrame API —
      // בלי לטעון את סקריפט ה-API המלא. נדרש כדי לקבל onError / onStateChange.
      return "https://www.youtube.com/embed/" + encodeURIComponent(id) +
        "?autoplay=1&rel=0&enablejsapi=1";
    }
    return "https://www.youtube.com/embed/videoseries?listType=search&list=" +
      encodeURIComponent(searchQuery(song)) + "&autoplay=1&rel=0";
  }

  function postCommand(iframe, func) {
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: func, args: [] }), "*"
      );
    } catch (e) { /* לא קריטי — הנגן פשוט ימשיך במצבו הנוכחי */ }
  }

  // שולח ל-YouTube הודעת "listening" כך שיתחיל לשדר events (onError, onStateChange).
  // חייב להיקרא רק לאחר שה-iframe עלה (onload) — לפני כן contentWindow עדיין לא קיים.
  function sendListening(iframe) {
    try {
      iframe.contentWindow.postMessage(JSON.stringify({ event: "listening" }), "*");
    } catch (e) {}
  }

  var preconnected = false;
  function ensurePreconnect() {
    if (preconnected) return;
    preconnected = true;
    ["https://www.youtube.com", "https://i.ytimg.com"].forEach(function (href) {
      var link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      link.crossOrigin = "";
      document.head.appendChild(link);
    });
  }

  function createYouTubeProvider() {
    var container = null;
    var frameEl = null;
    var mounted = false;   // true בין play() ל-stop()
    var isPlaying = false; // true כשקיבלנו onStateChange:1 (ניגון התחיל)
    var fallbackTimer = null;
    var currentSong = null;

    // FALLBACK_MS: אם ה-iframe נטען אך הניגון לא התחיל תוך זמן זה,
    // עוברים ל-search mode לאותו שיר (במקום הסרטון הספציפי).
    // 10 שניות מספיק גם לרשת איטית, אך לא גורם לעיכוב מורגש.
    var FALLBACK_MS = 10000;

    function clearFallbackTimer() {
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    }

    // fallback: מנסה לטעון את אותו שיר דרך חיפוש (ולא ID ישיר).
    // רלוונטי רק כשנטענו עם ID ישיר וה-timeout פג בלי שהניגון התחיל.
    function trySearchFallback(song) {
      if (!container || !mounted) return;
      var songWithoutId = { title: song.title, artist: song.artist, year: song.year };
      container.innerHTML = "";
      var iframe = document.createElement("iframe");
      iframe.src = embedSrc(songWithoutId); // ← בלי youtubeId = נפנה לחיפוש
      iframe.title = "שיר מתנגן";
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "lazy");
      container.appendChild(iframe);
      frameEl = iframe;
      // לא מוסיפים טיימר נוסף על ה-fallback עצמו — search mode פחות סביר לכשל
    }

    // מאזין גלובלי יחיד לאירועי YouTube IFrame API.
    // בודקים evt.origin (ולא evt.source!) — השוואת source לא אמינה ב-cross-origin.
    var listenerAdded = false;
    function ensureListener() {
      if (listenerAdded) return;
      listenerAdded = true;
      window.addEventListener("message", function (evt) {
        // פילטר: רק הודעות מיוטיוב
        if (!evt.origin || evt.origin.indexOf("youtube.com") < 0) return;
        if (!frameEl || typeof evt.data !== "string") return;
        var data;
        try { data = JSON.parse(evt.data); } catch (e) { return; }
        if (!data) return;

        if (data.event === "onStateChange") {
          if (data.info === 1) {
            // ניגון התחיל — מבטלים fallback timer
            isPlaying = true;
            clearFallbackTimer();
          }
        } else if (data.event === "onError") {
          // 100 = סרטון לא קיים/הוסר, 101/150 = הטמעה חסומה ע"י הבעלים
          if (data.info === 100 || data.info === 101 || data.info === 150) {
            clearFallbackTimer();
            window.dispatchEvent(new CustomEvent("muzika:videoUnavailable"));
          }
        }
      }, false);
    }

    return {
      name: "youtube",

      mount: function (containerEl) {
        container = containerEl;
      },

      // בונה iframe חדש מהיסוד (לא רק מחליף src) — כמו קודם, כדי לשמור על
      // autoplay אמין בין דפדפנים (CAP-3 של spec-song-shuffle).
      // opts.hideMetadata=true מציב title גנרי על ה-iframe בזמן שלב ההאזנה
      // (spec-reveal-flow CAP-1) — updateTitle() מחליף אותו אחרי חשיפה.
      play: function (song, opts) {
        if (!container) return;
        ensureListener();
        clearFallbackTimer();
        isPlaying = false;
        currentSong = song;
        container.innerHTML = "";
        var iframe = document.createElement("iframe");
        iframe.src = embedSrc(song);
        iframe.title = (opts && opts.hideMetadata) ? "שיר מתנגן" : (song.title + " – " + song.artist);
        iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("loading", "lazy");

        // לאחר שה-iframe עלה: (1) שלח "listening" ליוטיוב כדי לקבל events,
        // (2) הפעל טיימר — אם הניגון לא התחיל תוך FALLBACK_MS, עבור ל-search mode.
        var capturedSong = song;
        iframe.addEventListener("load", function () {
          sendListening(iframe);
          if (trackId(capturedSong)) { // רק אם נטענו עם ID ישיר (לא search)
            clearFallbackTimer();
            fallbackTimer = setTimeout(function () {
              fallbackTimer = null;
              if (!isPlaying && mounted && frameEl === iframe) {
                trySearchFallback(capturedSong);
              }
            }, FALLBACK_MS);
          }
        });

        container.appendChild(iframe);
        frameEl = iframe;
        mounted = true;
      },

      updateTitle: function (song) {
        if (frameEl) frameEl.title = song.title + " – " + song.artist;
      },

      pause: function () { postCommand(frameEl, "pauseVideo"); },
      resume: function () { postCommand(frameEl, "playVideo"); },

      stop: function () {
        clearFallbackTimer();
        if (container) container.innerHTML = "";
        frameEl = null;
        mounted = false;
        isPlaying = false;
        currentSong = null;
      },

      // preload: אין דרך אמיתית "לטעון מראש" iframe של YouTube בלי להריץ
      // אותו בפועל — לכן זה best-effort: preconnect ל-domains הרלוונטיים +
      // prefetch לתמונה הממוזערת, כדי שהרשת כבר "חמה" כשה-iframe הבא נבנה.
      // עובד רק לשירים עם providerTrackId/youtubeId ידוע (לא לנפילת חיפוש).
      preload: function (song) {
        var id = song && trackId(song);
        if (!id) return;
        ensurePreconnect();
        var img = new Image();
        img.src = "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg";
      },

      getPlaybackState: function () {
        return (mounted && isPlaying) ? "playing" : mounted ? "loading" : "stopped";
      }
    };
  }

  window.MuzikaMusicProvider = {
    // בגרסה זו יש ספק אחד בלבד; הפרמטר קיים כדי שקוד קורא (app.js) לא
    // יצטרך להשתנות ביום שיתווסף ספק שני אמיתי.
    create: function (providerName) {
      return createYouTubeProvider();
    }
  };
})();
