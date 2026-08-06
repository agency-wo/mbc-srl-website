import puppeteer from "puppeteer";
const a = process.argv[2] || "progetti";
const path = a === "home" ? "/" : "/" + a.replace(/^.*[\\/]/, "").replace(/^\/+|\/+$/g, "") + "/";
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setCacheEnabled(false);
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
let total = 0, img = 0, count = 0;
p.on("response", async r => {
  try {
    const buf = await r.buffer();
    total += buf.length; count++;
    if ((r.headers()["content-type"] || "").startsWith("image/")) img += buf.length;
  } catch {}
});
await p.goto("http://127.0.0.1:8099" + path, { waitUntil: "networkidle0", timeout: 90000 });
// scroll through to trigger all lazy loads
await p.evaluate(async () => {
  await new Promise(res => { let n = 0; const t = setInterval(() => {
    window.scrollBy(0, Math.round(innerHeight * 0.7));
    if (scrollY + innerHeight >= document.body.scrollHeight - 2 || ++n > 120) { clearInterval(t); setTimeout(res, 800); }
  }, 90); });
});
await new Promise(r => setTimeout(r, 1200));
console.log(`${path} @390 dpr2 - requests: ${count} | total: ${(total/1048576).toFixed(2)} MB | images: ${(img/1048576).toFixed(2)} MB`);
await b.close();
