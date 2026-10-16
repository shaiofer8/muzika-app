// challenge.js — קישור אתגר: זרע (seed) בכתובת קובע את סדר השירים, כך שמי שנכנס
// לקישור מקבל את אותו רצף שירים כמו השולח. בלי זרע, המשחק רנדומלי כרגיל.
(function () {
  "use strict";

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var params = new URLSearchParams(window.location.search);
  var seedParam = params.get("seed");
  var seed = seedParam && /^\d{1,10}$/.test(seedParam) ? Number(seedParam) : null;

  if (seed !== null) {
    window.MuzikaRandom = mulberry32(seed);
  }

  function showBanner() {
    var banner = document.getElementById("challengeBanner");
    if (!banner) return;
    var lang = window.MuzikaLang && window.MuzikaLang.get();
    var text = window.MuzikaLang ? window.MuzikaLang.t("challengeBanner") : "";
    if (!text || text === "challengeBanner") return;
    banner.textContent = text;
    banner.hidden = false;
  }

  function makeLink() {
    var s = Math.floor(Math.random() * 1000000000) + 1;
    var lang = window.MuzikaLang && window.MuzikaLang.get();
    var url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("seed", String(s));
    if (lang) url.searchParams.set("lang", lang);
    return url.toString();
  }

  window.MuzikaChallenge = { isChallenge: seed !== null, showBanner: showBanner, makeLink: makeLink };
  if (seed !== null) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showBanner);
    else showBanner();
  }
})();
