# -*- coding: utf-8 -*-
"""Rende le pagine del catalogo PDF in immagini per la galleria di /catalogo/.

    python _tools/rendi-catalogo.py            # elenca cosa farebbe
    python _tools/rendi-catalogo.py --applica  # scrive i file

PERCHE' WEBP + JPG E NON AVIF. Il sito non ha un solo file avif: sono 150 jpg e
149 webp, e il `sharp` installato qui non sa scrivere avif (`format.avif.output`
e' false, mentre heif e' true). Aggiungere un terzo formato solo per questa
pagina spezzerebbe la convenzione senza guadagno misurato.

PERCHE' TRE LARGHEZZE E NON QUATTRO. 400 per la griglia su telefono, 800 per la
griglia su desktop, 1400 per la lightbox. Misurato prima di scrivere il codice,
su quattro pagine campione: tutte e ventisei a tre larghezze nei due formati
costano 7,4 MB. La quarta larghezza non serviva a niente perche' queste sono
pagine di documento, non fotografie a piena pagina.

LE ALTEZZE SI MISURANO, NON SI CALCOLANO. Il manifest registra l'altezza reale
di ogni file reso, non `larghezza / proporzione` arrotondato. In questa stessa
sessione, su un altro progetto, un'altezza dedotta invece che misurata ha fatto
dichiarare `width`/`height` sbagliati e ha prodotto un salto di layout vero.

NON TOCCA IL PDF. Solo `get_pixmap()`. Il file di partenza resta identico, e
sotto i 25 MiB di Cloudflare Pages non serve nemmeno ricomprimerlo.
"""
import io
import json
import sys
from pathlib import Path

import fitz
from PIL import Image

RADICE = Path(__file__).resolve().parent.parent
PDF = RADICE / "assets" / "pdf" / "mbc-catalogo-2026.pdf"
FUORI = RADICE / "assets" / "img" / "catalogo"

LARGHEZZE = (400, 800, 1400)
Q_WEBP = 80
Q_JPG = 82


def rendi(pagina, larghezza):
    """Una pagina a una larghezza, come immagine Pillow."""
    zoom = larghezza / pagina.rect.width
    pix = pagina.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def main(applica):
    if not PDF.exists():
        raise SystemExit("  manca %s" % PDF.relative_to(RADICE))

    doc = fitz.open(PDF)
    print("  %s: %d pagine, %.0fx%.0f pt"
          % (PDF.name, doc.page_count, doc[0].rect.width, doc[0].rect.height))

    if not applica:
        n = doc.page_count * len(LARGHEZZE) * 2
        print("  scriverebbe %d file in %s" % (n, FUORI.relative_to(RADICE)))
        print("\n  esegui con --applica")
        return 0

    FUORI.mkdir(parents=True, exist_ok=True)
    manifest = []
    peso = 0

    for i, pagina in enumerate(doc, start=1):
        voce = {"n": i, "dims": {}}
        for larghezza in LARGHEZZE:
            im = rendi(pagina, larghezza)
            # L'altezza vera del file, non quella dedotta dalla proporzione.
            voce["dims"][str(larghezza)] = im.height
            base = FUORI / ("catalogo-p%02d-%d" % (i, larghezza))
            im.save(base.with_suffix(".webp"), "WEBP", quality=Q_WEBP, method=5)
            im.save(base.with_suffix(".jpg"), "JPEG", quality=Q_JPG,
                    optimize=True, progressive=True)
            peso += base.with_suffix(".webp").stat().st_size
            peso += base.with_suffix(".jpg").stat().st_size
        manifest.append(voce)
        print("  p%02d  %s" % (i, "  ".join(
            "%dx%d" % (w, voce["dims"][str(w)]) for w in LARGHEZZE)))

    (FUORI / "manifest.json").write_text(
        json.dumps({"larghezze": list(LARGHEZZE), "pagine": manifest},
                   indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8")

    quanti = doc.page_count * len(LARGHEZZE) * 2
    print("\n  %d file, %.1f MB, piu' manifest.json" % (quanti, peso / 1048576))

    # Se le proporzioni non sono tutte uguali la griglia a aspect-ratio fisso
    # ritaglierebbe qualche pagina: meglio saperlo qui che a occhio.
    prop = {round(v["dims"][str(LARGHEZZE[-1])] / LARGHEZZE[-1], 4) for v in manifest}
    if len(prop) > 1:
        print("  ATTENZIONE: le pagine non hanno tutte la stessa proporzione: %s" % prop)
    else:
        print("  tutte le pagine alla stessa proporzione: %.4f" % prop.pop())
    return 0


if __name__ == "__main__":
    sys.exit(main("--applica" in sys.argv))
