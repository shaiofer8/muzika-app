// share.js — כפתור "שתף עם חברים": Web Share API כשזמין (בעיקר נייד, פותח
// את תפריט השיתוף המובנה כולל וואטסאפ), אחרת העתקה ללוח, ואם גם זה נכשל —
// פתיחת שיתוף וואטסאפ ישירה כגיבוי אחרון. עצמאי לגמרי משאר הסקריפטים.
(function () {
  "use strict";

  var btn = document.getElementById("shareBtn");
  if (!btn) return;

  var defaultHTML = btn.innerHTML;
  var resetTimer = null;

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

    if (navigator.share) {
      navigator.share({ title: t("title"), text: text, url: url })
        .catch(function () { /* המשתמש ביטל את השיתוף — לא עושים כלום */ });
      return;
    }

    var fullText = text + " " + url;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText).then(
        function () { setTempLabel("<span aria-hidden=\"true\">✅</span> " + t("shareCopied")); },
        function () { openWhatsappFallback(fullText); }
      );
    } else {
      openWhatsappFallback(fullText);
    }
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
