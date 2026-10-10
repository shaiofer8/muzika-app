const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
const KEY_FILE = process.env.MUZIKA_YT_KEY_FILE || "C:/Users/shaio/.muzika-youtube-key.txt";
const KEY = fs.readFileSync(KEY_FILE, "utf8").trim();
const LOG_DIR = path.join(__dirname, "logs");
const PUSH = process.env.MUZIKA_NO_PUSH !== "1";
const TODAY = new Date().toISOString().slice(0, 10);
const IS_TREND_DAY = new Date().getDay() === CONFIG.trendDay;
const SEARCH_PER_DAY = Number(process.env.MUZIKA_SEARCH_PER_DAY || CONFIG.searchPerDay);
const SEARCH_PER_LANG = Math.floor(SEARCH_PER_DAY / Object.keys(CONFIG.languages).length);

const ENTRY = /\{ title: "((?:[^"\\]|\\.)*)", artist: "((?:[^"\\]|\\.)*)", year: (\d+)(?:, youtubeId: "([A-Za-z0-9_-]*)")?(?:, status: "([a-z_]+)", reason: "([^"]*)")? \}/g;
const ARRAY_END = /\n\];?\s*$/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.replace(/[\s"'׳״.,!?\-–—:()&|\[\]]/g, "").toLowerCase();
const firstArtist = (a) => a.split(/[,&]| ו-| ו/)[0].trim();
const esc = (s) => s.replace(/"/g, '\\"');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    }).on("error", reject);
  });
}

function eraOf(year) {
  if (year >= 2024) return "recent";
  if (year >= 2010) return "mid";
  if (year >= 2000) return "early";
  return "old";
}

function parseFile(text) {
  const entries = [];
  text.replace(ENTRY, (raw, title, artist, year, id, status, reason) => {
    entries.push({ raw, title, artist, year: +year, youtubeId: id || "", status: status || null, reason: reason || null, changed: false });
    return raw;
  });
  return entries;
}

function render(e) {
  if (!e.changed) return e.raw;
  let s = `{ title: "${e.title}", artist: "${e.artist}", year: ${e.year}`;
  if (e.youtubeId) s += `, youtubeId: "${e.youtubeId}"`;
  if (e.status) s += `, status: "${e.status}", reason: "${e.reason || ""}"`;
  return s + " }";
}

function rebuild(text, entries) {
  let i = 0;
  return text.replace(ENTRY, () => render(entries[i++]));
}

async function checkIds(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const r = await get(`https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${chunk.join(",")}&key=${KEY}`);
    if (r.status !== 200) throw new Error(`videos API ${r.status}: ${r.body.slice(0, 200)}`);
    const items = JSON.parse(r.body).items || [];
    const seen = new Set(items.map((v) => v.id));
    chunk.forEach((id) => { if (!seen.has(id)) out.set(id, "removed_or_private"); });
    items.forEach((v) => {
      const reasons = [];
      if (v.status.privacyStatus !== "public") reasons.push("private");
      if (v.status.embeddable !== true) reasons.push("not_embeddable");
      if (((v.contentDetails.regionRestriction || {}).blocked || []).includes("IL")) reasons.push("blocked_IL");
      out.set(v.id, reasons.length ? reasons.join("+") : "ok");
    });
  }
  return out;
}

async function validate(entries, log) {
  const withId = entries.filter((e) => e.youtubeId);
  const results = await checkIds(withId.map((e) => e.youtubeId));
  for (const e of withId) {
    const res = results.get(e.youtubeId);
    log.validated++;
    if (res === "ok") {
      if (e.status === "disabled") { e.status = null; e.reason = null; e.changed = true; log.reenabled.push(e.title); }
    } else if (e.status !== "disabled") {
      e.status = "disabled"; e.reason = res; e.changed = true;
      log.disabled.push({ title: e.title, reason: res });
    }
  }
}

function pickByEra(pending, budget) {
  const buckets = { recent: [], mid: [], early: [], old: [] };
  pending.forEach((e) => buckets[eraOf(e.year)].push(e));
  const picked = [];
  for (const [era, w] of Object.entries(CONFIG.eraWeights)) {
    const take = Math.round(budget * w);
    picked.push(...buckets[era].slice(0, take));
    buckets[era] = buckets[era].slice(take);
  }
  const leftovers = Object.values(buckets).flat();
  return picked.concat(leftovers).slice(0, budget);
}

