/* MBC SRL — global interactions: header, mobile nav, scroll-reveal */
(function () {
  "use strict";
  var header = document.querySelector(".site-header");
  var hasHero = document.body.classList.contains("has-hero");

  /* Header solid state */
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 60) header.classList.add("is-solid");
    else header.classList.remove("is-solid");
  }
  if (header) {
    if (hasHero) {
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      header.classList.add("is-solid");
    }
  }

  /* Mobile navigation */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".nav-menu");
  function closeNav() {
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { var f = menu.querySelector("a"); if (f) f.focus(); }
    });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) { closeNav(); if (toggle) toggle.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) closeNav(); });
  }

  /* Scroll reveal — during scrolling, poll positions every frame for 500ms.
     Bulletproof against any scroll speed (incl. programmatic jumps); idles when still. */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    var looping = false, stopAt = 0;
    function revealCheck() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      reveals = reveals.filter(function (el) {
        if (el.getBoundingClientRect().top < vh * 0.9) { el.classList.add("is-visible"); return false; }
        return true;
      });
    }
    function loop(ts) {
      revealCheck();
      if (reveals.length && ts < stopAt) requestAnimationFrame(loop);
      else looping = false;
    }
    function pump() {
      if (!reveals.length) return;
      stopAt = performance.now() + 500;
      if (!looping) { looping = true; requestAnimationFrame(loop); }
    }
    window.addEventListener("scroll", pump, { passive: true });
    window.addEventListener("resize", pump);
    window.addEventListener("load", revealCheck);
    revealCheck();
  }

  /* WhatsApp FAB — visible only when no in-layout CTA is on screen.
     Suppressors: the hero buttons (home only), the CTA band, and the footer.
     Deliberately NOT tied to scroll position: the legal pages register no
     scroll listener at all, and a scroll threshold is unreachable on short pages. */
  var fab = document.querySelector(".wa-fab");
  if (fab) {
    var blockers = document.querySelectorAll(".hero__btns, .cta-band, .site-footer");
    if (!("IntersectionObserver" in window) || !blockers.length) {
      fab.classList.add("is-in");
    } else {
      var waIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target.__waHit = e.isIntersecting; });
        var blocked = false;
        blockers.forEach(function (el) { if (el.__waHit) blocked = true; });
        fab.classList.toggle("is-in", !blocked);
      }, { threshold: 0 });
      blockers.forEach(function (el) { waIo.observe(el); });
    }
  }

  /* Footer year */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
