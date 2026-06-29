/**
 * Settings Screen (保護者用管理画面)
 * チャイルドロック + マス数設定 + ごほうび編集 + 録音管理 + ログ閲覧
 */

import { renderHeader, initHeader } from '../components/header';
import {
  getSettings, saveSettings,
  getWeeklyStats, getStampSheet,
  getAllRecordingMetas, saveRecording, deleteRecording, getRecording,
} from '../data/storage';
import {
  startRecording, stopRecording, isRecordingSupported,
  getRecordingState, playRecordingBlob, stopPlayback,
} from '../audio/recorder';
import { initAudio } from '../audio/sfx';
import { navigate, getAppContainer } from '../utils/router';
import { generateMathQuiz, escapeHtml, generateId } from '../utils/helpers';
import type { RecordingMeta } from '../data/models';

let isAuthenticated = false;
let recordingTimer: ReturnType<typeof setInterval> | null = null;

export function showSettings(): void {
  const container = getAppContainer();
  initAudio();

  if (!isAuthenticated) {
    showChildLock(container);
    return;
  }

  renderSettingsScreen(container);
}

function showChildLock(container: HTMLElement): void {
  const quiz = generateMathQuiz();

  container.innerHTML = `
    ${renderHeader({ showBack: true, showCooldown: false, title: 'ほごしゃ せってい' })}
    <div class="screen screen-enter" id="lock-screen">
      <div class="pin-modal">
        <div class="pin-modal__icon">🔒</div>
        <h2 class="pin-modal__title">おとなのかた へ</h2>
        <p class="pin-modal__desc">もんだいに こたえてください</p>
        <div class="pin-modal__quiz">${quiz.question}</div>
        <input type="number" class="pin-modal__input" id="lock-answer" 
               inputmode="numeric" placeholder="こたえ" autocomplete="off">
        <div class="pin-modal__error" id="lock-error" style="display: none;">
          ちがいます。もういちど。
        </div>
        <button class="pin-modal__btn" id="lock-submit">かくにん</button>
      </div>
    </div>

    <style>
      #lock-screen {
        padding: calc(56px + env(safe-area-inset-top, 0px) + 16px) 16px 24px;
        min-height: 100vh;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pin-modal {
        background: #fff;
        border-radius: 28px;
        padding: 40px 32px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        width: 100%;
        max-width: 340px;
      }

      .pin-modal__icon { font-size: 3rem; margin-bottom: 12px; }
      .pin-modal__title { font-size: 1.3rem; font-weight: 900; margin: 0 0 8px; color: #374151; }
      .pin-modal__desc { font-size: 0.9rem; color: #9ca3af; margin: 0 0 20px; }

      .pin-modal__quiz {
        font-size: 2rem;
        font-weight: 900;
        color: hsl(263, 70%, 55%);
        margin-bottom: 20px;
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }

      .pin-modal__input {
        width: 100%;
        max-width: 160px;
        height: 56px;
        border: 3px solid #e5e7eb;
        border-radius: 16px;
        font-size: 2rem;
        font-weight: 900;
        text-align: center;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
      }

      .pin-modal__input:focus { border-color: hsl(263, 70%, 55%); }

      .pin-modal__error {
        color: #ef4444;
        font-size: 0.85rem;
        font-weight: 700;
        margin-top: 8px;
      }

      .pin-modal__btn {
        display: block;
        width: 100%;
        max-width: 200px;
        margin: 20px auto 0;
        height: 48px;
        border: none;
        border-radius: 24px;
        background: linear-gradient(135deg, hsl(263, 70%, 55%), hsl(263, 70%, 65%));
        color: #fff;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .pin-modal__btn:active { transform: scale(0.97); }
    </style>
  `;

  initHeader(container);

  const submitBtn = container.querySelector<HTMLButtonElement>('#lock-submit');
  const answerInput = container.querySelector<HTMLInputElement>('#lock-answer');
  const errorEl = container.querySelector<HTMLElement>('#lock-error');

  const checkAnswer = () => {
    const val = parseInt(answerInput?.value || '', 10);
    if (val === quiz.answer) {
      isAuthenticated = true;
      renderSettingsScreen(container);
    } else {
      if (errorEl) errorEl.style.display = 'block';
      if (answerInput) {
        answerInput.value = '';
        answerInput.style.borderColor = '#ef4444';
        setTimeout(() => {
          if (answerInput) answerInput.style.borderColor = '#e5e7eb';
        }, 1000);
      }
    }
  };

  submitBtn?.addEventListener('click', checkAnswer);
  answerInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
  });
}

