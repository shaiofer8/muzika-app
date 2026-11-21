// spec-song-quality-audit CAP-5: apply reviewed year fixes. Only songs whose MusicBrainz year is 2+ years EARLIER
// than ours are candidates (a later MB year almost always means MB lacks the original release). Every candidate
// was reviewed by hand; work/year-rejects.txt lists the ones where MB is wrong, or gives a manual year.
// Usage: node apply-years.js <lang> [<lang> ...]
const fs = require("fs"), path = require("path"), cp = require("child_process");
const W = path.join(__dirname, "work");
const rules = new Map();
for (const l of fs.readFileSync(path.join(W, "year-rejects.txt"), "utf8").split(/\r?\n/)) {
  if (!l.trim() || l.startsWith("#")) continue;
  const [lang, title, year] = l.split("|");
  rules.set(`${lang}|${title}`, year ? +year : null);
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
for (const lang of process.argv.slice(2)) {
  const FILE = path.join(__dirname, "..", "..", "songs", `${lang}.js`);
  let text = fs.readFileSync(FILE, "utf8"), n = 0;
  const rows = Object.values(JSON.parse(fs.readFileSync(path.join(W, `years-${lang}.json`), "utf8")));
  for (const r of rows) {
    const k = `${lang}|${r.title}`;
    let y = null;
    if (rules.has(k)) y = rules.get(k);
    else if (r.mb && r.year - r.mb >= 2) y = r.mb;
    if (!y || y === r.year) continue;
    const re = new RegExp(`(\\{ title: "${esc(r.title)}", artist: "${esc(r.artist)}", year: )${r.year}(, youtubeId: "${r.id}")`);
    if (!re.test(text)) { console.log("NOT FOUND", lang, r.title); continue; }
    text = text.replace(re, `$1${y}$2`); n++;
    console.log(`${lang} ${r.title} | ${r.artist}: ${r.year} -> ${y}`);
  }
  fs.writeFileSync(FILE, text, "utf8");
  cp.execSync(`node --check "${FILE}"`);
  console.log(`${lang}: ${n} years fixed`);
}
