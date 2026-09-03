/* Genera catalogo/index.html.

   Perche' generata e non scritta a mano come le altre pagine italiane: sono 26
   figure di galleria che devono restare allineate ai file veri prodotti da
   rendi-catalogo.py, piu' quattro schede e una tabella che ripetono gli stessi
   numeri in tre posti diversi (schede, tabella, dati strutturati). A mano si
   sfasano al primo aggiornamento del catalogo. E' la stessa ragione per cui
   /progetti/ e' generata.

   I numeri e i testi non stanno qui: stanno in dati-catalogo.mjs, che condivide
   con gen-en.mjs. Qui c'e' solo l'impaginazione italiana.

   Le altezze delle immagini si leggono da assets/img/catalogo/manifest.json,
   cioe' misurate sul file reso, mai dedotte da una proporzione.

    node _tools/gen-catalogo.mjs
*/
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MISURE, PAGINE, FILTRI, CAPITOLI, PDF, NOTA_TABELLA } from "./dati-catalogo.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REND = JSON.parse(readFileSync(join(ROOT, "assets", "img", "catalogo", "manifest.json"), "utf8"));
const alt = (n) => REND.pagine.find((p) => p.n === n).dims;

const WA_GLYPH = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/></svg>`;
const WA_HREF = "https://wa.me/393338641752?text=" + encodeURIComponent(
  "Buongiorno, vi scrivo dal vostro sito. Ho sfogliato il catalogo 2026 e vorrei qualche informazione in piu'.");

const ARR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const GIU = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></svg>`;

/* Una pagina resa come <picture>. Due formati, come tutto il resto del sito:
   webp con il jpg come ripiego, niente avif. */
const pic = (n, sizes, cls = "") => {
  const b = `/assets/img/catalogo/catalogo-p${String(n).padStart(2, "0")}`;
  const d = alt(n);
  return `<picture>
          <source type="image/webp" srcset="${b}-400.webp 400w, ${b}-800.webp 800w" sizes="${sizes}">
          <img${cls ? ` class="${cls}"` : ""} src="${b}-800.jpg" srcset="${b}-400.jpg 400w, ${b}-800.jpg 800w" sizes="${sizes}" width="800" height="${d["800"]}" loading="lazy" decoding="async" alt="ALT">
        </picture>`;
};

/* --- le quattro schede --- */
const SIZES_MIS = "(max-width:560px) 92vw, (max-width:1024px) 46vw, 280px";
const misure = MISURE.map((m) => `          <article class="misura reveal">
        ${pic(m.pagina, SIZES_MIS).replace("ALT", `Pagina del catalogo dedicata alla misura ${m.sigla}`)}
            <div class="misura__corpo">
              <p class="misura__sigla">${m.sigla}</p>
              <h3>${m.titolo_it}</h3>
              <dl class="misura__dati">
                <div><dt>Diametro</dt><dd>&Oslash; ${m.diametro} m</dd></div>
                <div><dt>Altezza</dt><dd>${m.altezza} m</dd></div>
                <div><dt>Superficie</dt><dd>${m.superficie} m&sup2;</dd></div>
                <div><dt>Capienza indicativa</dt><dd>${m.capienza}</dd></div>
              </dl>
              <p class="misura__ingombro">Ingombro complessivo indicativo <b>${m.ingombro} m</b></p>
            </div>
          </article>`).join("\n");

/* --- la tabella di pagina 9 --- */
const righe = MISURE.map((m) => `              <tr>
                <th scope="row">${m.sigla}</th>
                <td>${m.diametro} m</td>
                <td>${m.superficie} m&sup2;</td>
                <td>${m.altezza} m</td>
                <td>${m.capienza}</td>
                <td>${m.ingombro} m</td>
                <td>${m.uso_it}</td>
              </tr>`).join("\n");

/* --- la galleria --- */
const SIZES_PAG = "(max-width:560px) 46vw, (max-width:1024px) 30vw, 240px";
const filtri = FILTRI.map((f, i) =>
  `          <button class="filter${i === 0 ? " is-active" : ""}" data-filter="${f.v}" aria-pressed="${i === 0}">${f.it}</button>`
).join("\n");

