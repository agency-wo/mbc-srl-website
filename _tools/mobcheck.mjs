import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:8099/", { waitUntil: "networkidle0" });
const src = await p.evaluate(() => document.querySelector(".hero__media img").currentSrc);
console.log("mobile hero currentSrc:", src.split("/").pop());
await p.screenshot({ path: "shots/home-mobile-hero.jpg", quality: 82, type: "jpeg" });
// desktop check too
const p2 = await b.newPage();
await p2.setViewport({ width: 1440, height: 900 });
await p2.goto("http://127.0.0.1:8099/", { waitUntil: "networkidle0" });
console.log("desktop hero currentSrc:", await p2.evaluate(() => document.querySelector(".hero__media img").currentSrc).then(s => s.split("/").pop()));
await b.close();
