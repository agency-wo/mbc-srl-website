# -*- coding: utf-8 -*-
"""Attacca l'impronta del contenuto a styles.css e main.js dentro le pagine.

Portato da flysystem.io/tools/versiona.py, dove era nato da un guasto vero: il
foglio di stile era pubblicato correttamente e nessun visitatore lo vedeva,
perche' viaggiava con una cache lunga e il browser continuava a servire la copia
vecchia. Peggio, il controllo fatto a mano diceva che era tutto a posto, perche'
interrogava `styles.css?x=1`: una stringa di query e' una chiave di cache
diversa, quindi quella richiesta andava all'origine mentre il browser, che
chiede l'indirizzo nudo, riceveva ancora la copia vecchia.

Qui serve per la ragione opposta ma complementare. Oggi ogni file esce con
`max-age=0, must-revalidate`: misurato, navigando dalla home a /soluzioni/ con
la cache calda si prendono **quattro risposte 304**, cioe' quattro giri di rete
buttati solo per sentirsi dire "non e' cambiato". Per poterli cacheare a lungo
CSS e JS devono avere l'impronta nell'indirizzo, altrimenti un deploy non
arriverebbe piu' a chi ha gia' visitato il sito.

    assets/css/styles.css?v=6f3a1c22

Contenuto nuovo, impronta nuova, indirizzo nuovo: la cache lunga smette di
essere una trappola e torna a essere un vantaggio. L'impronta sono le prime 8
cifre dello sha1: cambia se e solo se cambia il contenuto, quindi ripubblicare
senza modifiche non invalida niente.

DUE DIFFERENZE rispetto all'originale, che non e' un copia e incolla:

1. Qui gli indirizzi sono assoluti dalla radice (`/assets/...`), li' erano
   relativi. Il confronto e' su quella forma.
2. Li' le pagine stavano tutte nella radice. Qui **tredici pagine su quattordici
   stanno in sottocartelle**, quindi la raccolta scende ricorsivamente, saltando
   `_tools/`, `_source/` e `node_modules/`.

I FONT NON SI VERSIONANO, di proposito, come nell'originale. Sono citati due
volte, dal `<link rel="preload">` nelle pagine e da `@font-face` dentro la CSS,
e mettere l'impronta solo sul primo dei due farebbe scaricare a ogni visitatore
lo stesso font due volte, una per indirizzo. Sono anche gli unici file qui che
non cambiano mai, e infatti in `_headers` stanno a un anno immutable.

Nemmeno le immagini: le srcset sono lunghissime e le fotografie qui si
sostituiscono cambiando nome. Per questo in `_headers` stanno a trenta giorni e
non immutable: sostituirne una tenendo lo stesso nome deve restare possibile.

**Va eseguito dopo i generatori**, perche' gen-en.mjs e gen-progetti.mjs
riscrivono l'HTML con l'indirizzo nudo.

    python _tools/versiona.py            riscrive le pagine
    python _tools/versiona.py --check    esce con 1 se un'impronta e' vecchia
    python _tools/versiona.py --hook     installa il pre-commit che fa il check
"""
import hashlib
import io
import os
import re
import sys

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Solo i file che cambiano spesso e che esistono in copia unica. Aggiungerne uno
# qui basta: la riscrittura e' generica sull'attributo che lo cita.
ASSETS = ("/assets/css/styles.css", "/assets/js/main.js")

# Cartelle che non contengono pagine pubblicate.
SALTA = {"_tools", "_source", "node_modules", ".git", ".wrangler"}


def impronta(percorso):
    """Le prime 8 cifre dello sha1 del contenuto."""
    with io.open(os.path.join(RADICE, percorso.lstrip("/")), "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]


def pagine():
    """Tutte le pagine pubblicate, anche nelle sottocartelle."""
    trovate = []
    for radice, cartelle, file in os.walk(RADICE):
        cartelle[:] = [c for c in cartelle if c not in SALTA]
        for f in file:
            if f.endswith(".html"):
                trovate.append(os.path.join(radice, f))
    return sorted(trovate)


def riscrivi(testo, asset, imp):
    r"""Sostituisce l'indirizzo dell'asset, con o senza impronta precedente.

    Il gruppo `(?:\?v=[0-9a-f]{8})?` e' quello che rende lo script ripetibile:
    senza, la seconda esecuzione appenderebbe una seconda impronta alla prima.
    """
    schema = re.compile(r'(href|src)="' + re.escape(asset) + r'(?:\?v=[0-9a-f]{8})?"')
    return schema.subn(lambda m: '%s="%s?v=%s"' % (m.group(1), asset, imp), testo)


def main(argv):
    check = "--check" in argv
    if "--hook" in argv:
        return installa_hook()

    imps = {a: impronta(a) for a in ASSETS}
    vecchie, toccate = [], 0
    for p in pagine():
        testo = io.open(p, encoding="utf-8").read()
        nuovo = testo
        for a in ASSETS:
            nuovo, n = riscrivi(nuovo, a, imps[a])
            if not n:
                print("  %-28s non cita %s" % (os.path.relpath(p, RADICE), a))
        if nuovo != testo:
            vecchie.append(os.path.relpath(p, RADICE).replace(os.sep, "/"))
            if not check:
                io.open(p, "w", encoding="utf-8", newline="\n").write(nuovo)
                toccate += 1

    for a in ASSETS:
        print("  %-26s %s" % (a, imps[a]))
    if check:
        if vecchie:
            print("\n  IMPRONTA VECCHIA in: %s" % ", ".join(vecchie))
            print("  I visitatori riceverebbero la versione in cache. "
                  "Esegui: python _tools/versiona.py")
            return 1
        print("\n  tutte le %d pagine sono aggiornate" % len(pagine()))
        return 0
    print("\n  %d pagina/e riscritta/e" % toccate)
    return 0


def installa_hook():
    """Un pre-commit che rifiuta un commit con le impronte vecchie.

    Blocca invece di correggere da solo: un hook che modifica i file sotto le
    mani di chi committa e' peggio del problema che risolve.
    """
    d = os.path.join(RADICE, ".git", "hooks")
    if not os.path.isdir(d):
        print("  niente .git/hooks qui")
        return 1
    p = os.path.join(d, "pre-commit")
    io.open(p, "w", encoding="utf-8", newline="\n").write(
        "#!/bin/sh\n"
        "# installato da _tools/versiona.py\n"
        "python _tools/versiona.py --check || exit 1\n")
    os.chmod(p, 0o755)
    print("  installato %s" % p)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
