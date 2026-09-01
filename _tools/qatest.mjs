import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const out = [];

// 1) Mobile nav toggle
let p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
await p.goto("http://127.0.0.1:8099/", { waitUntil: "networkidle0" });
// scroll first: the header only gains .is-solid past 60px, and that state is
// where the overlay used to collapse. Testing at scrollY 0 misses it entirely.
await p.evaluate(() => scrollTo({ top: 400, behavior: "instant" }));
await new Promise(r => setTimeout(r, 250));
await p.click(".nav-toggle");
/* Si aspetta la CONDIZIONE, non un numero di millisecondi. Qui c'era
   `setTimeout(400)`, ed e' esattamente la durata di
   `transition: transform .4s, visibility .4s` (styles.css:505): un pareggio con
   l'animazione. Il click cadeva su un elemento ancora `visibility: hidden` e
   puppeteer rispondeva "Node is either not clickable". Passava per fortuna, e la
   stessa sequenza fallisce tuttora sul sito pubblicato. Alzare l'attesa a 700ms
   riduceva il problema senza toglierlo: sotto carico la macchina se li mangia.
   Aspettare che il pannello sia fermo e visibile lo elimina, e il test diventa
   piu' veloce quando l'animazione finisce prima. */
await p.waitForFunction(() => {
  const m = document.querySelector(".nav-menu");
  const cs = getComputedStyle(m);
  return cs.visibility === "visible" && (cs.transform === "none" || cs.transform === "matrix(1, 0, 0, 1, 0, 0)");
}, { timeout: 5000 });
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
out.push("empty-submit invalid fields (expect 5: nome, email, oggetto, messaggio, privacy): " + invalidCount);
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
