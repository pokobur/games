/* ==========================================================
   sw.js - ぐらぐら どうぶつタワー Service Worker (PWA)
   ========================================================== */
const CACHE_NAME = 'animal-tower-v1';

const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './style.css',
    './favicon.svg',
    './icon-192.png',
    './icon-512.png',
    './apple-touch-icon.png',
    './js/matter.min.js',
    './js/crayon.js',
    './js/animals.js',
    './js/background.js',
    './js/share.js',
    './js/storage.js',
    './js/audio.js',
    './js/game.js',
];

// Install: コアアセットの事前キャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Precache partial error:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: 古いキャッシュのクリーンアップ
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: オフライン対応 & キャッシュ戦略
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // http/https のみ対象 (chrome-extension等は無視)
    if (!url.protocol.startsWith('http')) return;

    // 1. ページ遷移 (HTML): Network First、失敗時はキャッシュ
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match('./index.html') || caches.match(event.request);
                })
        );
        return;
    }

    // 2. 静的アセット: Stale-While-Revalidate (キャッシュを即座に返しつつバックグラウンドで最新取得)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, copy);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});
