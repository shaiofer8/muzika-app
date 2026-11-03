// share.js — כפתור "שתף עם חברים": Web Share API כשזמין (בעיקר נייד, פותח
// את תפריט השיתוף המובנה כולל וואטסאפ), אחרת העתקה ללוח, ואם גם זה נכשל —
// פתיחת שיתוף וואטסאפ ישירה כגיבוי אחרון. עצמאי לגמרי משאר הסקריפטים.
(function () {
  "use strict";

  var btn = document.getElementById("shareBtn");
  if (!btn) return;

  var defaultHTML = btn.innerHTML;
  var resetTimer = null;

  function track(name, params) {
    if (window.MuzikaAnalytics) window.MuzikaAnalytics.track(name, params);
  }

  function t(key) {
    return (window.MuzikaLang && window.MuzikaLang.t(key)) || key;
  }

  function setTempLabel(html) {
    window.clearTimeout(resetTimer);
    btn.innerHTML = html;
    btn.disabled = true;
    resetTimer = window.setTimeout(function () {
      btn.innerHTML = defaultHTML;
      btn.disabled = false;
    }, 2200);
  }

  function openWhatsappFallback(text) {
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
  }

  btn.addEventListener("click", function () {
    var url = window.location.href;
    var text = t("shareText");

    track("share_clicked");

    // Open WhatsApp directly, with a message that includes the store download link.
    var downloadUrl = "https://play.google.com/store/apps/details?id=com.muzikaparty.app";
    var msg = "מכיר את המשחק הזה במסיבות? מנגנים שיר ומנחשים את השם והאמן. חינם, בלי הרשמה: " + downloadUrl;
    track("share_completed", { method: "whatsapp" });
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank", "noopener");
    return;

    // No native share sheet: open WhatsApp with the text and link ready to send.
    var fullText = text + " " + url;
    openWhatsappFallback(fullText);
  });

  // ---------------------------------------------------------------------
  // API ל-lang.js: אחרי שה-DOM של הכפתור עודכן לשפה החדשה, מרעננים את
  // ה-HTML המוגן (ל"חזרה אחרי הודעת הצלחה") כדי שלא יישאר תקוע בשפה הישנה.
  // ---------------------------------------------------------------------
  window.MuzikaShare = {
    refresh: function () {
      if (!btn.disabled) defaultHTML = btn.innerHTML;
    }
  };
})();
