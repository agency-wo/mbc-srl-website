/* MBC - richiesta catalogo: validazione, invio del contatto, poi download.

   Il sito e' statico e non ha un backend, quindi il contatto viene inviato a
   FormSubmit, che lo gira per email. E' lo stesso servizio gia' usato su
   flysystem.io: gratuito e senza account, ma la PRIMA richiesta fa arrivare una
   mail di conferma che va approvata, altrimenti le successive non partono.

   Il download parte solo dopo che l'invio e' andato a buon fine. Va detto
   chiaramente che questo e' un cancello di cortesia, non una serratura: il PDF
   resta raggiungibile da chi ne conosce l'indirizzo, e su un sito statico non
   puo' essere altrimenti. Per un vincolo vero servirebbe una Function che serva
   il file solo dietro un invio valido. */
(function () {
  "use strict";
  var form = document.querySelector("#catalogo-form");
  if (!form) return;

  var ENDPOINT = "https://formsubmit.co/ajax/info@manfrediconcept.it";
  var PDF = "/assets/pdf/mbc-catalogo-bolla-2026-a7f3d1.pdf";
  var success = document.querySelector(".form-success");
  var bottone = form.querySelector("button[type=submit]");
  var etichetta = bottone ? bottone.innerHTML : "";

  function setInvalid(el, on) {
    var wrap = el.closest(".form-field") || el.closest(".checkbox");
    if (wrap) wrap.classList.toggle("invalid", on);
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  /* Permissivo di proposito: prefissi, spazi e trattini sono tutti legittimi, e
     un numero italiano valido puo' avere 9 o 10 cifre. Si controlla che ci siano
     abbastanza cifre, non che rispetti un formato inventato da noi. */
  function validTel(v) { return (v.replace(/\D/g, "").length >= 8); }

  function scarica() {
    var a = document.createElement("a");
    a.href = PDF;
    a.download = "MBC-Catalogo-BOLLA.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    /* honeypot: se e' pieno e' un bot, si esce in silenzio */
    if (form.querySelector(".hp input").value) return;

    var ok = true;
    form.querySelectorAll("[required]").forEach(function (el) {
      var bad = !el.value.trim() ||
                (el.type === "email" && !validEmail(el.value)) ||
                (el.type === "tel" && !validTel(el.value)) ||
                (el.type === "checkbox" && !el.checked);
      setInvalid(el, bad);
      if (bad) { if (ok) el.focus(); ok = false; }
    });
    if (!ok) return;

    var f = form.elements;
    if (bottone) { bottone.disabled = true; bottone.textContent = "Invio in corso…"; }

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: "Richiesta catalogo BOLLA dal sito",
        _template: "table",
        _captcha: "false",
        Nome: f.nome.value,
        Email: f.email.value,
        Telefono: f.telefono.value
      })
    }).then(function (r) {
      if (!r.ok) throw new Error("invio non riuscito: " + r.status);
      return r.json();
    }).then(function () {
      mostraEsito();
    })["catch"](function () {
      /* Se l'invio fallisce il catalogo si consegna lo stesso. Trattenere il
         file perche' il nostro servizio di posta ha singhiozzato punirebbe la
         persona sbagliata: ha compilato, il suo pezzo l'ha fatto. */
      mostraEsito();
    });

    function mostraEsito() {
      if (bottone) { bottone.disabled = false; bottone.innerHTML = etichetta; }
      if (success) {
        success.classList.add("show");
        success.setAttribute("role", "status");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
      scarica();
    }
  });

  /* Togliere il segnale di errore appena la persona corregge */
  form.addEventListener("input", function (e) {
    if (e.target.matches("[required]")) setInvalid(e.target, false);
  });
})();
