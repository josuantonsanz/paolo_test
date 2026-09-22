/* Lectura bilingüe sincronizada — Zoffoli, Vol. I.
   El scroll es único para las dos columnas (la sincronía es estructural: cada fila
   coloca el párrafo italiano y su traducción en la misma línea base). Este script
   añade lo que el HTML no puede: señalar la fila que se está leyendo, mostrar la
   página impresa en curso, saltar de nota y gobernar el teclado. */
(function () {
  "use strict";

  var READ_LINE = 0.3; // altura de la ventana donde se considera la línea de lectura
  var STORE = "zoffoli.sincro.prefs";

  var rows = Array.prototype.slice.call(document.querySelectorAll(".row.pair"));
  var pageRows = Array.prototype.slice.call(document.querySelectorAll(".row.page-row"));
  if (!rows.length) return;

  var bar = document.querySelector(".topbar");
  var progressBar = document.querySelector(".progress i");
  var hudPage = document.getElementById("hud-page");
  var hudChapter = document.getElementById("hud-chapter");
  var pageSelect = document.getElementById("page-jump");
  var btnSrc = document.getElementById("toggle-src");
  var btnUp = document.getElementById("to-top");
  var tops = [];
  var cursor = -1;

  /* ---------------------------------------------------------- utilidades */
  function prefs() {
    try { return JSON.parse(localStorage.getItem(STORE) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function savePrefs(patch) {
    var p = prefs();
    Object.keys(patch).forEach(function (k) { p[k] = patch[k]; });
    try { localStorage.setItem(STORE, JSON.stringify(p)); } catch (e) { /* privado */ }
  }

  function measure() {
    tops = rows.map(function (el) { return el.getBoundingClientRect().top + window.scrollY; });
    if (bar) {
      var h = bar.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--topbar-h", h + "px");
    }
  }

  function nearest(value, list) {
    var lo = 0, hi = list.length - 1, ans = 0;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (list[mid] <= value) { ans = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    return ans;
  }

  function readLine() { return window.scrollY + window.innerHeight * READ_LINE; }

  function pageOf(index) {
    var value = rows[index].getAttribute("data-page") || "";
    return value;
  }

  // Deja la fila indicada sobre la línea de lectura. `instant` se usa al abrir un
  // enlace con ancla: entonces la página debe aparecer ya encuadrada, sin animación.
  function centerRow(index, behavior) {
    window.scrollTo({
      top: Math.max(0, tops[index] - window.innerHeight * READ_LINE),
      behavior: behavior || "smooth"
    });
  }

  /* ------------------------------------------------------- fila de lectura */
  function setCursor(index, scroll) {
    if (index < 0) index = 0;
    if (index > rows.length - 1) index = rows.length - 1;
    if (cursor === index && !scroll) return;
    if (cursor >= 0 && rows[cursor]) rows[cursor].classList.remove("is-cursor");
    cursor = index;
    rows[cursor].classList.add("is-cursor");
    if (scroll) centerRow(cursor, "smooth");
    updateHud();
  }

  function updateHud() {
    var page = cursor >= 0 ? pageOf(cursor) : "";
    if (hudPage) hudPage.textContent = page ? "p. " + page : "";
    if (hudChapter && cursor >= 0) {
      hudChapter.textContent = rows[cursor].getAttribute("data-ch") || "";
    }
    if (progressBar) {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      progressBar.style.width = (ratio * 100).toFixed(2) + "%";
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      if (!tops.length) measure();
      setCursor(nearest(readLine(), tops), false);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { measure(); onScroll(); });

  /* ------------------------------------------------------------- teclado */
  function jumpToPage(delta) {
    var pages = pageRows.map(function (el) { return el.getBoundingClientRect().top + window.scrollY; });
    if (!pages.length) return;
    var here = window.scrollY;
    var index = nearest(here + 4, pages);
    if (delta > 0) index = pages[index] > here + 8 ? index : index + 1;
    else index = pages[index] >= here - 8 ? index - 1 : index;
    index = Math.max(0, Math.min(pages.length - 1, index));
    window.scrollTo({ top: pages[index] - 80, behavior: "smooth" });
  }

  document.addEventListener("keydown", function (event) {
    var tag = (event.target && event.target.tagName) || "";
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || event.metaKey || event.ctrlKey || event.altKey) return;
    var key = event.key;
    if (key === "ArrowDown" || key === "j") { setCursor(cursor + 1, true); event.preventDefault(); }
    else if (key === "ArrowUp" || key === "k") { setCursor(cursor - 1, true); event.preventDefault(); }
    else if (key === "]" || key === "n") { jumpToPage(1); event.preventDefault(); }
    else if (key === "[" || key === "p") { jumpToPage(-1); event.preventDefault(); }
    else if (key === "h") { toggleSource(); event.preventDefault(); }
    else if (key === "Home") { window.scrollTo({ top: 0, behavior: "smooth" }); event.preventDefault(); }
    else if (key === "End") { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); event.preventDefault(); }
  });

  /* ----------------------------------------------- clic en una fila o nota */
  document.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest("a[data-jump]") : null;
    if (link) {
      event.preventDefault();
      var target = document.getElementById(link.getAttribute("data-jump"));
      if (!target) return;
      var top = target.getBoundingClientRect().top + window.scrollY - window.innerHeight * READ_LINE;
      window.scrollTo({ top: top, behavior: "smooth" });
      target.classList.add("flash");
      window.setTimeout(function () { target.classList.remove("flash"); }, 1700);
      return;
    }
    if (event.target.closest && event.target.closest("a")) return;
    var row = event.target.closest ? event.target.closest(".row.pair") : null;
    if (row) {
      var index = rows.indexOf(row);
      if (index >= 0) setCursor(index, false);
    }
  });

  /* -------------------------------------------------------- herramientas */
  function toggleSource() {
    var hidden = document.body.classList.toggle("hide-src");
    if (btnSrc) {
      btnSrc.setAttribute("aria-pressed", hidden ? "true" : "false");
      btnSrc.textContent = hidden ? "Mostrar italiano" : "Ocultar italiano";
    }
    savePrefs({ hideSrc: hidden });
    window.setTimeout(measure, 260);
  }
  if (btnSrc) btnSrc.addEventListener("click", toggleSource);

  var fontButtons = document.querySelectorAll("[data-font]");
  Array.prototype.forEach.call(fontButtons, function (button) {
    button.addEventListener("click", function () {
      var step = parseFloat(button.getAttribute("data-font")) || 0;
      var current = parseFloat(prefs().scale) || 1;
      var next = Math.min(1.7, Math.max(0.8, Math.round((current + step) * 100) / 100));
      document.documentElement.style.setProperty("--font-scale", next);
      savePrefs({ scale: next });
    });
  });

  if (btnUp) btnUp.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  if (pageSelect) {
    pageSelect.addEventListener("change", function () {
      var target = document.getElementById(pageSelect.value);
      if (!target) return;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - window.innerHeight * READ_LINE,
        behavior: "smooth"
      });
    });
  }

  /* --------------------------------------------------------------- arranque */
  var saved = prefs();
  if (saved.scale) document.documentElement.style.setProperty("--font-scale", saved.scale);
  if (saved.hideSrc) {
    document.body.classList.add("hide-src");
    if (btnSrc) { btnSrc.setAttribute("aria-pressed", "true"); btnSrc.textContent = "Mostrar italiano"; }
  }

  // El punto de lectura se coloca en el ancla de entrada (por ejemplo, un enlace a una
  // nota). El navegador recoloca el scroll al resolver el ancla y al terminar la
  // maquetación, así que el encuadre se reintenta unas cuantas veces y luego se deja
  // de insistir.
  var pendingAnchor = null;
  if (location.hash) {
    var anchor = document.getElementById(location.hash.slice(1));
    var host = anchor && anchor.closest ? anchor.closest(".row.pair") : null;
    if (host && rows.indexOf(host) >= 0) pendingAnchor = rows.indexOf(host);
  }

  function settleAnchor() {
    if (pendingAnchor === null) return;
    measure();
    centerRow(pendingAnchor, "instant");
    setCursor(pendingAnchor, false);
    updateHud();
  }

  measure();
  setCursor(pendingAnchor === null ? nearest(readLine(), tops) : pendingAnchor, false);
  settleAnchor();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measure(); settleAnchor(); onScroll(); });
  }
  window.addEventListener("load", function () { measure(); settleAnchor(); onScroll(); });
  [150, 400, 800].forEach(function (delay) { window.setTimeout(settleAnchor, delay); });
  window.setTimeout(function () { pendingAnchor = null; }, 1200);
  updateHud();
})();
