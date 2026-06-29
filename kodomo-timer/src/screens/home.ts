/**
 * Home / Theme Selection Screen
 * テーマ選択 + 時間設定 → タイマー開始
 */

import { renderHeader, initHeader } from '../components/header';
import { renderThemeCard } from '../components/theme-card';
import { getThemeConfig, getAllThemes } from '../themes/index';
import { getSettings, saveSettings } from '../data/storage';
import { navigate, getAppContainer } from '../utils/router';
import { initAudio } from '../audio/sfx';
import type { ThemeId } from '../data/models';

let selectedTheme: ThemeId = 'space';
let selectedMinutes = 5;

const QUICK_TIMES = [5, 10, 15, 30];

export function showHome(): void {
  const container = getAppContainer();
  const settings = getSettings();
  selectedTheme = settings.currentTheme;
  selectedMinutes = settings.defaultMinutes;

  container.innerHTML = `
    ${renderHeader({ showBack: false, showCooldown: true, title: 'ビジュアルタイマー' })}
    <div class="screen screen-enter" id="home-screen">
      <!-- Time Selection -->
      <section class="home-section">
        <h2 class="home-section__title">⏱️ じかんをえらぼう</h2>
        <div class="quick-times">
          ${QUICK_TIMES.map(m => `
            <button class="quick-time-btn ${m === selectedMinutes ? 'quick-time-btn--active' : ''}" 
                    data-minutes="${m}">
              ${m}<span class="quick-time-unit">ぷん</span>
            </button>
          `).join('')}
        </div>
        <div class="custom-time">
          <input type="range" id="time-slider" class="time-slider" 
                 min="1" max="60" value="${selectedMinutes}" step="1">
          <div class="time-display">
            <span class="time-display__value" id="time-value">${selectedMinutes}</span>
            <span class="time-display__unit">ぷん</span>
          </div>
        </div>
      </section>

      <!-- Theme Selection -->
      <section class="home-section">
        <h2 class="home-section__title">🎨 テーマをえらぼう</h2>
        <div class="theme-list" id="theme-list">
          ${getAllThemes().map(theme => renderThemeCard(theme, theme.id === selectedTheme)).join('')}
        </div>
      </section>

      <!-- Start Button -->
      <div class="start-area">
        <button class="start-btn" id="start-btn">
          <span class="start-btn__icon">🚀</span>
          <span class="start-btn__text">ミッション スタート！</span>
        </button>
      </div>

      <!-- Settings & Help Links -->
      <div class="settings-link-area">
        <button class="settings-link" id="help-btn">
          ❓ つかいかた
        </button>
        <span class="settings-link-separator">|</span>
        <button class="settings-link" id="settings-link">
          ⚙️ ほごしゃせってい
        </button>
      </div>
    </div>

    <style>
      #home-screen {
        padding: calc(56px + env(safe-area-inset-top, 0px) + 16px) 16px 32px;
        min-height: 100vh;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .home-section {
        margin-bottom: 28px;
      }

      .home-section__title {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--color-text, #374151);
        margin: 0 0 14px 0;
        text-align: center;
      }

      .quick-times {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .quick-time-btn {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        border: 3px solid #e5e7eb;
        background: #fff;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1.5rem;
        font-weight: 900;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        -webkit-tap-highlight-color: transparent;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }

      .quick-time-unit {
        font-size: 0.6rem;
        font-weight: 700;
        margin-top: -2px;
      }

      .quick-time-btn--active {
        border-color: var(--color-primary, hsl(263, 70%, 55%));
        background: linear-gradient(135deg, hsl(263, 70%, 55%) 0%, hsl(263, 70%, 65%) 100%);
        color: #fff;
        transform: scale(1.08);
        box-shadow: 0 4px 16px hsla(263, 70%, 55%, 0.3);
      }

      .quick-time-btn:active {
        transform: scale(0.95);
      }

      .custom-time {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 8px;
      }

      .time-slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 8px;
        border-radius: 4px;
        background: linear-gradient(to right, hsl(263, 70%, 75%), hsl(263, 70%, 55%));
        outline: none;
      }

      .time-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid hsl(263, 70%, 55%);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        cursor: pointer;
      }

      .time-display {
        display: flex;
        align-items: baseline;
        gap: 2px;
        min-width: 60px;
        justify-content: center;
      }

      .time-display__value {
        font-size: 2rem;
        font-weight: 900;
        color: hsl(263, 70%, 55%);
      }

      .time-display__unit {
        font-size: 0.9rem;
        font-weight: 700;
        color: #9ca3af;
      }

      .theme-list {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
      }

      .start-area {
        display: flex;
        justify-content: center;
        padding: 16px 0 8px;
      }

      .start-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        max-width: 320px;
        height: 64px;
        border: none;
        border-radius: 32px;
        background: linear-gradient(135deg, hsl(263, 70%, 55%) 0%, hsl(280, 70%, 60%) 50%, hsl(263, 70%, 45%) 100%);
        color: #fff;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1.3rem;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 6px 24px hsla(263, 70%, 55%, 0.35);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        -webkit-tap-highlight-color: transparent;
        animation: startPulse 2s ease-in-out infinite;
        position: relative;
        overflow: hidden;
      }

      .start-btn::after {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
        animation: startShimmer 3s ease-in-out infinite;
      }

      @keyframes startShimmer {
        0% { left: -100%; }
        50%, 100% { left: 100%; }
      }

      @keyframes startPulse {
        0%, 100% { box-shadow: 0 6px 24px hsla(263, 70%, 55%, 0.35); }
        50% { box-shadow: 0 8px 32px hsla(263, 70%, 55%, 0.5); }
      }

      .start-btn:hover {
        transform: translateY(-2px);
      }

      .start-btn:active {
        transform: scale(0.97);
        animation: none;
      }

      .start-btn__icon {
        font-size: 1.5rem;
      }

      .settings-link-area {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 0 env(safe-area-inset-bottom, 16px);
      }

      .settings-link-separator {
        color: #d1d5db;
        font-size: 0.85rem;
        font-weight: 300;
        user-select: none;
      }

      .settings-link {
        background: none;
        border: none;
        color: #9ca3af;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 16px;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .settings-link:hover {
        background: rgba(0,0,0,0.04);
        color: #6b7280;
      }
    </style>
  `;

  // Initialize interactions
  initHeader(container);
  setupHomeEvents(container);
}

