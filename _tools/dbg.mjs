import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://127.0.0.1:8099/", { waitUntil: "networkidle0" });
await p.evaluate(() => document.querySelector(".steps").scrollIntoView({ block: "center" }));
await new Promise(r => setTimeout(r, 800));
const info = await p.evaluate(() => {
  const vh = innerHeight;
  const rows = [...document.querySelectorAll(".hero__btns, .cta-band, .site-footer")].map(el => {
    const r = el.getBoundingClientRect();
    return { cls: el.className.split(" ")[0], top: Math.round(r.top), bottom: Math.round(r.bottom), intersects: r.top < vh && r.bottom > 0, hit: !!el.__waHit };
  });
  return { scrollY: Math.round(scrollY), docH: document.body.scrollHeight, vh, rows, fabIn: document.querySelector(".wa-fab").classList.contains("is-in") };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
