import puppeteer from "puppeteer";
const B = "http://127.0.0.1:8099";
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const out = [];

/* 1) gallery: 2 columns + thumb picks 360w + lightbox picks data-full-m */
let p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto(B + "/progetti/", { waitUntil: "networkidle0" });
const cols = await p.evaluate(() => getComputedStyle(document.querySelector(".masonry")).columnCount);
const firstThumb = await p.evaluate(() => document.querySelector(".gallery-item img").currentSrc.split("/").pop());
await p.evaluate(() => document.querySelector(".gallery-item").click());
await new Promise(r => setTimeout(r, 500));
const lbSrc = await p.evaluate(() => document.querySelector(".lightbox__img").src.split("/").pop());
const capHidden = await p.evaluate(() => getComputedStyle(document.querySelector(".masonry figcaption")).display === "none");
const filtersScroll = await p.evaluate(() => { const f = document.querySelector(".filters"); return getComputedStyle(f).overflowX === "auto" && f.scrollWidth >= f.clientWidth; });
out.push(`gallery cols@390: ${cols} (want 2) | thumb: ${firstThumb} | lightbox: ${lbSrc} (want -1000/-1200) | captions hidden: ${capHidden} | filter strip scrolls: ${filtersScroll}`);
await p.close();

/* 2) mobile menu CTA visible when open; hidden chip on desktop */
p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
await p.goto(B + "/", { waitUntil: "networkidle0" });
await p.click(".nav-toggle");
await new Promise(r => setTimeout(r, 500));
const ctaVisible = await p.evaluate(() => { const el = document.querySelector(".nav-cta-item"); const r = el.getBoundingClientRect(); return getComputedStyle(el).display !== "none" && r.width > 100 && r.top > 0 && r.top < innerHeight; });
const langTap = await p.evaluate(() => { const r = document.querySelector(".lang a").getBoundingClientRect(); return Math.round(r.height); });
await p.screenshot({ path: "shots/mobile-menu-open.jpg", quality: 80, type: "jpeg" });
out.push(`mobile menu CTA visible: ${ctaVisible} | lang link height: ${langTap}px (want >=38)`);
await p.close();

/* 3) desktop unaffected: CTA item hidden at 1440 */
p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/", { waitUntil: "networkidle0" });
const deskHidden = await p.evaluate(() => getComputedStyle(document.querySelector(".nav-cta-item")).display === "none");
const deskLb = await p.goto(B + "/progetti/", { waitUntil: "networkidle0" }).then(() =>
  p.evaluate(() => { document.querySelector(".gallery-item").click(); return new Promise(res => setTimeout(() => res(document.querySelector(".lightbox__img").src.split("/").pop()), 400)); }));
out.push(`desktop: nav CTA hidden: ${deskHidden} | lightbox full-size: ${deskLb} (want -1200/-1600/-2400)`);
await p.close();

/* 4) sweep 12 pages at 320 + 768 (overflow/console/404) */
const pages = ["/","/chi-siamo/","/progetti/","/contatti/","/privacy/","/cookie/","/en/","/en/about/","/en/projects/","/en/contact/","/en/privacy/","/en/cookie/"];
let problems = [];
for (const path of pages) for (const w of [320, 768]) {
  const pg = await b.newPage(); await pg.setCacheEnabled(false);
  pg.on("pageerror", e => problems.push(`[${w}] ${path} JSERR ${e.message}`));
  pg.on("console", m => { if (m.type() === "error") problems.push(`[${w}] ${path} CONERR ${m.text()}`); });
  pg.on("response", r => { if (r.status() >= 400) problems.push(`[${w}] ${path} HTTP${r.status()} ${r.url()}`); });
  await pg.setViewport({ width: w, height: 800 });
  await pg.goto(B + path, { waitUntil: "networkidle0", timeout: 90000 });
  const over = await pg.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (over) problems.push(`[${w}] ${path} OVERFLOW`);
  await pg.close();
}
out.push(problems.length ? "SWEEP PROBLEMS:\n" + problems.join("\n") : "sweep 12 pages @320+768: clean");

console.log(out.join("\n"));
await b.close();
