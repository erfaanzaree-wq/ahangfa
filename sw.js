/* New Taraneh notification service worker */
self.addEventListener("install", function (e) {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
  var data = { title: "نیو ترانه", body: "آهنگ جدید منتشر شد", url: "https://newtaraneh.blogfa.com/" };
  try {
    if (event.data) {
      var j = event.data.json();
      if (j.title) data.title = j.title;
      if (j.body) data.body = j.body;
      if (j.url) data.url = j.url;
    }
  } catch (err) {
    try {
      var t = event.data && event.data.text();
      if (t) data.body = t;
    } catch (e2) {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "https://newtaraneh.blogfa.com/",
      badge: "https://newtaraneh.blogfa.com/",
      dir: "rtl",
      lang: "fa",
      data: { url: data.url },
      tag: "nt-song",
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "https://newtaraneh.blogfa.com/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf("newtaraneh") > -1 && "focus" in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
