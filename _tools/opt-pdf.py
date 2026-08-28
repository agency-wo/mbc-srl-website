# -*- coding: utf-8 -*-
"""Alleggerisce il catalogo per il web ricomprimendo le immagini incorporate.

Il catalogo arriva a 11,7 MB su 80 pagine, e **il 96% di quel peso sono le 91
immagini incorporate**: il resto, testo e struttura, sta in mezzo megabyte. Una
parte sono PNG che contengono fotografie, cioe' il formato sbagliato per il
contenuto, e alcune sono piu' grandi di quanto la pagina possa mostrare.

Non si rasterizzano le pagine. Sarebbe piu' semplice e darebbe file piu'
piccoli, ma butterebbe via il testo: pagina 1 ha il titolo e pagina 4 e' l'indice
bilingue "Indice | Index". Un catalogo senza testo selezionabile non si cerca,
non si copia e non si fa leggere da uno screen reader. Si ricomprimono le sole
immagini, con `rewrite_images` di PyMuPDF: layout, testo e numero di pagine
restano quelli.

La pagina misura 612x437 pt, cioe' 21,6x15,4 cm. A 150 dpi una figura a piena
pagina sta in 1275 px di larghezza: sopra quella soglia i pixel non si vedono,
si scaricano soltanto. Da qui dpi_threshold=150.

Emette anche la copertina, cioe' la pagina 1 renderizzata nelle stesse rendition
responsive del resto del sito. Sta qui e non in uno script a parte perche' e' lo
stesso lavoro: preparare il catalogo per il web. Se il cliente manda un catalogo
nuovo, un comando solo rifa' PDF e copertina, e non si rischia di aggiornare uno
e dimenticare l'altra.

    python _tools/opt-pdf.py _source/CATALOGO_BOLLA_MBC.pdf assets/pdf/catalogo-bolla-mbc.pdf

Stampa peso prima e dopo, e verifica che pagine e testo siano sopravvissuti.
"""
import sys
from pathlib import Path

import fitz
from PIL import Image

# rewrite_images pretende dpi_target < dpi_threshold: si guardano le immagini
# sopra i 151 dpi e si portano a 150. La soglia sta appena sopra il bersaglio
# perche' l'intento e' toccare tutto cio' che eccede, non solo il molto eccedente.
DPI_SOGLIA = 151
DPI = 150
QUALITA = 80


def testo_grezzo(doc):
    """Il testo esattamente com'e', spaziature comprese.

    Il confronto e' severo di proposito, e la severita' e' costata una lezione:
    con subset_fonts() attivo sparivano quattro spazi su ottanta pagine. Sembrava
    normalizzazione innocua, e normalizzando il confronto il controllo passava.
    Guardando la pagina resa si vedeva invece il vero danno, molto piu' esteso:
    nel grassetto le parole si attaccavano ("design essenziale" diventava
    "designessenziale"). Uno spazio che sparisce dal testo estratto e' il sintomo
    di una spaziatura rotta nel font, non un dettaglio: qui si confronta tutto.
    """
    return "".join(p.get_text() for p in doc)


LARGHEZZE_COP = [640, 1000]


def copertina(doc, cartella, nome="catalogo-copertina"):
    """La pagina 1 come immagine, in WebP e JPEG alle stesse larghezze del sito.

    Renderizzata a 200 dpi e poi ridotta: partire grandi e scalare da bordi piu'
    puliti che renderizzare direttamente alla misura finale.
    """
    cartella.mkdir(parents=True, exist_ok=True)
    pix = doc[0].get_pixmap(dpi=200)
    grande = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    print("\ncopertina: sorgente %dx%d" % grande.size)
    for w in LARGHEZZE_COP:
        h = round(grande.height * w / grande.width)
        im = grande.resize((w, h), Image.LANCZOS)
        for ext, opt in (("webp", {"quality": 82, "method": 6}),
                         ("jpg", {"quality": 84, "optimize": True, "progressive": True})):
            f = cartella / ("%s-%d.%s" % (nome, w, ext))
            im.save(f, **opt)
            print("  %-32s %dx%d  %d B" % (f.name, w, h, f.stat().st_size))
    return grande.size


def main(sorgente, destinazione):
    src, dst = Path(sorgente), Path(destinazione)
    if not src.exists():
        raise SystemExit("  sorgente inesistente: %s" % src)
    dst.parent.mkdir(parents=True, exist_ok=True)

    prima = src.stat().st_size
    doc = fitz.open(src)
    pagine_prima, testo_prima = doc.page_count, testo_grezzo(doc)
    print("prima:  %.2f MB, %d pagine, %d caratteri di testo"
          % (prima / 1e6, pagine_prima, len(testo_prima)))

    doc.rewrite_images(dpi_threshold=DPI_SOGLIA, dpi_target=DPI, quality=QUALITA)
    # NIENTE subset_fonts(). Misurato: rompe le spaziature del grassetto, e le
    # parole si attaccano ("design essenziale" -> "designessenziale") su tutte le
    # pagine che ne fanno uso. Il testo estratto resta identico, quindi nessun
    # controllo testuale se ne accorge: si vede solo guardando la pagina resa.
    # In cambio faceva risparmiare pochi KB, perche' qui il peso sono le foto.
    doc.save(dst, garbage=4, deflate=True, clean=True)
    doc.close()

    dopo = dst.stat().st_size
    ver = fitz.open(dst)
    pagine_dopo, testo_dopo = ver.page_count, testo_grezzo(ver)
    ver.close()

    print("dopo:   %.2f MB, %d pagine, %d caratteri di testo"
          % (dopo / 1e6, pagine_dopo, len(testo_dopo)))
    print("        %.0f%% in meno (%.2f MB risparmiati)"
          % (100 * (prima - dopo) / prima, (prima - dopo) / 1e6))

    if pagine_dopo != pagine_prima:
        raise SystemExit("  PAGINE PERSE: %d invece di %d" % (pagine_dopo, pagine_prima))
    if testo_dopo != testo_prima:
        import difflib
        d = [l for l in difflib.unified_diff(testo_prima.split(), testo_dopo.split(), n=0)
             if l[:1] in "+-" and l[:3] not in ("+++", "---")][:8]
        raise SystemExit("  TESTO CAMBIATO: %s" % " ".join(d))
    if dopo >= prima:
        print("\n  Non ha guadagnato niente: pubblicare l'originale.")
        return 1
    print("\n  pagine e testo intatti")

    ott = fitz.open(dst)
    copertina(ott, Path("assets/img"))
    ott.close()
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("uso: python _tools/opt-pdf.py <sorgente.pdf> <destinazione.pdf>")
        sys.exit(1)
    sys.exit(main(sys.argv[1], sys.argv[2]))
