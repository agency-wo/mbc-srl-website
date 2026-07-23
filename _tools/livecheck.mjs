import puppeteer from "puppeteer";
const B = "https://mbc-srl-preview.pages.dev";
const pages = ["/","/chi-siamo/","/progetti/","/contatti/","/privacy/","/cookie/","/en/","/en/about/","/en/projects/","/en/contact/","/en/privacy/","/en/cookie/"];
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
  await p.close();
}
console.log(problems.length ? "LIVE PROBLEMS:\n" + problems.join("\n") : "LIVE sweep: all 12 routes clean at 1440+390");
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
