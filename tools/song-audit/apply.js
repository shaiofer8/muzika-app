// Apply reviewed decisions to songs/<lang>.js (spec-song-quality-audit).
// decisions-<lang>.json: [{ match:{title,artist,id}, set:{title?,artist?,year?,id?}, disable?: "title_mismatch"|"duplicate" }]
// Also lowers every "ok" song's year to its video upload year when the listed year is later (impossible).
const fs = require("fs"), path = require("path"), cp = require("child_process");
const lang = process.argv[2] || "he";
const FILE = `C:/Users/shaio/muzika-app/songs/${lang}.js`;
const ENTRY = /\{ title: "((?:[^"\\]|\\.)*)", artist: "((?:[^"\\]|\\.)*)", year: (\d+)(?:, youtubeId: "([A-Za-z0-9_-]*)")?(?:, status: "([a-z_]+)", reason: "([^"]*)")? \}/g;
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const decisions = JSON.parse(fs.readFileSync(path.join(__dirname, "work", `decisions-${lang}.json`), "utf8"));
const audit = JSON.parse(fs.readFileSync(path.join(__dirname, "work", `audit-${lang}.json`), "utf8"));
const upYear = new Map(audit.filter((o) => o.cat === "ok" && o.lateYear).map((o) => [`${o.title}|${o.artist}|${o.id}`, +o.up]));
const used = new Set();
let changed = 0, disabled = 0, years = 0;
const text = fs.readFileSync(FILE, "utf8").replace(ENTRY, (raw, title, artist, year, id, status, reason) => {
  if (status) return raw;
  const key = `${title}|${artist}|${id || ""}`;
  const d = decisions.find((x) => `${x.match.title}|${x.match.artist}|${x.match.id}` === key);
  let t = title, a = artist, y = +year, v = id || "", st = null;
  if (d) {
    used.add(d);
    if (d.disable) { st = d.disable; disabled++; }
    else { t = d.set.title ?? t; a = d.set.artist ?? a; y = d.set.year ?? y; v = d.set.id ?? v; changed++; }
  } else if (upYear.has(key)) { y = upYear.get(key); years++; }
  else return raw;
  let s = `{ title: "${d && d.set && d.set.title ? esc(t) : t}", artist: "${d && d.set && d.set.artist ? esc(a) : a}", year: ${y}`;
  if (v) s += `, youtubeId: "${v}"`;
  if (st) s += `, status: "disabled", reason: "${st}"`;
  return s + " }";
});
const missing = decisions.filter((d) => !used.has(d));
if (missing.length) { console.log("NOT FOUND:", missing.map((m) => m.match.title).join(", ")); process.exit(1); }
fs.writeFileSync(FILE, text, "utf8");
cp.execSync(`node --check "${FILE}"`);
console.log(lang, "fixed", changed, "disabled", disabled, "yearsLowered", years);
