// spec-song-quality-audit CAP-4: add NEW songs to a language pack. Candidates come from
// work/new-<lang>.txt (one "title|artist|year" per line). A candidate is skipped when the pack
// already has that title by that artist. The rest go through the same check as resolve.js: an exact
// title+artist video found with yt-dlp, public, embeddable, not blocked in Israel, not already used.
// Only verified songs are written (appended to the end of the pack). Usage: node add.js <lang>
const fs = require("fs"), path = require("path"), cp = require("child_process"), https = require("https");
const { norm, artists, classify } = require("../song-agent/match");
const lang = process.argv[2];
const FILE = path.join(__dirname, "..", "..", "songs", `${lang}.js`);
const SRC = path.join(__dirname, "work", `new-${lang}.txt`);
const KEY = fs.readFileSync("C:/Users/shaio/.muzika-youtube-key.txt", "utf8").trim();
const ENTRY = /\{ title: "((?:[^"\\]|\\.)*)", artist: "((?:[^"\\]|\\.)*)", year: (\d+)(?:, youtubeId: "([A-Za-z0-9_-]*)")?/g;
const OFFICIAL = /vevo|official|oficial|officiel|ufficiale|- topic|records|warner|sony|universal|atlantic|rhino|t-series|saregama|tips|hybe|smtown|jyp|yg entertainment|eurovision|הערוץ הרשמי|nmc|הליקון|helicon|הד ארצי|hed arzi|מוזיקה ישראלית|1thek|stone music|mnet|avex|victor|king records|pony canyon|zee music|yrf|\bemi\b|\bbmg\b|starship/i;
// Stricter than resolve.js because nobody chose this song before: the exact title must be in the video
// title itself (not only the channel name, no fuzzy spelling), the channel must be the artist's own or a
// label/official channel, and live shows, ceremonies, kids' versions and covers are rejected.
const LIVE = /\blive\b|\(live|לייב|הופעה|טקס|ceremony|concert|קונצרט|פסטיגל|ילדים|kids|\bcover\b|גרסת כיסוי|unplugged|acoustic|אקוסטי|en vivo|ao vivo|концерт|ライブ|라이브|现场|trực tiếp|grand final|semi-final|semi final|festival|festivali|sessions?\b|indian idol|\btour\b|club version|club mix|short version|remix|\bdvd\b|coke studio|حفل|killpo|performance|yılı\)/i;
const FANCH = /\bfans?\b|\bjr\b|fan's|fanpage|lyrics?\b|letra|karaoke|музыка для|mix\b/i;
const keyOf = (s) => norm(s.replace(/[֑-ׇ�]/g, "")).replace(/[וי]/g, "");
const ownChannel = (r, ch) => !FANCH.test(ch) && (OFFICIAL.test(ch) || artists(r.artist).some((a) => { const k = keyOf(a), c = keyOf(ch); return k.length > 2 && (c.includes(k) || (c.length > 3 && k.includes(c))); }));
const strictOk = (r, c) => keyOf(c.vt).includes(keyOf(r.title)) && !LIVE.test(c.vt) && ownChannel(r, c.ch);
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res({ status: r.statusCode, body: d })); }).on("error", rej));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

(async () => {
  let text = fs.readFileSync(FILE, "utf8");
  const have = [], used = new Set();
  text.replace(ENTRY, (raw, t, a, y, id) => { have.push({ t: norm(t), a: artists(a).map(norm) }); if (id) used.add(id); return raw; });
  const exists = (t, a) => { const tn = norm(t), an = artists(a).map(norm); return have.some((h) => h.t === tn && h.a.some((x) => an.includes(x))); };
  const cands = fs.readFileSync(SRC, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    // "artist~Other Spelling" adds spellings used only for matching (e.g. the Latin name of a Hebrew artist).
    .map((l) => { const [title, names = "", year] = l.split("|").map((s) => s.trim()); const n = names.split("~").map((x) => x.trim()).filter(Boolean);
      return { title, artist: n[0], match: { title, artist: n.join(", ") }, year: +year }; })
    .filter((r) => r.title && r.artist && r.year);
  const added = [];
  let skipped = 0;
  for (const r of cands) {
    if (exists(r.title, r.artist)) { skipped++; continue; }
    const s = cp.spawnSync("yt-dlp", ["--flat-playlist", "-j", "--no-warnings", `ytsearch6:${r.title} ${r.artist}`.replace(/"/g, "")], { encoding: "utf8", timeout: 60000 });
    const all = (s.stdout || "").split("\n").filter(Boolean).map((l) => { try { const j = JSON.parse(l); return { id: j.id, vt: j.title || "", ch: j.channel || j.uploader || "" }; } catch { return null; } })
      ;
    if (process.env.DEBUG) all.filter(Boolean).slice(0, 3).forEach((c) => console.log('  ?', r.title, '|', c.vt.slice(0, 70), '|', c.ch, '|', classify(r.match, c), strictOk(r.match, c), used.has(c.id)));
    const found = all.filter((c) => c && c.id && !used.has(c.id) && classify(r.match, c) === "ok" && strictOk(r.match, c));
    const main = r.artist.split(/[,&]| ft| feat| ו/i)[0].trim().toLowerCase();
    found.sort((a, b) => (OFFICIAL.test(b.ch) || b.ch.toLowerCase().includes(main)) - (OFFICIAL.test(a.ch) || a.ch.toLowerCase().includes(main)));
    if (found.length) {
      const v = await get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status,contentDetails&id=${found.map((c) => c.id).join(",")}&key=${KEY}`);
      if (v.status !== 200) { console.log("videos API", v.status, "- stopping"); break; }
      const ok = new Map((JSON.parse(v.body).items || []).filter((x) => x.status.privacyStatus === "public" && x.status.embeddable === true
        && !((x.contentDetails.regionRestriction || {}).blocked || []).includes("IL")).map((x) => [x.id, +x.snippet.publishedAt.slice(0, 4)]));
      const pick = found.find((c) => ok.has(c.id));
      if (pick) {
        added.push(`  { title: "${esc(r.title)}", artist: "${esc(r.artist)}", year: ${Math.min(r.year, ok.get(pick.id))}, youtubeId: "${pick.id}" },`);
        used.add(pick.id); have.push({ t: norm(r.title), a: artists(r.artist).map(norm) });
        if (process.env.DEBUG) console.log("+", r.title, "|", pick.vt, "|", pick.ch);
      }
    }
    await sleep(800);
  }
  if (added.length) {
    const end = text.lastIndexOf("];");
    text = text.slice(0, end) + added.join("\n") + "\n" + text.slice(end);
    fs.writeFileSync(FILE, text, "utf8");
    cp.execSync(`node --check "${FILE}"`);
  }
  console.log(`${lang} candidates ${cands.length}, already in pack ${skipped}, added ${added.length}`);
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