async function search(e) {
  const q = encodeURIComponent(`${e.title} ${firstArtist(e.artist)}`);
  const r = await get(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&videoEmbeddable=true&q=${q}&key=${KEY}`);
  return { code: r.status, items: r.status === 200 ? (JSON.parse(r.body).items || []) : [] };
}

async function discover(entries, log) {
  const pending = entries.filter((e) => !e.youtubeId && !e.status);
  const batch = pickByEra(pending, SEARCH_PER_LANG);
  for (const e of batch) {
    const r = await search(e);
    if (r.code === 429 || r.code === 403) { log.stoppedBy = "quota"; break; }
    const artistKey = norm(firstArtist(e.artist));
    const hit = r.items.find((it) =>
      norm(it.snippet.title).includes(norm(e.title)) &&
      (norm(it.snippet.title).includes(artistKey) || norm(it.snippet.channelTitle).includes(artistKey)));
    if (hit) {
      const check = (await checkIds([hit.id.videoId])).get(hit.id.videoId);
      if (check === "ok") {
        e.youtubeId = hit.id.videoId; e.changed = true;
        log.discovered.push({ title: e.title, artist: e.artist, youtubeId: e.youtubeId });
        continue;
      }
      e.status = "no_match"; e.reason = `video_${check}`; e.changed = true; log.noMatch++;
    } else {
      e.status = "no_match"; e.reason = "no_artist_title_match"; e.changed = true; log.noMatch++;
    }
    await sleep(1500);
  }
}

function parseChartTitle(t) {
  const clean = t.replace(/\(.*?\)|\[.*?\]|\|.*$/g, "").trim();
  const m = clean.split(/\s[-–]\s/);
  if (m.length < 2) return null;
  return { artist: m[0].trim(), title: m.slice(1).join(" - ").trim() };
}

async function trends(entries, region, log) {
  const r = await get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status&chart=mostPopular&regionCode=${region}&videoCategoryId=10&maxResults=50&key=${KEY}`);
  if (r.status !== 200) { log.trendError = r.status; return []; }
  const existing = new Set(entries.map((e) => norm(e.title) + "|" + norm(e.artist)));
  const added = [];
  for (const v of JSON.parse(r.body).items || []) {
    if (added.length >= CONFIG.trendsPerWeek) break;
    if (v.status.embeddable !== true || v.status.privacyStatus !== "public") continue;
    const p = parseChartTitle(v.snippet.title);
    if (!p || !p.title || !p.artist) continue;
    if (existing.has(norm(p.title) + "|" + norm(p.artist))) continue;
    added.push({ title: p.title, artist: p.artist, year: new Date(v.snippet.publishedAt).getFullYear(), youtubeId: v.id, changed: true, status: null, reason: null, raw: "" });
    existing.add(norm(p.title) + "|" + norm(p.artist));
  }
  log.trendsAdded = added.map((a) => ({ title: a.title, artist: a.artist, youtubeId: a.youtubeId }));
  return added;
}

function appendEntries(text, added) {
  if (!added.length) return text;
  const lines = added.map((e) => `  { title: "${esc(e.title)}", artist: "${esc(e.artist)}", year: ${e.year}, youtubeId: "${e.youtubeId}" },`).join("\n");
  return text.replace(ARRAY_END, (m) => `\n${lines}${m}`);
}

function commit(file, message) {
  execSync(`git -C "${ROOT}" add "${file}"`);
  execSync(`git -C "${ROOT}" commit -q -m "${message.replace(/"/g, '\\"')}"`);
}

(async () => {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const full = { date: TODAY, languages: {} };
  const changedFiles = [];

  for (const [lang, cfg] of Object.entries(CONFIG.languages)) {
    const file = path.join(ROOT, cfg.file);
    const original = fs.readFileSync(file, "utf8");
    const entries = parseFile(original);
    const log = { parsed: entries.length, validated: 0, disabled: [], reenabled: [], discovered: [], noMatch: 0, trendsAdded: [], stoppedBy: null };

    await validate(entries, log);
    await discover(entries, log);

    let text = rebuild(original, entries);
    if (IS_TREND_DAY) {
      const added = await trends(entries, cfg.region, log);
      text = appendEntries(text, added);
    }

    if (text !== original) {
      fs.writeFileSync(file, text, "utf8");
      execSync(`node --check "${file}"`);
      changedFiles.push({ lang, file, log });
    }
    full.languages[lang] = log;
  }

  for (const c of changedFiles) {
    const l = c.log;
    if (PUSH) {
      const msg = `Song agent ${TODAY} (${c.lang}): validated ${l.validated}, disabled ${l.disabled.length}, reenabled ${l.reenabled.length}, added ${l.discovered.length + l.trendsAdded.length}`;
      commit(c.file, msg);
    }
  }
  if (PUSH && changedFiles.length) {
    execSync(`git -C "${ROOT}" push -q`);
    full.pushed = true;
  } else {
    full.pushed = false;
  }

  fs.writeFileSync(path.join(LOG_DIR, `${TODAY}.json`), JSON.stringify(full, null, 1), "utf8");
  for (const [lang, l] of Object.entries(full.languages)) {
    console.log(`${lang}: parsed ${l.parsed}, validated ${l.validated}, disabled ${l.disabled.length}, reenabled ${l.reenabled.length}, searchAdded ${l.discovered.length}, trendAdded ${l.trendsAdded.length}, noMatch ${l.noMatch}, stoppedBy ${l.stoppedBy}`);
  }
  console.log("pushed", full.pushed);
})().catch((e) => { console.error("AGENT ERROR:", e.message); process.exit(1); });
