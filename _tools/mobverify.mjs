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

/* 2a) hero state: over the image the header stays transparent and its chrome stays
   white. Also pins that the blur does not leak into the :not(.is-solid) state.
   (The nav LINK colour is not checked here: at <=860px `.nav-menu a { color:#fff
   !important }` for the overlay wins, so the over-hero rule only shows on desktop -
   it is asserted in section 3 instead.) */
p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
await p.goto(B + "/", { waitUntil: "networkidle0" });
const hero = await p.evaluate(() => ({
  solid: document.querySelector(".site-header").classList.contains("is-solid"),
  /* Il marchio e un solo elemento dipinto dal CSS: sopra la foto la regola
     attiva deve chiedere la variante chiara, non quella verde. Si guarda quale
     file finisce nel background-image. */
  mark: getComputedStyle(document.querySelector(".logo-mark")).backgroundImage,
  word: getComputedStyle(document.querySelector(".logo-word strong")).color,
  burger: getComputedStyle(document.querySelector(".nav-toggle span")).backgroundColor,
  hdrBf: getComputedStyle(document.querySelector(".site-header")).backdropFilter,
  beforeBf: getComputedStyle(document.querySelector(".site-header"), "::before").backdropFilter,
}));
const heroFail = [];
if (hero.solid) heroFail.push("header is-solid at scrollY 0");
if (!/logo-mark-light-/.test(hero.mark)) heroFail.push(`sopra la foto il marchio non e la variante chiara: ${hero.mark.slice(0, 90)}`);
if (hero.word !== "rgb(255, 255, 255)") heroFail.push(`logo word colour ${hero.word}`);
if (hero.burger !== "rgb(255, 255, 255)") heroFail.push(`burger bar colour ${hero.burger}`);
if (hero.hdrBf !== "none" || hero.beforeBf !== "none") heroFail.push(`blur leaked (${hero.hdrBf} / ${hero.beforeBf})`);
out.push(`hero header over-image state: ${heroFail.length ? "FAIL " + heroFail.join("; ") : "ok"}`);
await p.close();

/* 2b) REGRESSION: the overlay must be full-viewport in the .is-solid state, and the
   page behind it must not move. backdrop-filter on .site-header made the header the
   containing block for .nav-menu's inset:0, collapsing the menu into a 66px strip. */
