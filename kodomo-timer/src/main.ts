/**
 * ビジュアルタイマー - Main Entry Point
 * App initialization, routing, and service worker registration.
 */

// Import styles
import './styles/index.css';
import './styles/timer.css';
import './styles/cooldown.css';
import './styles/stamp.css';
import './styles/settings.css';

// Import router
import { registerRoute, initRouter } from './utils/router';

// Import screens
import { showHome } from './screens/home';
import { showTimer } from './screens/timer';
import { showStamp } from './screens/stamp';
import { showCooldown } from './screens/cooldown';
import { showSettings } from './screens/settings';

// Import audio init
import { initAudio } from './audio/sfx';

// Initialize audio on first user interaction
function setupAudioInit(): void {
  const handler = () => {
    initAudio();
    document.removeEventListener('touchstart', handler);
    document.removeEventListener('click', handler);
  };
  document.addEventListener('touchstart', handler, { once: true });
  document.addEventListener('click', handler, { once: true });
}

// Register PWA Service Worker
function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // Service worker registration failed - app still works without it
      });
    });
  }
}

// App initialization
function init(): void {
  setupAudioInit();
  registerServiceWorker();

  // Register all routes
  registerRoute('home', (params) => showHome());
  registerRoute('timer', (params) => showTimer(params));
  registerRoute('stamp', (params) => showStamp(params));
  registerRoute('cooldown', () => showCooldown());
  registerRoute('settings', () => showSettings());

  // Start router (will render the initial route)
  initRouter();
}

// Boot the app
document.addEventListener('DOMContentLoaded', init);
