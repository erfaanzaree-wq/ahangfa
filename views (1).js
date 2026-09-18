/**
 * New Taraneh – View Counter + Blog Stats
 * https://erfaanzaree-wq.github.io/ahangfa/views.js
 * Base: 5000–1000000 (newer posts → lower base)
 * Full numbers (no K/M). Real hits counted.
 */
(function () {
  "use strict";
  var NS = "nt-v4-";
  var API = "https://countapi.mileshilliard.com/api/v1/";
  var CACHE_TTL = 3600000;
  var VIEWED_PREFIX = "nt-viewed-";

  function hash32(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }

  function seeded01(str) {
    return (hash32(str) >>> 0) / 4294967296;
  }

  function toFa(n) {
    return String(Math.floor(n)).replace(/\d/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹"[d];
    });
  }

  /* ---------- Post base views: newer → lower ---------- */
  function parsePostAgeDays(dateStr) {
    if (!dateStr) return null;
    var s = String(dateStr).replace(/[۰-۹]/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);
    }).replace(/[٠-٩]/g, function (d) {
      return "٠١٢٣٤٥٦٧٨٩".indexOf(d);
    });
    var m = s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (!m) return null;
    var jy = +m[1], jm = +m[2], jd = +m[3];
    var gy = jy + 621;
    var approx = new Date(gy, jm - 1, jd);
    if (isNaN(approx.getTime())) return null;
    var now = new Date();
    var days = Math.floor((now - approx) / 86400000);
    return Math.max(0, days);
  }

  function baseViews(postId, dateStr) {
    var age = parsePostAgeDays(dateStr);
    var h = seeded01(String(postId) + "|nt|salt2026");
    var minB = 5000, maxB = 1000000;
    if (age !== null) {
      var factor = Math.min(1, age / 400);
      var lo = minB + factor * (maxB - minB) * 0.12;
      var hi = minB + factor * (maxB - minB) * 0.5 + (1 - factor) * (maxB - minB) * 0.88;
      if (hi < lo) { var t = lo; lo = hi; hi = t; }
      return Math.floor(lo + h * (hi - lo));
    }
    var idNum = parseInt(String(postId).replace(/\D/g, ""), 10) || 0;
    var idFactor = Math.min(1, idNum / 200000);
    var lo2 = minB + (1 - idFactor) * 20000;
    var hi2 = maxB - idFactor * 600000;
    if (hi2 < lo2) hi2 = lo2 + 50000;
    return Math.floor(lo2 + h * (hi2 - lo2));
  }

  function getCache(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (Date.now() - o.t > CACHE_TTL) return null;
      return o.v;
    } catch (e) { return null; }
  }

  function setCache(key, val) {
    try { localStorage.setItem(key, JSON.stringify({ v: val, t: Date.now() })); } catch (e) {}
  }

  function hasViewed(postId) {
    try { return localStorage.getItem(VIEWED_PREFIX + postId) === "1"; } catch (e) { return false; }
  }

  function markViewed(postId) {
    try { localStorage.setItem(VIEWED_PREFIX + postId, "1"); } catch (e) {}
  }

  function fetchCount(key, hit) {
    var url = API + (hit ? "hit/" : "get/") + encodeURIComponent(key);
    return fetch(url, { method: "GET", mode: "cors", cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { value: 0 }; })
      .then(function (d) { return parseInt(d.value, 10) || 0; })
      .catch(function () { return 0; });
  }

  function renderViews(el, total) {
    var span = el.querySelector(".post-view-count");
    if (span) {
      span.textContent = toFa(total);
      span.setAttribute("title", toFa(total) + " بازدید");
    }
    el.classList.add("is-ready");
  }

  function processCounter(el) {
    if (el.dataset.vcInit === "1") return;
    el.dataset.vcInit = "1";
    var article = el.closest("[data-post-schema]") || el.closest("article");
    var postId = (article && article.getAttribute("data-post-id")) || el.getAttribute("data-post-id") || "";
    var dateStr = (article && article.getAttribute("data-post-date")) || "";
    if (!postId) {
      renderViews(el, baseViews("unknown", ""));
      return;
    }
    var base = baseViews(postId, dateStr);
    var apiKey = NS + postId;
    var isPostPage = document.documentElement.classList.contains("post");
    var cacheKey = "nt-c4-" + postId;
    var cached = getCache(cacheKey);
    if (cached !== null) {
      renderViews(el, base + cached);
      if (isPostPage && !hasViewed(postId)) {
        markViewed(postId);
        fetchCount(apiKey, true).then(function (v) {
          setCache(cacheKey, v);
          renderViews(el, base + v);
        });
      }
      return;
    }
    var doHit = isPostPage && !hasViewed(postId);
    if (doHit) markViewed(postId);
    fetchCount(apiKey, doHit).then(function (v) {
      setCache(cacheKey, v);
      renderViews(el, base + v);
    });
  }

  /* ---------- Daily stable random (Tehran date) ---------- */
  function tehranDateKey() {
    try {
      return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
  }

  function dailyRandom(seed, min, max) {
    var r = seeded01(tehranDateKey() + "|" + seed);
    return Math.floor(min + r * (max - min + 1));
  }

  /* ---------- Live online (1–230) ---------- */
  var onlineBase = null;
  function getOnline() {
    if (onlineBase === null) {
      onlineBase = 1 + Math.floor(seeded01(tehranDateKey() + "|online-base") * 180);
    }
    var wobble = Math.floor(Math.sin(Date.now() / 12000) * 25 + Math.sin(Date.now() / 7000) * 15);
    var n = onlineBase + wobble + Math.floor(Math.random() * 8 - 3);
    return Math.max(1, Math.min(230, n));
  }

  function renderStats() {
    var root = document.getElementById("blog-stats-box");
    if (!root) return;
    var onlineEl = root.querySelector("[data-stat-online]");
    var todayEl = root.querySelector("[data-stat-today]");
    var googleEl = root.querySelector("[data-stat-google]");
    if (onlineEl) onlineEl.textContent = toFa(getOnline());
    if (todayEl) todayEl.textContent = toFa(dailyRandom("blog-today", 6800, 360000));
    if (googleEl) googleEl.textContent = toFa(dailyRandom("google-today", 1700, 247000));
  }

  function startStats() {
    renderStats();
    setInterval(function () {
      var onlineEl = document.querySelector("#blog-stats-box [data-stat-online]");
      if (onlineEl) onlineEl.textContent = toFa(getOnline());
    }, 8000);
  }

  function scan() {
    document.querySelectorAll("[data-view-counter]").forEach(processCounter);
  }

  function init() {
    scan();
    startStats();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  var obs = new MutationObserver(function () { scan(); });
  obs.observe(document.body, { childList: true, subtree: true });
})();
