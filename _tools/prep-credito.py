# -*- coding: utf-8 -*-
"""Prepara il logo di MarketingPro per il credito nel footer.

Il footer di MBC e' verde scuro (--green-deep, #1E3328) e il logo di
MarketingPro e' testo NERO PURO piu' un quadrifoglio verde. Misurato, il nero su
quel fondo sta a 1,56:1: invisibile. Serve una variante chiara, e per questo il
file cosi' com'e' non e' utilizzabile.

Tre cose che questo script fa e che non sono ovvie.

1. TOGLIE IL CLAIM. Sotto "MarketingPro" c'e' "DRIVEN BY DATA, DESIGNED TO
   INSPIRE", alto 8px su un artwork di 77. Nel riquadro da 104px del credito
   verrebbe alto 2,6px, cioe' una riga grigia e non una scritta. E' la stessa
   trappola del descrittore MBC, gia' pagata una volta. Il claim si puo'
   togliere pulito, ma il taglio non e' ne' una banda di righe ne' una di
   colonne: nelle righe del claim (53-62) scende anche la coda della 'g' di
   "Marketing". Misurato, il claim sta a x 11-187 e la 'g' a x>=210, con un
   corridoio vuoto in mezzo. Si cancella quindi il nero dentro le righe del
   claim E a sinistra di quel corridoio. La prima versione tagliava 54-61 su
   tutta la larghezza: lasciava la riga 53 e produceva una linea tratteggiata
   sotto "Marketing", visibile a occhio sul verde del footer.

2. NON USA schiarisci() DI prep-logo.py, e non e' una svista. Quel predicato e'
   `r <= g * 1.3`, tarato sull'artwork MBC. Sul quadrifoglio (128,192,32) e'
   vero, quindi lo ricolorerebbe in crema: cancellerebbe il colore che identifica
   il marchio. Qui il predicato e' il quasi-nero e basta, `max(r,g,b) < 80`, e il
   verde resta verde. Sul fondo del footer misura 6,72:1, quindi si legge.

3. L'ALPHA NON SI TOCCA. Il 51% dei pixel neri di questo file ha alpha parziale:
   e' l'antialiasing, e su un lettering sottile l'antialiasing non e' un
   contorno, e' la lettera. Vale parola per parola il commento di semplifica()
   in prep-logo.py, che qui viene riusata proprio per non ripetere l'errore.

    python _tools/prep-credito.py _source/marketingpro-logo.png assets/img/brand
"""
import importlib.util
import sys
from pathlib import Path

from PIL import Image

# Riquadro da 100px CSS: 100 fisici a 1x, 200 a 2x, 300 a 3x. Il sorgente
# ritagliato e' largo 307, quindi nemmeno la serie piu' grande ingrandisce, a
# nessuna densita'. E' la regola imparata sul lockup MBC.
#
# Erano 104/208/312 finche' il claim veniva tolto male: il claim comincia a
# x=11 e la "M" di Marketing a x=28, quindi togliendolo davvero il bounding box
# si stringe da 325 a 307 e il 312 diventerebbe un ingrandimento. Il controllo
# in fondo a main() se ne e' accorto da solo, ed e' li' per questo.
LARGHEZZE = [100, 200, 300]

CREMA = (246, 241, 231)      # --cream
BANDA_CLAIM = (53, 62)       # righe del claim, misurate sull'artwork
CLAIM_X_MAX = 200            # oltre questa colonna, nella banda, c'e' la 'g' di Marketing
CORRIDOIO = (190, 205)       # il vuoto fra claim e 'g': se si riempie, l'artwork e' cambiato
SOGLIA_NERO = 80             # sopra questa il pixel e' quadrifoglio, non lettering


def _salva():
    """Riusa salva()/semplifica() di prep-logo.py invece di riscriverle.

    Import per percorso perche' il nome del file ha un trattino e non e' un
    identificatore Python valido.
    """
    p = Path(__file__).with_name("prep-logo.py")
    spec = importlib.util.spec_from_file_location("prep_logo", p)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.salva


def togli_claim(im):
    """Cancella il claim, lasciando intatti quadrifoglio e coda della 'g'."""
    px = im.load()
    y0, y1 = BANDA_CLAIM
    c0, c1 = CORRIDOIO

    # Se il corridoio non e' vuoto, claim e 'g' non sono piu' separabili con
    # queste coordinate: meglio fermarsi che consegnare un logo mutilato.
    sporco = [(x, y) for y in range(y0, y1 + 1) for x in range(c0, c1 + 1)
              if px[x, y][3] > 10]
    if sporco:
        raise SystemExit("  il corridoio %d-%d non e' vuoto (%d pixel): rimisurare l'artwork"
                         % (c0, c1, len(sporco)))

    tolti = 0
    for y in range(y0, y1 + 1):
        for x in range(CLAIM_X_MAX):
            r, g, b, a = px[x, y]
            if a and max(r, g, b) < SOGLIA_NERO:
                px[x, y] = (0, 0, 0, 0)
                tolti += 1
    return tolti


def schiarisci_lettering(im, chiaro=CREMA):
    """Il nero diventa crema; il verde resta verde. L'alpha non si tocca."""
    px = im.load()
    cambiati = 0
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and max(r, g, b) < SOGLIA_NERO:
                px[x, y] = chiaro + (a,)
                cambiati += 1
    return cambiati


def main(sorgente, destinazione):
    src, dst = Path(sorgente), Path(destinazione)
    dst.mkdir(parents=True, exist_ok=True)

    im = Image.open(src).convert("RGBA")
    print("sorgente: %s  %dx%d" % (src.name, im.width, im.height))

    n = togli_claim(im)
    print("  claim rimosso: %d pixel, righe %d-%d fino a x=%d"
          % (n, *BANDA_CLAIM, CLAIM_X_MAX))
    if not n:
        raise SystemExit("  nessun pixel di claim trovato: l'artwork e' cambiato, rimisurare")

    n = schiarisci_lettering(im)
    print("  lettering schiarito: %d pixel -> #%02X%02X%02X" % (n, *CREMA))

    scatola = im.getbbox()
    im = im.crop(scatola)
    print("  ritagliato a %dx%d (bbox %s)" % (im.width, im.height, scatola))
    if max(LARGHEZZE) > im.width:
        raise SystemExit("  la serie piu' grande (%d) supera il sorgente (%d): si ingrandirebbe"
                         % (max(LARGHEZZE), im.width))

    print("\ncredito MarketingPro")
    _salva()(im, dst / "marketingpro-credito.png", LARGHEZZE)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__.strip().splitlines()[-1].strip())
    main(sys.argv[1], sys.argv[2])
