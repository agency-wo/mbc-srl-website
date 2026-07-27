// Generates the English mirror under /en/ (home, about, projects, contact, privacy, cookie).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const man = JSON.parse(readFileSync(join(ROOT, "assets", "img", "manifest.json"), "utf8"));

const nav = [
  { key: "home", it: "/", en: "/en/", label: "Home" },
  { key: "about", it: "/chi-siamo/", en: "/en/about/", label: "About" },
  { key: "projects", it: "/progetti/", en: "/en/projects/", label: "Projects" },
  { key: "contact", it: "/contatti/", en: "/en/contact/", label: "Contact" },
];
const LOGO = `<svg class="logo-mark" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="42" class="lm-ring"/><path d="M30 82 L46 44 L60 65 L74 44 L90 82 Z" class="lm-fill"/><rect x="47" y="60" width="3.4" height="22" class="lm-fill"/><rect x="69.6" y="60" width="3.4" height="22" class="lm-fill"/></svg>`;

/* ---- WhatsApp ---- */
const WA_NUMBER = "393338641752";
const WA_GLYPH = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/></svg>`;
const waHref = msg => `https://wa.me/${WA_NUMBER}?text=` + encodeURIComponent(msg);
const WA_MSG = {
  home: "Hello, I'm writing from your website. I'd like information and a quote for your glamping bubbles.",
  about: "Hello, I'm writing from your website. I'd like information and a quote for a turnkey wellness project.",
  projects: "Hello, I'm writing from your website. I'd like information about one of the projects I saw in your gallery.",
  legal: "Hello, I'm writing from your website. I'd like information about your wellness solutions.",
};
// `src` = data-wa-source key; pass null to omit the button entirely (contact page)
function waFab(src) {
  if (!src) return "";
  return `  <!-- WhatsApp floating button -->
  <a class="wa-fab" href="${waHref(WA_MSG[src] || WA_MSG.legal)}" target="_blank" rel="noopener noreferrer" data-wa-source="en-${src}">
    ${WA_GLYPH}
    <span class="wa-fab__label">Message us on WhatsApp &middot; +39 333 864 1752</span>
    <span class="visually-hidden"> (opens in a new window)</span>
  </a>
`;
}

