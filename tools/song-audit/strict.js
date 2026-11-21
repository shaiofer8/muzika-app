// Strict checks for choosing a NEW video (add.js, replace.js) — spec-song-quality-audit CAP-4/CAP-5.
const { norm, artists } = require("../song-agent/match");
const OFFICIAL = /vevo|official|oficial|officiel|ufficiale|- topic|records|warner|sony|universal|atlantic|rhino|t-series|saregama|tips|hybe|smtown|jyp|yg entertainment|eurovision|הערוץ הרשמי|nmc|הליקון|helicon|הד ארצי|hed arzi|מוזיקה ישראלית|1thek|stone music|mnet|avex|victor|king records|pony canyon|zee music|yrf|\bemi\b|\bbmg\b|starship/i;
// Stricter than resolve.js because nobody chose this song before: the exact title must be in the video
// title itself (not only the channel name, no fuzzy spelling), the channel must be the artist's own or a
// label/official channel, and live shows, ceremonies, kids' versions and covers are rejected.
const LIVE = /\blive\b|\(live|לייב|הופעה|טקס|ceremony|concert|קונצרט|פסטיגל|ילדים|kids|\bcover\b|גרסת כיסוי|unplugged|acoustic|אקוסטי|en vivo|ao vivo|концерт|ライブ|라이브|现场|trực tiếp|grand final|semi-final|semi final|festival|festivali|sessions?\b|indian idol|\btour\b|club version|club mix|short version|remix|\bdvd\b|coke studio|حفل|killpo|performance|yılı\)|konser|'s version|’s version|хиты|сборник|合集|精选|tập \d|episode|lo-?fi|ver\.? ?2|new version|phối mới|focus cam|stage|countdown|kcon|\dver\b|anniversary|\d+ anos\b|concierto|chuyện nhạc|see sing share|red rooster|#\S*anos|esqueceomundo/i;
const FANCH = /\bfans?\b|\bjr\b|fan's|fanpage|lyrics?\b|letra|karaoke|музыка для|mix\b/i;
const keyOf = (s) => norm(s.replace(/[֑-ׇ�]/g, "")).replace(/[וי]/g, "");
const ownChannel = (r, ch) => !FANCH.test(ch) && (OFFICIAL.test(ch) || artists(r.artist).some((a) => { const k = keyOf(a), c = keyOf(ch); return k.length > 2 && (c.includes(k) || (c.length > 3 && k.includes(c))); }));
const strictOk = (r, c) => keyOf(c.vt).includes(keyOf(r.title)) && !LIVE.test(c.vt) && ownChannel(r, c.ch);
module.exports = { OFFICIAL, LIVE, FANCH, keyOf, ownChannel, strictOk };
