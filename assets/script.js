(function () {
  "use strict";

  /* ---------- theme toggle ---------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById("themeToggle");
  var THEME_KEY = "mu-theme";

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function storeTheme(v) {
    try { localStorage.setItem(THEME_KEY, v); } catch (e) {}
  }
  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function currentIsDark() {
    var stored = getStoredTheme();
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return systemPrefersDark();
  }
  function applyThemeIcon() {
    if (!themeBtn) return;
    themeBtn.setAttribute("aria-label", currentIsDark() ? "Switch to light theme" : "Switch to dark theme");
  }
  applyThemeIcon();

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentIsDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      storeTheme(next);
      applyThemeIcon();
    });
  }

  /* ---------- mobile nav ---------- */
  var menuToggle = document.getElementById("menuToggle");
  var primaryNav = document.getElementById("primaryNav");
  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", function () {
      var open = primaryNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    primaryNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        primaryNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- scroll-spy active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("nav.primary a[href^='#']"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function onScroll() {
    var pos = window.scrollY + 120;
    var activeIndex = 0;
    sections.forEach(function (sec, i) {
      if (sec.offsetTop <= pos) activeIndex = i;
    });
    navLinks.forEach(function (a) { a.classList.remove("active"); });
    if (navLinks[activeIndex]) navLinks[activeIndex].classList.add("active");
  }
  if (sections.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
