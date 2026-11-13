/* Antonio Rosati — portfolio v2 */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var narrow = window.matchMedia("(max-width: 860px)");


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
    }, 340);
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


  /* ---------- wandering agent cursors (behind content) ---------- */
  function initAgents() {
    var canvas = document.querySelector("[data-agents]");
    if (!canvas || reduce) {
      if (canvas) canvas.remove();
      return;
    }
    var ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    try { ctx.imageSmoothingQuality = "high"; } catch (e) {}

    var dpr = 1;
    var W = 0, H = 0;
    var agents = [];
    var ripples = [];
    var running = !document.hidden;
    var last = 0;
    var raf = 0;
    var t0 = 0;
    var boxes = [];
    var boxesAt = 0;
    var mqNarrow = window.matchMedia("(max-width: 700px)");

    function palette() {
      return isDark()
        ? ["#D4896C", "#8B9A80", "#C9C1B4", "#E2D3B8", "#A39B8F", "#D4A090", "#C4B49A", "#B89580"]
        : ["#8C4A32", "#6B7A62", "#5C564C", "#1F1B16", "#8A8378", "#A67C52", "#7A6A58", "#9A5A42"];
    }

    function desiredCount() {
      var n = Math.round((W * H) / 72000);
      if (mqNarrow.matches) return Math.max(6, Math.min(8, n));
      return Math.max(14, Math.min(20, n));
    }

    function resize() {
      var next = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = next;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      try { ctx.imageSmoothingQuality = "high"; } catch (e) {}
      syncCount();
      collectBoxes();
    }

    function inBoxes(x, y, pad) {
      pad = pad || 0;
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        if (x > b.l - pad && x < b.r + pad && y > b.t - pad && y < b.b + pad) return b;
      }
      return null;
    }

    function vacate(ag) {
      var guard = 0;
      while (guard++ < 12) {
        var b = inBoxes(ag.x, ag.y, 22);
        if (!b) return;
        var cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2;
        var dx = ag.x - cx, dy = ag.y - cy;
        if (Math.abs(dx) + Math.abs(dy) < 0.5) { dx = 1; dy = 0.3; }
        var d = Math.hypot(dx, dy) || 1;
        /* Slide to the nearest edge plus a little air, then stop — only used at setup. */
        var dl = ag.x - (b.l - 24), dr = (b.r + 24) - ag.x;
        var dtb = ag.y - (b.t - 24), db2 = (b.b + 24) - ag.y;
        var min = Math.min(dl, dr, dtb, db2);
        if (min === dl) ag.x = b.l - 26;
        else if (min === dr) ag.x = b.r + 26;
        else if (min === dtb) ag.y = b.t - 26;
        else ag.y = b.b + 26;
        ag.x = Math.min(W - 16, Math.max(16, ag.x));
        ag.y = Math.min(H - 16, Math.max(16, ag.y));
      }
    }

    function collectBoxes() {
      var list = [];
      document.querySelectorAll("h1, h2, h3, .lede, .work-note, .nav, .eyebrow, .hero-copy p, .case-open p, .project-hero p, .about-body, .tour-copy, .meta").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width < 8 || r.bottom < -8 || r.top > H + 8) return;
        list.push({
          l: r.left - 12,
          t: r.top - 12,
          r: r.right + 18,
          b: r.bottom + 16
        });
      });
      boxes = list;
      boxesAt = performance.now();
    }

    function jittered(n) {
      var cols = Math.max(1, Math.ceil(Math.sqrt(n * W / Math.max(H, 1))));
      var rows = Math.max(1, Math.ceil(n / cols));
      var spots = [];
      var k = 0;
      var marginX = 36, marginY = 40;
      for (var row = 0; row < rows && k < n; row++) {
        var inRow = (row === rows - 1) ? (n - k) : Math.ceil(n / rows);
        if (row < rows - 1) inRow = Math.min(cols, n - k);
        for (var col = 0; col < inRow && k < n; col++) {
          var jx = (Math.random() - 0.5) * 0.55;
          var jy = (Math.random() - 0.5) * 0.55;
          var x = marginX + ((col + 0.5 + jx) / inRow) * (W - marginX * 2);
          var y = marginY + ((row + 0.5 + jy) / rows) * (H - marginY * 2);
          spots.push({
            x: Math.min(W - marginX, Math.max(marginX, x)),
            y: Math.min(H - marginY, Math.max(marginY, y))
          });
          k++;
        }
      }
      return spots;
    }

    function make(i, colors, spot) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 26 + Math.random() * 16;
      return {
        x: spot.x,
        y: spot.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        speed: spd,
        phase: Math.random() * Math.PI * 2,
        seed: Math.random() * 10,
        color: colors[i % colors.length],
        angle: ang + Math.PI / 2,
        scale: 0.78 + Math.random() * 0.28,
        alpha: 0.34 + Math.random() * 0.1,
        rippleAt: 3 + Math.random() * 10
      };
    }

    function syncCount() {
      var colors = palette();
      var n = desiredCount();
      if (agents.length === n) return;
      if (agents.length < n) {
        var spots = jittered(n);
        // avoid dropping new ones on top of existing
        var used = spots.slice(agents.length);
        used.forEach(function (s, i) {
          agents.push(make(agents.length + i, colors, s));
        });
      } else {
        agents.length = n;
      }
    }

    function recolor() {
      var colors = palette();
      agents.forEach(function (ag, i) {
        ag.color = colors[i % colors.length];
      });
    }

    /* Smooth, C-infinity flow field (sum of large-scale sines). */
    function flow(x, y, t, seed) {
      var u = 0, v = 0;
      u += Math.sin(0.0019 * y + t * 0.13 + seed) * 1.00;
      v += Math.cos(0.0016 * x - t * 0.11 + seed * 1.3) * 1.00;
      u += Math.sin(0.0031 * x + 0.0024 * y + t * 0.07 + seed * 0.7) * 0.55;
      v += Math.cos(0.0025 * x - 0.0029 * y + t * 0.08 + seed * 0.9) * 0.55;
      u += Math.sin(0.0056 * y - 0.0012 * x - t * 0.055 + seed * 2.1) * 0.28;
      v += Math.cos(0.0051 * x + 0.0014 * y + t * 0.06 + seed * 1.6) * 0.28;
      return [u, v];
    }

    function wrapAngle(a) {
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      return a;
    }

    function tick(now) {
      if (!running) return;
      if (!last) last = now;
      if (!t0) t0 = now;
      var dt = (now - last) / 1000;
      if (dt <= 0) {
        if (running) raf = requestAnimationFrame(tick);
        return;
      }
      /* Split large gaps into substeps so a hitch never jumps a cursor. */
      var steps = Math.max(1, Math.ceil(dt / 0.020));
      var step = Math.min(dt / steps, 0.020);
      last = now;
      var t = (now - t0) / 1000;

      if (now - boxesAt > 240) collectBoxes();

      var i, j, ag, fl, dx, dy, d, inv, force, k;
      var desiredVx, desiredVy, spd, f, steer, want, diff;
      var R = Math.max(90, Math.sqrt((W * H) / Math.max(agents.length, 1)) * 0.48);
      var R2 = R * R;
      var edge = 72;
      var wallK = 55;
      var steerRate = 2.15;
      var textK = 220;

      for (k = 0; k < steps; k++) {
        for (i = 0; i < agents.length; i++) {
          ag = agents[i];
          f = flow(ag.x, ag.y, t, ag.seed);
          fl = Math.hypot(f[0], f[1]) || 1;
          spd = ag.speed * (1 + 0.1 * Math.sin(t * 0.32 + ag.phase));
          desiredVx = (f[0] / fl) * spd;
          desiredVy = (f[1] / fl) * spd;

          /* Mutual soft repulsion — even spread, no clustering. */
          for (j = 0; j < agents.length; j++) {
            if (j === i) continue;
            dx = ag.x - agents[j].x;
            dy = ag.y - agents[j].y;
            d = dx * dx + dy * dy;
            if (d < 0.01 || d > R2) continue;
            d = Math.sqrt(d);
            inv = 1 - d / R;
            force = inv * inv * 48;
            desiredVx += (dx / d) * force;
            desiredVy += (dy / d) * force;
          }

          /* Soft wall: turn before the edge, never snap. */
          if (ag.x < edge) desiredVx += ((edge - ag.x) / edge) * wallK;
          else if (ag.x > W - edge) desiredVx -= ((ag.x - (W - edge)) / edge) * wallK;
          if (ag.y < edge) desiredVy += ((edge - ag.y) / edge) * wallK;
          else if (ag.y > H - edge) desiredVy -= ((ag.y - (H - edge)) / edge) * wallK;

          /* Softly steer around body copy, without a hard jump. */
          for (j = 0; j < boxes.length; j++) {
            var b = boxes[j];
            var pad = 22;
            var il = b.l - pad, ir = b.r + pad, it = b.t - pad, ib = b.b + pad;
            if (ag.x > il && ag.x < ir && ag.y > it && ag.y < ib) {
              var dl = ag.x - il, dr = ir - ag.x, dtb = ag.y - it, db2 = ib - ag.y;
              var min = Math.min(dl, dr, dtb, db2);
              var inside = ag.x > b.l && ag.x < b.r && ag.y > b.t && ag.y < b.b;
              var tk = inside ? textK : textK * 0.6;
              if (min === dl) desiredVx -= tk;
              else if (min === dr) desiredVx += tk;
              else if (min === dtb) desiredVy -= tk;
              else desiredVy += tk;
            }
          }

          steer = 1 - Math.exp(-steerRate * step);
          ag.vx += (desiredVx - ag.vx) * steer;
          ag.vy += (desiredVy - ag.vy) * steer;
          var vmax = ag.speed * 1.45;
          var vmag = Math.hypot(ag.vx, ag.vy);
          if (vmag > vmax) {
            ag.vx *= vmax / vmag;
            ag.vy *= vmax / vmag;
          }

          ag.x += ag.vx * step;
          ag.y += ag.vy * step;

          if (ag.x < 10) { ag.x = 10; if (ag.vx < 0) ag.vx = 0; }
          if (ag.x > W - 10) { ag.x = W - 10; if (ag.vx > 0) ag.vx = 0; }
          if (ag.y < 10) { ag.y = 10; if (ag.vy < 0) ag.vy = 0; }
          if (ag.y > H - 10) { ag.y = H - 10; if (ag.vy > 0) ag.vy = 0; }

          want = Math.atan2(ag.vy, ag.vx) + Math.PI / 2;
          diff = wrapAngle(want - ag.angle);
          ag.angle += diff * (1 - Math.exp(-5.5 * step));
        }
        t += step;
      }

      /* Occasional faint ripple — no pause, just a mark. */
      for (i = 0; i < agents.length; i++) {
        ag = agents[i];
        if (t > ag.rippleAt) {
          if (Math.random() < 0.28) {
            ripples.push({ x: ag.x, y: ag.y, r: 2, life: 1, color: ag.color });
          }
          ag.rippleAt = t + 5 + Math.random() * 11;
        }
      }
      for (i = ripples.length - 1; i >= 0; i--) {
        ripples[i].r += 18 * dt;
        ripples[i].life -= 0.55 * dt;
        if (ripples[i].life <= 0) ripples.splice(i, 1);
      }

      draw();
      if (running) raf = requestAnimationFrame(tick);
    }

    function drawPointer(ag) {
      ctx.save();
      ctx.translate(ag.x, ag.y);
      ctx.rotate(ag.angle);
      ctx.scale(ag.scale, ag.scale);
      ctx.globalAlpha = ag.alpha;
      ctx.fillStyle = ag.color;
      ctx.strokeStyle = isDark() ? "rgba(27,24,20,0.48)" : "rgba(251,248,241,0.62)";
      ctx.lineWidth = 0.8;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 16.5);
      ctx.lineTo(4.1, 13);
      ctx.lineTo(7.1, 20.2);
      ctx.lineTo(9.5, 19.1);
      ctx.lineTo(6.5, 12);
      ctx.lineTo(12.4, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var i, rp;
      for (i = 0; i < ripples.length; i++) {
        rp = ripples[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, rp.life) * 0.16;
        ctx.strokeStyle = rp.color;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      for (i = 0; i < agents.length; i++) drawPointer(agents[i]);
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function settle() {
      collectBoxes();
      agents.forEach(vacate);
      draw();
    }

    resize();
    var colors = palette();
    collectBoxes();
    var spots = jittered(desiredCount());
    agents = spots.map(function (s, i) { return make(i, colors, s); });
    agents.forEach(vacate);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(settle);
    }
    setTimeout(settle, 120);
    setTimeout(settle, 400);

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 80);
    }, { passive: true });
    window.addEventListener("scroll", function () {
      boxesAt = 0;
    }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
    document.addEventListener("themechange", recolor);

    if (!document.hidden) {
      running = true;
      raf = requestAnimationFrame(tick);
    }

    /* Optional capture hook for preview recordings. Absent from normal visits. */
    if (/\barcap=1\b/.test(location.search)) {
      window.__arcap = {
        stop: stop,
        count: function () { return agents.length; },
        step: function (seconds) {
          stop();
          if (!t0) t0 = 1;
          if (!last) last = t0;
          running = true;
          tick(last + seconds * 1000);
          stop();
        },
        snapshot: function () {
          return {
            W: W, H: H,
            agents: agents.map(function (a) {
              return { x: a.x, y: a.y, angle: a.angle, scale: a.scale, alpha: a.alpha, color: a.color, vx: a.vx, vy: a.vy };
            }),
            ripples: ripples.map(function (r) {
              return { x: r.x, y: r.y, r: r.r, life: r.life, color: r.color };
            })
          };
        }
      };
    }
  }

  initAgents();

})();
