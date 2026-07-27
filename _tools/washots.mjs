import puppeteer from "puppeteer";
const B = "http://127.0.0.1:8099";
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
// desktop: hover-expanded label mid-page
let p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/", { waitUntil: "networkidle0" });
await p.evaluate(() => document.querySelector(".steps").scrollIntoView({ block: "center" }));
await new Promise(r => setTimeout(r, 1400));
await p.hover(".wa-fab");
await new Promise(r => setTimeout(r, 700));
await p.screenshot({ path: "shots/wa-desktop-hover.jpg", quality: 85, type: "jpeg", clip: { x: 740, y: 560, width: 700, height: 330 } });
await p.close();
// mobile: FAB over gallery
p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto(B + "/progetti/", { waitUntil: "networkidle0" });
await p.evaluate(() => window.scrollTo(0, 1500));
await new Promise(r => setTimeout(r, 1400));
await p.screenshot({ path: "shots/wa-mobile-gallery.jpg", quality: 82, type: "jpeg" });
await p.close();
// desktop: focus ring
p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/privacy/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 900));
await p.evaluate(() => document.querySelector(".wa-fab").focus());
await new Promise(r => setTimeout(r, 400));
await p.screenshot({ path: "shots/wa-focus-ring.jpg", quality: 88, type: "jpeg", clip: { x: 1040, y: 660, width: 400, height: 240 } });
await p.close();
console.log("shots saved");
await b.close();
