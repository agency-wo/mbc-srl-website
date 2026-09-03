/* Dati della pagina /catalogo/ e /en/catalogue/, in un posto solo.

   Lo importano gen-catalogo.mjs (pagina italiana) e gen-en.mjs (inglese). Sta
   qui e non dentro un generatore perche' le due pagine devono dire gli stessi
   numeri: se la capienza della XL vive in due file, prima o poi ne cambia uno.

   DA DOVE VENGONO I NUMERI. Tutti da assets/pdf/mbc-catalogo-2026.pdf, letti
   con PyMuPDF e ricontrollati sulla pagina resa, non trascritti a memoria. Le
   pagine 10-13 danno diametro, altezza, superficie, capienza e ingombro; la 9
   da' la tabella di confronto e la nota che la accompagna.

   LA PAROLA "INDICATIVA" NON E' DECORAZIONE. Il catalogo scrive "CAPIENZA
   INDICATIVA" e "Ingombro complessivo indicativo", e la tabella porta una nota
   che dice che l'allestimento definitivo si dimensiona sul progetto. Pubblicare
   "fino a 30 persone" senza quella qualifica trasformerebbe una stima in una
   promessa. Le stringhe qui sotto se la portano dietro, e i generatori la
   ripetono in pagina.

   ATTENZIONE AI MODELLI. Questo catalogo chiama le misure S/M/L/XL. Il vecchio
   catalogo BOLLA, uscito dal sito il 1 settembre 2026 (commit 3357968), le
   chiamava 300/400/500/600 UP. Le misure coincidono, i nomi no: se salta fuori
   del testo con "600 UP" e' roba vecchia. */

/* Le quattro misure. n_* sono le forme numeriche per i dati strutturati:
   schema.org vuole un numero, la pagina mostra la virgola decimale italiana. */
export const MISURE = [
  {
    sigla: "S", pagina: 10,
    diametro: "2,40", altezza: "2,26", superficie: "4,52", ingombro: "3,11",
    n_diametro: 2.4, n_altezza: 2.26, n_superficie: 4.52,
    capienza: "2-6", n_min: 2, n_max: 6,
    titolo_it: "Compatta. Intima. Sorprendente.",
    titolo_en: "Compact. Intimate. Surprising.",
    testo_it: "La dimensione pi&ugrave; raccolta: intima, scenografica e facile da inserire in progetti diffusi o spazi contenuti.",
    testo_en: "The most intimate size: striking, and easy to place in scattered layouts or tight spaces.",
    ideale_it: "camera glamping, coppia, tavolo riservato",
    ideale_en: "glamping room, couples, reserved table",
    uso_it: "Camera / tavolo privato",
    uso_en: "Room / private table",
  },
  {
    sigla: "M", pagina: 11,
    diametro: "3,03", altezza: "2,45", superficie: "7,21", ingombro: "3,77",
    n_diametro: 3.03, n_altezza: 2.45, n_superficie: 7.21,
    capienza: "4-10", n_min: 4, n_max: 10,
    titolo_it: "Pi&ugrave; spazio per il comfort.",
    titolo_en: "More room for comfort.",
    testo_it: "Pi&ugrave; libert&agrave; di layout per una suite compatta, una zona lounge o una piccola esperienza dining.",
    testo_en: "More freedom of layout for a compact suite, a lounge area or a small dining experience.",
    ideale_it: "suite compatta, lounge, dining privato",
    ideale_en: "compact suite, lounge, private dining",
    uso_it: "Suite / lounge / dining",
    uso_en: "Suite / lounge / dining",
  },
  {
    sigla: "L", pagina: 12,
    diametro: "3,80", altezza: "2,77", superficie: "11,34", ingombro: "4,60",
    n_diametro: 3.8, n_altezza: 2.77, n_superficie: 11.34,
    capienza: "8-16", n_min: 8, n_max: 16,
    titolo_it: "La suite diventa paesaggio.",
    titolo_en: "The suite becomes landscape.",
    testo_it: "Una cupola generosa per suite premium, arredi completi, area relax o sala privata immersa nel paesaggio.",
    testo_en: "A generous dome for premium suites, full furnishing, a relaxation area or a private room set in the landscape.",
    ideale_it: "suite premium, wellness privato, sala riservata",
    ideale_en: "premium suite, private wellness, reserved room",
    uso_it: "Suite premium / sala privata",
    uso_en: "Premium suite / private room",
  },
  {
    sigla: "XL", pagina: 13,
    diametro: "5,20", altezza: "3,59", superficie: "21,22", ingombro: "6,00",
    n_diametro: 5.2, n_altezza: 3.59, n_superficie: 21.22,
    capienza: "fino a 30", capienza_en: "up to 30", n_min: null, n_max: 30,
    titolo_it: "Una sala sotto il cielo.",
    titolo_en: "A room under the sky.",
    testo_it: "La massima scala della collezione: una vera sala panoramica per ristorazione, eventi ed esperienze collettive.",
    testo_en: "The largest of the collection: a genuine panoramic room for dining, events and shared experiences.",
    ideale_it: "ristorazione, meeting, eventi, hospitality",
    ideale_en: "dining, meetings, events, hospitality",
    uso_it: "Ristorazione / eventi",
    uso_en: "Dining / events",
  },
];

