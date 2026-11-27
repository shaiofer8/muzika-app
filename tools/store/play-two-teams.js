// spec-two-team-clarity CAP-4: Play listings lead with "social game for two teams".
// node play-two-teams.js        -> builds play-two-teams-drafts.json from play-listings-current.json and checks limits
// node play-two-teams.js --yes  -> publishes the drafts (only after Shai approves)
const crypto = require("crypto"), fs = require("fs"), https = require("https");
const D = (s, lead, title) => ({ short: s, lead, title });
const T = {
  "iw-IL": D("משחק חברתי לשתי קבוצות: שיר מתנגן, ומי שמזהה ראשון מקבל נקודה!", "🎵 משחק חברתי לשתי קבוצות! מתחלקים לשתי קבוצות, המנחה מנגן שיר, והקבוצה שמזהה ראשונה מקבלת נקודה.", "מי מזהה את השיר? משחק קבוצות"),
  "en-US": D("Social party game for two teams: a song plays, first team to name it scores!", "🎵 A social party game for two teams! Split into two teams, the host plays a song, and the first team to name it gets a point."),
  "ar": D("لعبة جماعية لفريقين: تُشغَّل أغنية، وأول فريق يعرفها يحصل على نقطة!", "🎵 لعبة جماعية لفريقين! انقسموا إلى فريقين، يشغّل المقدّم أغنية، وأول فريق يعرفها يحصل على نقطة."),
  "de-DE": D("Partyspiel für zwei Teams: Ein Song läuft, wer ihn zuerst erkennt, punktet!", "🎵 Das Partyspiel für zwei Teams! Teilt euch in zwei Teams auf, einer spielt einen Song ab, und das Team, das ihn zuerst erkennt, bekommt einen Punkt."),
  "es-ES": D("Juego social para dos equipos: suena una canción y el primero en acertar suma", "🎵 ¡Un juego social para dos equipos! Divídanse en dos equipos, el presentador pone una canción y el primer equipo que la adivine gana un punto."),
  "fr-FR": D("Blind test en deux équipes : la première qui trouve la chanson marque !", "🎵 Un jeu de soirée en deux équipes ! Formez deux équipes, l’animateur lance une chanson et la première équipe qui la reconnaît gagne un point."),
  "hi-IN": D("दो टीमों का पार्टी गेम: गाना बजता है, जो टीम पहले पहचाने उसे पॉइंट!", "🎵 दो टीमों का पार्टी गेम! दो टीमों में बँट जाइए, होस्ट गाना चलाता है, और जो टीम पहले पहचाने उसे एक पॉइंट मिलता है।"),
  "it-IT": D("Gioco di gruppo a due squadre: parte una canzone, chi la indovina prima vince!", "🎵 Un gioco per feste a due squadre! Dividetevi in due squadre, il conduttore fa partire una canzone e la prima squadra che la indovina prende un punto."),
  "ja-JP": D("2チーム対抗の曲当てパーティーゲーム！曲が流れたら、先に当てたチームに1ポイント", "🎵 2チーム対抗のパーティーゲーム！2チームに分かれて、司会が曲を流し、先に曲名を当てたチームに1ポイント。"),
  "ko-KR": D("두 팀이 겨루는 노래 맞히기 파티 게임! 노래가 나오면 먼저 맞힌 팀이 1점", "🎵 두 팀이 겨루는 파티 게임! 두 팀으로 나누고, 진행자가 노래를 틀면 먼저 맞힌 팀이 1점을 얻어요."),
  "pt-BR": D("Jogo de festa para duas equipes: toca a música, quem acertar primeiro pontua!", "🎵 Um jogo de festa para duas equipes! Dividam-se em duas equipes, o apresentador toca uma música e a primeira equipe que acertar ganha um ponto."),
  "ru-RU": D("Игра для компании на две команды: звучит песня, угадавшие первыми получают очко", "🎵 Игра для компании на две команды! Разделитесь на две команды, ведущий включает песню, и первая команда, которая её угадает, получает очко."),
  "tr-TR": D("İki takımlı parti oyunu: şarkı çalar, ilk bilen takım puanı alır!", "🎵 İki takımlı bir parti oyunu! İki takıma ayrılın, sunucu bir şarkı çalsın; şarkıyı ilk bilen takım puanı alır."),
  "zh-TW": D("兩隊對戰的猜歌派對遊戲！歌曲一播放，最先猜出的隊伍得一分", "🎵 兩隊對戰的猜歌派對遊戲！分成兩隊，主持人播放歌曲，最先猜出歌名的隊伍得一分。"),
  "zh-CN": D("两队对战的猜歌派对游戏！歌曲一播放，最先猜出的队伍得一分", "🎵 两队对战的猜歌派对游戏！分成两队，主持人播放歌曲，最先猜出歌名的队伍得一分。"),
  "vi": D("Trò chơi tiệc cho hai đội: bài hát vang lên, đội đoán đúng trước được điểm!", "🎵 Trò chơi tiệc cho hai đội! Chia thành hai đội, quản trò bật bài hát, đội nào đoán ra trước được một điểm."),
};
const cur = JSON.parse(fs.readFileSync(__dirname + "/play-listings-current.json", "utf8")).listings;
const drafts = {}; const problems = [];
for (const l of cur) {
  const d = T[l.language]; if (!d) { problems.push("no draft " + l.language); continue; }
  let full = l.fullDescription;
  // Hebrew opens with the old "one phone, one host" line: replace it; elsewhere put the new line first.
  if (l.language === "iw-IL") full = full.replace(/^[^\n]*\n/, d.lead + "\n");
  else full = d.lead + "\n\n" + full;
  const title = d.title || l.title;
  if ([...title].length > 30) problems.push(`${l.language} title ${[...title].length}`);
  if ([...d.short].length > 80) problems.push(`${l.language} short ${[...d.short].length}`);
  if ([...full].length > 4000) problems.push(`${l.language} full ${[...full].length}`);
  drafts[l.language] = { title, short: d.short, full };
}
fs.writeFileSync(__dirname + "/play-two-teams-drafts.json", JSON.stringify(drafts, null, 1));
console.log("drafts", Object.keys(drafts).length, problems.length ? "PROBLEMS " + problems.join("; ") : "all within limits");
if (!process.argv.includes("--yes")) return;

