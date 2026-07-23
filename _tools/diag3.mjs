import puppeteer from "puppeteer";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const udd = mkdtempSync(join(tmpdir(), "pptr-"));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox","--disk-cache-size=0"], userDataDir: udd });
const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.goto("http://127.0.0.1:8099/?nocache=" + Date.now(), { waitUntil: "networkidle0" });
await page.evaluate(async () => {
  await new Promise(res => { let n=0; const t=setInterval(()=>{window.scrollBy(0,Math.round(innerHeight*0.6)); if(scrollY+innerHeight>=document.body.scrollHeight-2||++n>60){clearInterval(t);res();}},110); });
});
await new Promise(r=>setTimeout(r,900));
const after = await page.evaluate(() => document.querySelectorAll(".reveal.is-visible").length);
const total = await page.evaluate(() => document.querySelectorAll(".reveal").length);
console.log("after gentle scroll:", after, "/", total);
await browser.close();
