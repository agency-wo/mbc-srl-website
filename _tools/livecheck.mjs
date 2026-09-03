import puppeteer from "puppeteer";
const B = "https://mbc-srl-preview.pages.dev";
const pages = ["/","/chi-siamo/","/soluzioni/","/progetti/","/catalogo/","/contatti/","/privacy/","/cookie/","/en/","/en/about/","/en/solutions/","/en/projects/","/en/catalogue/","/en/contact/","/en/privacy/","/en/cookie/"];
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
let problems = [];
for (const path of pages) for (const w of [1440, 390]) {
  const p = await b.newPage(); await p.setCacheEnabled(false);
  p.on("pageerror", e => problems.push(`[${w}] ${path} JSERR ${e.message}`));
  p.on("console", m => { if (m.type() === "error") problems.push(`[${w}] ${path} CONERR ${m.text()}`); });
  p.on("response", r => { if (r.status() >= 400) problems.push(`[${w}] ${path} HTTP${r.status()} ${r.url()}`); });
  await p.setViewport({ width: w, height: 850 });
  await p.goto(B + path, { waitUntil: "networkidle0", timeout: 90000 });
  const over = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (over) problems.push(`[${w}] ${path} OVERFLOW`);
  // WhatsApp FAB: present on every route except the two contact pages.
  // A position:fixed element can never trip the overflow check above, so assert it explicitly.
  const wantsFab = !/contatti|\/contact\//.test(path);
  const fab = await p.evaluate(() => {
    const el = document.querySelector("a.wa-fab");
    if (!el) return "MISSING";
    if (el.parentElement !== document.body) return "NOT-BODY-CHILD";
    return el.getAttribute("href").includes("wa.me/393338641752") ? "ok" : "BADHREF";
  });
  if (wantsFab && fab !== "ok") problems.push(`[${w}] ${path} WAFAB ${fab}`);
  if (!wantsFab && fab !== "MISSING") problems.push(`[${w}] ${path} WAFAB unexpected on contact page`);
  await p.close();
}
console.log(problems.length ? "LIVE PROBLEMS:\n" + problems.join("\n") : "LIVE sweep: all 14 routes clean at 1440+390");
// screenshots
let p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/", { waitUntil: "networkidle0" });
await p.screenshot({ path: "shots/live-home-desktop.jpg", quality: 80, type: "jpeg" });
await p.close();
p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
await p.goto(B + "/progetti/", { waitUntil: "networkidle0" });
await p.screenshot({ path: "shots/live-progetti-mobile.jpg", quality: 80, type: "jpeg" });
await p.close();
console.log("live screenshots saved");
await b.close();
