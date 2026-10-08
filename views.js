/**
 * New Taraneh – Real Views + Downloads + Advanced Stats v2
 * Uses CountAPI (real increments). Device detection + content counts.
 * https://erfaanzaree-wq.github.io/ahangfa/views.js
 */
(function () {
  "use strict";
  var NS = "ntv6-";
  var API = "https://countapi.mileshilliard.com/api/v1/";
  var CACHE_TTL = 1800000;
  var VIEWED_PREFIX = "ntv6-seen-";
  var DL_PREFIX = "ntv6-dl-";

  function toFa(n) {
    return String(Math.floor(Math.max(0, n))).replace(/\d/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹"[d];
    });
  }

  function tehranDateKey(offsetDays) {
    offsetDays = offsetDays || 0;
    try {
      var d = new Date(Date.now() + offsetDays * 86400000);
      return d.toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
    } catch (e) {
      var d2 = new Date(Date.now() + offsetDays * 86400000);
      return d2.getFullYear() + "-" + String(d2.getMonth() + 1).padStart(2, "0") + "-" + String(d2.getDate()).padStart(2, "0");
    }
  }

  function tehranMonthKey() {
    try {
      var p = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" }).split("-");
      return p[0] + "-" + p[1];
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    }
  }

  function tehranYearKey() {
    try {
      return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" }).slice(0, 4);
    } catch (e) {
      return String(new Date().getFullYear());
    }
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

  function hasFlag(prefix, id) {
    try { return localStorage.getItem(prefix + id) === "1"; } catch (e) { return false; }
  }

  function setFlag(prefix, id) {
    try { localStorage.setItem(prefix + id, "1"); } catch (e) {}
  }

  function fetchCount(key, hit) {
    var url = API + (hit ? "hit/" : "get/") + encodeURIComponent(key);
    return fetch(url, { method: "GET", mode: "cors", cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { value: 0 }; })
      .then(function (d) { return parseInt(d.value, 10) || 0; })
      .catch(function () { return 0; });
  }

  function detectDevice() {
    var ua = (navigator.userAgent || "").toLowerCase();
    var platform = (navigator.platform || "").toLowerCase();
    var touch = navigator.maxTouchPoints > 1 || "ontouchstart" in window;
    var w = Math.min(screen.width || 0, screen.height || 0);

    if (/smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast|viera|webos|tizen|bravia|aftb|aftt|aftm|shield|roku|firetv|crkey/.test(ua) ||
        (w >= 1280 && !touch && /tv|android/.test(ua))) {
      return { type: "tv", label: "تلویزیون", icon: "📺" };
    }
    if (/iphone|ipod/.test(ua) || (platform === "macintel" && touch)) {
      return { type: "ios", label: "آیفون", icon: "📱" };
    }
    if (/ipad/.test(ua)) {
      return { type: "ios", label: "آیپد", icon: "📱" };
    }
    if (/android/.test(ua)) {
      if (w < 600 || /mobile/.test(ua)) return { type: "android", label: "اندروید", icon: "📱" };
      return { type: "android", label: "تبلت اندروید", icon: "📱" };
    }
    if (/win|mac|linux|cros|x11/.test(ua + platform) && !touch) {
      return { type: "desktop", label: "کامپیوتر", icon: "💻" };
    }
    if (touch || w < 768) return { type: "mobile", label: "موبایل", icon: "📱" };
    return { type: "desktop", label: "کامپیوتر", icon: "💻" };
  }

  function renderViews(el, total) {
    var span = el.querySelector(".post-view-count");
    if (span) {
      span.textContent = toFa(total);
      span.setAttribute("title", toFa(total) + " بازدید");
    }
    el.classList.add("is-ready");
  }

  function processViewCounter(el) {
    if (el.dataset.vcInit === "1") return;
    el.dataset.vcInit = "1";
    var article = el.closest("[data-post-schema]") || el.closest("article");
    var postId = (article && article.getAttribute("data-post-id")) || el.getAttribute("data-post-id") || "";
    if (!postId) {
      renderViews(el, 0);
      return;
    }
    var apiKey = NS + "v-" + postId;
    var cacheKey = "ntv6-c-" + postId;
    var isPostPage = document.documentElement.classList.contains("post");
    var cached = getCache(cacheKey);

    if (cached !== null) {
      renderViews(el, cached);
      if (isPostPage && !hasFlag(VIEWED_PREFIX, postId)) {
        setFlag(VIEWED_PREFIX, postId);
        fetchCount(apiKey, true).then(function (v) {
          setCache(cacheKey, v);
          renderViews(el, v);
        });
      }
      return;
    }

    var doHit = isPostPage && !hasFlag(VIEWED_PREFIX, postId);
    if (doHit) setFlag(VIEWED_PREFIX, postId);
    fetchCount(apiKey, doHit).then(function (v) {
      setCache(cacheKey, v);
      renderViews(el, v);
    });
  }

  function trackDownload(btn) {
    var href = btn.getAttribute("href") || "";
    if (!href || href === "#" || btn.dataset.dlTracked === "1") return;
    var key = "";
    try {
      var u = new URL(href, location.href);
      key = u.pathname.split("/").pop() || u.href;
    } catch (e) {
      key = href.slice(-40);
    }
    key = key.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 60);
    if (!key) return;

    var article = btn.closest("[data-post-schema]") || btn.closest("article") || btn.closest(".mc");
    var postId = (article && (article.getAttribute("data-post-id") || (article._o && article._o.u))) || "";
    var apiKey = NS + "d-" + (postId || key).slice(0, 40);

    if (hasFlag(DL_PREFIX, apiKey)) return;
    setFlag(DL_PREFIX, apiKey);
    btn.dataset.dlTracked = "1";

    fetchCount(apiKey, true).then(function (v) {
      var badge = btn.querySelector("[data-dl-count]") || btn.parentElement && btn.parentElement.querySelector("[data-dl-count]");
      if (badge) badge.textContent = toFa(v);
    });
  }

  function bindDownloadTracking() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[download], .mc-d, .music-download-btn, .post-video-download, [data-download]");
      if (a) trackDownload(a);
    }, true);
  }

  function countContent() {
    var songs = 0, videos = 0, articles = 0;
    document.querySelectorAll(".mc").forEach(function (c) {
      if (c.classList.contains("mv")) videos++;
      else songs++;
    });
    document.querySelectorAll("article.post-card").forEach(function (a) {
      if (!a.querySelector("audio, [data-ez-player], video, iframe[src*='aparat'], iframe[src*='youtube']")) {
        articles++;
      }
    });
    var recent = document.querySelectorAll("#recent-posts-list li").length;
    return { songs: songs, videos: videos, articles: articles, recent: recent };
  }

  function updateGlobalStats(hitToday) {
    var todayKey = NS + "day-" + tehranDateKey(0);
    var ydayKey = NS + "day-" + tehranDateKey(-1);
    var monthKey = NS + "mon-" + tehranMonthKey();
    var yearKey = NS + "yr-" + tehranYearKey();
    var device = detectDevice();
    var deviceKey = NS + "dev-" + device.type;

    return Promise.all([
      fetchCount(todayKey, !!hitToday),
      fetchCount(ydayKey, false),
      fetchCount(monthKey, !!hitToday),
      fetchCount(yearKey, !!hitToday),
      fetchCount(deviceKey, !!hitToday)
    ]).then(function (vals) {
      return {
        today: vals[0],
        yesterday: vals[1],
        month: vals[2],
        year: vals[3],
        deviceHits: vals[4],
        device: device
      };
    });
  }

  function renderStatsBox(data, content) {
    var root = document.getElementById("blog-stats-box");
    if (!root) return;

    function set(sel, val) {
      var el = root.querySelector(sel);
      if (el) el.textContent = typeof val === "number" ? toFa(val) : val;
    }

    set("[data-stat-today]", data.today);
    set("[data-stat-yesterday]", data.yesterday);
    set("[data-stat-month]", data.month);
    set("[data-stat-year]", data.year);
    set("[data-stat-device]", data.device.label);
    set("[data-stat-songs]", content.songs);
    set("[data-stat-videos]", content.videos);
    set("[data-stat-articles]", content.articles || content.recent);

    var devIcon = root.querySelector("[data-stat-device-icon]");
    if (devIcon) devIcon.textContent = data.device.icon;

    root.classList.add("is-ready");
  }

  function scanViews() {
    document.querySelectorAll("[data-view-counter]").forEach(processViewCounter);
  }

  function init() {
    var sessionHit = false;
    try {
      if (!sessionStorage.getItem("ntv6-visit")) {
        sessionStorage.setItem("ntv6-visit", "1");
        sessionHit = true;
      }
    } catch (e) {
      sessionHit = true;
    }

    scanViews();
    bindDownloadTracking();

    var content = countContent();
    updateGlobalStats(sessionHit).then(function (data) {
      renderStatsBox(data, content);
    });

    var obs = new MutationObserver(function () { scanViews(); });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
