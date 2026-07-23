import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless:"new", args:["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({width:1440,height:1000});
await p.goto("http://127.0.0.1:8099/",{waitUntil:"networkidle0"});
await p.evaluate(()=>window.scrollTo(0,860));
await new Promise(r=>setTimeout(r,700));
await p.screenshot({path:"shots/home-stat-cards.jpg",quality:80,type:"jpeg"});
await b.close();
