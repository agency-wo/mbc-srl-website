/* MBC SRL - global interactions: header, mobile nav, scroll-reveal */
(function () {
  "use strict";
  var header = document.querySelector(".site-header");
  var hasHero = document.body.classList.contains("has-hero");

  /* Scroll lock, shared with the gallery lightbox.
     overflow:hidden alone lets iOS Safari rubber-band the page behind a fullscreen
     overlay and drops the offset, so pin the body and restore it on release.
     Depth-counted so two overlays can never unlock each other early. */
  var lockDepth = 0, lockY = 0;
  function lockScroll() {
    if (lockDepth++) return;
    /* rounded: a fractional offset pins to a `top` the browser snaps to a device
       pixel independently of the scroll offset, drifting the page by ~1px */
    lockY = Math.round(window.scrollY || window.pageYOffset || 0);
    var s = document.body.style;
    s.position = "fixed"; s.top = -lockY + "px"; s.left = "0"; s.right = "0";
  }
  function unlockScroll() {
    if (!lockDepth || --lockDepth) return;
    var s = document.body.style;
    s.position = ""; s.top = ""; s.left = ""; s.right = "";
    /* html { scroll-behavior: smooth } would otherwise animate the restore */
    var d = document.documentElement, prev = d.style.scrollBehavior;
    d.style.scrollBehavior = "auto";
    window.scrollTo(0, lockY);
    d.style.scrollBehavior = prev;
  }
  window.MBC = window.MBC || {};
  window.MBC.lockScroll = lockScroll;
  window.MBC.unlockScroll = unlockScroll;

  /* Header solid state */
  function onScroll() {
    if (!header || lockDepth) return; /* body is pinned: scrollY reads 0 */
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

  /* Landing on a #hash from another page.
     .section carries content-visibility:auto, so at the moment the browser performs
     its initial anchor jump the sections below are still sized by their
     contain-intrinsic-size estimate, not their real height. The estimate is short,
     so the jump overshoots (measured: every anchor on /soluzioni/ landed 269-678px
     past its target). Re-run the scroll once layout has settled; scrollIntoView
     honours the scroll-padding-top that clears the fixed header. */
  if (location.hash) {
    window.addEventListener("load", function () {
      var el;
      try { el = document.querySelector(location.hash); } catch (e) { return; }
      if (!el) return;
      var d = document.documentElement, prev = d.style.scrollBehavior;
      d.style.scrollBehavior = "auto";   /* html{scroll-behavior:smooth} would animate a correction the user never asked for */
      el.scrollIntoView();
      d.style.scrollBehavior = prev;
    });
  }

  /* Mobile navigation */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".nav-menu");
  /* Idempotent: wired to every menu link, Escape, and every resize above 860px,
     so it must not unbalance the lock counter when the menu is already closed. */
  function closeNav() {
    if (!document.body.classList.contains("nav-open")) return;
    document.body.classList.remove("nav-open");
    unlockScroll();
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      if (open) lockScroll(); else unlockScroll();
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { var f = menu.querySelector("a"); if (f) f.focus(); }
    });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) { closeNav(); if (toggle) toggle.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) closeNav(); });
  }

  /* Scroll reveal - during scrolling, poll positions every frame for 500ms.
     Bulletproof against any scroll speed (incl. programmatic jumps); idles when still. */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    var looping = false, stopAt = 0;
    /* Read pass then write pass: measuring and mutating in one loop forces a
       layout per element. Elements crossing together are staggered by their
       position within their own parent, so unrelated siblings never eat a slot. */
    function revealCheck(stagger) {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var hit = [], rest = [];
      for (var i = 0; i < reveals.length; i++) {
        (reveals[i].getBoundingClientRect().top < vh * 0.9 ? hit : rest).push(reveals[i]);
      }
      reveals = rest;
      var seen = new Map();
      for (var j = 0; j < hit.length; j++) {
        var par = hit[j].parentNode, k = seen.get(par) || 0;
        seen.set(par, k + 1);
        // JS owns --d once it runs; the data-delay CSS values remain the no-JS fallback.
        // Skipped on the initial/load pass so above-the-fold content never waits.
        if (stagger === true) hit[j].style.setProperty("--d", Math.min(k, 3) * 80 + "ms");
        hit[j].classList.add("is-visible");
      }
    }
    function loop(ts) {
      revealCheck(true);
      if (reveals.length && ts < stopAt) requestAnimationFrame(loop);
      else looping = false;
    }
    function pump() {
      if (!reveals.length) return;
      stopAt = performance.now() + 500;
      if (!looping) { looping = true; requestAnimationFrame(loop); }
    }
    /* Primary path: IntersectionObserver computes visibility without ever forcing
       layout. Reading geometry instead (getBoundingClientRect) un-skips every
       content-visibility section synchronously, which put ~1s of Style & Layout on
       the critical path. The rAF poll below is kept as a safety net: intersection
       callbacks can be outrun by instant/programmatic jumps, so a scroll-idle sweep
       catches any straggler. */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        var seen = new Map();
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          var el = entries[i].target, par = el.parentNode, k = seen.get(par) || 0;
          seen.set(par, k + 1);
          el.style.setProperty("--d", Math.min(k, 3) * 80 + "ms");
          el.classList.add("is-visible");
          io.unobserve(el);
          var idx = reveals.indexOf(el);
          if (idx > -1) reveals.splice(idx, 1);
        }
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
      for (var n = 0; n < reveals.length; n++) io.observe(reveals[n]);

      var idle;
      window.addEventListener("scroll", function () {
        clearTimeout(idle);
        if (reveals.length) idle = setTimeout(function () { revealCheck(true); }, 250);
      }, { passive: true });
      window.addEventListener("load", function () { if (reveals.length) revealCheck(); });
    } else {
      window.addEventListener("scroll", pump, { passive: true });
      window.addEventListener("resize", pump);
      window.addEventListener("load", revealCheck);
      requestAnimationFrame(function () { revealCheck(); });
    }
  }

  /* WhatsApp FAB - visible only when no in-layout CTA is on screen.
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
