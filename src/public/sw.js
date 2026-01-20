const CACHE_NAME = 'oolale-cache-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/user-login.html',
    '/user-register.html',
    '/user-dashboard.html',
    '/css/landing.css',
    '/css/oolale-theme.css',
    '/js/user-dashboard.js',
    '/assets/icons/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Cache hit - return response
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});

// Activate Event - Nuke ALL caches to force update
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            console.log('All caches deleted. Claiming clients...');
            return self.clients.claim();
        })
    );
});
