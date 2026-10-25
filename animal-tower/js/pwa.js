/* ==========================================================
   pwa.js - ぐらぐら どうぶつタワー PWA (インストール & Service Worker)
   ========================================================== */
(function () {
    'use strict';

    let deferredPrompt = null;

    function isStandalone() {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true
        );
    }

    function isIOS() {
        return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    }

    function initPWA() {
        // Service Worker の登録
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

        const installBtn = document.getElementById('btn-install-pwa');
        const installGroup = document.getElementById('pwa-install-item');
        const installModal = document.getElementById('screen-install');
        const installClose = document.getElementById('btn-install-close');
        const installOk = document.getElementById('btn-install-ok');

        if (!installBtn || !installGroup) return;

        // すでにアプリとして開いている場合はインストールボタンを非表示
        if (isStandalone()) {
            installGroup.style.display = 'none';
            return;
        }

        // Android / Chrome / Edge 等のインストール可能イベント
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installGroup.style.display = 'block';
        });

        // iOS Safari の場合もインストール案内としてボタンを表示
        if (isIOS() && !isStandalone()) {
            installGroup.style.display = 'block';
        }

        // インストールボタンクリック
        installBtn.addEventListener('click', async () => {
            if (window.TowerSound) window.TowerSound.click();

            if (deferredPrompt) {
                deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice.outcome === 'accepted') {
                    installGroup.style.display = 'none';
                }
                deferredPrompt = null;
            } else if (installModal) {
                // iOSまたはブラウザの標準案内モーダルを表示
                installModal.classList.add('show');
            }
        });

        if (installClose && installModal) {
            installClose.addEventListener('click', () => {
                if (window.TowerSound) window.TowerSound.click();
                installModal.classList.remove('show');
            });
        }
        if (installOk && installModal) {
            installOk.addEventListener('click', () => {
                if (window.TowerSound) window.TowerSound.click();
                installModal.classList.remove('show');
            });
        }
        if (installModal) {
            installModal.addEventListener('click', (e) => {
                if (e.target === installModal) installModal.classList.remove('show');
            });
        }

        window.addEventListener('appinstalled', () => {
            installGroup.style.display = 'none';
            deferredPrompt = null;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPWA);
    } else {
        initPWA();
    }
})();
