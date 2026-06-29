/**
 * Main Timer Screen
 * カウントダウン + テーマアニメーション + 音声実況
 */

import { renderHeader, initHeader } from '../components/header';
import { renderProgressGauge } from '../components/progress-gauge';
import { getThemeConfig } from '../themes/index';
import { speak } from '../audio/speech';
import { playCountdownBeep, initAudio } from '../audio/sfx';
import { getRecording } from '../data/storage';
import { playRecordingBlob } from '../audio/recorder';
import { navigate, getAppContainer } from '../utils/router';
import { formatTime, calcProgress, getColorPhase } from '../utils/helpers';
import type { ThemeId } from '../data/models';

let timerInterval: ReturnType<typeof setInterval> | null = null;
let totalSeconds = 0;
let remainingSeconds = 0;
let isPaused = false;
let currentThemeId: ThemeId = 'space';

// Track which speech triggers have been fired to avoid repeats
let firedTriggers = new Set<string>();

export function showTimer(params?: Record<string, string>): void {
  const container = getAppContainer();
  currentThemeId = (params?.theme as ThemeId) || 'space';
  const minutes = parseInt(params?.minutes || '5', 10);
  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  isPaused = false;
  firedTriggers = new Set();

  initAudio();
  const theme = getThemeConfig(currentThemeId);

  container.innerHTML = `
    ${renderHeader({ showBack: true, showCooldown: true, title: theme.name })}
    <div class="screen screen-enter timer-screen" id="timer-screen"
         style="background: linear-gradient(180deg, ${theme.colors.bg} 0%, ${theme.colors.primary}15 100%);">
      
      <!-- Theme Animation Area -->
      <div class="timer-theme-animation" id="theme-animation">
        ${theme.renderIllustration(0)}
      </div>

      <!-- Progress Gauge -->
      <div class="timer-gauge-area" id="gauge-area">
        ${renderProgressGauge(0, formatTime(remainingSeconds), 'green')}
      </div>

      <!-- Speech Bubble -->
      <div class="timer-speech-bubble" id="speech-bubble" style="display: none;">
        <span id="speech-text"></span>
      </div>

      <!-- Controls -->
      <div class="timer-controls">
        <button class="timer-ctrl-btn timer-ctrl-btn--pause" id="pause-btn">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
          <span>いちじていし</span>
        </button>
        <button class="timer-ctrl-btn timer-ctrl-btn--stop" id="stop-btn">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2"/>
          </svg>
          <span>やめる</span>
        </button>
      </div>
    </div>

    <style>
      .timer-screen {
        padding: calc(56px + env(safe-area-inset-top, 0px) + 8px) 16px 24px;
        min-height: 100vh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        transition: background 1s ease;
      }

      .timer-theme-animation {
        width: 100%;
        max-width: 400px;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0;
      }

      .timer-theme-animation svg {
        width: 100%;
        height: auto;
        max-height: 240px;
      }

      .timer-gauge-area {
        display: flex;
        justify-content: center;
      }

      .timer-speech-bubble {
        background: #fff;
        border-radius: 20px;
        padding: 12px 24px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        font-size: 1rem;
        font-weight: 700;
        color: #374151;
        text-align: center;
        max-width: 320px;
        animation: speechBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
      }

      .timer-speech-bubble::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 16px;
        height: 8px;
        background: #fff;
        clip-path: polygon(0 0, 100% 0, 50% 100%);
      }

      @keyframes speechBounce {
        0% { transform: scale(0.5) translateY(20px); opacity: 0; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }

      .timer-controls {
        display: flex;
        gap: 20px;
        margin-top: auto;
        padding-bottom: env(safe-area-inset-bottom, 16px);
      }

      .timer-ctrl-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        border: none;
        border-radius: 20px;
        padding: 14px 28px;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .timer-ctrl-btn--pause {
        background: rgba(255,255,255,0.85);
        color: #6b7280;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      }

      .timer-ctrl-btn--pause.is-paused {
        background: hsl(145, 65%, 45%);
        color: #fff;
      }

      .timer-ctrl-btn--stop {
        background: rgba(255,255,255,0.85);
        color: #ef4444;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      }

      .timer-ctrl-btn:active {
        transform: scale(0.93);
      }
    </style>
  `;

  initHeader(container);
  setupTimerEvents(container);
  startCountdown(container);

  // Fire start speech
  speak(currentThemeId, 'start');
  showSpeechBubble(container, getStartText());
}

