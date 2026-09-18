/**
 * New Taraneh – Professional Post View Counter
 * Hosted on: https://erfaanzaree-wq.github.io/ahangfa/views.js
 * Base views: deterministic random 5000–1000000 per postId
 * Real increments via countapi.mileshilliard.com (no signup)
 */
(function () {
  "use strict";
  var NS = "nt-v3-";
  var API = "https://countapi.mileshilliard.com/api/v1/";
  var CACHE_TTL = 3600000; // 1 hour
  var VIEWED_PREFIX = "nt-viewed-";

  function hash32(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }

  function baseViews(postId) {
    var h = hash32(String(postId) + "|newtaraneh|salt2026");
    return 5000 + (h % 995001);
  }

  function toFa(n) {
    return String(n).replace(/\d/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹"[d];
    });
  }

  function formatNum(n) {
    n = Math.max(0, Math.floor(n));
    if (n >= 1000000) return toFa((n / 1000000).toFixed(1).replace(/\.0$/, "")) + "M";
    if (n >= 10000) return toFa(Math.floor(n / 1000)) + "K";
    if (n >= 1000) return toFa((n / 1000).toFixed(1).replace(/\.0$/, "")) + "K";
    return toFa(n);
  }

  function getCache(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (Date.now() - o.t > CACHE_TTL) return null;
      return o.v;
    } catch (e) {
      return null;
    }
  }

  function setCache(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify({ v: val, t: Date.now() }));
    } catch (e) {}
  }

  function hasViewed(postId) {
    try {
      return localStorage.getItem(VIEWED_PREFIX + postId) === "1";
    } catch (e) {
      return false;
    }
  }

  function markViewed(postId) {
    try {
      localStorage.setItem(VIEWED_PREFIX + postId, "1");
    } catch (e) {}
  }

  function fetchCount(key, hit) {
    var url = API + (hit ? "hit/" : "get/") + encodeURIComponent(key);
    return fetch(url, { method: "GET", mode: "cors", cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : { value: 0 };
      })
      .then(function (d) {
        return parseInt(d.value, 10) || 0;
      })
      .catch(function () {
        return 0;
      });
  }

  function render(el, total) {
    var span = el.querySelector(".post-view-count");
    if (span) {
      span.textContent = formatNum(total);
      span.setAttribute("title", toFa(total) + " بازدید");
    }
    el.classList.add("is-ready");
  }

  function processCounter(el) {
    if (el.dataset.vcInit === "1") return;
    el.dataset.vcInit = "1";

    var article = el.closest("[data-post-schema]") || el.closest("article");
    var postId = (article && article.getAttribute("data-post-id")) || el.getAttribute("data-post-id") || "";
    if (!postId) {
      render(el, baseViews("unknown"));
      return;
    }

    var base = baseViews(postId);
    var apiKey = NS + postId;
    var isPostPage = document.documentElement.classList.contains("post");
    var cacheKey = "nt-c-" + postId;

    var cached = getCache(cacheKey);
    if (cached !== null) {
      render(el, base + cached);
      if (isPostPage && !hasViewed(postId)) {
        markViewed(postId);
        fetchCount(apiKey, true).then(function (v) {
          setCache(cacheKey, v);
          render(el, base + v);
        });
      }
      return;
    }

    var doHit = isPostPage && !hasViewed(postId);
    if (doHit) markViewed(postId);

    fetchCount(apiKey, doHit).then(function (v) {
      setCache(cacheKey, v);
      render(el, base + v);
    });
  }

  function scan() {
    document.querySelectorAll("[data-view-counter]").forEach(processCounter);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }

  var obs = new MutationObserver(function () {
    scan();
  });
  obs.observe(document.body, { childList: true, subtree: true });
})();
