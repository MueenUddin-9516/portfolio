(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme ---------- */
  var KEY = "mu-theme";
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function isDark() {
    var s = stored();
    if (s) return s === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  var themeBtn = document.getElementById("themeToggle");
  if (stored()) root.setAttribute("data-theme", stored());
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next); store(next);
  });

  /* ---------- top bar + mobile nav + scroll-spy ---------- */
  var topbar = document.getElementById("topbar");
  var menu = document.getElementById("menuToggle");
  var nav = document.getElementById("primaryNav");
  if (menu && nav) {
    menu.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); });
    });
  }
  var links = [].slice.call(document.querySelectorAll("nav.primary a[href^='#']"));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  function onScroll() {
    topbar.classList.toggle("scrolled", window.scrollY > 40);
    var pos = window.scrollY + 120, idx = -1;
    secs.forEach(function (s, i) { if (s && s.offsetTop <= pos) idx = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === idx); });
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- hero network ---------- */
  var cv = document.getElementById("net");
  if (cv && cv.getContext) {
    var ctx = cv.getContext("2d"), W, H, dpr, nodes = [], packets = [], raf;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(90, Math.max(36, W * H / 16000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
          r: Math.random() < .12 ? 3.2 : 1.6 + Math.random() * 1.2,
          hub: Math.random() < .12
        });
      }
      packets = [];
    }
    var LINK = 150;
    function neighbours(i) {
      var out = [], a = nodes[i];
      for (var j = 0; j < nodes.length; j++) if (j !== i) {
        var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy < LINK * LINK) out.push(j);
      }
      return out;
    }
    function spawn() {
      var i = Math.floor(Math.random() * nodes.length), nb = neighbours(i);
      if (nb.length) packets.push({ a: i, b: nb[Math.floor(Math.random() * nb.length)], t: 0, s: .008 + Math.random() * .01 });
    }
    function draw(step) {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d2;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (step) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < -20) a.x = W + 20; if (a.x > W + 20) a.x = -20;
          if (a.y < -20) a.y = H + 20; if (a.y > H + 20) a.y = -20;
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = "rgba(79,209,191," + (0.32 * (1 - Math.sqrt(d2) / LINK)).toFixed(3) + ")";
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.fillStyle = a.hub ? "rgba(240,199,94,.9)" : "rgba(160,225,216,.75)";
        if (a.hub) { ctx.fillRect(a.x - 3, a.y - 3, 6, 6); }
        else { ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill(); }
      }
      for (i = packets.length - 1; i >= 0; i--) {
        var p = packets[i]; a = nodes[p.a]; b = nodes[p.b];
        if (step) p.t += p.s;
        if (p.t >= 1) { packets.splice(i, 1); continue; }
        var x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        var g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.3, "rgba(79,209,191,.7)"); g.addColorStop(1, "rgba(79,209,191,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
      }
    }
    var visible = true, last = 0;
    function loop(ts) {
      if (visible) {
        if (ts - last > 260 && packets.length < 14) { spawn(); last = ts; }
        draw(true);
      }
      raf = requestAnimationFrame(loop);
    }
    size();
    window.addEventListener("resize", function () { size(); if (reduce) draw(false); });
    if (reduce) { for (var k = 0; k < 6; k++) spawn(); packets.forEach(function (p) { p.t = Math.random(); }); draw(false); }
    else {
      if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(cv);
      raf = requestAnimationFrame(loop);
    }
  }

  /* ---------- count-up metrics (one-time, on load) ---------- */
  function countUp(el) {
    var raw = el.textContent.trim(), m = raw.match(/^([\d,]+)(.*)$/);
    if (!m || reduce) return;
    var target = parseInt(m[1].replace(/,/g, ""), 10), suffix = m[2], t0 = null, dur = 1400;
    function fmt(n) { return n >= 1000 ? n.toLocaleString("en-US") : String(n); }
    function tick(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(target * e)) + suffix;
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  document.querySelectorAll(".metric .figure").forEach(countUp);

  /* ---------- publication data ---------- */
  var dataEl = document.getElementById("pubData");
  var PUBS = dataEl ? JSON.parse(dataEl.textContent) : [];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function boldMe(a) { return esc(a).replace(/Mueen Uddin/g, '<span class="me">Mueen Uddin</span>'); }

  /* chart: publications per year */
  var bars = document.getElementById("bars"), yearsEl = document.getElementById("barYears");
  if (bars && PUBS.length) {
    var by = {}, minY = 2011, maxY = 2026;
    PUBS.forEach(function (p) { if (p.y >= minY && p.y <= maxY) by[p.y] = (by[p.y] || 0) + 1; });
    var max = 0; for (var y = minY; y <= maxY; y++) max = Math.max(max, by[y] || 0);
    var html = "", yrs = "";
    for (y = minY; y <= maxY; y++) {
      var n = by[y] || 0;
      html += '<div class="bar-col' + (n === max ? " peak" : "") + '" title="' + y + ": " + n + ' publications"><span class="n">' + n + '</span><div class="b" data-h="' + (n / max * 100).toFixed(1) + '"></div></div>';
      yrs += "<span>&rsquo;" + String(y).slice(2) + "</span>";
    }
    bars.innerHTML = html;
    yearsEl.innerHTML = yrs;
    function grow() {
      bars.classList.add("on");
      bars.querySelectorAll(".b").forEach(function (b) { b.style.height = b.getAttribute("data-h") + "%"; });
    }
    if (reduce || !("IntersectionObserver" in window)) grow();
    else new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { grow(); o.disconnect(); } }, { threshold: .3 }).observe(bars);
  }

  /* publication browser */
  var rows = document.getElementById("pubRows");
  if (rows) {
    var q = document.getElementById("pubSearch"), sortSel = document.getElementById("pubSort"),
        yearSel = document.getElementById("pubYear"), countEl = document.getElementById("pubCount"),
        segBtns = [].slice.call(document.querySelectorAll("#pubType button")), moreBtn = document.getElementById("pubMore");
    var kind = "all", limit = 25;
    var years = PUBS.map(function (p) { return p.y; }).filter(Boolean);
    var uniq = years.filter(function (y, i) { return years.indexOf(y) === i; }).sort(function (a, b) { return b - a; });
    uniq.forEach(function (y) { var o = document.createElement("option"); o.value = y; o.textContent = y; yearSel.appendChild(o); });

    function render() {
      var term = (q.value || "").toLowerCase().trim(), yv = yearSel.value;
      var list = PUBS.filter(function (p) {
        if (kind !== "all" && p.k !== kind) return false;
        if (yv && String(p.y) !== yv) return false;
        if (term && (p.t + " " + p.a + " " + p.v).toLowerCase().indexOf(term) === -1) return false;
        return true;
      });
      if (sortSel.value === "if") list.sort(function (a, b) { return (b.f || 0) - (a.f || 0) || b.y - a.y; });
      else list.sort(function (a, b) { return (b.y || 0) - (a.y || 0); });
      countEl.textContent = "Showing " + Math.min(limit, list.length) + " of " + list.length + (list.length === 1 ? " publication" : " publications");
      if (!list.length) { rows.innerHTML = '<div class="empty">No publications match that search. Try a broader term or clear the filters.</div>'; moreBtn.parentNode.hidden = true; return; }
      rows.innerHTML = list.slice(0, limit).map(function (p) {
        var tags = "";
        if (p.f) tags += '<span class="pill if">IF ' + p.f + "</span>";
        tags += '<span class="pill">' + (p.k === "journal" ? "Journal" : p.k === "conference" ? "Conference" : "Chapter") + "</span>";
        if (p.s === "accepted") tags += '<span class="pill ok">Accepted</span>';
        return '<article class="prow"><div class="yr">' + (p.y || "") + '</div><div><div class="t">' + esc(p.t) +
          '</div><div class="au">' + boldMe(p.a) + '</div><div class="v">' + esc(p.v) + '</div></div><div class="tags">' + tags + "</div></article>";
      }).join("");
      moreBtn.parentNode.hidden = list.length <= limit;
    }
    q.addEventListener("input", function () { limit = 25; render(); });
    sortSel.addEventListener("change", render);
    yearSel.addEventListener("change", function () { limit = 25; render(); });
    segBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        kind = b.getAttribute("data-k"); limit = 25;
        segBtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        render();
      });
    });
    moreBtn.addEventListener("click", function () { limit += 50; render(); });
    render();
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
