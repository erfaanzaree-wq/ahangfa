/**
 * New Taraneh Stats v4 – fast cache-first, global content counts, reliable post views
 */
(function () {
  "use strict";
  var NS = "nt8-";
  var API = "https://countapi.mileshilliard.com/api/v1/";
  var TTL = 6e5;

  function fa(n) {
    return String(Math.floor(Math.max(0, +n || 0))).replace(/\d/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹"[d];
    });
  }

  function tehran(off) {
    off = off || 0;
    try {
      return new Date(Date.now() + off * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
    } catch (e) {
      var d = new Date(Date.now() + off * 864e5);
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
  }

  function lsGet(k) {
    try {
      var o = JSON.parse(localStorage.getItem(k) || "null");
      return o && Date.now() - o.t < TTL ? o.v : null;
    } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }
  function once(k) {
    try {
      if (sessionStorage.getItem(k)) return false;
      sessionStorage.setItem(k, "1");
      return true;
    } catch (e) { return true; }
  }

  function api(key, hit) {
    return fetch(API + (hit ? "hit/" : "get/") + encodeURIComponent(key), {
      method: "GET", mode: "cors", cache: "no-store", credentials: "omit"
    }).then(function (r) {
      return r.json().then(function (d) {
        return d && typeof d.value === "number" ? d.value : 0;
      }).catch(function () { return 0; });
    }).catch(function () { return 0; });
  }

  function isPostPage() {
    if (document.documentElement.classList.contains("post")) return true;
    if (document.querySelectorAll("[data-post-schema]").length === 1) return true;
    if (document.querySelector(".comments-block,.share-block,.post-author-box")) return true;
    var p = location.pathname || "";
    if (/\/post\//i.test(p)) return true;
    if (document.querySelector("article[data-post-id]") && !document.querySelector(".mg")) {
      var arts = document.querySelectorAll("article.post-card,article[data-post-schema]");
      if (arts.length === 1) return true;
    }
    return false;
  }

  function device() {
    var ua = (navigator.userAgent || "").toLowerCase();
    var touch = (navigator.maxTouchPoints || 0) > 1 || "ontouchstart" in window;
    var w = Math.min(screen.width || 9999, screen.height || 9999);
    if (/smart-tv|smarttv|googletv|appletv|webos|tizen|bravia|roku|firetv|crkey/.test(ua))
      return { t: "tv", l: "تلویزیون", i: "📺" };
    if (/iphone|ipod/.test(ua) || (/mac/.test(ua) && touch))
      return { t: "ios", l: "آیفون", i: "📱" };
    if (/ipad/.test(ua)) return { t: "ios", l: "آیپد", i: "📱" };
    if (/android/.test(ua))
      return (w < 600 || /mobile/.test(ua)) ? { t: "android", l: "اندروید", i: "📱" } : { t: "android", l: "تبلت", i: "📱" };
    if (!touch && w >= 768) return { t: "desktop", l: "کامپیوتر", i: "💻" };
    return { t: "mobile", l: "موبایل", i: "📱" };
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function setEl(sel, val, root) {
    var el = $(sel, root);
    if (el) el.textContent = typeof val === "number" ? fa(val) : val;
  }

  function processView(el) {
    if (el.dataset.vcInit === "1") return;
    el.dataset.vcInit = "1";
    var art = el.closest("[data-post-schema]") || el.closest("article");
    var id = el.getAttribute("data-post-id") || (art && art.getAttribute("data-post-id")) || "";
    if (!id && isPostPage()) {
      id = (location.pathname || "").replace(/\W+/g, "_").slice(0, 40);
    }
    if (!id) {
      setEl(".post-view-count", 0, el);
      el.classList.add("is-ready");
      return;
    }
    var key = NS + "v-" + id;
    var ck = "nt8c-" + id;
    var cached = lsGet(ck);
    var span = $(".post-view-count", el);

    if (cached !== null && span) {
      span.textContent = fa(cached);
      el.classList.add("is-ready");
      if (art) art.dataset.views = String(cached);
    }

    var shouldHit = isPostPage() && once("nt8seen-" + id);
    api(key, shouldHit).then(function (v) {
      lsSet(ck, v);
      if (span) span.textContent = fa(v);
      el.classList.add("is-ready");
      if (art) art.dataset.views = String(v);
    });
  }

  function scanViews() {
    $$("[data-view-counter]").forEach(processView);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[download],.mc-d,.music-download-btn,.post-video-download,[data-download]");
    if (!a || a.dataset.dlOk) return;
    var href = a.getAttribute("href") || "";
    if (!href || href === "#") return;
    var part = "";
    try { part = new URL(href, location.href).pathname.split("/").pop() || ""; } catch (err) { part = href.slice(-24); }
    part = part.replace(/[^\w.-]/g, "").slice(0, 40);
    if (!part) return;
    var art = a.closest("[data-post-schema],article,.mc");
    var pid = art && art.getAttribute("data-post-id");
    var key = NS + "dl-" + (pid || part);
    if (!once("nt8dl-" + key)) return;
    a.dataset.dlOk = "1";
    api(key, true);
  }, true);

  function localContentCount() {
    var songs = 0, videos = 0, articles = 0;
    $$(".mc").forEach(function (c) {
      if (c.classList.contains("mv")) videos++;
      else songs++;
    });
    $$("article.post-card,article[data-post-schema]").forEach(function (a) {
      if (a.closest(".mg")) return;
      var hasVid = a.querySelector("video,iframe[src*='aparat'],iframe[src*='youtube'],iframe[src*='youtu']");
      var hasAud = a.querySelector("audio,[data-ez-player]");
      if (hasVid) videos++;
      else if (hasAud) songs++;
      else articles++;
    });
    if (songs + videos < 3) {
      var rs = 0, rv = 0, ra = 0;
      $$("#recent-posts-list li a, #recent-posts-list li").forEach(function (el) {
        var t = (el.textContent || "").toLowerCase();
        if (/موزیک\s*ویدیو|music\s*video|ویدیو|کلیپ|mv\b/.test(t)) rv++;
        else if (/دانلود\s*آهنگ|آهنگ|هنگ\s|track|mp3/.test(t)) rs++;
        else ra++;
      });
      if (rs + rv + ra > songs + videos + articles) {
        songs = Math.max(songs, rs);
        videos = Math.max(videos, rv);
        articles = Math.max(articles, ra);
      }
    }
    return { songs: songs, videos: videos, articles: articles, recent: $$("#recent-posts-list li").length };
  }

  function updateStoredContent(c) {
    if (c.songs > 0) lsSet("nt8-songs", c.songs);
    if (c.videos > 0) lsSet("nt8-videos", c.videos);
    if (c.articles > 0 || c.recent > 0) lsSet("nt8-articles", c.articles || c.recent);
  }

  function getContentCounts() {
    var local = localContentCount();
    var ps = lsGet("nt8-songs") || 0;
    var pv = lsGet("nt8-videos") || 0;
    var pa = lsGet("nt8-articles") || 0;
    var songs = Math.max(local.songs, ps);
    var videos = Math.max(local.videos, pv);
    var articles = Math.max(local.articles || local.recent || 0, pa);
    if (local.songs > 0) lsSet("nt8-songs", local.songs);
    if (local.videos > 0) lsSet("nt8-videos", local.videos);
    if ((local.articles || local.recent) > 0) lsSet("nt8-articles", local.articles || local.recent);
    return { songs: songs, videos: videos, articles: articles };
  }

  function renderStats(data, content) {
    var root = $("#blog-stats-box");
    if (!root) return;
    setEl("[data-stat-today]", data.today, root);
    setEl("[data-stat-yesterday]", data.yesterday, root);
    setEl("[data-stat-month]", data.month, root);
    setEl("[data-stat-year]", data.year, root);
    setEl("[data-stat-device]", data.device.l, root);
    setEl("[data-stat-songs]", content.songs, root);
    setEl("[data-stat-videos]", content.videos, root);
    setEl("[data-stat-articles]", content.articles, root);
    var ic = $("[data-stat-device-icon]", root);
    if (ic) ic.textContent = data.device.i;
    root.classList.add("is-ready");
  }

  function loadStats() {
    var root = $("#blog-stats-box");
    if (!root) return;
    var dev = device();
    var content = getContentCounts();
    var cached = {
      today: lsGet("nt8-st-today"),
      yesterday: lsGet("nt8-st-yday"),
      month: lsGet("nt8-st-month"),
      year: lsGet("nt8-st-year")
    };
    if (cached.today !== null || cached.month !== null) {
      renderStats({
        today: cached.today || 0,
        yesterday: cached.yesterday || 0,
        month: cached.month || 0,
        year: cached.year || 0,
        device: dev
      }, content);
    } else {
      renderStats({ today: 0, yesterday: 0, month: 0, year: 0, device: dev }, content);
    }
    var hit = once("nt8-site-hit");
    Promise.all([
      api(NS + "d-" + tehran(0), hit),
      api(NS + "d-" + tehran(-1), false),
      api(NS + "m-" + tehran(0).slice(0, 7), hit),
      api(NS + "y-" + tehran(0).slice(0, 4), hit)
    ]).then(function (v) {
      lsSet("nt8-st-today", v[0]);
      lsSet("nt8-st-yday", v[1]);
      lsSet("nt8-st-month", v[2]);
      lsSet("nt8-st-year", v[3]);
      content = getContentCounts();
      renderStats({ today: v[0], yesterday: v[1], month: v[2], year: v[3], device: dev }, content);
    });
  }

  function markTop() {
    var best = null, max = 0;
    $$("[data-post-schema]").forEach(function (art) {
      var id = art.getAttribute("data-post-id");
      if (!id) return;
      var v = parseInt(art.dataset.views || lsGet("nt8c-" + id) || "0", 10) || 0;
      if (v > max) { max = v; best = art; }
    });
    if (!best || max < 1) return;
    if (best.querySelector(".top-badge")) return;
    var host = best.querySelector(".mc-i") || best.querySelector(".post-title") || best;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    var b = document.createElement("span");
    b.className = "top-badge";
    b.textContent = "محبوب";
    b.title = "بیشترین بازدید";
    host.appendChild(b);
    best.classList.add("is-top");
    var title = best.getAttribute("data-post-title");
    if (title) {
      $$(".mc").forEach(function (mc) {
        if (mc.getAttribute("data-post-title") === title && !mc.querySelector(".top-badge")) {
          var h = mc.querySelector(".mc-i") || mc;
          if (getComputedStyle(h).position === "static") h.style.position = "relative";
          var bb = document.createElement("span");
          bb.className = "top-badge";
          bb.textContent = "TOP";
          h.appendChild(bb);
          mc.classList.add("is-top");
        }
      });
    }
  }

  function init() {
    scanViews();
    loadStats();
    setTimeout(function () {
      var c = getContentCounts();
      var root = $("#blog-stats-box");
      if (root) {
        setEl("[data-stat-songs]", c.songs, root);
        setEl("[data-stat-videos]", c.videos, root);
        setEl("[data-stat-articles]", c.articles, root);
      }
    }, 600);
    setTimeout(function () {
      var c = getContentCounts();
      var root = $("#blog-stats-box");
      if (root) {
        setEl("[data-stat-songs]", c.songs, root);
        setEl("[data-stat-videos]", c.videos, root);
        setEl("[data-stat-articles]", c.articles, root);
      }
      markTop();
    }, 1800);
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(function () {
        scanViews();
        var c = getContentCounts();
        var root = $("#blog-stats-box");
        if (root && root.classList.contains("is-ready")) {
          setEl("[data-stat-songs]", c.songs, root);
          setEl("[data-stat-videos]", c.videos, root);
          setEl("[data-stat-articles]", c.articles, root);
        }
      }, 300);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
