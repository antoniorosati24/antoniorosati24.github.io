/* Antonio Rosati — portfolio v3 */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var narrow = window.matchMedia("(max-width: 860px)");
  /* shared with the agent field: viewport rects of the hero's movable cards */
  var floatState = { rects: [], dragging: false, nudge: null };


  /* ---------- theme (system by default; optional manual override) ---------- */
  var THEME_KEY = "ar-theme";
  var mqDark = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      return t === "light" || t === "dark" ? t : null;
    } catch (e) {
      return null;
    }
  }
  function isDark() {
    var s = storedTheme();
    if (s === "dark") return true;
    if (s === "light") return false;
    return mqDark.matches;
  }
  function themedSrc(light, dark) {
    if (!light) return light;
    if (!isDark()) return light;
    if (dark) return dark;
    if (light.indexOf("/dark/") !== -1) return light;
    return light
      .replace(/^(assets\/(?:lyceum|audi))\//, "$1/dark/")
      .replace(/^(assets)\//, "$1/dark/");
  }
  function applyPictures() {
    var s = storedTheme();
    document.querySelectorAll("source[data-theme-source]").forEach(function (el) {
      if (s === "dark") el.media = "all";
      else if (s === "light") el.media = "not all";
      else el.media = "(prefers-color-scheme: dark)";
    });
  }
  function updateToggle() {
    var s = storedTheme();
    var label;
    if (s === "light") label = "Appearance: light. Click for dark.";
    else if (s === "dark") label = "Appearance: dark. Click to follow the system.";
    else label = "Appearance: follows the system. Click for light.";
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    });
  }
  function setPref(pref) {
    if (pref === "light" || pref === "dark") {
      document.documentElement.setAttribute("data-theme", pref);
      try { localStorage.setItem(THEME_KEY, pref); } catch (e) {}
    } else {
      document.documentElement.removeAttribute("data-theme");
      try { localStorage.removeItem(THEME_KEY); } catch (e) {}
    }
    updateToggle();
    applyPictures();
    document.dispatchEvent(new CustomEvent("themechange", { detail: { dark: isDark() } }));
  }
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var s = storedTheme();
      if (!s) setPref("light");
      else if (s === "light") setPref("dark");
      else setPref("system");
    });
  });
  if (mqDark.addEventListener) {
    mqDark.addEventListener("change", function () {
      if (storedTheme()) return;
      applyPictures();
      document.dispatchEvent(new CustomEvent("themechange", { detail: { dark: isDark() } }));
    });
  }
  updateToggle();
  applyPictures();


  /* ---------- page enter / leave ---------- */
  document.documentElement.classList.add("page-enter");

  function sameOrigin(href) {
    try {
      var u = new URL(href, window.location.href);
      return u.origin === window.location.origin;
    } catch (e) {
      return false;
    }
  }

  document.addEventListener("click", function (e) {
    if (reduce) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    if (a.getAttribute("href") && a.getAttribute("href").charAt(0) === "#") return;
    if (!sameOrigin(a.href)) return;
    if (a.href === window.location.href) return;
    e.preventDefault();
    document.documentElement.classList.add("leaving");
    window.setTimeout(function () {
      window.location.href = a.href;
    }, 300);
  });

  /* ---------- sticky nav border ---------- */
  var nav = document.querySelector(".nav");
  function onNav() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", (window.scrollY || 0) > 8);
  }
  onNav();
  window.addEventListener("scroll", onNav, { passive: true });

  /* ---------- Lenis ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
    }
  }

  /* ---------- Lyceum tour ---------- */
  var tour = document.querySelector("[data-tour]");
  if (tour && !reduce && !narrow.matches) {
    initTour(tour);
  }

  function initTour(root) {
    var steps = Array.prototype.slice.call(root.querySelectorAll(".tour-step"));
    var imgA = root.querySelector("[data-tour-img='a']");
    var imgB = root.querySelector("[data-tour-img='b']");
    var count = root.querySelector("[data-tour-count]");
    if (!steps.length || !imgA || !imgB) return;

    var current = 0;
    var showingA = true;

    function srcOf(step) {
      return themedSrc(step.getAttribute("data-src"), step.getAttribute("data-src-dark"));
    }
    function altOf(step) {
      return step.getAttribute("data-alt") || "";
    }

    function setStep(i, instant) {
      if (i < 0 || i >= steps.length) return;
      if (i === current && !instant) return;
      current = i;
      steps.forEach(function (s, n) {
        s.classList.toggle("is-active", n === i);
      });
      if (count) count.textContent = i + 1 + " / " + steps.length;
      var next = showingA ? imgB : imgA;
      var prev = showingA ? imgA : imgB;
      next.src = srcOf(steps[i]);
      next.alt = altOf(steps[i]);
      if (instant) {
        next.classList.add("is-on");
        prev.classList.remove("is-on");
        showingA = !showingA;
        return;
      }
      /* wait a frame so the browser can decode */
      var done = function () {
        next.classList.add("is-on");
        prev.classList.remove("is-on");
        showingA = !showingA;
      };
      if (next.complete) {
        requestAnimationFrame(done);
      } else {
        next.addEventListener("load", done, { once: true });
      }
    }

    setStep(0, true);

    steps.forEach(function (step, i) {
      var btn = step.querySelector(".tour-step-btn");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var top = step.getBoundingClientRect().top + (window.scrollY || 0) - 120;
        if (lenis) lenis.scrollTo(top, { duration: 1.05 });
        else window.scrollTo({ top: top, behavior: "smooth" });
        setStep(i);
      });
    });

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      if (lenis) {
        ScrollTrigger.scrollerProxy(document.body, {
          scrollTop: function (value) {
            if (arguments.length) lenis.scrollTo(value, { immediate: true });
            return window.scrollY || 0;
          },
          getBoundingClientRect: function () {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
          },
        });
      }
      steps.forEach(function (step, i) {
        ScrollTrigger.create({
          trigger: step,
          start: "top 62%",
          end: "bottom 38%",
          onEnter: function () { setStep(i); },
          onEnterBack: function () { setStep(i); },
        });
      });
    } else {
      /* Intersection Observer fallback */
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var i = steps.indexOf(en.target);
            if (i >= 0) setStep(i);
          });
        },
        { rootMargin: "-35% 0px -35% 0px", threshold: 0 }
      );
      steps.forEach(function (s) { io.observe(s); });
    }

    document.addEventListener("themechange", function () {
      setStep(current, true);
    });
  }

  /* ---------- Audi lightbox ---------- */
  var lb = document.querySelector("[data-lightbox]");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var closer = lb.querySelector("[data-lb-close]");
    function openLb(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || "";
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      if (lenis) lenis.stop();
      document.body.style.overflow = "hidden";
      if (closer) closer.focus();
    }
    function closeLb() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      if (lenis) lenis.start();
      document.body.style.overflow = "";
      if (lbImg) {
        lbImg.removeAttribute("src");
        lbImg.alt = "";
      }
    }
    document.querySelectorAll("[data-lb-src]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        openLb(
          themedSrc(el.getAttribute("data-lb-src"), el.getAttribute("data-lb-src-dark")),
          el.getAttribute("data-lb-alt")
        );
      });
    });
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target === closer) closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("is-open")) closeLb();
    });
  }

  /* ---------- optional demo video swap ---------- */
  var demoHost = document.querySelector("[data-demo]");
  if (demoHost) {
    var videoSrc = demoHost.getAttribute("data-demo");
    fetch(videoSrc, { method: "HEAD" })
      .then(function (r) {
        if (!r.ok) return;
        var type = r.headers.get("content-type") || "";
        if (type.indexOf("video") === -1 && !/\.(mp4|webm|mov)$/i.test(videoSrc)) return;
        var posterWrap = demoHost.querySelector(".scheme-img") || demoHost.querySelector("img");
        var lightPoster = (demoHost.querySelector(".scheme-img .on-light") || demoHost.querySelector("img"));
        var darkPoster = demoHost.querySelector(".scheme-img .on-dark");
        var lightSrc = lightPoster ? lightPoster.getAttribute("src") : "";
        var darkSrc = darkPoster ? darkPoster.getAttribute("src") : "";
        var vid = document.createElement("video");
        vid.controls = true;
        vid.playsInline = true;
        vid.preload = "metadata";
        vid.poster = themedSrc(lightSrc, darkSrc);
        vid.src = videoSrc;
        vid.setAttribute("aria-label", "Screen recording of Lyceum");
        if (posterWrap) posterWrap.replaceWith(vid);
        document.addEventListener("themechange", function () {
          vid.poster = themedSrc(lightSrc, darkSrc);
        });
        var cap = demoHost.querySelector("figcaption");
        if (cap) cap.textContent = "A short walk through Lyceum, recorded on my Mac.";
      })
      .catch(function () { /* file not there yet — poster stays */ });
  }


  /* ---------- world-space agent cursors ----------
     Agents live in DOCUMENT coordinates and populate the whole page.
     A fixed canvas draws only those near the viewport, offset by the
     current (Lenis) scroll, so they move with the content. The escort
     of three stays screen-relative to the visitor's pointer.
     Reduced motion removes the canvas entirely. */
  function getScroll() {
    if (lenis && typeof lenis.scroll === "number") return lenis.scroll;
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  var markQueue = [];
  function isMarkKind(k) { return k === "mark" || k === "highlight"; }
  function sortMarkQueue() {
    markQueue.sort(function (a, b) {
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (ra.top - rb.top) || (ra.left - rb.left);
    });
  }

  function initAgents() {
    var canvas = document.querySelector("[data-agents]");
    if (!canvas || reduce) {
      if (canvas) canvas.remove();
      return;
    }
    var ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    var dpr = 1, W = 0, H = 0, docH = 0;
    var agents = [], ripples = [];
    var running = false, last = 0, raf = 0, t0 = 0, simT = 0;
    var boxes = [], media = [], targets = [], boxesAt = 0;
    var mqNarrow = window.matchMedia("(max-width: 700px)");
    var mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
    var dark = isDark();
    var mouse = { x: 0, y: 0, on: false, movedAt: 0, dirX: 0, dirY: 1 };
    var lastSy = 0, fxRoot = null;

    function palette() {
      return dark
        ? ["#22D3EE", "#F472B6", "#FACC15", "#4ADE80", "#60A5FA", "#FF3347", "#A78BFA", "#FB923C"]
        : ["#0891B2", "#DB2777", "#CA8A04", "#16A34A", "#2563EB", "#D7193A", "#7C3AED", "#EA580C"];
    }
    function narrow() { return mqNarrow.matches; }
    function escortOn() { return mqFine.matches && !narrow(); }
    function perScreen() { return narrow() ? 7 : 14; }
    function measureDoc() {
      docH = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0,
        H
      );
    }
    function desiredCount() {
      measureDoc();
      var screens = Math.max(1, docH / Math.max(H, 1));
      var n = Math.round(perScreen() * screens);
      return Math.max(perScreen(), Math.min(n, 180));
    }

    function getFx() {
      if (fxRoot && fxRoot.parentNode) return fxRoot;
      fxRoot = document.createElement("div");
      fxRoot.className = "ag-fx";
      fxRoot.setAttribute("aria-hidden", "true");
      document.body.appendChild(fxRoot);
      return fxRoot;
    }

    var placedW = 0, placedDocH = 0;
    function sizeCanvas() {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measureDoc();
    }
    function redistribute() {
      if (W < 80) return;
      var colors = palette();
      var n = desiredCount();
      var spots = jittered(n);
      if (!agents.length) {
        agents = spots.map(function (s, i) { return make(i, colors, s); });
        placedW = W; placedDocH = docH;
        return;
      }
      while (agents.length < n) {
        var s = spots[agents.length % spots.length];
        agents.push(make(agents.length, colors, s));
      }
      for (var i = agents.length - 1; i >= 0 && agents.length > n; i--) {
        if (agents[i].role === "wander") agents.splice(i, 1);
      }
      var si = 0;
      agents.forEach(function (ag) {
        if (ag.role === "escort") return;
        var s = spots[si++ % spots.length];
        ag.hx = s.x; ag.hy = s.y; ag.zone = zoneFor(s.y);
        if (ag.role === "wander") {
          ag.docX = s.x; ag.docY = s.y;
          ag.vx *= 0.2; ag.vy *= 0.2;
        }
      });
      placedW = W; placedDocH = docH;
    }
    function resize() {
      var oldW = W;
      sizeCanvas();
      if (!agents.length || oldW < 80 || Math.abs(W - placedW) > 60 || Math.abs(docH - placedDocH) > 200) {
        redistribute();
      } else {
        syncCount();
        placedDocH = docH;
      }
      assignEscort();
      collectBoxes();
    }

    var TEXT_SEL = "h1, h2, h3, p, li, figcaption, .lede, .work-note, .nav, .ov, .eyebrow, .meta, .tour-step-btn, .lv-tab, .lv-toggle, .footer-links a, .btn, .email, .pill, .metric, .sec-lede, .levels-intro";
    var MEDIA_SEL = "img, video, .mac, .lv-screen, .phone, .portrait-card, .shot";
    var TARGET_SEL = "h1, h2, h3, .card, .mac, .lv-screen, .phone img, .avc-hero, .portrait-card, .cta, .shot, .float-card, .pill, .btn";

    function rectsOf(sel, pad, minW) {
      var list = [], sy = getScroll();
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.closest && el.closest("[hidden], template")) return;
        var r = el.getBoundingClientRect();
        if (r.width < (minW || 8) || r.height < 6) return;
        if (r.bottom < -80 || r.top > H + 80 || r.right < 0 || r.left > W) return;
        list.push({
          l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad,
          w: r.width, h: r.height, el: el,
          docT: r.top + sy - pad, docB: r.bottom + sy + pad,
          docL: r.left - pad, docR: r.right + pad
        });
      });
      return list;
    }
    function collectBoxes() {
      boxes = rectsOf(TEXT_SEL, 10, 8).filter(function (b) { return b.w < W * 0.98 || b.h < 220; });
      media = rectsOf(MEDIA_SEL, 2, 40);
      targets = rectsOf(TARGET_SEL, 0, 40);
      boxesAt = performance.now();
    }
    function hit(list, x, y, pad) {
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        if (x > b.l - pad && x < b.r + pad && y > b.t - pad && y < b.b + pad) return b;
      }
      return null;
    }

    /* jittered grid over the FULL document height */
    function jittered(n) {
      measureDoc();
      var height = Math.max(docH, H);
      var cols = Math.max(3, Math.ceil(Math.sqrt(n * W / Math.max(height, 1))));
      var rows = Math.max(1, Math.ceil(n / cols));
      var spots = [], k = 0, mx = 36, my = 48;
      for (var row = 0; row < rows && k < n; row++) {
        var inRow = Math.round((n - k) / (rows - row));
        for (var col = 0; col < inRow && k < n; col++) {
          var x = mx + ((col + 0.5 + (Math.random() - 0.5) * 0.45) / inRow) * (W - mx * 2);
          var y = my + ((row + 0.5 + (Math.random() - 0.5) * 0.45) / rows) * (height - my * 2);
          spots.push({
            x: Math.min(W - mx, Math.max(mx, x)),
            y: Math.min(height - my, Math.max(my, y))
          });
          k++;
        }
      }
      return spots;
    }

    function zoneFor(docY) {
      var band = Math.max(H, 1);
      var i = Math.floor(docY / band);
      return { top: i * band, bottom: Math.min(docH, (i + 1) * band), i: i };
    }

    function make(i, colors, s) {
      var ang = Math.random() * Math.PI * 2, spd = 10 + Math.random() * 12;
      var z = zoneFor(s.y);
      return {
        docX: s.x, docY: s.y,
        x: s.x, y: s.y, /* viewport cache; escort lives here */
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        speed: spd, phase: Math.random() * 6.28, seed: Math.random() * 10,
        homeR: 160 + Math.random() * 120, /* 160–280 px local wander */
        gait: Math.random() * 6.28,
        color: colors[i % colors.length], angle: ang + Math.PI / 2,
        scale: 0.76 + Math.random() * 0.3,
        alpha: 0.74 + Math.random() * 0.12,
        vis: 0,
        rippleAt: 4 + Math.random() * 10,
        role: "wander",
        job: null,
        trail: [], trailOn: false, trailUntil: 0, trailAt: 0,
        esc: null, orbit: 0,
        hx: s.x, hy: s.y,
        zone: z
      };
    }

    function syncCount() {
      var colors = palette(), n = desiredCount();
      if (agents.length < n) {
        var existing = agents.map(function (a) { return { x: a.docX, y: a.docY }; });
        var spots = jittered(n * 2);
        spots.forEach(function (s) {
          if (agents.length >= n) return;
          var close = existing.some(function (e) { return Math.hypot(e.x - s.x, e.y - s.y) < 48; });
          if (close) return;
          var ag = make(agents.length, colors, s);
          ag.vis = 0;
          agents.push(ag);
          existing.push({ x: s.x, y: s.y });
        });
        while (agents.length < n) {
          var s2 = { x: 36 + Math.random() * Math.max(40, W - 72), y: 48 + Math.random() * Math.max(40, docH - 96) };
          agents.push(make(agents.length, colors, s2));
        }
      } else if (agents.length > n) {
        for (var i = agents.length - 1; i >= 0 && agents.length > n; i--) {
          if (agents[i].role === "wander") agents.splice(i, 1);
        }
      }
    }

    function rehome() {
      /* Keep the original grid homes so the field stays uniform.
         A tiny nudge is all that's allowed — never a new random x. */
      agents.forEach(function (ag) {
        if (ag.role !== "wander") return;
        ag.hx = Math.min(W - 36, Math.max(36, ag.hx + (Math.random() - 0.5) * 16));
        ag.hy = Math.min(docH - 36, Math.max(36, ag.hy + (Math.random() - 0.5) * 16));
      });
    }

    function recolor() {
      dark = isDark();
      var colors = palette();
      agents.forEach(function (ag, i) { ag.color = colors[i % colors.length]; });
    }

    var ESCORT = [
      { back: 34, side: -15, k: 5.2 },
      { back: 56, side: 20, k: 3.8 },
      { back: 82, side: -4, k: 2.7 }
    ];
    function assignEscort() {
      var sy = getScroll();
      agents.forEach(function (ag) {
        if (ag.role === "escort") {
          ag.role = "wander";
          ag.esc = null;
          ag.docX = ag.x;
          ag.docY = ag.y + sy;
          /* keep the original grid home; they will wander back */
        }
      });
      if (!escortOn() || !mouse.on) return;
      var free = agents.filter(function (a) { return a.role === "wander"; });
      free.sort(function (a, b) {
        var ay = a.docY - sy, by = b.docY - sy;
        return Math.hypot(a.docX - mouse.x, ay - mouse.y) - Math.hypot(b.docX - mouse.x, by - mouse.y);
      });
      for (var i = 0; i < ESCORT.length && i < free.length; i++) {
        var ag = free[i];
        ag.role = "escort";
        ag.esc = ESCORT[i];
        ag.orbit = Math.random() * 6.28;
        ag.x = ag.docX;
        ag.y = ag.docY - sy;
        ag.job = null;
      }
    }

    function jobCount() {
      var n = 0;
      for (var i = 0; i < agents.length; i++) {
        if (agents[i].role === "work" || agents[i].role === "meet") n++;
      }
      return n;
    }

    function visibleWanderers(sy) {
      var list = [];
      for (var i = 0; i < agents.length; i++) {
        var a = agents[i];
        if (a.role !== "wander") continue;
        var y = a.docY - sy;
        if (y > -H * 0.3 && y < H * 1.3) list.push(a);
      }
      return list;
    }

    function pickTarget(sy) {
      var pool = targets.filter(function (t) {
        return t.t < H * 0.95 && t.b > H * 0.08;
      });
      if (!pool.length) pool = targets;
      if (!pool.length && floatState.rects.length) {
        return { kind: "el", el: floatState.rects[0].el, r: floatState.rects[0] };
      }
      if (!pool.length) return null;
      var pick = pool[Math.floor(Math.random() * pool.length)];
      return { kind: "el", el: pick.el, r: pick };
    }

    /* a short word-span inside a visible paragraph, for select / type */
    function pickTextSpan(forType) {
      var nodes = document.querySelectorAll("main p, main .lede, main .work-note, main .lv-entry, main .lv-note, main figcaption, .tour-step p, .about-body p");
      var sy = getScroll();
      var cands = [];
      nodes.forEach(function (el) {
        if (el.closest && el.closest("[hidden], template")) return;
        var r = el.getBoundingClientRect();
        if (r.bottom < 40 || r.top > H - 40 || r.width < 60) return;
        cands.push(el);
      });
      if (!cands.length) return null;
      var el = cands[Math.floor(Math.random() * cands.length)];
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          return n.textContent && n.textContent.trim().length > 8 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var node = walker.nextNode();
      if (!node) return null;
      var text = node.textContent;
      var words = [];
      var re = /\S+/g, m;
      while ((m = re.exec(text))) words.push({ s: m.index, e: m.index + m[0].length });
      if (!words.length) return null;
      var i = Math.floor(Math.random() * words.length);
      var take = forType ? 1 : Math.min(words.length - i, 2 + Math.floor(Math.random() * 3));
      var a = words[i].s, b = words[Math.min(words.length, i + take) - 1].e;
      var range = document.createRange();
      try {
        range.setStart(node, a);
        range.setEnd(node, Math.min(text.length, b));
      } catch (err) { return null; }
      var rects = Array.prototype.slice.call(range.getClientRects()).filter(function (r) { return r.width > 2; });
      if (!rects.length) return null;
      return { el: el, range: range, rects: rects, sy: sy };
    }

    function placeFx(el, r, sy) {
      el.style.left = r.left + "px";
      el.style.top = (r.top + sy) + "px";
      el.style.width = r.width + "px";
      el.style.height = Math.max(2, r.height) + "px";
    }

    function startClickJob(pool, sy, t) {
      var tg = pickTarget(sy);
      if (!tg || !tg.r) return false;
      var r = tg.r;
      var u = 0.28 + Math.random() * 0.44, v = 0.28 + Math.random() * 0.44;
      var px = r.l + r.w * u;
      var py = (r.docT != null ? r.docT : (r.t + getScroll())) + r.h * v;
      px = Math.min(W - 24, Math.max(24, px));
      py = Math.min(docH - 16, Math.max(16, py));
      var ag = nearest(pool, px, py, sy);
      if (!ag) return false;
      ag.role = "work";
      ag.job = { kind: "click", phase: "go", tx: px, ty: py, el: tg.el, arrived: 0 };
      ag.trailOn = true; ag.trailUntil = t + 5;
      return true;
    }

    function startSelectJob(pool, sy, t) {
      var span = pickTextSpan(false);
      if (!span) return false;
      var r0 = span.rects[0], r1 = span.rects[span.rects.length - 1];
      var x1 = r0.left, y1 = r0.top + r0.height * 0.6 + sy;
      var x2 = r1.right, y2 = r1.top + r1.height * 0.6 + sy;
      var ag = nearest(pool, x1, y1, sy);
      if (!ag) return false;
      var boxes = span.rects.map(function (r) {
        var d = document.createElement("div");
        d.className = "ag-sel";
        placeFx(d, r, sy);
        getFx().appendChild(d);
        return { el: d, r: r };
      });
      ag.role = "work";
      ag.job = {
        kind: "select", phase: "go", tx: x1, ty: y1, x2: x2, y2: y2,
        boxes: boxes, sy0: sy, started: 0
      };
      ag.trailOn = true; ag.trailUntil = t + 6;
      return true;
    }

    function startTypeJob(pool, sy, t) {
      var span = pickTextSpan(true);
      if (!span) return false;
      var r = span.rects[span.rects.length - 1];
      var tx = r.right + 2, ty = r.top + r.height * 0.5 + sy;
      var ag = nearest(pool, tx, ty, sy);
      if (!ag) return false;
      var caret = document.createElement("div");
      caret.className = "ag-caret";
      caret.style.height = Math.max(12, r.height * 0.82) + "px";
      caret.style.left = tx + "px";
      caret.style.top = (r.top + sy + r.height * 0.1) + "px";
      caret.style.opacity = "0";
      getFx().appendChild(caret);
      ag.role = "work";
      ag.job = { kind: "type", phase: "go", tx: tx, ty: ty, caret: caret, started: 0 };
      return true;
    }

    function startNudgeJob(pool, sy, t) {
      var fr = (floatState.rects || []).filter(function (r) { return !r.dragging && r.b > 0 && r.t < H; });
      if (!fr.length) return false;
      var r = fr[Math.floor(Math.random() * fr.length)];
      var tx = r.l + r.w * 0.5, ty = r.t + r.h * 0.5 + sy;
      var ag = nearest(pool, tx, ty - 16, sy);
      if (!ag) return false;
      ag.role = "work";
      ag.job = { kind: "nudge", phase: "go", tx: tx, ty: r.t - 10 + sy, el: r.el, started: 0 };
      ag.trailOn = true; ag.trailUntil = t + 5;
      return true;
    }

    function startMeetJob(pool, sy, t) {
      if (pool.length < 2) return false;
      var a = pool[Math.floor(Math.random() * pool.length)];
      var b = null, bd = 1e9;
      pool.forEach(function (o) {
        if (o === a) return;
        var d = Math.hypot(o.docX - a.docX, o.docY - a.docY);
        if (d < bd && d > 40 && d < Math.max(W, H) * 0.8) { bd = d; b = o; }
      });
      if (!b) return false;
      var mx = (a.docX + b.docX) / 2, my = (a.docY + b.docY) / 2;
      a.role = "meet"; b.role = "meet";
      a.job = { kind: "meet", phase: "go", tx: mx - 9, ty: my, partner: b, started: 0 };
      b.job = { kind: "meet", phase: "go", tx: mx + 9, ty: my, partner: a, started: 0 };
      a.trailOn = true; a.trailUntil = t + 5;
      b.trailOn = true; b.trailUntil = t + 5;
      return true;
    }

    var TIP = { mark: { x: 13.5, y: 2.2 }, highlight: { x: 14.2, y: 3.4 } };
    function jobScale(ag) {
      return (ag.scale || 1) * (narrow() ? 1.15 : 1.5);
    }
    function tipOf(kind) {
      return TIP[kind === "highlight" ? "highlight" : "mark"];
    }
    function tipTarget(ag, tipX, tipY) {
      var tip = tipOf(ag.job && ag.job.kind), sc = jobScale(ag);
      return { x: tipX - tip.x * sc, y: tipY - tip.y * sc };
    }
    function agentAtTip(ag, tipX, tipY) {
      var dest = tipTarget(ag, tipX, tipY);
      ag.docX = dest.x;
      ag.docY = dest.y;
    }
    function drawingMarkCount() {
      var n = 0, i, a, j;
      for (i = 0; i < agents.length; i++) {
        a = agents[i]; j = a.job;
        if (j && isMarkKind(j.kind)) n++;
      }
      return n;
    }
    function drawingMarkKinds() {
      var k = {}, i, a, j;
      for (i = 0; i < agents.length; i++) {
        a = agents[i]; j = a.job;
        if (j && isMarkKind(j.kind)) k[j.kind] = true;
      }
      return k;
    }
    function leaveTrace(kind, docX, docY, w, h) {
      var d = document.createElement("div");
      d.className = "ag-trace ag-trace-" + kind;
      if (w == null) { w = 24; h = 24; }
      d.style.left = (docX - w / 2) + "px";
      d.style.top = (docY - h / 2) + "px";
      d.style.width = w + "px";
      d.style.height = h + "px";
      getFx().appendChild(d);
      requestAnimationFrame(function () { d.classList.add("is-on"); });
      setTimeout(function () {
        d.classList.remove("is-on");
        setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 700);
      }, 480);
    }

    function startMarkJob(pool, sy, t) {
      if (!markQueue.length || drawingMarkCount() >= 2) return false;
      /* drop stale entries, prefer a kind that is not already being drawn */
      var used = drawingMarkKinds();
      var pick = -1, fallback = -1, i, el, kind, segs;
      for (i = 0; i < markQueue.length; i++) {
        el = markQueue[i];
        if (!el || !el.isConnected || el.classList.contains("is-set") || el.classList.contains("is-drawing")) continue;
        segs = markSegments(el, sy);
        if (!segs.length) continue;
        kind = el.getAttribute("data-mark") === "highlight" ? "highlight" : "mark";
        if (fallback < 0) fallback = i;
        if (!used[kind]) { pick = i; break; }
      }
      if (pick < 0) pick = fallback;
      if (pick < 0) return false;
      el = markQueue.splice(pick, 1)[0];
      segs = markSegments(el, sy);
      if (!segs.length) return false;
      kind = el.getAttribute("data-mark") === "highlight" ? "highlight" : "mark";
      var ag = nearest(pool, segs[0].x1, segs[0].y1, sy);
      if (!ag) { markQueue.splice(pick, 0, el); return false; }
      ensureMarkSvg(el);
      el.classList.add("is-drawing");
      setMarkProgress(el, 0);
      ag.role = "work";
      var dest = tipTarget({ job: { kind: kind }, scale: ag.scale }, segs[0].x1, segs[0].y1);
      ag.job = {
        kind: kind, phase: "go", el: el, segs: segs,
        tx: dest.x, ty: dest.y,
        started: 0, progress: 0, segI: 0, segP: 0,
        speed: 68 + Math.random() * 18
      };
      ag.trailOn = true; ag.trailUntil = t + 10;
      return true;
    }

    function nearest(pool, docX, docY, sy) {
      var best = null, bd = 1e9;
      pool.forEach(function (a) {
        var d = Math.hypot(a.docX - docX, a.docY - docY);
        var vy = a.docY - sy;
        if (vy < -H || vy > H * 2) return;
        if (d < bd) { bd = d; best = a; }
      });
      return best;
    }

    function endJob(ag) {
      var jb = ag.job;
      if (jb) {
        if (jb.boxes) jb.boxes.forEach(function (b) {
          b.el.classList.remove("is-on");
          setTimeout(function () { if (b.el.parentNode) b.el.parentNode.removeChild(b.el); }, 600);
        });
        if (isMarkKind(jb.kind)) {
          if (jb.el && !jb.el.classList.contains("is-set")) {
            setMarkProgress(jb.el, 1);
            jb.el.classList.remove("is-drawing");
            jb.el.classList.add("is-set");
          }
        }
        if (jb.caret) {
          var caret = jb.caret;
          caret.classList.add("is-off");
          setTimeout(function () { if (caret.parentNode) caret.parentNode.removeChild(caret); }, 500);
        }
      }
      ag.role = "wander";
      ag.job = null;
    }

    var nextJob = 0.55, nextRehome = 18;
    function visibleJobCount(sy) {
      var n = 0;
      for (var i = 0; i < agents.length; i++) {
        var a = agents[i];
        if (a.role !== "work" && a.role !== "meet") continue;
        var y = a.docY - sy;
        if (y > -80 && y < H + 80) n++;
      }
      return n;
    }
    function visibleJobKinds(sy) {
      var k = {};
      for (var i = 0; i < agents.length; i++) {
        var a = agents[i];
        if ((a.role !== "work" && a.role !== "meet") || !a.job) continue;
        var y = a.docY - sy;
        if (y > -80 && y < H + 80) k[a.job.kind] = (k[a.job.kind] || 0) + 1;
      }
      return k;
    }
    function schedule(t, sy) {
      var visBusy = visibleJobCount(sy);
      /* marks: nearest available character takes a phrase as it enters the viewport.
         Up to two at once (scholar + highlighter) so both kinds of work can be seen. */
      if (markQueue.length && drawingMarkCount() < 2) {
        var mpool = visibleWanderers(sy);
        if (!mpool.length) {
          mpool = agents.filter(function (a) { return a.role === "wander"; });
        }
        if (startMarkJob(mpool, sy, t)) mpool = visibleWanderers(sy);
        if (markQueue.length && drawingMarkCount() < 2) startMarkJob(mpool, sy, t);
        visBusy = visibleJobCount(sy);
      }
      if (visBusy >= 5) return;
      if (t < nextJob && visBusy >= 3) return;
      var pool = visibleWanderers(sy);
      if (pool.length < 1) { nextJob = t + 0.6; return; }
      var kinds = visibleJobKinds(sy);
      var prefer = ["click", "select", "type", "nudge", "meet"].filter(function (k) { return !kinds[k]; });
      if (!prefer.length) prefer = ["click", "select", "type", "nudge"];
      /* light shuffle */
      if (prefer.length > 1 && Math.random() < 0.5) prefer.push(prefer.shift());
      if (prefer.length > 2 && Math.random() < 0.5) prefer.push(prefer.shift());
      var starters = {
        click: startClickJob, select: startSelectJob, type: startTypeJob,
        nudge: startNudgeJob, meet: startMeetJob
      };
      var ok = false, ki;
      for (ki = 0; ki < prefer.length && !ok; ki++) {
        if (prefer[ki] === "meet" && visBusy >= 4) continue;
        ok = starters[prefer[ki]](pool, sy, t);
        if (ok) pool = visibleWanderers(sy);
      }
      visBusy = visibleJobCount(sy);
      nextJob = t + (visBusy < 3 ? 0.3 : 0.85) + Math.random() * 0.6;
    }

    function flow(x, y, t, seed) {
      var a = Math.sin(y * 0.0032 + t * 0.16 + seed) + Math.cos(x * 0.0026 + t * 0.12);
      var b = Math.cos(x * 0.0029 + y * 0.0021 + t * 0.1 + seed);
      return [Math.cos(a * 1.35), Math.sin(b * 1.35 + a * 0.35)];
    }
    function wrapAngle(a) {
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      return a;
    }

    function steerTo(ag, tx, ty, step, speedMul, arrive, absSpeed) {
      var dx = tx - ag.docX, dy = ty - ag.docY, d = Math.hypot(dx, dy) || 1;
      var s = absSpeed || Math.min(ag.speed * (speedMul || 2), 18 + d * 0.85);
      var dvx = (dx / d) * s, dvy = (dy / d) * s;
      var st = 1 - Math.exp(-2.6 * step);
      ag.vx += (dvx - ag.vx) * st;
      ag.vy += (dvy - ag.vy) * st;
      ag.docX += ag.vx * step;
      ag.docY += ag.vy * step;
      var want = Math.atan2(ag.vy, ag.vx) + Math.PI / 2;
      ag.angle += wrapAngle(want - ag.angle) * (1 - Math.exp(-5.5 * step));
      return d < (arrive || 7);
    }

    function simulate(step, t, sy, dsy) {
      var i, j, ag, f, fl, dx, dy, d, inv, dvx, dvy, spd, b;
      var n = agents.length;
      var R = Math.max(90, Math.sqrt((W * H) / Math.max(perScreen(), 1)) * 0.48), R2 = R * R;
      var idle = t - mouse.movedAt;
      var mouseLive = mouse.on && escortOn();
      var loosen = Math.min(1, Math.max(0, (idle - 0.6) / 1.6));
      var mouseDocX = mouse.x, mouseDocY = mouse.y + sy;

      for (i = 0; i < n; i++) {
        ag = agents[i];

        /* escort: viewport-space, dragged by scroll then catching up */
        if (ag.role === "escort") {
          ag.y += dsy; /* dragged with the page for a moment */
          if (mouseLive) {
            var e = ag.esc;
            var bx = -mouse.dirX, by = -mouse.dirY, sxv = -by, syv = bx;
            var grow = 1 + loosen * 1.6;
            ag.orbit += step * (0.25 + loosen * 0.35);
            var drift = loosen * 18;
            var tx = mouse.x + (bx * e.back + sxv * e.side) * grow + Math.cos(ag.orbit + ag.seed) * drift;
            var ty = mouse.y + (by * e.back + syv * e.side) * grow + Math.sin(ag.orbit * 0.8 + ag.seed) * drift;
            var k = e.k * (1 - loosen * 0.75);
            var wv = (1 - loosen) * 1 + loosen * 0.35;
            var fvx = (tx - ag.x) * k, fvy = (ty - ag.y) * k;
            var flowv = flow(ag.x, ag.y + sy, t, ag.seed);
            dvx = fvx * wv + flowv[0] * 10 * (1 - wv) * 0.6;
            dvy = fvy * wv + flowv[1] * 10 * (1 - wv) * 0.6;
            var st = 1 - Math.exp(-7 * step);
            ag.vx += (dvx - ag.vx) * st;
            ag.vy += (dvy - ag.vy) * st;
            ag.x += ag.vx * step;
            ag.y += ag.vy * step;
            var want = Math.atan2(ag.vy, ag.vx) + Math.PI / 2;
            var vm = Math.hypot(ag.vx, ag.vy);
            if (vm > 4) ag.angle += wrapAngle(want - ag.angle) * (1 - Math.exp(-5.5 * step));
          }
          /* never sit on the pointer */
          if (mouse.on && mqFine.matches) {
            dx = ag.x - mouse.x; dy = ag.y - mouse.y; d = Math.hypot(dx, dy);
            if (d < 30 && d > 0.01) { ag.x += (dx / d) * 4; ag.y += (dy / d) * 4; }
          }
          ag.docX = ag.x;
          ag.docY = ag.y + sy;
          continue;
        }

        /* work / meet in document space */
        if ((ag.role === "work" || ag.role === "meet") && ag.job) {
          var jb = ag.job;
          if (jb.phase === "go") {
            var goMul = isMarkKind(jb.kind) ? 1.5 : 2.15;
            var goArr = isMarkKind(jb.kind) ? 10 : 6;
            var goSpd = isMarkKind(jb.kind) ? 110 : 0;
            if (steerTo(ag, jb.tx, jb.ty, step, goMul, goArr, goSpd)) {
              if (isMarkKind(jb.kind)) {
                jb.phase = "draw";
                jb.started = t;
                jb.segI = 0;
                jb.segP = 0;
                if (jb.segs && jb.segs[0]) agentAtTip(ag, jb.segs[0].x1, jb.segs[0].y1);
              } else {
                jb.phase = "do";
                jb.started = t;
                if (jb.kind === "click" || jb.kind === "nudge") jb.clickAt = t + 0.28 + Math.random() * 0.35;
                if (jb.kind === "select" && jb.boxes) jb.boxes.forEach(function (b) { b.el.classList.add("is-on"); });
                if (jb.kind === "type" && jb.caret) {
                  jb.caret.style.opacity = "1";
                  leaveTrace("type", jb.tx, jb.ty, 3, parseFloat(jb.caret.style.height) || 16);
                }
              }
            }
          } else if (jb.phase === "draw" && isMarkKind(jb.kind)) {
            /* refresh doc-space segments so scroll doesn't desync the tip */
            var fresh = markSegments(jb.el, sy);
            if (fresh.length) jb.segs = fresh;
            var segs = jb.segs || [];
            if (!segs.length) {
              setMarkProgress(jb.el, 1);
              jb.el.classList.remove("is-drawing");
              jb.el.classList.add("is-set");
              jb.phase = "done"; jb.started = t; jb.baseX = ag.docX; jb.baseY = ag.docY;
            } else {
              if (jb.segI >= segs.length) jb.segI = segs.length - 1;
              var seg = segs[jb.segI];
              var spd = jb.speed || 75;
              jb.segP = (jb.segP || 0) + (spd * step) / Math.max(seg.len, 1);
              var doneLines = jb.segI;
              var frac = Math.min(1, jb.segP);
              if (jb.segP >= 1) {
                setMarkLineProgress(jb.el, jb.segI + 1, 1);
                if (jb.segI + 1 < segs.length) {
                  jb.phase = "wrap";
                  jb.started = t;
                  jb.segI += 1;
                  jb.segP = 0;
                  jb.fromX = ag.docX; jb.fromY = ag.docY;
                  var nxt = tipTarget(ag, segs[jb.segI].x1, segs[jb.segI].y1);
                  jb.tx = nxt.x; jb.ty = nxt.y;
                } else {
                  setMarkProgress(jb.el, 1);
                  jb.el.classList.remove("is-drawing");
                  jb.el.classList.add("is-set");
                  jb.phase = "done";
                  jb.started = t;
                  jb.baseX = ag.docX;
                  jb.baseY = ag.docY;
                }
              } else {
                var tipX = seg.x1 + (seg.x2 - seg.x1) * frac;
                var tipY = seg.y1 + (seg.y2 - seg.y1) * frac;
                agentAtTip(ag, tipX, tipY);
                ag.vx = spd * 0.7;
                ag.vy = 0;
                ag.gait = (ag.gait || 0) + step * 9.5;
                setMarkLineProgress(jb.el, doneLines, frac);
              }
            }
          } else if (jb.phase === "wrap" && isMarkKind(jb.kind)) {
            var wu = Math.min(1, (t - jb.started) / 0.28);
            ag.docX = jb.fromX + (jb.tx - jb.fromX) * wu;
            ag.docY = jb.fromY + (jb.ty - jb.fromY) * wu - Math.sin(wu * Math.PI) * 9;
            ag.vx = (jb.tx - jb.fromX) * 2;
            ag.vy = 0;
            ag.gait = (ag.gait || 0) + step * 8;
            if (wu >= 1) {
              jb.phase = "draw";
              jb.segP = 0;
              agentAtTip(ag, jb.segs[jb.segI].x1, jb.segs[jb.segI].y1);
            }
          } else if (jb.phase === "done" && isMarkKind(jb.kind)) {
            var du = Math.min(1, (t - jb.started) / 0.48);
            ag.docX = jb.baseX;
            ag.docY = jb.baseY - Math.sin(du * Math.PI) * 12;
            ag.vx = 0;
            ag.vy = du < 0.5 ? -18 : 18;
            if (du >= 1) {
              jb.phase = "leave";
              jb.started = t;
              jb.tx = ag.hx != null ? ag.hx : ag.docX + 80;
              jb.ty = ag.hy != null ? ag.hy : ag.docY;
            }
          } else if (jb.phase === "leave" && isMarkKind(jb.kind)) {
            if (steerTo(ag, jb.tx, jb.ty, step, 1.22, 14, 105) || (t - jb.started) > 1.7) endJob(ag);
          } else if (jb.phase === "do") {
            if (jb.kind === "click" || jb.kind === "nudge") {
              ag.vx *= 0.85; ag.vy *= 0.85;
              ag.docX += (jb.tx - ag.docX) * 6 * step;
              ag.docY += (jb.ty - ag.docY) * 6 * step;
              if (!jb.clicked && t > jb.clickAt) {
                jb.clicked = true;
                ripples.push({ x: ag.docX, y: ag.docY, r: 1.5, life: 1, color: ag.color, click: true });
                ripples.push({ x: ag.docX, y: ag.docY, r: 1, life: 0.8, color: ag.color, click: true, delay: 0.16 });
                leaveTrace(jb.kind === "nudge" ? "nudge" : "click", ag.docX, ag.docY, 28, 28);
                if (jb.kind === "nudge" && jb.el && floatState.nudge && !floatState.dragging) floatState.nudge(jb.el);
              }
              if (jb.clicked && t > jb.started + 1.05) endJob(ag);
            } else if (jb.kind === "select") {
              if (!jb.traced && jb.boxes && jb.boxes[0]) {
                jb.traced = true;
                var br = jb.boxes[0].r;
                leaveTrace("inspect", br.left + br.width / 2, br.top + jb.sy0 + br.height / 2, br.width + 10, br.height + 8);
              }
              var dur = 0.7 + 0.25;
              var u = Math.min(1, (t - jb.started) / 0.75);
              ag.docX = jb.tx + (jb.x2 - jb.tx) * u;
              ag.docY = jb.ty + (jb.y2 - jb.ty) * u;
              ag.angle = Math.atan2(jb.y2 - jb.ty, jb.x2 - jb.tx) + Math.PI / 2;
              if (jb.boxes) {
                jb.boxes.forEach(function (b, idx) {
                  var p = Math.min(1, Math.max(0, u * jb.boxes.length - idx));
                  b.el.style.width = (b.r.width * p) + "px";
                });
              }
              if (u >= 1 && t > jb.started + 1.15) endJob(ag);
            } else if (jb.kind === "type") {
              ag.vx *= 0.8; ag.vy *= 0.8;
              ag.docX += (jb.tx - ag.docX) * 5 * step;
              ag.docY += (jb.ty - ag.docY) * 5 * step;
              if (t > jb.started + 1.5 + Math.random() * 0.4) endJob(ag);
            } else if (jb.kind === "meet") {
              ag.docX += (jb.tx - ag.docX) * 5 * step;
              ag.docY += (jb.ty - ag.docY) * 5 * step;
              if (!jb.rippled && t > jb.started + 0.25) {
                jb.rippled = true;
                ripples.push({ x: (ag.docX + (jb.partner ? jb.partner.docX : ag.docX)) / 2, y: ag.docY, r: 2, life: 0.9, color: ag.color });
              }
              if (t > jb.started + 0.95) endJob(ag);
            }
          }
          continue;
        }

        /* wander in document space, tethered to a home zone */
        var steerRate = 2.15;
        f = flow(ag.docX, ag.docY, t, ag.seed);
        fl = Math.hypot(f[0], f[1]) || 1;
        spd = ag.speed * (1 + 0.1 * Math.sin(t * 0.32 + ag.phase));
        dvx = (f[0] / fl) * spd;
        dvy = (f[1] / fl) * spd;

        /* even spread among nearby agents */
        for (j = 0; j < n; j++) {
          if (j === i) continue;
          var og = agents[j];
          var ox = og.role === "escort" ? og.x : og.docX;
          var oy = og.role === "escort" ? og.y + sy : og.docY;
          dx = ag.docX - ox; dy = ag.docY - oy;
          d = dx * dx + dy * dy;
          if (d < 0.01 || d > R2) continue;
          d = Math.sqrt(d); inv = 1 - d / R;
          var frc = inv * inv * 48;
          dvx += (dx / d) * frc; dvy += (dy / d) * frc;
        }
        /* a small personal space around the visitor's pointer — not a hole in the centre */
        if (mouse.on && mqFine.matches) {
          dx = ag.docX - mouseDocX; dy = ag.docY - mouseDocY; d = Math.hypot(dx, dy);
          if (d < 48 && d > 0.01) {
            inv = 1 - d / 48;
            dvx += (dx / d) * inv * inv * 70; dvy += (dy / d) * inv * inv * 70;
          }
          if (d < 22 && d > 0.01) { dvx += (dx / d) * 90; dvy += (dy / d) * 90; }
        }
        /* calm wander inside a 150–300 px home radius; pull hard if they stray */
        dx = ag.hx - ag.docX; dy = ag.hy - ag.docY; d = Math.hypot(dx, dy);
        var homeR = ag.homeR || 200;
        if (d > 36) {
          var hk = (d < homeR)
            ? ((d - 36) / homeR) * 28
            : 28 + (d - homeR) * 4.5;
          dvx += (dx / d) * hk; dvy += (dy / d) * hk;
        }
        /* document edges (no wrap) — soft, so they don't pile up on the margins */
        if (ag.docX < 28) dvx += ((28 - ag.docX) / 28) * 40;
        else if (ag.docX > W - 28) dvx -= ((ag.docX - (W - 28)) / 28) * 40;
        if (ag.docY < 20) dvy += ((20 - ag.docY) / 20) * 40;
        else if (ag.docY > docH - 20) dvy -= ((ag.docY - (docH - 20)) / 20) * 40;
        /* ease aside from a card only while it is being dragged */
        if (floatState.rects.length) {
          var fi, fb, fpad, fforce, fcx, fcy, fdx, fdy, fd;
          var viewY = ag.docY - sy;
          for (fi = 0; fi < floatState.rects.length; fi++) {
            fb = floatState.rects[fi];
            if (!fb.dragging) continue;
            fpad = 56;
            if (ag.docX <= fb.l - fpad || ag.docX >= fb.r + fpad || viewY <= fb.t - fpad || viewY >= fb.b + fpad) continue;
            fcx = (fb.l + fb.r) / 2; fcy = (fb.t + fb.b) / 2;
            fdx = ag.docX - fcx; fdy = viewY - fcy; fd = Math.hypot(fdx, fdy) || 1;
            fforce = 280 * Math.max(0, 1 - fd / 200);
            dvx += (fdx / fd) * fforce;
            dvy += (fdy / fd) * fforce;
          }
        }

        var stw = 1 - Math.exp(-steerRate * step);
        ag.vx += (dvx - ag.vx) * stw;
        ag.vy += (dvy - ag.vy) * stw;
        ag.docX += ag.vx * step;
        ag.docY += ag.vy * step;
        var vm = Math.hypot(ag.vx, ag.vy);
        if (vm > 4) {
          var want2 = Math.atan2(ag.vy, ag.vx) + Math.PI / 2;
          ag.angle += wrapAngle(want2 - ag.angle) * (1 - Math.exp(-5.5 * step));
        }
      }

      /* ripples live in document space */
      for (i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i];
        if (rp.delay > 0) { rp.delay -= step; continue; }
        rp.r += (rp.click ? 26 : 18) * step;
        rp.life -= (rp.click ? 1.1 : 0.55) * step;
        if (rp.life <= 0) ripples.splice(i, 1);
      }
    }

    function along(segs, p) {
      var total = 0, j;
      for (j = 0; j < segs.length; j++) total += segs[j].len;
      var d = Math.max(0, Math.min(1, p)) * total, L, u;
      for (j = 0; j < segs.length; j++) {
        L = segs[j].len || 1;
        if (d <= L) {
          u = d / L;
          return {
            x: segs[j].x1 + (segs[j].x2 - segs[j].x1) * u,
            y: segs[j].y1 + (segs[j].y2 - segs[j].y1) * u,
            ang: Math.atan2(segs[j].y2 - segs[j].y1, segs[j].x2 - segs[j].x1)
          };
        }
        d -= L;
      }
      var s = segs[segs.length - 1];
      return { x: s.x2, y: s.y2, ang: Math.atan2(s.y2 - s.y1, s.x2 - s.x1) };
    }

    function drawArrowBody(ag) {
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, 16.5); ctx.lineTo(4.1, 13); ctx.lineTo(7.1, 20.2);
      ctx.lineTo(9.5, 19.1); ctx.lineTo(6.5, 12); ctx.lineTo(12.4, 12);
      ctx.closePath();
      ctx.fillStyle = ag.color;
      ctx.shadowColor = dark ? ag.color : "rgba(14,14,16,0.28)";
      ctx.shadowBlur = dark ? 7 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = dark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.96)";
      ctx.lineWidth = dark ? 1 : 2.2;
      ctx.stroke();
      if (!dark) {
        ctx.strokeStyle = "rgba(14,14,16,0.3)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
    function limbOutline() { return dark ? "rgba(255,255,255,0.95)" : "rgba(14,14,16,0.85)"; }
    function strokeSeg(x1, y1, x2, y2, color) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = limbOutline();
      ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.85;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    function endDot(x, y, color, r) {
      r = r || 1.25;
      ctx.beginPath(); ctx.arc(x, y, r + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = limbOutline(); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
    }
    /* 4-frame walk cycle, angles off straight-down. Contact frames sit in between. */
    var WALK = [
      { l: -0.40, r:  0.34 },
      { l: -0.05, r:  0.05 },
      { l:  0.34, r: -0.40 },
      { l:  0.05, r: -0.05 }
    ];

    function armPose(ag) {
      var job = ag.job, kind = job && job.kind;
      var jobT = simT - ((job && job.started) || simT);
      var tap = (job && job.phase === "do" && (kind === "click" || kind === "nudge"))
        ? ((Math.floor(jobT * 6) & 1) ? 0.72 : 0.18)
        : 0.28;
      var angL, angR;
      if (kind === "click" || kind === "nudge") {
        angL = Math.PI * 0.72;
        angR = 0.15 + tap;
      } else if (kind === "type") {
        var up = (Math.floor((ag.gait || 0) * 1.15) & 1) === 0;
        if (typeof ag._sheetFrame === "number") up = (ag._sheetFrame & 1) === 0;
        angL = Math.PI * 0.62 + (up ? -0.28 : 0.32);
        angR = Math.PI * 0.38 + (up ? 0.32 : -0.28);
      } else if (kind === "mark" || kind === "highlight") {
        angL = Math.PI * 0.72;
        angR = -0.95;
        if (job && job.phase === "done") {
          var tapU = Math.min(1, jobT / 0.48);
          angR = -0.95 + Math.sin(tapU * Math.PI) * 0.55;
        }
      } else if (kind === "select") {
        angL = Math.PI * 0.95;
        angR = Math.PI * 0.35;
      } else if (kind === "meet") {
        angL = -1.05 + 0.15 * Math.sin((ag.gait || 0) * 0.8);
        angR = Math.PI * 0.4;
      } else {
        angL = Math.PI * 0.7; angR = Math.PI * 0.3;
      }
      var shL = { x: 0.4, y: 9.6 }, shR = { x: 11.8, y: 9.4 }, arm = 7.4;
      return {
        kind: kind,
        shL: shL, shR: shR,
        handL: { x: shL.x + Math.cos(angL) * arm, y: shL.y + Math.sin(angL) * arm },
        handR: { x: shR.x + Math.cos(angR) * arm, y: shR.y + Math.sin(angR) * arm }
      };
    }

    function drawLegs(ag) {
      var color = ag.color;
      var job = ag.job;
      var moving = Math.hypot(ag.vx, ag.vy) > 6 || (job && (job.phase === "go" || job.phase === "draw" || job.phase === "leave" || job.phase === "wrap") && !job._sheetStill);
      var frame = moving ? (Math.floor(ag.gait || 0) & 3) : 1;
      if (typeof ag._sheetFrame === "number") frame = ag._sheetFrame & 3;
      var wlk = WALK[frame];
      var hipL = { x: 3.0, y: 18.5 }, hipR = { x: 8.4, y: 18.5 }, leg = 7.6;
      var aL = Math.PI / 2 + wlk.l, aR = Math.PI / 2 + wlk.r;
      var fL = { x: hipL.x + Math.cos(aL) * leg, y: hipL.y + Math.sin(aL) * leg };
      var fR = { x: hipR.x + Math.cos(aR) * leg, y: hipR.y + Math.sin(aR) * leg };
      strokeSeg(hipL.x, hipL.y, fL.x, fL.y, color);
      strokeSeg(hipR.x, hipR.y, fR.x, fR.y, color);
      endDot(fL.x, fL.y, color, 1.35);
      endDot(fR.x, fR.y, color, 1.35);
    }

    function drawArms(ag) {
      var color = ag.color, p = armPose(ag);
      strokeSeg(p.shL.x, p.shL.y, p.handL.x, p.handL.y, color);
      strokeSeg(p.shR.x, p.shR.y, p.handR.x, p.handR.y, color);
      endDot(p.handL.x, p.handL.y, color, 1.25);
      endDot(p.handR.x, p.handR.y, color, 1.25);
      if (p.kind === "mark") drawPencil(p.handR.x, p.handR.y, TIP.mark.x, TIP.mark.y);
      if (p.kind === "highlight") drawMarker(p.handR.x, p.handR.y, TIP.highlight.x, TIP.highlight.y);
      if (p.kind === "select") drawClipboard(p.handL.x - 0.3, p.handL.y + 0.2);
    }

    function drawPencil(x1, y1, x2, y2) {
      var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
      var ux = dx / L, uy = dy / L, px = -uy, py = ux;
      var outline = limbOutline();
      ctx.lineCap = "round";
      ctx.strokeStyle = outline; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * 2.5, y2 - uy * 2.5); ctx.stroke();
      ctx.strokeStyle = dark ? "#F3E3A0" : "#D4A017"; ctx.lineWidth = 2.1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * 2.5, y2 - uy * 2.5); ctx.stroke();
      ctx.strokeStyle = dark ? "#D0D0D0" : "#6A6A6A"; ctx.lineWidth = 2.25;
      ctx.beginPath();
      ctx.moveTo(x1 + ux * 0.15, y1 + uy * 0.15);
      ctx.lineTo(x1 + ux * 1.55, y1 + uy * 1.55);
      ctx.stroke();
      ctx.fillStyle = dark ? "#FF3347" : "#D7193A";
      ctx.strokeStyle = outline; ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - ux * 3.2 + px * 1.2, y2 - uy * 3.2 + py * 1.2);
      ctx.lineTo(x2 - ux * 3.2 - px * 1.2, y2 - uy * 3.2 - py * 1.2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    function drawMarker(x1, y1, x2, y2) {
      /* chunky highlighter: wide barrel, felt chisel tip lands exactly at (x2, y2) */
      var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
      var ux = dx / L, uy = dy / L, px = -uy, py = ux;
      var outline = limbOutline();
      var tipLen = 2.9, half = 2.05;
      var bx = x2 - ux * tipLen, by = y2 - uy * tipLen;
      var body = dark ? "#F0C429" : "#E8B923";
      var bodyDk = dark ? "#C49212" : "#B8860B";
      var felt = dark ? "#5A3A08" : "#3A2506";
      ctx.save();
      ctx.lineJoin = "round";
      /* barrel outline */
      ctx.beginPath();
      ctx.moveTo(x1 + px * half, y1 + py * half);
      ctx.lineTo(bx + px * half, by + py * half);
      ctx.lineTo(bx - px * half, by - py * half);
      ctx.lineTo(x1 - px * half, y1 - py * half);
      ctx.closePath();
      ctx.fillStyle = body;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.15;
      ctx.fill(); ctx.stroke();
      /* dark stripe along the barrel */
      ctx.strokeStyle = bodyDk;
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(x1 + px * 0.55, y1 + py * 0.55);
      ctx.lineTo(bx + px * 0.55, by + py * 0.55);
      ctx.stroke();
      /* felt chisel, tip at (x2,y2) */
      ctx.beginPath();
      ctx.moveTo(bx + px * (half * 0.72), by + py * (half * 0.72));
      ctx.lineTo(x2, y2);
      ctx.lineTo(bx - px * (half * 0.72), by - py * (half * 0.72));
      ctx.closePath();
      ctx.fillStyle = felt;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 0.7;
      ctx.fill(); ctx.stroke();
      /* cap clip */
      ctx.fillStyle = dark ? "#2A6B4F" : "#1F5A42";
      ctx.beginPath();
      ctx.arc(x1 + ux * 1.1 - px * (half + 0.55), y1 + uy * 1.1 - py * (half + 0.55), 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawClipboard(cx, cy) {
      var outline = dark ? "rgba(20,20,22,0.8)" : "rgba(14,14,16,0.7)";
      ctx.save();
      ctx.translate(cx, cy);
      if (typeof ctx.roundRect !== "function") {
        ctx.roundRect = function (x, y, w, h) { ctx.rect(x, y, w, h); };
      }
      ctx.fillStyle = dark ? "#F4F1EA" : "#FFFDF8";
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.0;
      ctx.beginPath(); ctx.roundRect(-3.7, -5.3, 7.4, 10.8, 0.85); ctx.fill(); ctx.stroke();
      ctx.fillStyle = dark ? "#C9C9CC" : "#8A8A90";
      ctx.beginPath(); ctx.roundRect(-2.05, -6.4, 4.1, 2.45, 0.5); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = dark ? "rgba(30,30,32,0.45)" : "rgba(14,14,16,0.4)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(-2.15, -2.2); ctx.lineTo(2.15, -2.2);
      ctx.moveTo(-2.15, 0.25); ctx.lineTo(2.15, 0.25);
      ctx.moveTo(-2.15, 2.7); ctx.lineTo(1.25, 2.7);
      ctx.stroke();
      ctx.restore();
    }

    function drawHat(kind) {
      /* Upright local space, origin sitting on the arrow's head (just above the tip). */
      if (kind === "click" || kind === "nudge" || kind === "select") {
        ctx.fillStyle = "#F0C429";
        ctx.strokeStyle = dark ? "rgba(40,24,0,0.88)" : "rgba(70,45,0,0.72)";
        ctx.lineWidth = 1.05;
        /* taller dome, not a saucer */
        ctx.beginPath();
        ctx.moveTo(-5.15, 1.05);
        ctx.bezierCurveTo(-5.5, -7.2, 5.5, -7.2, 5.15, 1.05);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        /* slim brim */
        ctx.beginPath();
        ctx.ellipse(0, 1.2, 7.0, 0.95, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#E8B923";
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -6.4); ctx.lineTo(0, 0.55);
        ctx.strokeStyle = "rgba(120,80,0,0.35)";
        ctx.lineWidth = 0.85;
        ctx.stroke();
      } else if (kind === "mark") {
        var board = dark ? "#16161A" : "#1A1A1C";
        var edge = dark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.72)";
        ctx.fillStyle = board;
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1.1;
        /* shallow cap */
        ctx.beginPath();
        ctx.moveTo(-2.8, 0.1); ctx.lineTo(-2.8, 2.3); ctx.lineTo(2.8, 2.3); ctx.lineTo(2.8, 0.1);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        /* compact square board */
        ctx.beginPath();
        ctx.moveTo(0, -3.35);
        ctx.lineTo(6.3, -0.45);
        ctx.lineTo(0, 2.45);
        ctx.lineTo(-6.3, -0.45);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -0.45, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = "#E8B923"; ctx.fill();
        /* tassel hangs to the right, short of the pencil */
        ctx.strokeStyle = "#E8B923";
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, -0.45);
        ctx.quadraticCurveTo(4.4, 0.8, 5.6, 3.6);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(5.6, 4.5, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = "#E8B923"; ctx.fill();
        ctx.strokeStyle = edge; ctx.lineWidth = 0.55; ctx.stroke();
      } else if (kind === "type") {
        var cup = dark ? "#1E1E22" : "#1A1A1C";
        var band = dark ? "rgba(245,245,245,0.96)" : "rgba(28,28,32,0.88)";
        var edge = dark ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.55)";
        ctx.strokeStyle = limbOutline();
        ctx.lineWidth = 2.7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 3.3, 7.15, Math.PI * 1.08, Math.PI * 1.92, false);
        ctx.stroke();
        ctx.strokeStyle = band;
        ctx.lineWidth = 1.85;
        ctx.beginPath();
        ctx.arc(0, 3.3, 7.15, Math.PI * 1.08, Math.PI * 1.92, false);
        ctx.stroke();
        function cupAt(x, y) {
          ctx.beginPath();
          ctx.ellipse(x, y, 2.45, 3.25, 0, 0, Math.PI * 2);
          ctx.fillStyle = cup;
          ctx.strokeStyle = edge;
          ctx.lineWidth = 1.0;
          ctx.fill(); ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(x, y, 1.25, 1.95, 0, 0, Math.PI * 2);
          ctx.fillStyle = dark ? "#3A3A40" : "#2A2A2E";
          ctx.fill();
        }
        cupAt(-6.7, 4.5);
        cupAt(6.7, 4.5);
      } else if (kind === "highlight") {
        /* small visor / cap, distinct from the yellow hard hat */
        var crown = dark ? "#245C46" : "#1F5A42";
        var brim = dark ? "#2F7A5C" : "#2A6B4F";
        var edge = dark ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.62)";
        var stitch = dark ? "#E8B923" : "#F0C429";
        ctx.fillStyle = crown;
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1.05;
        /* shallow crown */
        ctx.beginPath();
        ctx.moveTo(-5.0, 1.35);
        ctx.bezierCurveTo(-5.15, -4.3, 5.15, -4.3, 5.0, 1.35);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        /* visor brim, extending forward */
        ctx.fillStyle = brim;
        ctx.beginPath();
        ctx.ellipse(2.6, 1.7, 6.4, 1.45, -0.18, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        /* gold stitch on the crown */
        ctx.strokeStyle = stitch;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-3.4, 0.15);
        ctx.quadraticCurveTo(0, -0.55, 3.4, 0.15);
        ctx.stroke();
      } else if (kind === "meet") {
        ctx.fillStyle = "#3B82F6";
        ctx.strokeStyle = dark ? "rgba(255,255,255,0.75)" : "rgba(14,14,16,0.65)";
        ctx.lineWidth = 0.95;
        ctx.beginPath();
        ctx.ellipse(0, 0.45, 5.5, 2.5, 0, Math.PI, 0, true);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(2.5, 0.6, 5.7, 1.2, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
    }

    function isWorking(ag) {
      return (ag.role === "work" || ag.role === "meet") && ag.job && ag.job.kind;
    }

    function drawPointer(ag, vx, vy) {
      var a = ag.alpha * ag.vis;
      if (a < 0.01) return;
      var working = isWorking(ag);
      var kind = working && ag.job.kind;
      ctx.save();
      ctx.translate(vx, vy);
      ctx.globalAlpha = a;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (working) {
        /* Upright (no heading rotation), at most a ±10° lean; 1.5× an idle arrow. */
        var sc = ag.scale * (narrow() ? 1.15 : 1.5);
        var vx_ = ag.vx || 0;
        var lean = Math.max(-10, Math.min(10, vx_ * 0.4)) * Math.PI / 180;
        if (ag._sheetLean != null) lean = ag._sheetLean;
        var face = (vx_ < -1.2) ? -1 : 1;
        if (ag._sheetFace) face = ag._sheetFace;
        if (ag.job && isMarkKind(ag.job.kind) && (ag.job.phase === "draw" || ag.job.phase === "done" || ag.job.phase === "wrap")) {
          lean = 0;
          face = 1;
        }
        ctx.save();
        ctx.rotate(lean);
        ctx.scale(face * sc, sc);
        drawLegs(ag);
        drawArrowBody(ag);
        drawArms(ag);
        ctx.restore();
        /* Hat sits upright on the head — never leans, never follows heading. */
        ctx.save();
        ctx.scale(sc, sc);
        ctx.translate(face > 0 ? 4.2 : -4.2, -2.6);
        drawHat(kind);
        ctx.restore();
      } else {
        ctx.rotate(ag.angle);
        ctx.scale(ag.scale, ag.scale);
        drawArrowBody(ag);
      }
      ctx.restore();
    }

    function draw(sy) {
      if (sy == null) sy = getScroll();
      ctx.clearRect(0, 0, W, H);
      var i, ag, rp, tr, p, vx, vy, margin = 90;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (i = 0; i < agents.length; i++) {
        ag = agents[i];
        tr = ag.trail;
        if (tr.length < 6) continue;
        vy = (ag.role === "escort" ? ag.y : ag.docY - sy);
        if (vy < -margin || vy > H + margin) continue;
        ctx.strokeStyle = ag.color;
        ctx.lineWidth = 1;
        var segs = tr.length / 2 - 1;
        for (p = 0; p < segs; p++) {
          ctx.globalAlpha = (p / segs) * 0.13 * ag.vis;
          ctx.beginPath();
          ctx.moveTo(tr[p * 2], tr[p * 2 + 1] - sy);
          ctx.lineTo(tr[p * 2 + 2], tr[p * 2 + 3] - sy);
          ctx.stroke();
        }
      }
      for (i = 0; i < ripples.length; i++) {
        rp = ripples[i];
        if (rp.delay > 0) continue;
        vy = rp.y - sy;
        if (vy < -40 || vy > H + 40) continue;
        ctx.globalAlpha = Math.max(0, rp.life) * (rp.click ? 0.3 : 0.16);
        ctx.strokeStyle = rp.color;
        ctx.lineWidth = rp.click ? 1.1 : 0.9;
        ctx.beginPath();
        ctx.arc(rp.x, vy, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (i = 0; i < agents.length; i++) {
        ag = agents[i];
        if (ag.role === "escort") { vx = ag.x; vy = ag.y; }
        else { vx = ag.docX; vy = ag.docY - sy; }
        if (vy < -margin || vy > H + margin) continue;
        drawPointer(ag, vx, vy);
      }
    }

    function advance(dt) {
      if (floatState.sync) floatState.sync();
      var sy = getScroll();
      var dsy = sy - lastSy;
      lastSy = sy;
      var t = simT;
      if (performance.now() - boxesAt > (Math.abs(dsy) > 0.5 ? 50 : 180)) collectBoxes();
      if (t > nextRehome) { rehome(); nextRehome = t + 10 + Math.random() * 6; }
      /* page height may grow as images load */
      var prevH = docH;
      measureDoc();
      if (Math.abs(docH - prevH) > 80) syncCount();

      schedule(t, sy);
      simulate(dt, t, sy, dsy);

      var i, ag, target, viewY;
      for (i = 0; i < agents.length; i++) {
        ag = agents[i];
        viewY = ag.role === "escort" ? ag.y : ag.docY - sy;
        /* fade in as they enter the viewport from above or below */
        target = (viewY > -40 && viewY < H + 40) ? 1 : 0;
        if (ag.role !== "escort") {
          if (hit(media, ag.docX, viewY, 4)) target = Math.min(target, 0.86);
          if (hit(boxes, ag.docX, viewY, 0)) target = Math.min(target, ag.role === "work" || ag.role === "meet" ? 0.88 : 0.70);
        }
        ag.vis += (target - ag.vis) * (1 - Math.exp(-4 * dt));
        var spdNow = Math.hypot(ag.vx, ag.vy);
        ag.gait = (ag.gait || 0) + (spdNow > 5 ? 8 : 0) * dt;

        if (ag.role === "wander" && t > ag.rippleAt) {
          if (Math.random() < 0.18 && viewY > 0 && viewY < H) {
            ripples.push({ x: ag.docX, y: ag.docY, r: 2, life: 1, color: ag.color });
          }
          ag.rippleAt = t + 7 + Math.random() * 12;
        }
        if (!narrow()) {
          if (!ag.trailOn && ag.role === "wander" && Math.random() < dt * 0.025) {
            ag.trailOn = true; ag.trailUntil = t + 3 + Math.random() * 3;
          }
          var on = (ag.trailOn && t < ag.trailUntil) || (ag.role === "escort" && mouse.on) || (ag.role === "work");
          if (on && t - ag.trailAt > 0.045) {
            var tx = ag.role === "escort" ? ag.x : ag.docX;
            var ty = ag.role === "escort" ? ag.y + sy : ag.docY;
            ag.trail.push(tx, ty);
            if (ag.trail.length > 36) ag.trail.splice(0, 2);
            ag.trailAt = t;
          } else if (!on) {
            ag.trailOn = false;
            if (ag.trail.length && t - ag.trailAt > 0.045) { ag.trail.splice(0, 2); ag.trailAt = t; }
          }
        }
      }
    }

    function tick(now) {
      if (!running) return;
      if (!last) last = now;
      var dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      simT += dt;
      advance(dt);
      draw(lastSy);
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (running) return;
      running = true; last = 0;
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    lastSy = getScroll();
    resize(); /* measures W/H first, then places on a uniform full-width grid */

    window.addEventListener("resize", function () {
      resize();
    }, { passive: true });

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      var nx = e.clientX, ny = e.clientY;
      var dx = nx - mouse.x, dy = ny - mouse.y, d = Math.hypot(dx, dy);
      if (mouse.on && d > 1.5) {
        mouse.dirX = mouse.dirX * 0.82 + (dx / d) * 0.18;
        mouse.dirY = mouse.dirY * 0.82 + (dy / d) * 0.18;
        var m = Math.hypot(mouse.dirX, mouse.dirY) || 1;
        mouse.dirX /= m; mouse.dirY /= m;
      }
      mouse.x = nx; mouse.y = ny;
      if (d > 1.5 || !mouse.on) mouse.movedAt = simT;
      if (!mouse.on) { mouse.on = true; assignEscort(); }
    }, { passive: true });
    document.addEventListener("mouseleave", function () { mouse.on = false; assignEscort(); });
    window.addEventListener("blur", function () { mouse.on = false; assignEscort(); });
    if (mqFine.addEventListener) mqFine.addEventListener("change", assignEscort);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
    document.addEventListener("themechange", recolor);

    /* redraw on every Lenis frame so cursors stay glued to the content */
    if (lenis && lenis.on) {
      lenis.on("scroll", function () {
        if (!running) return;
        var sy = getScroll();
        var dsy = sy - lastSy;
        /* escorts are dragged along during the scroll itself */
        if (dsy) {
          agents.forEach(function (ag) { if (ag.role === "escort") ag.y += dsy; });
        }
        lastSy = sy;
        draw(sy);
      });
    }

    if (!document.hidden) start();

    if (/\barcap=1\b/.test(location.search)) {
      window.__arcap = {
        stop: stop,
        start: start,
        running: function () { return running; },
        count: function () { return agents.length; },
        snapshot: function () {
          var sy = getScroll();
          return {
            W: W, H: H, scroll: sy, docH: docH,
            agents: agents.map(function (a) {
              var escort = a.role === "escort";
              return {
                x: escort ? a.x : a.docX,
                y: escort ? a.y : a.docY - sy,
                docX: escort ? a.x : a.docX,
                docY: escort ? a.y + sy : a.docY,
                hx: a.hx, hy: a.hy, homeR: a.homeR,
                role: a.role,
                vis: a.vis,
                job: a.job && a.job.kind
              };
            })
          };
        },
        midShare: function () {
          var sy = getScroll();
          var lo = W * 0.25, hi = W * 0.75;
          function share(list) {
            if (!list.length) return { n: 0, mid: 0, share: null };
            var mid = 0;
            list.forEach(function (a) { if (a.docX >= lo && a.docX <= hi) mid++; });
            return { n: list.length, mid: mid, share: mid / list.length };
          }
          var all = [], vis = [], kinds = {};
          agents.forEach(function (a) {
            if (a.role === "escort") return;
            all.push(a);
            var y = a.docY - sy;
            if (y > -80 && y < H + 80) {
              vis.push(a);
              if (a.job && a.job.kind) kinds[a.job.kind] = (kinds[a.job.kind] || 0) + 1;
            }
          });
          return {
            W: W, H: H, scroll: sy, docH: docH,
            all: share(all), vis: share(vis),
            jobs: visibleJobCount(sy), kinds: kinds
          };
        },
        scrollTo: function (y) {
          if (lenis && typeof lenis.scrollTo === "function") lenis.scrollTo(y, { immediate: true });
          else window.scrollTo(0, y);
          lastSy = getScroll();
          draw(lastSy);
          return lastSy;
        },
        paintFigure: function (target, spec) {
          var prev = ctx, prevDark = dark;
          ctx = target;
          dark = !!spec.dark;
          var ag = {
            color: spec.color || "#22D3EE",
            scale: 1,
            alpha: 1, vis: 1,
            role: "work",
            job: { kind: spec.kind, phase: "do", started: simT, _sheetStill: true },
            vx: 0, vy: 0, angle: 0, gait: 2,
            _sheetFrame: spec.frame != null ? spec.frame : 2,
            _sheetLean: 0,
            _sheetFace: spec.face || 1
          };
          drawPointer(ag, spec.x, spec.y);
          dark = prevDark;
          ctx = prev;
        },
        renderSheet: function () {
          /* 1500×520, 5 roles × 2 themes, 3× zoom, 2× internal resolution */
          var W = 1500, H = 520, dprS = 2;
          var c = document.createElement("canvas");
          c.width = W * dprS; c.height = H * dprS;
          var g = c.getContext("2d");
          g.scale(dprS, dprS);
          var roles = [
            { kind: "click",     label: "Worker",      color: "#FB923C", frame: 2 },
            { kind: "mark",      label: "Scholar",     color: "#FF3347", frame: 1 },
            { kind: "highlight", label: "Highlighter", color: "#E8B923", frame: 2 },
            { kind: "type",      label: "Typist",      color: "#60A5FA", frame: 0 },
            { kind: "select",    label: "Inspector",   color: "#22D3EE", frame: 1 }
          ];
          var colW = W / 5, rowH = H / 2;
          var rows = [
            { dark: true,  bg: "#0A0A0B", ink: "#F5F5F5", muted: "#A3A3A3", accent: "#FF3347" },
            { dark: false, bg: "#F6F5F2", ink: "#0E0E10", muted: "#4A4A50", accent: "#D7193A" }
          ];
          var prev = ctx, prevDark = dark;
          var r, k, row, role, cx, cy;
          for (r = 0; r < 2; r++) {
            row = rows[r];
            g.fillStyle = row.bg;
            g.fillRect(0, r * rowH, W, rowH);
            g.fillStyle = row.muted;
            g.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
            g.fillText(row.dark ? "DARK" : "LIGHT", 18, r * rowH + 22);
            for (k = 0; k < roles.length; k++) {
              role = roles[k];
              cx = colW * k + colW / 2;
              cy = r * rowH + rowH * 0.385;
              g.save();
              g.beginPath();
              g.rect(colW * k, r * rowH + 8, colW, rowH - 16);
              g.clip();
              /* scholar: a short underline the pencil tip sits on */
              if (role.kind === "mark") {
                g.save();
                g.strokeStyle = row.accent;
                g.lineWidth = 2.6;
                g.lineCap = "round";
                g.beginPath();
                /* tip is at local (13.5, 2.2) × 1.5 × 3 zoom */
                var ux = cx + 13.5 * 1.5 * 3 - 56, uy = cy + 2.2 * 1.5 * 3;
                g.moveTo(ux, uy);
                g.bezierCurveTo(ux + 24, uy + 2, ux + 56, uy - 1.6, ux + 92, uy + 0.4);
                g.stroke();
                g.restore();
              }
              /* highlighter: a translucent gold band the marker tip sits on */
              if (role.kind === "highlight") {
                g.save();
                var mx = cx + 14.2 * 1.5 * 3;
                var my = cy + 3.4 * 1.5 * 3;
                g.strokeStyle = "#E8C12A";
                g.globalAlpha = 0.38;
                g.lineWidth = 18;
                g.lineCap = "butt";
                g.lineJoin = "round";
                g.beginPath();
                g.moveTo(mx - 52, my);
                g.quadraticCurveTo(mx - 10, my - 3.5, mx + 28, my + 1.6);
                g.quadraticCurveTo(mx + 64, my + 3.2, mx + 108, my - 1.2);
                g.stroke();
                g.globalAlpha = 0.42;
                g.strokeStyle = "#C49212";
                g.lineWidth = 3.0;
                g.lineCap = "round";
                g.beginPath();
                g.moveTo(mx - 52, my + 7);
                g.quadraticCurveTo(mx - 10, my + 3.5, mx + 28, my + 8.6);
                g.quadraticCurveTo(mx + 64, my + 10.2, mx + 108, my + 5.8);
                g.stroke();
                g.globalAlpha = 1;
                g.restore();
              }
              ctx = g; dark = row.dark;
              g.save();
              g.translate(cx, cy);
              g.scale(3, 3);
              var ag = {
                color: role.color, scale: 1, alpha: 1, vis: 1,
                role: "work",
                job: { kind: role.kind, phase: "do", started: simT, _sheetStill: true },
                vx: 0, vy: 0, angle: 0, gait: 2,
                _sheetFrame: role.frame, _sheetLean: 0, _sheetFace: 1
              };
              drawPointer(ag, 0, 0);
              g.restore();
              g.fillStyle = row.ink;
              g.font = '650 15px "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
              g.textAlign = "center";
              g.fillText(role.label, cx, r * rowH + rowH - 14);
              g.restore();
            }
          }
          /* divider */
          g.strokeStyle = "rgba(128,128,128,0.25)";
          g.lineWidth = 1;
          g.beginPath(); g.moveTo(0, rowH); g.lineTo(W, rowH); g.stroke();
          for (k = 1; k < roles.length; k++) {
            g.beginPath(); g.moveTo(colW * k, 16); g.lineTo(colW * k, H - 16); g.stroke();
          }
          ctx = prev; dark = prevDark;
          return c.toDataURL("image/png");
        },
        advanceSeconds: function (sec, physicsOnly) {
          var was = running;
          stop();
          var step = 1 / 60, steps = Math.max(1, Math.round(sec / step)), i;
          for (i = 0; i < steps; i++) {
            if (physicsOnly) {
              simT += step;
              simulate(step, simT, getScroll(), 0);
            } else {
              simT += step;
              advance(step);
            }
          }
          lastSy = getScroll();
          draw(lastSy);
          if (was) start();
        }
      };
    }
  }

  /* ---------- key-phrase marks (underlines / highlights) ---------- */
  function textRects(el) {
    var rects = [], range = document.createRange();
    function walk(node) {
      if (node.nodeType === 3) {
        if (!node.textContent || !node.textContent.replace(/\s/g, "").length) return;
        range.selectNodeContents(node);
        Array.prototype.push.apply(rects, range.getClientRects());
      } else if (node.nodeType === 1) {
        if (node.classList && node.classList.contains("key-ink")) return;
        if (node.tagName === "BR") return;
        var i, kids = node.childNodes;
        for (i = 0; i < kids.length; i++) walk(kids[i]);
      }
    }
    walk(el);
    return Array.prototype.slice.call(rects).filter(function (r) { return r.width > 2 && r.height > 2; });
  }

  function wavy(x1, y, x2, seed, amp) {
    var w = x2 - x1;
    amp = amp == null ? 1.2 : amp;
    if (w < 4) return "M " + x1.toFixed(1) + " " + y.toFixed(1) + " L " + x2.toFixed(1) + " " + y.toFixed(1);
    var n = Math.max(3, Math.round(w / 36));
    var d = "M " + x1.toFixed(1) + " " + (y + Math.sin(seed) * amp * 0.35).toFixed(1);
    var i, t, px, py, cpx, cpy;
    for (i = 1; i <= n; i++) {
      t = i / n;
      px = x1 + w * t;
      py = y + Math.sin(seed + i * 1.71) * amp + Math.cos(seed * 1.3 + i * 0.9) * amp * 0.45;
      cpx = x1 + w * (t - 0.5 / n);
      cpy = y + Math.sin(seed + (i - 0.5) * 1.71) * amp * 1.15;
      d += " Q " + cpx.toFixed(1) + " " + cpy.toFixed(1) + " " + px.toFixed(1) + " " + py.toFixed(1);
    }
    return d;
  }

  function ensureMarkSvg(el) {
    var svg = el.querySelector(":scope > .key-ink");
    var parent = el.getBoundingClientRect();
    if (parent.width < 2 || parent.height < 2) return null;
    var rects = textRects(el);
    if (!rects.length) return null;
    var kind = el.getAttribute("data-mark") === "highlight" ? "hl" : "ul";
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "key-ink");
      svg.setAttribute("aria-hidden", "true");
      el.appendChild(svg);
    }
    /* pad so a wavy stroke is not clipped.
       For a wrapping inline span, absolute children are origin'd at the
       FIRST line box, not the union — shift so our union-space paths land
       on every line. */
    var pad = kind === "hl" ? 16 : 6;
    var first = (el.getClientRects()[0]) || parent;
    var left = parent.left - first.left - pad;
    var top = parent.top - first.top - pad;
    var w = parent.width + pad * 2, h = parent.height + pad * 2;
    svg.style.left = left + "px";
    svg.style.top = top + "px";
    svg.style.width = w + "px";
    svg.style.height = h + "px";
    svg.setAttribute("width", String(Math.ceil(w)));
    svg.setAttribute("height", String(Math.ceil(h)));
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    /* rebuild per-line paths so progress can fill one line at a time */
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var seed0 = (el.getAttribute("data-key") || "").length * 0.7;
    rects.forEach(function (r, i) {
      var x1 = r.left - parent.left + pad;
      var x2 = r.right - parent.left + pad;
      var y = (kind === "hl" ? (r.top + r.height * 0.58) : (r.bottom - 2)) - parent.top + pad;
      var seed = seed0 + i * 1.4;
      function addPath(cls, d) {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", cls);
        path.setAttribute("data-line", String(i));
        path.setAttribute("d", d);
        /* must be in the live SVG before getTotalLength will measure */
        svg.appendChild(path);
        try {
          var len = path.getTotalLength();
          path.setAttribute("data-len", String(len));
          path.style.strokeDasharray = String(len);
          path.style.strokeDashoffset = String(len);
        } catch (err) {
          path.setAttribute("data-len", "0");
          path.style.visibility = "hidden";
        }
      }
      if (kind === "hl") {
        addPath("key-hl", wavy(x1, y, x2, seed, 2.35));
        addPath("key-hl-edge", wavy(x1, y + 0.9, x2, seed + 2.1, 2.8));
      } else {
        addPath("key-ul", wavy(x1, y, x2, seed, 1.2));
      }
    });
    return svg;
  }

  function applyPathProgress(path, p) {
    var len = parseFloat(path.getAttribute("data-len") || "0");
    if (!len) {
      try { len = path.getTotalLength(); } catch (e) { len = 0; }
    }
    if (!len) {
      path.style.visibility = p >= 0.999 ? "visible" : "hidden";
      path.style.strokeDasharray = "none";
      path.style.strokeDashoffset = "0";
      return;
    }
    path.style.visibility = "visible";
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len * (1 - Math.max(0, Math.min(1, p))));
  }
  function setMarkLineProgress(el, doneLines, frac) {
    if (!el) return;
    var paths = el.querySelectorAll(".key-ink path");
    if (!paths.length) return;
    var i, line, pr;
    for (i = 0; i < paths.length; i++) {
      line = parseInt(paths[i].getAttribute("data-line") || "0", 10);
      pr = line < doneLines ? 1 : (line === doneLines ? frac : 0);
      applyPathProgress(paths[i], pr);
    }
  }
  function setMarkProgress(el, p) {
    if (!el) return;
    var paths = el.querySelectorAll(".key-ink path");
    if (!paths.length) return;
    /* overall 0–1 across unique lines (main paths only, skip edge twins) */
    var mains = [], i, cls;
    for (i = 0; i < paths.length; i++) {
      cls = paths[i].getAttribute("class") || "";
      if (cls.indexOf("key-hl-edge") !== -1) continue;
      mains.push(paths[i]);
    }
    if (!mains.length) mains = Array.prototype.slice.call(paths);
    var total = 0, lens = [];
    for (i = 0; i < mains.length; i++) {
      lens[i] = parseFloat(mains[i].getAttribute("data-len") || "0") || 1;
      total += lens[i];
    }
    var remain = Math.max(0, Math.min(1, p)) * total;
    var lineP = [];
    for (i = 0; i < mains.length; i++) {
      if (remain >= lens[i]) { lineP[i] = 1; remain -= lens[i]; }
      else if (remain > 0) { lineP[i] = remain / lens[i]; remain = 0; }
      else lineP[i] = 0;
    }
    for (i = 0; i < paths.length; i++) {
      var line = parseInt(paths[i].getAttribute("data-line") || String(i), 10);
      applyPathProgress(paths[i], lineP[line] != null ? lineP[line] : (p >= 1 ? 1 : 0));
    }
  }

  function paintMark(el, p) {
    if (!el) return;
    ensureMarkSvg(el);
    setMarkProgress(el, p);
    if (p >= 1) {
      el.classList.remove("is-drawing");
      el.classList.add("is-set");
    }
  }

  function markSegments(el, sy) {
    var rects = textRects(el), segs = [], i, r, y;
    var kind = el.getAttribute("data-mark") === "highlight" ? "hl" : "ul";
    for (i = 0; i < rects.length; i++) {
      r = rects[i];
      y = (kind === "hl" ? r.top + r.height * 0.58 : r.bottom - 2) + sy;
      var len = Math.hypot(r.right - r.left, 0);
      segs.push({ x1: r.left, y1: y, x2: r.right, y2: y, len: Math.max(1, len) });
    }
    return segs;
  }

  function initMarks() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-key]"));
    if (!els.length) return;
    if (reduce) {
      els.forEach(function (el) { paintMark(el, 1); });
      var rt;
      window.addEventListener("resize", function () {
        clearTimeout(rt);
        rt = setTimeout(function () { els.forEach(function (el) { paintMark(el, 1); }); }, 120);
      });
      return;
    }
    /* queue a mark when its phrase enters the viewport, one at a time */
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { markQueue.push(el); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        if (el.classList.contains("is-set") || el.classList.contains("is-drawing")) { io.unobserve(el); return; }
        if (markQueue.indexOf(el) === -1 && !el.classList.contains("is-drawing")) markQueue.push(el);
        sortMarkQueue();
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        document.querySelectorAll("[data-key].is-set, [data-key].is-drawing").forEach(function (el) {
          var p = el.classList.contains("is-set") ? 1 : 0;
          if (p < 1) {
            var paths = el.querySelectorAll(".key-ink path");
            var drawn = 0, tot = 0, i, len, off;
            for (i = 0; i < paths.length; i++) {
              if ((paths[i].getAttribute("class") || "").indexOf("key-hl-edge") !== -1) continue;
              len = parseFloat(paths[i].getAttribute("data-len") || "0");
              off = parseFloat(paths[i].style.strokeDashoffset || "0");
              tot += len;
              drawn += len ? (len - off) : 0;
            }
            if (tot) p = drawn / tot;
          }
          ensureMarkSvg(el);
          setMarkProgress(el, p);
        });
      }, 120);
    });

    if (/\barcap=1\b/.test(location.search)) {
      window.__armarks = {
        keys: function () { return els.map(function (e) { return e.getAttribute("data-key"); }); },
        queued: function () { return markQueue.length; },
        painted: function () {
          return els.filter(function (e) { return e.classList.contains("is-set") || e.classList.contains("is-drawing"); }).length;
        },
        alignment: function () {
          return els.filter(function (e) { return e.classList.contains("is-set"); }).map(function (e) {
            var r = e.getBoundingClientRect();
            var svg = e.querySelector(".key-ink");
            var sr = svg ? svg.getBoundingClientRect() : null;
            return { key: e.getAttribute("data-key"), text: r, svg: sr };
          });
        },
        paintAll: function () { els.forEach(function (e) { paintMark(e, 1); }); }
      };
    }
  }


  /* ---------- staggered reveals ---------- */
  function initReveals() {
    var els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;
    if (reduce) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("in");
          io.unobserve(en.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    els.forEach(function (el) { io.observe(el); });
  }
  initReveals();

  /* ---------- first-visit loader, already capped in CSS at ~1.1s ---------- */
  (function () {
    var html = document.documentElement;
    if (!html.classList.contains("show-loader")) return;
    window.setTimeout(function () {
      html.classList.remove("show-loader");
      var l = document.querySelector(".loader");
      if (l) l.style.display = "none";
    }, 1150);
  })();

  /* ---------- slow parallax (display word, portrait) ---------- */
  function initParallax() {
    var els = document.querySelectorAll("[data-parallax]");
    if (!els.length || reduce) return;
    var ticking = false;
    function apply() {
      ticking = false;
      var mid = window.innerHeight * 0.45;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.08;
        var y = (r.top - mid) * speed;
        el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
      });
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }
  initParallax();


  /* ---------- draggable hero info cards ---------- */
  function initDragCards() {
    var root = document.querySelector(".hero-visual");
    if (!root) return;
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-drag-card]"));
    if (!cards.length) return;
    var KEY = "ar-float-cards";
    var resetBtn = root.querySelector("[data-float-reset]");
    var nav = document.querySelector(".nav");
    var defaults = {};
    var busy = {}; /* card id → animation frame or 'drag' */

    function idOf(card) { return card.getAttribute("data-drag-card"); }

    function load() {
      try {
        var s = sessionStorage.getItem(KEY);
        return s ? JSON.parse(s) : {};
      } catch (e) { return {}; }
    }
    function saveAll() {
      var data = {};
      var cw = Math.max(1, root.clientWidth), ch = Math.max(1, root.clientHeight);
      cards.forEach(function (c) {
        if (!c.dataset.moved) return;
        data[idOf(c)] = { lx: c.offsetLeft / cw, ty: c.offsetTop / ch };
      });
      try {
        if (Object.keys(data).length) sessionStorage.setItem(KEY, JSON.stringify(data));
        else sessionStorage.removeItem(KEY);
      } catch (e) {}
      root.classList.toggle("is-arranged", Object.keys(data).length > 0);
    }

    function pinToPixels(card) {
      var l = card.offsetLeft, t = card.offsetTop;
      card.style.left = l + "px";
      card.style.top = t + "px";
      card.style.right = "auto";
      card.style.bottom = "auto";
      return { left: l, top: t };
    }

    function captureDefaults() {
      cards.forEach(function (c) {
        /* layout position, ignoring a reveal transform */
        defaults[idOf(c)] = { left: c.offsetLeft, top: c.offsetTop, cw: root.clientWidth, ch: root.clientHeight };
      });
    }

    function clampTo(card, left, top) {
      card.style.left = left + "px";
      card.style.top = top + "px";
      card.style.right = "auto";
      card.style.bottom = "auto";
      var r = card.getBoundingClientRect();
      var m = 8;
      var topMin = 8;
      if (nav) {
        var nb = nav.getBoundingClientRect().bottom;
        if (nb > 0) topMin = Math.max(topMin, nb + 4);
      }
      var dx = 0, dy = 0;
      if (r.left < m) dx = m - r.left;
      if (r.right > window.innerWidth - m) dx = (window.innerWidth - m) - r.right;
      if (r.top < topMin) dy = topMin - r.top;
      if (r.bottom > window.innerHeight - m) dy = (window.innerHeight - m) - r.bottom;
      var hero = root.closest(".hero") || root;
      var hr = hero.getBoundingClientRect();
      /* stay in the hero, with a little slack so the designed hang-off is still legal */
      var slack = 48;
      if (r.left + dx < hr.left - slack) dx = (hr.left - slack) - r.left;
      if (r.right + dx > hr.right + slack) dx = (hr.right + slack) - r.right;
      if (r.top + dy < hr.top - 8) dy = (hr.top - 8) - r.top;
      if (r.bottom + dy > hr.bottom + 8) dy = (hr.bottom + 8) - r.bottom;
      if (dx || dy) {
        left += dx;
        top += dy;
        card.style.left = left + "px";
        card.style.top = top + "px";
      }
      return { left: left, top: top };
    }

    function stopAnim(card) {
      if (busy[idOf(card)] && busy[idOf(card)] !== "drag") {
        cancelAnimationFrame(busy[idOf(card)]);
      }
      busy[idOf(card)] = null;
    }

    function springTo(card, fromL, fromT, toL, toT, vL, vT, lift, onDone) {
      stopAnim(card);
      var clamped = clampTo(card, toL, toT);
      toL = clamped.left; toT = clamped.top;
      if (reduce) {
        clampTo(card, toL, toT);
        card.style.transform = "";
        card.classList.remove("is-dragging");
        if (onDone) onDone();
        return;
      }
      /* put the card back at the start so the spring is visible */
      card.style.left = fromL + "px";
      card.style.top = fromT + "px";
      var l = fromL, t = fromT, vl = vL || 0, vt = vT || 0;
      var liftNow = lift || 0;
      var k = 210, damp = 22;
      var last = performance.now();
      function frame(now) {
        var dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        var ax = -k * (l - toL) - damp * vl;
        var ay = -k * (t - toT) - damp * vt;
        vl += ax * dt;
        vt += ay * dt;
        l += vl * dt;
        t += vt * dt;
        liftNow += (0 - liftNow) * Math.min(1, 10 * dt);
        clampTo(card, l, t);
        if (liftNow > 0.04) {
          card.style.transform = "translateY(" + (-6 * liftNow).toFixed(2) + "px) scale(" + (1 + 0.03 * liftNow).toFixed(3) + ")";
        } else {
          card.style.transform = "";
        }
        var settled = Math.hypot(l - toL, t - toT) < 0.5 && Math.hypot(vl, vt) < 10 && liftNow < 0.05;
        if (settled) {
          clampTo(card, toL, toT);
          card.style.transform = "";
          card.classList.remove("is-dragging");
          busy[idOf(card)] = null;
          if (onDone) onDone();
          return;
        }
        busy[idOf(card)] = requestAnimationFrame(frame);
      }
      busy[idOf(card)] = requestAnimationFrame(frame);
    }

    function applySaved() {
      var data = load();
      var cw = Math.max(1, root.clientWidth), ch = Math.max(1, root.clientHeight);
      var any = false;
      cards.forEach(function (c) {
        var d = data[idOf(c)];
        pinToPixels(c);
        if (d && typeof d.lx === "number" && typeof d.ty === "number") {
          clampTo(c, d.lx * cw, d.ty * ch);
          c.dataset.moved = "1";
          any = true;
        }
      });
      root.classList.toggle("is-arranged", any);
    }

    function reset() {
      cards.forEach(function (c) {
        stopAnim(c);
        c.classList.remove("is-dragging");
        c.dataset.moved = "";
        var def = defaults[idOf(c)];
        var from = { left: c.offsetLeft, top: c.offsetTop };
        /* clear inline so we can re-pin from CSS if needed; then spring to default */
        var scaleX = root.clientWidth / Math.max(1, def.cw);
        var scaleY = root.clientHeight / Math.max(1, def.ch);
        var toL = def.left * scaleX, toT = def.top * scaleY;
        springTo(c, from.left, from.top, toL, toT, 0, 0, 0, function () {
          /* after reset, drop inline and let the stylesheet take over */
          c.style.left = "";
          c.style.top = "";
          c.style.right = "";
          c.style.bottom = "";
          c.style.transform = "";
        });
      });
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      root.classList.remove("is-arranged");
      publish();
    }

    function publish() {
      floatState.rects = cards.map(function (c) {
        var r = c.getBoundingClientRect();
        return {
          l: r.left, t: r.top, r: r.right, b: r.bottom,
          w: r.width, h: r.height,
          dragging: c.classList.contains("is-dragging"),
          el: c
        };
      });
      floatState.dragging = floatState.rects.some(function (r) { return r.dragging; });
    }
    floatState.sync = publish;

    floatState.nudge = function (el) {
      if (!el || reduce || floatState.dragging) return;
      if (busy[idOf(el)]) return;
      if (el.classList.contains("is-dragging")) return;
      var ang = Math.random() * Math.PI * 2;
      var dist = 3.5 + Math.random() * 3.5;
      var nx = Math.cos(ang) * dist, ny = Math.sin(ang) * dist;
      var t0 = performance.now(), dur = 420;
      function frame(now) {
        var u = Math.min(1, (now - t0) / dur);
        /* out and back, ease */
        var wave = Math.sin(u * Math.PI);
        el.style.transform = "translate(" + (nx * wave).toFixed(2) + "px," + (ny * wave).toFixed(2) + "px)";
        if (u < 1) {
          busy[idOf(el)] = requestAnimationFrame(frame);
        } else {
          el.style.transform = "";
          busy[idOf(el)] = null;
        }
      }
      busy[idOf(el)] = requestAnimationFrame(frame);
    };

    function label(card) {
      var title = (card.querySelector("strong") && card.querySelector("strong").textContent) || "Card";
      card.setAttribute("aria-label", title.trim() + ". Drag, or use the arrow keys to move. Shift moves further.");
    }

    cards.forEach(function (card) {
      label(card);
      card.setAttribute("aria-grabbed", "false");
      card.setAttribute("draggable", "false");

      var ptr = null;

      card.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        if (ptr) return;
        /* let a plain click on a link go through — only drag after a short move */
        stopAnim(card);
        var startCX = e.clientX, startCY = e.clientY;
        var origin = pinToPixels(card);
        var lastX = e.clientX, lastY = e.clientY, lastT = performance.now();
        var velX = 0, velY = 0;
        var dragged = false;
        ptr = {
          id: e.pointerId,
          startCX: startCX, startCY: startCY,
          origin: origin
        };

        function onMove(ev) {
          if (ev.pointerId !== ptr.id) return;
          var dx = ev.clientX - startCX, dy = ev.clientY - startCY;
          if (!dragged && Math.hypot(dx, dy) < 6) return;
          if (!dragged) {
            dragged = true;
            card._didDrag = true;
            card.classList.add("is-dragging");
            card.setAttribute("aria-grabbed", "true");
            try { card.setPointerCapture(ev.pointerId); } catch (err) {}
            if (!reduce) {
              card.style.transform = "translateY(-6px) scale(1.03)";
            }
            busy[idOf(card)] = "drag";
          }
          ev.preventDefault();
          var now = performance.now();
          var dt = Math.max(1, now - lastT);
          var instVx = (ev.clientX - lastX) / dt * 1000;
          var instVy = (ev.clientY - lastY) / dt * 1000;
          velX = velX * 0.6 + instVx * 0.4;
          velY = velY * 0.6 + instVy * 0.4;
          lastX = ev.clientX; lastY = ev.clientY; lastT = now;
          clampTo(card, origin.left + dx, origin.top + dy);
          publish();
        }

        function onUp(ev) {
          if (ptr && ev.pointerId !== ptr.id) return;
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
          var was = ptr;
          ptr = null;
          if (!dragged) {
            busy[idOf(card)] = null;
            return;
          }
          try { card.releasePointerCapture(ev.pointerId); } catch (err) {}
          card.setAttribute("aria-grabbed", "false");
          var curL = card.offsetLeft, curT = card.offsetTop;
          var cap = 1400;
          var vL = Math.max(-cap, Math.min(cap, velX));
          var vT = Math.max(-cap, Math.min(cap, velY));
          var coast = reduce ? 0 : 0.12;
          var destL = curL + vL * coast;
          var destT = curT + vT * coast;
          var dest = clampTo(card, destL, destT);
          card.dataset.moved = "1";
          springTo(card, curL, curT, dest.left, dest.top, vL, vT, reduce ? 0 : 1, function () {
            saveAll();
            publish();
          });
          publish();
        }

        window.addEventListener("pointermove", onMove, { passive: false });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      });

      card.addEventListener("click", function (e) {
        if (!card._didDrag) return;
        e.preventDefault();
        e.stopPropagation();
        card._didDrag = false;
      }, true);

      card.addEventListener("keydown", function (e) {
        var step = e.shiftKey ? 24 : 8;
        var dx = 0, dy = 0;
        if (e.key === "ArrowLeft") dx = -step;
        else if (e.key === "ArrowRight") dx = step;
        else if (e.key === "ArrowUp") dy = -step;
        else if (e.key === "ArrowDown") dy = step;
        else if (e.key === "Escape") { card.blur(); return; }
        else return;
        e.preventDefault();
        var from = pinToPixels(card);
        if (!card._keyTarget) card._keyTarget = { left: from.left, top: from.top };
        card._keyTarget.left += dx;
        card._keyTarget.top += dy;
        card.dataset.moved = "1";
        springTo(card, from.left, from.top, card._keyTarget.left, card._keyTarget.top, 0, 0, 0, function () {
          card._keyTarget = null;
          saveAll();
          publish();
        });
      });
    });

    if (resetBtn) {
      resetBtn.setAttribute("aria-label", "Reset the information cards to their original places.");
      resetBtn.addEventListener("click", function () { reset(); });
    }

    captureDefaults();
    applySaved();
    publish();

    var resizeT;
    window.addEventListener("resize", function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        var data = load();
        cards.forEach(function (c) {
          stopAnim(c);
          if (data[idOf(c)]) return;
          /* unmoved: drop inline so breakpoint CSS can reflow, then re-pin */
          c.style.left = "";
          c.style.top = "";
          c.style.right = "";
          c.style.bottom = "";
        });
        cards.forEach(function (c) {
          if (!data[idOf(c)]) {
            defaults[idOf(c)] = { left: c.offsetLeft, top: c.offsetTop, cw: root.clientWidth, ch: root.clientHeight };
          }
        });
        applySaved();
        publish();
      }, 80);
    });

    /* optional capture hook, used by the preview tests */
    if (/\barcap=1\b/.test(location.search)) {
      window.__ardrag = {
        reset: reset,
        positions: function () {
          var o = {};
          cards.forEach(function (c) { o[idOf(c)] = { left: c.offsetLeft, top: c.offsetTop, moved: !!c.dataset.moved }; });
          return o;
        }
      };
    }
  }
  initDragCards();

  initMarks();
  initAgents();

})();
