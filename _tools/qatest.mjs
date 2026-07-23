import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const out = [];

// 1) Mobile nav toggle
let p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
await p.goto("http://127.0.0.1:8099/", { waitUntil: "networkidle0" });
await p.click(".nav-toggle");
await new Promise(r => setTimeout(r, 400));
const opened = await p.evaluate(() => document.body.classList.contains("nav-open"));
await p.click(".nav-menu a");
await new Promise(r => setTimeout(r, 300));
const closedAfterClick = await p.evaluate(() => !document.body.classList.contains("nav-open"));
out.push("mobile nav opens: " + opened + " | closes on link click: " + closedAfterClick);
await p.close();

// 2) Contact form validation (empty submit -> invalid fields)
p = await b.newPage();
await p.goto("http://127.0.0.1:8099/contatti/", { waitUntil: "networkidle0" });
await p.click("#contact-form button[type=submit]");
await new Promise(r => setTimeout(r, 200));
const invalidCount = await p.evaluate(() => document.querySelectorAll(".form-field.invalid").length);
out.push("empty-submit invalid fields (expect 4): " + invalidCount);
await p.close();

// 3) Language toggle hrefs
p = await b.newPage();
await p.goto("http://127.0.0.1:8099/contatti/", { waitUntil: "networkidle0" });
const enHref = await p.evaluate(() => document.querySelector('.lang a[hreflang="en"]').getAttribute("href"));
await p.goto("http://127.0.0.1:8099/en/contact/", { waitUntil: "networkidle0" });
const itHref = await p.evaluate(() => document.querySelector('.lang a[hreflang="it"]').getAttribute("href"));
out.push("IT contatti -> EN link: " + enHref + " (expect /en/contact/)");
out.push("EN contact -> IT link: " + itHref + " (expect /contatti/)");
await p.close();

console.log(out.join("\n"));
await b.close();