async function renderSettingsScreen(container: HTMLElement): Promise<void> {
  const settings = getSettings();
  const stats = getWeeklyStats();
  const sheet = getStampSheet();
  const recordingMetas = await getAllRecordingMetas();

  container.innerHTML = `
    ${renderHeader({ showBack: true, showCooldown: false, title: '⚙️ ほごしゃ せってい' })}
    <div class="screen screen-enter settings-screen" id="settings-screen">

      <!-- Weekly Stats -->
      <section class="settings-section">
        <h3 class="settings-section__title">📊 こんしゅうの きろく</h3>
        <div class="log-summary">
          <div class="stat-card">
            <div class="stat-card__value">${stats.attempts}</div>
            <div class="stat-card__label">チャレンジ</div>
          </div>
          <div class="stat-card stat-card--success">
            <div class="stat-card__value">${stats.completions}</div>
            <div class="stat-card__label">せいこう</div>
          </div>
          <div class="stat-card stat-card--accent">
            <div class="stat-card__value">${stats.stamps}</div>
            <div class="stat-card__label">スタンプ</div>
          </div>
          <div class="stat-card stat-card--info">
            <div class="stat-card__value">${sheet.completedSheets}</div>
            <div class="stat-card__label">シートクリア</div>
          </div>
        </div>
      </section>

      <!-- Stamp Goal -->
      <section class="settings-section">
        <h3 class="settings-section__title">⭐ スタンプシートのマスかず</h3>
        <div class="radio-group" id="stamp-goal-group">
          ${([5, 10, 20] as const).map(n => `
            <label class="radio-option ${settings.stampGoal === n ? 'radio-option--active' : ''}">
              <input type="radio" name="stampGoal" value="${n}" 
                     ${settings.stampGoal === n ? 'checked' : ''}>
              <span class="radio-option__label">${n}マス</span>
              <span class="radio-option__hint">${n === 5 ? 'かんたん' : n === 10 ? 'ふつう' : 'チャレンジ'}</span>
            </label>
          `).join('')}
        </div>
      </section>

      <!-- Rewards -->
      <section class="settings-section">
        <h3 class="settings-section__title">🎁 ごほうびテキスト</h3>
        <div class="reward-editor">
          <div class="reward-list" id="reward-list">
            ${settings.rewards.map((r, i) => `
              <div class="reward-item" data-index="${i}">
                <span class="reward-item__text">${escapeHtml(r)}</span>
                <button class="reward-item__delete" data-index="${i}">×</button>
              </div>
            `).join('')}
          </div>
          <div class="reward-add">
            <input type="text" class="reward-input" id="reward-input" 
                   placeholder="あたらしいごほうび..." maxlength="50">
            <button class="reward-add-btn" id="reward-add-btn">＋</button>
          </div>
        </div>
      </section>

      <!-- Voice Recording -->
      <section class="settings-section">
        <h3 class="settings-section__title">🎙️ おうえんボイス</h3>
        <p class="settings-hint">のこり1ぷんで じどうさいせいされます（さいだい10びょう×3つ）</p>
        <div class="recording-slots" id="recording-slots">
          ${renderRecordingSlots(recordingMetas)}
        </div>
      </section>

    </div>

    <style>
      .settings-screen {
        padding: calc(56px + env(safe-area-inset-top, 0px) + 16px) 16px 32px;
        min-height: 100vh;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .settings-section {
        background: #fff;
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      }

      .settings-section__title {
        font-size: 1rem;
        font-weight: 700;
        color: #374151;
        margin: 0 0 14px;
      }

      .settings-hint {
        font-size: 0.75rem;
        color: #9ca3af;
        margin: -8px 0 12px;
      }

      /* Stats */
      .log-summary {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .stat-card {
        background: linear-gradient(135deg, hsl(263, 40%, 96%) 0%, hsl(263, 40%, 92%) 100%);
        border-radius: 16px;
        padding: 16px 12px;
        text-align: center;
      }

      .stat-card--success { background: linear-gradient(135deg, hsl(145, 40%, 95%) 0%, hsl(145, 40%, 90%) 100%); }
      .stat-card--accent { background: linear-gradient(135deg, hsl(45, 60%, 95%) 0%, hsl(45, 60%, 90%) 100%); }
      .stat-card--info { background: linear-gradient(135deg, hsl(200, 40%, 95%) 0%, hsl(200, 40%, 90%) 100%); }

      .stat-card__value {
        font-size: 2rem;
        font-weight: 900;
        color: #374151;
      }

      .stat-card__label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #9ca3af;
        margin-top: 4px;
      }

      /* Radio Group */
      .radio-group {
        display: flex;
        gap: 10px;
      }

      .radio-option {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 14px 8px;
        border-radius: 16px;
        border: 2px solid #e5e7eb;
        background: #fafafa;
        cursor: pointer;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .radio-option input { display: none; }

      .radio-option--active {
        border-color: hsl(263, 70%, 55%);
        background: hsl(263, 70%, 97%);
      }

      .radio-option__label {
        font-size: 1.1rem;
        font-weight: 900;
        color: #374151;
      }

      .radio-option__hint {
        font-size: 0.65rem;
        color: #9ca3af;
        margin-top: 2px;
      }

      /* Rewards */
      .reward-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .reward-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        background: #f9fafb;
        border-radius: 12px;
      }

      .reward-item__text {
        font-size: 0.9rem;
        font-weight: 700;
        color: #374151;
        flex: 1;
      }

      .reward-item__delete {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 50%;
        background: #fee2e2;
        color: #ef4444;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
      }

      .reward-add {
        display: flex;
        gap: 8px;
      }

      .reward-input {
        flex: 1;
        height: 44px;
        border: 2px solid #e5e7eb;
        border-radius: 14px;
        padding: 0 14px;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 0.9rem;
        outline: none;
        box-sizing: border-box;
      }

      .reward-input:focus { border-color: hsl(263, 70%, 55%); }

      .reward-add-btn {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 14px;
        background: hsl(263, 70%, 55%);
        color: #fff;
        font-size: 1.3rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
      }

      /* Recording */
      .recording-slots {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .recording-slot {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 16px;
      }

      .recording-slot__num {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: hsl(263, 40%, 92%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 900;
        color: hsl(263, 70%, 55%);
        flex-shrink: 0;
      }

      .recording-slot__info {
        flex: 1;
        min-width: 0;
      }

      .recording-slot__label {
        font-size: 0.85rem;
        font-weight: 700;
        color: #374151;
      }

      .recording-slot__duration {
        font-size: 0.7rem;
        color: #9ca3af;
      }

      .recording-slot__actions {
        display: flex;
        gap: 6px;
      }

      .rec-action-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1rem;
        -webkit-tap-highlight-color: transparent;
        transition: all 0.2s;
      }

      .rec-btn-record {
        background: #fee2e2;
        color: #ef4444;
      }

      .rec-btn-record.is-recording {
        background: #ef4444;
        color: #fff;
        animation: recPulse 1s ease-in-out infinite;
      }

      @keyframes recPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
        50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      }

      .rec-btn-play { background: #dbeafe; color: #3b82f6; }
      .rec-btn-delete { background: #fee2e2; color: #ef4444; }
      .rec-action-btn:active { transform: scale(0.9); }
    </style>
  `;

  initHeader(container);
  setupSettingsEvents(container);
}

