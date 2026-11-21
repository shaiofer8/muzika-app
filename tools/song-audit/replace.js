// spec-song-quality-audit CAP-5: give a listed song a new video when its current one is a live show, TV
// appearance, alternate version or another song. Uses the strict rules of add.js. When no original video
// passes, the song is disabled with reason "not_original" (editorial: the daily agent never re-enables it).
// Usage: node replace.js <lang> "title[~Latin artist]|title2|..."
const fs = require("fs"), path = require("path"), cp = require("child_process"), https = require("https");
const { classify } = require("../song-agent/match");
const { OFFICIAL, strictOk } = require("./strict");
const [lang, list] = process.argv.slice(2);
const FILE = path.join(__dirname, "..", "..", "songs", `${lang}.js`);
const KEY = fs.readFileSync("C:/Users/shaio/.muzika-youtube-key.txt", "utf8").trim();
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res({ status: r.statusCode, body: d })); }).on("error", rej));

(async () => {
  let text = fs.readFileSync(FILE, "utf8");
  const used = new Set([...text.matchAll(/youtubeId: "([A-Za-z0-9_-]+)"/g)].map((m) => m[1]));
  for (const item of list.split("|").filter(Boolean)) {
    const [title, alias] = item.split("~");
    const re = new RegExp(`\\{ title: "${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}", artist: "((?:[^"\\\\]|\\\\.)*)", year: (\\d+), youtubeId: "([A-Za-z0-9_-]+)" \\}`);
    const m = text.match(re);
    if (!m) { console.log("NOT FOUND", title); continue; }
    const [raw, artist, year, oldId] = m;
    const r = { title, artist: alias ? `${artist}, ${alias}` : artist };
    const s = cp.spawnSync("yt-dlp", ["--flat-playlist", "-j", "--no-warnings", `ytsearch10:${title} ${alias || artist}`.replace(/"/g, "")], { encoding: "utf8", timeout: 60000 });
    const found = (s.stdout || "").split("\n").filter(Boolean).map((l) => { try { const j = JSON.parse(l); return { id: j.id, vt: j.title || "", ch: j.channel || j.uploader || "" }; } catch { return null; } })
      .filter((c) => c && c.id && c.id !== oldId && !used.has(c.id) && classify(r, c) === "ok" && strictOk(r, c))
      .sort((a, b) => OFFICIAL.test(b.ch) - OFFICIAL.test(a.ch));
    let pick = null, up = 0;
    if (found.length) {
      const v = await get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status,contentDetails&id=${found.map((c) => c.id).join(",")}&key=${KEY}`);
      const ok = new Map((JSON.parse(v.body).items || []).filter((x) => x.status.privacyStatus === "public" && x.status.embeddable === true
        && !((x.contentDetails.regionRestriction || {}).blocked || []).includes("IL")).map((x) => [x.id, +x.snippet.publishedAt.slice(0, 4)]));
      pick = found.find((c) => ok.has(c.id)); if (pick) up = ok.get(pick.id);
    }
    const line = pick
      ? `{ title: "${title}", artist: "${artist}", year: ${Math.min(+year, up)}, youtubeId: "${pick.id}" }`
      : `{ title: "${title}", artist: "${artist}", year: ${year}, youtubeId: "${oldId}", status: "disabled", reason: "not_original" }`;
    text = text.replace(raw, line);
    if (pick) used.add(pick.id);
    console.log(pick ? `REPLACED ${title} -> ${pick.vt} | ${pick.ch}` : `DISABLED ${title} (no original video found)`);
  }
  fs.writeFileSync(FILE, text, "utf8");
  cp.execSync(`node --check "${FILE}"`);
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
