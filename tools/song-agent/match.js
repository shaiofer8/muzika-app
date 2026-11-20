// Title/artist matcher shared by the song agent and the quality audit (spec-song-quality-audit).
const norm = (s) => s.normalize("NFKC").replace(/[\s"'׳״`’.,!?\-–—:;()&|\[\]{}#/\\_~*+]/g, "").toLowerCase();
const artists = (a) => a.split(/\s*(?:,|&|\+|\bfeat\.?|\bft\.?|\bx\b| ו-| ו(?=[א-ת]))\s*/i).map((s) => s.trim()).filter((s) => s.length > 1);
const NONLATIN = /[֐-׿؀-ۿЀ-ӿ぀-ヿ一-鿿가-힯ऀ-ॿ]/;
// Videos that are not the original recording: covers, karaoke, medleys, full albums, edits.
const BAD = /\bcover\b|\bparody\b|minions|nightcore|bass boosted|fan edit|edit audio|karaoke|קריוקי|פלייבק|playlist|full album|אלבום מלא|מחרוזת|medley|\+.*\+|reaction|tutorial|lesson|instrumental|8d audio|sped up|slowed/i;

// Hebrew spelling is loose (niqqud, "הכול"/"הכל", "מיליארד"/"מליארד"), so the comparison key drops
// niqqud and the vowel letters ו/י. Broken characters (U+FFFD) in a video title are dropped too.
const key = (s) => norm(s.replace(/[֑-ׇ�]/g, "")).replace(/[וי]/g, "");
// Words that may sit next to the song name in a video title without making it a different song.
const STOPN = ["official music video", "official video", "official audio", "music video", "lyric video", "official", "video", "audio",
  "lyrics", "lyric", "clip", "music", "hd", "hq", "4k", "mv", "live", "remastered", "version", "remix", "prod", "by",
  "קליפ רשמי", "הקליפ הרשמי", "קליפ", "הרשמי", "רשמי", "אודיו", "מתוך", "האלבום", "קאבר"].map(key);

function bigramSim(a, b) {
  const bg = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  const A = bg(a), B = bg(b); let inter = 0, n = 0;
  A.forEach((c, g) => { inter += Math.min(c, B.get(g) || 0); n += c; }); B.forEach((c) => (n += c));
  return n ? (2 * inter) / n : 0;
}
// True when the title appears in the text, allowing a small spelling difference for titles of 5+ letters.
function fuzzyHas(hay, t) {
  if (hay.includes(t)) return true;
  if (t.length < 5) return false;
  for (let i = 0; i + t.length <= hay.length; i++) if (bigramSim(hay.slice(i, i + t.length), t) >= 0.8) return true;
  return false;
}

// Returns "ok" | "partial" | "title?" | "artist?" | "both?" | "bad" | "missing" for song r against video m {vt, ch}.
// "partial": the video names a longer title that contains this one ("אולי" vs "אולי הפעם").
function classify(r, m) {
  if (!m || !m.vt) return "missing";
  const hay = key(m.vt + " " + m.ch);
  const tn = key(r.title);
  const titleOk = fuzzyHas(hay, tn);
  const artistOk = artists(r.artist).some((a) => hay.includes(key(a)));
  let cat = titleOk && artistOk ? "ok" : titleOk ? "artist?" : artistOk ? "title?" : "both?";
  if (titleOk) {
    const segs = m.vt.replace(/\(.*?\)|\[.*?\]|\{.*?\}|prod\.?\s*by.*$|\s(ft\.?|feat\.?|featuring)\s.*$|#\S+/gi, " ")
      .split(/\s[-–—|∞]\s|\s*\|\s*|\/\/|\s\/\s|"|״|「|」|『|』/).map((s) => s.trim()).filter(Boolean);
    const seg = segs.find((s) => fuzzyHas(key(s), tn));
    if (seg) {
      let left = key(seg.replace(/\b(19|20)\d\d\b/g, ""));
      const at = left.indexOf(tn);
      left = at >= 0 ? left.slice(0, at) + left.slice(at + tn.length) : "";
      artists(r.artist).concat([m.ch]).map(key).forEach((n) => { if (n) left = left.replace(n, ""); });
      STOPN.forEach((w) => { left = left.split(w).join(""); });
      if (!/[a-z]/i.test(r.title)) left = left.replace(/[a-z0-9]/gi, "");
      left = left.replace(/[^\p{L}\p{N}]/gu, "");
      if (left.length >= 2) cat = "partial";
    }
  }
  if (BAD.test(m.vt)) cat = "bad";
  return cat;
}
module.exports = { norm, artists, classify, NONLATIN };
