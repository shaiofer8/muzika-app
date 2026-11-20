// Title/artist matcher shared by the song agent and the quality audit (spec-song-quality-audit).
const norm = (s) => s.normalize("NFKC").replace(/[\s"'׳״`’.,!?\-–—:;()&|\[\]{}#/\\_~*+]/g, "").toLowerCase();
const artists = (a) => a.split(/\s*(?:,|&|\+|\bfeat\.?|\bft\.?|\bx\b| ו-| ו(?=[א-ת]))\s*/i).map((s) => s.trim()).filter((s) => s.length > 1);
const STOP = /^(official|video|audio|lyrics?|clip|music|hd|hq|4k|mv|m\/v|live|קליפ|הקליפ|הרשמי|רשמי|אודיו|גרסת|מתוך|האלבום|קאבר|cover|remix|feat|ft|prod|by|מארח|מארחת|ו|x)$/i;
const NONLATIN = /[֐-׿؀-ۿЀ-ӿ぀-ヿ一-鿿가-힯ऀ-ॿ]/;
const BAD = /karaoke|קריוקי|פלייבק|playlist|full album|אלבום מלא|מחרוזת|medley|\+.*\+|reaction|tutorial|lesson|instrumental|8d audio|sped up|slowed/i;

// Returns "ok" | "partial" | "title?" | "artist?" | "both?" | "bad" for song r against video m {vt, ch}.
// Hebrew spelling is loose (niqqud, "הכול"/"הכל", "מיליארד"/"מליארד"), so the comparison key drops
// niqqud and the vowel letters ו/י. Broken characters (U+FFFD) in a video title are dropped too.
const key = (s) => norm(s.replace(/[֑-ׇ�]/g, "")).replace(/[וי]/g, "");
const STOPN = ["officialmusicvideo", "officialvideo", "officialaudio", "musicvideo", "lyricvideo", "official", "video", "audio", "lyrics", "lyric", "clip", "music", "hd", "hq", "4k", "mv", "live", "remastered", "version", "קליפרשמ", "הקלפהרשמ", "קלפ", "הרשמ", "רשמ", "אודו", "מתוך", "האלבום", "קאבר", "cover", "remix", "prod", "by"];
function bigramSim(a, b) {
  const bg = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  const A = bg(a), B = bg(b); let inter = 0, n = 0;
  A.forEach((c, g) => { inter += Math.min(c, B.get(g) || 0); n += c; }); B.forEach((c) => (n += c));
  return n ? (2 * inter) / n : 0;
}
// Best similarity of the song title against any same-length window of the video title.
function fuzzyHas(hay, t) {
  if (hay.includes(t)) return true;
  if (t.length < 5) return false;
  for (let i = 0; i + t.length <= hay.length; i++) if (bigramSim(hay.slice(i, i + t.length), t) >= 0.8) return true;
  return false;
}

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