/* Le 26 pagine. `cat` alimenta i filtri della galleria: gallery.js confronta
   data-cat con data-filter per uguaglianza, quindi ogni pagina ne ha una sola.
   L'alt e' anche la didascalia della lightbox (gallery.js:46-47), percio' e'
   scritto per essere letto ad alta voce, non per infilarci parole chiave. */
export const PAGINE = [
  { n: 1, cat: "panoramica", it: "Copertina del catalogo 2026, una bolla illuminata nella notte", en: "Cover of the 2026 catalogue, a bubble lit at night" },
  { n: 2, cat: "panoramica", it: "La nostra idea: non vendiamo una bolla, progettiamo una destinazione", en: "Our idea: we do not sell a bubble, we design a destination" },
  { n: 3, cat: "panoramica", it: "Chi siamo: trent&rsquo;anni di benessere, con i numeri dell&rsquo;azienda", en: "About us: thirty years in wellness, with the company figures" },
  { n: 4, cat: "panoramica", it: "Le due aree di MBC: glamping chiavi in mano e ristorazione", en: "MBC&rsquo;s two areas: turnkey glamping and hospitality" },
  { n: 5, cat: "misure", it: "La collezione in quattro misure, con i profili messi a confronto", en: "The collection in four sizes, with the profiles compared" },
  { n: 6, cat: "glamping", it: "Apertura del capitolo dedicato al glamping chiavi in mano", en: "Opening of the turnkey glamping chapter" },
  { n: 7, cat: "glamping", it: "Cosa comprende un progetto completo, in sei voci", en: "What a complete project includes, in six items" },
  { n: 8, cat: "glamping", it: "Il metodo MBC in quattro fasi, dal sopralluogo all&rsquo;apertura", en: "The MBC method in four stages, from survey to opening" },
  { n: 9, cat: "misure", it: "Tabella di confronto delle quattro misure, con diametro, superficie, altezza e capienza", en: "Comparison table of the four sizes, with diameter, floor area, height and capacity" },
  { n: 10, cat: "misure", it: "Misura S: 4,52 metri quadri, da 2 a 6 persone", en: "Size S: 4.52 square metres, 2 to 6 people" },
  { n: 11, cat: "misure", it: "Misura M: 7,21 metri quadri, da 4 a 10 persone", en: "Size M: 7.21 square metres, 4 to 10 people" },
  { n: 12, cat: "misure", it: "Misura L: 11,34 metri quadri, da 8 a 16 persone", en: "Size L: 11.34 square metres, 8 to 16 people" },
  { n: 13, cat: "misure", it: "Misura XL: 21,22 metri quadri, fino a 30 persone", en: "Size XL: 21.22 square metres, up to 30 people" },
  { n: 14, cat: "glamping", it: "Interni e comfort: letto, tende, zona lavabo e climatizzazione", en: "Interiors and comfort: bed, curtains, washbasin area and climate control" },
  { n: 15, cat: "wellness", it: "L&rsquo;ecosistema wellness: sauna, grotta di sale, idromassaggio e fitness", en: "The wellness ecosystem: sauna, salt room, hot tub and fitness" },
  { n: 16, cat: "wellness", it: "Saune e grotte di sale di produzione artigianale", en: "Hand-built saunas and salt rooms" },
  { n: 17, cat: "wellness", it: "Vasche idromassaggio e attrezzature fitness all&rsquo;aperto", en: "Hot tubs and outdoor fitness equipment" },
  { n: 18, cat: "glamping", it: "La stessa struttura in uso in ogni stagione dell&rsquo;anno", en: "The same structure in use in every season" },
  { n: 19, cat: "ristorazione", it: "Apertura del capitolo dedicato a ristorazione e hospitality", en: "Opening of the dining and hospitality chapter" },
  { n: 20, cat: "ristorazione", it: "Pi&ugrave; coperti, pi&ugrave; stagioni, pi&ugrave; valore percepito", en: "More covers, more seasons, more perceived value" },
  { n: 21, cat: "ristorazione", it: "Quattro formati d&rsquo;uso: tavolo privato, sala riservata, dehors modulare, eventi", en: "Four usage formats: private table, reserved room, modular terrace, events" },
  { n: 22, cat: "ristorazione", it: "Una bolla progettata intorno al servizio del locale", en: "A bubble designed around the way the venue serves" },
  { n: 23, cat: "ristorazione", it: "Atmosfere serali, dal tramonto alla cena", en: "Evening atmospheres, from sunset to dinner" },
  { n: 24, cat: "panoramica", it: "Dietro il progetto: misure, struttura portante e finitura", en: "Behind the project: measurements, load-bearing structure and finish" },
  { n: 25, cat: "panoramica", it: "Come iniziare: le cinque domande del primo contatto", en: "How to start: the five questions of a first conversation" },
  { n: 26, cat: "panoramica", it: "Pagina di chiusura con i contatti di MBC", en: "Closing page with MBC&rsquo;s contact details" },
];

