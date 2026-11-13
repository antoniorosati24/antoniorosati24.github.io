/* Audi Vorsprung Club page: level switcher + demo video */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- level switcher ---------- */
  var root = document.querySelector("[data-levels]");
  if (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll(".lv-tab"));
    var panel = root.querySelector("#lv-panel");
    var copy = root.querySelector("[data-lv-copy]");
    var imgA = root.querySelector("[data-lv-img='a']");
    var imgB = root.querySelector("[data-lv-img='b']");
    var extra = root.querySelector("[data-lv-extra]");
    var tech = root.querySelector("[data-lv-technik]");
    var showingA = true;
    var current = -1;
    var TECH_SRC = "assets/audi/level-1-technik.webp";
    var TECH_ALT = "Audi Explorer at 8,000 points: all four rings lit and joined into one symbol, labelled Simbolo completo, TECHNIK.";

    // preload
    tabs.forEach(function (t) {
      var i = new Image();
      i.src = root.getAttribute("data-src-" + t.getAttribute("data-level"));
    });
    new Image().src = TECH_SRC;

    function swap(src, alt) {
      var next = showingA ? imgB : imgA;
      var prev = showingA ? imgA : imgB;
      if (next.getAttribute("src") === src && next.classList.contains("is-on")) return;
      var done = function () {
        next.classList.add("is-on");
        prev.classList.remove("is-on");
        next.alt = alt; next.removeAttribute("aria-hidden");
        prev.alt = ""; prev.setAttribute("aria-hidden", "true");
        showingA = !showingA;
      };
      next.src = src;
      if (next.complete) requestAnimationFrame(done);
      else next.addEventListener("load", done, { once: true });
    }

    function setLevel(n, focus) {
      if (n === current) return;
      current = n;
      tabs.forEach(function (t, i) {
        var on = i === n;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (on) {
          panel.setAttribute("aria-labelledby", t.id);
          if (focus) t.focus();
        }
      });
      root.setAttribute("data-current", String(n));
      swap(root.getAttribute("data-src-" + n), root.getAttribute("data-alt-" + n));
      var tpl = root.querySelector("template[data-level-copy='" + n + "']");
      copy.classList.remove("is-in");
      copy.innerHTML = tpl ? tpl.innerHTML : "";
      requestAnimationFrame(function () { copy.classList.add("is-in"); });
      if (extra) extra.hidden = n !== 1;
      if (tech) tech.setAttribute("aria-pressed", "false");
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { setLevel(i); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, j = null;
        if (k === "ArrowRight" || k === "ArrowDown") j = (i + 1) % tabs.length;
        else if (k === "ArrowLeft" || k === "ArrowUp") j = (i - 1 + tabs.length) % tabs.length;
        else if (k === "Home") j = 0;
        else if (k === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); setLevel(j, true); }
      });
    });
    if (tech) {
      tech.addEventListener("click", function () {
        var on = tech.getAttribute("aria-pressed") !== "true";
        tech.setAttribute("aria-pressed", on ? "true" : "false");
        swap(on ? TECH_SRC : root.getAttribute("data-src-1"), on ? TECH_ALT : root.getAttribute("data-alt-1"));
      });
    }
    setLevel(1);
  }

  /* ---------- demo video: autoplay muted when visible ---------- */
  var vid = document.querySelector("[data-avc-video]");
  if (vid) {
    if (reduce || !("IntersectionObserver" in window)) {
      vid.controls = true;
    } else {
      vid.addEventListener("click", function () { vid.controls = true; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { var p = vid.play(); if (p && p.catch) p.catch(function () { vid.controls = true; }); }
          else vid.pause();
        });
      }, { threshold: 0.35 });
      io.observe(vid);
    }
  }
})();