const pagine = PAGINE.map((p) => {
  const b = `/assets/img/catalogo/catalogo-p${String(p.n).padStart(2, "0")}`;
  const d = alt(p.n);
  return `          <figure class="gallery-item" data-cat="${p.cat}" data-full="${b}-1400.jpg" data-full-m="${b}-800.jpg">
            <picture>
              <source type="image/webp" srcset="${b}-400.webp 400w, ${b}-800.webp 800w" sizes="${SIZES_PAG}">
              <img src="${b}-400.jpg" srcset="${b}-400.jpg 400w, ${b}-800.jpg 800w" sizes="${SIZES_PAG}" width="400" height="${d["400"]}" loading="lazy" decoding="async" alt="${p.it}">
            </picture>
            <figcaption>Pagina ${String(p.n).padStart(2, "0")}</figcaption>
          </figure>`;
}).join("\n");

const ticks = CAPITOLI.map((c) => `            <li>${c.it}</li>`).join("\n");

/* --- dati strutturati ---
   BreadcrumbList e' la forma di casa per una pagina qualsiasi. L'ItemList di
   Product no: si aggiunge perche' questa pagina pubblica quattro prodotti con
   misure vere, ed e' un pattern gia' in uso nella stessa bottega
   (flysystem.io/bolla.html:97). Ogni valore qui sotto compare come testo
   visibile in pagina: se un giorno non fosse piu' vero in pagina, va tolto anche
   di qui. */
const prodotti = MISURE.map((m, i) => ({
  "@type": "ListItem", position: i + 1,
  item: {
    "@type": "Product",
    name: `Bolla ${m.sigla}`,
    description: `${m.titolo_it.replace(/&rsquo;/g, "'")} Superficie ${m.superficie} m2, capienza indicativa ${m.capienza} persone.`,
    brand: { "@type": "Brand", name: "MBC" },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Diametro", value: m.n_diametro, unitCode: "MTR" },
      { "@type": "PropertyValue", name: "Altezza", value: m.n_altezza, unitCode: "MTR" },
      { "@type": "PropertyValue", name: "Capienza indicativa", value: m.capienza.replace(/&rsquo;/g, "'") },
    ],
    ...(m.n_superficie ? { additionalType: "https://schema.org/Accommodation" } : {}),
  },
}));

const ld = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://manfrediconcept.it/" },
        { "@type": "ListItem", position: 2, name: "Catalogo", item: "https://manfrediconcept.it/catalogo/" },
      ],
    },
    { "@type": "ItemList", name: "Collezione Bolle MBC", itemListElement: prodotti },
  ],
};

