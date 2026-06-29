/**
 * Cooldown Mode Screen
 * 呼吸ガイドアニメーション + 環境音 + 固定タイマー
 */

import { startAmbient, stopAmbient, setVolume, getCurrentType } from '../audio/ambient';
import { playCalmChime, initAudio } from '../audio/sfx';
import { navigate, getAppContainer } from '../utils/router';
import { formatTime } from '../utils/helpers';
import type { AmbientType } from '../audio/ambient';

let cooldownInterval: ReturnType<typeof setInterval> | null = null;
let cooldownRemaining = 0;
let isBreathingIn = true;
let breathCycleTimer: ReturnType<typeof setInterval> | null = null;

const AMBIENT_SOUNDS: { type: AmbientType; emoji: string; label: string }[] = [
  { type: 'rain', emoji: '🌧️', label: 'あめ' },
  { type: 'wave', emoji: '🌊', label: 'うみ' },
  { type: 'heartbeat', emoji: '💗', label: 'しんぞう' },
];

export function showCooldown(): void {
  const container = getAppContainer();
  initAudio();

  container.innerHTML = `
    <div class="screen screen-enter cooldown-screen" id="cooldown-screen">
      <!-- Close button -->
      <button class="cooldown-close" id="cooldown-close" aria-label="とじる">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <!-- Cooldown Header -->
      <div class="cooldown-header">
        <h1 class="cooldown-title">おちつきモード</h1>
        <p class="cooldown-subtitle">しんこきゅう してみよう</p>
      </div>

      <!-- Stars background -->
      <div class="cooldown-stars">
        ${Array.from({ length: 30 }, (_, i) => `
          <div class="cooldown-star" style="
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 3}s;
            animation-duration: ${2 + Math.random() * 3}s;
            width: ${1 + Math.random() * 3}px;
            height: ${1 + Math.random() * 3}px;
          "></div>
        `).join('')}
      </div>

      <!-- Breathing Circle -->
      <div class="breathing-area">
        <div class="breathing-circle" id="breathing-circle">
          <div class="breathing-circle__inner">
            <div class="breathing-text" id="breathing-text">すって...</div>
          </div>
        </div>
      </div>

      <!-- Timer Selection -->
      <div class="cooldown-timer-select" id="timer-select">
        <button class="cooldown-timer-btn" data-duration="180">3ぷん</button>
        <button class="cooldown-timer-btn" data-duration="300">5ぷん</button>
      </div>

      <!-- Timer Display (hidden until started) -->
      <div class="cooldown-timer" id="cooldown-timer" style="display: none;">
        <span id="cooldown-time-display">03:00</span>
      </div>

      <!-- Sound Selector -->
      <div class="sound-selector">
        <div class="sound-buttons">
          ${AMBIENT_SOUNDS.map(s => `
            <button class="sound-btn" data-sound="${s.type}">
              <span class="sound-btn__emoji">${s.emoji}</span>
              <span class="sound-btn__label">${s.label}</span>
            </button>
          `).join('')}
        </div>
        <div class="volume-control">
          <span class="volume-icon">🔈</span>
          <input type="range" class="volume-slider" id="volume-slider" 
                 min="0" max="100" value="50" step="5">
          <span class="volume-icon">🔊</span>
        </div>
      </div>
    </div>

    <style>
      .cooldown-screen {
        position: fixed;
        inset: 0;
        background: linear-gradient(180deg, #0f0a2e 0%, #1e1b4b 40%, #312e81 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
        padding: 24px 16px;
        box-sizing: border-box;
        z-index: 150;
        overflow: hidden;
      }

      .cooldown-header {
        text-align: center;
        z-index: 5;
        margin-top: calc(48px + env(safe-area-inset-top, 0px));
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }

      .cooldown-title {
        color: #fff;
        font-size: 1.5rem;
        font-weight: 900;
        margin: 0 0 6px 0;
        text-shadow: 0 2px 8px rgba(0,0,0,0.5);
      }

      .cooldown-subtitle {
        color: #bae6fd;
        font-size: 0.85rem;
        font-weight: 700;
        margin: 0;
        opacity: 0.8;
      }

      .cooldown-close {
        position: absolute;
        top: calc(16px + env(safe-area-inset-top, 0px));
        right: 16px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        background: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .cooldown-close:hover {
        background: rgba(255,255,255,0.2);
        color: #fff;
      }

      /* Stars */
      .cooldown-stars {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .cooldown-star {
        position: absolute;
        border-radius: 50%;
        background: #fff;
        animation: starTwinkle ease-in-out infinite alternate;
      }

      @keyframes starTwinkle {
        0% { opacity: 0.2; }
        100% { opacity: 0.8; }
      }

      /* Breathing */
      .breathing-area {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        position: relative;
      }

      .breathing-circle {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        background: radial-gradient(circle, hsla(240, 60%, 65%, 0.8) 0%, hsla(263, 70%, 50%, 0.4) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 60px hsla(263, 70%, 55%, 0.3),
                    0 0 120px hsla(263, 70%, 55%, 0.15);
        transition: transform 4s ease-in-out, box-shadow 4s ease-in-out;
      }

      .breathing-circle.inhale {
        transform: scale(1.5);
        box-shadow: 0 0 80px hsla(263, 70%, 55%, 0.5),
                    0 0 160px hsla(263, 70%, 55%, 0.25);
      }

      .breathing-circle.exhale {
        transform: scale(1);
        box-shadow: 0 0 40px hsla(263, 70%, 55%, 0.2),
                    0 0 80px hsla(263, 70%, 55%, 0.1);
      }

      .breathing-circle__inner {
        text-align: center;
      }

      .breathing-text {
        color: rgba(255,255,255,0.9);
        font-size: 1.2rem;
        font-weight: 700;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        transition: opacity 0.5s ease;
      }

      /* Timer Select */
      .cooldown-timer-select {
        display: flex;
        gap: 16px;
        z-index: 5;
      }

      .cooldown-timer-btn {
        padding: 12px 32px;
        border-radius: 24px;
        border: 2px solid rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.9);
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .cooldown-timer-btn:hover {
        background: rgba(255,255,255,0.2);
        border-color: rgba(255,255,255,0.5);
      }

      .cooldown-timer-btn:active {
        transform: scale(0.95);
      }

      .cooldown-timer-btn--active {
        background: rgba(255,255,255,0.25);
        border-color: rgba(255,255,255,0.6);
      }

      /* Timer Display */
      .cooldown-timer {
        font-size: 1.2rem;
        font-weight: 400;
        color: rgba(255,255,255,0.35);
        font-family: 'M PLUS Rounded 1c', sans-serif;
        z-index: 5;
      }

      /* Sound Selector */
      .sound-selector {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        width: 100%;
        max-width: 320px;
        padding-bottom: env(safe-area-inset-bottom, 8px);
        z-index: 5;
      }

      .sound-buttons {
        display: flex;
        gap: 10px;
      }

      .sound-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 18px;
        border-radius: 20px;
        border: 2px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.7);
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 0.7rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .sound-btn__emoji {
        font-size: 1.5rem;
      }

      .sound-btn.active {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.4);
        color: #fff;
      }

      .volume-control {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      .volume-icon {
        font-size: 1rem;
        opacity: 0.6;
      }

      .volume-slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        border-radius: 3px;
        background: rgba(255,255,255,0.15);
        outline: none;
      }

      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255,255,255,0.8);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
    </style>
  `;

  setupCooldownEvents(container);
  startBreathingCycle(container);
}

