// APP SERVICE WORKER
const version = "1.0.0";
const cacheName = `mp3PlayerPWA-${version}`;

if('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('/sw.js')
             .then(function() { console.log("SW: Service Worker Registered"); });
            }

//importScripts('/controller.js');

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', function(e) {
    e.waitUntil(
      caches.open(cacheName).then(function(cache) {
        return cache.addAll([
          '/',
          '/player.html',
          '/style.css',
          '/controller.js',
          '/img/central_512px.png',
          '/manifest.json',
        ]);
      })
    );
   });

self.addEventListener('fetch', event => {
event.respondWith(
    caches.open(cacheName)
    .then(cache => cache.match(event.request, {ignoreSearch: true}))
    .then(response => {
    return response || fetch(event.request);
    })
);
});

