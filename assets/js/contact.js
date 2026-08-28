/* MBC SRL - contact form: validation + mailto fallback (no backend yet).
   To connect a real backend later (Formspree / Cloudflare), set the form's
   action + method and remove the e.preventDefault mailto branch. */
(function () {
  "use strict";
  var form = document.querySelector("#contact-form");
  if (!form) return;
  var success = document.querySelector(".form-success");
  var MAIL_TO = "info@manfrediconcept.it";

  function setInvalid(field, on) {
    var wrap = field.closest(".form-field");
    if (wrap) wrap.classList.toggle("invalid", on);
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    // honeypot: if filled, silently drop (bot)
    if (form.querySelector(".hp input").value) return;

    var ok = true;
    var required = form.querySelectorAll("[required]");
    required.forEach(function (el) {
      var bad = !el.value.trim() || (el.type === "email" && !validEmail(el.value)) ||
                (el.type === "checkbox" && !el.checked);
      setInvalid(el, bad);
      if (bad && ok) { el.focus(); ok = false; }
      else if (bad) ok = false;
    });
    if (!ok) return;

    var f = form.elements;
    var subject = "Richiesta dal sito - " + (f.oggetto.value || "Informazioni");
    var body =
      "Nome: " + f.nome.value + "\n" +
      "Email: " + f.email.value + "\n" +
      "Telefono: " + (f.telefono.value || "-") + "\n" +
      "Oggetto: " + f.oggetto.value + "\n\n" +
      "Messaggio:\n" + f.messaggio.value + "\n";
    window.location.href = "mailto:" + MAIL_TO +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);

    if (success) {
      success.classList.add("show");
      success.setAttribute("role", "status");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    form.reset();
  });

  // clear invalid state as the user corrects a field
  form.addEventListener("input", function (e) {
    if (e.target.closest(".form-field.invalid")) setInvalid(e.target, false);
  });
})();