function setupHomeEvents(container: HTMLElement): void {
  // Quick time buttons
  container.querySelectorAll<HTMLButtonElement>('.quick-time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const minutes = parseInt(btn.dataset.minutes || '5', 10);
      setSelectedTime(minutes, container);
      initAudio(); // Initialize audio on first user interaction
    });
  });

  // Time slider
  const slider = container.querySelector<HTMLInputElement>('#time-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      const minutes = parseInt(slider.value, 10);
      setSelectedTime(minutes, container);
    });
  }

  // Theme cards
  container.querySelectorAll<HTMLButtonElement>('.theme-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.theme as ThemeId;
      if (themeId) {
        setSelectedTheme(themeId, container);
        initAudio();
      }
    });
  });

  // Start button
  const startBtn = container.querySelector<HTMLButtonElement>('#start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      initAudio();
      // Save settings
      const settings = getSettings();
      settings.currentTheme = selectedTheme;
      settings.defaultMinutes = selectedMinutes;
      saveSettings(settings);
      // Navigate to timer
      navigate('timer', {
        theme: selectedTheme,
        minutes: String(selectedMinutes),
      });
    });
  }

  // Settings link
  const settingsLink = container.querySelector<HTMLButtonElement>('#settings-link');
  if (settingsLink) {
    settingsLink.addEventListener('click', () => {
      navigate('settings');
    });
  }

  // Help button
  const helpBtn = container.querySelector<HTMLButtonElement>('#help-btn');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      initAudio();
      showHelpModal();
    });
  }
}

function setSelectedTime(minutes: number, container: HTMLElement): void {
  selectedMinutes = minutes;
  // Update slider
  const slider = container.querySelector<HTMLInputElement>('#time-slider');
  if (slider) slider.value = String(minutes);
  // Update display
  const display = container.querySelector('#time-value');
  if (display) display.textContent = String(minutes);
  // Update quick buttons
  container.querySelectorAll<HTMLButtonElement>('.quick-time-btn').forEach(btn => {
    const m = parseInt(btn.dataset.minutes || '0', 10);
    btn.classList.toggle('quick-time-btn--active', m === minutes);
  });
}

