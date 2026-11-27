// Captions for the CAP-6 screenshot set, from the app's own i18n strings + the old "no sign-up" caption.
const fs = require("fs"), vm = require("vm");
const win = {}; vm.runInNewContext(fs.readFileSync(__dirname + "/../../i18n.js", "utf8"), { window: win });
const I = win.I18N, old = require("./old-store-captions.json");
// listing -> [app lang, old caption key]
const MAP = { "iw-IL": ["he", "he"], "en-US": ["en", "en-US"], "ar": ["ar", "ar"], "de-DE": ["de", "de-DE"], "es-ES": ["es", "es-ES"], "fr-FR": ["fr", "fr-FR"], "hi-IN": ["hi", "hi-IN"], "it-IT": ["it", "it-IT"], "ja-JP": ["ja", "ja-JP"], "ko-KR": ["ko", "ko-KR"], "pt-BR": ["pt", "pt-BR"], "ru-RU": ["ru", "ru-RU"], "tr-TR": ["tr", "tr-TR"], "vi": ["vi", "vi-VN"], "zh-CN": ["zh", "zh-TW"], "zh-TW": ["zh", "zh-TW"] };
const TW = { kicker: "兩隊對戰的派對遊戲", howto2Title: "主持人放歌，只有主持人看螢幕", howto3Title: "最先猜出歌名的隊伍得一分" };
const CN_NOSIGNUP = "无需注册，马上开始";
const out = {};
for (const [lst, [app, ok]] of Object.entries(MAP)) {
  const t = lst === "zh-TW" ? TW : I[app];
  const no = lst === "zh-CN" ? CN_NOSIGNUP : (old[ok] || [])[3];
  out[lst] = { app, caps: [t.kicker, t.howto2Title, t.howto3Title, no] };
  if (out[lst].caps.some((c) => !c)) console.log("MISSING", lst, out[lst].caps);
}
fs.writeFileSync(__dirname + "/store-captions-v3.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out["iw-IL"]), JSON.stringify(out["zh-TW"].caps[3]));
