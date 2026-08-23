// score.js — פופאפ ניקוד קבוצות, עצמאי לגמרי מלוגיקת בחירת השירים ב-app.js.
(function () {
  "use strict";

  var STORAGE_KEY = "muzika-score-state-v1";
  var MIN_TEAMS = 1;
  var MAX_TEAMS = 12;

  var state = loadState() || { teamCount: 2, scores: [0, 0], names: [defaultName(0), defaultName(1)], configured: false };

  function defaultName(idx) {
    return "קבוצה " + (idx + 1);
  }

  // מוודא שמערך השמות מכסה בדיוק את מספר הקבוצות הנוכחי, בלי לדרוס שמות שכבר הוקלדו.
  function normalizeNames() {
    if (!Array.isArray(state.names)) state.names = [];
    for (var i = 0; i < state.teamCount; i++) {
      if (typeof state.names[i] !== "string") state.names[i] = defaultName(i);
    }
    state.names.length = state.teamCount;
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
    name.setAttribute("aria-label", "שם קבוצה " + (idx + 1));
    name.setAttribute("maxlength", "40");
    name.addEventListener("input", function () {
      state.names[idx] = name.value;
      saveState();
    });
    name.addEventListener("blur", function () {
      // אם השם נשאר ריק, חוזרים לברירת המחדל במקום להציג תווית ריקה.
      if (!name.value.trim()) {
        name.value = defaultName(idx);
        state.names[idx] = name.value;
        saveState();
      }
    });

    var controls = document.createElement("div");
    controls.className = "score-controls";

    var minus = document.createElement("button");
    minus.type = "button";
    minus.className = "score-btn minus";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "הורדת נקודה מקבוצה " + (idx + 1));
    minus.addEventListener("click", function () { changeScore(idx, -1); });

    var value = document.createElement("span");
    value.className = "score-value";
    value.textContent = state.scores[idx];

    var plus = document.createElement("button");
    plus.type = "button";
    plus.className = "score-btn plus";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "הוספת נקודה לקבוצה " + (idx + 1));
    plus.addEventListener("click", function () { changeScore(idx, 1); });

    controls.appendChild(minus);
    controls.appendChild(value);
    controls.appendChild(plus);
    row.appendChild(name);
    row.appendChild(controls);
    return row;
  }

  function changeScore(idx, delta) {
    var next = (state.scores[idx] || 0) + delta;
    if (next < 0) next = 0;
    state.scores[idx] = next;
    saveState();
    var valueEls = els.rows.querySelectorAll(".score-value");
    if (valueEls[idx]) valueEls[idx].textContent = next;
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
    if (state.configured) {
      showScoreboardStep();
    } else {
      showSetupStep();
    }
  }

  function closeModal() {
    els.overlay.hidden = true;
    document.body.classList.remove("modal-open");
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

  els.reconfigureBtn.addEventListener("click", function () {
    showSetupStep();
  });

  els.resetBtn.addEventListener("click", function () {
    for (var i = 0; i < state.scores.length; i++) state.scores[i] = 0;
    saveState();
    renderScoreboard();
  });

  renderStepper();
})();
