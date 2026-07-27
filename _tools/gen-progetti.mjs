// Generates /progetti/index.html from assets/img/manifest.json
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const man = JSON.parse(readFileSync(join(ROOT, "assets", "img", "manifest.json"), "utf8"));

// Official WhatsApp glyph (single path, currentColor)
const WA_GLYPH = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/></svg>`;
const WA_HREF = "https://wa.me/393338641752?text=" + encodeURIComponent(
  "Buongiorno, vi scrivo dal vostro sito. Vorrei informazioni su una delle realizzazioni che ho visto nella galleria.");
const waFab = `  <!-- WhatsApp floating button -->
  <a class="wa-fab" href="${WA_HREF}" target="_blank" rel="noopener noreferrer" data-wa-source="progetti">
    ${WA_GLYPH}
    <span class="wa-fab__label">Scrivici su WhatsApp &middot; +39 333 864 1752</span>
    <span class="visually-hidden"> (si apre in una nuova finestra)</span>
  </a>
`;

const catLabel = { bolle:"Bolle", interni:"Interni", idromassaggio:"Idromassaggio", sauna:"Saune", benessere:"Grotte di sale", fitness:"Fitness" };
const filterOrder = ["all","bolle","interni","idromassaggio","sauna","benessere","fitness"];
const filterLabel = { all:"Tutti", ...catLabel };

// round-robin interleave by category for a lively default order
const byCat = {}; man.forEach(m => (byCat[m.cat] = byCat[m.cat] || []).push(m));
const cats = Object.keys(byCat); let ordered = []; let i = 0; let added = true;
while (added) { added = false; for (const c of cats) { if (byCat[c][i]) { ordered.push(byCat[c][i]); added = true; } } i++; }

const THUMB_SIZES = "(max-width:520px) 46vw, (max-width:860px) 45vw, 30vw";

const items = ordered.map(m => {
  const ws = [...m.widths].sort((a, b) => a - b);
  const [w1, w2] = ws;                                  // two smallest (e.g. 360, 640)
  const mids = ws.filter(w => w >= 1000);
  const fullM = mids.length ? Math.min(...mids) : ws[ws.length - 1];  // mobile lightbox size
  const full = ws[ws.length - 1];                                     // desktop lightbox size
  const th = Math.round(w2 * m.h / m.w);
  const webp = `/assets/img/${m.slug}-${w1}.webp ${w1}w, /assets/img/${m.slug}-${w2}.webp ${w2}w`;
  const jpg  = `/assets/img/${m.slug}-${w1}.jpg ${w1}w, /assets/img/${m.slug}-${w2}.jpg ${w2}w`;
  return `        <figure class="gallery-item" data-cat="${m.cat}" data-full="/assets/img/${m.slug}-${full}.jpg" data-full-m="/assets/img/${m.slug}-${fullM}.jpg">
          <picture><source type="image/webp" srcset="${webp}" sizes="${THUMB_SIZES}"><img src="/assets/img/${m.slug}-${w2}.jpg" srcset="${jpg}" sizes="${THUMB_SIZES}" width="${w2}" height="${th}" loading="lazy" decoding="async" alt="${m.alt_it.replace(/"/g,'&quot;')}"></picture>
          <figcaption>${m.alt_it}</figcaption>
        </figure>`;
}).join("\n");

const filters = filterOrder.map((f, idx) =>
  `        <button class="filter${idx===0?' is-active':''}" data-filter="${f}" aria-pressed="${idx===0}">${filterLabel[f]}</button>`
).join("\n");

const header = `  <header class="site-header">
    <div class="container">
      <a class="logo" href="/" aria-label="MBC SRL — Home">
        <svg class="logo-mark" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="42" class="lm-ring"/>
          <path d="M30 82 L46 44 L60 65 L74 44 L90 82 Z" class="lm-fill"/>
          <rect x="47" y="60" width="3.4" height="22" class="lm-fill"/>
          <rect x="69.6" y="60" width="3.4" height="22" class="lm-fill"/>
        </svg>
        <span class="logo-word"><strong>MBC</strong><em>SRL</em></span>
      </a>
      <nav class="nav" aria-label="Navigazione principale">
        <ul class="nav-menu" id="nav-menu">
          <li><a href="/">Home</a></li>
          <li><a href="/chi-siamo/">Chi siamo</a></li>
          <li><a href="/progetti/" aria-current="page">Progetti</a></li>
          <li><a href="/contatti/">Contatti</a></li>
          <li class="nav-cta-item"><a class="btn" href="/contatti/">Richiedi un preventivo</a></li>
        </ul>
        <div class="nav-side">
          <span class="lang" aria-label="Selezione lingua">
            <a href="/progetti/" aria-current="true" hreflang="it">IT</a><span class="sep">/</span><a href="/en/projects/" hreflang="en">EN</a>
          </span>
          <a class="btn btn--primary btn--sm header-cta" href="/contatti/">Preventivo</a>
          <button class="nav-toggle" aria-label="Apri il menu" aria-controls="nav-menu" aria-expanded="false"><span></span></button>
        </div>
      </nav>
    </div>
  </header>`;
const footer = `  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-about">
          <a class="logo" href="/" aria-label="MBC SRL — Home">
            <svg class="logo-mark" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="42" class="lm-ring"/>
              <path d="M30 82 L46 44 L60 65 L74 44 L90 82 Z" class="lm-fill"/>
              <rect x="47" y="60" width="3.4" height="22" class="lm-fill"/>
              <rect x="69.6" y="60" width="3.4" height="22" class="lm-fill"/>
            </svg>
            <span class="logo-word"><strong>MBC</strong><em>SRL</em></span>
          </a>
          <p>Bolle per glamping, percorsi benessere e forniture per il wellness. Trent'anni di esperienza, progetti chiavi in mano su misura.</p>
          <div class="socials">
            <a href="#" aria-label="Instagram" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg></a>
            <a href="#" aria-label="Facebook" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v6h3v-6h2.5l.5-3h-3V9c0-.6.4-1 1-1z"/></svg></a>
          </div>
        </div>
        <div class="footer-col">
          <h3>Naviga</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/chi-siamo/">Chi siamo</a></li>
            <li><a href="/progetti/">Progetti</a></li>
            <li><a href="/contatti/">Contatti</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>Soluzioni</h3>
          <ul>
            <li><a href="/progetti/">Bolle per glamping</a></li>
            <li><a href="/progetti/">Chiavi in mano</a></li>
            <li><a href="/progetti/">Saune &amp; grotte di sale</a></li>
            <li><a href="/progetti/">Idromassaggio &amp; fitness</a></li>
          </ul>
        </div>
        <div class="footer-col footer-contact">
          <h3>Contatti</h3>
          <ul>
            <li><a href="tel:+393338641752">+39 333 864 1752</a></li>
            <li><a href="https://wa.me/393338641752" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href="mailto:info@mbcsrl.it">info@mbcsrl.it</a></li>
            <li>Italia · su appuntamento</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-year>2026</span> MBC SRL · P.IVA 00000000000</span>
        <span><a href="/privacy/">Privacy</a> · <a href="/cookie/">Cookie</a></span>
      </div>
    </div>
  </footer>`;

const html = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <script>document.documentElement.classList.add('js');</script>
  <title>Progetti e realizzazioni glamping | Bolle, saune e idromassaggio — MBC SRL</title>
  <meta name="description" content="Le realizzazioni MBC SRL: bolle per glamping, vasche idromassaggio, saune da esterno e grotte di sale. Sfoglia la galleria dei nostri progetti benessere.">
  <link rel="canonical" href="https://www.mbcsrl.it/progetti/">
  <link rel="alternate" hreflang="it" href="https://www.mbcsrl.it/progetti/">
  <link rel="alternate" hreflang="en" href="https://www.mbcsrl.it/en/projects/">
  <link rel="alternate" hreflang="x-default" href="https://www.mbcsrl.it/progetti/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MBC SRL">
  <meta property="og:locale" content="it_IT">
  <meta property="og:title" content="Progetti e realizzazioni — MBC SRL">
  <meta property="og:description" content="Bolle per glamping, idromassaggio, saune e grotte di sale: sfoglia la galleria dei nostri progetti.">
  <meta property="og:url" content="https://www.mbcsrl.it/progetti/">
  <meta property="og:image" content="https://www.mbcsrl.it/assets/img/og-share.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/img/brand/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="theme-color" content="#2D4A3A">
  <link rel="preload" href="/assets/fonts/fraunces-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/styles.css">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":"https://www.mbcsrl.it/"},
    {"@type":"ListItem","position":2,"name":"Progetti","item":"https://www.mbcsrl.it/progetti/"}]}
  </script>
</head>
<body class="has-hero">
  <a class="skip-link" href="#main">Salta al contenuto</a>
${header}
  <main id="main">
    <section class="hero hero--short">
      <div class="hero__media">
        <picture>
          <source type="image/webp" srcset="/assets/img/vasca-idromassaggio-notte-1000.webp 1000w, /assets/img/vasca-idromassaggio-notte-1600.webp 1600w" sizes="100vw">
          <img src="/assets/img/vasca-idromassaggio-notte-1600.jpg" width="1067" height="1600" style="object-position:50% 38%" alt="Vasca idromassaggio illuminata di notte con sauna a botte" fetchpriority="high" decoding="async">
        </picture>
      </div>
      <div class="container hero__inner">
        <span class="eyebrow" style="color:#dfa781">Progetti</span>
        <h1 class="hero__title">Realizzazioni che parlano da sole</h1>
        <p class="hero__sub">Bolle per glamping, percorsi benessere, saune, grotte di sale e idromassaggio: una selezione dei nostri lavori.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="filters" role="group" aria-label="Filtra i progetti">
${filters}
        </div>
        <div class="masonry" data-gallery>
${items}
        </div>
      </div>
    </section>

    <section class="cta-band">
      <div class="cta-band__media">
        <picture><source type="image/webp" srcset="/assets/img/bolla-glamping-esterni-crepuscolo-1000.webp 1000w, /assets/img/bolla-glamping-esterni-crepuscolo-1600.webp 1600w" sizes="100vw">
        <img src="/assets/img/bolla-glamping-esterni-crepuscolo-1600.jpg" width="1600" height="2400" loading="lazy" decoding="async" alt="Bolla glamping trasparente al crepuscolo tra le montagne"></picture>
      </div>
      <div class="container">
        <h2 class="reveal">Ti piace quello che vedi?</h2>
        <p class="reveal" data-delay="1">Realizziamo progetti come questi su misura, dalla singola bolla al percorso completo.</p>
        <div class="btn-row reveal" data-delay="2" style="justify-content:center">
          <a class="btn btn--primary" href="/contatti/">Richiedi un preventivo</a>
          <a class="btn btn--light" href="tel:+393338641752">Chiama +39 333 864 1752</a>
        </div>
      </div>
    </section>
  </main>

  <div class="lightbox" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Galleria immagini progetti">
    <button class="lb-btn lb-close" type="button" aria-label="Chiudi galleria"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <button class="lb-btn lb-prev" type="button" aria-label="Immagine precedente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
    <img class="lightbox__img" src="" alt="">
    <button class="lb-btn lb-next" type="button" aria-label="Immagine successiva"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
    <p class="lightbox__cap"></p>
  </div>
${footer}
${waFab}
  <script src="/assets/js/main.js" defer></script>
  <script src="/assets/js/gallery.js" defer></script>
</body>
</html>
`;
writeFileSync(join(ROOT, "progetti", "index.html"), html);
console.log("wrote progetti/index.html with", ordered.length, "gallery items");
