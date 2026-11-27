// spec-two-team-clarity CAP-6: replaces the 4 phone screenshots in all 16 listings with store-shots-v3. Run only after Shai approves.
const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");
const KEY = JSON.parse(fs.readFileSync("C:/Users/shaio/service-account.json", "utf8"));
const SHOTS = path.join(__dirname, "store-shots-v3");
const LISTING = Object.fromEntries(Object.keys(require("./store-captions-v3.json")).map((k) => [k, k]));
const b64 = (b) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const req = (method, url, body, headers = {}) => new Promise((res, rej) => {
  const u = new URL(url);
  const r = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, headers }, (s) => {
    const d = []; s.on("data", (c) => d.push(c)); s.on("end", () => res({ status: s.statusCode, body: Buffer.concat(d).toString("utf8") }));
  });
  r.on("error", rej); if (body) r.write(body); r.end();
});
(async () => {
  const now = Math.floor(Date.now() / 1000);
  const u = `${b64(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64(JSON.stringify({ iss: KEY.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: KEY.token_uri, iat: now, exp: now + 3600 }))}`;
  const sig = b64(crypto.createSign("RSA-SHA256").update(u).sign(KEY.private_key));
  const t = await req("POST", KEY.token_uri, `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${u}.${sig}`, { "Content-Type": "application/x-www-form-urlencoded" });
  const tok = JSON.parse(t.body).access_token;
  const H = { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
  const base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.muzikaparty.app";
  const up = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/com.muzikaparty.app";
  const e = JSON.parse((await req("POST", `${base}/edits`, "{}", H)).body).id;
  for (const [cap, lang] of Object.entries(LISTING)) {
    const d = await req("DELETE", `${base}/edits/${e}/listings/${lang}/phoneScreenshots`, null, H);
    let ok = 0;
    for (let i = 1; i <= 4; i++) {
      const file = path.join(SHOTS, `${cap}-${i}.png`);
      const buf = fs.readFileSync(file);
      const r = await req("POST", `${up}/edits/${e}/listings/${lang}/phoneScreenshots?uploadType=media`, buf, { ...{ Authorization: `Bearer ${tok}` }, "Content-Type": "image/png", "Content-Length": buf.length });
      if (r.status === 200) ok++; else console.log("fail", lang, i, r.status, r.body.slice(0, 160));
    }
    console.log("screenshots", lang, "delete", d.status, "uploaded", ok, "of 4");
  }
  const c = await req("POST", `${base}/edits/${e}:commit`, "{}", H);
  console.log("commit", c.status, c.body.slice(0, 160));
})().catch((x) => console.log("ERR", x.message));
