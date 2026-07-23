// Session 3 — Image processing pipeline for the MBC SRL site.
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

const HERO_W = [2400, 1800, 1200, 800];
const STD_W = [1600, 1000, 640];

// Curated set. cat: bolle | interni | idromassaggio | sauna | benessere | fitness
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
  { slug: "bolla-glamping-insegna-spa", src: "IMG_8380.PNG", cat: "bolle",
    it: "Bolla glamping con insegna Glamping & Spa", en: "Glamping bubble with a Glamping & Spa sign" },
  { slug: "bolla-glamping-giorno-bosco", src: "WhatsApp Image 2026-07-22 at 19.00.31 (3).jpeg", cat: "bolle",
    it: "Bolla glamping di giorno immersa nel bosco alpino", en: "Glamping bubble by day set in the alpine forest" },
  { slug: "bolla-glamping-insegna-notte", src: "DSC09492.JPG.jpeg", cat: "bolle",
    it: "Insegna del glamping illuminata di notte", en: "Glamping sign illuminated at night" },
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
  { slug: "dettaglio-lavabo-pietra", src: "DSC09438.JPG.jpeg", cat: "interni",
    it: "Dettaglio del lavabo in pietra con candela", en: "Detail of the stone washbasin with a candle" },
  { slug: "dettaglio-candele-comodino", src: "DSC09447.JPG.jpeg", cat: "interni",
    it: "Dettaglio di candele su comodino in legno", en: "Detail of candles on a wooden nightstand" },
  { slug: "dettaglio-fiori", src: "DSC09360.JPG.jpeg", cat: "interni",
    it: "Fioriture arancioni lungo la pedana in legno", en: "Orange blooms along the wooden deck" },
  // ---- IDROMASSAGGIO (hot tubs) ----
  { slug: "vasca-idromassaggio-tramonto-montagne", src: "IMG_8372.PNG", cat: "idromassaggio", hero: true,
    it: "Vasca idromassaggio da esterno con lettini al tramonto sulle Alpi", en: "Outdoor hot tub with sun loungers at sunset over the Alps" },
  { slug: "vasca-idromassaggio-luci-crepuscolo", src: "WhatsApp Image 2026-07-22 at 19.00.33.jpeg", cat: "idromassaggio", hero: true,
    it: "Vasca idromassaggio con luci e saune a botte al crepuscolo", en: "Hot tub with string lights and barrel saunas at dusk" },
  { slug: "vasca-idromassaggio-notte", src: "DSC09463.JPG.jpeg", cat: "idromassaggio",
    it: "Vasca idromassaggio illuminata di notte con sauna a botte", en: "Hot tub lit at night with a barrel sauna" },
  { slug: "vasca-idromassaggio-sauna-giorno", src: "IMG_8321.PNG", cat: "idromassaggio",
    it: "Vasca idromassaggio e sauna a botte su pedana di giorno", en: "Hot tub and barrel sauna on a deck by day" },
  { slug: "vasca-idromassaggio-lettini", src: "WhatsApp Image 2026-07-22 at 19.00.34 (2).jpeg", cat: "idromassaggio",
    it: "Vasca idromassaggio con lettini e sauna a botte", en: "Hot tub with sun loungers and a barrel sauna" },
  { slug: "vasca-idromassaggio-luci", src: "IMG_8373.PNG", cat: "idromassaggio",
    it: "Vasca idromassaggio con luci sospese all'imbrunire", en: "Hot tub with hanging lights at nightfall" },
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
  // ---- FITNESS (gym equipment) ----
  { slug: "attrezzature-fitness-pergola", src: "WhatsApp Image 2026-07-22 at 19.00.35.jpeg", cat: "fitness",
    it: "Tapis roulant professionale su pedana con pergola e montagne", en: "Professional treadmill on a pergola deck with mountains" },
  { slug: "attrezzature-tapis-roulant-outdoor", src: "IMG_8378.PNG", cat: "fitness",
    it: "Attrezzatura fitness all'aperto con vista sulle Alpi", en: "Outdoor fitness equipment with an Alpine view" },
];

async function run() {
  const manifest = [];
  for (const item of M) {
    const widths = item.hero ? HERO_W : STD_W;
    let natW = 0, natH = 0;
    const base = sharp(join(SRC, item.src), { failOn: "none" }).rotate();
    const meta = await base.metadata();
    const srcW = meta.width, srcH = meta.height;
    const usable = widths.filter(w => w <= srcW);
    if (usable.length === 0) usable.push(srcW);
    for (const w of usable) {
      const pipe = sharp(join(SRC, item.src), { failOn: "none" }).rotate().resize({ width: w, withoutEnlargement: true });
      const info = await pipe.clone().webp({ quality: 72 }).toFile(join(OUT, `${item.slug}-${w}.webp`));
      await pipe.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, `${item.slug}-${w}.jpg`));
      if (w === usable[0]) { natW = info.width; natH = info.height; }
    }
    manifest.push({ slug: item.slug, cat: item.cat, hero: !!item.hero, widths: usable,
      w: natW, h: natH, alt_it: item.it, alt_en: item.en });
    console.log(`✓ ${item.slug}  (${srcW}x${srcH} → ${usable.join(",")})`);
  }
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nWrote manifest.json with ${manifest.length} images.`);
}
run().catch(e => { console.error(e); process.exit(1); });