const KEY = JSON.parse(fs.readFileSync("C:/Users/shaio/service-account.json", "utf8"));
const b64 = (b) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const req = (method, url, body, headers = {}) => new Promise((res, rej) => {
  const u = new URL(url);
  const r = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, headers }, (s) => {
    const d = []; s.on("data", (c) => d.push(c)); s.on("end", () => res({ status: s.statusCode, body: Buffer.concat(d).toString("utf8") }));
  });
  r.on("error", rej); if (body) r.write(body); r.end();
});
(async () => {
  if (problems.length) throw new Error("fix problems first");
  const now = Math.floor(Date.now() / 1000);
  const u = `${b64(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64(JSON.stringify({ iss: KEY.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: KEY.token_uri, iat: now, exp: now + 3600 }))}`;
  const sig = b64(crypto.createSign("RSA-SHA256").update(u).sign(KEY.private_key));
  const t = await req("POST", KEY.token_uri, `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${u}.${sig}`, { "Content-Type": "application/x-www-form-urlencoded" });
  const H = { Authorization: `Bearer ${JSON.parse(t.body).access_token}`, "Content-Type": "application/json" };
  const base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.muzikaparty.app";
  const e = JSON.parse((await req("POST", `${base}/edits`, "{}", H)).body).id;
  for (const [lang, v] of Object.entries(drafts)) {
    const r = await req("PUT", `${base}/edits/${e}/listings/${lang}`, JSON.stringify({ language: lang, title: v.title, shortDescription: v.short, fullDescription: v.full }), H);
    console.log("listing", lang, r.status, r.status === 200 ? "" : r.body.slice(0, 160));
  }
  const c = await req("POST", `${base}/edits/${e}:commit`, "{}", H);
  console.log("commit", c.status, c.body.slice(0, 200));
})().catch((x) => console.log("ERR", x.message));