function setSelectedTheme(themeId: ThemeId, container: HTMLElement): void {
  selectedTheme = themeId;
  const themeList = container.querySelector('#theme-list');
  if (themeList) {
    themeList.innerHTML = getAllThemes().map(
      theme => renderThemeCard(theme, theme.id === selectedTheme)
    ).join('');
    // Re-attach theme card listeners
    themeList.querySelectorAll<HTMLButtonElement>('.theme-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.theme as ThemeId;
        if (id) setSelectedTheme(id, container);
      });
    });
  }
  // Update start button icon/text based on theme
  const startIcon = container.querySelector('.start-btn__icon');
  const themeConfig = getThemeConfig(themeId);
  if (startIcon && themeConfig) {
    startIcon.textContent = themeConfig.emoji;
  }
}

function showHelpModal(): void {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'help-modal';

  overlay.innerHTML = `
    <div class="modal-content help-modal-content">
      <div class="help-modal-header">
        <h2 class="help-modal-title">⏱️ つかいかた</h2>
        <button class="help-modal-close" id="help-modal-close" aria-label="とじる">&times;</button>
      </div>
      <div class="help-modal-body">
        <div class="help-item">
          <div class="help-item__icon">⏱️</div>
          <div class="help-item__text">
            <h3>じかんをえらぼう</h3>
            <p>ボタンをえらぶか、スライダーをうごかして、タイマーの時間をきめるよ。</p>
          </div>
        </div>
        <div class="help-item">
          <div class="help-item__icon">🎨</div>
          <div class="help-item__text">
            <h3>テーマをえらぼう</h3>
            <p>「うちゅう🚀」「おかたづけ🧹」「どうぶつえん🦁」からすきなテーマをえらんでね。</p>
          </div>
        </div>
        <div class="help-item">
          <div class="help-item__icon">🚀</div>
          <div class="help-item__text">
            <h3>ミッション スタート！</h3>
            <p>タイマーがはじまると、アニメーションやイラストがどんどんかわっていくよ。</p>
          </div>
        </div>
        <div class="help-item">
          <div class="help-item__icon">🗣️</div>
          <div class="help-item__text">
            <h3>おしゃべりじっきょう</h3>
            <p>タイマーのちゅうしゃくや、のこり時間がすくなくなると、声で応援してくれるよ！</p>
          </div>
        </div>
        <div class="help-item">
          <div class="help-item__icon">⭐️</div>
          <div class="help-item__text">
            <h3>スタンプをあつめよう</h3>
            <p>タイマーをさいごまでやり遂げるとスタンプがおせるよ。ごほうびチケットをねらおう！</p>
          </div>
        </div>
        <div class="help-item">
          <div class="help-item__icon">🫧</div>
          <div class="help-item__text">
            <h3>おちつきモード（おちつく）</h3>
            <p>イライラしたり、おちつきたいときは、みぎうえの「おちつく」ボタンをおして、しんこきゅうをしてみよう。</p>
          </div>
        </div>
      </div>
    </div>
    <style>
      .help-modal-content {
        max-width: 440px;
        border-radius: 24px;
        padding: 24px;
        box-sizing: border-box;
      }
      .help-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #f3f4f6;
        padding-bottom: 12px;
      }
      .help-modal-title {
        font-size: 1.15rem;
        font-weight: 900;
        color: var(--color-primary);
        margin: 0;
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }
      .help-modal-close {
        font-size: 2rem;
        font-weight: 400;
        color: #9ca3af;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        line-height: 1;
        transition: color 0.2s;
      }
      .help-modal-close:hover {
        color: #374151;
      }
      .help-modal-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-height: 50vh;
        overflow-y: auto;
        padding-right: 4px;
      }
      .help-item {
        display: flex;
        gap: 14px;
        align-items: flex-start;
      }
      .help-item__icon {
        font-size: 1.8rem;
        width: 44px;
        height: 44px;
        background: rgba(124, 58, 237, 0.08);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .help-item__text h3 {
        font-size: 0.95rem;
        font-weight: 800;
        color: #374151;
        margin: 0 0 4px 0;
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }
      .help-item__text p {
        font-size: 0.8rem;
        font-weight: 500;
        color: #6b7280;
        margin: 0;
        line-height: 1.4;
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }
    </style>
  `;

  document.body.appendChild(overlay);

  // Close event
  const closeBtn = overlay.querySelector('#help-modal-close');
  const closeModal = () => {
    overlay.classList.add('closing');
    overlay.addEventListener('animationend', () => {
      overlay.remove();
    }, { once: true });
  };

  closeBtn?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
}
