/**
 * Stamp Sheet Screen
 * 結果発表 + スタンプ付与 + ごほうびチケット
 */

import { renderHeader, initHeader } from '../components/header';
import { startConfetti } from '../components/confetti';
import { getThemeConfig } from '../themes/index';
import { getSettings, getStampSheet, addStampEntry } from '../data/storage';
import { addActivityLog } from '../data/storage';
import { playCheer, playHighFive, playStampSlam, playConfetti as playConfettiSfx } from '../audio/sfx';
import { navigate, getAppContainer } from '../utils/router';
import { todayISO, escapeHtml, vibrate } from '../utils/helpers';
import type { ThemeId } from '../data/models';

let hasProcessedResult = false;

export function showStamp(params?: Record<string, string>): void {
  const container = getAppContainer();
  const themeId = (params?.theme as ThemeId) || 'space';
  const completed = params?.completed === 'true';
  const minutes = parseInt(params?.minutes || '5', 10);
  const theme = getThemeConfig(themeId);
  const settings = getSettings();

  // Add stamp entry and log (only once)
  if (!hasProcessedResult) {
    hasProcessedResult = true;

    addStampEntry({
      date: todayISO(),
      themeId,
      durationMinutes: minutes,
      completed,
    });

    addActivityLog({
      date: todayISO(),
      attempts: 1,
      completions: completed ? 1 : 0,
      totalMinutes: minutes,
    });
  }

  const sheet = getStampSheet();
  const isGoalReached = sheet.stamps.length === 0 && sheet.completedSheets > 0;
  const stampCount = isGoalReached ? settings.stampGoal : sheet.stamps.length;
  const goal = settings.stampGoal;

  // Pick a random reward
  const rewards = settings.rewards;
  const rewardText = rewards.length > 0
    ? rewards[Math.floor(Math.random() * rewards.length)]
    : 'すてきなごほうび 🎁';

  container.innerHTML = `
    ${renderHeader({ showBack: false, showCooldown: true, title: 'けっか はっぴょう！' })}
    <div class="screen screen-enter stamp-screen" id="stamp-screen">

      <!-- Result Overlay -->
      <div class="result-overlay" id="result-overlay">
        <div class="result-stamp-container">
          <div class="result-stamp" id="result-stamp">
            ${completed
              ? `<div class="result-stamp__icon">🌟</div>
                 <div class="result-stamp__label">たいへん<br>よくできました！</div>`
              : `<div class="result-stamp__icon">💪</div>
                 <div class="result-stamp__label">がんばったね！</div>`
            }
          </div>
        </div>
        <button class="result-next-btn" id="result-next-btn">
          つぎへ →
        </button>
      </div>

      <!-- Stamp Sheet View (hidden initially) -->
      <div class="stamp-sheet-view" id="stamp-sheet-view" style="display: none;">
        <h2 class="stamp-sheet-title">${theme.emoji} スタンプシート</h2>
        <div class="stamp-sheet-progress">
          <span class="stamp-count">${stampCount}</span> / <span class="stamp-goal">${goal}</span>
        </div>

        <div class="stamp-grid stamp-grid--${goal}" id="stamp-grid">
          ${renderStampGrid(theme, stampCount, goal)}
        </div>

        <div class="stamp-actions">
          <button class="btn btn-primary stamp-action-btn" id="home-btn">
            🏠 ホームにもどる
          </button>
          <button class="btn btn-accent stamp-action-btn" id="retry-btn">
            🔄 もういちど チャレンジ！
          </button>
        </div>
      </div>

      <!-- Reward Ticket (shown when goal reached) -->
      ${isGoalReached ? `
        <div class="reward-overlay" id="reward-overlay" style="display: none;">
          <div class="reward-ticket">
            <div class="reward-ticket__header">🎉 ごほうびチケット 🎉</div>
            <div class="reward-ticket__body">
              <div class="reward-ticket__text">${escapeHtml(rewardText)}</div>
            </div>
            <div class="reward-ticket__footer">
              チケットをパパ・ママに みせてね！
            </div>
            <button class="reward-ticket__close" id="reward-close-btn">とじる</button>
          </div>
        </div>
      ` : ''}
    </div>

    <style>
      .stamp-screen {
        padding: calc(56px + env(safe-area-inset-top, 0px) + 8px) 16px 24px;
        min-height: 100vh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      /* Result Overlay */
      .result-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        gap: 40px;
        width: 100%;
      }

      .result-stamp-container {
        position: relative;
      }

      .result-stamp {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        animation: stampSlam 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .result-stamp__icon {
        font-size: 6rem;
        animation: stampGlow 1.5s ease-in-out infinite alternate;
      }

      .result-stamp__label {
        font-size: 1.6rem;
        font-weight: 900;
        text-align: center;
        color: #374151;
        line-height: 1.4;
        background: linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      @keyframes stampSlam {
        0% { transform: scale(3) rotate(-10deg); opacity: 0; }
        60% { transform: scale(0.9) rotate(2deg); opacity: 1; }
        80% { transform: scale(1.05) rotate(-1deg); }
        100% { transform: scale(1) rotate(0deg); }
      }

      @keyframes stampGlow {
        0% { filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4)); }
        100% { filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.7)); }
      }

      .result-next-btn {
        padding: 14px 40px;
        border: none;
        border-radius: 24px;
        background: linear-gradient(135deg, hsl(263, 70%, 55%), hsl(263, 70%, 65%));
        color: #fff;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 16px hsla(263, 70%, 55%, 0.3);
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .result-next-btn:active {
        transform: scale(0.95);
      }

      /* Stamp Sheet */
      .stamp-sheet-view {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        width: 100%;
        max-width: 400px;
      }

      .stamp-sheet-title {
        font-size: 1.3rem;
        font-weight: 700;
        margin: 0 0 4px;
        color: #374151;
      }

      .stamp-sheet-progress {
        font-size: 1.1rem;
        font-weight: 700;
        color: #9ca3af;
        margin-bottom: 16px;
      }

      .stamp-count {
        font-size: 1.5rem;
        color: hsl(263, 70%, 55%);
      }

      .stamp-grid {
        display: grid;
        gap: 8px;
        width: 100%;
        margin-bottom: 24px;
      }

      .stamp-grid--5 { grid-template-columns: repeat(5, 1fr); }
      .stamp-grid--10 { grid-template-columns: repeat(5, 1fr); }
      .stamp-grid--20 { grid-template-columns: repeat(5, 1fr); }

      .stamp-cell {
        aspect-ratio: 1;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px dashed #d1d5db;
        background: rgba(255,255,255,0.6);
        transition: all 0.3s;
        overflow: hidden;
      }

      .stamp-cell svg {
        width: 80%;
        height: 80%;
      }

      .stamp-cell--filled {
        border-style: solid;
        border-color: #fbbf24;
        background: rgba(251, 191, 36, 0.1);
        animation: cellFillIn 0.3s ease-out;
      }

      .stamp-cell--current {
        border-color: hsl(263, 70%, 55%);
        border-style: solid;
        animation: cellPulse 1.5s ease-in-out infinite;
      }

      @keyframes cellFillIn {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes cellPulse {
        0%, 100% { box-shadow: 0 0 0 0 hsla(263, 70%, 55%, 0.3); }
        50% { box-shadow: 0 0 0 6px hsla(263, 70%, 55%, 0); }
      }

      .stamp-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        margin-top: auto;
        padding-bottom: env(safe-area-inset-bottom, 16px);
      }

      .stamp-action-btn {
        width: 100%;
        height: 54px;
        border-radius: 27px;
        border: none;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .btn-primary {
        background: linear-gradient(135deg, hsl(263, 70%, 55%), hsl(263, 70%, 65%));
        color: #fff;
        box-shadow: 0 4px 16px hsla(263, 70%, 55%, 0.3);
      }

      .btn-accent {
        background: linear-gradient(135deg, hsl(45, 95%, 55%), hsl(35, 95%, 55%));
        color: #fff;
        box-shadow: 0 4px 16px hsla(45, 95%, 55%, 0.3);
      }

      .stamp-action-btn:active {
        transform: scale(0.97);
      }

      /* Reward Overlay */
      .reward-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease;
      }

      .reward-ticket {
        width: 90%;
        max-width: 340px;
        background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%);
        border-radius: 24px;
        padding: 32px 24px;
        text-align: center;
        box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        border: 3px dashed #92400e;
        animation: ticketAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
      }

      .reward-ticket::before {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 200%; height: 100%;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
        animation: ticketShimmer 2s ease-in-out infinite;
      }

      @keyframes ticketAppear {
        0% { transform: scale(0) rotate(-15deg); opacity: 0; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }

      @keyframes ticketShimmer {
        0% { left: -100%; }
        50%, 100% { left: 100%; }
      }

      .reward-ticket__header {
        font-size: 1.4rem;
        font-weight: 900;
        color: #92400e;
        margin-bottom: 16px;
        position: relative;
      }

      .reward-ticket__body {
        background: rgba(255,255,255,0.7);
        border-radius: 16px;
        padding: 20px 16px;
        margin-bottom: 16px;
        position: relative;
      }

      .reward-ticket__text {
        font-size: 1.3rem;
        font-weight: 900;
        color: #78350f;
      }

      .reward-ticket__footer {
        font-size: 0.85rem;
        font-weight: 700;
        color: #92400e;
        margin-bottom: 12px;
        position: relative;
      }

      .reward-ticket__close {
        background: #92400e;
        color: #fef3c7;
        border: none;
        border-radius: 16px;
        padding: 10px 32px;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        position: relative;
        -webkit-tap-highlight-color: transparent;
      }

      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
    </style>
  `;

  initHeader(container);

  // Play result effects
  setTimeout(() => {
    if (completed) {
      playCheer();
    } else {
      playHighFive();
    }
    playStampSlam();
    vibrate([100, 50, 100]);
  }, 300);

  setupStampEvents(container, themeId, isGoalReached);

  // Reset the processed flag when navigating away
  const onHashChange = () => {
    hasProcessedResult = false;
    window.removeEventListener('hashchange', onHashChange);
  };
  window.addEventListener('hashchange', onHashChange);
}