function getStartText(): string {
  const texts: Record<ThemeId, string> = {
    space: '🚀 ミッションスタート！',
    cleanup: '🧹 おかたづけスタート！',
    zoo: '🦁 たんけんスタート！',
  };
  return texts[currentThemeId] || 'スタート！';
}

function setupTimerEvents(container: HTMLElement): void {
  const pauseBtn = container.querySelector<HTMLButtonElement>('#pause-btn');
  const stopBtn = container.querySelector<HTMLButtonElement>('#stop-btn');

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      isPaused = !isPaused;
      pauseBtn.classList.toggle('is-paused', isPaused);
      const svg = pauseBtn.querySelector('svg');
      const label = pauseBtn.querySelector('span');
      if (isPaused) {
        if (svg) svg.innerHTML = '<polygon points="6,4 20,12 6,20" />';
        if (label) label.textContent = 'さいかい';
      } else {
        if (svg) svg.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';
        if (label) label.textContent = 'いちじていし';
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      if (confirm('タイマーをやめますか？')) {
        clearTimer();
        navigate('home');
      }
    });
  }
}

function startCountdown(container: HTMLElement): void {
  timerInterval = setInterval(() => {
    if (isPaused) return;

    remainingSeconds--;

    // Check speech triggers
    checkSpeechTriggers(container);

    // Update UI
    updateTimerUI(container);

    if (remainingSeconds <= 0) {
      clearTimer();
      onTimerComplete(container, true);
    }
  }, 1000);
}

function checkSpeechTriggers(container: HTMLElement): void {
  const progress = calcProgress(remainingSeconds, totalSeconds);
  const elapsed = totalSeconds - remainingSeconds;

  // 50% trigger
  if (progress >= 0.5 && !firedTriggers.has('half')) {
    firedTriggers.add('half');
    speak(currentThemeId, 'half');
    showSpeechBubble(container, '🔥 おりかえし！そのちょうし！');
  }

  // 3 minutes remaining trigger
  if (remainingSeconds === 180 && !firedTriggers.has('threeMin') && totalSeconds > 180) {
    firedTriggers.add('threeMin');
    speak(currentThemeId, 'threeMin');
    showSpeechBubble(container, '⚡ あと3ぷん！ラストスパート！');
  }

  // 1 minute remaining - play parent recording
  if (remainingSeconds === 60 && !firedTriggers.has('parentVoice')) {
    firedTriggers.add('parentVoice');
    playParentRecording();
  }

  // Last 10 seconds - beep
  if (remainingSeconds <= 10 && remainingSeconds > 0) {
    playCountdownBeep();
  }
}

async function playParentRecording(): Promise<void> {
  try {
    const recording = await getRecording('recording-1');
    if (recording) {
      playRecordingBlob(recording.blob);
    }
  } catch {
    // No recording available - that's fine
  }
}

function updateTimerUI(container: HTMLElement): void {
  const progress = calcProgress(remainingSeconds, totalSeconds);
  const colorPhase = getColorPhase(remainingSeconds, totalSeconds);
  const theme = getThemeConfig(currentThemeId);

  // Update theme animation
  const animArea = container.querySelector('#theme-animation');
  if (animArea) {
    animArea.innerHTML = theme.renderIllustration(progress);
  }

  // Update gauge
  const gaugeArea = container.querySelector('#gauge-area');
  if (gaugeArea) {
    gaugeArea.innerHTML = renderProgressGauge(progress, formatTime(remainingSeconds), colorPhase);
  }
}

function showSpeechBubble(container: HTMLElement, text: string): void {
  const bubble = container.querySelector<HTMLElement>('#speech-bubble');
  const speechText = container.querySelector('#speech-text');
  if (bubble && speechText) {
    speechText.textContent = text;
    bubble.style.display = 'block';
    bubble.style.animation = 'none';
    // Force reflow
    bubble.offsetHeight;
    bubble.style.animation = 'speechBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    setTimeout(() => {
      bubble.style.display = 'none';
    }, 3000);
  }
}

function onTimerComplete(container: HTMLElement, withinTime: boolean): void {
  if (withinTime) {
    speak(currentThemeId, 'complete');
  } else {
    speak(currentThemeId, 'timeUp');
  }

  // Navigate to stamp sheet with result
  navigate('stamp', {
    theme: currentThemeId,
    completed: withinTime ? 'true' : 'false',
    minutes: String(Math.ceil(totalSeconds / 60)),
  });
}

function clearTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Clean up when leaving the page
window.addEventListener('hashchange', () => {
  clearTimer();
});
