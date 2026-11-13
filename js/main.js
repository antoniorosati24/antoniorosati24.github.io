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


  /* ---------- wandering agent cursors ----------
     A field of small pointers that lives in a fixed, full-viewport canvas,
     so it is always there at any scroll depth. It sits above the paper and
     below the navigation; pointers steer around type, and fade right down
     whenever they pass over an image, a video or a project window, so the
     work stays readable. One rAF loop; it stops while the tab is hidden.
       · scroll leaves a light wake (pointers drift by depth, then wrap)
       · now and then one goes to "work" on a heading or an image: it glides
         there, pauses, clicks (a tiny ripple) and moves on
       · the visitor's own mouse is given room; on a fine pointer, three
         pointers trail it as a loose escort, and drift when it rests
       · occasional faint trails
     Reduced motion removes the canvas entirely. */
  function initAgents() {
    var canvas = document.querySelector("[data-agents]");
    if (!canvas || reduce) {
      if (canvas) canvas.remove();
      return;
    }
    var ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    var dpr = 1, W = 0, H = 0;
    var agents = [], ripples = [];
    var running = false, last = 0, raf = 0, t0 = 0, simT = 0;
    var boxes = [], media = [], targets = [], boxesAt = 0;
    var mqNarrow = window.matchMedia("(max-width: 700px)");
    var mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
    var dark = isDark();

    /* visitor pointer */
    var mouse = { x: 0, y: 0, vx: 0, vy: 0, on: false, movedAt: 0, dirX: 0, dirY: 1 };
    /* scroll wake */
    var lastScrollY = window.scrollY || 0, scrollV = 0, scrollAcc = 0;

    function palette() {
      /* neon hues that hold on both a near-black and an off-white ground */
      return dark
        ? ["#22D3EE", "#F472B6", "#FACC15", "#4ADE80", "#60A5FA", "#FF3347", "#A78BFA", "#FB923C"]
        : ["#0891B2", "#DB2777", "#CA8A04", "#16A34A", "#2563EB", "#D7193A", "#7C3AED", "#EA580C"];
    }
    function narrow() { return mqNarrow.matches; }
    function escortOn() { return mqFine.matches && !narrow(); }

    function desiredCount() {
      var n = Math.round((W * H) / 68000);
      if (narrow()) return Math.max(7, Math.min(9, n));
      return Math.max(15, Math.min(21, n));
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      syncCount();
      assignEscort();
      collectBoxes();
    }

    var TEXT_SEL = "h1, h2, h3, p, li, figcaption, .lede, .work-note, .nav, .ov, .eyebrow, .meta, .tour-step-btn, .lv-tab, .lv-toggle, .footer-links a, .btn, .email, .pill, .metric, .sec-lede, .levels-intro";
    var MEDIA_SEL = "img, video, .mac, .lv-screen, .phone, .portrait-card, .shot";
    var TARGET_SEL = "h1, h2, .card, .mac, .lv-screen, .phone img, .avc-hero, .portrait-card, .cta, .shot, .float-card";

    function rectsOf(sel, pad, minW) {
      var list = [];
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.closest && el.closest("[hidden], template")) return;
        var r = el.getBoundingClientRect();
        if (r.width < (minW || 8) || r.height < 6) return;
        if (r.bottom < -40 || r.top > H + 40 || r.right < 0 || r.left > W) return;
        list.push({ l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad, w: r.width, h: r.height, el: el });
      });
      return list;
    }
    function collectBoxes() {
      /* text: skip paragraphs that sit inside media (captions handled) */
      boxes = rectsOf(TEXT_SEL, 10, 8).filter(function (b) { return b.w < W * 0.98 || b.h < 220; });
      media = rectsOf(MEDIA_SEL, 2, 40);
      targets = rectsOf(TARGET_SEL, 0, 60);
      boxesAt = performance.now();
    }
    function hit(list, x, y, pad) {
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        if (x > b.l - pad && x < b.r + pad && y > b.t - pad && y < b.b + pad) return b;
      }
      return null;
    }

    function jittered(n) {
      var cols = Math.max(1, Math.ceil(Math.sqrt(n * W / Math.max(H, 1))));
      var rows = Math.max(1, Math.ceil(n / cols));
      var spots = [], k = 0, mx = 36, my = 40;
      for (var row = 0; row < rows && k < n; row++) {
        /* deal the remainder evenly, so the bottom row is never left bare */
        var inRow = Math.round((n - k) / (rows - row));
        for (var col = 0; col < inRow && k < n; col++) {
          var x = mx + ((col + 0.5 + (Math.random() - 0.5) * 0.6) / inRow) * (W - mx * 2);
          var y = my + ((row + 0.5 + (Math.random() - 0.5) * 0.6) / rows) * (H - my * 2);
          spots.push({ x: Math.min(W - mx, Math.max(mx, x)), y: Math.min(H - my, Math.max(my, y)) });
          k++;
        }
      }
      return spots;
    }

    function make(i, colors, s) {
      var ang = Math.random() * Math.PI * 2, spd = 24 + Math.random() * 16;
      return {
        x: s.x, y: s.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        speed: spd, phase: Math.random() * 6.28, seed: Math.random() * 10,
        color: colors[i % colors.length], angle: ang + Math.PI / 2,
        scale: 0.76 + Math.random() * 0.3,
        depth: 0.35 + Math.random() * 0.65,     /* scroll parallax */
        alpha: 0.62 + Math.random() * 0.14,
        vis: 0,                                  /* fades in; dims over media */
        rippleAt: 4 + Math.random() * 10,
        role: "wander",                          /* wander | work | escort */
        job: null,
        trail: [], trailOn: false, trailUntil: 0, trailAt: 0,
        esc: null,
        hx: s.x, hy: s.y                         /* a loose home on an even grid */
      };
    }

    function syncCount() {
      var colors = palette(), n = desiredCount();
      if (agents.length < n) {
        jittered(n).slice(agents.length).forEach(function (s, i) {
          agents.push(make(agents.length + i, colors, s));
        });
      } else if (agents.length > n) {
        agents.length = n;
      }
      rehome();
    }
    /* Re-deal the homes over an even grid, matched to the nearest pointer,
       so the field stays spread across the whole viewport. */
    function rehome() {
      var spots = jittered(agents.length);
      var free = agents.slice();
      spots.forEach(function (sp) {
        var bi = 0, bd = 1e12;
        for (var i = 0; i < free.length; i++) {
          var d = (free[i].x - sp.x) * (free[i].x - sp.x) + (free[i].y - sp.y) * (free[i].y - sp.y);
          if (d < bd) { bd = d; bi = i; }
        }
        var a = free.splice(bi, 1)[0];
        if (a) { a.hx = sp.x; a.hy = sp.y; }
      });
    }

    function recolor() {
      dark = isDark();
      var colors = palette();
      agents.forEach(function (ag, i) { ag.color = colors[i % colors.length]; });
    }

    /* the escort: three pointers, each with its own offset, distance and lag */
    var ESCORT = [
      { back: 34, side: -15, k: 5.2 },
      { back: 56, side: 20, k: 3.8 },
      { back: 82, side: -4, k: 2.7 }
    ];
    function assignEscort() {
      agents.forEach(function (ag) { if (ag.role === "escort") { ag.role = "wander"; ag.esc = null; } });
      if (!escortOn() || !mouse.on) return;
      /* take the pointers nearest the mouse, so they visibly come over */
      var free = agents.filter(function (a) { return a.role === "wander"; });
      free.sort(function (a, b) {
        return Math.hypot(a.x - mouse.x, a.y - mouse.y) - Math.hypot(b.x - mouse.x, b.y - mouse.y);
      });
      for (var i = 0; i < ESCORT.length && i < free.length; i++) {
        free[i].role = "escort";
        free[i].esc = ESCORT[i];
        free[i].orbit = Math.random() * 6.28;
      }
    }

    /* a small task: glide to a heading or image edge, pause, click, leave */
    var nextJob = 3, nextRehome = 9;
    function startJob(t) {
      if (!targets.length && !floatState.rects.length) return;
      var pool = agents.filter(function (a) { return a.role === "wander"; });
      if (!pool.length) return;
      var floats = floatState.rects.filter(function (r) {
        return r.b > 0 && r.t < H && r.r > 0 && r.l < W && !r.dragging;
      });
      var tg, nudgeEl = null;
      if (floats.length && Math.random() < 0.28) {
        tg = floats[Math.floor(Math.random() * floats.length)];
        nudgeEl = tg.el;
      } else if (targets.length) {
        tg = targets[Math.floor(Math.random() * targets.length)];
        if (tg.el && tg.el.hasAttribute && tg.el.hasAttribute("data-drag-card")) nudgeEl = tg.el;
      } else {
        return;
      }
      /* a point just outside or on the rim of the element, never mid-text */
      var side = Math.floor(Math.random() * 4);
      var u = 0.15 + Math.random() * 0.7;
      var px, py;
      if (side === 0) { px = tg.l + tg.w * u; py = tg.t - 14; }
      else if (side === 1) { px = tg.r + 14; py = tg.t + tg.h * u; }
      else if (side === 2) { px = tg.l + tg.w * u; py = tg.b + 14; }
      else { px = tg.l - 14; py = tg.t + tg.h * u; }
      px = Math.min(W - 24, Math.max(24, px));
      py = Math.min(H - 24, Math.max(24, py));
      if (hit(boxes, px, py, 6)) return;
      var best = null, bd = 1e9;
      pool.forEach(function (a) {
        var d = Math.hypot(a.x - px, a.y - py);
        if (d < bd && d > 60) { bd = d; best = a; }
      });
      if (!best || bd > Math.max(W, H) * 0.7) return;
      best.role = "work";
      best.job = { x: px, y: py, phase: "go", until: t + 12, pausedAt: 0, el: nudgeEl };
      best.trailOn = true; best.trailUntil = t + 6;
    }

    function flow(x, y, t, seed) {
      var u = Math.sin(0.0019 * y + t * 0.13 + seed) + 0.55 * Math.sin(0.0031 * x + 0.0024 * y + t * 0.07 + seed * 0.7) + 0.28 * Math.sin(0.0056 * y - 0.0012 * x - t * 0.055 + seed * 2.1);
      var v = Math.cos(0.0016 * x - t * 0.11 + seed * 1.3) + 0.55 * Math.cos(0.0025 * x - 0.0029 * y + t * 0.08 + seed * 0.9) + 0.28 * Math.cos(0.0051 * x + 0.0014 * y + t * 0.06 + seed * 1.6);
      return [u, v];
    }
    function wrapAngle(a) {
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      return a;
    }

    function simulate(step, t) {
      var i, j, ag, f, fl, dx, dy, d, inv, dvx, dvy, spd, b;
      var n = agents.length;
      var R = Math.max(90, Math.sqrt((W * H) / Math.max(n, 1)) * 0.48), R2 = R * R;
      var edge = 72, wallK = 55, textK = 220;
      var idle = t - mouse.movedAt;
      var mouseLive = mouse.on && escortOn();
      var loosen = Math.min(1, Math.max(0, (idle - 0.6) / 1.6)); /* 0 moving → 1 resting */

      for (i = 0; i < n; i++) {
        ag = agents[i];
        var steerRate = 2.15;
        f = flow(ag.x, ag.y, t, ag.seed);
        fl = Math.hypot(f[0], f[1]) || 1;
        spd = ag.speed * (1 + 0.1 * Math.sin(t * 0.32 + ag.phase));
        dvx = (f[0] / fl) * spd;
        dvy = (f[1] / fl) * spd;

        if (ag.role === "escort" && mouseLive) {
          var e = ag.esc;
          /* trail behind the direction of travel, each at its own slot */
          var bx = -mouse.dirX, by = -mouse.dirY, sx = -by, sy = bx;
          var grow = 1 + loosen * 1.6;
          ag.orbit += step * (0.25 + loosen * 0.35);
          var drift = loosen * 18;
          var tx = mouse.x + (bx * e.back + sx * e.side) * grow + Math.cos(ag.orbit + ag.seed) * drift;
          var ty = mouse.y + (by * e.back + sy * e.side) * grow + Math.sin(ag.orbit * 0.8 + ag.seed) * drift;
          var k = e.k * (1 - loosen * 0.75);
          var wv = (1 - loosen) * 1 + loosen * 0.35;
          var sxv = (tx - ag.x) * k, syv = (ty - ag.y) * k;
          dvx = sxv * wv + dvx * (1 - wv) * 0.6;
          dvy = syv * wv + dvy * (1 - wv) * 0.6;
          steerRate = 7;
        } else if (ag.role === "work" && ag.job) {
          var jb = ag.job;
          dx = jb.x - ag.x; dy = jb.y - ag.y; d = Math.hypot(dx, dy) || 1;
          if (jb.phase === "go") {
            var s2 = Math.min(ag.speed * 2.1, 22 + d * 0.9);
            dvx = (dx / d) * s2; dvy = (dy / d) * s2;
            steerRate = 2.6;
            if (d < 5 || t > jb.until) { jb.phase = "pause"; jb.pausedAt = t; jb.clickAt = t + 0.35 + Math.random() * 0.5; }
          } else if (jb.phase === "pause") {
            dvx = dx * 2; dvy = dy * 2;
            steerRate = 5;
            if (!jb.clicked && t > jb.clickAt) {
              jb.clicked = true;
              ripples.push({ x: ag.x, y: ag.y, r: 1.5, life: 1, color: ag.color, click: true });
              ripples.push({ x: ag.x, y: ag.y, r: 1, life: 0.8, color: ag.color, click: true, delay: 0.16 });
              if (jb.el && floatState.nudge && !floatState.dragging) floatState.nudge(jb.el);
            }
            if (t > jb.pausedAt + 1.1 + Math.random() * 0.02 && jb.clicked) { ag.role = "wander"; ag.job = null; }
          }
        }

        if (ag.role !== "escort" || !mouseLive) {
          /* even spread */
          for (j = 0; j < n; j++) {
            if (j === i) continue;
            dx = ag.x - agents[j].x; dy = ag.y - agents[j].y;
            d = dx * dx + dy * dy;
            if (d < 0.01 || d > R2) continue;
            d = Math.sqrt(d); inv = 1 - d / R;
            var fr = inv * inv * (ag.role === "work" ? 14 : 48);
            dvx += (dx / d) * fr; dvy += (dy / d) * fr;
          }
          /* give the visitor's pointer room */
          if (mouse.on && mqFine.matches) {
            dx = ag.x - mouse.x; dy = ag.y - mouse.y; d = Math.hypot(dx, dy);
            var MR = 120;
            if (d < MR && d > 0.01) {
              inv = 1 - d / MR;
              dvx += (dx / d) * inv * inv * 160; dvy += (dy / d) * inv * inv * 160;
            }
          }
          if (ag.role === "wander") {
            /* a soft tether to home keeps density even (and lets scroll leave a wake) */
            dx = ag.hx - ag.x; dy = ag.hy - ag.y; d = Math.hypot(dx, dy);
            if (d > 40) { var hk = Math.min(1, (d - 40) / 260) * 34; dvx += (dx / d) * hk; dvy += (dy / d) * hk; }
          }
          if (ag.role !== "work") {
            if (ag.x < edge) dvx += ((edge - ag.x) / edge) * wallK;
            else if (ag.x > W - edge) dvx -= ((ag.x - (W - edge)) / edge) * wallK;
            if (ag.y < edge) dvy += ((edge - ag.y) / edge) * wallK;
            else if (ag.y > H - edge) dvy -= ((ag.y - (H - edge)) / edge) * wallK;
          }
        }
        /* never sit on the pointer itself */
        if (mouse.on && mqFine.matches) {
          dx = ag.x - mouse.x; dy = ag.y - mouse.y; d = Math.hypot(dx, dy);
          if (d < 30 && d > 0.01) { dvx += (dx / d) * 120; dvy += (dy / d) * 120; }
        }
        /* ease aside from the hero's movable cards; stronger while one is dragged */
        if (floatState.rects.length) {
          var fi, fb, fpad, fforce, fcx, fcy, fdx, fdy, fd, finv;
          for (fi = 0; fi < floatState.rects.length; fi++) {
            fb = floatState.rects[fi];
            fpad = fb.dragging ? 56 : 28;
            var fl = fb.l - fpad, frt = fb.r + fpad, ft = fb.t - fpad, fbb = fb.b + fpad;
            if (ag.x <= fl || ag.x >= frt || ag.y <= ft || ag.y >= fbb) continue;
            fcx = (fb.l + fb.r) / 2; fcy = (fb.t + fb.b) / 2;
            fdx = ag.x - fcx; fdy = ag.y - fcy; fd = Math.hypot(fdx, fdy) || 1;
            finv = 1 - fd / Math.hypot(frt - fl, fbb - ft);
            if (finv < 0) finv = 0;
            fforce = (fb.dragging ? 320 : 140) * finv * finv;
            if (ag.role === "escort") fforce *= 0.35;
            dvx += (fdx / fd) * fforce;
            dvy += (fdy / fd) * fforce;
          }
        }
        /* steer around type */
        for (j = 0; j < boxes.length; j++) {
          b = boxes[j];
          var il = b.l - 14, ir = b.r + 14, it = b.t - 14, ib = b.b + 14;
          if (ag.x > il && ag.x < ir && ag.y > it && ag.y < ib) {
            var dl = ag.x - il, dr = ir - ag.x, dt2 = ag.y - it, db = ib - ag.y;
            var mn = Math.min(dl, dr, dt2, db);
            var tk = (ag.role === "escort" ? 0.25 : 1) * textK;
            if (mn === dl) dvx -= tk; else if (mn === dr) dvx += tk;
            else if (mn === dt2) dvy -= tk; else dvy += tk;
          }
        }

        var st = 1 - Math.exp(-steerRate * step);
        ag.vx += (dvx - ag.vx) * st;
        ag.vy += (dvy - ag.vy) * st;
        var vmax = ag.role === "escort" ? 900 : ag.speed * (ag.role === "work" ? 2.4 : 1.45);
        var vm = Math.hypot(ag.vx, ag.vy);
        if (vm > vmax) { ag.vx *= vmax / vm; ag.vy *= vmax / vm; }
        ag.x += ag.vx * step;
        ag.y += ag.vy * step;

        if (ag.x < -30) ag.x = W + 20; else if (ag.x > W + 30) ag.x = -20;

        var want = Math.atan2(ag.vy, ag.vx) + Math.PI / 2;
        /* a resting or working pointer keeps its tilt instead of spinning */
        if (vm > 4) ag.angle += wrapAngle(want - ag.angle) * (1 - Math.exp(-5.5 * step));
      }
    }

    function applyScroll(dt) {
      if (!scrollAcc) { scrollV *= Math.exp(-6 * dt); return; }
      var dy = scrollAcc; scrollAcc = 0;
      scrollV = scrollV * 0.6 + (dy / Math.max(dt, 0.008)) * 0.4;
      for (var i = 0; i < agents.length; i++) {
        var ag = agents[i];
        if (ag.role === "escort" && mouse.on) continue;
        /* a light wake: pointers lag behind the page by depth */
        var k = 0.1 + ag.depth * 0.2;
        ag.y -= dy * k;
        if (ag.job) ag.job.y -= dy;
        if (ag.role === "work" && (ag.job && (ag.job.y < -20 || ag.job.y > H + 20))) { ag.role = "wander"; ag.job = null; }
        /* keep density even: whatever leaves one edge re-enters the other */
        if (ag.y < -26) { ag.y += H + 46; ag.vis = 0; ag.trail.length = 0; }
        else if (ag.y > H + 26) { ag.y -= H + 46; ag.vis = 0; ag.trail.length = 0; }
      }
      for (var r = 0; r < ripples.length; r++) ripples[r].y -= dy * 0.5;
    }

    function tick(now) {
      if (!running) return;
      if (!last) last = now;
      if (!t0) t0 = now;
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (dt <= 0) { raf = requestAnimationFrame(tick); return; }
      advance(dt);
      draw();
      raf = requestAnimationFrame(tick);
    }

    function advance(dt) {
      if (floatState.sync) floatState.sync();
      var t = simT;
      if (performance.now() - boxesAt > 220) collectBoxes();
      applyScroll(dt);
      var steps = Math.max(1, Math.ceil(dt / 0.02)), step = dt / steps;
      for (var k = 0; k < steps; k++) { simulate(step, t); t += step; }
      simT = t;

      if (t > nextRehome) { rehome(); nextRehome = t + 9 + Math.random() * 5; }
      if (t > nextJob) {
        startJob(t);
        nextJob = t + (narrow() ? 7 : 3.2) + Math.random() * (narrow() ? 6 : 4);
      }

      var i, ag;
      for (i = 0; i < agents.length; i++) {
        ag = agents[i];
        /* visibility: fade in after a wrap; a slight fade over media and type — never hide */
        var target = 1;
        if (hit(media, ag.x, ag.y, 4)) target = 0.84;
        if (hit(boxes, ag.x, ag.y, 0)) target = Math.min(target, ag.role === "escort" ? 0.78 : 0.64);
        ag.vis += (target - ag.vis) * (1 - Math.exp(-4 * dt));

        if (ag.role === "wander" && t > ag.rippleAt) {
          if (Math.random() < 0.25) ripples.push({ x: ag.x, y: ag.y, r: 2, life: 1, color: ag.color });
          ag.rippleAt = t + 6 + Math.random() * 11;
        }
        /* occasional faint trails (always a whisper on the escort) */
        if (!narrow()) {
          if (!ag.trailOn && ag.role === "wander" && Math.random() < dt * 0.025) { ag.trailOn = true; ag.trailUntil = t + 3 + Math.random() * 3; }
          var on = ag.trailOn && t < ag.trailUntil || (ag.role === "escort" && mouse.on);
          if (on && t - ag.trailAt > 0.045) {
            ag.trail.push(ag.x, ag.y);
            if (ag.trail.length > 36) ag.trail.splice(0, 2);
            ag.trailAt = t;
          } else if (!on) {
            ag.trailOn = false;
            if (ag.trail.length && t - ag.trailAt > 0.045) { ag.trail.splice(0, 2); ag.trailAt = t; }
          }
        }
      }
      for (i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i];
        if (rp.delay > 0) { rp.delay -= dt; continue; }
        rp.r += (rp.click ? 26 : 18) * dt;
        rp.life -= (rp.click ? 1.1 : 0.55) * dt;
        if (rp.life <= 0) ripples.splice(i, 1);
      }
    }

    function drawPointer(ag) {
      var a = ag.alpha * ag.vis;
      if (a < 0.01) return;
      ctx.save();
      ctx.translate(ag.x, ag.y);
      ctx.rotate(ag.angle);
      ctx.scale(ag.scale, ag.scale);
      ctx.globalAlpha = a;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, 16.5); ctx.lineTo(4.1, 13); ctx.lineTo(7.1, 20.2);
      ctx.lineTo(9.5, 19.1); ctx.lineTo(6.5, 12); ctx.lineTo(12.4, 12);
      ctx.closePath();
      ctx.fillStyle = ag.color;
      /* a soft halo so neon reads on both grounds */
      ctx.shadowColor = dark ? ag.color : "rgba(14,14,16,0.28)";
      ctx.shadowBlur = dark ? 8 : 5;
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
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var i, ag, rp, tr, p;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (i = 0; i < agents.length; i++) {
        ag = agents[i]; tr = ag.trail;
        if (tr.length < 6) continue;
        ctx.strokeStyle = ag.color;
        ctx.lineWidth = 1;
        var segs = tr.length / 2 - 1;
        for (p = 0; p < segs; p++) {
          ctx.globalAlpha = (p / segs) * 0.13 * ag.vis;
          ctx.beginPath();
          ctx.moveTo(tr[p * 2], tr[p * 2 + 1]);
          ctx.lineTo(tr[p * 2 + 2], tr[p * 2 + 3]);
          ctx.stroke();
        }
      }
      for (i = 0; i < ripples.length; i++) {
        rp = ripples[i];
        if (rp.delay > 0) continue;
        ctx.globalAlpha = Math.max(0, rp.life) * (rp.click ? 0.3 : 0.16);
        ctx.strokeStyle = rp.color;
        ctx.lineWidth = rp.click ? 1.1 : 0.9;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (i = 0; i < agents.length; i++) drawPointer(agents[i]);
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

    resize();
    var colors = palette();
    agents = jittered(desiredCount()).map(function (s, i) { return make(i, colors, s); });
    agents.forEach(function (ag) { ag.vis = hit(boxes, ag.x, ag.y, 0) ? 0 : 1; });
    setTimeout(collectBoxes, 150);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(collectBoxes);

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 80);
    }, { passive: true });
    window.addEventListener("scroll", function () {
      var y = window.scrollY || 0;
      scrollAcc += y - lastScrollY;
      lastScrollY = y;
      boxesAt = 0;
    }, { passive: true });

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      var nx = e.clientX, ny = e.clientY;
      var dx = nx - mouse.x, dy = ny - mouse.y, d = Math.hypot(dx, dy);
      if (mouse.on && d > 1.5) {
        /* smooth heading, so the escort swings rather than snaps */
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

    if (!document.hidden) start();

    /* Optional capture hook for preview recordings. Absent from normal visits. */
    if (/\barcap=1\b/.test(location.search)) {
      window.__arcap = {
        stop: stop,
        start: start,
        running: function () { return running; },
        count: function () { return agents.length; },
        snapshot: function () {
          return { W: W, H: H, agents: agents.map(function (a) {
            return { x: a.x, y: a.y, role: a.role, vis: a.vis };
          }) };
        }
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

  initAgents();

})();