function renderStampGrid(theme: ReturnType<typeof getThemeConfig>, filledCount: number, goal: number): string {
  let html = '';
  for (let i = 0; i < goal; i++) {
    if (i < filledCount) {
      html += `<div class="stamp-cell stamp-cell--filled">${theme.renderStamp(true)}</div>`;
    } else if (i === filledCount) {
      html += `<div class="stamp-cell stamp-cell--current"></div>`;
    } else {
      html += `<div class="stamp-cell"></div>`;
    }
  }
  return html;
}

function setupStampEvents(container: HTMLElement, themeId: ThemeId, isGoalReached: boolean): void {
  // Next button - show stamp sheet
  const nextBtn = container.querySelector<HTMLButtonElement>('#result-next-btn');
  const resultOverlay = container.querySelector<HTMLElement>('#result-overlay');
  const sheetView = container.querySelector<HTMLElement>('#stamp-sheet-view');

  if (nextBtn && resultOverlay && sheetView) {
    nextBtn.addEventListener('click', () => {
      resultOverlay.style.display = 'none';
      sheetView.style.display = 'flex';

      // If goal reached, show reward after a beat
      if (isGoalReached) {
        setTimeout(() => {
          showReward(container);
        }, 800);
      }
    });
  }

  // Home button
  const homeBtn = container.querySelector<HTMLButtonElement>('#home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => navigate('home'));
  }

  // Retry button
  const retryBtn = container.querySelector<HTMLButtonElement>('#retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      const settings = getSettings();
      navigate('timer', {
        theme: themeId,
        minutes: String(settings.defaultMinutes),
      });
    });
  }

  // Reward close button
  const rewardClose = container.querySelector<HTMLButtonElement>('#reward-close-btn');
  if (rewardClose) {
    rewardClose.addEventListener('click', () => {
      const overlay = container.querySelector<HTMLElement>('#reward-overlay');
      if (overlay) overlay.style.display = 'none';
    });
  }
}

function showReward(container: HTMLElement): void {
  const overlay = container.querySelector<HTMLElement>('#reward-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    playConfettiSfx();
    startConfetti(container, 6000);
  }
}
