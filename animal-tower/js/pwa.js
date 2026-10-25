/* ==========================================================
   pwa.js - ぐらぐら どうぶつタワー Service Worker 登録 (オフライン動作対応)
   ========================================================== */
(function () {
    'use strict';

    function initPWA() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('./sw.js')
                    .then((reg) => {
                        console.log('[SW] Registered with scope:', reg.scope);
                    })
                    .catch((err) => {
                        console.warn('[SW] Registration failed:', err);
                    });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPWA);
    } else {
        initPWA();
    }
})();
