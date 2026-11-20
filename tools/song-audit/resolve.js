// spec-song-quality-audit CAP-4: give a verified YouTube video to songs that are listed but have none yet.
// Searches with yt-dlp (no API quota), accepts only an exact title+artist match that is public, embeddable
// and not blocked in Israel, prefers official channels, never reuses a video already in the list.
// Usage: node resolve.js <lang> [limit]   -> edits songs/<lang>.js in place (caller commits).
const fs = require("fs"), path = require("path"), cp = require("child_process"), https = require("https");
const { classify } = require("../song-agent/match");
const lang = process.argv[2];
const LIMIT = Number(process.argv[3] || 100000);
const FILE = path.join(__dirname, "..", "..", "songs", `${lang}.js`);
const KEY = fs.readFileSync("C:/Users/shaio/.muzika-youtube-key.txt", "utf8").trim();
const ENTRY = /\{ title: "((?:[^"\\]|\\.)*)", artist: "((?:[^"\\]|\\.)*)", year: (\d+)(?:, youtubeId: "([A-Za-z0-9_-]*)")?(?:, status: "([a-z_]+)", reason: "([^"]*)")? \}/g;
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res({ status: r.statusCode, body: d })); }).on("error", rej));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OFFICIAL = /vevo|official|oficial|officiel|ufficiale|- topic|records|warner|sony|universal|atlantic|rhino|t-series|saregama|tips|hybe|smtown|jyp|yg entertainment|הערוץ הרשמי/i;

(async () => {
  let text = fs.readFileSync(FILE, "utf8");
  const rows = [];
  text.replace(ENTRY, (raw, title, artist, year, id, status, reason) => { rows.push({ raw, title, artist, year: +year, id: id || "", status, reason }); return raw; });
  const used = new Set(rows.map((r) => r.id).filter(Boolean));
  const todo = rows.filter((r) => !r.id && (!r.status || r.status === "no_match")).slice(0, LIMIT);
  let added = 0, tried = 0;
  for (const r of todo) {
    tried++;
    const s = cp.spawnSync("yt-dlp", ["--flat-playlist", "-j", "--no-warnings", `ytsearch6:${r.title} ${r.artist}`.replace(/"/g, "")], { encoding: "utf8", timeout: 60000 });
    const cands = (s.stdout || "").split("\n").filter(Boolean).map((l) => { try { const j = JSON.parse(l); return { id: j.id, vt: j.title || "", ch: j.channel || j.uploader || "" }; } catch { return null; } })
      .filter((c) => c && c.id && !used.has(c.id) && classify(r, c) === "ok");
    if (process.env.DEBUG) console.log(r.title, "|", r.artist, "| results", (s.stdout || "").split("\n").filter(Boolean).length, "| matches", cands.length, (s.stderr || "").slice(0, 120));
    const main = r.artist.split(/[,&]| ft| feat| ו/i)[0].trim().toLowerCase();
    cands.sort((a, b) => (OFFICIAL.test(b.ch) || b.ch.toLowerCase().includes(main)) - (OFFICIAL.test(a.ch) || a.ch.toLowerCase().includes(main)));
    if (cands.length) {
      const v = await get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status,contentDetails&id=${cands.map((c) => c.id).join(",")}&key=${KEY}`);
      if (v.status !== 200) { console.log("videos API", v.status, "- stopping"); break; }
      const ok = new Map((JSON.parse(v.body).items || []).filter((x) => x.status.privacyStatus === "public" && x.status.embeddable === true
        && !((x.contentDetails.regionRestriction || {}).blocked || []).includes("IL")).map((x) => [x.id, +x.snippet.publishedAt.slice(0, 4)]));
      const pick = cands.find((c) => ok.has(c.id));
      if (pick) {
        const year = Math.min(r.year, ok.get(pick.id));
        const line = `{ title: "${r.title}", artist: "${r.artist}", year: ${year}, youtubeId: "${pick.id}" }`;
        text = text.replace(r.raw, line);
        used.add(pick.id); added++;
      }
    }
    if (tried % 25 === 0) { fs.writeFileSync(FILE, text, "utf8"); process.stdout.write(`${lang} ${tried}/${todo.length} +${added}\n`); }
    await sleep(800);
  }
  fs.writeFileSync(FILE, text, "utf8");
  cp.execSync(`node --check "${FILE}"`);
  console.log(`${lang} done: tried ${tried}, added ${added}`);
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
