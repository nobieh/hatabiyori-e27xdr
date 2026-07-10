/* 畑日和 v2 — オフライン用サービスワーカー
   方針: 本体(index.html)はネット優先(更新がすぐ届く)、部品はキャッシュ優先(速い)。 */
var VERSION = "hatabiyori-v2.3.0";
var STATIC = [
  "./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.4/babel.min.js"
];
self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(VERSION)
      .then(function(c){ return c.addAll(STATIC).catch(function(){}); })
      .then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k !== VERSION; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.hostname === "api.open-meteo.com") return; /* 天気は常に最新をとりに行く */
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(function(r){
        var cp = r.clone();
        caches.open(VERSION).then(function(c){ c.put("./index.html", cp); });
        return r;
      }).catch(function(){ return caches.match("./index.html"); })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(r){
        var cp = r.clone();
        caches.open(VERSION).then(function(c){ c.put(req, cp); });
        return r;
      });
    })
  );
});
