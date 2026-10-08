/**
 * New Taraneh – Real Views / Downloads / Stats v3
 * Robust CountAPI + Top badge + device + content counts
 */
(function () {
  "use strict";
  var NS = "ntv7-";
  var API = "https://countapi.mileshilliard.com/api/v1/";
  var CACHE_TTL = 900000;
  var VIEWED = "ntv7s-";
  var DLFLAG = "ntv7d-";
  var ready = false;

  function fa(n) {
    n = Math.floor(Math.max(0, Number(n) || 0));
    return String(n).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; });
  }

  function tehran(offset) {
    offset = offset || 0;
    try {
      return new Date(Date.now() + offset * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
    } catch (e) {
      var d = new Date(Date.now() + offset * 864e5);
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
  }

  function monthKey() { return tehran(0).slice(0, 7); }
  function yearKey() { return tehran(0).slice(0, 4); }

  function cacheGet(k) {
    try {
      var o = JSON.parse(localStorage.getItem(k) || "null");
      if (!o || Date.now() - o.t > CACHE_TTL) return null;
      return o.v;
    } catch (e) { return null; }
  }
  function cacheSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }
  function flagged(p, id) {
    try { return localStorage.getItem(p + id) === "1"; } catch (e) { return false; }
  }
  function flag(p, id) {
    try { localStorage.setItem(p + id, "1"); } catch (e) {}
  }

  function api(key, hit) {
    var url = API + (hit ? "hit/" : "get/") + encodeURIComponent(key);
    return fetch(url, { method: "GET", mode: "cors", cache: "no-store", credentials: "omit" })
      .then(function (r) {
        return r.json().then(function (d) {
          if (d && typeof d.value === "number") return d.value;
          return 0;
        }).catch(function () { return 0; });
      })
      .catch(function () { return 0; });
  }

  function device() {
    var ua = (navigator.userAgent || "").toLowerCase();
    var pl = (navigator.platform || "").toLowerCase();
    var touch = (navigator.maxTouchPoints || 0) > 1 || "ontouchstart" in window;
    var w = Math.min(screen.width || 9999, screen.height || 9999);
    if (/smart-tv|smarttv|googletv|appletv|hbbtv|webos|tizen|bravia|aftb|aftt|roku|firetv|crkey|netcast|viera/.test(ua))
      return { t: "tv", l: "تلویزیون", i: "📺" };
    if (/iphone|ipod/.test(ua) || (pl === "macintel" && touch))
      return { t: "ios", l: "آیفون", i: "📱" };
    if (/ipad/.test(ua)) return { t: "ios", l: "آیپد", i: "📱" };
    if (/android/.test(ua))
      return w < 600 || /mobile/.test(ua)
        ? { t: "android", l: "اندروید", i: "📱" }
        : { t: "android", l: "تبلت", i: "📱" };
    if (/win|mac|linux|cros|x11/.test(ua + pl) && !touch)
      return { t: "desktop", l: "کامپیوتر", i: "💻" };
    if (touch || w < 768) return { t: "mobile", l: "موبایل", i: "📱" };
    return { t: "desktop", l: "کامپیوتر", i: "💻" };
  }

  function setView(el, n) {
    var s = el.querySelector(".post-view-count");
    if (s) {
      s.textContent = fa(n);
      s.title = fa(n) + " بازدید";
    }
    el.classList.add("is-ready");
    el.dataset.views = String(n);
  }

  function processView(el) {
    if (el.dataset.vcInit === "1") return;
    el.dataset.vcInit = "1";
    var art = el.closest("[data-post-schema]") || el.closest("article");
    var id = (art && art.getAttribute("data-post-id")) || el.getAttribute("data-post-id") || "";
    if (!id) { setView(el, 0); return; }
    var key = NS + "v-" + id;
    var ck = "ntv7c-" + id;
    var isPost = document.documentElement.classList.contains("post");
    var cached = cacheGet(ck);

    function done(v) {
      cacheSet(ck, v);
      setView(el, v);
      if (art) art.dataset.views = String(v);
    }

    if (cached !== null) {
      done(cached);
      if (isPost && !flagged(VIEWED, id)) {
        flag(VIEWED, id);
        api(key, true).then(done);
      }
      return;
    }
    var hit = isPost && !flagged(VIEWED, id);
    if (hit) flag(VIEWED, id);
    api(key, hit).then(done);
  }

  function scanViews() {
    document.querySelectorAll("[data-view-counter]").forEach(processView);
  }

  function trackDl(a) {
    if (!a || a.dataset.dlTracked === "1") return;
    var href = a.getAttribute("href") || "";
    if (!href || href === "#") return;
    var part = "";
    try { part = new URL(href, location.href).pathname.split("/").pop() || ""; } catch (e) { part = href.slice(-32); }
    part = part.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 48);
    if (!part) return;
    var art = a.closest("[data-post-schema]") || a.closest("article") || a.closest(".mc");
    var pid = (art && art.getAttribute("data-post-id")) || "";
    var key = NS + "dl-" + (pid || part).slice(0, 40);
    if (flagged(DLFLAG, key)) return;
    flag(DLFLAG, key);
    a.dataset.dlTracked = "1";
    api(key, true);
  }

  function countContent() {
    var songs = 0, videos = 0, articles = 0;
    document.querySelectorAll(".mc").forEach(function (c) {
      if (c.classList.contains("mv")) videos++;
      else songs++;
    });
    document.querySelectorAll("article.post-card").forEach(function (a) {
      var hasMedia = a.querySelector("audio,[data-ez-player],video,iframe[src*='aparat'],iframe[src*='youtube'],iframe[src*='youtu']");
      if (!hasMedia && !a.querySelector(".mc")) articles++;
    });
    var recent = document.querySelectorAll("#recent-posts-list li").length;
    return { songs: songs, videos: videos, articles: articles, recent: recent };
  }

  function setText(root, sel, val) {
    var el = root.querySelector(sel);
    if (!el) return;
    el.textContent = typeof val === "number" ? fa(val) : (val || "—");
  }

  function renderStats(data, content) {
    var root = document.getElementById("blog-stats-box");
    if (!root) return;
    setText(root, "[data-stat-today]", data.today);
    setText(root, "[data-stat-yesterday]", data.yesterday);
    setText(root, "[data-stat-month]", data.month);
    setText(root, "[data-stat-year]", data.year);
    setText(root, "[data-stat-device]", data.device.l);
    setText(root, "[data-stat-songs]", content.songs);
    setText(root, "[data-stat-videos]", content.videos);
    setText(root, "[data-stat-articles]", content.articles > 0 ? content.articles : content.recent);
    var ic = root.querySelector("[data-stat-device-icon]");
    if (ic) ic.textContent = data.device.i;
    root.classList.add("is-ready");
    ready = true;
  }

  function loadGlobal(hit) {
    var dev = device();
    return Promise.all([
      api(NS + "day-" + tehran(0), hit),
      api(NS + "day-" + tehran(-1), false),
      api(NS + "mon-" + monthKey(), hit),
      api(NS + "yr-" + yearKey(), hit),
      api(NS + "dev-" + dev.t, hit)
    ]).then(function (v) {
      return { today: v[0], yesterday: v[1], month: v[2], year: v[3], device: dev };
    });
  }

  function addTopBadge(el, label) {
    if (!el || el.querySelector(".top-badge")) return;
    var b = document.createElement("span");
    b.className = "top-badge";
    b.textContent = label || "محبوب";
    b.setAttribute("title", "بیشترین بازدید");
    var host = el.querySelector(".mc-i") || el.querySelector(".post-title") || el;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.appendChild(b);
    el.classList.add("is-top");
  }

  function markTopItems() {
    var items = [];
    document.querySelectorAll("[data-post-schema]").forEach(function (art) {
      var id = art.getAttribute("data-post-id");
      if (!id) return;
      var v = parseInt(art.dataset.views || "0", 10);
      var ck = cacheGet("ntv7c-" + id);
      if (ck !== null) v = ck;
      items.push({ el: art, id: id, views: v || 0 });
    });
    document.querySelectorAll(".mc").forEach(function (mc) {
      var title = mc.getAttribute("data-post-title") || "";
      var art = null;
      document.querySelectorAll("[data-post-schema]").forEach(function (a) {
        if (a.getAttribute("data-post-title") === title) art = a;
      });
      if (art && art.dataset.views) {
        items.push({ el: mc, id: art.getAttribute("data-post-id"), views: parseInt(art.dataset.views, 10) || 0, isCard: true });
      }
    });
    if (!items.length) return;
    var need = items.filter(function (x) { return !x.views; }).slice(0, 12);
    var fetches = need.map(function (x) {
      return api(NS + "v-" + x.id, false).then(function (v) {
        x.views = v;
        cacheSet("ntv7c-" + x.id, v);
        var art = document.querySelector('[data-post-schema][data-post-id="' + x.id + '"]');
        if (art) art.dataset.views = String(v);
      });
    });
    Promise.all(fetches).then(function () {
      var max = 0, top = null;
      items.forEach(function (x) {
        if (x.views > max) { max = x.views; top = x; }
      });
      if (top && max > 0) {
        addTopBadge(top.el, "محبوب");
        if (!top.isCard) {
          var title = top.el.getAttribute("data-post-title");
          document.querySelectorAll(".mc").forEach(function (mc) {
            if (mc.getAttribute("data-post-title") === title) addTopBadge(mc, "TOP");
          });
        }
      }
    });
  }

  function refreshContentStats() {
    var root = document.getElementById("blog-stats-box");
    if (!root || !ready) return;
    var c = countContent();
    setText(root, "[data-stat-songs]", c.songs);
    setText(root, "[data-stat-videos]", c.videos);
    setText(root, "[data-stat-articles]", c.articles > 0 ? c.articles : c.recent);
  }

  function init() {
    var hit = false;
    try {
      if (!sessionStorage.getItem("ntv7-hit")) {
        sessionStorage.setItem("ntv7-hit", "1");
        hit = true;
      }
    } catch (e) { hit = true; }

    scanViews();

    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[download],.mc-d,.music-download-btn,.post-video-download,[data-download]");
      if (a) trackDl(a);
    }, true);

    var content = countContent();
    loadGlobal(hit).then(function (data) {
      renderStats(data, content);
      setTimeout(refreshContentStats, 800);
      setTimeout(refreshContentStats, 2000);
      setTimeout(markTopItems, 1200);
      setTimeout(markTopItems, 3000);
    }).catch(function () {
      renderStats({ today: 0, yesterday: 0, month: 0, year: 0, device: device() }, content);
    });

    var t1, t2;
    new MutationObserver(function () {
      clearTimeout(t1);
      t1 = setTimeout(function () {
        scanViews();
        refreshContentStats();
      }, 400);
      clearTimeout(t2);
      t2 = setTimeout(markTopItems, 1500);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
