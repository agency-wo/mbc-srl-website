import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const base = "http://127.0.0.1:8099";
const pages = process.argv[2] ? process.argv[2].split(",") : ["/"];

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
for (const path of pages) {
  const name = path === "/" ? "home" : path.replace(/\//g, "-").replace(/^-|-$/g, "");
  // Desktop
  let page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(base + path, { waitUntil: "networkidle0", timeout: 60000 });
  await page.screenshot({ path: join(OUT, `${name}-desktop-top.jpg`), quality: 78, type: "jpeg" });
  await autoScroll(page);
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: join(OUT, `${name}-desktop-full.jpg`), quality: 70, type: "jpeg", fullPage: true });
  await page.close();
  // Mobile
  page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await page.goto(base + path, { waitUntil: "networkidle0", timeout: 60000 });
  await autoScroll(page);
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: join(OUT, `${name}-mobile-full.jpg`), quality: 70, type: "jpeg", fullPage: true });
  await page.close();
  console.log("shot", name);
}
await browser.close();
console.log("done");

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let n = 0;
      const t = setInterval(() => {
        window.scrollBy(0, Math.round(window.innerHeight * 0.6));
        if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 2 || ++n > 60) {
          clearInterval(t); setTimeout(() => { window.scrollTo(0, 0); setTimeout(resolve, 450); }, 250);
        }
      }, 110);
    });
  });
}
