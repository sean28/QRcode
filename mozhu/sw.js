const CACHE_NAME = "mozhu-v1";
const URLS_TO_CACHE = [
  "./",
  "./魔珠.html",
  "./css/style.css",
  "./css/normalize.css",
  "./js/main.js",
  "./js/howler.min.js",
  "./js/vue.min.js",
  "./imgs/mozhu.png",
  "./sound/select.mp3",
  "./sound/bomb.wav",
  "./sound/congratulation.wav",
  "./sound/gameover.wav",
  "./sound/button.wav"
];

// 安装时缓存资源
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

// 拦截请求，优先用缓存
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});