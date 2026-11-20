// For every flagged song in audit-<lang>.json, search YouTube (yt-dlp, no quota) for a video whose
// title is exactly this song by this artist. Writes search-<lang>.json: { key, cands:[{id,vt,ch,cat}], pick }.
const fs = require("fs"), path = require("path"), cp = require("child_process"), https = require("https");
const { classify } = require("../song-agent/match");
const lang = process.argv[2] || "he";
const KEY = fs.readFileSync("C:/Users/shaio/.muzika-youtube-key.txt", "utf8").trim();
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res({ status: r.statusCode, body: d })); }).on("error", rej));
const rows = JSON.parse(fs.readFileSync(path.join(__dirname, "work", `audit-${lang}.json`), "utf8"));
const force = new Set((process.argv[3] || "").split("|").filter(Boolean));
const flagged = rows.filter((o) => o.cat !== "ok" || force.has(o.title));
const outFile = path.join(__dirname, "work", `search-${lang}.json`);
const done = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : {};

(async () => {
  for (const r of flagged) {
    const key = `${r.title}|${r.artist}|${r.id}`;
    if (done[key]) continue;
    const q = `${r.title} ${r.artist}`.replace(/"/g, "");
    const s = cp.spawnSync("yt-dlp", ["--flat-playlist", "-j", "--no-warnings", `ytsearch8:${q}`], { encoding: "utf8", timeout: 60000 });
    const cands = (s.stdout || "").split("\n").filter(Boolean).map((l) => { const j = JSON.parse(l); return { id: j.id, vt: j.title || "", ch: j.channel || j.uploader || "" }; });
    cands.forEach((c) => (c.cat = classify(r, c)));
    const offi = (c) => /vevo|official|- topic|records|warner|sony|universal|atlantic|rhino|xl recordings|fueled by ramen/i.test(c.ch) || c.ch.toLowerCase().replace(/^the /, "").includes(r.artist.split(/[,&]| ft| feat/i)[0].trim().toLowerCase().replace(/^the /, ""));
    const good = cands.filter((c) => c.cat === "ok").sort((a, b) => offi(b) - offi(a));
    let pick = null;
    if (good.length) {
      const v = await get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status,contentDetails&id=${good.map((c) => c.id).join(",")}&key=${KEY}`);
      const items = v.status === 200 ? JSON.parse(v.body).items || [] : [];
      const okIds = new Map(items.filter((x) => x.status.privacyStatus === "public" && x.status.embeddable === true
        && !((x.contentDetails.regionRestriction || {}).blocked || []).includes("IL")).map((x) => [x.id, x.snippet.publishedAt.slice(0, 4)]));
      const g = good.find((c) => okIds.has(c.id));
      if (g) pick = { ...g, up: okIds.get(g.id) };
    }
    done[key] = { title: r.title, artist: r.artist, year: r.year, oldId: r.id, oldVt: r.vt, cat: r.cat, cands: cands.slice(0, 5), pick };
    fs.writeFileSync(outFile, JSON.stringify(done, null, 1));
    process.stdout.write(pick ? "+" : ".");
  }
  console.log("\nflagged", flagged.length, "found", Object.values(done).filter((d) => d.pick).length);
})();
