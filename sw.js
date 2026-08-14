/* Trading Assistant — service worker.
   Cache the shell so the app opens without a connection; always try the
   network first for the page itself so a new version lands on next open.
   All alerts route through one notify path later, so the delivery
   mechanism can be swapped for push without touching the app. */

var CACHE = "ta-wpa-v1-5";
var SHELL = ["./", "./index.html"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE) return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e){
  var url = new URL(e.request.url);
  if(e.request.method !== "GET") return;
  if(url.origin !== location.origin) return;   /* never cache API calls */

  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match("./index.html");
      });
    })
  );
});
