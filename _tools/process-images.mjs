// Session 3 - Image processing pipeline for the MBC SRL site.
// Reads curated originals from _source/photos, outputs responsive WebP+JPEG
// into /assets/img with semantic slugs, and writes /assets/img/manifest.json.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

sharp.cache(false);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "_source", "photos");
const OUT = join(ROOT, "assets", "img");
mkdirSync(OUT, { recursive: true });

const HERO_W = [2400, 1800, 1200, 800, 360];
const STD_W = [1600, 1000, 640, 360];

// Curated set. cat: bolle | interni | idromassaggio | sauna | benessere | produzione | fitness
// Optional per-item `q` overrides the default encode quality (used for already-recompressed sources).
const M = [
  // ---- BOLLE (glamping domes) ----
  { slug: "bolla-glamping-luce-notturna", src: "IMG_8387.JPG.jpeg", cat: "bolle", hero: true,
    it: "Bolla glamping trasparente illuminata di notte tra le montagne", en: "Transparent glamping bubble lit up at night in the mountains" },
  { slug: "bolla-glamping-ora-blu", src: "IMG_8386.JPG.jpeg", cat: "bolle", hero: true,
    it: "Cupola glamping all'ora blu con vetta alpina sullo sfondo", en: "Glamping dome at blue hour with an alpine peak behind" },
  { slug: "bolla-glamping-notte-insegna", src: "IMG_8377.PNG", cat: "bolle", hero: true,
    it: "Bolla glamping al crepuscolo con insegna e montagne", en: "Glamping bubble at dusk with sign and mountains" },
  { slug: "bolla-glamping-notte-montagne", src: "DSC09441.JPG.jpeg", cat: "bolle", hero: true,
    it: "Cupola glamping illuminata di notte davanti alle Alpi", en: "Illuminated glamping dome at night in front of the Alps" },
  { slug: "bolla-glamping-alba-oro", src: "WhatsApp Image 2026-07-22 at 19.00.32 (2).jpeg", cat: "bolle", hero: true,
    it: "Interno della bolla con letto e luce dorata del tramonto", en: "Bubble interior with bed and golden sunset light" },
  { slug: "bolla-glamping-esterni-crepuscolo", src: "DSC09455.JPG.jpeg", cat: "bolle",
    it: "Bolla glamping al crepuscolo con montagne blu", en: "Glamping bubble at dusk with blue mountains" },
  { slug: "bolla-glamping-tramonto-letto", src: "IMG_8379.PNG", cat: "bolle",
    it: "Bolla su pedana in legno con letto al tramonto", en: "Bubble on a wooden deck with bed at sunset" },
  // MOBILE HERO. Client regrade (2026-09) of the same frame as IMG_8380.PNG:
  // same angle and sign, but golden light on the rock face instead of flat
  // dusk. Native 1086px, so the ladder stops there -- 1000 is kept because
  // /chi-siamo/ and /progetti/ already request that rung.
  // q below default: this is the mobile LCP image and the frame is dense with
  // grass and foliage, so it encodes far heavier than the dark night photo it
  // replaces (160 KB at the default 72 against that one's 30). Measured across
  // the ladder, 58 gives 132 KB with no visible loss at phone size; going to
  // 40 only reaches 100 KB and starts to show.
  { slug: "bolla-glamping-insegna-spa", src: "bolla-glamping-insegna-spa.jpeg", cat: "bolle",
    widths: [1086, 1000, 800, 640, 360], q: { webp: 58, jpeg: 74 },
    it: "Bolla glamping con insegna Glamping & Spa", en: "Glamping bubble with a Glamping & Spa sign" },
  // NEW 2026-09. A private-garden installation, which the library had none of:
  // every other bolla shot is the alpine site. Native 1086px.
  { slug: "bolla-glamping-giardino-tramonto", src: "bolla-glamping-giardino-tramonto.jpeg", cat: "bolle",
    widths: [1086, 1000, 800, 640, 360], q: { webp: 60, jpeg: 76 },
    it: "Bolla glamping su pedana in legno al tramonto in un giardino",
    en: "Glamping bubble on a wooden deck at sunset in a garden" },
  { slug: "bolla-glamping-giardino-giorno", src: "bolla-glamping-giardino-giorno.jpeg", cat: "bolle",
    widths: [1086, 1000, 640, 360], q: { webp: 60, jpeg: 76 },
    it: "Bolla glamping in giardino con tavolino, ombrellone e ortensie",
    en: "Glamping bubble in a garden with a bistro table, parasol and hydrangeas" },
  { slug: "bolla-glamping-giorno-bosco", src: "WhatsApp Image 2026-07-22 at 19.00.31 (3).jpeg", cat: "bolle",
    it: "Bolla glamping di giorno immersa nel bosco alpino", en: "Glamping bubble by day set in the alpine forest" },
  { slug: "bolla-glamping-insegna-notte", src: "DSC09492.JPG.jpeg", cat: "bolle",
    it: "Insegna del glamping illuminata di notte", en: "Glamping sign illuminated at night" },
  // ---- Cupole fornite dal cliente (agosto 2026) ----
  // `widths` dichiarate a mano: queste sorgenti non cadono sui pioli standard e
  // la scala fissa ne butterebbe via fino a un terzo. Gli alt descrivono la
  // scena e basta: il paesaggio non e' italiano e il sito parla di installazioni
  // in Italia, quindi non le si dichiara tali.
  { slug: "cupola-neve-inverno", src: "cupola-neve-inverno.jpeg", cat: "bolle", widths: [1030, 640, 360],
    it: "Cupola geodetica sulla neve sotto un cielo terso d'inverno", en: "Geodesic dome on the snow under a clear winter sky" },
  { slug: "cupola-legno-pedana-prato", src: "cupola-legno-pedana-prato.jpeg", cat: "bolle", widths: [1536, 1000, 640, 360],
    it: "Cupola con struttura in legno e pedana, montata su un prato", en: "Dome with a wooden frame and deck, set on a lawn" },
  { slug: "cupola-giardino-primavera", src: "cupola-giardino-primavera.jpeg", cat: "bolle", widths: [1030, 640, 360],
    it: "Cupola trasparente su pedana in legno in un giardino a primavera", en: "Transparent dome on a wooden deck in a garden in spring" },
  // ---- INTERNI (bubble interiors & details) ----
  { slug: "bolla-interni-letto-notte", src: "DSC09407.JPG.jpeg", cat: "interni",
    it: "Interno della bolla con letto matrimoniale illuminato di notte", en: "Bubble interior with an illuminated double bed at night" },
  { slug: "bolla-interni-bagno-notte", src: "DSC09433.JPG.jpeg", cat: "interni",
    it: "Interno della bolla con zona lavabo e vista sulle montagne", en: "Bubble interior with washbasin area and mountain view" },
  { slug: "bolla-interni-letto-candele", src: "DSC09453.JPG.jpeg", cat: "interni",
    it: "Letto all'interno della bolla con candele accese", en: "Bed inside the bubble with lit candles" },
  { slug: "bolla-interni-tavolo-cena", src: "IMG_8292.PNG", cat: "interni",
    it: "Tavolo apparecchiato con vino all'interno della bolla", en: "Table set with wine inside the bubble" },
  { slug: "bolla-interni-aperitivo", src: "WhatsApp Image 2026-07-22 at 19.00.33 (2).jpeg", cat: "interni",
    it: "Aperitivo servito nella bolla con tende chiare", en: "Aperitif served in the bubble with light curtains" },
  // NEW 2026-09. The warmest interior in the library: made bed, floral
  // headboard, towels and candlelight.
  { slug: "bolla-interni-letto-fiori", src: "bolla-interni-letto-fiori.jpeg", cat: "interni",
    widths: [1086, 1000, 640, 360], q: { webp: 60, jpeg: 76 },
    it: "Interno della bolla con letto, testiera a fiori e asciugamani",
    en: "Bubble interior with bed, floral headboard and towels" },
  { slug: "dettaglio-lavabo-pietra", src: "DSC09438.JPG.jpeg", cat: "interni",
    it: "Dettaglio del lavabo in pietra con candela", en: "Detail of the stone washbasin with a candle" },
  { slug: "dettaglio-candele-comodino", src: "DSC09447.JPG.jpeg", cat: "interni",
    it: "Dettaglio di candele su comodino in legno", en: "Detail of candles on a wooden nightstand" },
  { slug: "dettaglio-fiori", src: "DSC09360.JPG.jpeg", cat: "interni",
    it: "Fioriture arancioni lungo la pedana in legno", en: "Orange blooms along the wooden deck" },
  // ---- IDROMASSAGGIO (hot tubs) ----
  { slug: "vasca-idromassaggio-tramonto-montagne", src: "IMG_8372.PNG", cat: "idromassaggio", hero: true,
    it: "Vasca idromassaggio da esterno con lettini al tramonto sulle Alpi", en: "Outdoor hot tub with sun loungers at sunset over the Alps" },
  // Client regrade (2026-09) of the same frame as the July source.
  { slug: "vasca-idromassaggio-luci-crepuscolo", src: "vasca-idromassaggio-luci-crepuscolo.jpeg", cat: "idromassaggio", hero: true,
    // HERO_W collapses to [800,360] against a 1086px source, and the
    // homepage card needs 640/1000 -- declared by hand instead.
    widths: [1086, 1000, 800, 640, 360], q: { webp: 60, jpeg: 76 },
    it: "Vasca idromassaggio con luci e saune a botte al crepuscolo", en: "Hot tub with string lights and barrel saunas at dusk" },
  { slug: "vasca-idromassaggio-notte", src: "DSC09463.JPG.jpeg", cat: "idromassaggio",
    it: "Vasca idromassaggio illuminata di notte con sauna a botte", en: "Hot tub lit at night with a barrel sauna" },
  { slug: "vasca-idromassaggio-sauna-giorno", src: "IMG_8321.PNG", cat: "idromassaggio",
    it: "Vasca idromassaggio e sauna a botte su pedana di giorno", en: "Hot tub and barrel sauna on a deck by day" },
  { slug: "vasca-idromassaggio-lettini", src: "WhatsApp Image 2026-07-22 at 19.00.34 (2).jpeg", cat: "idromassaggio",
    it: "Vasca idromassaggio con lettini e sauna a botte", en: "Hot tub with sun loungers and a barrel sauna" },
  { slug: "vasca-idromassaggio-luci", src: "IMG_8373.PNG", cat: "idromassaggio",
    it: "Vasca idromassaggio con luci sospese all'imbrunire", en: "Hot tub with hanging lights at nightfall" },
  // ---- Benessere fornito dal cliente (agosto 2026) ----
  { slug: "vasca-idromassaggio-terrazza-mare", src: "vasca-idromassaggio-terrazza-mare.jpeg", cat: "idromassaggio", widths: [1280, 1000, 640, 360],
    it: "Vasca idromassaggio su una terrazza affacciata sulla spiaggia", en: "Hot tub on a terrace overlooking the beach" },
  { slug: "spa-vasche-gemelle-luce-blu", src: "spa-vasche-gemelle-luce-blu.jpeg", cat: "idromassaggio", widths: [960, 640, 360],
    it: "Due vasche idromassaggio rotonde in una spa illuminata di blu", en: "Two round hot tubs in a spa lit in blue" },
  { slug: "suite-idromassaggio-candele", src: "suite-idromassaggio-candele.jpeg", cat: "idromassaggio", widths: [960, 640, 360],
    it: "Suite con vasca idromassaggio illuminata dalle candele", en: "Suite with a hot tub lit by candlelight" },
  { slug: "vasca-idromassaggio-pietra-legno", src: "vasca-idromassaggio-pietra-legno.jpeg", cat: "idromassaggio", widths: [960, 640, 360],
    it: "Vasca idromassaggio incassata con parete in pietra e pedana in legno", en: "Built-in hot tub with a stone wall and wooden decking" },
  { slug: "vasca-idromassaggio-finestra-parco", src: "vasca-idromassaggio-finestra-parco.jpeg", cat: "idromassaggio", widths: [600, 360],
    it: "Vasca idromassaggio interna davanti a una finestra ad arco affacciata sul parco", en: "Indoor hot tub in front of an arched window looking onto the park" },
  // ---- SAUNE (barrel saunas) ----
  { slug: "sauna-botte-ingresso", src: "DSC09426.JPG.jpeg", cat: "sauna",
    it: "Ingresso della sauna a botte in legno con oblò", en: "Entrance of the wooden barrel sauna with a porthole" },
  { slug: "sauna-botte-esterno-montagne", src: "WhatsApp Image 2026-07-22 at 19.00.33 (3).jpeg", cat: "sauna",
    it: "Sauna a botte da esterno con vista sulle montagne", en: "Outdoor barrel sauna with a mountain view" },
  { slug: "sauna-botte-vasca-giorno", src: "DSC09379.JPG.jpeg", cat: "sauna",
    it: "Sauna a botte e vasca esterna di giorno", en: "Barrel sauna and outdoor tub by day" },
  // ---- BENESSERE (salt room / grotta di sale) ----
  { slug: "grotta-sale-lampada", src: "DSC09401.JPG.jpeg", cat: "benessere",
    it: "Lampada di sale in ambiente benessere in legno", en: "Salt lamp in a wooden wellness room" },
  { slug: "grotta-sale-interni-botte", src: "WhatsApp Image 2026-07-22 at 19.00.32 (1).jpeg", cat: "benessere",
    it: "Interno della grotta di sale nella botte in legno", en: "Salt-room interior inside the wooden barrel" },
  { slug: "sauna-sale-interni", src: "DSC09405.JPG.jpeg", cat: "benessere",
    it: "Interno della sauna con blocco di sale e oblò", en: "Sauna interior with a salt block and porthole" },
  // ---- PRODUZIONE (own workshop: barrel-sauna build) ----
  { slug: "produzione-artigiani-misura", src: "officina-01.jpeg", cat: "produzione", q: { webp: 80, jpeg: 86 },
    it: "Due artigiani prendono le misure di una sauna a botte in laboratorio", en: "Two craftsmen measuring a barrel sauna in the workshop" },
  { slug: "produzione-telaio-acciaio", src: "officina-02.jpeg", cat: "produzione", q: { webp: 80, jpeg: 86 },
    it: "Cerchiature in acciaio della sauna a botte prima del rivestimento in legno", en: "Steel ring frames of a barrel sauna before the timber cladding" },
  { slug: "produzione-panche-interne", src: "officina-03.jpeg", cat: "produzione", q: { webp: 80, jpeg: 86 },
    it: "Sauna a botte in costruzione con cerchiature in acciaio e panca già montata", en: "Barrel sauna under construction with steel rings and a fitted bench" },
  { slug: "produzione-scocca-montaggio", src: "officina-04.jpeg", cat: "produzione", q: { webp: 80, jpeg: 86 },
    it: "Scocca della sauna a botte con telaio della porta e panche interne", en: "Barrel sauna shell with door frame and interior benches" },
  { slug: "produzione-sauna-finita-porta", src: "officina-05.jpeg", cat: "produzione", q: { webp: 80, jpeg: 86 },
    it: "Sauna a botte completata con porta a vetro, in laboratorio", en: "Completed barrel sauna with glass door, in the workshop" },
  // ---- FITNESS (gym equipment) ----
  { slug: "attrezzature-fitness-pergola", src: "WhatsApp Image 2026-07-22 at 19.00.35.jpeg", cat: "fitness",
    it: "Tapis roulant professionale su pedana con pergola e montagne", en: "Professional treadmill on a pergola deck with mountains" },
  { slug: "attrezzature-tapis-roulant-outdoor", src: "IMG_8378.PNG", cat: "fitness",
    it: "Attrezzatura fitness all'aperto con vista sulle Alpi", en: "Outdoor fitness equipment with an Alpine view" },
  // ---- Fuori galleria ----
  // `gallery: false`: il file serve su chi-siamo, ma non e' portfolio. La `cat`
  // non arriva mai ai filtri, perche' il filtro per gallery scatta prima.
  // Niente 768: l'inserto e' 236x314 CSS, quindi a 2x chiede 640 e non arriva
  // mai al 768 - erano 377 KB di binari mai referenziati.
  // `q` piu' basso perche' e' uno scatto ad alta entropia (erba, fogliame) che a
  // qualita' standard usciva a 0,236 byte/pixel, il file piu' pesante del sito
  // contro una mediana di 0,134, e per un inserto decorativo non ha senso.
  { slug: "mbc-sopralluogo-tenuta", src: "mbc-sopralluogo-tenuta.jpeg", cat: "azienda", gallery: false, widths: [640, 360], q: { webp: 62, jpeg: 68 },
    it: "Sopralluogo in una tenuta con torre in pietra", en: "A site visit at an estate with a stone tower" },
];

