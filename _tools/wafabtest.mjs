import puppeteer from "puppeteer";
const B = "http://127.0.0.1:8099";
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const out = [];
const vis = p => p.evaluate(() => {
  const el = document.querySelector(".wa-fab");
  if (!el) return "none";
  const cs = getComputedStyle(el);
  return (cs.display !== "none" && cs.visibility === "visible" && +cs.opacity > .5) ? "shown" : "hidden";
});

/* 1) Home: hidden over hero CTAs, shown mid-page, hidden over footer */
let p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 900));
const atTop = await vis(p);
await p.evaluate(() => document.querySelector(".steps").scrollIntoView({ block: "center" }));
await new Promise(r => setTimeout(r, 1300));
const midPage = await vis(p);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 1300));
const atFooter = await vis(p);
out.push(`home: hero=${atTop}(want hidden) mid=${midPage}(want shown) footer=${atFooter}(want hidden)`);
await p.close();

/* 2) Legal page (no scroll listener existed there before) */
p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/privacy/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 1300));
out.push(`privacy top: ${await vis(p)} (want shown — this is the old no-listener bug)`);
await p.close();

/* 3) Mobile menu open -> FAB gone from layout AND tab order */
p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto(B + "/", { waitUntil: "networkidle0" });
await p.evaluate(() => document.querySelector(".steps").scrollIntoView({ block: "center" }));
await new Promise(r => setTimeout(r, 900));
const beforeMenu = await vis(p);
await p.click(".nav-toggle");
await new Promise(r => setTimeout(r, 900));
const withMenu = await vis(p);
out.push(`mobile: before-menu=${beforeMenu}(want shown) menu-open=${withMenu}(want hidden)`);
await p.close();

/* 4) Lightbox open -> FAB hidden */
p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto(B + "/progetti/", { waitUntil: "networkidle0" });
await p.evaluate(() => document.querySelector(".gallery-item").click());
await new Promise(r => setTimeout(r, 900));
const lbOpen = await vis(p);
const bodyCls = await p.evaluate(() => document.body.classList.contains("lb-open"));
out.push(`lightbox: fab=${lbOpen}(want hidden) body.lb-open=${bodyCls}`);
await p.close();

/* 5) Keyboard reachability + accessible name + focus ring */
p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/privacy/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 900));
const a11y = await p.evaluate(() => {
  const el = document.querySelector(".wa-fab");
  el.focus();
  const cs = getComputedStyle(el);
  return { name: el.innerText.replace(/\s+/g, " ").trim(), focused: document.activeElement === el, radius: cs.borderRadius, shadow: cs.boxShadow.includes("rgb") };
});
out.push(`a11y: focusable=${a11y.focused} radius=${a11y.radius} name="${a11y.name}"`);
await p.close();

/* 6) No-JS: button must still be visible */
p = await b.newPage(); await p.setJavaScriptEnabled(false);
await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/privacy/", { waitUntil: "domcontentloaded" });
out.push(`no-JS: ${await vis(p)} (want shown)`);
await p.close();

console.log(out.join("\n"));
await b.close();
