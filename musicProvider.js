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
      // enablejsapi=1 מאפשר שליטת postMessage בסיסית (pause/resume) בלי
      // לטעון את סקריפט ה-IFrame API המלא — מספיק לצרכי הממשק כאן.
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
    var mounted = false; // true בין play() ל-stop(), גם אם ה-iframe עצמו עוד בטעינה

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
        container.innerHTML = "";
        var iframe = document.createElement("iframe");
        iframe.src = embedSrc(song);
        iframe.title = (opts && opts.hideMetadata) ? "שיר מתנגן" : (song.title + " – " + song.artist);
        iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("loading", "lazy");
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
        if (container) container.innerHTML = "";
        frameEl = null;
        mounted = false;
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

      // best-effort בלבד — אין ערוץ postMessage נכנס (onStateChange) מוטמע
      // כאן, רק מה שאנחנו יודעים מקומית (יש/אין iframe מורכב כרגע).
      getPlaybackState: function () {
        return mounted ? "playing" : "stopped";
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