for (const [path, prescroll, vp] of [
  ["/",          400, { width: 390, height: 844 }],  // has-hero, is-solid added by JS
  ["/privacy/",    0, { width: 390, height: 844 }],  // is-solid hard-coded in markup
  ["/en/",       400, { width: 390, height: 844 }],  // EN twin
  ["/",          400, { width: 844, height: 390 }],  // landscape short-viewport rules
]) {
  const pg = await b.newPage();
  await pg.setViewport({ ...vp, isMobile: true, hasTouch: true });
  await pg.goto(B + path, { waitUntil: "networkidle0" });
  /* instant, not smooth: html{scroll-behavior:smooth} would leave the animation in
     flight and it resumes after the lock releases, polluting the restore assertion */
  if (prescroll) { await pg.evaluate(y => scrollTo({ top: y, behavior: "instant" }), prescroll); await new Promise(r => setTimeout(r, 300)); }

  const pre = await pg.evaluate(() => ({
    solid: document.querySelector(".site-header").classList.contains("is-solid"),
    hdrBf: getComputedStyle(document.querySelector(".site-header")).backdropFilter,
    beforeBf: getComputedStyle(document.querySelector(".site-header"), "::before").backdropFilter,
    y: Math.round(scrollY),
    anchor: Math.round(document.querySelector("#main").getBoundingClientRect().top),
  }));

  await pg.click(".nav-toggle");
  await new Promise(r => setTimeout(r, 500));
  await pg.evaluate(() => scrollBy({ top: 300, behavior: "instant" })); // no-op while locked
  await new Promise(r => setTimeout(r, 200));

  const open = await pg.evaluate(() => {
    const r = document.querySelector(".nav-menu").getBoundingClientRect();
    const cta = document.querySelector(".nav-cta-item .btn").getBoundingClientRect();
    return {
      h: Math.round(r.height), top: Math.round(r.top), vh: innerHeight,
      ctaBottom: Math.round(cta.bottom),
      anchor: Math.round(document.querySelector("#main").getBoundingClientRect().top),
    };
  });

  await pg.click(".nav-toggle");
  await new Promise(r => setTimeout(r, 500));
  const post = await pg.evaluate(() => ({
    y: Math.round(scrollY),
    solid: document.querySelector(".site-header").classList.contains("is-solid"),
  }));

  const fail = [];
  if (!pre.solid) fail.push("NOT-SOLID (test is not exercising the bug)");
  if (pre.hdrBf !== "none") fail.push(`header backdrop-filter=${pre.hdrBf} (want none)`);
  if (!/blur\(10px\)/.test(pre.beforeBf)) fail.push(`::before backdrop-filter=${pre.beforeBf} (want blur(10px))`);
  if (open.h < open.vh * 0.9) fail.push(`overlay h=${open.h} vh=${open.vh} COLLAPSED`);
  if (open.top > 1) fail.push(`overlay top=${open.top} (want 0)`);
  if (open.ctaBottom > open.vh) fail.push(`CTA below the fold (${open.ctaBottom}>${open.vh})`);
  /* 1px tolerance: scroll offsets are fractional under device emulation and cannot
     round-trip exactly through a pinned `top`. The bug this guards against moved
     the page by hundreds of pixels. */
  if (Math.abs(open.anchor - pre.anchor) > 1) fail.push(`background scrolled ${pre.anchor}->${open.anchor}`);
  if (Math.abs(post.y - pre.y) > 1) fail.push(`scroll not restored ${pre.y}->${post.y}`);
  if (post.solid !== pre.solid) fail.push("is-solid lost after close");
  out.push(`navlock ${path} @${vp.width}x${vp.height} y=${pre.y}: ${fail.length ? "FAIL " + fail.join("; ") : "ok"}`);
  if (fail.length) await pg.screenshot({ path: `shots/navfail-${path.replace(/\W/g, "_")}-${vp.width}.jpg`, quality: 80, type: "jpeg" });
  await pg.close();
}

/* 3) desktop unaffected: CTA item hidden at 1440 */
p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto(B + "/", { waitUntil: "networkidle0" });
const deskHidden = await p.evaluate(() => getComputedStyle(document.querySelector(".nav-cta-item")).display === "none");
const deskNav = await p.evaluate(() => ({
  pos: getComputedStyle(document.querySelector(".nav-menu")).position,  // want static
  toggle: getComputedStyle(document.querySelector(".nav-toggle")).display, // want none
  link: getComputedStyle(document.querySelector(".nav-menu a")).color, // over hero: white
}));
out.push(`desktop nav: .nav-menu position=${deskNav.pos} (want static) | .nav-toggle display=${deskNav.toggle} (want none) | over-hero link ${deskNav.link} (want rgba(255, 255, 255, 0.92))`);
const deskLb = await p.goto(B + "/progetti/", { waitUntil: "networkidle0" }).then(() =>
  p.evaluate(() => { document.querySelector(".gallery-item").click(); return new Promise(res => setTimeout(() => res(document.querySelector(".lightbox__img").src.split("/").pop()), 400)); }));
out.push(`desktop: nav CTA hidden: ${deskHidden} | lightbox full-size: ${deskLb} (want -1200/-1600/-2400)`);
await p.close();

/* 4) sweep 12 pages at 320 + 768 (overflow/console/404) */
const pages = ["/","/chi-siamo/","/soluzioni/","/progetti/","/contatti/","/privacy/","/cookie/","/en/","/en/about/","/en/solutions/","/en/projects/","/en/contact/","/en/privacy/","/en/cookie/"];
let problems = [];
for (const path of pages) for (const w of [320, 768, 900, 844]) {
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
out.push(problems.length ? "SWEEP PROBLEMS:\n" + problems.join("\n") : "sweep 14 pages @320+768+900x700+844x390: clean");

console.log(out.join("\n"));
await b.close();
