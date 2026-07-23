import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.setCacheEnabled(false);
await page.goto("http://127.0.0.1:8099/", { waitUntil: "networkidle0" });
const before = await page.evaluate(() => document.querySelectorAll(".reveal.is-visible").length);
await page.evaluate(async () => {
  await new Promise(res => { let y=0; const t=setInterval(()=>{window.scrollBy(0,300);y+=300; if(y>=document.body.scrollHeight){clearInterval(t);res();}},50); });
});
await new Promise(r=>setTimeout(r,600));
const after = await page.evaluate(() => document.querySelectorAll(".reveal.is-visible").length);
const total = await page.evaluate(() => document.querySelectorAll(".reveal").length);
console.log("visible before scroll:", before, "| after scroll:", after, "| total:", total);
await browser.close();
