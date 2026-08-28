# -*- coding: utf-8 -*-
"""Ricava dal logo del cliente le rendition che servono al sito.

Il logo arriva come JPEG 1600x800 su fondo crema (#FDF6ED). Cosi' com'e' si puo'
mettere solo sopra al crema: sopra una foto dell'hero comparirebbe un rettangolo
color panna. Va scontornato.

Il modo di scontornarlo e' preso da flysystem.io/tools/prep_logo2.py (nell'indice
come `logo-alpha-prep`). Il punto non e' la soglia, e' la **rampa**: una soglia
secca lascia un alone crema sui bordi antialiasati del cerchio, che a 40px si
vede benissimo. Qui le costanti sono ritarate, perche' quelle originali sono
per il bianco: il crema di questo file ha canale minimo 237, non 255.

Due ritagli invece di uno, perche' servono due cose diverse:

  logo-mark      solo cerchio + M + B. Va nell'header a 40px, dove la riga
                 "MANFREDI BUSINESS CONCEPT" del lockup completo sarebbe
                 illeggibile.
  logo-full      il lockup intero. Footer, fascia catalogo, campo `logo` dei
                 dati strutturati, sorgente per l'immagine OG.

E una terza uscita, logo-mark-light: sui fondi scuri il verde della M sparirebbe.
Non e' un semplice invert, che sbiancherebbe anche l'anello terracotta: schiarisce
il solo verde, come gia' fa il CSS sull'SVG.

    python _tools/prep-logo.py _source/mbclogo.jpeg assets/img/brand
"""
import sys
from pathlib import Path

from PIL import Image

# Il fondo e' #FDF6ED: canale minimo 237. Sopra HI trasparente, sotto LO opaco,
# in mezzo la rampa. Il verde (min 45) e il terracotta (min 62) stanno larghi
# sotto LO, quindi restano pieni.
#
# HI sta a 232 e non a 236 per via del rumore JPEG: la compressione sporca il
# fondo di pixel a 234-235, che con HI=236 restavano leggermente opachi e
# gonfiavano il bounding box fino a tutta l'immagine. Alzando la soglia il
# fondo torna piatto, e il logo non ne risente perche' il suo colore piu'
# chiaro sta comunque centinaia di livelli piu' giu'.
HI, LO = 232, 190

# Il riquadro del marchio e' 40px CSS: servono 40 px fisici a 1x, 80 a 2x, 120 a 3x.
# Prima erano 96 e 192, cioe' 192 px per riempirne 80: due volte e mezzo in lineare,
# quasi sei in pixel. Le densita' si scrivono in base al riquadro, non a occhio.
LARGHEZZE_MARCHIO = [40, 80, 120]


def scontorna(im):
    rgba = im.convert("RGBA")
    px = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, _ = px[x, y]
            m = min(r, g, b)
            if m >= HI:
                px[x, y] = (r, g, b, 0)
            elif m > LO:
                px[x, y] = (r, g, b, round(255 * (HI - m) / (HI - LO)))
    return rgba


def riquadro(im, x0=None, x1=None):
    """Bounding box del contenuto opaco, opzionalmente dentro una fascia x."""
    a = im.split()[3]
    if x0 is not None:
        vuoto = Image.new("L", im.size, 0)
        vuoto.paste(a.crop((x0, 0, x1, im.height)), (x0, 0))
        a = vuoto
    return a.point(lambda v: 255 if v > 40 else 0).getbbox()


def schiarisci(im, chiaro=(246, 241, 231)):
    """Schiarisce il solo verde, lasciando stare il terracotta.

    Sui fondi scuri il sito non sbianca tutto il marchio: l'anello resta
    terracotta e cambia colore solo la M (`.site-header:not(.is-solid) .lm-fill`
    la fa bianca, `.site-footer .lm-fill` la fa crema). Un `filter: invert()` sul
    raster sbiancherebbe anche l'anello, cioe' butterebbe via meta' del marchio.

    Il verde (#2D4A3A) e il terracotta (#BC6B3E) si distinguono senza ambiguita':
    nel terracotta il rosso domina, nel verde no.
    """
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and r <= g:
                px[x, y] = chiaro + (a,)
    return out


