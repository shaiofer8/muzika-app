// Song quality audit (spec-song-quality-audit): compare each active song with its YouTube video title.
// Usage: node audit.js <lang>   -> writes audit-<lang>.json next to this script and prints a summary.
const fs = require("fs"), path = require("path"), https = require("https");
fs.mkdirSync(require("path").join(__dirname, "work"), { recursive: true });
const { norm, classify } = require("../song-agent/match");
const lang = process.argv[2] || "he";
const ROOT = "C:/Users/shaio/muzika-app";
const KEY = fs.readFileSync("C:/Users/shaio/.muzika-youtube-key.txt", "utf8").trim();
const ENTRY = /\{ title: "((?:[^"\\]|\\.)*)", artist: "((?:[^"\\]|\\.)*)", year: (\d+)(?:, youtubeId: "([A-Za-z0-9_-]*)")?(?:, status: "([a-z_]+)", reason: "([^"]*)")? \}/g;
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res({ status: r.statusCode, body: d })); }).on("error", rej));

(async () => {
  const text = fs.readFileSync(path.join(ROOT, "songs", lang + ".js"), "utf8");
  const rows = [];
  text.replace(ENTRY, (raw, title, artist, year, id, status, reason) => { rows.push({ title, artist, year: +year, id: id || "", status, reason }); return raw; });
  const active = rows.filter((r) => r.id && !r.status);
  const meta = new Map();
  for (let i = 0; i < active.length; i += 50) {
    const ids = [...new Set(active.slice(i, i + 50).map((r) => r.id))];
    const r = await get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids.join(",")}&key=${KEY}`);
    if (r.status !== 200) throw new Error("videos API " + r.status);
    for (const v of JSON.parse(r.body).items || []) meta.set(v.id, { vt: v.snippet.title, ch: v.snippet.channelTitle, up: v.snippet.publishedAt.slice(0, 4) });
  }
  const idCount = {}, keyCount = {};
  active.forEach((r) => { idCount[r.id] = (idCount[r.id] || 0) + 1; const k = norm(r.title) + "|" + norm(r.artist); keyCount[k] = (keyCount[k] || 0) + 1; });
  const out = active.map((r) => {
    const m = meta.get(r.id) || { vt: "", ch: "", up: "" };
    const cat = classify(r, m);
    return { ...r, ...m, cat, lateYear: !!(m.up && +m.up < r.year), dupId: idCount[r.id] > 1, dupSong: keyCount[norm(r.title) + "|" + norm(r.artist)] > 1 };
  });
  fs.writeFileSync(path.join(__dirname, "work", `audit-${lang}.json`), JSON.stringify(out, null, 1));
  const counts = {};
  out.forEach((o) => { counts[o.cat] = (counts[o.cat] || 0) + 1; });
  console.log(lang, "active", active.length, JSON.stringify(counts), "lateYear", out.filter((o) => o.lateYear).length,
    "dupId", out.filter((o) => o.dupId).length, "dupSong", out.filter((o) => o.dupSong).length);
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
