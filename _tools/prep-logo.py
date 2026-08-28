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

Il lockup viene ritagliato in pezzi, perche' il sito lo ricompone a misure
diverse in header e footer:

  logo-mark      solo cerchio + M + B, il riquadro da 40px in header e footer.
  logo-word      la riga "MBC SRL".
  logo-desc      la riga "MANFREDI BUSINESS CONCEPT". Separata da logo-word
                 perche' alla proporzione dell'artwork sarebbe alta 4px
                 nell'header: tenerle distinte permette di dosarle per contesto.
  logo-full      il lockup intero, in un'unica misura: serve solo come campo
                 `logo` dei dati strutturati, che vuole un URL assoluto.

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

# Il lettering, ritagliato dall'artwork invece che riscritto con un font scelto a
# occhio. Il font del logo non e' identificabile da un raster, e uno "simile"
# resterebbe diverso: le lettere qui sono le sue.
#
# Due serie, e la divisione non e' header/footer ma scuro/chiaro.
#
# SCURA: la usa solo l'header quando e' solido, su un riquadro di 110px CSS,
# quindi 330 fisici alla densita' massima. Basta quella.
#
# CHIARA: la usano l'header sopra la foto (riquadro 110px) e il footer (riquadro
# 260px), e condividono la serie grande del footer. Sembra sovradimensionata per
# l'header, ed e' voluto: il footer quei file li scarica comunque, quindi usarli
# anche sopra la foto fa scaricare un file invece di due, 5,8 KB in meno a
# pagina. E soprattutto regge il pinch-zoom, che NON fa riscegliere l'immagine al
# browser: qualunque file ha preso al caricamento, quello ingrandisce, e la serie
# da 330px mostrava un "SRL" sgranato appena si zoomava.
#
# La regola che vale sempre: la serie copre il riquadro reale moltiplicato per la
# densita' massima. Sbagliarla e' costato due sessioni.
LARGHEZZE_PAROLA = [110, 220, 330]          # "MBC SRL" scuro, solo header solido
LARGHEZZE_PAROLA_FOOTER = [260, 520, 780]   # "MBC SRL" chiaro, header-sopra-foto + footer
LARGHEZZE_DESC = [110, 220, 330]            # descrittore scuro, solo header solido
LARGHEZZE_DESC_FOOTER = [260, 520, 780]     # descrittore chiaro, header-sopra-foto + footer


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

    Il verde (#2D4A3A, r45 g74) e il terracotta (#BC6B3E, r188 g107) si
    distinguono dal rapporto fra rosso e verde: 0,61 il primo, 1,76 il secondo.

    LA SOGLIA NON PUO' ESSERE `r <= g`, e l'ho imparato sbagliandola. Con quella,
    i pixel di bordo delle lettere sottili di "SRL" - dove il rumore JPEG spinge
    il rosso appena sopra il verde, tipo 1,05 - venivano scambiati per terracotta
    e lasciati scuri. Sul fondo verde del footer diventavano buchi: misurato, il
    13% dei pixel opachi di "SRL" restava scuro, e le lettere sembravano
    sbriciolate. Si schiarisce tutto tranne cio' che e' *chiaramente* rosso.
    """
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and r <= g * 1.3:
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


def semplifica(im, colori=48):
    """Riduce la tavolozza dei colori, e **non tocca l'alpha**.

    Il logo e' fatto di due colori piatti ma arriva da un JPEG, che ne ha sparsi
    migliaia di quasi-uguali: quantizzare l'RGB toglie quel rumore e fa il peso.

    L'ALPHA SI LASCIA STARE, e la ragione e' un guasto vero. Prima qui c'era una
    "pulizia" dell'alpha (sotto 24 azzera, sopra 232 satura, il resto a gradini
    di 8) messa per far dimagrire i file. Sul marchio, che e' fatto di forme
    spesse, non si notava. Su "SRL", che ha i tratti sottili, ha sbriciolato le
    lettere: misurato, **fra il 27% e il 30% del disegno di "SRL" sta sotto alpha
    24**, cioe' quasi un terzo delle sue lettere era esattamente cio' che quella
    riga buttava via. In un tratto sottile l'antialiasing non e' un contorno, e'
    la lettera.

    Senza quella pulizia i file crescono di 1-2 KB l'uno. Con la cache a un anno
    e' un prezzo che non si sente, e le lettere restano intere.
    """
    alpha = im.split()[3]
    rgb = im.convert("RGB").quantize(colors=colori, method=Image.MEDIANCUT).convert("RGB")
    rgb.putalpha(alpha)
    return rgb


def righe_lettering(im, x0):
    """Le due righe del lettering, separate dalla banda vuota fra loro.

    A destra del marchio il logo ha "MBC SRL" sopra e "MANFREDI BUSINESS
    CONCEPT" sotto, divise da una fascia senza pixel. Si trova quella invece di
    scrivere due rettangoli a mano, cosi' se l'artwork cambia il ritaglio segue.

    Le due righe sono larghe uguali (663 px nell'originale): il descrittore e'
    spaziato apposta per pareggiare la riga sopra, quindi si impilano da sole.
    """
    px = im.convert("RGB").load()
    def piena(y):
        return any(min(px[x, y]) < 200 for x in range(x0, im.width, 2))
    righe = [y for y in range(im.height) if piena(y)]
    if not righe:
        raise SystemExit("  nessun lettering a destra del marchio")
    bande, ini = [], None
    for y in range(righe[0], righe[-1] + 1):
        if not piena(y):
            if ini is None:
                ini = y
        else:
            if ini is not None and y - ini >= 3:
                bande.append((ini, y - 1))
            ini = None
    if not bande:
        raise SystemExit("  le due righe del lettering non si separano")
    sep = bande[-1]
    return (righe[0], sep[0] - 1), (sep[1] + 1, righe[-1])


def ritaglia_riga(im, x0, y0, y1):
    """Riquadro stretto sul contenuto opaco di una singola riga."""
    fascia = im.crop((x0, y0, im.width, y1 + 1))
    b = fascia.split()[3].point(lambda v: 255 if v > 40 else 0).getbbox()
    return fascia.crop(b)


def righe_lettering(im, x0):
    """Le due righe del lettering, separate dalla banda vuota fra loro.

    A destra del marchio c'e' "MBC SRL" sopra e "MANFREDI BUSINESS CONCEPT"
    sotto, divise da una fascia senza pixel. Si cerca quella invece di scrivere
    due rettangoli a mano: se l'artwork cambia, il ritaglio lo segue.

    Le due righe sono larghe uguali (663 px nell'originale) perche' il
    descrittore e' spaziato apposta per pareggiare la riga sopra.
    """
    px = im.convert("RGB").load()

    def piena(y):
        return any(min(px[x, y]) < 200 for x in range(x0, im.width, 2))

    righe = [y for y in range(im.height) if piena(y)]
    if not righe:
        raise SystemExit("  nessun lettering a destra del marchio")
    bande, ini = [], None
    for y in range(righe[0], righe[-1] + 1):
        if not piena(y):
            if ini is None:
                ini = y
        else:
            if ini is not None and y - ini >= 3:
                bande.append((ini, y - 1))
            ini = None
    if not bande:
        raise SystemExit("  le due righe del lettering non si separano")
    sep = bande[-1]
    return (righe[0], sep[0] - 1), (sep[1] + 1, righe[-1])


def ritaglia_riga(im, x0, y0, y1):
    """Riquadro stretto sul contenuto opaco di una singola riga."""
    fascia = im.crop((x0, y0, im.width, y1 + 1))
    b = fascia.split()[3].point(lambda v: 255 if v > 40 else 0).getbbox()
    return fascia.crop(b)


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
        # 128 e non 64: la tavolozza deve contenere anche i livelli di alpha dei
        # bordi, e su un tratto sottile quelli sono la maggioranza dei pixel.
        pal = out.quantize(colors=128, method=Image.FASTOCTREE)
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
    salva(lockup, dst / "logo-full.png", [1200])   # solo il 1200: e' il campo logo dei dati strutturati

    # Le due righe separate, in due serie di misure: l'header mostra solo
    # "MBC SRL" (compatta), il footer mostra il lockup intero (grande, sola
    # chiara). Il descrittore non compare mai su fondo chiaro, quindi la sua
    # variante scura non si genera piu'.
    x0 = blocchi[1][0] - 6 if len(blocchi) > 1 else mx1
    (a0, a1), (b0, b1) = righe_lettering(grezzo, x0)
    parola = ritaglia_riga(keyed, x0, a0, a1)
    desc = ritaglia_riga(keyed, x0, b0, b1)
    print("\nMBC SRL %dx%d (righe y %d-%d) - header" % (parola.width, parola.height, a0, a1))
    # La variante SCURA serve solo all'header solido, e li' basta la serie
    # calibrata sul riquadro da 110px. La variante CHIARA invece la usano sia
    # l'header sopra la foto sia il footer, con la stessa serie grande: il footer
    # ne ha bisogno comunque, cosi' la pagina scarica un file solo invece di due
    # (5,8 KB in meno) e regge il pinch-zoom, che non fa riscegliere l'immagine
    # al browser - qualunque file ha preso al caricamento, quello ingrandisce.
    salva(parola, dst / "logo-word.png", LARGHEZZE_PAROLA)
    print("MBC SRL - chiara, condivisa fra header-sopra-foto e footer")
    salva(schiarisci(parola), dst / "logo-word-light.png", LARGHEZZE_PAROLA_FOOTER)
    print("descrittore %dx%d (righe y %d-%d) - header, sola scura" % (desc.width, desc.height, b0, b1))
    salva(desc, dst / "logo-desc.png", LARGHEZZE_DESC)
    print("descrittore - chiara, condivisa fra header-sopra-foto e footer")
    salva(schiarisci(desc), dst / "logo-desc-light.png", LARGHEZZE_DESC_FOOTER)
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("uso: python _tools/prep-logo.py <logo.jpeg> <cartella-uscita>")
        sys.exit(1)
    sys.exit(main(sys.argv[1], sys.argv[2]))