function startBreathingCycle(container: HTMLElement): void {
  const circle = container.querySelector<HTMLElement>('#breathing-circle');
  const text = container.querySelector<HTMLElement>('#breathing-text');
  if (!circle || !text) return;

  isBreathingIn = true;
  updateBreathingState(circle, text);

  breathCycleTimer = setInterval(() => {
    isBreathingIn = !isBreathingIn;
    updateBreathingState(circle, text);
  }, 4000);
}

function updateBreathingState(circle: HTMLElement, text: HTMLElement): void {
  if (isBreathingIn) {
    circle.classList.remove('exhale');
    circle.classList.add('inhale');
    text.textContent = 'すって...';
  } else {
    circle.classList.remove('inhale');
    circle.classList.add('exhale');
    text.textContent = 'はいて...';
  }
}

function setupCooldownEvents(container: HTMLElement): void {
  // Close button
  const closeBtn = container.querySelector<HTMLButtonElement>('#cooldown-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      cleanup();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate('home');
      }
    });
  }

  // Timer buttons
  container.querySelectorAll<HTMLButtonElement>('.cooldown-timer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const duration = parseInt(btn.dataset.duration || '180', 10);
      startCooldownTimer(container, duration);
      // Highlight active button
      container.querySelectorAll('.cooldown-timer-btn').forEach(b =>
        b.classList.remove('cooldown-timer-btn--active')
      );
      btn.classList.add('cooldown-timer-btn--active');
    });
  });

  // Sound buttons
  container.querySelectorAll<HTMLButtonElement>('.sound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const soundType = btn.dataset.sound as AmbientType;
      const currentType = getCurrentType();

      if (currentType === soundType) {
        stopAmbient();
        btn.classList.remove('active');
      } else {
        stopAmbient();
        container.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
        startAmbient(soundType);
        btn.classList.add('active');
      }
    });
  });

  // Volume slider
  const volumeSlider = container.querySelector<HTMLInputElement>('#volume-slider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      setVolume(parseInt(volumeSlider.value, 10) / 100);
    });
  }

  // Cleanup on navigation
  const onHashChange = () => {
    cleanup();
    window.removeEventListener('hashchange', onHashChange);
  };
  window.addEventListener('hashchange', onHashChange);
}

function startCooldownTimer(container: HTMLElement, durationSeconds: number): void {
  // Clear existing timer
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }

  cooldownRemaining = durationSeconds;
  const timerDisplay = container.querySelector<HTMLElement>('#cooldown-timer');
  const timeText = container.querySelector<HTMLElement>('#cooldown-time-display');
  const timerSelect = container.querySelector<HTMLElement>('#timer-select');

  if (timerDisplay) timerDisplay.style.display = 'block';
  if (timeText) timeText.textContent = formatTime(cooldownRemaining);

  cooldownInterval = setInterval(() => {
    cooldownRemaining--;
    if (timeText) timeText.textContent = formatTime(cooldownRemaining);

    if (cooldownRemaining <= 0) {
      if (cooldownInterval) clearInterval(cooldownInterval);
      cooldownInterval = null;
      playCalmChime();
      if (timerDisplay) timerDisplay.style.display = 'none';
      if (timerSelect) timerSelect.style.display = 'flex';
      // Reset button states
      container.querySelectorAll('.cooldown-timer-btn').forEach(b =>
        b.classList.remove('cooldown-timer-btn--active')
      );
    }
  }, 1000);
}

function cleanup(): void {
  stopAmbient();
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
    cooldownInterval = null;
  }
  if (breathCycleTimer) {
    clearInterval(breathCycleTimer);
    breathCycleTimer = null;
  }
}
