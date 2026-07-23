import puppeteer from "puppeteer";
const B = "http://127.0.0.1:8099";
const pages = ["/","/chi-siamo/","/progetti/","/contatti/","/privacy/","/cookie/","/en/","/en/about/","/en/projects/","/en/contact/","/en/privacy/","/en/cookie/"];
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
let problems = [];

/* 1) sweep: overflow + console errors + 4xx/5xx */
for (const path of pages) {
  for (const w of [1440, 390]) {
    const p = await b.newPage(); await p.setCacheEnabled(false);
    p.on("pageerror", e => problems.push(`[${w}] ${path} JSERR ${e.message}`));
    p.on("console", m => { if (m.type() === "error") problems.push(`[${w}] ${path} CONERR ${m.text()}`); });
    p.on("response", r => { if (r.status() >= 400) problems.push(`[${w}] ${path} HTTP${r.status()} ${r.url()}`); });
    await p.setViewport({ width: w, height: 800 });
    await p.goto(B + path, { waitUntil: "networkidle0", timeout: 60000 });
    const over = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (over) problems.push(`[${w}] ${path} OVERFLOW`);
    await p.close();
  }
}
console.log("1) sweep:", problems.length ? "PROBLEMS" : "clean (12 pages x 2 viewports)");

/* 2) hover text-decoration */
let p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/", { waitUntil: "networkidle0" });
const hov = await p.evaluate(async () => {
  function deco(sel) { const el = document.querySelector(sel); el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); return getComputedStyle(el, null).textDecorationLine; }
  const r = {};
  const btn = document.querySelector(".hero .btn--primary"); btn.matches(":hover"); // hover sim via CSS not possible; check computed style rules instead
  return {
    btnRule: getComputedStyle(btn).textDecorationLine,
    footerLink: getComputedStyle(document.querySelector(".footer-col a")).textDecorationLine
  };
});
// static check is weak for :hover — evaluate stylesheet rules directly instead
const hoverRules = await p.evaluate(() => {
  let btnHoverNone = false, aHoverUnderline = false, navHoverNone = false;
  for (const sheet of document.styleSheets) for (const r of sheet.cssRules) {
    if (!r.selectorText) continue;
    if (r.selectorText.includes(".btn:hover") && r.style.textDecoration.includes("none")) btnHoverNone = true;
    if (r.selectorText === "a:hover" && r.style.textDecorationLine === "underline" || (r.selectorText === "a:hover" && r.style.textDecoration.includes("underline"))) aHoverUnderline = true;
    if (r.selectorText.includes(".nav-menu a:hover") && r.style.textDecoration.includes("none")) navHoverNone = true;
  }
  return { btnHoverNone, aHoverUnderline, navHoverNone };
});
console.log("2) hover rules:", JSON.stringify(hoverRules), (hoverRules.btnHoverNone && hoverRules.aHoverUnderline && hoverRules.navHoverNone) ? "OK" : "FAIL");
await p.close();

/* 3) anchor offset: contatti #contact-form lands below header */
p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/contatti/#contact-form", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 700));
const anchor = await p.evaluate(() => {
  const t = document.querySelector("#contact-form").getBoundingClientRect().top;
  const h = document.querySelector(".site-header").getBoundingClientRect().height;
  return { targetTop: Math.round(t), headerH: Math.round(h) };
});
console.log("3) anchor offset:", JSON.stringify(anchor), anchor.targetTop >= anchor.headerH ? "OK" : "FAIL");
await p.close();

/* 4) lightbox touch swipe on mobile viewport */
p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto(B + "/progetti/", { waitUntil: "networkidle0" });
await p.evaluate(() => document.querySelector(".gallery-item").click());
await new Promise(r => setTimeout(r, 400));
const src1 = await p.evaluate(() => document.querySelector(".lightbox__img").src);
await p.touchscreen.touchStart(300, 400); await p.touchscreen.touchMove(120, 400); await p.touchscreen.touchEnd();
await new Promise(r => setTimeout(r, 400));
const src2 = await p.evaluate(() => document.querySelector(".lightbox__img").src);
console.log("4) swipe advances image:", src1 !== src2 ? "OK" : "FAIL", "|", src1.split("/").pop(), "->", src2.split("/").pop());
await p.close();

/* 5) legal toggle round-trip */
p = await b.newPage();
await p.goto(B + "/privacy/", { waitUntil: "networkidle0" });
const en = await p.evaluate(() => document.querySelector('.lang a[hreflang="en"]').getAttribute("href"));
await p.goto(B + "/en/cookie/", { waitUntil: "networkidle0" });
const it = await p.evaluate(() => document.querySelector('.lang a[hreflang="it"]').getAttribute("href"));
const solidNow = await p.evaluate(() => document.querySelector(".site-header").className.includes("is-solid"));
console.log("5) legal toggles:", en, "&", it, (en === "/en/privacy/" && it === "/cookie/") ? "OK" : "FAIL", "| EN legal header solid:", solidNow ? "OK" : "FAIL");
await p.close();

if (problems.length) { console.log("\nPROBLEM DETAIL:"); problems.forEach(x => console.log(" ", x)); }
await b.close();
