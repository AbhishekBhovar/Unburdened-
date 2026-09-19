const CACHE="unburdened-v44-fit";
const FILES=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./assets/icon-192.png","./assets/icon-512.png","./assets/more-screen-journey.jpg","./assets/startup-journey.jpg"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
self.addEventListener("fetch",e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));
