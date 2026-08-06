# MBC SRL — Sito web

Sito statico (HTML + CSS + JavaScript, nessun framework) per **MBC SRL** —
bolle per glamping, saune, grotte di sale, vasche idromassaggio e attrezzature fitness.
Bilingue **Italiano (predefinito)** + **Inglese** (`/en/`), pensato per hosting su
**GitHub Pages + Cloudflare**.

---

## Anteprima in locale
Dalla cartella del progetto:
```bash
python -m http.server 8099
# poi apri http://127.0.0.1:8099/
```
(oppure l'estensione "Live Server" di VS Code).

## Struttura
```
index.html            Home (IT)   /chi-siamo/  /soluzioni/  /progetti/  /contatti/
/en/…                 mirror inglese  /en/about/  /en/solutions/  /en/projects/  /en/contact/
/privacy/  /cookie/   pagine legali (IT) + /en/privacy/ /en/cookie/
/assets/css/styles.css     tutto lo stile
/assets/js/            main.js (header, menu, animazioni) · gallery.js (galleria+lightbox) · contact.js (form)
/assets/fonts/         font self-hosted (Fraunces + Inter, woff2)
/assets/img/           immagini web ottimizzate (webp + jpg) + manifest.json
/assets/img/brand/     logo (svg) e favicon
robots.txt · sitemap.xml · .nojekyll
_source/               foto originali ad alta risoluzione (NON nel repo — vedi .gitignore)
_tools/                script di generazione/QA (nel repo; node_modules e output esclusi)
```

## Modificare i contenuti
- **Testi**: si trovano direttamente nei file `.html` di ciascuna pagina.
- **Galleria progetti**: è generata da `assets/img/manifest.json`. Dopo aver modificato/aggiunto
  immagini, rigenera le pagine:
  ```bash
  cd _tools
  node process-images.mjs   # ottimizza le nuove foto in /assets/img (+ aggiorna manifest)
  node gen-progetti.mjs      # rigenera /progetti/index.html (categorie chip: vedi catLabel/filterOrder)
  node gen-en.mjs            # rigenera le pagine /en/ (incl. /en/projects/)
  ```
  Per aggiungere foto: mettile in `_source/photos/`, poi aggiungi una voce nell'array `M`
  dentro `_tools/process-images.mjs` (slug, file, categoria, alt IT/EN) e ri-esegui i comandi sopra.

---

## ⚠️ Da completare prima della pubblicazione (placeholder)
Cerca questi valori e sostituiscili con quelli reali (sono ripetuti in tutte le pagine):
| Placeholder | Dove | Sostituire con |
|---|---|---|
| `info@mbcsrl.it` | footer, contatti, contact.js | email reale |
| `P.IVA 00000000000` / `VAT 00000000000` | footer | Partita IVA reale |
| `https://www.mbcsrl.it` | canonical, og, sitemap, JSON-LD | dominio definitivo |
| indirizzo "Italia · su appuntamento" | footer, contatti, privacy | sede/area reale |
| social `href="#"` (Instagram, Facebook) | footer | URL profili reali |
| tagline / claim | hero home | eventuale claim scelto |

Il **numero di telefono `+39 333 864 1752`** è già inserito ovunque (footer, contatti, click-to-call, JSON-LD).

I **2 file HEIC** (`IMG_8301`, `IMG_8367`) non sono stati convertiti (manca il codec HEVC): se servono,
riesportali in JPEG e aggiungili con la procedura sopra.

---

## Anteprima cliente (Cloudflare Pages)
Il sito è visibile in anteprima su **https://mbc-srl-preview.pages.dev** (non indicizzato dai motori
di ricerca — header `X-Robots-Tag: noindex` aggiunto solo al deploy, non nel repo).
Per aggiornare l'anteprima dopo nuovi commit:
```bash
STAGE=$(mktemp -d) && git archive HEAD | tar -x -C "$STAGE" \
  && rm -rf "$STAGE/_tools" "$STAGE/README.md" "$STAGE/.gitignore" \
  && printf '/*\n  X-Robots-Tag: noindex\n' > "$STAGE/_headers" \
  && npx wrangler pages deploy "$STAGE" --project-name=mbc-srl-preview --branch=main --commit-dirty=true
```
Quando arriverà il dominio definitivo basterà collegarlo allo stesso progetto Cloudflare Pages
(senza header noindex) oppure attivare GitHub Pages come da sezione seguente.

## Pubblicazione (GitHub Pages + Cloudflare)
1. Crea un repository su GitHub e carica il contenuto di questa cartella (root del repo).
   Il file `.nojekyll` è già presente (evita che GitHub Pages ignori alcune cartelle).
2. **Settings → Pages → Source: `main` / root**. Il sito sarà online su `https://<utente>.github.io/<repo>/`.
3. **Dominio personalizzato**: crea un file `CNAME` nella root con il dominio (es. `www.mbcsrl.it`)
   e imposta i DNS su **Cloudflare**:
   - record `CNAME www` → `<utente>.github.io` (proxy attivo)
   - SSL/TLS: **Full**, "Always Use HTTPS" attivo.
4. Aggiorna il dominio nei placeholder (canonical/OG/sitemap) come sopra.

## Collegare il modulo contatti (quando vorrai)
Oggi il form apre il programma di posta dell'utente (`mailto:`), senza backend.
Per riceverli via email automaticamente (gratis) con **Formspree**:
1. Crea un form su formspree.io e ottieni l'endpoint `https://formspree.io/f/xxxx`.
2. In `contatti/index.html` (e `/en/contact/`) imposta sul `<form>`:
   `action="https://formspree.io/f/xxxx" method="POST"`.
3. In `assets/js/contact.js` rimuovi il ramo `mailto:` (invio nativo del form) mantenendo la validazione.

## WhatsApp
Il pulsante flottante WhatsApp è **attivo** su tutte le pagine tranne `/contatti/` e `/en/contact/`
(dove il modulo è già la call to action). Compare solo quando nessun altro CTA è visibile a schermo
— logica in `assets/js/main.js` (IntersectionObserver su `.hero__btns`, `.cta-band`, `.site-footer`).
Numero e messaggi precompilati si cambiano in un punto solo per lingua:
`_tools/gen-progetti.mjs` (IT generato), `_tools/gen-en.mjs` (`WA_NUMBER` / `WA_MSG`, EN) e
nelle 5 pagine IT scritte a mano (`index`, `chi-siamo`, `soluzioni`, `privacy`, `cookie`).

---

## Note tecniche
- **Prestazioni**: immagini responsive (webp+jpg, `srcset`), font self-hosted con `preload`,
  JS in `defer`, hero in `preload`/`fetchpriority`.
- **SEO**: title/description unici per pagina, canonical, `hreflang` IT/EN, Open Graph,
  dati strutturati JSON-LD (LocalBusiness + BreadcrumbList), `sitemap.xml`, `robots.txt`.
- **Accessibilità**: HTML semantico, skip link, focus visibile, `prefers-reduced-motion`,
  galleria e menu navigabili da tastiera, testi alternativi su tutte le immagini.
- **GDPR**: font ospitati localmente (nessuna chiamata a Google Fonts), nessun cookie di terze parti,
  pagine Privacy e Cookie incluse (da personalizzare con i dati del titolare).