function renderRecordingSlots(metas: RecordingMeta[]): string {
  const slots = [];
  for (let i = 0; i < 3; i++) {
    const meta = metas.find(m => m.id === `recording-${i + 1}`);
    const slotId = `recording-${i + 1}`;
    if (meta) {
      slots.push(`
        <div class="recording-slot" data-slot="${slotId}">
          <div class="recording-slot__num">${i + 1}</div>
          <div class="recording-slot__info">
            <div class="recording-slot__label">${escapeHtml(meta.label || `ろくおん ${i + 1}`)}</div>
            <div class="recording-slot__duration">${meta.duration.toFixed(1)}びょう</div>
          </div>
          <div class="recording-slot__actions">
            <button class="rec-action-btn rec-btn-play" data-play="${slotId}">▶</button>
            <button class="rec-action-btn rec-btn-record" data-record="${slotId}">⏺</button>
            <button class="rec-action-btn rec-btn-delete" data-delete="${slotId}">🗑</button>
          </div>
        </div>
      `);
    } else {
      slots.push(`
        <div class="recording-slot" data-slot="${slotId}">
          <div class="recording-slot__num">${i + 1}</div>
          <div class="recording-slot__info">
            <div class="recording-slot__label" style="color: #9ca3af;">みろくおん</div>
          </div>
          <div class="recording-slot__actions">
            <button class="rec-action-btn rec-btn-record" data-record="${slotId}">⏺</button>
          </div>
        </div>
      `);
    }
  }
  return slots.join('');
}

