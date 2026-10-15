/* Keeps the app itself available offline. Articles always come fresh from Wikipedia.
 * Network first, so edits you publish (new facts, new articles) show up on the next launch. */
var CACHE = 'unredact-v1';
var SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/stemmer.js', 'js/core.js', 'js/articles.js', 'js/facts.js', 'js/app.js',
  'fonts/pt-serif-latin-400-normal.woff2', 'fonts/pt-serif-latin-700-normal.woff2', 'fonts/pt-serif-latin-400-italic.woff2',
  'icons/apple-touch-icon.png', 'icons/icon-192.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match('index.html'); });
  }));
});
