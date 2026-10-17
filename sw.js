// ==============================================================================
// SERVICE WORKER - SỔ TAY HỌC ĐƯỜNG PWA (TỐI ƯU TẢI NHANH TRÊN DI ĐỘNG & OFFLINE)
// ==============================================================================

const CACHE_NAME = 'so-tay-hoc-duong-v7';

// 1. Chỉ nạp trước các tệp cốt lõi SIÊU NHẸ để cài đặt ngay lập tức (<0.2s), không làm nghẽn mạng di động
const ESSENTIAL_PRECACHE = [
    './',
    './index.html',
    './manifest.json',
    './favicon.png',
    './apple-touch-icon.png',
    './icon-192.png'
];

// CÀI ĐẶT (INSTALL): Nạp nhanh tệp nhẹ
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ESSENTIAL_PRECACHE);
        }).catch((err) => {
            console.warn('[PWA SW] Precache non-critical notice:', err);
        })
    );
});

// KÍCH HOẠT (ACTIVATE): Xóa cache cũ & kiểm soát ngay các tab đang mở
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((k) => {
                    if (k !== CACHE_NAME) {
                        return caches.delete(k);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// BẮT YÊU CẦU MẠNG (FETCH):
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Bỏ qua các yêu cầu không phải GET hoặc chrome-extension
    if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
        return;
    }

    // TUYỆT ĐỐI KHÔNG can thiệp vào Firebase, Google APIs, Firestore streaming để tránh treo mạng di động
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis.com') || 
        url.hostname.includes('gstatic.com') ||
        url.hostname.includes('identitytoolkit') ||
        url.hostname.includes('google.com')) {
        return;
    }

    // Chiến lược 1: Điều hướng trang HTML (Navigation) -> Network-First, mất mạng dùng cache index.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkRes) => {
                    if (networkRes && networkRes.status === 200) {
                        const copy = networkRes.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkRes;
                })
                .catch(() => {
                    return caches.match('./index.html') || caches.match('./');
                })
        );
        return;
    }

    // Chiến lược 2: Tài nguyên tĩnh (JS, CSS, Images...) -> Cache-First để tải tức thì, nếu chưa có thì fetch & lưu cache
    event.respondWith(
        caches.match(request).then((cachedRes) => {
            if (cachedRes) {
                return cachedRes; // Trả về ngay lập tức trong 0.01s nếu đã có trong máy
            }
            return fetch(request).then((networkRes) => {
                if (networkRes && (networkRes.status === 200 || networkRes.type === 'opaque')) {
                    const copy = networkRes.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return networkRes;
            }).catch(() => {
                // Đảm bảo không bị crash nếu mất mạng và chưa cache
                return new Response('', { status: 408, statusText: 'Offline Resource' });
            });
        })
    );
});