function setupSettingsEvents(container: HTMLElement): void {
  // Stamp goal radio
  const radioGroup = container.querySelector('#stamp-goal-group');
  if (radioGroup) {
    radioGroup.querySelectorAll<HTMLInputElement>('input[name="stampGoal"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const settings = getSettings();
        settings.stampGoal = parseInt(radio.value, 10) as 5 | 10 | 20;
        saveSettings(settings);
        // Update visual
        radioGroup.querySelectorAll('.radio-option').forEach(opt =>
          opt.classList.remove('radio-option--active')
        );
        radio.closest('.radio-option')?.classList.add('radio-option--active');
      });
    });
  }

  // Reward add
  const rewardInput = container.querySelector<HTMLInputElement>('#reward-input');
  const rewardAddBtn = container.querySelector<HTMLButtonElement>('#reward-add-btn');
  if (rewardInput && rewardAddBtn) {
    const addReward = () => {
      const text = rewardInput.value.trim();
      if (!text) return;
      const settings = getSettings();
      settings.rewards.push(text);
      saveSettings(settings);
      rewardInput.value = '';
      renderSettingsScreen(container); // Re-render
    };
    rewardAddBtn.addEventListener('click', addReward);
    rewardInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addReward();
    });
  }

  // Reward delete
  container.querySelectorAll<HTMLButtonElement>('.reward-item__delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index || '0', 10);
      const settings = getSettings();
      settings.rewards.splice(index, 1);
      saveSettings(settings);
      renderSettingsScreen(container);
    });
  });

  // Recording buttons
  setupRecordingEvents(container);
}

function setupRecordingEvents(container: HTMLElement): void {
  // Record buttons
  container.querySelectorAll<HTMLButtonElement>('[data-record]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const slotId = btn.dataset.record!;
      const state = getRecordingState();

      if (state === 'recording') {
        // Stop recording
        btn.classList.remove('is-recording');
        try {
          const blob = await stopRecording();
          if (recordingTimer) clearInterval(recordingTimer);

          const meta: RecordingMeta = {
            id: slotId,
            label: `おうえん ${slotId.split('-')[1]}`,
            duration: blob.size > 0 ? 10 : 0, // Approximate
            createdAt: new Date().toISOString(),
          };
          await saveRecording(slotId, blob, meta);
          renderSettingsScreen(container);
        } catch {
          console.error('Recording save failed');
        }
        return;
      }

      if (!isRecordingSupported()) {
        alert('この端末では録音がサポートされていません');
        return;
      }

      try {
        await startRecording();
        btn.classList.add('is-recording');
        btn.textContent = '⏹';

        // Auto-refresh when recording stops
        const checkStop = setInterval(() => {
          if (getRecordingState() !== 'recording') {
            clearInterval(checkStop);
            btn.classList.remove('is-recording');
            btn.textContent = '⏺';
          }
        }, 500);
        recordingTimer = checkStop;
      } catch (err) {
        alert('マイクへのアクセスが許可されていません');
      }
    });
  });

  // Play buttons
  container.querySelectorAll<HTMLButtonElement>('[data-play]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const slotId = btn.dataset.play!;
      try {
        const rec = await getRecording(slotId);
        if (rec) {
          await playRecordingBlob(rec.blob);
        }
      } catch {
        console.error('Playback failed');
      }
    });
  });

  // Delete buttons
  container.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const slotId = btn.dataset.delete!;
      if (confirm('この録音を削除しますか？')) {
        await deleteRecording(slotId);
        renderSettingsScreen(container);
      }
    });
  });
}

// Reset auth when leaving settings
window.addEventListener('hashchange', () => {
  // Keep authenticated for the session
});
