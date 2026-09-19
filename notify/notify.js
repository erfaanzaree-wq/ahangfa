(function () {
  var TOPIC = "newtaraneh-songs";
  var statusEl = document.getElementById("status");
  var btn = document.getElementById("btn-enable");

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "status" + (type ? " " + type : "");
  }

  function toFa(s) {
    return String(s).replace(/\d/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹"[d];
    });
  }

  if (!("Notification" in window)) {
    setStatus("مرورگر شما از اعلان پشتیبانی نمی‌کند.", "err");
    if (btn) btn.disabled = true;
    return;
  }

  if (Notification.permission === "granted") {
    setStatus("اعلان‌ها از قبل فعال هستند ✓", "ok");
    if (btn) btn.textContent = "اعلان فعال است";
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return Promise.resolve(null);
    return navigator.serviceWorker.register("../sw.js", { scope: "/ahangfa/" }).catch(function () {
      return navigator.serviceWorker.register("/ahangfa/sw.js").catch(function () {
        return null;
      });
    });
  }

  function showLocalTest() {
    try {
      var n = new Notification("نیو ترانه", {
        body: "اعلان با موفقیت فعال شد. آهنگ‌های جدید را اینجا می‌بینید.",
        icon: "https://newtaraneh.blogfa.com/",
        tag: "nt-welcome",
        dir: "rtl",
        lang: "fa"
      });
      n.onclick = function () {
        window.open("https://newtaraneh.blogfa.com/", "_blank");
        n.close();
      };
    } catch (e) {}
  }

  // Subscribe hint via ntfy (optional web subscribe page)
  function openNtfy() {
    window.open("https://ntfy.sh/" + TOPIC, "_blank", "noopener");
  }

  if (btn) {
    btn.addEventListener("click", function () {
      btn.disabled = true;
      setStatus("در حال درخواست مجوز...");
      Notification.requestPermission().then(function (perm) {
        if (perm === "granted") {
          localStorage.setItem("nt-notify-enabled", "1");
          localStorage.setItem("nt-notify-topic", TOPIC);
          setStatus("اعلان فعال شد ✓", "ok");
          btn.textContent = "اعلان فعال است";
          registerSW().then(function () {
            showLocalTest();
          });
          // Remind user about mobile ntfy for background push
          setTimeout(function () {
            setStatus("برای نوتیف حتی وقتی سایت بسته است، از دکمه ntfy استفاده کنید.", "ok");
          }, 2500);
        } else if (perm === "denied") {
          setStatus("مجوز اعلان رد شد. از تنظیمات مرورگر فعال کنید.", "err");
          btn.disabled = false;
        } else {
          setStatus("مجوز داده نشد.", "err");
          btn.disabled = false;
        }
      });
    });
  }

  registerSW();
})();