const header = `  <header class="site-header">
    <div class="container">
      <a class="logo" href="/" aria-label="MBC SRL, Manfredi Business Concept, home">
        <span class="logo-mark" aria-hidden="true"></span>
        <span class="logo-word" aria-hidden="true"><span class="logo-word__name"></span><span class="logo-word__desc"></span></span>
      </a>
      <nav class="nav" aria-label="Navigazione principale">
        <ul class="nav-menu" id="nav-menu">
          <li><a href="/">Home</a></li>
          <li><a href="/chi-siamo/">Chi siamo</a></li>
            <li><a href="/soluzioni/">Soluzioni</a></li>
          <li><a href="/progetti/">Progetti</a></li>
          <li><a href="/catalogo/" aria-current="page">Catalogo</a></li>
          <li><a href="/contatti/">Contatti</a></li>
          <li class="nav-cta-item"><a class="btn" href="/contatti/">Richiedi un preventivo</a></li>
        </ul>
        <div class="nav-side">
          <span class="lang" aria-label="Selezione lingua">
            <a href="/catalogo/" aria-current="true" hreflang="it">IT</a><span class="sep">/</span><a href="/en/catalogue/" hreflang="en">EN</a>
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
          <a class="logo" href="/" aria-label="MBC SRL, Manfredi Business Concept, home">
            <span class="logo-mark" aria-hidden="true"></span>
            <span class="logo-word" aria-hidden="true"><span class="logo-word__name"></span><span class="logo-word__desc"></span></span>
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
            <li><a href="/soluzioni/">Soluzioni</a></li>
            <li><a href="/progetti/">Progetti</a></li>
            <li><a href="/catalogo/">Catalogo</a></li>
            <li><a href="/contatti/">Contatti</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>Soluzioni</h3>
          <ul>
            <li><a href="/soluzioni/#bolle">Bolle per glamping</a></li>
            <li><a href="/soluzioni/#chiavi-in-mano">Chiavi in mano</a></li>
            <li><a href="/soluzioni/#bar-ristoranti">Bar e ristoranti</a></li>
            <li><a href="/soluzioni/#sauna">Saune &amp; grotte di sale</a></li>
            <li><a href="/soluzioni/#idromassaggio">Idromassaggio &amp; fitness</a></li>
          </ul>
        </div>
        <div class="footer-col footer-contact">
          <h3>Contatti</h3>
          <ul>
            <li><a href="tel:+393338641752">+39 333 864 1752</a></li>
            <li><a href="https://wa.me/393338641752" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href="mailto:info@manfrediconcept.it">info@manfrediconcept.it</a></li>
            <li><strong>Showroom</strong><br>Via Cascine Dighera 2, 10090 Vialfrè (TO)</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-year>2026</span> Manfredi Business Concept SRL · P.IVA 13274090011<br>Sede legale: Via Vitaliano Donati 17, 10121 Torino (TO)</span>
        <span class="credito">Sito realizzato da <a href="https://www.marketingpro-agency.com/" target="_blank" rel="noopener"><img src="/assets/img/brand/marketingpro-credito-100.png" srcset="/assets/img/brand/marketingpro-credito-100.png 1x, /assets/img/brand/marketingpro-credito-200.png 2x, /assets/img/brand/marketingpro-credito-300.png 3x" width="100" height="23" alt="MarketingPro" loading="lazy" decoding="async"></a></span>
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
  <title>Catalogo 2026: bolle per glamping e ristorazione | MBC</title>
  <meta name="description" content="Il catalogo MBC 2026 in PDF: quattro misure di bolla con diametro, superficie e capienza, glamping chiavi in mano, wellness e ristorazione. Sfoglialo o scaricalo.">
  <link rel="canonical" href="https://manfrediconcept.it/catalogo/">
  <link rel="alternate" hreflang="it" href="https://manfrediconcept.it/catalogo/">
  <link rel="alternate" hreflang="en" href="https://manfrediconcept.it/en/catalogue/">
  <link rel="alternate" hreflang="x-default" href="https://manfrediconcept.it/catalogo/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MBC">
  <meta property="og:locale" content="it_IT">
  <meta property="og:title" content="Catalogo 2026 | MBC">
  <meta property="og:description" content="Quattro misure di bolla con misure e capienze, glamping chiavi in mano, wellness e ristorazione. 26 pagine, da sfogliare o scaricare.">
  <meta property="og:url" content="https://manfrediconcept.it/catalogo/">
  <meta property="og:image" content="https://manfrediconcept.it/assets/img/og-share.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/img/brand/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="theme-color" content="#2D4A3A">
  <link rel="preload" href="/assets/fonts/fraunces-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" as="image" type="image/webp" fetchpriority="high"
    href="/assets/img/bolla-glamping-ora-blu-1200.webp"
    imagesrcset="/assets/img/bolla-glamping-ora-blu-800.webp 800w, /assets/img/bolla-glamping-ora-blu-1200.webp 1200w"
    imagesizes="100vw">
  <link rel="stylesheet" href="/assets/css/styles.css">
  <script type="application/ld+json">
${JSON.stringify(ld, null, 2).split("\n").map((r) => "  " + r).join("\n")}
  </script>
</head>
<body class="has-hero">
  <a class="skip-link" href="#main">Salta al contenuto</a>
${header}
  <main id="main">
    <section class="hero hero--short">
      <div class="hero__media">
        <picture>
          <source type="image/webp" srcset="/assets/img/bolla-glamping-ora-blu-800.webp 800w, /assets/img/bolla-glamping-ora-blu-1200.webp 1200w" sizes="100vw">
          <img src="/assets/img/bolla-glamping-ora-blu-1200.jpg" width="1200" height="1600" style="object-position:50% 42%" alt="Bolla glamping all'ora blu con una vetta alpina sullo sfondo" fetchpriority="high" decoding="async">
        </picture>
      </div>
      <div class="container hero__inner">
        <span class="eyebrow" style="color:#dfa781">Catalogo 2026</span>
        <h1 class="hero__title">Progetti che trasformano lo spazio in esperienza</h1>
        <p class="hero__sub">Glamping chiavi in mano, ristorazione e hospitality, sei linee wellness. Ventisei pagine: sfogliale qui sotto o portale con te.</p>
        <div class="hero__btns btn-row">
          <a class="btn btn--primary" href="${PDF.href}" download="${PDF.nome}">Scarica il PDF ${GIU}</a>
          <a class="btn btn--light" href="#sfoglia">Sfoglia le ${PDF.pagine} pagine</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Collezione bolle</p>
          <h2>Quattro misure. Scegli la scala.</h2>
          <p class="lead">Dalla camera raccolta alla sala panoramica da trenta coperti. Qui ci sono i numeri per capire subito quale entra nel tuo spazio.</p>
        </div>
        <div class="misure">
${misure}
        </div>
      </div>
    </section>

    <section class="section section--tint">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">A confronto</p>
          <h2>Tutte e quattro, una riga per una</h2>
        </div>
        <div class="tab-scroll" role="group" aria-label="Tabella di confronto delle quattro misure, scorrevole orizzontalmente" tabindex="0">
          <table class="cat-tab">
            <caption>Misure e capienze della collezione Bolle, come pubblicate nel catalogo 2026.</caption>
            <thead>
              <tr>
                <th scope="col">Misura</th>
                <th scope="col">Diametro</th>
                <th scope="col">Superficie</th>
                <th scope="col">Altezza</th>
                <th scope="col">Capienza</th>
                <th scope="col">Ingombro</th>
                <th scope="col">Uso indicativo</th>
              </tr>
            </thead>
            <tbody>
${righe}
            </tbody>
          </table>
        </div>
        <p class="foot-note mt-2">${NOTA_TABELLA.it}</p>
      </div>
    </section>

    <section class="section" id="sfoglia">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Sfoglia</p>
          <h2>Il catalogo, pagina per pagina</h2>
          <p class="lead">Tocca una pagina per vederla grande. Nessun modulo, nessuna email: se preferisci averlo con te, il PDF sta qui sotto.</p>
        </div>
        <div class="filters" role="group" aria-label="Filtra le pagine del catalogo">
${filtri}
        </div>
        <div class="cat-pages reveal" data-gallery>
${pagine}
        </div>
      </div>
    </section>

    <section class="section section--green">
      <div class="container">
        <div class="split">
          <div class="split__body">
            <p class="eyebrow">Cosa c'è dentro</p>
            <h2>Sei capitoli, non un pieghevole</h2>
            <ul class="ticks">
${ticks}
            </ul>
          </div>
          <div class="split__body">
            <h3>Portalo con te</h3>
            <p>È il documento che usiamo con architetti e gestori quando si passa dall'idea al preventivo.</p>
            <div class="scarica mt-2">
              <a class="btn btn--primary" href="${PDF.href}" download="${PDF.nome}">Scarica il catalogo ${GIU}</a>
              <span class="scarica__meta">PDF · ${PDF.pagine} pagine · ${PDF.peso}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-band">
      <div class="cta-band__media">
        <picture>
          <source type="image/webp" srcset="/assets/img/bolla-glamping-luce-notturna-800.webp 800w, /assets/img/bolla-glamping-luce-notturna-1200.webp 1200w" sizes="100vw">
          <img src="/assets/img/bolla-glamping-luce-notturna-1200.jpg" width="1200" height="1600" loading="lazy" decoding="async" alt="Bolla glamping trasparente illuminata di notte tra le montagne">
        </picture>
      </div>
      <div class="container">
        <h2 class="reveal">Hai visto la misura che fa per te?</h2>
        <p class="reveal" data-delay="1">Raccontaci lo spazio: dove si trova, per chi, e quante persone deve ospitare. Al resto pensiamo noi.</p>
        <div class="btn-row reveal" data-delay="2" style="justify-content:center">
          <a class="btn btn--primary" href="/contatti/">Richiedi un preventivo ${ARR}</a>
          <a class="btn btn--light" href="tel:+393338641752">Chiama +39 333 864 1752</a>
        </div>
      </div>
    </section>
  </main>
  <div class="lightbox" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Pagine del catalogo 2026">
    <button class="lb-btn lb-close" type="button" aria-label="Chiudi la galleria"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <button class="lb-btn lb-prev" type="button" aria-label="Pagina precedente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
    <img class="lightbox__img" src="" alt="">
    <button class="lb-btn lb-next" type="button" aria-label="Pagina successiva"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
    <p class="lightbox__cap"></p>
  </div>
${footer}
  <!-- WhatsApp floating button -->
  <a class="wa-fab" href="${WA_HREF}" target="_blank" rel="noopener noreferrer" data-wa-source="catalogo">
    ${WA_GLYPH}
    <span class="wa-fab__label">Scrivici su WhatsApp &middot; +39 333 864 1752</span>
    <span class="visually-hidden"> (si apre in una nuova finestra)</span>
  </a>
  <script src="/assets/js/main.js" defer></script>
  <script src="/assets/js/gallery.js" defer></script>
</body>
</html>
`;

mkdirSync(join(ROOT, "catalogo"), { recursive: true });
writeFileSync(join(ROOT, "catalogo", "index.html"), html);
console.log(`  catalogo/index.html  ${PAGINE.length} pagine, ${MISURE.length} misure, ${FILTRI.length} filtri`);
