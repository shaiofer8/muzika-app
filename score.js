// score.js — פופאפ ניקוד קבוצות, עצמאי לגמרי מלוגיקת בחירת השירים ב-app.js.
(function () {
  "use strict";

  var STORAGE_KEY = "muzika-score-state-v1";
  var MIN_TEAMS = 1;
  var MAX_TEAMS = 12;

  var state = loadState() || { teamCount: 2, scores: [0, 0], names: [defaultName(0), defaultName(1)], customNames: [false, false], configured: false };
  if (!Array.isArray(state.customNames)) state.customNames = state.names.map(function () { return false; });

  function t(key) {
    return (window.MuzikaLang && window.MuzikaLang.t(key)) || key;
  }

  function defaultName(idx) {
    return t("teamNamePrefix") + " " + (idx + 1);
  }

  // מוודא שמערך השמות מכסה בדיוק את מספר הקבוצות הנוכחית, בלי לדרוס שמות שכבר הוקלדו.
  function normalizeNames() {
    if (!Array.isArray(state.names)) state.names = [];
    if (!Array.isArray(state.customNames)) state.customNames = [];
    for (var i = 0; i < state.teamCount; i++) {
      if (typeof state.names[i] !== "string") state.names[i] = defaultName(i);
      if (typeof state.customNames[i] !== "boolean") state.customNames[i] = false;
    }
    state.names.length = state.teamCount;
    state.customNames.length = state.teamCount;
  }

  var els = {
    fab: document.getElementById("scoreOpenBtn"),
    overlay: document.getElementById("scoreOverlay"),
    closeBtn: document.getElementById("scoreCloseBtn"),
    setup: document.getElementById("scoreSetup"),
    teamCountValue: document.getElementById("teamCountValue"),
    minusBtn: document.getElementById("teamCountMinus"),
    plusBtn: document.getElementById("teamCountPlus"),
    startBtn: document.getElementById("startScoringBtn"),
    scoreboard: document.getElementById("scoreboard"),
    rows: document.getElementById("scoreRows"),
    reconfigureBtn: document.getElementById("reconfigureBtn"),
    resetBtn: document.getElementById("resetScoresBtn")
  };

  // אם מבנה ה-DOM חסר (למשל מישהו ערך את index.html) — לא מפילים את שאר האתר.
  var required = [els.fab, els.overlay, els.closeBtn, els.setup, els.teamCountValue,
    els.minusBtn, els.plusBtn, els.startBtn, els.scoreboard, els.rows,
    els.reconfigureBtn, els.resetBtn];
  if (required.indexOf(null) !== -1 || required.indexOf(undefined) !== -1) return;

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.teamCount !== "number" || !Array.isArray(parsed.scores)) return null;
      return parsed;
    } catch (e) {
      return null; // localStorage לא זמין (למשל דפדפן פרטי חוסם) — פשוט מתחילים מברירת מחדל
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* לא קריטי — הניקוד פשוט לא ישרוד רענון */
    }
  }

  function clampTeamCount(n) {
    return Math.min(MAX_TEAMS, Math.max(MIN_TEAMS, n));
  }

  function renderStepper() {
    els.teamCountValue.textContent = state.teamCount;
  }

  function renderScoreboard() {
    normalizeNames();
    els.rows.innerHTML = "";
    for (var i = 0; i < state.teamCount; i++) {
      els.rows.appendChild(buildScoreRow(i));
    }
  }

  function buildScoreRow(idx) {
    var row = document.createElement("div");
    row.className = "score-row";

    var name = document.createElement("input");
    name.type = "text";
    name.className = "team-name-input";
    name.value = state.names[idx];
    name.setAttribute("aria-label", t("teamNameAriaPrefix") + " " + (idx + 1));
    name.setAttribute("maxlength", "40");
    name.addEventListener("input", function () {
      state.names[idx] = name.value;
      state.customNames[idx] = true;
      saveState();
    });
    name.addEventListener("blur", function () {
      // אם השם נשאר ריק, חוזרים לברירת המחדל במקום להציג תווית ריקה.
      if (!name.value.trim()) {
        name.value = defaultName(idx);
        state.names[idx] = name.value;
        state.customNames[idx] = false;
        saveState();
      }
    });

    var controls = document.createElement("div");
    controls.className = "score-controls";

    var minus = document.createElement("button");
    minus.type = "button";
    minus.className = "score-btn minus";
    minus.textContent = "−";
    minus.setAttribute("aria-label", t("teamMinusAriaPrefix") + " " + (idx + 1));
    minus.addEventListener("click", function () { changeScore(idx, -1); });

    var value = document.createElement("span");
    value.className = "score-value";
    value.textContent = state.scores[idx];

    var plus = document.createElement("button");
    plus.type = "button";
    plus.className = "score-btn plus";
    plus.textContent = "+";
    plus.setAttribute("aria-label", t("teamPlusAriaPrefix") + " " + (idx + 1));
    plus.addEventListener("click", function () { changeScore(idx, 1); });

    controls.appendChild(minus);
    controls.appendChild(value);
    controls.appendChild(plus);
    row.appendChild(name);
    row.appendChild(controls);
    return row;
  }

  function changeScore(idx, delta, source) {
    var next = (state.scores[idx] || 0) + delta;
    if (next < 0) next = 0;
    state.scores[idx] = next;
    saveState();
    var valueEls = els.rows.querySelectorAll(".score-value");
    if (valueEls[idx]) valueEls[idx].textContent = next;
    renderBar();
    if (delta > 0 && window.MuzikaAnalytics) window.MuzikaAnalytics.track("team_point", { source: source || "popup", teams: state.teamCount });
  }

  // spec-two-team-clarity CAP-1: the team bar on the main screen. 2-3 teams get a chip each with "+1";
  // 4 or more get one button that opens the score popup.
  var bar = document.getElementById("teamBar");
  function renderBar() {
    if (!bar) return;
    normalizeNames();
    bar.textContent = "";
    var n = state.teamCount;
    if (n > 3) {
      bar.className = "team-bar team-bar--many";
      var more = document.createElement("button");
      more.type = "button";
      more.className = "team-bar-more";
      more.textContent = "🏆 " + t("teamsMore").replace("{n}", n);
      more.addEventListener("click", openModal);
      bar.appendChild(more);
      return;
    }
    bar.className = "team-bar team-bar--" + n;
    for (var i = 0; i < n; i++) {
      if (i > 0 && n === 2) {
        var vs = document.createElement("span");
        vs.className = "team-vs";
        vs.setAttribute("aria-hidden", "true");
        vs.textContent = "VS";
        bar.appendChild(vs);
      }
      bar.appendChild(buildChip(i));
    }
    fitNames();
  }

  // Narrow screens: shrink each team name gradually (14px down to 10px); only then does the CSS ellipsis apply.
  function fitNames() {
    if (!bar) return;
    var names = bar.querySelectorAll(".team-chip-name");
    for (var i = 0; i < names.length; i++) {
      var el = names[i];
      var size = 14;
      el.style.fontSize = size + "px";
      while (size > 10 && el.scrollWidth > el.clientWidth) {
        size -= 0.5;
        el.style.fontSize = size + "px";
      }
    }
  }
  window.addEventListener("resize", fitNames);
  window.addEventListener("load", fitNames);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);

  function buildChip(idx) {
    var chip = document.createElement("div");
    chip.className = "team-chip team-chip--" + idx;
    var info = document.createElement("button");
    info.type = "button";
    info.className = "team-chip-info";
    var name = document.createElement("span");
    name.className = "team-chip-name";
    name.textContent = state.names[idx];
    var score = document.createElement("span");
    score.className = "team-chip-score";
    score.textContent = state.scores[idx] || 0;
    info.appendChild(name);
    info.appendChild(score);
    info.addEventListener("click", openModal);
    var plus = document.createElement("button");
    plus.type = "button";
    plus.className = "team-chip-plus";
    plus.textContent = "+1";
    plus.dir = "ltr";
    plus.setAttribute("aria-label", t("teamPlusAriaPrefix") + " " + state.names[idx]);
    plus.addEventListener("click", function () {
      if (!state.configured) {
        state.configured = true;
        state.scores = state.scores.slice(0, state.teamCount);
      }
      changeScore(idx, 1, "bar");
      var s = bar.querySelectorAll(".team-chip-score")[idx];
      if (s) { s.classList.remove("bump"); void s.offsetWidth; s.classList.add("bump"); }
    });
    chip.appendChild(info);
    chip.appendChild(plus);
    return chip;
  }

  // Draws a 1080x1350 result card: teams, scores, and the challenge link. Returns a PNG Blob.
  function buildScoreCard(link) {
    return new Promise(function (resolve) {
      var canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      var ctx = canvas.getContext("2d");
      var grad = ctx.createLinearGradient(0, 0, 1080, 1350);
      grad.addColorStop(0, "#2a1763");
      grad.addColorStop(1, "#090d19");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1350);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f5f7ff";
      ctx.font = "bold 96px sans-serif";
      ctx.fillText("Muzika Party", 540, 200);
      var rowTop = 340;
      state.names.forEach(function (name, i) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(120, rowTop + i * 150, 840, 120);
        ctx.fillStyle = "#f5f7ff";
        ctx.font = "600 56px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(name, 900, rowTop + i * 150 + 76);
        ctx.textAlign = "left";
        ctx.fillStyle = "#c3b1ff";
        ctx.font = "bold 72px sans-serif";
        ctx.fillText(String(state.scores[i]), 180, rowTop + i * 150 + 80);
      });
      ctx.textAlign = "center";
      ctx.fillStyle = "#bdc8df";
      ctx.font = "44px sans-serif";
      ctx.fillText(link.replace(/^https?:\/\//, "").slice(0, 60), 540, 1250);
      canvas.toBlob(function (blob) { resolve(blob); }, "image/png");
    });
  }

  function shareScore() {
    var lines = state.names.map(function (name, i) { return name + ": " + state.scores[i]; });
    var link = window.MuzikaChallenge ? window.MuzikaChallenge.makeLink() : window.location.href;
    var message = t("shareText") + "\n" + lines.join("\n") + "\n" + link;
    var track = function (name, params) { if (window.MuzikaAnalytics) window.MuzikaAnalytics.track(name, params); };
    track("share_clicked", { source: "score" });
    if (navigator.share) {
      buildScoreCard(link).then(function (blob) {
        var file = blob && typeof File === "function" ? new File([blob], "muzika-score.png", { type: "image/png" }) : null;
        var payload = { text: message };
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) payload.files = [file];
        return navigator.share(payload);
      }).then(function () { track("share_completed", { method: "native", source: "score" }); }, function () {});
      return;
    }
    // No native share sheet: open WhatsApp with the result and challenge link ready to send.
    window.open("https://wa.me/?text=" + encodeURIComponent(message), "_blank", "noopener");
    track("share_completed", { method: "whatsapp", source: "score" });
  }

  function showSetupStep() {
    els.setup.hidden = false;
    els.scoreboard.hidden = true;
    renderStepper();
  }

  function showScoreboardStep() {
    els.setup.hidden = true;
    els.scoreboard.hidden = false;
    renderScoreboard();
  }

  function openModal() {
    els.overlay.hidden = false;
    document.body.classList.add("modal-open");
    if (window.MuzikaAds) window.MuzikaAds.show();
    if (state.configured) {
      showScoreboardStep();
    } else {
      showSetupStep();
    }
  }

  function closeModal() {
    renderBar();
    els.overlay.hidden = true;
    document.body.classList.remove("modal-open");
    if (window.MuzikaAds) window.MuzikaAds.hide();
  }

  els.fab.addEventListener("click", openModal);
  els.closeBtn.addEventListener("click", closeModal);
  els.overlay.addEventListener("click", function (e) {
    if (e.target === els.overlay) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.overlay.hidden) closeModal();
  });

  els.minusBtn.addEventListener("click", function () {
    state.teamCount = clampTeamCount(state.teamCount - 1);
    renderStepper();
  });
  els.plusBtn.addEventListener("click", function () {
    state.teamCount = clampTeamCount(state.teamCount + 1);
    renderStepper();
  });

  els.startBtn.addEventListener("click", function () {
    // מתאים את מערך הניקוד לכמות הקבוצות הנוכחית — שומר ניקוד קיים לקבוצות שנשארות.
    var next = [];
    for (var i = 0; i < state.teamCount; i++) {
      next.push(state.scores[i] || 0);
    }
    state.scores = next;
    state.configured = true;
    saveState();
    showScoreboardStep();
  });

  document.getElementById("shareScoreBtn").addEventListener("click", shareScore);

  els.reconfigureBtn.addEventListener("click", function () {
    showSetupStep();
  });

  els.resetBtn.addEventListener("click", function () {
    if (!window.confirm(t("resetConfirm"))) return;
    for (var i = 0; i < state.scores.length; i++) state.scores[i] = 0;
    saveState();
    renderScoreboard();
    renderBar();
  });

  renderStepper();
  renderBar();

  // ---------------------------------------------------------------------
  // API ל-lang.js: מרענן תוויות (שמות ברירת-מחדל/aria) בהחלפת שפה, בלי
  // לגעת בשמות שהוקלדו ידנית או באיפוס הניקוד.
  // ---------------------------------------------------------------------
  window.MuzikaScore = {
    open: function () { openModal(); },
    refresh: function () {
      for (var i = 0; i < state.names.length; i++) {
        if (!state.customNames[i]) state.names[i] = defaultName(i);
      }
      saveState();
      renderBar();
      if (!els.overlay.hidden) {
        if (state.configured) renderScoreboard(); else renderStepper();
      }
    }
  };
})();
