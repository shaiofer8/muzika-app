// analytics.js — עטיפת אנליטיקס דקה (spec-analytics). עדיין בלי SDK אמיתי
// מחובר (זה דורש פרויקט Firebase/מזהה חשבון אמיתי מבעל החשבון) — track()
// הוא נקודת החיבור היחידה, כך שחיבור SDK בפועל בעתיד לא ידרוש לגעת בשום
// call-site אחר באפליקציה. עד אז: no-op שקט (לא שולח כלום החוצה), עם לוג
// דיבאג אופציונלי מאחורי window.MUZIKA_DEBUG_ANALYTICS.
//
// לא אוסף/שולח שום מידע מזהה אישית (CAP-3) — רק שמות אירועים + פרמטרים
// מספריים/enum שמוגדרים כאן.
(function () {
  "use strict";

  var sessionId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  var sessionStart = Date.now();
  var songsThisSession = 0;
  var finished = false;

  function send(name, params) {
    var payload = params || {};
    payload.session_id = sessionId;

    if (window.MUZIKA_DEBUG_ANALYTICS && window.console && console.log) {
      console.log("[analytics]", name, payload);
    }

    // נקודת חיבור עתידית ל-SDK אמיתי (למשל Firebase: gtag/firebase.analytics)
    // — no-op היום כי window.gtag לא קיים באתר.
    if (typeof window.gtag === "function") {
      window.gtag("event", name, payload);
    }
  }

  function track(name, params) {
    send(name, params);
  }

  // נקרא ע"י app.js בכל מעבר לשיר חדש כתוצאה מפעולת משתמש (הבא/שיר אחר),
  // כדי לחשב songs_per_session ב-session_finished.
  function songAdvanced() {
    songsThisSession += 1;
  }

  function finishSession() {
    if (finished) return; // מונע כפילות (visibilitychange + pagehide עלולים שניהם לירות)
    finished = true;
    send("session_finished", {
      songs_per_session: songsThisSession,
      session_duration_ms: Date.now() - sessionStart
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") finishSession();
  });
  window.addEventListener("pagehide", finishSession);

  window.MuzikaAnalytics = {
    track: track,
    songAdvanced: songAdvanced
  };
})();
