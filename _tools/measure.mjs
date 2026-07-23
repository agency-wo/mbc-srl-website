import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless:"new", args:["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({width:1440,height:900});
await p.goto("http://127.0.0.1:8099/",{waitUntil:"networkidle0"});
const r = await p.evaluate(() => {
  const q = s => { const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return {top:Math.round(b.top+scrollY), h:Math.round(b.height), bg:getComputedStyle(e).backgroundColor}; };
  return {
    hero:q(".hero"), statBand:q(".stat-band"), statGrid:q(".stat-grid"),
    solutionsHead:q(".section .section-head"), firstCard:q(".card"),
    heroImgH: Math.round(document.querySelector(".hero__media img").getBoundingClientRect().height)
  };
});
console.log(JSON.stringify(r,null,2));
await b.close();
