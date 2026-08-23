// share.js — כפתור "שתף עם חברים": Web Share API כשזמין (בעיקר נייד, פותח
// את תפריט השיתוף המובנה כולל וואטסאפ), אחרת העתקה ללוח, ואם גם זה נכשל —
// פתיחת שיתוף וואטסאפ ישירה כגיבוי אחרון. עצמאי לגמרי משאר הסקריפטים.
(function () {
  "use strict";

  var btn = document.getElementById("shareBtn");
  if (!btn) return;

  var defaultHTML = btn.innerHTML;
  var resetTimer = null;

  function shareText() {
    return "🎵 בואו לשחק איתי ב\"מי מזהה את השיר?\" — משחק זיהוי שירים לקבוצות!";
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
    var text = shareText();

    if (navigator.share) {
      navigator.share({ title: "מי מזהה את השיר?", text: text, url: url })
        .catch(function () { /* המשתמש ביטל את השיתוף — לא עושים כלום */ });
      return;
    }

    var fullText = text + " " + url;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText).then(
        function () { setTempLabel("<span aria-hidden=\"true\">✅</span> הקישור הועתק!"); },
        function () { openWhatsappFallback(fullText); }
      );
    } else {
      openWhatsappFallback(fullText);
    }
  });
})();
