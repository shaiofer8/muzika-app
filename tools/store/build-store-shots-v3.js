// spec-two-team-clarity CAP-6: 4 screenshots per listing showing the two-team bar. node build-store-shots-v3.js [iw-IL,en-US,...]
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "store-shots-v3");
const CAPS = require("./store-captions-v3.json");
const SITE = "https://muzika.sofrimyamim.com/";
const ONLY = process.argv[2] ? process.argv[2].split(",") : Object.keys(CAPS);
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const W = 412, H = 732, SCALE = 2.6;

async function openPage(browser, lang, howtoSeen, scores) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, userAgent: UA, locale: lang });
  await ctx.addInitScript(([l, seen, sc]) => {
    try {
      localStorage.setItem("muzika-lang-v3", l);
      if (seen) localStorage.setItem("muzika-howto-v2", "1");
      if (sc) localStorage.setItem("muzika-score-state-v1", JSON.stringify({ teamCount: 2, scores: sc, names: [], customNames: [], configured: true }));
    } catch (e) {}
  }, [lang, howtoSeen, scores]);
  const p = await ctx.newPage();
  await p.goto(SITE + "?shots=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
  await p.addStyleTag({ url: "https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=block" });
  await p.addStyleTag({ content: ".lang-flag-main,.howto-icon,.howto-team,.score-fab span[aria-hidden],.new-btn span[aria-hidden],.primary-icon,.share-btn span[aria-hidden],.team-bar-more{font-family:'Noto Color Emoji',sans-serif!important}" });
  await p.waitForTimeout(2500);
  return { ctx, p };
}

async function playFrom(p, decades) {
  for (const d of decades) {
    await p.selectOption("#decadeSelect", d).catch(() => {});
    await p.click("#primaryBtn").catch(() => {});
    await p.waitForTimeout(3500);
    const empty = await p.evaluate(() => {
      const t = (document.getElementById("songTitle") || {}).textContent || "";
      const msg = window.MuzikaLang ? window.MuzikaLang.t("noSongs") : "";
      return !t.trim() || t.trim() === "—" || t.indexOf(msg) !== -1 || !!document.querySelector(".video-frame:empty");
    });
    if (!empty) break;
  }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(500);
}

async function shotsFor(browser, lang) {
  let { ctx, p } = await openPage(browser, lang, false, null);
  const howto = await p.screenshot({ type: "png" });
  await ctx.close();
  ({ ctx, p } = await openPage(browser, lang, true, [3, 2]));
  await playFrom(p, ["1990", "2000", "1980", "2010"]);
  const main1 = await p.screenshot({ type: "png" });
  // the bar re-renders after every point, so look the button up again each time
  for (const [i, n] of [[0, 2], [1, 2]]) for (let k = 0; k < n; k++) { await p.locator(".team-chip-plus").nth(i).click(); await p.waitForTimeout(150); }
  await playFrom(p, ["2000", "2010", "1990", "1980"]);
  await p.waitForTimeout(600);
  const main2 = await p.screenshot({ type: "png" });
  await p.click("#scoreOpenBtn").catch(() => {});
  await p.waitForTimeout(900);
  const score = await p.screenshot({ type: "png" });
  const bar = await p.evaluate(() => [...document.querySelectorAll(".team-chip")].map((c) => c.textContent.trim()).join(" | "));
  await ctx.close();
  return { shots: [main1, howto, main2, score], bar };
}

async function captioned(browser, lang, cap, buf, outFile) {
  const dir = ["he", "ar"].includes(lang) ? "rtl" : "ltr";
  const img = "data:image/png;base64," + buf.toString("base64");
  const html = `<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><style>
    html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:linear-gradient(160deg,#2a1763 0%,#090d19 100%);}
    .cap{position:absolute;top:90px;left:60px;right:60px;height:260px;display:flex;align-items:center;justify-content:center;text-align:center;color:#f5f7ff;font:800 72px/1.18 "Segoe UI","Arial","Noto Sans","Microsoft YaHei","Microsoft JhengHei","Malgun Gothic","Yu Gothic","Nirmala UI",sans-serif;text-wrap:balance}
    .frame{position:absolute;top:400px;left:90px;width:900px;height:1400px;border-radius:56px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);border:6px solid #2b3853;}
    .frame img{width:100%;height:100%;object-fit:cover;object-position:top;display:block;}
  </style></head><body><div class="cap">${cap}</div><div class="frame"><img src="${img}"></div></body></html>`;
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
  const p = await ctx.newPage();
  await p.setContent(html, { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: outFile, type: "png" });
  await ctx.close();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  for (const key of ONLY) {
    const { app, caps } = CAPS[key];
    const { shots, bar } = await shotsFor(browser, app);
    for (let i = 0; i < 4; i++) await captioned(browser, app, caps[i], shots[i], path.join(OUT, `${key}-${i + 1}.png`));
    console.log("done", key, "bar:", bar);
  }
  await browser.close();
})().catch((e) => { console.log("ERR", e.message); process.exit(1); });
