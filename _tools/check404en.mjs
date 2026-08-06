import puppeteer from "puppeteer";
const pages = ["/en/","/en/about/","/en/solutions/","/en/projects/","/en/contact/","/en/privacy/","/en/cookie/"];
const b = await puppeteer.launch({ headless:"new", args:["--no-sandbox"] });
let fails = [];
for (const path of pages) {
  const p = await b.newPage(); await p.setCacheEnabled(false);
  p.on("requestfailed", r => fails.push(path + " -> FAIL " + r.url()));
  p.on("response", r => { if (r.status() >= 400) fails.push(path + " -> " + r.status() + " " + r.url()); });
  await p.goto("http://127.0.0.1:8099"+path, { waitUntil:"networkidle0", timeout:60000 });
  await p.close();
}
await b.close();
console.log(fails.length ? fails.join("\n") : "EN: no 404s / no failed requests");