async function run() {
  const manifest = [];
  for (const item of M) {
    /* `widths` per voce: la scala standard salta da 640 a 1000, e sotto i 1000
       una sorgente da 960 uscirebbe al massimo a 640 - un terzo dei pixel buttato
       via prima ancora di iniziare. Le fotografie del cliente arrivano a misure
       che non cadono sui pioli standard, quindi la voce puo' dichiarare la sua
       scala. Resta il filtro `w <= srcW` piu' sotto: dichiarare una larghezza piu'
       grande della sorgente non ingrandisce niente, la scarta e basta. */
    const widths = item.widths ?? (item.hero ? HERO_W : STD_W);
    let natW = 0, natH = 0;
    const dims = {};
    const base = sharp(join(SRC, item.src), { failOn: "none" }).rotate();
    const meta = await base.metadata();
    const srcW = meta.width, srcH = meta.height;
    const usable = widths.filter(w => w <= srcW);
    if (usable.length === 0) usable.push(srcW);
    for (const w of usable) {
      const pipe = sharp(join(SRC, item.src), { failOn: "none" }).rotate().resize({ width: w, withoutEnlargement: true });
      const info = await pipe.clone().webp({ quality: item.q?.webp ?? 72 }).toFile(join(OUT, `${item.slug}-${w}.webp`));
      const jinfo = await pipe.clone().jpeg({ quality: item.q?.jpeg ?? 80, mozjpeg: true }).toFile(join(OUT, `${item.slug}-${w}.jpg`));
      if (w === usable[0]) { natW = info.width; natH = info.height; }
      /* Altezza REALE di ogni rendition, non ricalcolata dopo. sharp ridimensiona
         a partire dall'originale, quindi il suo arrotondamento non coincide con
         quello che si otterrebbe scalando la rendition piu' grande: su
         dettaglio-lavabo-pietra a 640 il file e' alto 961 e il calcolo dava 960.
         Nella masonry non c'e' aspect-ratio nel CSS, quindi width/height sono
         l'unica riserva di spazio e quel pixel e' uno spostamento vero. */
      dims[w] = jinfo.height;
    }
    /* `gallery: false` fa esistere il file senza mandarlo in vetrina. Serve per le
       fotografie che stanno su una pagina ma non sono portfolio: un ritratto, una
       foto di sede. Senza, l'unica scelta era fra non usarla e metterla in galleria. */
    manifest.push({ slug: item.slug, cat: item.cat, hero: !!item.hero, widths: usable,
      gallery: item.gallery !== false, dims,
      w: natW, h: natH, alt_it: item.it, alt_en: item.en });
    console.log(`✓ ${item.slug}  (${srcW}x${srcH} → ${usable.join(",")})`);
  }
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nWrote manifest.json with ${manifest.length} images.`);
}
run().catch(e => { console.error(e); process.exit(1); });