function header(cur, opts = {}) {
  const itHref = opts.itHref || nav.find(n => n.key === cur)?.it || "/";
  const enHref = opts.enHref || nav.find(n => n.key === cur)?.en || "/en/";
  const items = nav.map(n => `          <li><a href="${n.en}"${n.key === cur ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join("\n");
  return `  <header class="site-header${opts.solid ? " is-solid" : ""}">
    <div class="container">
      <a class="logo" href="/en/" aria-label="MBC SRL — Home">${LOGO}<span class="logo-word"><strong>MBC</strong><em>SRL</em></span></a>
      <nav class="nav" aria-label="Main navigation">
        <ul class="nav-menu" id="nav-menu">
${items}
          <li class="nav-cta-item"><a class="btn" href="/en/contact/">Get a quote</a></li>
        </ul>
        <div class="nav-side">
          <span class="lang" aria-label="Language">
            <a href="${itHref}" hreflang="it">IT</a><span class="sep">/</span><a href="${enHref}" aria-current="true" hreflang="en">EN</a>
          </span>
          <a class="btn btn--primary btn--sm header-cta" href="/en/contact/">Get a quote</a>
          <button class="nav-toggle" aria-label="Open menu" aria-controls="nav-menu" aria-expanded="false"><span></span></button>
        </div>
      </nav>
    </div>
  </header>`;
}
const footer = `  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-about">
          <a class="logo" href="/en/" aria-label="MBC SRL — Home">${LOGO}<span class="logo-word"><strong>MBC</strong><em>SRL</em></span></a>
          <p>Glamping bubbles, wellness paths and supplies for the wellness sector. Thirty years of experience, turnkey projects tailored to you.</p>
          <div class="socials">
            <a href="#" aria-label="Instagram" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg></a>
            <a href="#" aria-label="Facebook" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v6h3v-6h2.5l.5-3h-3V9c0-.6.4-1 1-1z"/></svg></a>
          </div>
        </div>
        <div class="footer-col"><h3>Navigate</h3><ul>
          <li><a href="/en/">Home</a></li><li><a href="/en/about/">About</a></li><li><a href="/en/projects/">Projects</a></li><li><a href="/en/contact/">Contact</a></li>
        </ul></div>
        <div class="footer-col"><h3>Solutions</h3><ul>
          <li><a href="/en/projects/">Glamping bubbles</a></li><li><a href="/en/projects/">Turnkey projects</a></li><li><a href="/en/projects/">Saunas &amp; salt rooms</a></li><li><a href="/en/projects/">Hot tubs &amp; fitness</a></li>
        </ul></div>
        <div class="footer-col footer-contact"><h3>Contact</h3><ul>
          <li><a href="tel:+393338641752">+39 333 864 1752</a></li><li><a href="https://wa.me/393338641752" target="_blank" rel="noopener noreferrer">WhatsApp</a></li><li><a href="mailto:info@mbcsrl.it">info@mbcsrl.it</a></li><li>Italy · by appointment</li>
        </ul></div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-year>2026</span> MBC SRL · VAT 00000000000</span>
        <span><a href="/en/privacy/">Privacy</a> · <a href="/en/cookie/">Cookie</a></span>
      </div>
    </div>
  </footer>`;

function head({ title, desc, path, itAlt }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <script>document.documentElement.classList.add('js');</script>
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="https://www.mbcsrl.it${path}">
  <link rel="alternate" hreflang="it" href="https://www.mbcsrl.it${itAlt}">
  <link rel="alternate" hreflang="en" href="https://www.mbcsrl.it${path}">
  <link rel="alternate" hreflang="x-default" href="https://www.mbcsrl.it${itAlt}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MBC SRL">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="https://www.mbcsrl.it${path}">
  <meta property="og:image" content="https://www.mbcsrl.it/assets/img/og-share.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/img/brand/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="theme-color" content="#2D4A3A">
  <link rel="preload" href="/assets/fonts/fraunces-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/styles.css">`;
}
const arrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
function pic(slug, widths, sizes, cls, w, h, alt, extra = "") {
  const web = widths.map(x => `/assets/img/${slug}-${x}.webp ${x}w`).join(", ");
  const jpg = widths.map(x => `/assets/img/${slug}-${x}.jpg ${x}w`).join(", ");
  const mid = widths[Math.floor(widths.length / 2)] || widths[0];
  return `<picture><source type="image/webp" srcset="${web}" sizes="${sizes}"><img src="/assets/img/${slug}-${mid}.jpg" srcset="${jpg}" sizes="${sizes}" width="${w}" height="${h}" ${extra} decoding="async" alt="${alt}"></picture>`;
}
const write = (rel, html) => { mkdirSync(join(ROOT, dirname(rel)), { recursive: true }); writeFileSync(join(ROOT, rel), html); };

/* ---------------- HOME (/en/) ---------------- */
write("en/index.html", `${head({ title: "MBC SRL | Glamping bubbles & turnkey wellness paths", desc: "MBC SRL designs and supplies glamping bubbles, outdoor saunas, salt rooms and hot tubs. From a single dome to a complete turnkey wellness project. 30 years of experience.", path: "/en/", itAlt: "/" })}
</head>
<body class="has-hero">
  <a class="skip-link" href="#main">Skip to content</a>
${header("home")}
  <main id="main">
    <section class="hero">
      <div class="hero__media"><picture>
        <source media="(max-width: 700px)" type="image/webp" srcset="/assets/img/bolla-glamping-luce-notturna-800.webp 800w, /assets/img/bolla-glamping-luce-notturna-1200.webp 1200w" sizes="100vw">
        <source media="(max-width: 700px)" type="image/jpeg" srcset="/assets/img/bolla-glamping-luce-notturna-800.jpg 800w, /assets/img/bolla-glamping-luce-notturna-1200.jpg 1200w" sizes="100vw">
        <source type="image/webp" srcset="/assets/img/bolla-glamping-notte-montagne-1200.webp 1200w, /assets/img/bolla-glamping-notte-montagne-1800.webp 1800w, /assets/img/bolla-glamping-notte-montagne-2400.webp 2400w" sizes="100vw">
        <img src="/assets/img/bolla-glamping-notte-montagne-1800.jpg" srcset="/assets/img/bolla-glamping-notte-montagne-1200.jpg 1200w, /assets/img/bolla-glamping-notte-montagne-1800.jpg 1800w, /assets/img/bolla-glamping-notte-montagne-2400.jpg 2400w" sizes="100vw" width="2400" height="1600" fetchpriority="high" decoding="async" alt="Illuminated glamping dome at night in front of the Alps">
      </picture></div>
      <div class="container hero__inner">
        <span class="eyebrow" style="color:#dfa781">MBC SRL · 30 years of wellness</span>
        <h1 class="hero__title">Glamping bubbles &amp; turnkey wellness paths</h1>
        <p class="hero__sub">We design and supply transparent glamping domes, outdoor saunas, salt rooms and hot tubs. From a single bubble to a complete, tailor-made project.</p>
        <div class="hero__btns btn-row">
          <a class="btn btn--primary" href="/en/projects/">Explore projects ${arrow}</a>
          <a class="btn btn--light" href="/en/contact/">Get a quote</a>
        </div>
      </div>
    </section>
    <section class="stat-band"><div class="container section" style="padding-block:clamp(2.6rem,5vw,4rem)"><div class="stat-grid">
      <div class="stat reveal"><b>30</b><span>Years of experience in wellness</span></div>
      <div class="stat reveal" data-delay="1"><b>2</b><span>Options: supply only or turnkey</span></div>
      <div class="stat reveal" data-delay="2"><b>6</b><span>Wellness product lines</span></div>
      <div class="stat reveal" data-delay="3"><b>100%</b><span>Tailor-made projects</span></div>
    </div></div></section>
    <section class="section"><div class="container">
      <div class="section-head center reveal"><span class="eyebrow">Our solutions</span><h2>From wellness to nature, in one experience</h2>
        <p class="lead" style="margin-inline:auto">Glamping bubbles, saunas, salt rooms, hot tubs and fitness: we supply the equipment or build the entire wellness path, turnkey.</p></div>
      <div class="cards">
        ${card("bolla-glamping-esterni-crepuscolo", "Glamping bubbles", "Transparent domes to live in nature with the comfort of a room. Sold individually, also with spa and fitness area.", "Glamping bubble at dusk among the mountains")}
        ${card("vasca-idromassaggio-sauna-giorno", "Turnkey projects", "Complete wellness paths: multiple bubbles, relax areas and services. From survey to installation, we handle it all.", "Hot tub and barrel sauna on a deck with mountain view")}
        ${card("sauna-botte-ingresso", "Outdoor saunas", "Wooden barrel saunas, sturdy and charming, for regenerating heat even at high altitude.", "Entrance of the wooden barrel sauna")}
        ${card("grotta-sale-lampada", "Outdoor salt rooms", "Halotherapy environments to breathe wellness: a saline micro-climate cared for in every detail.", "Salt lamp in a wooden wellness room")}
        ${card("vasca-idromassaggio-notte", "Hot tubs", "Panoramic outdoor hot tubs to relax immersed in the landscape, by day and under the stars.", "Hot tub lit at night with a barrel sauna")}
        ${card("attrezzature-fitness-pergola", "Fitness equipment", "Treadmills, bikes and professional gym equipment to complete your wellness area.", "Professional treadmill on a pergola deck")}
      </div>
    </div></section>
    <section class="section section--tint"><div class="container"><div class="split">
      <div class="split__media split__media--tall reveal">${pic("bolla-interni-letto-notte", [640, 1000], "(max-width:860px) 100vw, 50vw", "", 1000, 1250, "Bubble interior with an illuminated double bed at night", 'loading="lazy"')}</div>
      <div class="split__body reveal" data-delay="1"><span class="eyebrow">About us</span><h2>Thirty years of wellness, now under the stars</h2>
        <p>We started as wellness specialists — beauty centres, solariums and professional supplies. Today MBC SRL specialises in glamping domes and complete wellness paths, with the same craftsmanship as always.</p>
        <ul class="ticks"><li>Three decades of experience in wellness</li><li>Equipment supply only, or a complete project</li><li>Dedicated support from design to installation</li></ul>
        <div class="btn-row mt-2"><a class="btn btn--ghost" href="/en/about/">Our story</a></div></div>
    </div></div></section>
    <section class="section"><div class="container">
      <div class="section-head center reveal"><span class="eyebrow">Turnkey</span><h2>How your wellness path takes shape</h2></div>
      <div class="steps">
        <div class="step reveal"><b></b><h3>Survey</h3><p>We analyse your space and goals, on site or remotely.</p></div>
        <div class="step reveal" data-delay="1"><b></b><h3>Design</h3><p>We lay out bubbles, relax areas and services, tailor-made.</p></div>
        <div class="step reveal" data-delay="2"><b></b><h3>Supply &amp; install</h3><p>We deliver and install every element, ready to use.</p></div>
        <div class="step reveal" data-delay="3"><b></b><h3>Wellness</h3><p>Open the doors to your guests and offer unique experiences.</p></div>
      </div>
    </div></section>
    <section class="cta-band"><div class="cta-band__media">${pic("bolla-glamping-ora-blu", [800, 1200], "100vw", "", 1200, 1600, "Glamping dome at blue hour with an alpine peak behind", 'loading="lazy"')}</div>
      <div class="container"><h2 class="reveal">Ready to create something extraordinary?</h2>
        <p class="reveal" data-delay="1">Tell us your idea: from a single bubble to a wellness village, we'll find the right tailor-made solution.</p>
        <div class="btn-row reveal" data-delay="2" style="justify-content:center"><a class="btn btn--primary" href="/en/contact/">Get a quote</a><a class="btn btn--light" href="tel:+393338641752">Call +39 333 864 1752</a></div>
      </div></section>
  </main>
${footer}
${waFab("home")}
  <script src="/assets/js/main.js" defer></script>
</body></html>`);

function card(slug, title, text, alt) {
  return `<article class="card reveal"><div class="card__media">${pic(slug, [640, 1000], "(max-width:520px) 100vw,(max-width:1024px) 50vw,33vw", "", 1000, 750, alt, 'loading="lazy"')}</div>
          <div class="card__body"><h3>${title}</h3><p>${text}</p><a class="link-arrow" href="/en/projects/">Discover ${arrow}</a></div></article>`;
}

/* ---------------- ABOUT ---------------- */
write("en/about/index.html", `${head({ title: "About us | 30 years in wellness — MBC SRL", desc: "MBC SRL: thirty years in the wellness sector, today specialising in glamping bubbles and turnkey wellness paths. Discover our story and the two options.", path: "/en/about/", itAlt: "/chi-siamo/" })}
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://www.mbcsrl.it/en/"},{"@type":"ListItem","position":2,"name":"About","item":"https://www.mbcsrl.it/en/about/"}]}</script>
</head>
<body class="has-hero">
  <a class="skip-link" href="#main">Skip to content</a>
${header("about")}
  <main id="main">
    <section class="hero hero--short"><div class="hero__media">${pic("sauna-botte-ingresso", [1000, 1600], "100vw", "", 1600, 1067, "Entrance of the wooden barrel sauna with a glowing porthole", 'fetchpriority="high" style="object-position:62% 50%"')}</div>
      <div class="container hero__inner"><span class="eyebrow" style="color:#dfa781">About us</span><h1 class="hero__title">Thirty years of wellness,<br>now under the stars</h1>
        <p class="hero__sub">From beauty centres to glamping domes: our story is a journey of care, craftsmanship and passion for wellbeing.</p></div></section>
    <section class="section"><div class="container"><div class="split">
      <div class="split__media split__media--tall reveal">${pic("grotta-sale-lampada", [640, 1000], "(max-width:860px) 100vw, 50vw", "", 1000, 1250, "Salt lamp in a wooden wellness room", 'loading="lazy"')}</div>
      <div class="split__body reveal" data-delay="1"><span class="eyebrow">Our origins</span><h2>Born in the world of wellness</h2>
        <p>For over thirty years we've worked in the wellness sector: wellness centres, solariums and professional supplies for beauty. A journey that taught us what it truly means to care for people and spaces.</p>
        <p>That know-how — made of materials, details and relationships — is today at the heart of every project.</p></div>
    </div></div></section>
    <section class="section section--tint"><div class="container"><div class="split split--rev">
      <div class="split__media split__media--tall reveal">${pic("bolla-glamping-esterni-crepuscolo", [640, 1000], "(max-width:860px) 100vw, 50vw", "", 1000, 1250, "Transparent glamping bubble at dusk among the mountains", 'loading="lazy"')}</div>
      <div class="split__body reveal" data-delay="1"><span class="eyebrow">The evolution</span><h2>Today, glamping dome specialists</h2>
        <p>We turned our wellness experience into a new specialisation: <strong>glamping bubbles</strong> and complete wellness paths. Transparent domes that become rooms immersed in nature, together with saunas, salt rooms and hot tubs.</p>
        <ul class="ticks"><li>Equipment supply only, for those who already have a project</li><li>Complete turnkey builds, from A to Z</li><li>Craftsmanship in every detail, inside and outside the bubble</li></ul></div>
    </div></div></section>
    <section class="section"><div class="container"><div class="section-head center reveal"><span class="eyebrow">Two options, one level of care</span><h2>How we can work together</h2></div>
      <div class="duo">
        <div class="feat reveal"><span class="tag">Option 1</span><h3>Equipment supply</h3><p>Buy individual bubbles and wellness equipment — also with spa and fitness area — and add them to your project. Ideal for those who already have a structure.</p></div>
        <div class="feat reveal" data-delay="1"><span class="tag">Option 2</span><h3>Turnkey project</h3><p>We design and build the entire wellness path: multiple bubbles, relax areas, saunas, hot tubs and services. From survey to installation, we handle it all.</p></div>
      </div></div></section>
    <section class="cta-band"><div class="cta-band__media">${pic("bolla-glamping-notte-montagne", [1200, 1800], "100vw", "", 1800, 1200, "Illuminated glamping dome at night in front of the Alps", 'loading="lazy"')}</div>
      <div class="container"><h2 class="reveal">Let's talk about your project</h2><p class="reveal" data-delay="1">Whether you want a single bubble or a complete wellness path, we're ready to listen.</p>
        <div class="btn-row reveal" data-delay="2" style="justify-content:center"><a class="btn btn--primary" href="/en/contact/">Contact us</a><a class="btn btn--light" href="/en/projects/">See the projects</a></div></div></section>
  </main>
${footer}
${waFab("about")}
  <script src="/assets/js/main.js" defer></script>
</body></html>`);

/* ---------------- PROJECTS ---------------- */
const catLabel = { bolle:"Bubbles", interni:"Interiors", idromassaggio:"Hot tubs", sauna:"Saunas", benessere:"Salt rooms", fitness:"Fitness" };
const fOrder = ["all","bolle","interni","idromassaggio","sauna","benessere","fitness"];
const fLabel = { all:"All", ...catLabel };
const byCat = {}; man.forEach(m => (byCat[m.cat] = byCat[m.cat] || []).push(m));
const cats = Object.keys(byCat); let ordered = [], i = 0, added = true;
while (added) { added = false; for (const c of cats) { if (byCat[c][i]) { ordered.push(byCat[c][i]); added = true; } } i++; }
const THUMB_SIZES = "(max-width:520px) 46vw, (max-width:860px) 45vw, 30vw";
const gItems = ordered.map(m => {
  const ws = [...m.widths].sort((a, b) => a - b);
  const [w1, w2] = ws;
  const mids = ws.filter(w => w >= 1000);
  const fullM = mids.length ? Math.min(...mids) : ws[ws.length - 1];
  const full = ws[ws.length - 1];
  const th = Math.round(w2 * m.h / m.w);
  const webpS = `/assets/img/${m.slug}-${w1}.webp ${w1}w, /assets/img/${m.slug}-${w2}.webp ${w2}w`;
  const jpgS = `/assets/img/${m.slug}-${w1}.jpg ${w1}w, /assets/img/${m.slug}-${w2}.jpg ${w2}w`;
  return `        <figure class="gallery-item" data-cat="${m.cat}" data-full="/assets/img/${m.slug}-${full}.jpg" data-full-m="/assets/img/${m.slug}-${fullM}.jpg">
          <picture><source type="image/webp" srcset="${webpS}" sizes="${THUMB_SIZES}"><img src="/assets/img/${m.slug}-${w2}.jpg" srcset="${jpgS}" sizes="${THUMB_SIZES}" width="${w2}" height="${th}" loading="lazy" decoding="async" alt="${m.alt_en.replace(/"/g,'&quot;')}"></picture>
          <figcaption>${m.alt_en}</figcaption></figure>`; }).join("\n");
const gFilters = fOrder.map((f, idx) => `        <button class="filter${idx===0?' is-active':''}" data-filter="${f}" aria-pressed="${idx===0}">${fLabel[f]}</button>`).join("\n");
write("en/projects/index.html", `${head({ title: "Projects & installations | Glamping bubbles, saunas & hot tubs — MBC SRL", desc: "MBC SRL projects: glamping bubbles, hot tubs, outdoor saunas and salt rooms. Browse the gallery of our wellness installations.", path: "/en/projects/", itAlt: "/progetti/" })}
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://www.mbcsrl.it/en/"},{"@type":"ListItem","position":2,"name":"Projects","item":"https://www.mbcsrl.it/en/projects/"}]}</script>
</head>
<body class="has-hero">
  <a class="skip-link" href="#main">Skip to content</a>
${header("projects")}
  <main id="main">
    <section class="hero hero--short"><div class="hero__media">${pic("vasca-idromassaggio-notte", [1000, 1600], "100vw", "", 1067, 1600, "Hot tub lit at night with a barrel sauna", 'fetchpriority="high" style="object-position:50% 38%"')}</div>
      <div class="container hero__inner"><span class="eyebrow" style="color:#dfa781">Projects</span><h1 class="hero__title">Installations that speak for themselves</h1>
        <p class="hero__sub">Glamping bubbles, wellness paths, saunas, salt rooms and hot tubs: a selection of our work.</p></div></section>
    <section class="section"><div class="container">
      <div class="filters" role="group" aria-label="Filter projects">
${gFilters}
      </div>
      <div class="masonry" data-gallery>
${gItems}
      </div></div></section>
    <section class="cta-band"><div class="cta-band__media">${pic("bolla-glamping-esterni-crepuscolo", [1000, 1600], "100vw", "", 1600, 2400, "Glamping bubble at dusk with blue mountains", 'loading="lazy"')}</div>
      <div class="container"><h2 class="reveal">Like what you see?</h2><p class="reveal" data-delay="1">We build projects like these tailor-made, from a single bubble to a complete path.</p>
        <div class="btn-row reveal" data-delay="2" style="justify-content:center"><a class="btn btn--primary" href="/en/contact/">Get a quote</a><a class="btn btn--light" href="tel:+393338641752">Call +39 333 864 1752</a></div></div></section>
  </main>
  <div class="lightbox" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Projects image gallery">
    <button class="lb-btn lb-close" type="button" aria-label="Close gallery"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <button class="lb-btn lb-prev" type="button" aria-label="Previous image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
    <img class="lightbox__img" src="" alt="">
    <button class="lb-btn lb-next" type="button" aria-label="Next image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
    <p class="lightbox__cap"></p>
  </div>
${footer}
${waFab("projects")}
  <script src="/assets/js/main.js" defer></script>
  <script src="/assets/js/gallery.js" defer></script>
</body></html>`);

/* ---------------- CONTACT ---------------- */
write("en/contact/index.html", `${head({ title: "Contact | Get a quote — MBC SRL", desc: "Contact MBC SRL for glamping bubbles, saunas, salt rooms and hot tubs. Request a quote for your supply or turnkey project.", path: "/en/contact/", itAlt: "/contatti/" })}
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://www.mbcsrl.it/en/"},{"@type":"ListItem","position":2,"name":"Contact","item":"https://www.mbcsrl.it/en/contact/"}]}</script>
</head>
<body class="has-hero">
  <a class="skip-link" href="#main">Skip to content</a>
${header("contact")}
  <main id="main">
    <section class="hero hero--short"><div class="hero__media">${pic("bolla-glamping-insegna-notte", [1000, 1600], "100vw", "", 1600, 1067, "Glamping sign illuminated at night", 'fetchpriority="high" style="object-position:50% 10%"')}</div>
      <div class="container hero__inner"><span class="eyebrow" style="color:#dfa781">Contact</span><h1 class="hero__title">Let's talk about your project</h1>
        <p class="hero__sub">Tell us your idea: we'll reply with a tailor-made proposal, from a single bubble to a complete wellness path.</p></div></section>
    <section class="section"><div class="container"><div class="contact-grid">
      <div>
        <span class="eyebrow">Request a quote</span><h2 style="margin-bottom:1.4rem">Send us a message</h2>
        <div class="form-success" aria-live="polite">Thank you! Your email client will open with the message ready — just press send. Alternatively, write to <a href="mailto:info@mbcsrl.it">info@mbcsrl.it</a>.</div>
        <form id="contact-form" novalidate>
          <div class="form-row">
            <div class="form-field"><label for="nome">Full name <span class="req">*</span></label><input type="text" id="nome" name="nome" autocomplete="name" required><span class="field-error">Please enter your name.</span></div>
            <div class="form-field"><label for="email">Email <span class="req">*</span></label><input type="email" id="email" name="email" autocomplete="email" required><span class="field-error">Please enter a valid email.</span></div>
          </div>
          <div class="form-row">
            <div class="form-field"><label for="telefono">Phone</label><input type="tel" id="telefono" name="telefono" autocomplete="tel"></div>
            <div class="form-field"><label for="oggetto">I'm interested in <span class="req">*</span></label>
              <select id="oggetto" name="oggetto" required><option value="">Select…</option><option>Glamping bubbles</option><option>Turnkey project</option><option>Outdoor sauna</option><option>Salt room</option><option>Hot tub</option><option>Fitness equipment</option><option>Other</option></select>
              <span class="field-error">Please choose an option.</span></div>
          </div>
          <div class="form-field"><label for="messaggio">Message <span class="req">*</span></label><textarea id="messaggio" name="messaggio" required></textarea><span class="field-error">Please add a few details.</span></div>
          <div class="hp" aria-hidden="true"><label>Do not fill<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
          <div class="form-field"><label class="checkbox"><input type="checkbox" name="privacy" required><span>I have read the <a href="/en/privacy/">privacy policy</a> and consent to the processing of my data to respond to my request. <span class="req">*</span></span></label><span class="field-error">You must accept to proceed.</span></div>
          <button type="submit" class="btn btn--primary">Send request ${arrow}</button>
          <p class="form-note">Pressing “Send” opens your email client with the message ready. The site stores no data.</p>
        </form>
      </div>
      <aside class="contact-card">
        <div class="info-item"><span class="ico">${WA_GLYPH}</span><div><h3>WhatsApp</h3><a href="${waHref(WA_MSG.legal)}" target="_blank" rel="noopener noreferrer" data-wa-source="en-contact-card">Message us on WhatsApp<span class="visually-hidden"> (opens in a new window)</span></a></div></div>
        <div class="info-item"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 11.5a16 16 0 0 0 6 6l1-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg></span><div><h3>Phone</h3><a href="tel:+393338641752">+39 333 864 1752</a></div></div>
        <div class="info-item"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><div><h3>Email</h3><a href="mailto:info@mbcsrl.it">info@mbcsrl.it</a> <span class="badge-soon">to be confirmed</span></div></div>
        <div class="info-item"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg></span><div><h3>Where we are</h3><p>Italy · work across the country, by appointment</p></div></div>
      </aside>
    </div></div></section>
  </main>
${footer}
${waFab(null)}
  <script src="/assets/js/main.js" defer></script>
  <script src="/assets/js/contact.js" defer></script>
</body></html>`);

/* ---------------- PRIVACY & COOKIE (EN) ---------------- */
function legal(pathSeg, title, itAlt, bodyHtml) {
  return `${head({ title: title + " — MBC SRL", desc: title + " of the MBC SRL website.", path: "/en/" + pathSeg + "/", itAlt })}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
${header("", { solid: true, itHref: itAlt, enHref: "/en/" + pathSeg + "/" })}
  <main id="main">
    <section class="page-header"><div class="container"><span class="eyebrow">Legal</span><h1>${title}</h1></div></section>
    <section class="section"><div class="container prose">${bodyHtml}</div></section>
  </main>
${footer}
${waFab("legal")}
  <script src="/assets/js/main.js" defer></script>
</body></html>`;
}
write("en/privacy/index.html", legal("privacy", "Privacy Policy", "/privacy/",
  `<p class="foot-note">Last updated: 23 July 2026 · <em>Template to be finalised with the controller's official details.</em></p>
   <h2>1. Data controller</h2><p>The data controller is <strong>MBC SRL</strong> — VAT 00000000000, phone <a href="tel:+393338641752">+39 333 864 1752</a>, email <a href="mailto:info@mbcsrl.it">info@mbcsrl.it</a>.</p>
   <h2>2. Data we collect</h2><p>Through the contact form we only collect the data you voluntarily provide: name, email, phone (optional), subject and message. The site is static and does not store form data on its servers.</p>
   <h2>3. Purpose &amp; legal basis</h2><ul><li>To respond to your information and quote requests (Art. 6.1.b GDPR).</li></ul>
   <h2>4. Recipients</h2><p>If you choose to contact us via <strong>WhatsApp</strong>, the conversation takes place on the infrastructure of WhatsApp Ireland Ltd. (Meta group), which processes the data as an autonomous controller under its own privacy policy. You can always use email or the phone instead.</p>
   <h2>5. Your rights</h2><p>You may exercise the rights under Arts. 15-22 GDPR (access, rectification, erasure, restriction, objection, portability) by writing to <a href="mailto:info@mbcsrl.it">info@mbcsrl.it</a>.</p>
   <h2>6. Cookies</h2><p>See our <a href="/en/cookie/">Cookie Policy</a>.</p>`));
write("en/cookie/index.html", legal("cookie", "Cookie Policy", "/cookie/",
  `<p class="foot-note">Last updated: 23 July 2026.</p>
   <h2>1. About cookies</h2><p>Cookies are small text files that sites store on your device to make pages work or to collect usage information.</p>
   <h2>2. Cookies used by this site</h2><p>This site is static and, in its current configuration, <strong>installs no profiling or third-party cookies</strong>. Fonts are self-hosted and no scripts, fonts or content are loaded from external services.</p>
   <p>The WhatsApp button shown on the pages is a plain link: no request is made to WhatsApp until you deliberately open it.</p>
   <h2>3. Future services</h2><p>If tools such as maps, video or analytics are added, this policy will be updated and a consent banner shown as required by law.</p>
   <h2>4. Contact</h2><p>Questions? Write to <a href="mailto:info@mbcsrl.it">info@mbcsrl.it</a>. See also our <a href="/en/privacy/">Privacy Policy</a>.</p>`));

console.log("wrote EN pages: /en/, /en/about/, /en/projects/ (" + ordered.length + " items), /en/contact/, /en/privacy/, /en/cookie/");
