// Read-only: dump current Muzika Play listings to play-listings-current.json (edit is deleted, nothing committed).
const crypto = require("crypto"), fs = require("fs"), https = require("https");
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
  const now = Math.floor(Date.now() / 1000);
  const u = `${b64(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64(JSON.stringify({ iss: KEY.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: KEY.token_uri, iat: now, exp: now + 3600 }))}`;
  const sig = b64(crypto.createSign("RSA-SHA256").update(u).sign(KEY.private_key));
  const t = await req("POST", KEY.token_uri, `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${u}.${sig}`, { "Content-Type": "application/x-www-form-urlencoded" });
  const H = { Authorization: `Bearer ${JSON.parse(t.body).access_token}`, "Content-Type": "application/json" };
  const base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.muzikaparty.app";
  const e = JSON.parse((await req("POST", `${base}/edits`, "{}", H)).body).id;
  const l = await req("GET", `${base}/edits/${e}/listings`, null, H);
  fs.writeFileSync(__dirname + "/play-listings-current.json", l.body);
  const imgs = await req("GET", `${base}/edits/${e}/listings/iw-IL/phoneScreenshots`, null, H);
  console.log("listings", l.status, "he screenshots", (JSON.parse(imgs.body).images || []).length);
  await req("DELETE", `${base}/edits/${e}`, null, H);
})().catch((x) => console.log("ERR", x.message));