/* I filtri. "tutte" e' il valore speciale che gallery.js:16 tratta come "mostra
   tutto"; gli altri devono combaciare con i `cat` qui sopra. */
export const FILTRI = [
  { v: "tutte", it: "Tutte", en: "All" },
  { v: "panoramica", it: "Panoramica", en: "Overview" },
  { v: "misure", it: "Misure", en: "Sizes" },
  { v: "glamping", it: "Glamping", en: "Glamping" },
  { v: "wellness", it: "Wellness", en: "Wellness" },
  { v: "ristorazione", it: "Ristorazione", en: "Hospitality" },
];

/* I sei capitoli, per l'elenco "Cosa c'e' dentro". */
export const CAPITOLI = [
  { it: "<b>Il progetto completo</b> &mdash; bolle e layout, pedane e percorsi, impianti, interni, wellness, posa e montaggio", en: "<b>The complete project</b> &mdash; bubbles and layout, decking and paths, services, interiors, wellness, delivery and assembly" },
  { it: "<b>Il metodo in quattro fasi</b> &mdash; dal sopralluogo al concept, dal coordinamento all&rsquo;apertura", en: "<b>The method in four stages</b> &mdash; from site survey to concept, from coordination to opening" },
  { it: "<b>La collezione in quattro misure</b> &mdash; diametro, superficie, altezza, capienza e ingombro di ciascuna", en: "<b>The collection in four sizes</b> &mdash; diameter, floor area, height, capacity and footprint for each" },
  { it: "<b>Interni e comfort</b> &mdash; letto e arredi, tende e privacy, zona lavabo, climatizzazione caldo e freddo", en: "<b>Interiors and comfort</b> &mdash; bed and furnishing, curtains and privacy, washbasin area, heating and cooling" },
  { it: "<b>L&rsquo;ecosistema wellness</b> &mdash; saune, grotte di sale, idromassaggio e fitness all&rsquo;aperto", en: "<b>The wellness ecosystem</b> &mdash; saunas, salt rooms, hot tubs and outdoor fitness" },
  { it: "<b>Ristorazione e hospitality</b> &mdash; quattro formati d&rsquo;uso e il conto che interessa a un gestore", en: "<b>Dining and hospitality</b> &mdash; four usage formats and the numbers an operator cares about" },
];

/* Il PDF. Il peso e' in MB decimali perche' e' cosi' che il sito ha sempre
   scritto i pesi, ed e' cosi' che lo scrive un telefono. 9.287.529 byte. */
export const PDF = {
  href: "/assets/pdf/mbc-catalogo-2026.pdf",
  nome: "MBC-Catalogo-2026.pdf",
  pagine: 26,
  peso: "9,3 MB",
};

/* La nota che accompagna la tabella a pagina 9 del catalogo, riportata parola
   per parola. Va sotto la tabella anche qui: senza, i numeri sembrano garanzie. */
export const NOTA_TABELLA = {
  it: "Le capienze sono indicative. L&rsquo;allestimento definitivo viene dimensionato sul progetto, sulla destinazione d&rsquo;uso e sulle prescrizioni applicabili.",
  en: "Capacities are indicative. The final layout is sized against the project, its intended use and the rules that apply to it.",
};