def colonne_piene(im, soglia=200, passo=3):
    """Blocchi di colonne che contengono qualcosa di non-crema."""
    px = im.convert("RGB").load()
    pieno = [any(min(px[x, y]) < soglia for y in range(0, im.height, passo))
             for x in range(im.width)]
    blocchi, ini = [], None
    for x, v in enumerate(pieno):
        if v and ini is None:
            ini = x
        elif not v and ini is not None:
            if x - ini > 8:
                blocchi.append((ini, x))
            ini = None
    if ini is not None:
        blocchi.append((ini, im.width))
    return blocchi


def semplifica(im, colori=16):
    """Riduce la tavolozza tenendo l'alpha.

    Il logo e' fatto di due colori piatti, ma arriva da un JPEG: la compressione
    ne ha sparsi migliaia di quasi-uguali, e un PNG li paga tutti. Quantizzare il
    solo RGB e rimettere l'alpha originale ripulisce gli artefatti e taglia il
    peso, senza toccare la morbidezza dei bordi, che vive nell'alpha.
    """
    # L'alpha e' l'altra meta' del peso: misurato, il 21% dei pixel stava su
    # valori intermedi sparsi su tutti i 256 livelli, quasi tutti residui di
    # rumore JPEG. Si azzera il quasi-trasparente, si satura il quasi-opaco e si
    # tiene il resto a 32 gradini: a 96-192px il bordo resta liscio e il PNG
    # smette di pagare entropia inventata dalla compressione del sorgente.
    alpha = im.split()[3].point(
        lambda v: 0 if v < 24 else 255 if v > 232 else (v // 8) * 8)
    rgb = im.convert("RGB").quantize(colors=colori, method=Image.MEDIANCUT).convert("RGB")
    rgb.putalpha(alpha)
    return rgb


def salva(im, percorso, larghezze):
    """Scrive le rendition in PNG-8 con tavolozza.

    Un PNG a 32 bit per un disegno a due colori piatti e' il formato sbagliato,
    e si vedeva: il marchio a 192px pesava 20,4 KB. Quantizzando con FASTOCTREE,
    che conserva l'alpha, lo stesso disegno a 80px sta in 2,8 KB. Misurato a
    confronto anche con WebP lossless (8,9 KB) e WebP q90 (6,8 KB): qui vince
    il PNG a tavolozza, perche' i colori sono pochi e piatti.
    """
    for w in larghezze:
        h = round(im.height * w / im.width)
        out = semplifica(im.resize((w, h), Image.LANCZOS))
        pal = out.quantize(colors=64, method=Image.FASTOCTREE)
        nome = percorso.with_name("%s-%d.png" % (percorso.stem, w))
        pal.save(nome, optimize=True)
        print("  %-34s %dx%d  %d B" % (nome.name, w, h, nome.stat().st_size))


def main(sorgente, destinazione):
    src, dst = Path(sorgente), Path(destinazione)
    dst.mkdir(parents=True, exist_ok=True)
    grezzo = Image.open(src)
    print("sorgente: %s  %dx%d" % (src.name, grezzo.width, grezzo.height))

    blocchi = colonne_piene(grezzo)
    if not blocchi:
        raise SystemExit("  nessun contenuto trovato: il fondo non e' quello atteso")
    print("  blocchi: %s" % ", ".join("%d-%d" % b for b in blocchi))

    keyed = scontorna(grezzo)

    # Il marchio e' il primo blocco, quello staccato dal lettering.
    mx0, mx1 = blocchi[0]
    marchio = keyed.crop(riquadro(keyed, mx0, mx1))
    print("\nmarchio %dx%d" % marchio.size)
    salva(marchio, dst / "logo-mark.png", LARGHEZZE_MARCHIO)
    print("marchio per fondi scuri")
    salva(schiarisci(marchio), dst / "logo-mark-light.png", LARGHEZZE_MARCHIO)

    lockup = keyed.crop(riquadro(keyed))
    print("\nlockup %dx%d" % lockup.size)
    salva(lockup, dst / "logo-full.png", [600, 1200])
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("uso: python _tools/prep-logo.py <logo.jpeg> <cartella-uscita>")
        sys.exit(1)
    sys.exit(main(sys.argv[1], sys.argv[2]))
