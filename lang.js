// lang.js — בקר שפה: זוכר את הבחירה, טוען את קובץ מאגר השירים של השפה
// (songs/<code>.js, טעינה עצלה לפי דרישה), מחיל תרגומים על ה-DOM, מעדכן
// lang/dir ב-<html>, ובונה את תפריט בחירת השפה. רץ אחרי i18n.js/app.js/
// score.js/share.js — הם רק חושפים init/reload/refresh, הוא זה שמפעיל.
(function () {
  "use strict";

  // v3 holds only a language the player picked in the menu (spec-onboarding-clarity CAP-6).
  var STORAGE_KEY = "muzika-lang-v3";
  // v2 was also written automatically on the first visit, so "he" there is usually the old default.
  var LEGACY_KEY = "muzika-lang-v2";
  var DEFAULT_LANG = "he";
  var current = DEFAULT_LANG;
  var loading = {};

  function supported(code) {
    return !!(code && window.I18N && window.I18N[code]);
  }

  function normalize(tag) {
    var code = ((tag || "") + "").toLowerCase().split(/[-_]/)[0];
    return code === "iw" ? "he" : code; // older Android WebViews report Hebrew as "iw"
  }

  // The device language: the first supported language in the device's list, otherwise English.
  function browserLang() {
    var tags = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language];
    for (var i = 0; i < tags.length; i++) {
      var code = normalize(tags[i]);
      if (supported(code)) return code;
    }
    return "en";
  }

  function inIsrael() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Jerusalem"; } catch (e) { return false; }
  }

  function getSavedLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (supported(saved)) return saved;
      var legacy = localStorage.getItem(LEGACY_KEY);
      // A non-Hebrew legacy value was a real choice. Legacy Hebrew is kept only for players in Israel.
      if (supported(legacy) && (legacy !== "he" || inIsrael())) return legacy;
    } catch (e) { /* localStorage חסום — פשוט מתחילים משפת המכשיר */ }
    return browserLang();
  }

  function saveLang(code) {
    try { localStorage.setItem(STORAGE_KEY, code); } catch (e) { /* לא קריטי */ }
  }

  function langInfo(code) {
    var list = window.LANGS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].code === code) return list[i];
    }
    return list[0] || { code: DEFAULT_LANG, name: "עברית", flag: "🇮🇱", dir: "rtl" };
  }

  function t(key) {
    var dict = (window.I18N && window.I18N[current]) || {};
    var fallback = (window.I18N && window.I18N[DEFAULT_LANG]) || {};
    return dict[key] || fallback[key] || key;
  }

  function applyTranslations() {
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    }
    var ariaNodes = document.querySelectorAll("[data-i18n-aria]");
    for (var j = 0; j < ariaNodes.length; j++) {
      ariaNodes[j].setAttribute("aria-label", t(ariaNodes[j].getAttribute("data-i18n-aria")));
    }
    document.title = t("docTitle");
  }

  function applyDirLang(code) {
    var info = langInfo(code);
    document.documentElement.setAttribute("lang", code);
    document.documentElement.setAttribute("dir", info.dir);
  }

  function updateLangButton(code) {
    var info = langInfo(code);
    var flagEl = document.getElementById("langFlag");
    var nameEl = document.getElementById("langName");
    var openBtn = document.getElementById("langOpenBtn");
    if (flagEl) flagEl.textContent = info.flag;
    if (nameEl) nameEl.textContent = info.name;
    if (openBtn) openBtn.setAttribute("aria-label", info.name);
    var grid = document.getElementById("langGrid");
    if (grid) {
      var btns = grid.querySelectorAll(".lang-option");
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("active", btns[i].getAttribute("data-code") === code);
      }
    }
  }

  // Only songs with a verified YouTube id are played. Songs without one fall back to
  // a search embed, which YouTube no longer serves ("This video is unavailable").
  function onlyVerified(code, list) {
    if (!list) return list;
    return list.filter(function (s) { return !!s.youtubeId && s.status !== "disabled"; });
  }

  function loadSongs(code, cb) {
    if (window.SONGS_BY_LANG && window.SONGS_BY_LANG[code]) {
      cb(onlyVerified(code, window.SONGS_BY_LANG[code]));
      return;
    }
    if (loading[code]) {
      loading[code].push(cb);
      return;
    }
    loading[code] = [cb];
    var script = document.createElement("script");
    script.src = "songs/" + code + ".js";
    function done(result) {
      var callbacks = loading[code] || [];
      delete loading[code];
      for (var i = 0; i < callbacks.length; i++) callbacks[i](result);
    }
    script.onload = function () {
      done(onlyVerified(code, (window.SONGS_BY_LANG && window.SONGS_BY_LANG[code]) || null));
    };
    script.onerror = function () {
      done(null);
    };
    document.head.appendChild(script);
  }

  var langRequest = 0;
  function setLang(code, opts) {
    opts = opts || {};
    if (!langInfo(code)) return;
    var requestId = ++langRequest;
    current = code;
    if (!opts.initial) saveLang(code); // only a choice from the menu is remembered
    applyDirLang(code);
    applyTranslations();
    updateLangButton(code);

    loadSongs(code, function (songs) {
      if (requestId !== langRequest) return;
      if (!songs || !songs.length) {
        if (window.MuzikaApp) window.MuzikaApp.showError();
      } else if (opts.initial && window.MuzikaApp) {
        window.MuzikaApp.init(songs);
      } else if (window.MuzikaApp) {
        window.MuzikaApp.reload(songs);
      }
      if (window.MuzikaScore) window.MuzikaScore.refresh();
      if (window.MuzikaShare) window.MuzikaShare.refresh();
    });
  }

  // ---------------------------------------------------------------------
  // תפריט בחירת שפה
  // ---------------------------------------------------------------------
  function buildLangGrid() {
    var grid = document.getElementById("langGrid");
    if (!grid) return;
    var list = window.LANGS || [];
    for (var i = 0; i < list.length; i++) {
      (function (lang) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lang-option";
        btn.setAttribute("data-code", lang.code);
        btn.innerHTML = '<span class="lang-flag" aria-hidden="true">' + lang.flag + '</span><span class="lang-label">' + lang.name + '</span>';
        btn.addEventListener("click", function () {
          closeLangModal();
          if (lang.code !== current) setLang(lang.code);
        });
        grid.appendChild(btn);
      })(list[i]);
    }
  }

  var langOverlay = document.getElementById("langOverlay");
  var langOpenBtn = document.getElementById("langOpenBtn");
  var langCloseBtn = document.getElementById("langCloseBtn");

  function openLangModal() {
    if (!langOverlay) return;
    langOverlay.hidden = false;
    document.body.classList.add("modal-open");
  }
  function closeLangModal() {
    if (!langOverlay) return;
    langOverlay.hidden = true;
    document.body.classList.remove("modal-open");
  }

  if (langOpenBtn) langOpenBtn.addEventListener("click", openLangModal);
  if (langCloseBtn) langCloseBtn.addEventListener("click", closeLangModal);
  if (langOverlay) {
    langOverlay.addEventListener("click", function (e) {
      if (e.target === langOverlay) closeLangModal();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && langOverlay && !langOverlay.hidden) closeLangModal();
  });

  window.MuzikaLang = { t: t, get: function () { return current; }, set: setLang };

  buildLangGrid();
  setLang(getSavedLang(), { initial: true });
})();
