// spec-song-quality-audit CAP-5: look up each active song's first release year on MusicBrainz.
// Only recordings whose title and artist match exactly count; the earliest first-release-date among them wins.
// Usage: node years.js <lang>  -> work/years-<lang>.json  (resumable; read-only on the song pack)
const fs = require("fs"), path = require("path"), https = require("https");
const { norm, artists } = require("../song-agent/match");
const lang = process.argv[2];
const FILE = path.join(__dirname, "..", "..", "songs", `${lang}.js`);
const OUT = path.join(__dirname, "work", `years-${lang}.json`);
const ENTRY = /\{ title: "((?:[^"\\]|\\.)*)", artist: "((?:[^"\\]|\\.)*)", year: (\d+), youtubeId: "([A-Za-z0-9_-]+)" \}/g;
const UA = "MuzikaSongAudit/1.0 ( https://muzika.sofrimyamim.com )";
const get = (u) => new Promise((res, rej) => https.get(u, { headers: { "User-Agent": UA, Accept: "application/json" } }, (r) => {
  let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res({ status: r.statusCode, body: d }));
}).on("error", rej));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bare = (s) => norm(s.replace(/\s*[([].*?[)\]]/g, "").replace(/\s(feat|ft)\.?\s.*$/i, ""));

(async () => {
  const rows = [];
  fs.readFileSync(FILE, "utf8").replace(ENTRY, (raw, title, artist, year, id) => { rows.push({ title, artist, year: +year, id }); return raw; });
  const done = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  let n = 0;
  for (const r of rows) {
    const k = `${r.title}|${r.artist}`;
    if (done[k]) continue;
    const mainArtist = artists(r.artist)[0] || r.artist;
    const q = `recording:"${r.title.replace(/["\\]/g, "")}" AND artist:"${mainArtist.replace(/["\\]/g, "")}"`;
    let res;
    for (let tries = 0; tries < 5; tries++) {
      try { res = await get(`https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(q)}&fmt=json&limit=25`); } catch { res = { status: 0 }; }
      if (res.status === 200) break;
      await sleep(3000 * (tries + 1));
    }
    let mb = null, hits = 0;
    if (res && res.status === 200) {
      const tn = bare(r.title), an = artists(r.artist).map(norm);
      for (const x of JSON.parse(res.body).recordings || []) {
        const credit = norm((x["artist-credit"] || []).map((c) => c.name + " " + ((c.artist || {}).name || "")).join(" "));
        const y = +(x["first-release-date"] || "").slice(0, 4);
        if (!y || bare(x.title) !== tn || !an.some((a) => a && credit.includes(a))) continue;
        hits++; if (!mb || y < mb) mb = y;
      }
    }
    done[k] = { title: r.title, artist: r.artist, year: r.year, id: r.id, mb, hits, err: res && res.status !== 200 ? res.status : undefined };
    if (++n % 25 === 0) { fs.writeFileSync(OUT, JSON.stringify(done, null, 1)); process.stdout.write(`${lang} ${Object.keys(done).length}/${rows.length}\n`); }
    await sleep(1100);
  }
  fs.writeFileSync(OUT, JSON.stringify(done, null, 1));
  const v = Object.values(done);
  console.log(`${lang} done: ${v.length} songs, MB match ${v.filter((x) => x.mb).length}, off by 2+ years ${v.filter((x) => x.mb && Math.abs(x.mb - x.year) >= 2).length}`);
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
