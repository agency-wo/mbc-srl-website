/* MBC SRL - Progetti gallery: category filter + accessible lightbox */
(function () {
  "use strict";
  var grid = document.querySelector("[data-gallery]");
  if (!grid) return;
  var items = Array.prototype.slice.call(grid.querySelectorAll(".gallery-item"));

  /* ---- Filtering ---- */
  var filters = document.querySelectorAll(".filter");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-filter");
      filters.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("is-active"); btn.setAttribute("aria-pressed", "true");
      items.forEach(function (fig) {
        var show = cat === "all" || fig.getAttribute("data-cat") === cat;
        fig.hidden = !show;
      });
    });
  });

  /* ---- Lightbox ---- */
  var lb = document.querySelector(".lightbox");
  if (!lb) return;
  var lbImg = lb.querySelector(".lightbox__img");
  var lbCap = lb.querySelector(".lightbox__cap");
  var current = 0, lastFocus = null;

  function visible() { return items.filter(function (f) { return !f.hidden; }); }

  // pick the mid-size rendition on small screens, full-size on large
  function fullSrc(fig) {
    if (window.innerWidth < 700) {
      var m = fig.getAttribute("data-full-m");
      if (m) return m;
    }
    return fig.getAttribute("data-full");
  }

  function show(i) {
    var list = visible();
    if (!list.length) return;
    current = (i + list.length) % list.length;
    var fig = list[current];
    lbImg.src = fullSrc(fig);
    lbImg.alt = fig.querySelector("img").alt;
    lbCap.textContent = fig.querySelector("img").alt;
    // preload neighbours
    [current + 1, current - 1].forEach(function (n) {
      var f = list[(n + list.length) % list.length];
      if (f) { var im = new Image(); im.src = fullSrc(f); }
    });
  }
  function open(fig) {
    lastFocus = document.activeElement;
    var list = visible();
    show(list.indexOf(fig));
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.classList.add("lb-open");
    /* shared with the mobile nav so the two overlays don't fight over overflow */
    if (window.MBC) window.MBC.lockScroll(); else document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  }
  function close() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lb-open");
    if (window.MBC) window.MBC.unlockScroll(); else document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  items.forEach(function (fig) {
    fig.addEventListener("click", function () { open(fig); });
    fig.setAttribute("tabindex", "0");
    fig.setAttribute("role", "button");
    fig.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(fig); }
    });
  });

  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
  lb.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(current + 1);
    else if (e.key === "ArrowLeft") show(current - 1);
    else if (e.key === "Tab") { // simple focus trap
      var f = lb.querySelectorAll("button");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Touch swipe (mobile): horizontal swipe > 40px moves prev/next
  var touchX = null;
  lb.addEventListener("touchstart", function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(dx < 0 ? current + 1 : current - 1);
    touchX = null;
  }, { passive: true });
})();
